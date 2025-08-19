import { Injectable, Logger } from '@nestjs/common';
import { PineconeService } from './pinecone/pinecone.service';
import { EmbeddingService } from './pinecone/embedding.service';
import { AIResponseService, FormattedResponse } from './ai-response.service';
import { AI_CONFIG } from './config';

export interface RAGQuery {
  question: string;
  userId?: string;
  context?: string;
  maxResults?: number;
  minScore?: number;
}

export interface RAGResponse {
  answer: FormattedResponse;
  sources: Array<{
    id: string;
    content: string;
    score: number;
    source: string;
    type: 'pinecone' | 'web' | 'knowledge';
  }>;
  processingTime: number;
  confidence: number;
  metadata: {
    pineconeHits: number;
    webSearchUsed: boolean;
    embeddingDimensions: number;
    model: string;
  };
}

@Injectable()
export class RAGOrchestratorService {
  private readonly logger = new Logger(RAGOrchestratorService.name);

  constructor(
    private readonly pineconeService: PineconeService,
    private readonly embeddingService: EmbeddingService,
    private readonly aiResponseService: AIResponseService,
  ) {
    this.logger.log('🚀 RAG Orchestrator Service initialisé');
    this.logger.log(`📊 Configuration: ${AI_CONFIG.MODELS.OPENAI} + Pinecone`);
  }

  async processRAGQuery(query: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();
    this.logger.log(`🔍 Début traitement RAG pour: "${query.question}"`);

    try {
      // 1. Analyse et préparation de la requête
      const processedQuery = await this.preprocessQuery(query.question);
      this.logger.log(`🧠 Requête analysée: "${processedQuery}"`);

      // 2. Génération de l'embedding
      this.logger.log('🔢 Génération embedding...');
      const embedding = await this.embeddingService.generateEmbedding(processedQuery);
      this.logger.log(`✅ Embedding généré: ${embedding.length} dimensions`);

      // 3. Recherche dans Pinecone avec scoring intelligent
      this.logger.log('🌲 Recherche Pinecone...');
      const pineconeResults = await this.searchPineconeWithScoring(
        embedding,
        query.maxResults || 5,
        query.minScore || 0.7
      );
      this.logger.log(`📊 Pinecone: ${pineconeResults.length} résultats pertinents`);

      // 4. Évaluation de la qualité des résultats
      const qualityScore = this.evaluateResultsQuality(pineconeResults);
      this.logger.log(`📈 Score qualité: ${(qualityScore * 100).toFixed(1)}%`);

      // 5. Recherche complémentaire si nécessaire
      let webResults: any[] = [];
      if (qualityScore < 0.8 || pineconeResults.length < 2) {
        this.logger.log('🌐 Recherche web complémentaire...');
        webResults = await this.performWebSearch(query.question);
        this.logger.log(`🔍 Web: ${webResults.length} résultats complémentaires`);
      }

      // 6. Fusion et ranking des sources
      const rankedSources = this.rankAndFuseSources(pineconeResults, webResults);
      this.logger.log(`🎯 Sources finales: ${rankedSources.length} documents`);

      // 7. Génération de la réponse avec OpenAI
      this.logger.log('🤖 Génération réponse OpenAI...');
      const aiResponse = await this.generateEnhancedResponse(
        query.question,
        rankedSources,
        qualityScore
      );

      // 8. Calcul des métriques
      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(qualityScore, rankedSources.length);

      this.logger.log(`✅ RAG terminé en ${processingTime}ms (confiance: ${(confidence * 100).toFixed(1)}%)`);

      return {
        answer: aiResponse,
        sources: rankedSources,
        processingTime,
        confidence,
        metadata: {
          pineconeHits: pineconeResults.length,
          webSearchUsed: webResults.length > 0,
          embeddingDimensions: embedding.length,
          model: AI_CONFIG.MODELS.OPENAI,
        },
      };

    } catch (error) {
      this.logger.error('❌ Erreur RAG:', error);
      throw error;
    }
  }

  private async preprocessQuery(question: string): Promise<string> {
    // Nettoyage et optimisation de la requête
    let processed = question
      .toLowerCase()
      .trim()
      .replace(/[?!.]+$/, '') // Supprimer ponctuation finale
      .replace(/\s+/g, ' '); // Normaliser espaces

    // Expansion de la requête avec des termes juridiques pertinents
    const legalTerms = this.extractLegalTerms(processed);
    if (legalTerms.length > 0) {
      processed += ' ' + legalTerms.join(' ');
    }

    return processed;
  }

  private extractLegalTerms(query: string): string[] {
    const terms: string[] = [];
    
    // Mapping des termes courants vers des termes juridiques
    const termMapping = {
      'entreprise': ['société', 'SARL', 'SA', 'constitution'],
      'gazier': ['hydrocarbures', 'pétrole', 'gaz', 'énergie'],
      'permis': ['autorisation', 'licence', 'agrément'],
      'document': ['formulaire', 'dossier', 'pièce'],
      'procédure': ['démarche', 'formalité', 'étape'],
      'coût': ['frais', 'tarif', 'prix', 'montant'],
      'délai': ['durée', 'temps', 'échéance'],
    };

    Object.entries(termMapping).forEach(([key, synonyms]) => {
      if (query.includes(key)) {
        terms.push(...synonyms);
      }
    });

    return terms;
  }

