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

  findOne(id: number): Promise<Consultation | null> {
    return this.consultationsRepository.findOne({ where: { id } });
  }

  create(consultation: Partial<Consultation>): Promise<Consultation> {
    const newConsultation = this.consultationsRepository.create(consultation);
    return this.consultationsRepository.save(newConsultation);
  }

  update(id: number, consultation: Partial<Consultation>): Promise<Consultation | null> {
    return this.consultationsRepository.save({ id, ...consultation });
  }

  async remove(id: number): Promise<void> {
    await this.consultationsRepository.delete(id);
  }

  // Méthodes pour la visioconférence
  async createVideoConsultation(consultationData: Partial<Consultation>): Promise<Consultation> {
    const meetingId = this.generateMeetingId();
    const meetingPassword = this.generateMeetingPassword();
    
    const consultation = this.consultationsRepository.create({
      ...consultationData,
      meetingId,
      meetingPassword,
      status: 'pending',
      meetingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultation/${meetingId}`,
    });
    
    return this.consultationsRepository.save(consultation);
  }

  async startConsultation(id: number): Promise<Consultation | null> {
    const consultation = await this.findOne(id);
    if (!consultation) return null;
    
    consultation.status = 'active';
    consultation.startTime = new Date();
    consultation.isVideoEnabled = true;
    consultation.isAudioEnabled = true;
    
    return this.consultationsRepository.save(consultation);
  }

  async endConsultation(id: number): Promise<Consultation | null> {
    const consultation = await this.findOne(id);
    if (!consultation) return null;
    
    consultation.status = 'completed';
    consultation.endTime = new Date();
    
    return this.consultationsRepository.save(consultation);
  }

  async findByMeetingId(meetingId: string): Promise<Consultation | null> {
    return this.consultationsRepository.findOne({ where: { meetingId } });
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