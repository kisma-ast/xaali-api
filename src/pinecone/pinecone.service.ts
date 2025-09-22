import { Injectable, Logger } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import * as pdfParse from 'pdf-parse';
import { PINECONE_CONFIG } from '../config';

export interface VectorDocument {
  id: string;
  values: number[];
  metadata: {
    text: string;
    source: string;
    page?: number;
    category?: string;
    timestamp: string;
    title?: string;
    author?: string;
    date?: string;
    chunkIndex?: number;
    totalChunks?: number;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: {
    text: string;
    source: string;
    page?: number;
    category?: string;
    timestamp: string;
  };
}

@Injectable()
export class PineconeService {
  private readonly logger = new Logger(PineconeService.name);
  private pinecone: Pinecone;
  private index: any;

  constructor() {
    this.logger.log(` Configuration PineconeService:`);
    this.logger.log(`  - Index: ${PINECONE_CONFIG.INDEX_NAME || 'xaali-agent'}`);
    this.logger.log(`  - Dimensions: ${PINECONE_CONFIG.DIMENSIONS}`);
    this.logger.log(`  - Environnement: ${PINECONE_CONFIG.ENVIRONMENT || 'us-east-1'}`);
    this.initializePinecone();
  }

  private async initializePinecone() {
    try {
      const { API_KEY, ENVIRONMENT, INDEX_NAME } = PINECONE_CONFIG;

      if (!API_KEY || API_KEY === 'your_pinecone_api_key_here') {
        this.logger.warn('Pinecone API key not configured. Service will run in limited mode.');
        return;
      }

      this.pinecone = new Pinecone({ apiKey: API_KEY });
      this.index = this.pinecone.index(INDEX_NAME);
      this.logger.log(`Pinecone initialized successfully with index: ${INDEX_NAME}`);
    } catch (error) {
      this.logger.error('Failed to initialize Pinecone:', error);
      this.logger.warn('Continuing without Pinecone...');
    }
  }

  async uploadDocument(document: VectorDocument): Promise<void> {
    try {
      await this.index.upsert([{
        id: document.id,
        values: document.values,
        metadata: document.metadata,
      }]);
      this.logger.log(`Document uploaded successfully: ${document.id}`);
    } catch (error) {
      this.logger.error(`Failed to upload document ${document.id}:`, error);
      throw error;
    }
  }

  async uploadDocuments(documents: VectorDocument[]): Promise<void> {
    try {
      const vectors = documents.map((doc: VectorDocument) => ({
        id: doc.id,
        values: doc.values,
        metadata: doc.metadata,
      }));

      await this.index.upsert(vectors);
      this.logger.log(`${documents.length} documents uploaded successfully`);
    } catch (error) {
      this.logger.error('Failed to upload documents:', error);
      throw error;
    }
  }

  async searchSimilar(queryVector: number[], topK: number = 5, filter?: any): Promise<SearchResult[]> {
    try {
      if (!this.index) {
        this.logger.warn('Pinecone not initialized, returning empty results');
        return [];
      }

      this.logger.log(` Recherche Pinecone: topK=${topK}, dimensions=${queryVector.length}`);
      if (filter) {
        this.logger.log(` Filtre appliqué: ${JSON.stringify(filter)}`);
      }

      const queryResponse: { matches: SearchResult[] } = await this.index.query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter,
      });

      this.logger.log(` Recherche Pinecone terminée: ${queryResponse.matches.length} résultats trouvés`);
      
      const results: SearchResult[] = queryResponse.matches.map((match: any) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata as SearchResult['metadata'],
      }));

      // Log des résultats avec types explicites
      results.forEach((result: SearchResult, index: number) => {
        this.logger.log(`  📄 Résultat ${index + 1}: ID=${result.id}, Score=${(result.score * 100).toFixed(1)}%`);
      });

      return results;
    } catch (error) {
      this.logger.error(' Erreur lors de la recherche Pinecone:', error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      await this.index.deleteOne(id);
      this.logger.log(`Document deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete document ${id}:`, error);
      throw error;
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      await this.index.deleteMany(ids);
      this.logger.log(`${ids.length} documents deleted successfully`);
    } catch (error) {
      this.logger.error('Failed to delete documents:', error);
      throw error;
    }
  }

  async getIndexStats(): Promise<any> {
    try {
      const stats = await this.index.describeIndexStats();
      return stats;
    } catch (error) {
      this.logger.error('Failed to get index stats:', error);
      throw error;
    }
  }

  async parsePDF(buffer: Buffer): Promise<string> {
    try {
      if (!buffer || buffer.length === 0) {
        throw new Error('Invalid or empty buffer provided');
      }

      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      this.logger.error('Error parsing PDF:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    if (!text || text.length === 0) {
      return [];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.substring(start, end).trim();
      
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      start = end - overlap;
      if (start >= text.length) break;
    }

    return chunks;
  }
}
