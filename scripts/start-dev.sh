#!/bin/bash

echo "🚀 Démarrage de l'environnement de développement Blog API"

# Vérifier si MongoDB est installé
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB n'est pas installé. Veuillez l'installer d'abord."
    echo "📖 Guide d'installation: https://docs.mongodb.com/manual/installation/"
    exit 1
fi

# Vérifier si le fichier de configuration existe
if [ ! -f "config.env" ]; then
    echo "⚠️  Le fichier config.env n'existe pas."
    echo "📝 Copie du fichier d'exemple..."
    cp config.env.example config.env
    echo "✅ Fichier config.env créé. Veuillez le configurer selon vos besoins."
fi

# Démarrer MongoDB (si pas déjà démarré)
echo "🗄️  Vérification de MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "🔄 Démarrage de MongoDB..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start mongodb-community 2>/dev/null || echo "⚠️  Impossible de démarrer MongoDB automatiquement. Veuillez le démarrer manuellement."
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start mongod 2>/dev/null || echo "⚠️  Impossible de démarrer MongoDB automatiquement. Veuillez le démarrer manuellement."
    else
        echo "⚠️  Système non reconnu. Veuillez démarrer MongoDB manuellement."
    fi
else
    echo "✅ MongoDB est déjà en cours d'exécution."
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Démarrer l'application
echo "🎯 Démarrage de l'API..."
echo "📖 L'API sera disponible sur: http://localhost:3000"
echo "🔍 Health check: http://localhost:3000/api/health"
echo "📚 Documentation: http://localhost:3000/api"
echo ""
echo "🛑 Pour arrêter le serveur, appuyez sur Ctrl+C"
echo ""

npm run dev 