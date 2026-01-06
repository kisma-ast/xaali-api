import { Injectable, Logger } from '@nestjs/common';
import { LegalDocumentsService } from './legal-documents.service';
import { AIResponseService, FormattedResponse } from './ai-response.service';
import { FineTuningService } from './fine-tuning.service'; // Add this import

export interface LegalQuery {
  query: string;
  category?: string;
  topK?: number;
}

export interface LegalResponse {
  query: string;
  relevantDocuments: Array<{
    id: string;
    score: number;
    text: string;
    source: string;
    category: string;
  }>;
  summary?: string;
  formattedResponse?: FormattedResponse;
}

@Injectable()
export class LegalAssistantService {
  private readonly logger = new Logger(LegalAssistantService.name);

  constructor(
    private readonly legalDocumentsService: LegalDocumentsService,
    private readonly aiResponseService: AIResponseService,
    private readonly fineTuningService: FineTuningService,
  ) { }

  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async searchLegalDocuments(legalQuery: LegalQuery): Promise<LegalResponse> {
    const cacheKey = `${legalQuery.query}_${legalQuery.category || 'all'}`;

    // Vérifier le cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`💨 Cache hit pour: "${legalQuery.query}"`);
      return cached.data;
    }

    try {
      this.logger.log(`🚀 Utilisation du RAG Mongo pour: "${legalQuery.query}"`);

      // We ignore fine-tuning for now and use the new RAG
      /*const fineTuningResponse = await this.fineTuningService.processFineTunedQuery({
        question: legalQuery.query,
        category: legalQuery.category,
      });*/

      const ragResult = await this.legalDocumentsService.askLegalQuestion(legalQuery.query);

      let content = "";
      let confidence = 'Moyen';
      let processingMode = 'RAG';
      let title = "Réponse Xaali";
      let summary = "";
      let nextSteps = [];

      if (ragResult.foundContext) {
        content = ragResult.content || "";
        processingMode = 'RAG';
        confidence = 'Élevé';
        summary = "Réponse basée sur vos documents juridiques.";
        nextSteps = [
          'Préparer les documents nécessaires',
          'Contacter les autorités compétentes si nécessaire',
          'Consulter un avocat spécialisé pour un conseil personnalisé'
        ];
      } else {
        this.logger.log(`⚠️ Aucun document RAG trouvé pour "${legalQuery.query}" -> Fallback sur Fine-Tuning/OpenAI`);

        // Fallback to Fine-Tuning/OpenAI
        const ftResponse = await this.fineTuningService.processFineTunedQuery({
          question: legalQuery.query,
          category: legalQuery.category
        });

        // Extract structured data from fine-tuning response
        const answer = ftResponse.answer;
        if (typeof answer === 'string') {
          content = answer;
        } else {
          content = answer.content || JSON.stringify(answer);
          title = answer.title || title;
          summary = answer.summary || "";
          confidence = answer.confidence || 'Moyen';
          nextSteps = answer.nextSteps || [];
        }

        processingMode = 'FALLBACK_AI';
      }

      const result = {
        query: legalQuery.query,
        relevantDocuments: [],

        formattedResponse: {
          title: title,
          content: content,
          articles: [],
          summary: summary,
          disclaimer: "",
          confidence: confidence as any,
          nextSteps: nextSteps,
          relatedTopics: [],
          ragMetadata: {
            poweredBy: 'Xaali-AI',
            systemVersion: '1.1',
            processingMode: processingMode as any,
            timestamp: new Date().toISOString(),
          }
        },
      };

      // Mettre en cache
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      this.logger.error('Error searching legal documents:', error);
      throw error;
    }
  }

  async getLegalAdvice(query: string, category?: string): Promise<LegalResponse> {
    try {
      this.logger.log(`Getting legal advice for: ${query}`);

      // Use fine-tuning instead of RAG
      const fineTuningResponse = await this.fineTuningService.processFineTunedQuery({
        question: query,
        category: category,
      });

      return {
        query: query,
        relevantDocuments: [],
        formattedResponse: fineTuningResponse.answer,
        summary: `Réponse générée par le modèle fine-tuned.`,
      };
    } catch (error) {
      this.logger.error('Error getting legal advice:', error);
      throw error;
    }
  }

  async searchByCategory(category: string, query?: string, topK: number = 10): Promise<LegalResponse> {
    try {
      this.logger.log(`Searching with fine-tuned model in category: ${category}`);

      // Use fine-tuning instead of RAG
      const fineTuningResponse = await this.fineTuningService.processFineTunedQuery({
        question: query || `Documents in category: ${category}`,
        category: category,
      });

      return {
        query: query || `Documents in category: ${category}`,
        relevantDocuments: [],
        formattedResponse: fineTuningResponse.answer,
      };
    } catch (error) {
      this.logger.error('Error searching by category:', error);
      throw error;
    }
  }

  async getDocumentStats(): Promise<any> {
    try {
      // Return stats for fine-tuned model instead of Pinecone
      return {
        totalDocuments: 0,
        indexDimension: 0,
        indexName: 'fine-tuned-model',
        namespaces: {},
        modelType: 'fine-tuned',
      };
    } catch (error) {
      this.logger.error('Error getting document stats:', error);
      throw error;
    }
  }
}