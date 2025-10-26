import { Controller, Post, Get, Body, Query, Logger, Res } from '@nestjs/common';
import { LegalAssistantService, LegalQuery } from './legal-assistant.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Response } from 'express';
import { ObjectId } from 'mongodb';

@Controller('legal-assistant')
export class LegalAssistantController {
  private readonly logger = new Logger(LegalAssistantController.name);

  constructor(
    private readonly legalAssistantService: LegalAssistantService,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
  ) {}

  @Post('search')
  async searchDocuments(@Body() legalQuery: LegalQuery & { citizenName?: string; citizenPhone?: string; category?: string }) {
    try {
      this.logger.log(`Search request: ${legalQuery.query}`);
      const results = await this.legalAssistantService.searchLegalDocuments(legalQuery);
      
      // Enregistrer le cas non payé dans la BD
      await this.saveUnpaidCase(legalQuery, results);
      
      // Si une réponse formatée est disponible, l'utiliser
      if (results.formattedResponse) {
        return {
          success: true,
          data: {
            query: results.query,
            formattedResponse: results.formattedResponse,
            documentCount: results.relevantDocuments.length,
          },
        };
      }
      
      // Fallback vers l'ancien format
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      this.logger.error('Error in search:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('search-instant')
  async searchInstant(@Body() legalQuery: LegalQuery, @Res() res: Response) {
    try {
      // Réponse immédiate avec placeholder
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Envoyer une réponse immédiate
      const immediateResponse = {
        success: true,
        status: 'processing',
        message: 'Analyse en cours...',
        query: legalQuery.query
      };
      res.write(`data: ${JSON.stringify(immediateResponse)}\n\n`);
      
      // Traitement en arrière-plan
      const results = await this.legalAssistantService.searchLegalDocuments(legalQuery);
      
      const finalResponse = {
        success: true,
        status: 'completed',
        data: {
          query: results.query,
          formattedResponse: results.formattedResponse,
          documentCount: results.relevantDocuments.length,
        }
      };
      
      res.write(`data: ${JSON.stringify(finalResponse)}\n\n`);
      res.end();
      
    } catch (error) {
      const errorResponse = {
        success: false,
        status: 'error',
        error: error.message
      };
      res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
      res.end();
    }
  }

  @Post('search-formatted')
  async searchDocumentsFormatted(@Body() legalQuery: LegalQuery) {
    try {
      this.logger.log(`Formatted search request: ${legalQuery.query}`);
      const results = await this.legalAssistantService.searchLegalDocuments(legalQuery);
      
      return {
        success: true,
        data: {
          query: results.query,
          formattedResponse: results.formattedResponse,
          documentCount: results.relevantDocuments.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in formatted search:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('follow-up')
  async saveFollowUpQuestion(@Body() body: { caseId: string; question: string; response: string; questionNumber: number }) {
    try {
      const existingCase = await this.caseRepository.findOne({ where: { _id: new ObjectId(body.caseId) } });
      if (!existingCase) {
        return { success: false, message: 'Cas non trouvé' };
      }

      if (body.questionNumber === 2) {
        existingCase.secondQuestion = body.question;
        existingCase.secondResponse = body.response;
      } else if (body.questionNumber === 3) {
        existingCase.thirdQuestion = body.question;
        existingCase.thirdResponse = body.response;
      }

      await this.caseRepository.save(existingCase);
      this.logger.log(`✅ Question de suivi ${body.questionNumber} sauvegardée pour le cas: ${body.caseId}`);
      
      return { success: true, message: 'Question de suivi sauvegardée' };
    } catch (error) {
      this.logger.error('❌ Erreur sauvegarde question de suivi:', error);
      return { success: false, message: 'Erreur lors de la sauvegarde' };
    }
  }

  @Post('advice')
  async getLegalAdvice(
    @Body() body: { query: string; category?: string },
  ) {
    try {
      this.logger.log(`Legal advice request: ${body.query}`);
      const advice = await this.legalAssistantService.getLegalAdvice(
        body.query,
        body.category,
      );
      return {
        success: true,
        data: advice,
      };
    } catch (error) {
      this.logger.error('Error getting legal advice:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('search-by-category')
  async searchByCategory(
    @Query('category') category: string,
    @Query('query') query?: string,
    @Query('topK') topK?: number,
  ) {
    try {
      this.logger.log(`Category search: ${category}`);
      const results = await this.legalAssistantService.searchByCategory(
        category,
        query,
        topK ? parseInt(topK.toString()) : 10,
      );
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      this.logger.error('Error in category search:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('stats')
  async getStats() {
    try {
      const stats = await this.legalAssistantService.getDocumentStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('Error getting stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Méthode pour sauvegarder les cas non payés
  private async saveUnpaidCase(query: any, results: any): Promise<void> {
    try {
      // Extraire la réponse IA complète
      let aiResponse = 'Réponse IA générée';
      let title = `Consultation sur ${query.category || 'sujet juridique'}`;
      
      if (results.formattedResponse) {
        const fr = results.formattedResponse;
        aiResponse = fr.content || fr.summary || JSON.stringify(fr);
        title = fr.title || title;
      }
      
      const unpaidCase = new Case();
      unpaidCase.title = title;
      unpaidCase.description = `Question: ${query.query}`;
      unpaidCase.category = query.category || 'consultation-generale';
      unpaidCase.citizenName = query.citizenName || null;
      unpaidCase.citizenPhone = query.citizenPhone || null;
      unpaidCase.status = 'unpaid';
      unpaidCase.urgency = 'normal';
      unpaidCase.estimatedTime = 30;
      unpaidCase.firstQuestion = query.query;
      unpaidCase.firstResponse = aiResponse;
      unpaidCase.aiResponse = aiResponse;
      unpaidCase.clientQuestion = query.query;
      unpaidCase.isPaid = false;
      unpaidCase.createdAt = new Date();

      const savedCase = await this.caseRepository.save(unpaidCase);
      this.logger.log(`✅ Cas non payé enregistré: ${savedCase.id} avec réponse: ${aiResponse.substring(0, 50)}...`);
    } catch (error) {
      this.logger.error('❌ Erreur sauvegarde cas non payé:', error);
    }
  }
}