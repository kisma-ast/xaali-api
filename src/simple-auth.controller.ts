import { Controller, Post, Body, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Lawyer } from './lawyer.entity';

@Controller('simple-auth')
export class SimpleAuthController {
  private readonly logger = new Logger(SimpleAuthController.name);

  constructor(
    @InjectRepository(Lawyer)
    private lawyersRepository: MongoRepository<Lawyer>,
  ) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    this.logger.log(`Tentative de connexion: ${loginDto.email}`);
    
    try {
      // Chercher l'avocat par email
      const lawyer = await this.lawyersRepository.findOne({
        where: { email: loginDto.email }
      });

      if (!lawyer) {
        this.logger.warn(`Avocat non trouvé: ${loginDto.email}`);
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }

      // Vérification simple du mot de passe (pour test)
      if (loginDto.password === 'password123') {
        this.logger.log(`Connexion réussie: ${loginDto.email}`);
        
        // Retourner les données de l'avocat sans le mot de passe
        const { password, ...lawyerData } = lawyer;
        
        return {
          success: true,
          lawyer: lawyerData,
          token: `token_${lawyer._id}_${Date.now()}`
        };
      } else {
        this.logger.warn(`Mot de passe incorrect pour: ${loginDto.email}`);
        return { success: false, message: 'Email ou mot de passe incorrect' };
      }
    } catch (error) {
      this.logger.error('Erreur lors de la connexion:', error);
      return { success: false, message: 'Erreur serveur' };
    }
  }

  @Post('register')
  async register(@Body() registerDto: any) {
    this.logger.log(`Tentative d'inscription: ${registerDto.email}`);
    
    try {
      // Vérifier si l'email existe déjà
      const existingLawyer = await this.lawyersRepository.findOne({
        where: { email: registerDto.email }
      });

      if (existingLawyer) {
        this.logger.warn(`Email déjà utilisé: ${registerDto.email}`);
        return { success: false, message: 'Cet email est déjà utilisé' };
      }

      // Créer le nouvel avocat
      const newLawyer = this.lawyersRepository.create({
        name: registerDto.name,
        email: registerDto.email,
        password: 'password123', // Mot de passe simple pour test
        specialty: registerDto.specialty,
        phone: registerDto.phone,
        experience: registerDto.experience,
        lawFirm: registerDto.lawFirm,
        barNumber: registerDto.barNumber,
        description: registerDto.description,
        mobileMoneyAccount: registerDto.mobileMoneyAccount,
        pricing: registerDto.pricing,
        paymentMethod: registerDto.paymentMethod
      });

      const savedLawyer = await this.lawyersRepository.save(newLawyer);
      this.logger.log(`Avocat créé avec succès: ${savedLawyer._id}`);

      // Retourner les données sans le mot de passe
      const { password, ...lawyerData } = savedLawyer;
      
      return {
        success: true,
        lawyer: lawyerData,
        token: `token_${savedLawyer._id}_${Date.now()}`
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'inscription:', error);
      return { success: false, message: 'Erreur serveur' };
    }
  }

  @Post('create-test-user')
  async createTestUser() {
    try {
      const testLawyer = {
        name: 'Avocat Test',
        email: 'test@xaali.sn',
        password: 'password123',
        specialty: 'Droit général',
        phone: '+221 77 000 00 00',
        experience: '5 ans',
        lawFirm: 'Cabinet Test',
        barNumber: 'TEST001',
        description: 'Avocat de test',
        mobileMoneyAccount: '+221 77 000 00 00',
        pricing: { consultation: 5000, dossier: 25000 },
        paymentMethod: 'mobile_money'
      };

      const existingLawyer = await this.lawyersRepository.findOne({
        where: { email: testLawyer.email }
      });

      if (existingLawyer) {
        return { success: true, message: 'Utilisateur test existe déjà' };
      }

      const newLawyer = this.lawyersRepository.create(testLawyer);
      await this.lawyersRepository.save(newLawyer);

      return { success: true, message: 'Utilisateur test créé' };
    } catch (error) {
      this.logger.error('Erreur création utilisateur test:', error);
      return { success: false, message: 'Erreur serveur' };
    }
  }
}