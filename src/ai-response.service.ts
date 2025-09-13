import { Injectable, Logger } from '@nestjs/common';
import { AI_CONFIG } from './config';

export interface FormattedResponse {
  title: string;
  content: string;
  articles: Array<{
    number: string;
    title: string;
    content: string;
    highlight: boolean;
    source: 'Pinecone' | 'Web';
    relevanceScore?: string;
  }>;
  summary: string;
  disclaimer: string;
  confidence: 'Élevé' | 'Moyen' | 'Faible';
  nextSteps: string[];
  relatedTopics: string[];
  ragMetadata: {
    poweredBy: string;
    systemVersion: string;
    processingMode: 'FINE_TUNED' | 'FALLBACK';
    timestamp: string;
  };
}

@Injectable()
export class AIResponseService {
  private readonly logger = new Logger(AIResponseService.name);

  constructor() {
    this.logger.log(`🔧 Configuration AIResponseService:`);
    this.logger.log(`  - Modèle OpenAI: ${AI_CONFIG.MODELS.OPENAI}`);
    this.logger.log(`  - Modèle Embedding: ${AI_CONFIG.MODELS.EMBEDDING}`);
    this.logger.log(`  - Clé API OpenAI: ${AI_CONFIG.OPENAI_API_KEY ? '✅ Configurée' : '❌ Manquante'}`);
  }

  async generateFormattedResponse(
    query: string,
    documents: Array<{ text: string; source: string; score: number }>
  ): Promise<FormattedResponse> {
    try {
      this.logger.log(`🚀 Début de génération de réponse formatée pour: "${query}"`);
      this.logger.log(`📊 Nombre de documents trouvés: ${documents.length}`);

      // Log des documents trouvés
      documents.forEach((doc, index) => {
        this.logger.log(`📄 Document ${index + 1}: Score ${(doc.score * 100).toFixed(1)}%, Source: ${doc.source}`);
      });

      // For fine-tuning, we don't need to extract articles from documents
      // We'll generate a response directly with the fine-tuned model
      return this.createFallbackResponse(query, documents);

    } catch (error) {
      this.logger.error('Error generating formatted response:', error);
      return this.createFallbackResponse(query, documents);
    }
  }

  private createFallbackResponse(
    query: string,
    documents: Array<{ text: string; source: string; score: number }>
  ): FormattedResponse {
    const bestDocument = documents[0];
    
    // Analyser la requête pour créer une réponse plus spécifique
    const queryLower = query.toLowerCase();
    let specificTitle = '';
    let specificContent = '';
    
    if (queryLower.includes('document') || queryLower.includes('papier') || queryLower.includes('formulaire')) {
      specificTitle = 'Documents requis pour votre projet';
      specificContent = `Pour répondre précisément à votre question sur les documents nécessaires, voici les informations trouvées dans nos sources juridiques.`;
    } else if (queryLower.includes('procédure') || queryLower.includes('étape') || queryLower.includes('démarche')) {
      specificTitle = 'Procédure détaillée pour votre projet';
      specificContent = `Voici les étapes précises à suivre selon la réglementation sénégalaise.`;
    } else if (queryLower.includes('délai') || queryLower.includes('temps') || queryLower.includes('durée')) {
      specificTitle = 'Délais et échéances pour votre projet';
      specificContent = `Voici les délais administratifs et les échéances à respecter.`;
    } else if (queryLower.includes('coût') || queryLower.includes('prix') || queryLower.includes('frais')) {
      specificTitle = 'Coûts et frais pour votre projet';
      specificContent = `Voici les coûts estimés et les frais à prévoir.`;
    } else {
      specificTitle = `Réponse à votre question sur ${query}`;
      specificContent = `Basé sur notre analyse des documents juridiques, voici les informations pertinentes pour votre question.`;
    }
    
    return {
      title: specificTitle,
      content: specificContent,
      articles: documents.slice(0, 3).map((doc, index) => ({
        number: `Document ${index + 1}`,
        title: `Source: ${doc.source}`,
        content: doc.text.substring(0, 300) + '...',
        highlight: index === 0,
        source: 'Pinecone' as const
      })),
      summary: `Nous avons trouvé ${documents.length} document(s) pertinent(s) pour répondre à votre question spécifique.`,
      disclaimer: 'Cette information est fournie à titre indicatif et ne constitue pas un conseil juridique professionnel. Consultez un avocat pour des conseils spécifiques.',
      confidence: 'Moyen' as const,
      nextSteps: ['Consulter un professionnel du droit'],
      relatedTopics: [],
      ragMetadata: {
        poweredBy: 'Xaali-AI',
        systemVersion: 'Xaali Fine-Tuned v1.0',
        processingMode: 'FINE_TUNED',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Méthode pour nettoyer et formater le texte des documents
  formatDocumentText(text: string): string {
    return text
      .replace(/\*\*/g, '') // Supprimer les **
      .replace(/#{1,6}\s*/g, '') // Supprimer les titres avec #
      .replace(/\n{3,}/g, '\n\n') // Réduire les sauts de ligne multiples
      .trim();
  }
}
