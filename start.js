const mongoose = require('mongoose');
const app = require('./server');
require('dotenv').config({ path: './config.env' });

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connexion à MongoDB établie');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📖 API disponible sur http://localhost:${PORT}/api`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à MongoDB:', err.message);
    process.exit(1);
  });

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt gracieux du serveur...');
  mongoose.connection.close(() => {
    console.log('✅ Connexion MongoDB fermée');
    process.exit(0);
  });
});