  private async searchPineconeWithScoring(
    embedding: number[],
    maxResults: number,
    minScore: number
  ): Promise<any[]> {
    try {
      // Recherche avec score minimum
      const results = await this.pineconeService.searchSimilar(
        embedding,
        maxResults * 2, // Chercher plus pour filtrer ensuite
        undefined
      );

      // Filtrage par score et pertinence
      return results
        .filter(result => result.score >= minScore)
        .slice(0, maxResults)
        .map(result => ({
          id: result.id,
          content: result.metadata.text,
          score: result.score,
          source: result.metadata.source || 'Pinecone',
          type: 'pinecone' as const,
          metadata: result.metadata,
        }));

    } catch (error) {
      this.logger.error('Erreur recherche Pinecone:', error);
      return [];
    }
  }

  private evaluateResultsQuality(results: any[]): number {
    if (results.length === 0) return 0;

    // Score basé sur le nombre et la qualité des résultats
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const countFactor = Math.min(results.length / 3, 1); // Optimal: 3+ résultats
    
    return avgScore * countFactor;
  }

  private async performWebSearch(question: string): Promise<any[]> {
    try {
      // Recherche web simplifiée (peut être étendue avec des APIs réelles)
      const searchTerms = `"${question}" "droit sénégalais" "législation"`;
      
      // Simulation de résultats web (à remplacer par une vraie API)
      return [
        {
          id: 'web_1',
          content: `Information complémentaire sur: ${question}`,
          score: 0.6,
          source: 'Recherche Web',
          type: 'web' as const,
        }
      ];

    } catch (error) {
      this.logger.error('Erreur recherche web:', error);
      return [];
    }
  }

  private rankAndFuseSources(pineconeResults: any[], webResults: any[]): any[] {
    // Combiner et classer les sources par pertinence
    const allSources = [...pineconeResults, ...webResults];

    // Pondération: Pinecone > Web
    return allSources
      .map(source => ({
        ...source,
        finalScore: source.type === 'pinecone' 
          ? source.score * 1.0  // Poids normal pour Pinecone
          : source.score * 0.7  // Poids réduit pour Web
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 5); // Top 5 sources
  }

  private async generateEnhancedResponse(
    question: string,
    sources: any[],
    qualityScore: number
  ): Promise<FormattedResponse> {
    try {
      // Préparer le contexte enrichi
      const contextSources = sources.map((source, index) => ({
        text: source.content,
        source: source.source,
        score: source.score,
      }));

      // Utiliser le service AI existant avec contexte enrichi
      const response = await this.aiResponseService.generateFormattedResponse(
        question,
        contextSources
      );

      // Enrichir la réponse avec des métadonnées RAG
      return {
        ...response,
        confidence: qualityScore > 0.8 ? 'Élevé' : qualityScore > 0.6 ? 'Moyen' : 'Faible',
        nextSteps: this.generateNextSteps(question, sources),
        relatedTopics: this.generateRelatedTopics(question, sources),
        ragMetadata: {
          poweredBy: 'Xaali-AI',
          systemVersion: 'Xaali RAG v1.0',
          processingMode: 'RAG_ENHANCED',
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      this.logger.error('Erreur génération réponse:', error);
      throw error;
    }
  }

  private generateNextSteps(question: string, sources: any[]): string[] {
    const steps: string[] = [];
    
    if (question.toLowerCase().includes('entreprise')) {
      steps.push('Consulter un avocat spécialisé en droit des affaires');
      steps.push('Préparer les documents requis');
      steps.push('Déposer la demande auprès des autorités compétentes');
    }
    
    if (question.toLowerCase().includes('permis')) {
      steps.push('Vérifier les conditions d\'éligibilité');
      steps.push('Constituer le dossier complet');
      steps.push('Suivre l\'instruction administrative');
    }

    return steps.length > 0 ? steps : ['Consulter un professionnel du droit'];
  }

  private generateRelatedTopics(question: string, sources: any[]): string[] {
    const topics: string[] = [];
    
    if (question.toLowerCase().includes('gazier')) {
      topics.push('Réglementation des hydrocarbures');
      topics.push('Étude d\'impact environnemental');
      topics.push('Sécurité industrielle');
    }
    
    if (question.toLowerCase().includes('entreprise')) {
      topics.push('Fiscalité des entreprises');
      topics.push('Droit du travail');
      topics.push('Réglementation commerciale');
    }

    return topics;
  }

  private calculateConfidence(qualityScore: number, sourceCount: number): number {
    // Confiance basée sur la qualité et le nombre de sources
    const qualityFactor = qualityScore;
    const sourceFactor = Math.min(sourceCount / 3, 1);
    
    return (qualityFactor + sourceFactor) / 2;
  }

  // Méthode pour obtenir des statistiques RAG
  async getRAGStats(): Promise<any> {
    try {
      const pineconeStats = await this.pineconeService.getIndexStats();
      
      return {
        system: 'RAG (Retrieval-Augmented Generation)',
        components: {
          vectorDB: 'Pinecone',
          llm: AI_CONFIG.MODELS.OPENAI,
          embedding: AI_CONFIG.MODELS.EMBEDDING,
        },
        performance: {
          totalDocuments: pineconeStats.totalVectorCount || 0,
          dimensions: pineconeStats.dimension || 1024,
          avgResponseTime: '2-5 secondes',
        },
        capabilities: [
          'Recherche sémantique avancée',
          'Génération de réponses contextuelles',
          'Fusion multi-sources',
          'Scoring de pertinence',
          'Traçabilité des sources',
        ],
      };
    } catch (error) {
      this.logger.error('Erreur stats RAG:', error);
      return { error: 'Impossible de récupérer les statistiques' };
    }
  }
}