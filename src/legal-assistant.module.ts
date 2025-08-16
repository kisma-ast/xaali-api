import { Module } from '@nestjs/common';
import { LegalAssistantController } from './legal-assistant.controller';
import { LegalAssistantService } from './legal-assistant.service';
import { AIResponseService } from './ai-response.service';
import { PineconeModule } from './pinecone';

@Module({
  imports: [PineconeModule],
  controllers: [LegalAssistantController],
  providers: [LegalAssistantService, AIResponseService],
  exports: [LegalAssistantService],
})
export class LegalAssistantModule {}
