import { Injectable, Logger } from '@nestjs/common';
import { PineconeService } from './pinecone/pinecone.service';
import { EmbeddingService } from './pinecone/embedding.service';
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
    private readonly pineconeService: PineconeService,
    private readonly embeddingService: EmbeddingService,
    private readonly aiResponseService: AIResponseService,
    private readonly fineTuningService: FineTuningService, // Add this
  ) {}

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
      // Use fine-tuning instead of RAG
      this.logger.log(`🚀 Utilisation du modèle fine-tuned pour: "${legalQuery.query}"`);
      
      const fineTuningResponse = await this.fineTuningService.processFineTunedQuery({
        question: legalQuery.query,
        category: legalQuery.category,
      });

      const result = {
        query: legalQuery.query,
        relevantDocuments: [], // Empty since we're not using retrieval
        formattedResponse: fineTuningResponse.answer,
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