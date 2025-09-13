import { Module } from '@nestjs/common';
import { LegalAssistantController } from './legal-assistant.controller';
import { FineTuningController } from './fine-tuning.controller'; // Changed import
import { LegalAssistantService } from './legal-assistant.service';
import { AIResponseService } from './ai-response.service';
import { FineTuningService } from './fine-tuning.service'; // Changed import
import { PineconeModule } from './pinecone';

@Module({
  imports: [PineconeModule],
  controllers: [LegalAssistantController, FineTuningController], // Changed controller
  providers: [
    LegalAssistantService, 
    AIResponseService, 
    FineTuningService // Changed service
  ],
  exports: [LegalAssistantService, FineTuningService], // Changed export
})
export class LegalAssistantModule {}