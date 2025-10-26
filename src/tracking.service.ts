import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tracking } from './tracking.entity';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(Tracking)
    private trackingRepository: Repository<Tracking>,
  ) {}

  async createTracking(data: {
    trackingCode: string;
    caseId: string;
    citizenName?: string;
    citizenPhone: string;
    citizenEmail?: string;
    problemCategory: string;
    clientQuestion: string;
    aiResponse?: string;
    caseTitle?: string;
    amount: number;
    followUpQuestions?: string[];
    followUpAnswers?: string[];
  }): Promise<Tracking> {
    const tracking = this.trackingRepository.create({
      ...data,
      status: 'pending',
      emailSent: false,
      whatsappSent: false,
      createdAt: new Date(),
    });

    return await this.trackingRepository.save(tracking);
  }

  async findByTrackingCode(trackingCode: string): Promise<Tracking | null> {
    return await this.trackingRepository.findOne({
      where: { trackingCode }
    });
  }

  async updateStatus(trackingCode: string, status: string, lawyerId?: string, lawyerName?: string): Promise<Tracking | null> {
    const tracking = await this.findByTrackingCode(trackingCode);
    if (!tracking) return null;

    tracking.status = status as any;
    if (lawyerId) tracking.lawyerId = lawyerId;
    if (lawyerName) tracking.lawyerName = lawyerName;
    
    if (status === 'accepted') {
      tracking.acceptedAt = new Date();
    } else if (status === 'completed') {
      tracking.completedAt = new Date();
    }
    
    tracking.updatedAt = new Date();

    return await this.trackingRepository.save(tracking);
  }

  async addLawyerResponse(trackingCode: string, response: string, notes?: string): Promise<Tracking | null> {
    const tracking = await this.findByTrackingCode(trackingCode);
    if (!tracking) return null;

    tracking.lawyerResponse = response;
    if (notes) tracking.lawyerNotes = notes;
    tracking.status = 'in_progress';
    tracking.updatedAt = new Date();

    return await this.trackingRepository.save(tracking);
  }

  async addClientFeedback(trackingCode: string, feedback: string, rating?: number): Promise<Tracking | null> {
    const tracking = await this.findByTrackingCode(trackingCode);
    if (!tracking) return null;

    tracking.clientFeedback = feedback;
    if (rating) tracking.rating = rating;
    tracking.updatedAt = new Date();

    return await this.trackingRepository.save(tracking);
  }

  async addDocument(trackingCode: string, documentUrl: string): Promise<Tracking | null> {
    const tracking = await this.findByTrackingCode(trackingCode);
    if (!tracking) return null;

    if (!tracking.documents) tracking.documents = [];
    tracking.documents.push(documentUrl);
    tracking.updatedAt = new Date();

    return await this.trackingRepository.save(tracking);
  }

  async markEmailSent(trackingCode: string): Promise<void> {
    await this.trackingRepository.update(
      { trackingCode },
      { emailSent: true, updatedAt: new Date() }
    );
  }

  async markWhatsappSent(trackingCode: string): Promise<void> {
    await this.trackingRepository.update(
      { trackingCode },
      { whatsappSent: true, updatedAt: new Date() }
    );
  }

  async getAllTrackings(): Promise<Tracking[]> {
    return await this.trackingRepository.find({
      order: { createdAt: 'DESC' }
    });
  }
}