import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from './citizen.entity';
import { RAGOrchestratorService, RAGQuery } from './rag-orchestrator.service';
import { AiQuestion } from './ai-question.entity';
import { Case } from './case.entity';

@Injectable()
export class CitizensService {
  private readonly logger = new Logger(CitizensService.name);

  constructor(
    @InjectRepository(Citizen)
    private citizensRepository: Repository<Citizen>,
    @InjectRepository(AiQuestion)
    private aiQuestionsRepository: Repository<AiQuestion>,
    @InjectRepository(Case)
    private casesRepository: Repository<Case>,
    private readonly ragService: RAGOrchestratorService,
  ) {
    this.logger.log('🏛️ CitizensService initialisé avec RAG');
  }

  async createCitizen(): Promise<Citizen> {
    const citizen = this.citizensRepository.create({
      questionsAsked: 0,
      hasPaid: false,
    });
    return await this.citizensRepository.save(citizen);
  }

  async getCitizen(id: string): Promise<Citizen | null> {
    return await this.citizensRepository.findOne({ where: { id } });
  }

  async canAskQuestion(citizenId: string): Promise<boolean> {
    const citizen = await this.getCitizen(citizenId);
    return citizen !== null && citizen.questionsAsked < 2;
  }

  async askQuestion(citizenId: string, question: string, category?: string): Promise<AiQuestion> {
    const citizen = await this.getCitizen(citizenId);
    if (!citizen || citizen.questionsAsked >= 2) {
      throw new Error('Question limit reached');
    }

    this.logger.log(`👤 Question citoyen ${citizenId}: "${question}"`);

    try {
      // Utiliser le RAG pour générer une réponse optimisée
      const ragQuery: RAGQuery = {
        question,
        userId: citizenId,
        context: category,
        maxResults: 5,
        minScore: 0.7,
      };

      const ragResponse = await this.ragService.processRAGQuery(ragQuery);
      
      // Formater la réponse pour les citoyens
      const citizenFriendlyResponse = this.formatResponseForCitizen(ragResponse);

      const aiQuestion = this.aiQuestionsRepository.create({
        question,
        answer: citizenFriendlyResponse,
        citizenId,
        metadata: {
          confidence: ragResponse.confidence,
          processingTime: ragResponse.processingTime,
          sourcesCount: ragResponse.sources.length,
        },
      });

      // Incrémenter le compteur de questions
      citizen.questionsAsked += 1;
      await this.citizensRepository.save(citizen);

      this.logger.log(`✅ Réponse RAG générée pour citoyen ${citizenId}`);
      return await this.aiQuestionsRepository.save(aiQuestion);

    } catch (error) {
      this.logger.error(`❌ Erreur RAG pour citoyen ${citizenId}:`, error);
      
      // Fallback: réponse basique
      const fallbackResponse = `Je rencontre des difficultés techniques pour répondre à votre question "${question}". Veuillez consulter un avocat ou réessayer plus tard.`;
      
      const aiQuestion = this.aiQuestionsRepository.create({
        question,
        answer: fallbackResponse,
        citizenId,
        metadata: { error: true },
      });

      citizen.questionsAsked += 1;
      await this.citizensRepository.save(citizen);
      
      return await this.aiQuestionsRepository.save(aiQuestion);
    }
  }

  async getQuestionsHistory(citizenId: string): Promise<AiQuestion[]> {
    return await this.aiQuestionsRepository.find({
      where: { citizenId },
      order: { createdAt: 'DESC' },
    });
  }

  async createCase(citizenId: string, title: string, description: string): Promise<Case> {
    const citizen = await this.getCitizen(citizenId);
    if (!citizen) {
      throw new Error('Citizen not found');
    }

    const case_ = this.casesRepository.create({
      title,
      description,
      citizenId,
      status: 'pending',
      isPaid: false,
      paymentAmount: 5000,
    });

    return await this.casesRepository.save(case_);
  }

