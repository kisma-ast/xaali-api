import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { checkAIConfig } from './config';

async function bootstrap() {
  // Vérifier la configuration au démarrage
  console.log('Démarrage de Xaali Backend...');
  checkAIConfig();
  
  const app = await NestFactory.create(AppModule);
  
  // Configuration CORS pour permettre les requêtes depuis le frontend
  // Ajout du support pour Render deployment
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3001', // Au cas où le frontend utilise ce port
    'https://xaali-1tneyr.live.cloudoor.com',
    'https://xaali-q6q6bc.live.cloudoor.com',
    'https://xaali-w0ilbs.live.cloudoor.com',
    /\.cloudoor\.com$/,
    // Render deployment URLs
    'https://xaali-frontend.onrender.com',
    'https://xaali-backend.onrender.com',
    // Pour supporter les URLs personnalisées sur Render
    /\.onrender\.com$/
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
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🌐 Origin:', req.headers.origin || 'Aucune origine');
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
  console.log('📊 Environnement:', process.env.NODE_ENV || 'development');
  console.log('🔗 CORS activé pour toutes les origines en mode développement');
}
bootstrap();