import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultation } from './consultation.entity';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private consultationsRepository: Repository<Consultation>,
  ) {}

  findAll(): Promise<Consultation[]> {
    return this.consultationsRepository.find();
  }

  findOne(id: string): Promise<Consultation | null> {
    return this.consultationsRepository.findOne({ where: { id } });
  }

  create(consultation: Partial<Consultation>): Promise<Consultation> {
    const newConsultation = this.consultationsRepository.create(consultation);
    return this.consultationsRepository.save(newConsultation);
  }

  async update(id: string, consultation: Partial<Consultation>): Promise<Consultation | null> {
    await this.consultationsRepository.update(id, consultation);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.consultationsRepository.delete(id);
  }

  // Méthodes pour la visioconférence
  async createVideoConsultation(consultationData: Partial<Consultation>): Promise<Consultation> {
    const consultation = this.consultationsRepository.create({
      ...consultationData,
      status: 'pending'
    });
    
    return this.consultationsRepository.save(consultation);
  }

  async startConsultation(id: string): Promise<Consultation | null> {
    const consultation = await this.findOne(id);
    if (!consultation) return null;
    
    consultation.status = 'active';
    
    return this.consultationsRepository.save(consultation);
  }

  async endConsultation(id: string): Promise<Consultation | null> {
    const consultation = await this.findOne(id);
    if (!consultation) return null;
    
    consultation.status = 'completed';
    
    return this.consultationsRepository.save(consultation);
  }

  async findByMeetingId(meetingId: string): Promise<Consultation | null> {
    return this.consultationsRepository.findOne({ where: { id: meetingId } });
  }

  async findByStatus(status: 'pending' | 'active' | 'completed' | 'cancelled'): Promise<Consultation[]> {
    return this.consultationsRepository.find({ where: { status } });
  }

  private generateMeetingId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateMeetingPassword(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
} 