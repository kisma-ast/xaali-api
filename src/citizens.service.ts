import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from './citizen.entity';
import { FineTuningService, FineTuningQuery } from './fine-tuning.service'; // Changed import
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
    private readonly fineTuningService: FineTuningService, // Changed to fine-tuning service
  ) {
    this.logger.log('🏛️ CitizensService initialisé avec Fine-Tuning'); // Updated log
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
      // Use fine-tuning instead of RAG
      const fineTuningQuery: FineTuningQuery = {
        question,
        userId: citizenId,
        context: category,
        category,
      };

      const fineTuningResponse = await this.fineTuningService.processFineTunedQuery(fineTuningQuery);
      
      // Formater la réponse
      const citizenFriendlyResponse = this.formatResponseForCitizen(fineTuningResponse);

      const aiQuestion = this.aiQuestionsRepository.create({
        question,
        answer: citizenFriendlyResponse,
        citizenId,
        metadata: {
          confidence: fineTuningResponse.confidence,
          processingTime: fineTuningResponse.processingTime,
          sourcesCount: 0, // No sources in fine-tuning
        },
      });

      // Incrémenter le compteur de questions
      citizen.questionsAsked += 1;
      await this.citizensRepository.save(citizen);

      this.logger.log(`✅ Réponse fine-tuning générée pour citoyen ${citizenId}`);
      return await this.aiQuestionsRepository.save(aiQuestion);

    } catch (error) {
      this.logger.error(`❌ Erreur fine-tuning pour citoyen ${citizenId}:`, error);
      
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
      const fineTuningQuery: FineTuningQuery = {
        question: `Conseil juridique pour la situation suivante: ${situation}`,
        userId: citizenId,
        context: 'conseil_personnalise',
        category: 'conseil_personnalise',
      };

      const fineTuningResponse = await this.fineTuningService.processFineTunedQuery(fineTuningQuery);
      
      return {
        advice: fineTuningResponse.answer,
        confidence: fineTuningResponse.confidence,
        sources: [], // No sources in fine-tuning
        nextSteps: fineTuningResponse.answer.nextSteps || [],
        relatedTopics: fineTuningResponse.answer.relatedTopics || [],
      };

    } catch (error) {
      this.logger.error('❌ Erreur conseil personnalisé:', error);
      throw new Error('Impossible de générer un conseil personnalisé');
    }
  }

  // Méthode pour formater la réponse fine-tuning pour les citoyens
  private formatResponseForCitizen(fineTuningResponse: any): string {
    const answer = fineTuningResponse.answer;
    
    // En-tête fine-tuning visible
    let formattedResponse = `🤖 **Réponse générée par Xaali-AI (Modèle Fine-Tuned)**\n`;
    formattedResponse += `🌐 *Powered by: Fine-Tuned Model*\n\n`;
    
    formattedResponse += `📋 **${answer.title}**\n\n`;
    formattedResponse += `${answer.content}\n\n`;
    
    if (answer.nextSteps && answer.nextSteps.length > 0) {
      formattedResponse += `✅ **Prochaines étapes:**\n`;
      answer.nextSteps.forEach((step: string, index: number) => {
        formattedResponse += `${index + 1}. ${step}\n`;
      });
      formattedResponse += `\n`;
    }
    
    // Métadonnées fine-tuning visibles
    formattedResponse += `💡 **Résumé:** ${answer.summary}\n\n`;
    formattedResponse += `🎯 **Confiance:** ${answer.confidence}\n`;
    formattedResponse += `⏱️ **Temps de traitement:** ${fineTuningResponse.processingTime}ms\n\n`;
    
    formattedResponse += `⚠️ **Important:** Cette réponse est générée par un modèle d'intelligence artificielle spécialement entraîné sur le droit sénégalais. Pour des conseils juridiques précis adaptés à votre situation spécifique, nous vous recommandons de consulter un avocat.\n\n`;
    formattedResponse += `🔄 *Généré le ${new Date().toLocaleString('fr-FR')} par Xaali Fine-Tuning Model*`;
    
    return formattedResponse;
  }
}