import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { CitizensService } from './citizens.service';
import { Citizen } from './citizen.entity';
import { AiQuestion } from './ai-question.entity';
import { Case } from './case.entity';

@Controller('citizens')
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Post()
  async createCitizen(): Promise<{ citizen: Citizen; message: string }> {
    const citizen = await this.citizensService.createCitizen();
    return {
      citizen,
      message: 'Citizen created successfully. You can ask 2 questions for free.',
    };
  }

  @Get(':id')
  async getCitizen(@Param('id') id: string): Promise<Citizen> {
    const citizen = await this.citizensService.getCitizen(id);
    if (!citizen) {
      throw new HttpException('Citizen not found', HttpStatus.NOT_FOUND);
    }
    return citizen;
  }

  @Post(':id/questions')
  async askQuestion(
    @Param('id') citizenId: string,
    @Body() body: { question: string; category?: string },
  ): Promise<AiQuestion> {
    const canAsk = await this.citizensService.canAskQuestion(citizenId);
    if (!canAsk) {
      throw new HttpException(
        'Vous avez atteint la limite de 2 questions gratuites. Veuillez payer pour continuer.',
        HttpStatus.FORBIDDEN,
      );
    }

    return await this.citizensService.askQuestion(citizenId, body.question, body.category);
  }

  @Get(':id/questions')
  async getQuestionsHistory(@Param('id') citizenId: string): Promise<AiQuestion[]> {
    return await this.citizensService.getQuestionsHistory(citizenId);
  }

  @Post(':id/cases')
  async createCase(
    @Param('id') citizenId: string,
    @Body() body: { title: string; description: string },
  ): Promise<Case> {
    return await this.citizensService.createCase(citizenId, body.title, body.description);
  }

  @Post(':id/payment')
  async markAsPaid(
    @Param('id') citizenId: string,
    @Body() body: { paymentId: string },
  ): Promise<{ message: string }> {
    await this.citizensService.markAsPaid(citizenId, body.paymentId);
    return { message: 'Payment processed successfully' };
  }

  @Get(':id/cases')
  async getCitizenCases(@Param('id') citizenId: string): Promise<Case[]> {
    return await this.citizensService.getCitizenCases(citizenId);
  }

  @Post(':id/advice')
  async getPersonalizedAdvice(
    @Param('id') citizenId: string,
    @Body() body: { situation: string },
  ): Promise<any> {
    try {
      return await this.citizensService.getPersonalizedAdvice(citizenId, body.situation);
    } catch (error) {
      throw new HttpException(
        'Impossible de générer un conseil personnalisé',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('smart-question')
  async askSmartQuestion(
    @Body() body: { 
      question: string; 
      citizenId?: string;
      category?: string;
      priority?: 'low' | 'medium' | 'high';
    },
  ): Promise<any> {
    try {
      // Utiliser directement le RAG sans limite de questions
      const ragQuery = {
        question: body.question,
        userId: body.citizenId,
        context: body.category,
        maxResults: body.priority === 'high' ? 8 : 5,
        minScore: 0.7,
      };

      // Cette méthode pourrait être ajoutée au service
      return {
        success: true,
        message: 'Utilisez l\'endpoint /rag/citizen-question pour des réponses optimisées',
        redirectTo: '/rag/citizen-question',
      };
    } catch (error) {
      throw new HttpException(
        'Erreur lors du traitement de votre question',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 