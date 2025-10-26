import { Controller, Post, Body, Logger, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultation } from './consultation.entity';

@Controller('consultation')
export class ConsultationController {
  private readonly logger = new Logger(ConsultationController.name);

  constructor(
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
  ) {}

  @Post('save-after-payment')
  async saveConsultationAfterPayment(@Body() data: {
    citizenName: string;
    citizenPhone: string;
    citizenEmail?: string;
    firstQuestion: string;
    firstResponse: string;
    secondQuestion?: string;
    secondResponse?: string;
    category: string;
    paymentId: string;
    paymentAmount: number;
  }) {
    try {
      const consultation = this.consultationRepository.create({
        citizenName: data.citizenName,
        citizenPhone: data.citizenPhone,
        citizenEmail: data.citizenEmail,
        firstQuestion: data.firstQuestion,
        firstResponse: data.firstResponse,
        secondQuestion: data.secondQuestion,
        secondResponse: data.secondResponse,
        category: data.category,
        paymentId: data.paymentId,
        paymentAmount: data.paymentAmount,
        status: 'pending'
      });

      const saved = await this.consultationRepository.save(consultation);
      
      this.logger.log(`Consultation sauvegardée: ${saved.id}`);
      
      return {
        success: true,
        consultation: saved
      };
    } catch (error) {
      this.logger.error('Erreur sauvegarde consultation:', error);
      return {
        success: false,
        message: 'Erreur lors de la sauvegarde'
      };
    }
  }

  @Get('pending')
  async getPendingConsultations() {
    try {
      const consultations = await this.consultationRepository.find({
        where: { status: 'pending' },
        order: { createdAt: 'DESC' }
      });

      return {
        success: true,
        consultations
      };
    } catch (error) {
      this.logger.error('Erreur récupération consultations:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération'
      };
    }
  }

  @Post('accept/:id')
  async acceptConsultation(@Param('id') id: string, @Body() body: { lawyerId: string }) {
    try {
      const consultation = await this.consultationRepository.findOne({
        where: { id }
      });

      if (!consultation) {
        return { success: false, message: 'Consultation non trouvée' };
      }

      consultation.status = 'accepted';
      consultation.lawyerId = body.lawyerId;
      consultation.acceptedAt = new Date();

      await this.consultationRepository.save(consultation);

      return {
        success: true,
        consultation
      };
    } catch (error) {
      this.logger.error('Erreur acceptation consultation:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'acceptation'
      };
    }
  }
}