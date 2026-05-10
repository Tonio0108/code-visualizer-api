import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyzerService } from './analyzer.service';
import { ScanRepoDto } from './dto/scan-repo.dto';

@ApiTags('analyzer')
@Controller('analyzer')
export class AnalyzerController {
    constructor(private readonly analyzerService: AnalyzerService){}

    @Post('scan')
    @ApiOperation({ summary: 'Analyser un dépôt GitHub', description: 'Extrait les dépendances et génère un graphe Mermaid.' })
    @ApiResponse({ status: 201, description: 'Analyse réussie.' })
    @ApiResponse({ status: 400, description: 'URL invalide ou manquante.' })
    @ApiResponse({ status: 404, description: 'Dépôt introuvable.' })
    async scanRepo(@Body() scanRepoDto: ScanRepoDto) {
        const { url } = scanRepoDto;
        
        try{
            const parts = url.replace('https://github.com/', '').split('/');
            const owner = parts[0];
            const repo = parts[1];

            return await this.analyzerService.analyzeRepo(owner, repo);
        } catch(err: any) {
            // If it's already a NestJS exception, rethrow it to preserve status code and message
            if (err.getResponse) {
                throw err;
            }
            throw err;
        }
    }
}
