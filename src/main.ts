import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { checkAIConfig } from './config';


// Fonction pour tester MongoDB au démarrage
async function testMongoConnection() {
  console.log('🔍 Test de connexion MongoDB...');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI non configuré!');
    return false;
  }

  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);

    await client.connect();
    console.log('✅ MongoDB connecté avec succès');

    const db = client.db('xaali-db');
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections disponibles:', collections.map((c: any) => c.name));

    await client.close();
    return true;
  } catch (error) {
    console.error('❌ Erreur MongoDB:', error.message);
    return false;
  }
}

async function bootstrap() {
  // Vérifier la configuration au démarrage
  console.log('\n🚀 =================================');
  console.log('🚀 DÉMARRAGE DE XAALI BACKEND');
  console.log('🚀 =================================\n');

  // Tester MongoDB avant de continuer
  const mongoOk = await testMongoConnection();
  if (!mongoOk) {
    console.error('❌ Impossible de se connecter à MongoDB. Arrêt du serveur.');
    process.exit(1);
  }

  checkAIConfig();

  const app = await NestFactory.create(AppModule);

  console.log('✅ Mode MongoDB activé - Authentification persistante');
  console.log('🔗 MongoDB URI:', process.env.MONGODB_URI ? 'Configuré' : 'NON CONFIGURÉ');
  console.log('🎯 Contrôleurs actifs: RealAuthController (MongoDB)');
  console.log('❌ Contrôleurs désactivés: MemoryAuthController');

  // Configuration CORS pour permettre les requêtes depuis le frontend
  // Ajout du support pour Render deployment
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:4173',
    'http://localhost:3001', // Au cas où le frontend utilise ce port
    'https://xaali-1tneyr.live.cloudoor.com',
    'https://xaali-q6q6bc.live.cloudoor.com',
    'https://xaali-w0ilbs.live.cloudoor.com',
    /\.cloudoor\.com$/,
    // Render deployment URLs
    'https://xaali-backend.onrender.com',
    // Pour supporter les URLs personnalisées sur Render
    /\.onrender\.com$/,
    "null"  // Allow local file opening
  ];

  // Configuration CORS simplifiée pour le développement
  console.log('🔧 Configuration CORS - Mode:', process.env.NODE_ENV);

  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 CORS: Mode développement - Toutes origines autorisées');
    app.enableCors({
      origin: true, // Permet toutes les origines en développement
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
  } else {
    console.log('🔒 CORS: Mode production - Origines restreintes:', allowedOrigins);
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
  }

  // Middleware pour logger toutes les requêtes
  app.use((req: any, res: any, next: any) => {
    const timestamp = new Date().toISOString();
    console.log(`\n📥 ${timestamp} - ${req.method} ${req.url}`);

    // Logger spécialement les requêtes d'authentification
    if (req.url.includes('/real-auth/')) {
      console.log('🔐 [AUTH] Requête d\'authentification détectée');
      console.log('🔐 [AUTH] Method:', req.method);
      console.log('🔐 [AUTH] URL:', req.url);
      console.log('🔐 [AUTH] Content-Type:', req.headers['content-type']);
      console.log('🔐 [AUTH] Origin:', req.headers.origin || 'Aucune origine');

      if (req.method === 'POST' && req.body) {
        console.log('🔐 [AUTH] Body reçu:', JSON.stringify(req.body, null, 2));
      }
    }

    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Serveur Xaali démarré sur http://localhost:${port}`);
  console.log('📚 Documentation: http://localhost:3000/api');
  console.log('🌲 Pinecone endpoints: http://localhost:3000/pinecone');
  console.log('⚖️ Legal Assistant: http://localhost:3000/legal-assistant');
  console.log('🔍 Health Check: http://localhost:3000/health');
  console.log('🤖 Fine-Tuning: http://localhost:3000/fine-tuning/ask');
  console.log('🔐 Authentification MongoDB: http://localhost:3000/real-auth/');
  console.log('📊 Environnement:', process.env.NODE_ENV || 'development');
  console.log('🔗 CORS activé pour toutes les origines en mode développement');
  console.log('\n🎯 ENDPOINTS D\'AUTHENTIFICATION DISPONIBLES:');
  console.log('   POST /real-auth/register - Inscription avocat');
  console.log('   POST /real-auth/login - Connexion avocat');
  console.log('   POST /real-auth/notary-register - Inscription notaire');
  console.log('   POST /real-auth/notary-login - Connexion notaire');
  console.log('   POST /real-auth/bailiff-register - Inscription huissier');
  console.log('   POST /real-auth/bailiff-login - Connexion huissier');
  console.log('\n💾 BASE DE DONNÉES:');
  console.log('   Type: MongoDB Atlas');
  console.log('   Status: Connecté');
  console.log('   Collections: lawyer, case, citizen');
}
bootstrap();