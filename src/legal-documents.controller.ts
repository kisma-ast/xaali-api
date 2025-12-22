import { Controller, Post, Body, Get, Param, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { LegalDocumentsService } from './legal-documents.service';

@Controller('legal-documents')
export class LegalDocumentsController {
  constructor(private readonly legalDocumentsService: LegalDocumentsService) { }

  @Post('ingest')
  // Placeholder left for structured ingestion if needed later, or remove
  async ingestDocuments() {
    return { message: "Use /upload-pdfs for now with the new RAG system." };
  }

  @Post('ask')
  async askQuestion(@Body() body: {
    question: string;
  }) {
    // Removed assistantId param as we are using local RAG now
    return await this.legalDocumentsService.askLegalQuestion(body.question);
  }

  @Post('upload-pdfs')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadPdfs(@UploadedFiles() files: Express.Multer.File[]) {
    const results = [];
    for (const file of files) {
      results.push(await this.legalDocumentsService.ingestPdfFile(file));
    }
    return results;
  }


}