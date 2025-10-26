// Script de démarrage avec MongoDB forcé
require('dotenv').config();

console.log('🚀 DÉMARRAGE XAALI AVEC MONGODB FORCÉ');
console.log('=====================================\n');

// Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement:');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Configuré' : '❌ Manquant');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('   PORT:', process.env.PORT || '3000');

// Forcer l'environnement de développement pour les logs
process.env.NODE_ENV = 'development';

console.log('\n🔧 Configuration forcée:');
console.log('   Mode: development (pour logs détaillés)');
console.log('   Base de données: MongoDB Atlas');
console.log('   Authentification: RealAuthController uniquement');

console.log('\n🚀 Démarrage du serveur NestJS...\n');

// Démarrer l'application NestJS
require('./dist/main.js');