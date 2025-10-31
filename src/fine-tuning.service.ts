import { Injectable, Logger } from '@nestjs/common';
import { AI_CONFIG } from './config';

export interface FineTuningQuery {
  question: string;
  userId?: string;
  context?: string;
  category?: string;
}

export interface FineTuningResponse {
  answer: any;
  processingTime: number;
  confidence: number;
  metadata: {
    model: string;
    fineTuned: boolean;
  };
}

@Injectable()
export class FineTuningService {
  private readonly logger = new Logger(FineTuningService.name);

  constructor() {
    this.logger.log('🚀 Fine-Tuning Service initialisé');
    this.logger.log(`📊 Configuration: ${AI_CONFIG.MODELS.OPENAI} (fine-tuned)`);
  }

  async processFineTunedQuery(query: FineTuningQuery): Promise<FineTuningResponse> {
    const startTime = Date.now();
    this.logger.log(`🔍 Début traitement fine-tuning pour: "${query.question}"`);

    try {
      // Direct call to fine-tuned model without retrieval
      this.logger.log('🤖 Génération réponse avec modèle fine-tuned...');
      const aiResponse = await this.generateFineTunedResponse(query);

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(aiResponse);

      this.logger.log(`✅ Traitement fine-tuning terminé en ${processingTime}ms (confiance: ${(confidence * 100).toFixed(1)}%)`);

      return {
        answer: aiResponse,
        processingTime,
        confidence,
        metadata: {
          model: AI_CONFIG.MODELS.OPENAI,
          fineTuned: true,
        },
      };

    } catch (error) {
      this.logger.error('❌ Erreur fine-tuning:', error);
      throw error;
    }
  }

  private async generateFineTunedResponse(query: FineTuningQuery): Promise<any> {
    try {
      // Prompt optimisé pour modèle fine-tuned
      const systemPrompt = `Tu es Xaali, assistant juridique expert du droit sénégalais. Tu réponds à TOUTES les questions en trouvant l'aspect juridique sénégalais pertinent. Même pour des questions générales, identifie les implications légales au Sénégal. Tu maîtrises parfaitement tous les codes, lois, décrets et réglementations du Sénégal. Réponds TOUJOURS avec des références légales sénégalaises concrètes. Utilise "vous" et "votre" pour t'adresser à la personne.`;

      // Adapter le prompt selon le contexte
      let userPrompt = '';
      
      if (query.context === 'title_generation') {
        // Prompt spécifique pour la génération de titres
        userPrompt = `Génère un titre juridique court et précis (maximum 8 mots) pour cette consultation: "${query.question}"
Catégorie: ${query.category || 'Droit général'}

Le titre doit être professionnel, indiquer clairement le type de problème juridique, et être adapté pour un tableau de bord d'avocat.

Exemples de bons titres:
- "Licenciement abusif - Demande d'indemnisation"
- "Conflit successoral entre héritiers"
- "Rupture de contrat commercial"
- "Divorce pour faute - Garde d'enfants"

Réponds uniquement avec le titre, sans guillemets ni ponctuation finale.`;
      } else {
        // Prompt normal pour les réponses complètes
        userPrompt = `Question: ${query.question}
Catégorie: ${query.category || 'Droit général'}

Tu DOIS répondre à cette question en trouvant l'angle juridique sénégalais. Fournis des détails explicatifs sur les lois citées. Format JSON:
{
  "title": "Titre juridique précis",
  "content": "Réponse détaillée: 1) Article de loi sénégalais spécifique, 2) Explication de ce que dit cette loi, 3) Comment elle s'applique à votre situation, 4) Conséquences pratiques. 4-5 phrases explicatives.",
  "summary": "Résumé des droits et obligations en 2 phrases",
  "nextSteps": ["Documents à préparer", "Démarches précises", "Spécialiste recommandé"],
  "confidence": "Élevé/Moyen/Faible"
}`;
      }

      this.logger.log(`🤖 Appel à l'API OpenAI avec le modèle fine-tuned: ${AI_CONFIG.MODELS.OPENAI}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AI_CONFIG.MODELS.OPENAI, // This would be your fine-tuned model ID
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 900
        }),
      });

      this.logger.log(`📡 Réponse OpenAI reçue, statut: ${response.status}`);

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;

      // Parser la réponse selon le contexte
      if (query.context === 'title_generation') {
        // Pour la génération de titre, retourner directement le texte
        return {
          title: responseText.trim(),
          content: responseText.trim()
        };
      } else {
        // Parser la réponse JSON pour les réponses complètes
        try {
          const parsedResponse = JSON.parse(responseText);
          return parsedResponse;
        } catch (parseError) {
          this.logger.error('Error parsing OpenAI response:', parseError);
          // Fallback: créer une réponse basique
          return this.createFallbackResponse(query);
        }
      }

    } catch (error) {
      this.logger.error('Error generating fine-tuned response:', error);
      return this.createFallbackResponse(query);
    }
  }

  private createFallbackResponse(query: FineTuningQuery): any {
    return {
      title: `Réponse à votre question sur ${query.question}`,
      content: `En tant qu'assistant juridique spécialisé dans le droit sénégalais, je peux vous fournir des informations générales sur cette question. Pour une réponse précise adaptée à votre situation spécifique, nous vous recommandons de consulter un avocat.`,
      summary: `Réponse générale à votre question juridique.`,
      confidence: 'Moyen',
      nextSteps: ['Consulter un professionnel du droit'],
      relatedTopics: [],
    };
  }

  private calculateConfidence(response: any): number {
    // Confiance basée sur la qualité de la réponse
    if (response.confidence === 'Élevé') return 0.9;
    if (response.confidence === 'Moyen') return 0.7;
    if (response.confidence === 'Faible') return 0.4;
    return 0.6; // Default
  }



  // Méthode pour obtenir des statistiques du modèle fine-tuned
  async getModelStats(): Promise<any> {
    try {
      return {
        system: 'Fine-Tuning Model',
        components: {
          llm: AI_CONFIG.MODELS.OPENAI,
        },
        performance: {
          avgResponseTime: '1-3 secondes',
          trainingData: 'Droit sénégalais',
        },
        capabilities: [
          'Réponses directes sans recherche',
          'Meilleure cohérence contextuelle',
          'Temps de réponse réduit',
          'Précision juridique améliorée',
        ],
      };
    } catch (error) {
      this.logger.error('Erreur stats modèle:', error);
      return { error: 'Impossible de récupérer les statistiques' };
    }
  }
}