# Documentation Technique de l'API - VCR Explorer

Cette documentation détaille les points d'entrée (endpoints), les formats de données et la gestion des erreurs du backend VCR Explorer.

## 📌 Informations Générales
- **Base URL** : `http://localhost:3000/api` (par défaut)
- **Documentation Interactive** : [Swagger UI](http://localhost:3000/api/docs)
- **Format de données** : JSON
- **Authentification** : Requiert un `GITHUB_TOKEN` dans les variables d'environnement du serveur pour interagir avec l'API GitHub.

---

## 🚀 Endpoints

### 1. Santé de l'API (Health Check)
Vérifie si le serveur est opérationnel.

- **URL** : `/`
- **Méthode** : `GET`
- **Réponse Succès** :
  - **Code** : `200 OK`
  - **Contenu** : `"Hello World!"`

---

### 2. Analyse de Dépôt (Scan Repo)
Analyse un dépôt GitHub public pour extraire ses dépendances.

- **URL** : `/analyzer/scan`
- **Méthode** : `POST`
- **Corps de la requête (Body)** :
  ```json
  {
    "url": "https://github.com/owner/repository"
  }
  ```
- **Réponse Succès** :
  - **Code** : `201 Created`
  - **Contenu** :
    ```json
    {
      "mermaid": "flowchart TD\n  subgraph g0 [...]\n  ...",
      "graphData": {
        "nodes": [
          { "id": "src/app.ts", "label": "app.ts", "group": "src" },
          ...
        ],
        "links": [
          { "source": "src/main.ts", "target": "src/app.ts" },
          ...
        ]
      },
      "dependencyList": [
        {
          "file": "src/main.ts",
          "imports": ["src/app.ts"]
        },
        ...
      ]
    }
    ```

- **Réponses d'Erreur** :
  - **400 Bad Request** : URL manquante ou format d'URL invalide.
  - **404 Not Found** : Dépôt GitHub introuvable ou privé.
  - **403 Forbidden** : Limite de requêtes API GitHub atteinte.
  - **500 Internal Server Error** : Erreur inattendue lors de l'analyse.

---

## 🛠️ Logique Interne

### Extraction des Dépendances
Le backend utilise des expressions régulières pour identifier les imports dans plus de 15 langages de programmation :
- **JavaScript/TypeScript** : `import`, `from`, `require`
- **Python** : `import`, `from ... import`
- **C/C++** : `#include`
- **Autres** : Support pour Go, Java, Rust, etc.

### Gestion du Cache
Pour optimiser les performances et respecter les limites de l'API GitHub, les résultats d'analyse sont mis en cache (en mémoire) via `CacheManager`. Une seconde analyse du même dépôt sera instantanée.

### Limitation de Performance
Le système analyse au maximum les **80 premiers fichiers** détectés pour garantir un rendu graphique fluide côté client.

---

## 💻 Exemple d'appel avec cURL

```bash
curl -X POST http://localhost:3000/api/analyzer/scan \
     -H "Content-Type: application/json" \
     -d '{"url": "https://github.com/nestjs/nest"}'
```
