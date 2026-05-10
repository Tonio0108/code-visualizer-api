# VCR API - Code Visualizer Backend

Le backend de VCR Explorer est une API robuste construite avec **NestJS**. Son rôle est d'extraire l'intelligence architecturale d'un dépôt GitHub pour la fournir au frontend sous des formats exploitables (Mermaid, JSON, Graphe).

## 🚀 Installation & Lancement

```bash
# Installation des dépendances
pnpm install

# Lancement en mode développement
pnpm start:dev

# Build pour la production
pnpm build
```

## ⚙️ Configuration (.env)

Créez un fichier `.env` à la racine du dossier `code-visualizer-api` :

- `GITHUB_TOKEN` : Votre token d'accès personnel GitHub (Recommandé pour éviter les limitations d'appel API).
- `PORT` : Port d'écoute du serveur (par défaut 3000).

## 🧩 Logique d'Analyse

L'analyseur (`AnalyzerService`) suit un processus rigoureux :
1.  **Récupération de l'Arborescence** : Utilise l'API Git Tree de GitHub pour obtenir tous les fichiers de manière récursive.
2.  **Filtrage Intelligent** : Exclut `node_modules`, `dist`, `.git`, etc., et ne garde que les extensions de code supportées.
3.  **Extraction de Dépendances** :
    - Utilise des Regex polyglottes pour identifier les `import`, `require`, `include`, `using`.
    - Résout les chemins relatifs pour mapper les dépendances internes.
4.  **Génération de Formats** :
    - **Mermaid** : Génère un graphe stylisé avec subgraphs par dossier.
    - **GraphData** : Données brutes de nœuds et liens pour la visualisation de force.
    - **DependencyList** : Liste à plat pour l'affichage textuel.

## 📡 Points d'Entrée (Endpoints)

### Documentation Interactive (Swagger)
Accédez à l'interface Swagger pour tester l'API directement :
👉 [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### `POST /analyzer/scan`
Analyse un dépôt GitHub public.
- **Body** : `{ "url": "https://github.com/owner/repo" }`
- **Réponse** : Un objet contenant `mermaid`, `graphData`, et `dependencyList`.

## 🛠️ Stack Technique
- **Framework** : NestJS
- **Client API** : Octokit (@octokit/rest)
- **Cache** : Cache Manager (stockage en mémoire)
- **Sécurité** : Helmet, CORS activé pour le frontend.