  async markAsPaid(citizenId: string, paymentId: string): Promise<void> {
    const citizen = await this.getCitizen(citizenId);
    if (citizen) {
      citizen.hasPaid = true;
      citizen.paymentId = paymentId;
      await this.citizensRepository.save(citizen);
    }
  }

  async getCitizenCases(citizenId: string): Promise<Case[]> {
    return await this.casesRepository.find({
      where: { citizenId },
      relations: ['lawyer'],
      order: { createdAt: 'DESC' },
    });
  }

  // Nouvelle méthode pour obtenir des conseils juridiques personnalisés
  async getPersonalizedAdvice(citizenId: string, situation: string): Promise<any> {
    this.logger.log(`🎯 Conseil personnalisé pour citoyen ${citizenId}`);

    try {
      const ragQuery: RAGQuery = {
        question: `Conseil juridique pour la situation suivante: ${situation}`,
        userId: citizenId,
        context: 'conseil_personnalise',
        maxResults: 8,
        minScore: 0.6,
      };

      const ragResponse = await this.ragService.processRAGQuery(ragQuery);
      
      return {
        advice: ragResponse.answer,
        confidence: ragResponse.confidence,
        sources: ragResponse.sources.map(s => ({
          title: s.source,
          relevance: (s.score * 100).toFixed(1) + '%',
        })),
        nextSteps: ragResponse.answer.nextSteps || [],
        relatedTopics: ragResponse.answer.relatedTopics || [],
      };

    } catch (error) {
      this.logger.error('❌ Erreur conseil personnalisé:', error);
      throw new Error('Impossible de générer un conseil personnalisé');
    }
  }

  // Méthode pour formater la réponse RAG pour les citoyens
  private formatResponseForCitizen(ragResponse: any): string {
    const answer = ragResponse.answer;
    
    // En-tête RAG visible
    let formattedResponse = `🤖 **Réponse générée par Xaali-AI**\n`;
    formattedResponse += `🌐 *Powered by: ${answer.ragMetadata?.poweredBy || 'Xaali-AI'}*\n\n`;
    
    formattedResponse += `📋 **${answer.title}**\n\n`;
    formattedResponse += `${answer.content}\n\n`;
    
    if (answer.articles && answer.articles.length > 0) {
      formattedResponse += `📚 **Sources juridiques (${answer.articles.length}):**\n`;
      answer.articles.forEach((article: any, index: number) => {
        const sourceIcon = article.source === 'Pinecone' ? '🌲' : '🌐';
        const relevance = article.relevanceScore ? ` (${article.relevanceScore})` : '';
        formattedResponse += `${index + 1}. ${sourceIcon} ${article.title}${relevance}\n`;
      });
      formattedResponse += `\n`;
    }
    
    if (answer.nextSteps && answer.nextSteps.length > 0) {
      formattedResponse += `✅ **Prochaines étapes:**\n`;
      answer.nextSteps.forEach((step: string, index: number) => {
        formattedResponse += `${index + 1}. ${step}\n`;
      });
      formattedResponse += `\n`;
    }
    
    // Métadonnées RAG visibles
    formattedResponse += `💡 **Résumé:** ${answer.summary}\n\n`;
    formattedResponse += `🎯 **Confiance RAG:** ${answer.confidence}\n`;
    formattedResponse += `⏱️ **Temps de traitement:** ${ragResponse.processingTime}ms\n`;
    formattedResponse += `🔍 **Sources Pinecone:** ${ragResponse.sources?.filter((s: any) => s.type === 'pinecone').length || 0}\n`;
    formattedResponse += `🌐 **Sources Web:** ${ragResponse.sources?.filter((s: any) => s.type === 'web').length || 0}\n\n`;
    
    formattedResponse += `⚠️ **Important:** ${answer.disclaimer}\n\n`;
    formattedResponse += `🔄 *Généré le ${new Date().toLocaleString('fr-FR')} par ${answer.ragMetadata?.systemVersion || 'Xaali RAG'}*`;
    
    return formattedResponse;
  }
} 