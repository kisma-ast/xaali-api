import { Controller, Post, Get, Body, Query, Logger, Res } from '@nestjs/common';
import { RAGOrchestratorService, RAGQuery } from './rag-orchestrator.service';

@Controller('rag')
export class RAGController {
  private readonly logger = new Logger(RAGController.name);

  constructor(private readonly ragService: RAGOrchestratorService) {}

  @Post('ask')
  async askQuestion(@Body() body: { question: string; context?: string }, @Res({ passthrough: true }) res: any) {
    this.logger.log(`📝 Nouvelle question RAG: "${body.question}"`);
    
    const query: RAGQuery = {
      question: body.question,
      context: body.context,
      maxResults: 5,
      minScore: 0.7,
    };

    try {
      const response = await this.ragService.processRAGQuery(query);
      
      // Headers pour identifier les réponses RAG
      res.header('X-Powered-By', 'Xaali-RAG');
      res.header('X-RAG-System', 'Pinecone+OpenAI');
      res.header('X-RAG-Version', 'v1.0');
      res.header('X-RAG-Processing-Time', `${response.processingTime}ms`);
      res.header('X-RAG-Confidence', `${(response.confidence * 100).toFixed(1)}%`);
      res.header('X-RAG-Sources', `${response.sources.length}`);
      
      this.logger.log(`✅ Réponse RAG générée en ${response.processingTime}ms`);
      this.logger.log(`📊 Confiance: ${(response.confidence * 100).toFixed(1)}%`);
      
      return {
        success: true,
        data: response,
        ragInfo: {
          system: 'RAG (Retrieval-Augmented Generation)',
          poweredBy: 'Xaali-AI',
          version: 'Xaali RAG v1.0',
          processingTime: `${response.processingTime}ms`,
          confidence: `${(response.confidence * 100).toFixed(1)}%`,
          sourcesUsed: response.sources.length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Erreur traitement RAG:', error);
      return {
        success: false,
        error: 'Erreur lors du traitement de votre question',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('stats')
  async getRAGStats() {
    this.logger.log('📊 Demande statistiques RAG');
    
    try {
      const stats = await this.ragService.getRAGStats();
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

  @Post('citizen-question')
  async handleCitizenQuestion(
    @Body() body: { 
      question: string; 
      citizenId?: string; 
      category?: string;
      priority?: 'low' | 'medium' | 'high';
      questionsUsed?: number;
    }
  ) {
    this.logger.log(`👤 Question citoyen: "${body.question}"`);
    this.logger.log(`📂 Catégorie: ${body.category || 'Générale'}`);
    this.logger.log(`⚡ Priorité: ${body.priority || 'medium'}`);
    this.logger.log(`📊 Questions utilisées: ${body.questionsUsed || 0}`);

    // Contrôle des questions gratuites
    const maxFreeQuestions = 2;
    const questionsUsed = body.questionsUsed || 0;
    
    if (questionsUsed >= maxFreeQuestions) {
      this.logger.log(`❌ Limite de questions gratuites atteinte pour ${body.citizenId}`);
      return {
        success: false,
        error: 'QUESTIONS_LIMIT_REACHED',
        message: 'Vous avez atteint la limite de 2 questions gratuites. Veuillez payer pour continuer.',
        data: {
          questionsUsed,
          maxFreeQuestions,
          requiresPayment: true
        },
        timestamp: new Date().toISOString(),
      };
    }

    const query: RAGQuery = {
      question: body.question,
      userId: body.citizenId,
      context: body.category,
      maxResults: body.priority === 'high' ? 8 : 5,
      minScore: body.priority === 'high' ? 0.6 : 0.7,
    };

    try {
      const response = await this.ragService.processRAGQuery(query);
      
      // Enrichir la réponse pour les citoyens
      const citizenResponse = {
        ...response,
        userFriendly: {
          quickAnswer: this.generateQuickAnswer(response.answer),
          actionItems: response.answer.nextSteps || [],
          relatedHelp: response.answer.relatedTopics || [],
          confidenceLevel: this.translateConfidence(response.confidence),
        },
      };

      this.logger.log(`✅ Réponse citoyen générée (${response.processingTime}ms)`);
      
      return {
        success: true,
        data: citizenResponse,
        metadata: {
          processingTime: response.processingTime,
          sourcesUsed: response.sources.length,
          confidence: response.confidence,
        },
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error('❌ Erreur question citoyen:', error);
      return {
        success: false,
        error: 'Nous rencontrons des difficultés techniques. Veuillez réessayer.',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('health')
  async checkRAGHealth() {
    this.logger.log('🏥 Vérification santé RAG');
    
    try {
      const stats = await this.ragService.getRAGStats();
      
      const health = {
        status: 'healthy',
        components: {
          pinecone: stats.performance?.totalDocuments > 0 ? 'operational' : 'degraded',
          openai: 'operational', // Peut être testé avec un appel simple
          embedding: 'operational',
        },
        metrics: {
          documentsIndexed: stats.performance?.totalDocuments || 0,
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

  private generateQuickAnswer(answer: any): string {
    // Générer une réponse rapide basée sur le contenu
    if (answer.content) {
      const sentences = answer.content.split('.').filter((s: string) => s.trim().length > 0);
      return sentences.slice(0, 2).join('. ') + '.';
    }
    return answer.summary || 'Réponse disponible dans les détails ci-dessous.';
  }

  private translateConfidence(confidence: number): string {
    if (confidence >= 0.8) return 'Très fiable';
    if (confidence >= 0.6) return 'Fiable';
    if (confidence >= 0.4) return 'Modérément fiable';
    return 'Informations limitées';
  }
}