import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalAssistantController } from './legal-assistant.controller';
import { FineTuningController } from './fine-tuning.controller'; // Changed import
import { LegalAssistantService } from './legal-assistant.service';
import { AIResponseService } from './ai-response.service';
import { FineTuningService } from './fine-tuning.service'; // Changed import
import { PineconeModule } from './pinecone';
import { Case } from './case.entity';

@Module({
  imports: [PineconeModule, TypeOrmModule.forFeature([Case])],
  controllers: [LegalAssistantController, FineTuningController], // Changed controller
  providers: [
    LegalAssistantService, 
    AIResponseService, 
    FineTuningService // Changed service
  ],
  exports: [LegalAssistantService, FineTuningService], // Changed export
})
export class LegalAssistantModule {}