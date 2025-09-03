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
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173', 
      'https://xaali-1tneyr.live.cloudoor.com',
      'https://xaali-q6q6bc.live.cloudoor.com',
      'https://xaali-w0ilbs.live.cloudoor.com',
      /\.cloudoor\.com$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`Serveur Xaali démarré sur http://localhost:${port}`);
  console.log('Documentation: http://localhost:3000/api');
  console.log('Pinecone endpoints: http://localhost:3000/pinecone');
  console.log('Legal Assistant: http://localhost:3000/legal-assistant');
}
bootstrap();
