import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalAssistantController } from './legal-assistant.controller';
import { FineTuningController } from './fine-tuning.controller'; // Changed import
import { LegalAssistantService } from './legal-assistant.service';
import { AIResponseService } from './ai-response.service';
import { FineTuningService } from './fine-tuning.service'; // Changed import

import { Case } from './case.entity';
import { LegalDocumentsService } from './legal-documents.service';
import { VectorStoreService } from './vector-store.service';
import { LegalDocument } from './legal-document.entity';
import { LegalDocChunk } from './legal-doc-chunk.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Case, LegalDocument, LegalDocChunk])],
  controllers: [LegalAssistantController, FineTuningController], // Changed controller
  providers: [
    LegalAssistantService,
    AIResponseService,
    FineTuningService,
    LegalDocumentsService,
    VectorStoreService
  ],
  exports: [LegalAssistantService, FineTuningService], // Changed export
})
export class LegalAssistantModule { }