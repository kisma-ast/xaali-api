import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MongoRepository } from 'typeorm';
import { LegalDocChunk } from './legal-doc-chunk.entity';
import { ObjectId } from 'mongodb';
import { AI_CONFIG } from './config';

@Injectable()
export class VectorStoreService {
    private readonly logger = new Logger(VectorStoreService.name);
    private readonly openaiApiKey = AI_CONFIG.OPENAI_API_KEY;

    constructor(
        @InjectRepository(LegalDocChunk)
        private readonly chunkRepository: MongoRepository<LegalDocChunk>,
    ) { }

    /**
     * Génère les embeddings pour les textes donnés
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        try {
            this.logger.log(`Generating embeddings for ${texts.length} chunks...`);
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: texts,
                    model: 'text-embedding-3-small', // 1536 dimensions, cost effective
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`OpenAI API Error: ${JSON.stringify(error)}`);
            }

            const data = await response.json();
            return data.data.map((item: any) => item.embedding);
        } catch (error) {
            this.logger.error('Error generating embeddings:', error);
            throw error;
        }
    }

    /**
     * Sauvegarde les chunks dans MongoDB
     */
    async saveChunks(chunks: Partial<LegalDocChunk>[]): Promise<void> {
        try {
            await this.chunkRepository.save(chunks);
            this.logger.log(`Saved ${chunks.length} chunks to MongoDB.`);
        } catch (error) {
            this.logger.error('Error saving chunks:', error);
            throw error;
        }
    }

    /**
     * Recherche vectorielle dans MongoDB via Atlas Search
     */
    async searchSimilar(queryVector: number[], limit: number = 5, minScore: number = 0.7): Promise<LegalDocChunk[]> {
        try {
            // Note: This requires an Atlas Vector Search index named 'vector_index' on the 'legal_doc_chunks' collection
            /*
              Index Definition:
              {
                "fields": [
                  {
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": 1536,
                    "similarity": "cosine"
                  }
                ]
              }
            */

            const pipeline = [
                {
                    $vectorSearch: {
                        index: "vector_index",
                        path: "embedding",
                        queryVector: queryVector,
                        numCandidates: limit * 20, // Recommended to be higher than limit
                        limit: limit,
                    }
                },
                {
                    $project: {
                        _id: 1,
                        documentId: 1,
                        text: 1,
                        chunkIndex: 1,
                        metadata: 1,
                        score: { $meta: "vectorSearchScore" }
                    }
                }
            ];

            const results = await this.chunkRepository.aggregate(pipeline).toArray();
            this.logger.log(`Found ${results.length} similar chunks.`);

            // Filter by score optional if using cosine similarity which is already sorted
            // But good to have a threshold
            return results; // Note: vectorSearchScore signals similarity
        } catch (error) {
            // Fallback or specific error handling if index doesn't exist
            this.logger.error(`Vector search failed: ${error.message}`);

            // Fallback logic could go here if using a standard search or warning
            if (error.message.includes('PlanExecutor error')) {
                this.logger.warn('Make sure the Atlas Vector Search index "vector_index" is created on "legal_doc_chunks" collection.');
            }

            throw error;
        }
    }
}
