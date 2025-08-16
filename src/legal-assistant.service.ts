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

  async searchLegalDocuments(legalQuery: LegalQuery): Promise<LegalResponse> {
    try {
      this.logger.log(`🔍 Début de recherche pour: "${legalQuery.query}"`);
      this.logger.log(`📂 Catégorie: ${legalQuery.category || 'Toutes'}`);
      this.logger.log(`📊 Nombre de résultats demandés: ${legalQuery.topK || 5}`);

      // Générer l'embedding pour la requête
      this.logger.log(`🧠 Génération de l'embedding pour la requête...`);
      const queryEmbedding = await this.embeddingService.generateEmbedding(legalQuery.query);
      this.logger.log(`✅ Embedding généré avec succès (${queryEmbedding.length} dimensions)`);

      // Construire le filtre si une catégorie est spécifiée
      const filter = legalQuery.category ? { category: legalQuery.category } : undefined;
      if (filter) {
        this.logger.log(`🔧 Filtre appliqué: ${JSON.stringify(filter)}`);
      }

      // Rechercher les documents similaires
      this.logger.log(`🌲 Recherche dans Pinecone...`);
      const searchResults = await this.pineconeService.searchSimilar(
        queryEmbedding,
        legalQuery.topK || 5,
        filter,
      );
      this.logger.log(`✅ ${searchResults.length} documents trouvés dans Pinecone`);

      // Formater les résultats
      this.logger.log(`📝 Formatage des documents trouvés...`);
      const relevantDocuments = searchResults.map(result => ({
        id: result.id,
        score: result.score,
        text: this.aiResponseService.formatDocumentText(result.metadata.text),
        source: result.metadata.source,
        category: result.metadata.category || 'unknown',
      }));

      this.logger.log(`📊 Documents formatés: ${relevantDocuments.length} documents`);
      relevantDocuments.forEach((doc, index) => {
        this.logger.log(`  📄 ${index + 1}. Score: ${(doc.score * 100).toFixed(1)}%, Source: ${doc.source}`);
      });

      // Générer une réponse formatée avec l'IA
      this.logger.log(`🤖 Génération de la réponse formatée avec l'IA...`);
      const formattedResponse = await this.aiResponseService.generateFormattedResponse(
        legalQuery.query,
        relevantDocuments
      );
      this.logger.log(`✅ Réponse formatée générée avec succès`);

      this.logger.log(`🎯 Recherche terminée avec succès pour: "${legalQuery.query}"`);
      return {
        query: legalQuery.query,
        relevantDocuments,
        formattedResponse,
      };
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
