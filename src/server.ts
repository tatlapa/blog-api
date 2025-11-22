import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger.json';

// Import des routes
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';

// Import du middleware d'authentification
import { authenticateToken } from './middleware/auth';

dotenv.config({ path: './config.env' });

const app: Application = express();

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

// Configuration Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes publiques
app.use('/api/auth', authRoutes);

// Routes d'articles - publiques et privées
app.use('/api/articles', articleRoutes);

// Route de test
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'API Blog fonctionnelle',
    timestamp: new Date().toISOString(),
  });
});

// Gestion des erreurs 404
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

// Middleware de gestion d'erreurs global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: Object.values((err as any).errors).map((e: any) => e.message),
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

export default app;
