# Blog API - Node.js + TypeScript

API REST pour la gestion d'un blog avec authentification JWT et CRUD d'articles, développée en TypeScript.

## Prérequis

- **Node.js** >= 18
- **npm**
- **MongoDB** (local ou cloud)

## Installation & Lancement en local

1. Installez les dépendances :
   ```bash
   npm install
   ```
2. Copiez le fichier d'environnement exemple et adaptez-le si besoin :
   ```bash
   cp config.env.example config.env
   ```
3. Lancez MongoDB sur votre machine (ou utilisez un cluster distant).
4. Démarrez le serveur :
   ```bash
   npm run dev
   ```

Le serveur écoute par défaut sur http://localhost:8000

---

## Endpoints disponibles

- **POST /api/auth/register** : Inscription
- **POST /api/auth/login** : Connexion
- **POST /api/auth/logout** : Déconnexion
- **GET /api/articles** : Liste tous les articles
- **POST /api/articles** : Créer un article (authentifié)
- **PUT /api/articles/:id** : Modifier un article (authentifié)
- **DELETE /api/articles/:id** : Supprimer un article (authentifié)
