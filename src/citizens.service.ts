import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from './citizen.entity';
import { AiQuestion } from './ai-question.entity';
import { Case } from './case.entity';

@Injectable()
export class CitizensService {
  constructor(
    @InjectRepository(Citizen)
    private citizensRepository: Repository<Citizen>,
    @InjectRepository(AiQuestion)
    private aiQuestionsRepository: Repository<AiQuestion>,
    @InjectRepository(Case)
    private casesRepository: Repository<Case>,
  ) {}

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

  async askQuestion(citizenId: string, question: string): Promise<AiQuestion> {
    const citizen = await this.getCitizen(citizenId);
    if (!citizen || citizen.questionsAsked >= 2) {
      throw new Error('Question limit reached');
    }

    // Simuler une réponse IA (à remplacer par un vrai service IA)
    const aiResponse = `Réponse IA à: ${question}`;

    const aiQuestion = this.aiQuestionsRepository.create({
      question,
      answer: aiResponse,
      citizenId,
    });

    // Incrémenter le compteur de questions
    citizen.questionsAsked += 1;
    await this.citizensRepository.save(citizen);

    return await this.aiQuestionsRepository.save(aiQuestion);
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
} 