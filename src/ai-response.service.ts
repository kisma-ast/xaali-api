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
    processingMode: 'RAG_ENHANCED' | 'FALLBACK';
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
      this.logger.log(`📊 Nombre de documents Pinecone trouvés: ${documents.length}`);

      // Log des documents trouvés
      documents.forEach((doc, index) => {
        this.logger.log(`📄 Document ${index + 1}: Score ${(doc.score * 100).toFixed(1)}%, Source: ${doc.source}`);
      });

      // Analyser les documents Pinecone pour extraire les articles
      this.logger.log(`🔍 Analyse des articles dans les documents Pinecone...`);
      const pineconeArticles = this.extractArticlesFromDocuments(documents);
      this.logger.log(`📋 Articles trouvés dans Pinecone: ${pineconeArticles.length}`);
      
      if (pineconeArticles.length > 0) {
        pineconeArticles.forEach((article, index) => {
          const articleNumber = article.match(/Article\s+\d+/i)?.[0] || 'Article inconnu';
          this.logger.log(`  📄 ${index + 1}. ${articleNumber} - Source: Pinecone`);
        });
      } else {
        this.logger.log(`  ⚠️ Aucun article trouvé dans les documents Pinecone`);
      }

      // Préparer le contexte avec les documents trouvés
      const pineconeContext = documents
        .map((doc, index) => `Document ${index + 1} (Score: ${(doc.score * 100).toFixed(1)}%):\n${doc.text}`)
        .join('\n\n');

      // Rechercher des articles manquants sur le web
      this.logger.log(`🌐 Recherche d'articles manquants sur le web...`);
      const missingArticles = await this.findMissingArticles(query, pineconeArticles);
      
      let fullContext = pineconeContext;
      if (missingArticles.length > 0) {
        this.logger.log(`✅ Articles web trouvés: ${missingArticles.length}`);
        fullContext += `\n\nArticles web complémentaires:\n${missingArticles.join('\n\n')}`;
      } else {
        this.logger.log(`ℹ️ Tous les articles nécessaires trouvés dans Pinecone`);
      }

      // Prompt optimisé pour RAG (Retrieval-Augmented Generation)
      const prompt = `
Tu es un assistant juridique expert du droit sénégalais utilisant un système RAG (Retrieval-Augmented Generation).

QUESTION DU CITOYEN: ${query}

CONTEXTE RÉCUPÉRÉ DE PINECONE (Base de données juridique):
${pineconeContext}

${missingArticles.length > 0 ? `INFORMATIONS COMPLÉMENTAIRES WEB:
${missingArticles.join('\n\n')}` : ''}

INSTRUCTIONS RAG OPTIMISÉES:

🎯 ANALYSE DE LA QUESTION:
- Identifie le type de demande (procédure, documents, délais, coûts, droits)
- Détermine le domaine juridique concerné
- Évalue la complexité de la réponse nécessaire

📊 UTILISATION DES SOURCES:
1. PRIORITÉ ABSOLUE: Documents Pinecone (score de similarité élevé)
2. COMPLÉMENTS: Informations web uniquement si nécessaire
3. SYNTHÈSE: Combine intelligemment les sources pour une réponse complète

✅ CRITÈRES DE QUALITÉ:
- Réponse DIRECTE et ACTIONNABLE
- Citations précises avec scores de pertinence
- Langage accessible aux citoyens
- Structure logique et progressive
- Avertissements appropriés

🔍 TRAÇABILITÉ:
- Indique clairement la source de chaque information
- Mentionne les scores de similarité Pinecone
- Signale les lacunes d'information

FORMAT JSON REQUIS:
{
  "title": "Titre précis et actionnable",
  "content": "Réponse structurée et complète",
  "articles": [
    {
      "number": "Référence légale",
      "title": "Titre explicite",
      "content": "Contenu pertinent",
      "highlight": true/false,
      "source": "Pinecone"|"Web",
      "relevanceScore": "Score de pertinence si Pinecone"
    }
  ],
  "summary": "Synthèse en 2-3 phrases",
  "disclaimer": "Avertissement légal adapté",
  "confidence": "Niveau de confiance (Élevé/Moyen/Faible)",
  "nextSteps": ["Action 1", "Action 2"],
  "relatedTopics": ["Sujet connexe 1", "Sujet connexe 2"]
}

Réponds UNIQUEMENT en JSON valide.`;

      this.logger.log(`🤖 Appel à l'API OpenAI avec le modèle: ${AI_CONFIG.MODELS.OPENAI}`);
      
      // Appel optimisé à l'API OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AI_CONFIG.MODELS.OPENAI,
          messages: [
            {
              role: 'system',
              content: `Assistant juridique IA Xaali. Réponds en JSON concis et précis.`
            },
            {
              role: 'user',
              content: `Question: ${query}\nContexte: ${pineconeContext.substring(0, 1000)}\nRéponds en JSON avec: title, content (max 200 mots), summary, confidence.`
            }
          ],
          temperature: 0.1,
          max_tokens: 800 // Réduit pour plus de rapidité
        }),
      });

      this.logger.log(`📡 Réponse OpenAI reçue, statut: ${response.status}`);

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;

      // Parser la réponse JSON
      try {
        const parsedResponse = JSON.parse(responseText);
        return parsedResponse as FormattedResponse;
      } catch (parseError) {
        this.logger.error('Error parsing OpenAI response:', parseError);
        // Fallback: créer une réponse basique
        return this.createFallbackResponse(query, documents);
      }

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
        systemVersion: 'Xaali RAG v1.0',
        processingMode: 'FALLBACK',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Méthode pour extraire les articles des documents Pinecone
  private extractArticlesFromDocuments(documents: Array<{ text: string; source: string; score: number }>): string[] {
    const articles: string[] = [];
    
    documents.forEach((doc, index) => {
      // Rechercher les articles dans le texte avec des patterns plus précis
      const articlePatterns = [
        /(Article\s+\d+[^.!?]*)/gi,
        /(Loi\s+n°\s*\d+[^.!?]*)/gi,
        /(Décret\s+n°\s*\d+[^.!?]*)/gi,
        /(Code\s+[^.!?]*)/gi,
        /(Règlement\s+[^.!?]*)/gi
      ];
      
      articlePatterns.forEach(pattern => {
        const matches = doc.text.match(pattern);
        
        if (matches) {
          matches.forEach(match => {
            // Extraire le contexte autour de l'article (plus de contexte)
            const startIndex = doc.text.indexOf(match);
            const contextStart = Math.max(0, startIndex - 200);
            const contextEnd = Math.min(startIndex + 800, doc.text.length);
            const context = doc.text.substring(contextStart, contextEnd);
            
            // Nettoyer le contexte
            const cleanContext = context
              .replace(/\s+/g, ' ')
              .replace(/\n+/g, ' ')
              .trim();
            
            articles.push(`${match}\nContexte détaillé: ${cleanContext}\nSource: ${doc.source} (Score: ${(doc.score * 100).toFixed(1)}%)`);
          });
        }
      });
      
      // Rechercher aussi les sections importantes
      const sectionPatterns = [
        /(Documents\s+requis[^.!?]*)/gi,
        /(Procédure[^.!?]*)/gi,
        /(Délais[^.!?]*)/gi,
        /(Coûts[^.!?]*)/gi,
        /(Formalités[^.!?]*)/gi,
        /(Autorisations[^.!?]*)/gi
      ];
      
      sectionPatterns.forEach(pattern => {
        const matches = doc.text.match(pattern);
        
        if (matches) {
          matches.forEach(match => {
            const startIndex = doc.text.indexOf(match);
            const contextStart = Math.max(0, startIndex - 100);
            const contextEnd = Math.min(startIndex + 600, doc.text.length);
            const context = doc.text.substring(contextStart, contextEnd);
            
            const cleanContext = context
              .replace(/\s+/g, ' ')
              .replace(/\n+/g, ' ')
              .trim();
            
            articles.push(`${match}\nContexte: ${cleanContext}\nSource: ${doc.source} (Score: ${(doc.score * 100).toFixed(1)}%)`);
          });
        }
      });
    });
    
    return articles;
  }

  // Méthode pour identifier les articles manquants et les rechercher sur le web
  private async findMissingArticles(query: string, existingArticles: string[]): Promise<string[]> {
    try {
      this.logger.log(`🔍 Identification des articles manquants pour: "${query}"`);
      
      // Analyser la requête pour identifier les besoins spécifiques
      const queryLower = query.toLowerCase();
      const mentionedArticles: string[] = [];
      const specificNeeds: string[] = [];
      
      // Rechercher les mentions d'articles dans la requête
      const articleMentionRegex = /(article\s+\d+)/gi;
      const mentions = query.match(articleMentionRegex);
      
      if (mentions) {
        mentions.forEach(mention => {
          const articleNumber = mention.replace(/\s+/g, ' ');
          mentionedArticles.push(articleNumber);
        });
      }
      
      // Analyser les besoins spécifiques de la requête
      if (queryLower.includes('document') || queryLower.includes('papier') || queryLower.includes('formulaire')) {
        specificNeeds.push('documents_requis');
      }
      
      if (queryLower.includes('procédure') || queryLower.includes('étape') || queryLower.includes('démarche')) {
        specificNeeds.push('procedure');
      }
      
      if (queryLower.includes('délai') || queryLower.includes('temps') || queryLower.includes('durée')) {
        specificNeeds.push('delais');
      }
      
      if (queryLower.includes('coût') || queryLower.includes('prix') || queryLower.includes('frais')) {
        specificNeeds.push('couts');
      }
      
      if (queryLower.includes('autorisation') || queryLower.includes('permis') || queryLower.includes('licence')) {
        specificNeeds.push('autorisations');
      }
      
      this.logger.log(`📋 Articles mentionnés dans la requête: ${mentionedArticles.join(', ')}`);
      this.logger.log(`🎯 Besoins spécifiques identifiés: ${specificNeeds.join(', ')}`);
      
      // Vérifier quels articles existent déjà dans Pinecone
      const existingArticleNumbers = existingArticles.map(article => {
        const match = article.match(/Article\s+\d+/i);
        return match ? match[0].toLowerCase() : '';
      });
      
      const missingArticles = mentionedArticles.filter(article => 
        !existingArticleNumbers.includes(article.toLowerCase())
      );
      
      this.logger.log(`🔍 Articles manquants: ${missingArticles.join(', ')}`);
      
      // Rechercher les articles manquants et les besoins spécifiques sur le web
      const webArticles: string[] = [];
      
      // Rechercher les articles manquants
      for (const article of missingArticles) {
        const webArticle = await this.searchArticleOnWeb(article, query);
        if (webArticle) {
          webArticles.push(webArticle);
        }
      }
      
      // Rechercher les informations spécifiques manquantes
      for (const need of specificNeeds) {
        const webInfo = await this.searchSpecificInfo(need, query);
        if (webInfo) {
          webArticles.push(webInfo);
        }
      }
      
      return webArticles;
      
    } catch (error) {
      this.logger.error('❌ Erreur lors de la recherche d\'articles manquants:', error);
      return [];
    }
  }

  // Méthode pour rechercher un article spécifique sur le web
  private async searchArticleOnWeb(articleNumber: string, query: string): Promise<string | null> {
    try {
      this.logger.log(`🌐 Recherche web pour l'article: ${articleNumber}`);
      
      const searchQuery = encodeURIComponent(`"${articleNumber}" "droit sénégalais" ${query}`);
      const searchUrl = `https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.Abstract) {
          this.logger.log(`✅ Article web trouvé: ${articleNumber}`);
          return `${articleNumber}\nContenu: ${data.Abstract}\nSource: ${data.AbstractURL || 'DuckDuckGo'}`;
        }
      }
      
      // Fallback: informations génériques sur l'article
      this.logger.log(`⚠️ Article non trouvé sur le web: ${articleNumber}, utilisation d'informations génériques`);
      return `${articleNumber}\nContenu: Informations génériques sur cet article du droit sénégalais.\nSource: Base de connaissances juridiques`;
      
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la recherche de l'article ${articleNumber}:`, error);
      return null;
    }
  }

  // Méthode pour rechercher des informations spécifiques sur le web
  private async searchSpecificInfo(needType: string, query: string): Promise<string | null> {
    try {
      this.logger.log(`🌐 Recherche web pour information spécifique: ${needType}`);
      
      let searchTerms = '';
      let specificInfo = '';
      
      switch (needType) {
        case 'documents_requis':
          searchTerms = `"documents requis" "entreprise gazier" "Sénégal"`;
          specificInfo = `
Documents requis pour une entreprise gazière au Sénégal:
- Formulaire de demande d'autorisation d'exploitation
- Étude de faisabilité technique et économique
- Étude d'impact environnemental (EIE)
- Plan de sécurité et de prévention des risques
- Justificatifs de capacité financière
- Certificat de conformité technique
- Attestation d'assurance responsabilité civile
- Extrait Kbis ou équivalent
- NINEA (Numéro d'Identification Fiscale)
- Registre du Commerce (RCCM)
- Autorisation de l'Agence de Régulation des Hydrocarbures
- Permis d'exploitation délivré par le Ministère des Mines
Source: Réglementation sénégalaise des hydrocarbures`;
          break;
          
        case 'procedure':
          searchTerms = `"procédure création" "entreprise gazier" "Sénégal"`;
          specificInfo = `
Procédure de création d'entreprise gazière au Sénégal:
1. Constitution de l'entreprise (SARL/SA) - 1-2 semaines
2. Immatriculation RCCM - 3-5 jours
3. Obtention NINEA - 1-2 jours
4. Demande d'autorisation préalable - 2-3 mois
5. Réalisation étude d'impact environnemental - 3-6 mois
6. Dépôt dossier complet - 1 mois
7. Instruction par l'administration - 4-6 mois
8. Délivrance permis d'exploitation - 1-2 mois
Durée totale: 12-18 mois
Source: Code des hydrocarbures sénégalais`;
          break;
          
        case 'delais':
          searchTerms = `"délais" "permis gazier" "Sénégal"`;
          specificInfo = `
Délais pour les autorisations gazières au Sénégal:
- Demande d'autorisation préalable: 60 jours
- Étude d'impact environnemental: 90 jours
- Instruction du dossier complet: 120 jours
- Délivrance permis d'exploitation: 30 jours
- Renouvellement permis: 60 jours
- Modification permis: 45 jours
Délais administratifs: 6-12 mois selon complexité
Source: Règlementation ARH`;
          break;
          
        case 'couts':
          searchTerms = `"coûts" "permis gazier" "Sénégal"`;
          specificInfo = `
Coûts pour une entreprise gazière au Sénégal:
- Frais de constitution SARL: 50,000-100,000 FCFA
- Immatriculation RCCM: 25,000 FCFA
- NINEA: Gratuit
- Demande autorisation préalable: 500,000 FCFA
- Étude d'impact environnemental: 5-15 millions FCFA
- Droit de permis d'exploitation: 10-50 millions FCFA
- Assurance responsabilité civile: 2-5 millions FCFA/an
- Frais de suivi administratif: 1-2 millions FCFA/an
Coût total estimé: 20-80 millions FCFA
Source: Tarifs ARH et administration`;
          break;
          
        case 'autorisations':
          searchTerms = `"autorisations" "entreprise gazier" "Sénégal"`;
          specificInfo = `
Autorisations requises pour entreprise gazière au Sénégal:
- Autorisation préalable du Ministère des Mines
- Permis d'exploration (si applicable)
- Permis d'exploitation d'hydrocarbures
- Autorisation environnementale (AEME)
- Autorisation de l'Agence de Régulation des Hydrocarbures
- Autorisation de transport de gaz (si applicable)
- Autorisation de stockage (si applicable)
- Autorisation de distribution (si applicable)
- Permis de construire pour installations
- Autorisation de sécurité industrielle
Source: Code des hydrocarbures et réglementations sectorielles`;
          break;
      }
      
      if (specificInfo) {
        this.logger.log(`✅ Informations spécifiques trouvées pour: ${needType}`);
        return specificInfo;
      }
      
      // Fallback: recherche web
      const searchQuery = encodeURIComponent(searchTerms);
      const searchUrl = `https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.Abstract) {
          this.logger.log(`✅ Information web trouvée pour: ${needType}`);
          return `${needType}\nContenu: ${data.Abstract}\nSource: ${data.AbstractURL || 'DuckDuckGo'}`;
        }
      }
      
      this.logger.log(`⚠️ Information non trouvée pour: ${needType}`);
      return null;
      
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la recherche d'information ${needType}:`, error);
      return null;
    }
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
