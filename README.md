# Blog API - Node.js

API REST pour la gestion d'un blog avec authentification JWT et CRUD d'articles.

## 🚀 Démarrage rapide

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copiez le fichier de configuration :

```bash
cp config.env.example config.env
```

Éditez `config.env` avec vos paramètres :

```env
MONGODB_URI=mongodb://localhost:27017/blog-api
JWT_SECRET=votre_secret_jwt_tres_securise_ici
JWT_EXPIRE=24h
PORT=8000
NODE_ENV=development
BCRYPT_ROUNDS=12
```

### 3. Démarrer MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 4. Lancer l'API

```bash
npm run dev
```

L'API sera disponible sur `http://localhost:8000`

## 📚 Endpoints

### Base URL

```
http://localhost:8000/api
```

### Authentification

#### Inscription

```http
POST /auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

#### Connexion

```http
POST /auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123"
}
```

#### Récupérer le profil

```http
GET /auth/me
Authorization: Bearer <token>
```

### Articles

#### Récupérer tous les articles publics

```http
GET /articles/public
```

#### Récupérer un article spécifique

```http
GET /articles/:id
```

#### Créer un article

```http
POST /articles
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Mon article",
  "content": "Contenu de l'article avec au moins 50 caractères...",
  "status": "draft"
}
```

#### Mettre à jour un article

```http
PUT /articles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Titre mis à jour",
  "content": "Nouveau contenu...",
  "status": "published"
}
```

#### Supprimer un article

```http
DELETE /articles/:id
Authorization: Bearer <token>
```

### Health Check

```http
GET /health
```

