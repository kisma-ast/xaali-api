import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import { LegalAssistantService, LegalQuery } from './legal-assistant.service';

@Controller('legal-assistant')
export class LegalAssistantController {
  private readonly logger = new Logger(LegalAssistantController.name);

  constructor(private readonly legalAssistantService: LegalAssistantService) {}

  @Post('search')
  async searchDocuments(@Body() legalQuery: LegalQuery) {
    try {
      this.logger.log(`Search request: ${legalQuery.query}`);
      const results = await this.legalAssistantService.searchLegalDocuments(legalQuery);
      
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

  @Post('search-formatted')
  async searchDocumentsFormatted(@Body() legalQuery: LegalQuery) {
    try {
      this.logger.log(`Formatted search request: ${legalQuery.query}`);
      const results = await this.legalAssistantService.searchLegalDocuments(legalQuery);
      
      // Retourner seulement la réponse formatée pour le frontend
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
}





