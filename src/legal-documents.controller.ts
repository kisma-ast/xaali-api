import { Controller, Post, Body, Get, Param, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { LegalDocumentsService } from './legal-documents.service';

@Controller('legal-documents')
export class LegalDocumentsController {
  constructor(private readonly legalDocumentsService: LegalDocumentsService) {}

  @Post('ingest')
  async ingestDocuments(@Body() body: {
    documents: Array<{
      title: string;
      content: string;
      type: 'code' | 'loi' | 'decret' | 'jurisprudence';
      reference: string;
    }>
  }) {
    return await this.legalDocumentsService.ingestLegalDocuments(body.documents);
  }

  @Post('ask')
  async askQuestion(@Body() body: {
    question: string;
    assistantId: string;
  }) {
    return await this.legalDocumentsService.askLegalQuestion(body.question, body.assistantId);
  }

  @Post('upload-pdfs')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadPdfs(@UploadedFiles() files: Express.Multer.File[]) {
    return await this.legalDocumentsService.ingestPdfFiles(files);
  }


}