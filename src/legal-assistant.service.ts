import { Injectable, Logger } from '@nestjs/common';
import { PineconeService } from './pinecone/pinecone.service';
import { EmbeddingService } from './pinecone/embedding.service';
import { AIResponseService, FormattedResponse } from './ai-response.service';

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
      // Paralléliser les opérations
      const [queryEmbedding, filter] = await Promise.all([
        this.embeddingService.generateEmbedding(legalQuery.query),
        Promise.resolve(legalQuery.category ? { category: legalQuery.category } : undefined)
      ]);

      const searchResults = await this.pineconeService.searchSimilar(
        queryEmbedding,
        legalQuery.topK || 3, // Réduire à 3 pour plus de rapidité
        filter,
      );

      const relevantDocuments = searchResults.map(result => ({
        id: result.id,
        score: result.score,
        text: result.metadata.text.substring(0, 500), // Limiter le texte
        source: result.metadata.source,
        category: result.metadata.category || 'unknown',
      }));

      // Générer la réponse en parallèle
      const formattedResponse = await this.aiResponseService.generateFormattedResponse(
        legalQuery.query,
        relevantDocuments
      );

      const result = {
        query: legalQuery.query,
        relevantDocuments,
        formattedResponse,
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

      // Rechercher des documents pertinents
      const searchResult = await this.searchLegalDocuments({
        query,
        category,
        topK: 3,
      });

      return {
        ...searchResult,
        summary: `Trouvé ${searchResult.relevantDocuments.length} document(s) pertinent(s) pour votre question.`,
      };
    } catch (error) {
      this.logger.error('Error getting legal advice:', error);
      throw error;
    }
  }

  async searchByCategory(category: string, query?: string, topK: number = 10): Promise<LegalResponse> {
    try {
      this.logger.log(`Searching documents in category: ${category}`);

      let queryEmbedding: number[] | undefined;
      if (query) {
        queryEmbedding = await this.embeddingService.generateEmbedding(query);
      } else {
        // Si pas de requête spécifique, utiliser un vecteur neutre ou chercher tous les documents
        queryEmbedding = Array.from({ length: 1024 }, () => 0);
      }

      const searchResults = await this.pineconeService.searchSimilar(
        queryEmbedding,
        topK,
        { category },
      );

      const relevantDocuments = searchResults.map(result => ({
        id: result.id,
        score: result.score,
        text: result.metadata.text,
        source: result.metadata.source,
        category: result.metadata.category || 'unknown',
      }));

      return {
        query: query || `Documents in category: ${category}`,
        relevantDocuments,
      };
    } catch (error) {
      this.logger.error('Error searching by category:', error);
      throw error;
    }
  }

  async getDocumentStats(): Promise<any> {
    try {
      const stats = await this.pineconeService.getIndexStats();
      return {
        totalDocuments: stats.totalVectorCount || 0,
        indexDimension: stats.dimension || 1024,
        indexName: stats.indexName || 'xaali-agent',
        namespaces: stats.namespaces || {},
      };
    } catch (error) {
      this.logger.error('Error getting document stats:', error);
      throw error;
    }
  }
}
