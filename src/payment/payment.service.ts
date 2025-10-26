import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../case.entity';
import { NotificationService } from '../notification.service';
import { PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatus } from './payment.interface';
import { PayTechProvider } from './paytech.provider';
import { OrangeMoneyProvider } from './orange-money.provider';
import { WaveProvider } from './wave.provider';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private providers: Map<string, PaymentProvider> = new Map();

  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    private notificationService: NotificationService,
    private payTechProvider: PayTechProvider,
    private orangeMoneyProvider: OrangeMoneyProvider,
    private waveProvider: WaveProvider,
  ) {
    // Enregistrer tous les providers disponibles
    this.registerProvider(this.payTechProvider);
    this.registerProvider(this.orangeMoneyProvider);
    this.registerProvider(this.waveProvider);
    
    this.logger.log(`Providers de paiement enregistrés: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  private registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.name, provider);
  }

  // Obtenir la liste des providers disponibles
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // Initier un paiement avec un provider spécifique
  async initiatePayment(providerName: string, request: PaymentRequest): Promise<PaymentResponse> {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider de paiement non trouvé: ${providerName}`);
    }

    this.logger.log(`Initiation paiement avec ${providerName}: ${request.reference}`);

    try {
      const result = await provider.initiatePayment(request);
      
      // Si le paiement est créé avec succès, créer le cas juridique
      if (result.success && request.caseData) {
        await this.createCaseAfterPayment({
          paymentReference: request.reference,
          customerName: request.customerName || 'Client Xaali',
          customerEmail: request.customerEmail,
          customerPhone: request.caseData.citizenPhone,
          caseTitle: request.caseData.title,
          caseDescription: request.caseData.description,
          caseCategory: request.caseData.category,
          amount: request.amount,
          provider: providerName
        });
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Erreur initiation paiement ${providerName}: ${error.message}`);
      throw error;
    }
  }

  // Vérifier le statut d'un paiement
  async checkPaymentStatus(providerName: string, transactionId: string): Promise<PaymentStatus> {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider de paiement non trouvé: ${providerName}`);
    }

    return provider.checkPaymentStatus(transactionId);
  }

  // Traiter un callback de paiement
  async processCallback(providerName: string, callbackData: any): Promise<PaymentStatus> {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider de paiement non trouvé: ${providerName}`);
    }

    this.logger.log(`Traitement callback ${providerName}: ${JSON.stringify(callbackData)}`);

    try {
      const result = await provider.processCallback(callbackData);
      
      // Si le paiement est confirmé, notifier les avocats
      if (result.status === 'success') {
        await this.handleSuccessfulPayment(result.transactionId, callbackData, providerName);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Erreur callback ${providerName}: ${error.message}`);
      throw error;
    }
  }

  // Générer une référence avec un provider spécifique
  generateReference(providerName: string, prefix?: string): string {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider de paiement non trouvé: ${providerName}`);
    }

    return provider.generateReference(prefix);
  }

  // Créer un cas après paiement
  private async createCaseAfterPayment(paymentData: {
    paymentReference: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    caseTitle: string;
    caseDescription: string;
    caseCategory: string;
    amount: number;
    provider: string;
  }) {
    try {
      this.logger.log(`Création cas après paiement ${paymentData.provider}: ${paymentData.paymentReference}`);

      const newCase = this.caseRepository.create({
        title: paymentData.caseTitle,
        description: paymentData.caseDescription,
        category: paymentData.caseCategory,
        citizenName: paymentData.customerName,
        citizenPhone: paymentData.customerPhone,
        status: 'pending',
        urgency: 'normal',
        estimatedTime: 30,
        isPaid: true,
        paymentAmount: paymentData.amount,
        paymentId: paymentData.paymentReference,
        createdAt: new Date(),
      });

      const savedCase = await this.caseRepository.save(newCase);
      this.logger.log(`Cas créé: ${savedCase.id}`);

      // Notifier tous les avocats
      const notificationResult = await this.notificationService.notifyNewCase(savedCase);
      this.logger.log(`Avocats notifiés: ${notificationResult.notifiedLawyers}/${notificationResult.totalLawyers}`);

      return savedCase;
    } catch (error) {
      this.logger.error(`Erreur création cas: ${error.message}`);
      throw error;
    }
  }

  // Gérer les paiements réussis via callback
  private async handleSuccessfulPayment(transactionId: string, callbackData: any, provider: string) {
    try {
      this.logger.log(`Paiement réussi ${provider}: ${transactionId}`);

      // Chercher le cas existant
      const existingCase = await this.caseRepository.findOne({
        where: { paymentId: transactionId }
      });

      if (existingCase) {
        // Mettre à jour le statut
        existingCase.isPaid = true;
        await this.caseRepository.save(existingCase);
        
        // Re-notifier les avocats
        await this.notificationService.notifyNewCase(existingCase);
      } else {
        // Créer un cas générique
        await this.createCaseAfterPayment({
          paymentReference: transactionId,
          customerName: callbackData.customer_name || 'Client Xaali',
          customerEmail: callbackData.customer_email,
          customerPhone: '+221 77 000 00 00',
          caseTitle: `Consultation payée via ${provider}`,
          caseDescription: `Consultation juridique payée via ${provider} - En attente des détails`,
          caseCategory: 'consultation-generale',
          amount: callbackData.amount || 10000,
          provider: provider
        });
      }
    } catch (error) {
      this.logger.error(`Erreur paiement réussi: ${error.message}`);
    }
  }
}