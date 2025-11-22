import mongoose from 'mongoose';
import app from './server';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const PORT: string | number = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-api', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as mongoose.ConnectOptions)
  .then(() => {
    console.log('✅ Connexion à MongoDB établie');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📖 API disponible sur http://localhost:${PORT}/api`);
      console.log(`📚 Documentation Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err: Error) => {
    console.error('❌ Erreur de connexion à MongoDB:', err.message);
    process.exit(1);
  });

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt gracieux du serveur...');
  mongoose.connection.close().then(() => {
    console.log('✅ Connexion MongoDB fermée');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Arrêt gracieux du serveur...');
  mongoose.connection.close().then(() => {
    console.log('✅ Connexion MongoDB fermée');
    process.exit(0);
  });
});
