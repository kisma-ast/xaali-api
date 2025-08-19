import { Injectable, Logger } from '@nestjs/common';
import { AI_CONFIG } from '../config';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openaiApiKey: string;

  constructor() {
    if (!AI_CONFIG.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    this.openaiApiKey = AI_CONFIG.OPENAI_API_KEY;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.log(`🧠 Génération d'embedding avec le modèle: ${AI_CONFIG.MODELS.EMBEDDING}`);
      
      // Créer un AbortController pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-ada-002', // 1024 dimensions pour Pinecone
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;
      this.logger.log(`✅ Embedding généré avec succès: ${embedding.length} dimensions`);
      return embedding;
    } catch (error) {
      this.logger.error('Error generating embedding:', error);
      
      // Gestion spécifique des erreurs de timeout
      if (error.name === 'AbortError') {
        throw new Error('OpenAI API request timed out after 30 seconds');
      }
      
      // Gestion des erreurs de connexion
      if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('timeout')) {
        throw new Error('Connection timeout to OpenAI API. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      // Créer un AbortController pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 secondes pour les batch

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: 'text-embedding-ada-002',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      this.logger.error('Error generating embeddings:', error);
      
      // Gestion spécifique des erreurs de timeout
      if (error.name === 'AbortError') {
        throw new Error('OpenAI API request timed out after 60 seconds');
      }
      
      // Gestion des erreurs de connexion
      if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('timeout')) {
        throw new Error('Connection timeout to OpenAI API. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  // Méthode utilitaire pour valider la configuration
  validateConfig(): boolean {
    if (!this.openaiApiKey) {
      this.logger.error('OpenAI API key is not configured');
      return false;
    }
    return true;
  }
}
