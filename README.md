# Blog API - Node.js

Une API REST complète pour la gestion d'un blog avec authentification JWT et CRUD d'articles.

## 🚀 Fonctionnalités

- **Authentification sécurisée** avec JWT
- **Gestion complète des articles** (CRUD)
- **Système de likes et commentaires**
- **Pagination et filtres avancés**
- **Validation des données** avec express-validator
- **Sécurité renforcée** (helmet, rate limiting, CORS)
- **Base de données MongoDB** avec Mongoose
- **API RESTful** bien structurée

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- MongoDB (local ou Atlas)
- npm ou yarn

## 🛠️ Installation

1. **Cloner le projet**

```bash
git clone <votre-repo>
cd blog-api
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**

```bash
cp config.env.example config.env
```

Éditez le fichier `config.env` avec vos configurations :

```env
MONGODB_URI=mongodb://localhost:27017/blog-api
JWT_SECRET=votre_secret_jwt_tres_securise_ici
JWT_EXPIRE=24h
PORT=3000
NODE_ENV=development
BCRYPT_ROUNDS=12
```

4. **Démarrer MongoDB** (si local)

```bash
# Sur macOS avec Homebrew
brew services start mongodb-community

# Sur Ubuntu/Debian
sudo systemctl start mongod
```

5. **Lancer l'application**

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

L'API sera disponible sur `http://localhost:3000`

## 📚 Documentation de l'API

### Base URL

```
http://localhost:8000/api
```

### Authentification

Toutes les requêtes authentifiées nécessitent le header :

```
Authorization: Bearer <votre_token_jwt>
```

#### Inscription

```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "bio": "Développeur passionné",
  "avatar": "https://example.com/avatar.jpg"
}
```

#### Connexion

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Récupérer le profil

```http
GET /auth/me
Authorization: Bearer <token>
```

#### Mettre à jour le profil

```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "new_username",
  "bio": "Nouvelle bio",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

#### Changer le mot de passe

```http
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123",
  "confirmNewPassword": "NewPassword123"
}
```

### Articles

#### Créer un article

```http
POST /articles
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Mon premier article",
  "content": "Contenu de l'article avec au moins 50 caractères...",
  "excerpt": "Résumé de l'article",
  "category": "technologie",
  "status": "draft",
  "tags": ["nodejs", "api", "blog"],
  "featuredImage": "https://example.com/image.jpg",
  "seo": {
    "metaTitle": "Titre SEO",
    "metaDescription": "Description SEO",
    "keywords": ["mot-clé1", "mot-clé2"]
  }
}
```

#### Récupérer tous les articles (utilisateur connecté)

```http
GET /articles?page=1&limit=10&category=technologie&status=published&search=nodejs
Authorization: Bearer <token>
```

#### Récupérer les articles publics

```http
GET /articles/public?page=1&limit=10&category=technologie&search=nodejs
```

#### Récupérer un article spécifique

```http
GET /articles/:id
Authorization: Bearer <token>
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

#### Liker/unliker un article

```http
POST /articles/:id/like
Authorization: Bearer <token>
```

#### Ajouter un commentaire

```http
POST /articles/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Excellent article !"
}
```

### Paramètres de requête

#### Pagination

- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10, max: 50)

#### Filtres

- `category` : Filtrer par catégorie
- `status` : Filtrer par statut (draft, published, archived)
- `search` : Recherche textuelle

#### Tri

- `sortBy` : Champ de tri (createdAt, title, views, etc.)
- `sortOrder` : Ordre de tri (asc, desc)

## 🗄️ Structure de la base de données

### Collection Users

```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashé),
  role: String (user/admin),
  avatar: String,
  bio: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Collection Articles

```javascript
{
  _id: ObjectId,
  title: String,
  slug: String (unique),
  content: String,
  excerpt: String,
  author: ObjectId (ref: User),
  tags: [String],
  category: String,
  status: String (draft/published/archived),
  featuredImage: String,
  readTime: Number,
  views: Number,
  likes: [ObjectId (ref: User)],
  comments: [{
    user: ObjectId (ref: User),
    content: String,
    createdAt: Date
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Sécurité

- **JWT** pour l'authentification
- **bcrypt** pour le hashage des mots de passe
- **Helmet** pour les en-têtes de sécurité
- **Rate limiting** pour prévenir les abus
- **CORS** configuré
- **Validation** des données d'entrée
- **Sanitisation** des données

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Lancer les tests en mode watch
npm run test:watch
```

## 📦 Scripts disponibles

```bash
npm start          # Démarrer en mode production
npm run dev        # Démarrer en mode développement
npm test           # Lancer les tests
npm run lint       # Vérifier le code (si ESLint configuré)
```

## 🌐 Déploiement

### Variables d'environnement de production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/blog-api
JWT_SECRET=secret_tres_securise_en_production
JWT_EXPIRE=24h
PORT=3000
```

### Plateformes recommandées

- **Heroku**
- **Vercel**
- **Railway**
- **DigitalOcean App Platform**

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

**Votre Nom**

- GitHub: [@votre-username](https://github.com/votre-username)
- LinkedIn: [Votre Profil](https://linkedin.com/in/votre-profil)

## 🙏 Remerciements

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js/)

---

⭐ N'oubliez pas de mettre une étoile si ce projet vous a aidé !
