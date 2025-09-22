import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
import { Citizen } from './citizen.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedDataService {
  private readonly logger = new Logger(SeedDataService.name);

  constructor(
    @InjectRepository(Lawyer)
    private lawyerRepository: MongoRepository<Lawyer>,
    @InjectRepository(Case)
    private caseRepository: MongoRepository<Case>,
    @InjectRepository(Citizen)
    private citizenRepository: MongoRepository<Citizen>,
  ) {}

  async seedLawyers(): Promise<void> {
    const count = await this.lawyerRepository.count();
    if (count > 0) {
      this.logger.log(`${count} avocats déjà présents`);
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const lawyers = [
      {
        name: 'Maître Aminata Diallo',
        email: 'aminata.diallo@xaali.sn',
        password: hashedPassword,
        specialty: 'Droit de la famille',
        phone: '+221 77 123 45 67',
        experience: '8 ans',
        lawFirm: 'Cabinet Diallo & Associés',
        barNumber: 'BAR001SN',
        description: 'Spécialisée en droit de la famille, divorce, succession',
        mobileMoneyAccount: '+221 77 123 45 67',
        pricing: { consultation: 25000, dossier: 150000 },
        paymentMethod: 'mobile_money'
      },
      {
        name: 'Maître Ousmane Seck',
        email: 'ousmane.seck@xaali.sn',
        password: hashedPassword,
        specialty: 'Droit commercial',
        phone: '+221 78 234 56 78',
        experience: '12 ans',
        lawFirm: 'Seck & Partners',
        barNumber: 'BAR002SN',
        description: 'Expert en droit des affaires et commercial',
        mobileMoneyAccount: '+221 78 234 56 78',
        pricing: { consultation: 30000, dossier: 200000 },
        paymentMethod: 'mobile_money'
      },
      {
        name: 'Maître Fatou Ndiaye',
        email: 'fatou.ndiaye@xaali.sn',
        password: hashedPassword,
        specialty: 'Droit pénal',
        phone: '+221 76 345 67 89',
        experience: '6 ans',
        lawFirm: 'Cabinet Ndiaye',
        barNumber: 'BAR003SN',
        description: 'Avocate pénaliste, défense des droits',
        mobileMoneyAccount: '+221 76 345 67 89',
        pricing: { consultation: 20000, dossier: 100000 },
        paymentMethod: 'mobile_money'
      },
      {
        name: 'Maître Ibrahima Kane',
        email: 'ibrahima.kane@xaali.sn',
        password: hashedPassword,
        specialty: 'Droit immobilier',
        phone: '+221 70 456 78 90',
        experience: '10 ans',
        lawFirm: 'Kane & Associés',
        barNumber: 'BAR004SN',
        description: 'Spécialiste en droit foncier et immobilier',
        mobileMoneyAccount: '+221 70 456 78 90',
        pricing: { consultation: 28000, dossier: 180000 },
        paymentMethod: 'mobile_money'
      },
      {
        name: 'Maître Khadija Sy',
        email: 'khadija.sy@xaali.sn',
        password: hashedPassword,
        specialty: 'Droit du travail',
        phone: '+221 77 567 89 01',
        experience: '7 ans',
        lawFirm: 'Cabinet Sy',
        barNumber: 'BAR005SN',
        description: 'Experte en droit social et du travail',
        mobileMoneyAccount: '+221 77 567 89 01',
        pricing: { consultation: 22000, dossier: 120000 },
        paymentMethod: 'mobile_money'
      }
    ];

    await this.lawyerRepository.save(lawyers);
    this.logger.log(`✅ ${lawyers.length} avocats créés`);
  }

  async seedTestCases(): Promise<void> {
    const count = await this.caseRepository.count();
    if (count > 0) {
      this.logger.log(`${count} dossiers déjà présents`);
      return;
    }

    // Créer un citoyen test
    let citizen = await this.citizenRepository.findOne({ where: { email: 'test@xaali.sn' } });
    if (!citizen) {
      citizen = await this.citizenRepository.save({
        name: 'Citoyen Test',
        email: 'test@xaali.sn',
        questionsAsked: 0,
        hasPaid: false
      });
    }

    const cases = [
      {
        title: 'Problème de succession familiale',
        description: 'Conflit autour de l\'héritage paternel avec les frères et sœurs',
        status: 'pending',
        citizenId: citizen.id,
        isPaid: false,
        lawyerNotified: false
      },
      {
        title: 'Litige commercial',
        description: 'Différend avec un fournisseur sur une livraison non conforme',
        status: 'pending',
        citizenId: citizen.id,
        isPaid: false,
        lawyerNotified: false
      }
    ];

    await this.caseRepository.save(cases);
    this.logger.log(`✅ ${cases.length} dossiers test créés`);
  }

  async seedTestUsers(): Promise<void> {
    // Créer des citoyens de test
    const citizenCount = await this.citizenRepository.count();
    if (citizenCount === 0) {
      const testCitizens = [
        {
          name: 'Amadou Diop',
          email: 'amadou.diop@test.sn',
          questionsAsked: 1,
          hasPaid: false
        },
        {
          name: 'Awa Ndiaye',
          email: 'awa.ndiaye@test.sn',
          questionsAsked: 2,
          hasPaid: true
        },
        {
          name: 'Moussa Sall',
          email: 'moussa.sall@test.sn',
          questionsAsked: 0,
          hasPaid: false
        }
      ];
      
      await this.citizenRepository.save(testCitizens);
      this.logger.log(`✅ ${testCitizens.length} citoyens de test créés`);
    }
  }

  async seedAll(): Promise<void> {
    this.logger.log('🌱 Initialisation des données...');
    try {
      await this.seedLawyers();
      await this.seedTestUsers();
      this.logger.log('✅ Données initialisées avec succès');
    } catch (error) {
      this.logger.warn('⚠️ Erreur lors du seeding:', error.message);
    }
  }
}