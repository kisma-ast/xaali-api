import { Module } from '@nestjs/common';
import { LegalAssistantController } from './legal-assistant.controller';
import { RAGController } from './rag.controller';
import { LegalAssistantService } from './legal-assistant.service';
import { AIResponseService } from './ai-response.service';
import { RAGOrchestratorService } from './rag-orchestrator.service';
import { PineconeModule } from './pinecone';

@Module({
  imports: [PineconeModule],
  controllers: [LegalAssistantController, RAGController],
  providers: [
    LegalAssistantService, 
    AIResponseService, 
    RAGOrchestratorService
  ],
  exports: [LegalAssistantService, RAGOrchestratorService],
})
export class LegalAssistantModule {}
