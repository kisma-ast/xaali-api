import { Controller, Post, Body, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { NotificationService } from './notification.service';

@Controller('test-payment')
export class TestPaymentController {
  private readonly logger = new Logger(TestPaymentController.name);

  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Lawyer)
    private lawyerRepository: Repository<Lawyer>,
    private notificationService: NotificationService,
  ) {}

  @Post('simulate-successful-payment')
  async simulateSuccessfulPayment(@Body() body: {
    customerName: string;
    customerPhone: string;
    caseTitle: string;
    caseDescription: string;
    caseCategory: string;
    amount: number;
  }) {
    try {
      this.logger.log('🧪 Simulation d\'un paiement réussi');

      // 1. Créer le cas comme si le paiement avait réussi
      const newCase = this.caseRepository.create({
        title: body.caseTitle,
        description: body.caseDescription,
        category: body.caseCategory,
        citizenName: body.customerName,
        citizenPhone: body.customerPhone,
        status: 'pending',
        urgency: 'normal',
        estimatedTime: 30,
        isPaid: true,
        paymentAmount: body.amount,
        paymentId: `TEST_${Date.now()}`,
        createdAt: new Date(),
      });

      const savedCase = await this.caseRepository.save(newCase);
      this.logger.log(`✅ Cas créé: ${savedCase.id}`);

      // 2. Compter les avocats disponibles
      const availableLawyers = await this.lawyerRepository.find({
        where: { isActive: true }
      });

      this.logger.log(`👨‍💼 Avocats disponibles: ${availableLawyers.length}`);

      // 3. Notifier tous les avocats
      const notificationResult = await this.notificationService.notifyNewCase(savedCase);
      
      this.logger.log(`📢 Notifications envoyées: ${notificationResult.notifiedLawyers}/${notificationResult.totalLawyers}`);

      return {
        success: true,
        message: 'Paiement simulé avec succès',
        case: {
          id: savedCase.id,
          title: savedCase.title,
          status: savedCase.status,
          isPaid: savedCase.isPaid,
          paymentAmount: savedCase.paymentAmount
        },
        notifications: {
          totalLawyers: notificationResult.totalLawyers,
          notifiedLawyers: notificationResult.notifiedLawyers,
          connectedLawyers: this.notificationService.getConnectedLawyersCount()
        }
      };
    } catch (error) {
      this.logger.error(`❌ Erreur simulation paiement: ${error.message}`);
      return {
        success: false,
        message: `Erreur: ${error.message}`
      };
    }
  }

  @Post('create-test-lawyers')
  async createTestLawyers() {
    try {
      this.logger.log('👨‍💼 Création d\'avocats de test');

      const testLawyers = [
        {
          name: 'Me. Amadou Diallo',
          email: 'amadou.diallo@test.sn',
          password: 'password123',
          specialty: 'Droit de la famille',
          phone: '+221 77 123 45 67',
          experience: '8 ans',
          lawFirm: 'Cabinet Diallo & Associés',
          barNumber: 'BAR001SN',
          isActive: true,
          createdAt: new Date()
        },
        {
          name: 'Me. Fatou Sall',
          email: 'fatou.sall@test.sn',
          password: 'password123',
          specialty: 'Droit commercial',
          phone: '+221 77 123 45 68',
          experience: '12 ans',
          lawFirm: 'Étude Sall',
          barNumber: 'BAR002SN',
          isActive: true,
          createdAt: new Date()
        },
        {
          name: 'Me. Ousmane Ba',
          email: 'ousmane.ba@test.sn',
          password: 'password123',
          specialty: 'Droit immobilier',
          phone: '+221 77 123 45 69',
          experience: '15 ans',
          lawFirm: 'Cabinet Ba & Partenaires',
          barNumber: 'BAR003SN',
          isActive: true,
          createdAt: new Date()
        }
      ];

      const createdLawyers = [];
      for (const lawyerData of testLawyers) {
        // Vérifier si l'avocat existe déjà
        const existingLawyer = await this.lawyerRepository.findOne({
          where: { email: lawyerData.email }
        });

        if (!existingLawyer) {
          const lawyer = this.lawyerRepository.create(lawyerData);
          const savedLawyer = await this.lawyerRepository.save(lawyer);
          createdLawyers.push(savedLawyer);
          this.logger.log(`✅ Avocat créé: ${savedLawyer.name}`);
        } else {
          this.logger.log(`⚠️ Avocat existe déjà: ${lawyerData.name}`);
        }
      }

      return {
        success: true,
        message: `${createdLawyers.length} avocats créés`,
        lawyers: createdLawyers.map(l => ({
          id: l.id,
          name: l.name,
          email: l.email,
          specialty: l.specialty
        }))
      };
    } catch (error) {
      this.logger.error(`❌ Erreur création avocats: ${error.message}`);
      return {
        success: false,
        message: `Erreur: ${error.message}`
      };
    }
  }

  @Post('get-system-status')
  async getSystemStatus() {
    try {
      const totalLawyers = await this.lawyerRepository.count();
      const activeLawyers = await this.lawyerRepository.count({
        where: { isActive: true }
      });
      const totalCases = await this.caseRepository.count();
      const pendingCases = await this.caseRepository.count({
        where: { status: 'pending' }
      });
      const paidCases = await this.caseRepository.count({
        where: { isPaid: true }
      });

      return {
        success: true,
        system: {
          lawyers: {
            total: totalLawyers,
            active: activeLawyers,
            connected: this.notificationService.getConnectedLawyersCount()
          },
          cases: {
            total: totalCases,
            pending: pendingCases,
            paid: paidCases
          }
        }
      };
    } catch (error) {
      this.logger.error(`❌ Erreur statut système: ${error.message}`);
      return {
        success: false,
        message: `Erreur: ${error.message}`
      };
    }
  }
}