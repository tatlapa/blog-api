const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config({ path: './config.env' });

// Import des routes
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');

// Import du middleware d'authentification
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Configuration de la sécurité
app.use(helmet());

// Configuration CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://votre-domaine.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes publiques
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/articles', authenticateToken, articleRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API Blog fonctionnelle',
    timestamp: new Date().toISOString(),
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: Object.values(err.errors).map(e => e.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID invalide',
    });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne du serveur',
  });
});

module.exports = app;
