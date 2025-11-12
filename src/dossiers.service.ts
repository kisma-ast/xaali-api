import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dossier } from './dossier.entity';
import { Case } from './case.entity';

@Injectable()
export class DossiersService {
  constructor(
    @InjectRepository(Dossier)
    private dossierRepository: Repository<Dossier>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
  ) {}

  async createFromCase(caseData: Case): Promise<Dossier> {
    const dossier = new Dossier();
    dossier.trackingCode = caseData.trackingCode || `XA-${Math.floor(Math.random() * 100000)}`;
    dossier.trackingToken = caseData.trackingToken || `token-${Date.now()}`;
    dossier.caseId = caseData.id;
    dossier.clientName = caseData.citizenName || 'Client';
    dossier.clientPhone = caseData.citizenPhone || '';
    if (caseData.citizenEmail) {
      dossier.clientEmail = caseData.citizenEmail;
    }
    dossier.problemCategory = caseData.category || 'Consultation juridique';
    dossier.clientQuestion = caseData.description || caseData.firstQuestion || '';
    dossier.aiResponse = caseData.aiResponse || caseData.firstResponse || '';
    dossier.followUpQuestions = [
      caseData.firstQuestion,
      caseData.secondQuestion,
      caseData.thirdQuestion
    ].filter(q => q);
    dossier.followUpAnswers = [
      caseData.firstResponse,
      caseData.secondResponse,
      caseData.thirdResponse
    ].filter(r => r);
    dossier.status = caseData.isPaid ? 'paid' : 'pending';
    dossier.paymentAmount = caseData.paymentAmount || 10000;
    dossier.isPaid = caseData.isPaid;
    
    if (caseData.lawyerName) {
      dossier.assignedLawyer = {
        name: caseData.lawyerName,
        specialty: caseData.category || '',
        phone: ''
      };
    }

    return this.dossierRepository.save(dossier);
  }

  async findByTrackingCode(trackingCode: string): Promise<Dossier | null> {
    return this.dossierRepository.findOne({
      where: { trackingCode },
      relations: ['case']
    });
  }

  async findByTrackingToken(trackingToken: string): Promise<Dossier | null> {
    return this.dossierRepository.findOne({
      where: { trackingToken },
      relations: ['case']
    });
  }

  async updateFromCase(caseId: string): Promise<Dossier | null> {
    const caseData = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseData) return null;

    let dossier = await this.dossierRepository.findOne({ where: { caseId } });
    
    if (!dossier) {
      return this.createFromCase(caseData);
    }

    // Mettre à jour les données
    dossier.clientName = caseData.citizenName || dossier.clientName;
    dossier.clientPhone = caseData.citizenPhone || dossier.clientPhone;
    dossier.clientEmail = caseData.citizenEmail || dossier.clientEmail;
    dossier.problemCategory = caseData.category || dossier.problemCategory;
    dossier.clientQuestion = caseData.description || caseData.firstQuestion || dossier.clientQuestion;
    dossier.aiResponse = caseData.aiResponse || caseData.firstResponse || dossier.aiResponse;
    dossier.status = caseData.isPaid ? 'paid' : 'pending';
    dossier.paymentAmount = caseData.paymentAmount || dossier.paymentAmount;
    dossier.isPaid = caseData.isPaid;

    return this.dossierRepository.save(dossier);
  }
}