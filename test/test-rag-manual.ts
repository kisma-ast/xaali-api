import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { LegalDocumentsService } from '../src/legal-documents.service';

async function bootstrap() {
    console.log('🏁 Starting RAG Verification Script...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(LegalDocumentsService);

    const mockText = `
  CODE DE LA FAMILLE SENEGALAIS (SIMULATION TEST)
  
  Article 100: Le mariage est une union sacrée entre un homme et une femme. Il doit être célébré devant un officier d'état civil.
  Article 101: L'âge minimum pour le mariage est de 18 ans pour l'homme et 16 ans pour la femme.
  Article 102: Le régime de la communauté de biens est applicable par défaut, sauf contrat de mariage spécifique.
  Article 103: Le divorce peut être prononcé par contentieux ou par consentement mutuel.
  `;

    console.log('1. 📥 Ingesting test content...');
    try {
        // Using the new ingestTextContent method to bypass PDF parsing issues
        const result = await service.ingestTextContent(mockText, 'Test_Code_Famille.txt');
        console.log('✅ Ingestion successful:', result);
    } catch (e) {
        console.error('❌ Ingestion failed:', e.message);
        process.exit(1);
    }

    console.log('⏳ Waiting for indexing (2s)...');
    await new Promise(r => setTimeout(r, 2000));

    console.log('2. ❓ Asking Question: "Quel est l\'âge minimum pour se marier ?"');
    try {
        const answer = await service.askLegalQuestion('Quel est l\'âge minimum pour se marier ?');
        console.log('\n🤖 Answer:', answer);
        console.log('\n-----------------------------------');
    } catch (e) {
        console.error('❌ Question failed:', e.message);
    }

    await app.close();
    console.log('🏁 Script finished.');
}

bootstrap();
