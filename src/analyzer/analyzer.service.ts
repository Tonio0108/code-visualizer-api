import { Injectable, InternalServerErrorException, NotFoundException, Inject, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import type { Octokit } from '@octokit/rest';

// This is never called but forces Vercel's bundler (NFT) to include the package.
// If it were executed, it would fail with ERR_REQUIRE_ESM in CommonJS.
// We use dynamic import via eval in onModuleInit to safely load it at runtime.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _forceBundleVercel = () => import('@octokit/rest');

@Injectable()
export class AnalyzerService implements OnModuleInit {
    private octokit: any;
    
    constructor(@Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache) {}

    async onModuleInit() {
        const { Octokit } = await (eval(`import('@octokit/rest')`) as any);
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });
    }
    
    private readonly SUPPORTED_EXTENSIONS = /\.(js|jsx|ts|tsx|py|java|go|cpp|c|rb|php|cs|swift|kt|rs|dart|scala|lua|sh|sql)$/i;
    
    async analyzeRepo(owner: string, repo: string) {
        const cacheKey = `repo_${owner}_${repo}`;
        const cachedResult = await this.cacheManager.get(cacheKey);
        
        if (cachedResult) {
            return cachedResult;
        }

        try {
            const { data: repoData } = await this.octokit.rest.repos.get({ owner, repo });
            const defaultBranch = repoData.default_branch;

            const { data } = await this.octokit.rest.git.getTree({
                owner,
                repo,
                tree_sha: defaultBranch,
                recursive: 'true', 
            });

            const allFiles = data.tree.filter(file => {
                return (
                    this.SUPPORTED_EXTENSIONS.test(file.path) &&
                    file.type === 'blob' && 
                    !file.path.includes('node_modules') &&
                    !file.path.includes('.git') &&
                    !file.path.includes('.next') &&
                    !file.path.includes('dist')
                );
            });

            const filesToAnalyze = allFiles.slice(0, 80);
            if(filesToAnalyze.length === 0) throw new NotFoundException("Aucun fichier trouvé");

            const nodes = filesToAnalyze.map(f => ({
                id: f.path,
                label: f.path.split('/').pop(),
                group: f.path.includes('/') ? f.path.split('/')[0] : 'ROOT'
            }));

            const links: { source: string; target: string }[] = [];
            const filesPaths = allFiles.map(f => f.path);
            
            for(const file of filesToAnalyze) {
                const content = await this.getFileContent(owner, repo, file.sha);
                const importedTerms = this.extractImportTerms(content);
                const currentDir = file.path.split('/').slice(0, -1).join('/');
                
                for(const term of importedTerms) {
                    let targetPath = "";
                    if (term.startsWith('.')) {
                        const resolved = this.resolveRelativePath(currentDir, term);
                        targetPath = filesPaths.find(p => p.startsWith(resolved)) || "";
                    } 
                    if (!targetPath) {
                        const termBasename = term.split('/').pop();
                        targetPath = filesPaths.find(p => {
                            const pBasename = p.split('/').pop()?.replace(/\.[^/.]+$/, "");
                            return pBasename === termBasename || p.includes(term);
                        }) || "";
                    }
                    if(targetPath && targetPath !== file.path) {
                        const exists = links.some(l => l.source === file.path && l.target === targetPath);
                        if (!exists) {
                            links.push({ source: file.path, target: targetPath });
                        }
                    }
                }
            }
            
            const result = this.buildOutput(nodes, links);
            await this.cacheManager.set(cacheKey, result);
            return result;
        } catch(err: any) {
            console.error(err);
            if (err.status === 404) {
                throw new NotFoundException("Dépôt GitHub introuvable ou privé. Vérifiez l'URL.");
            }
            if (err.status === 403) {
                throw new InternalServerErrorException("Limite de requêtes API GitHub atteinte. Réessayez plus tard.");
            }
            throw new InternalServerErrorException("Erreur lors de l'analyse : " + (err.message || "Erreur inconnue"));
        }
    }

    private extractImportTerms(content: string): string[] {
        const terms = new Set<string>();
        const jsRegex = /(?:import|from|require|using)\s+['"]([^'"]+)['"]/g;
        const pyRegex = /^(?:import|from)\s+([a-zA-Z0-9._-]+)/mg;
        const cRegex = /#include\s+["<]([^">]+)[">]/g;
        let match;
        while ((match = jsRegex.exec(content)) !== null) terms.add(match[1]);
        while ((match = pyRegex.exec(content)) !== null) terms.add(match[1].replace(/\./g, '/'));
        while ((match = cRegex.exec(content)) !== null) terms.add(match[1]);
        return Array.from(terms);
    }

    private resolveRelativePath(currentDir: string, relativePath: string): string {
        const combined = currentDir ? `${currentDir}/${relativePath}` : relativePath;
        const parts = combined.split('/');
        const stack: string[] = [];
        for (const part of parts) {
            if (part === '.' || part === '') continue;
            if (part === '..') stack.pop();
            else stack.push(part);
        }
        return stack.join('/');
    }

    private async getFileContent(owner: string, repo: string, fileSha: string){
        const { data }: any = await this.octokit.rest.git.getBlob({
            owner,
            repo,
            file_sha: fileSha
        });
        return Buffer.from(data.content, 'base64').toString();
    }

    private buildOutput(nodes: any[], links: any[]) {
        let mermaid = "flowchart TD\n";
        
        // Styles Muted
        mermaid += "  classDef entry fill:#fef2f2,stroke:#ef4444,stroke-width:1px,color:#991b1b,font-weight:bold\n";
        mermaid += "  classDef module fill:#f5f3ff,stroke:#a855f7,stroke-width:1px,color:#6b21a8,font-weight:bold\n";
        mermaid += "  classDef controller fill:#eff6ff,stroke:#3b82f6,stroke-width:1px,color:#1e40af\n";
        mermaid += "  classDef service fill:#f0fdf4,stroke:#22c55e,stroke-width:1px,color:#166534\n";
        mermaid += "  classDef data fill:#f8fafc,stroke:#64748b,stroke-width:1px,color:#334155\n";

        const visualNodes = nodes.filter(n => !n.id.includes('.spec.') && !n.id.includes('.test.'));
        const visualLinks = links.filter(l => 
            visualNodes.some(n => n.id === l.source) && 
            visualNodes.some(n => n.id === l.target)
        );

        const groups: Record<string, string[]> = {};
        visualNodes.forEach(node => {
            const parts = node.id.split('/');
            const groupName = parts.length > 1 ? parts.slice(0, -1).join('/') : 'ROOT';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(node.id);
        });

        const groupNames = Object.keys(groups).sort();
        
        groupNames.forEach((name, gIdx) => {
            mermaid += `  subgraph g${gIdx} [" ${name.toUpperCase()} "]\n`;
            mermaid += "    direction TB\n";
            const files = [...groups[name]].sort();
            
            // Grid 3 columns inside subgraph
            for (let i = 0; i < files.length; i += 3) {
                const row = files.slice(i, i + 3);
                row.forEach((file, rIdx) => {
                    const safeId = file.replace(/[^a-zA-Z0-9]/g, '_');
                    const label = file.split('/').pop();
                    
                    if (file.includes('main.') || file.includes('app.module.')) {
                        mermaid += `    ${safeId}{"${label}"}:::entry\n`;
                    } else if (file.includes('module.')) {
                        mermaid += `    ${safeId}(["${label}"]):::module\n`;
                    } else if (file.includes('controller.')) {
                        mermaid += `    ${safeId}["${label}"]:::controller\n`;
                    } else if (file.includes('service.')) {
                        mermaid += `    ${safeId}["${label}"]:::service\n`;
                    } else if (file.includes('prisma') || file.includes('entity') || file.includes('dto')) {
                        mermaid += `    ${safeId}[("${label}")]:::data\n`;
                    } else {
                        mermaid += `    ${safeId}("${label}")\n`;
                    }
                    
                    // Horizontal invisible links to maintain row structure
                    if (rIdx < row.length - 1) {
                        const nextId = row[rIdx+1].replace(/[^a-zA-Z0-9]/g, '_');
                        mermaid += `    ${safeId} ~~~ ${nextId}\n`;
                    }
                });
                
                // Vertical invisible links between rows
                if (i + 3 < files.length) {
                    const currentId = row[0].replace(/[^a-zA-Z0-9]/g, '_');
                    const nextRowId = files[i + 3].replace(/[^a-zA-Z0-9]/g, '_');
                    mermaid += `    ${currentId} ~~~ ${nextRowId}\n`;
                }
            }
            mermaid += `  end\n\n`;
        });

        // Grid of subgraphs (2 columns)
        for (let i = 0; i < groupNames.length; i += 2) {
            if (i + 1 < groupNames.length) {
                mermaid += `  g${i} ~~~ g${i+1}\n`;
            }
            if (i + 2 < groupNames.length) {
                mermaid += `  g${i} ~~~ g${i+2}\n`;
            }
        }

        visualLinks.forEach(link => {
            const sourceId = link.source.replace(/[^a-zA-Z0-9]/g, '_');
            const targetId = link.target.replace(/[^a-zA-Z0-9]/g, '_');
            mermaid += `  ${sourceId} --> ${targetId}\n`;
        });

        mermaid += "\n  linkStyle default stroke:#94a3b8,stroke-width:1px,opacity:0.8\n";

        const dependencyList = visualNodes.map(node => ({
            file: node.id,
            imports: visualLinks
                .filter(l => l.source === node.id)
                .map(l => l.target)
        })).filter(item => item.imports.length > 0);

        return { mermaid, graphData: { nodes, links }, dependencyList };
    }
}
