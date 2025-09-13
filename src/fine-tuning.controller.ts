import { Controller, Post, Get, Body, Logger, Res } from '@nestjs/common';
import { FineTuningService, FineTuningQuery } from './fine-tuning.service';

@Controller('fine-tuning')
export class FineTuningController {
  private readonly logger = new Logger(FineTuningController.name);

  constructor(private readonly fineTuningService: FineTuningService) {}

  @Post('ask')
  async askQuestion(@Body() body: { question: string; context?: string; category?: string }, @Res({ passthrough: true }) res: any) {
    this.logger.log(`📝 Nouvelle question fine-tuning: "${body.question}"`);
    
    const query: FineTuningQuery = {
      question: body.question,
      context: body.context,
      category: body.category,
    };

    try {
      const response = await this.fineTuningService.processFineTunedQuery(query);
      
      // Headers pour identifier les réponses fine-tuning
      res.header('X-Powered-By', 'Xaali-FineTuning');
      res.header('X-System', 'Fine-Tuned Model');
      res.header('X-Version', 'v1.0');
      res.header('X-Processing-Time', `${response.processingTime}ms`);
      res.header('X-Confidence', `${(response.confidence * 100).toFixed(1)}%`);
      
      this.logger.log(`✅ Réponse fine-tuning générée en ${response.processingTime}ms`);
      this.logger.log(`📊 Confiance: ${(response.confidence * 100).toFixed(1)}%`);
      
      return {
        success: true,
        data: response,
        info: {
          system: 'Fine-Tuning Model',
          poweredBy: 'Xaali-AI',
          version: 'Xaali Fine-Tuning v1.0',
          processingTime: `${response.processingTime}ms`,
          confidence: `${(response.confidence * 100).toFixed(1)}%`,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Erreur traitement fine-tuning:', error);
      return {
        success: false,
        error: 'Erreur lors du traitement de votre question',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('stats')
  async getModelStats() {
    this.logger.log('📊 Demande statistiques fine-tuning');
    
    try {
      const stats = await this.fineTuningService.getModelStats();
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Erreur récupération stats:', error);
      return {
        success: false,
        error: 'Impossible de récupérer les statistiques',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('health')
  async checkModelHealth() {
    this.logger.log('🏥 Vérification santé modèle fine-tuning');
    
    try {
      const stats = await this.fineTuningService.getModelStats();
      
      const health = {
        status: 'healthy',
        components: {
          openai: 'operational',
        },
        metrics: {
          avgResponseTime: stats.performance?.avgResponseTime || 'N/A',
          lastCheck: new Date().toISOString(),
        },
      };

      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error('❌ Erreur vérification santé:', error);
      return {
        success: false,
        data: {
          status: 'unhealthy',
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}