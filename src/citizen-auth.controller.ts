import { Controller, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from './citizen.entity';
import { Case } from './case.entity';
import * as bcrypt from 'bcrypt';

@Controller('citizen-auth')
export class CitizenAuthController {
  constructor(
    @InjectRepository(Citizen)
    private citizenRepository: Repository<Citizen>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
  ) {}

  @Post('register')
  async register(@Body() body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    username: string;
    phone: string;
  }) {
    try {
      // Vérifier si l'email existe déjà
      const existingCitizen = await this.citizenRepository.findOne({
        where: { email: body.email }
      });

      if (existingCitizen) {
        return {
          success: false,
          message: 'Un compte avec cet email existe déjà'
        };
      }

      // Crypter le mot de passe
      const hashedPassword = await bcrypt.hash(body.password, 10);
      
      // Créer le nouveau citoyen
      const newCitizen = this.citizenRepository.create({
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        password: hashedPassword,
        phone: body.phone,
        createdAt: new Date(),
        isActive: true,
        questionsAsked: 0,
        hasPaid: false
      });

      const savedCitizen = await this.citizenRepository.save(newCitizen);
      
      // Lier les cas non payés créés avec ce téléphone/email
      await this.linkExistingCases(savedCitizen);

      return {
        success: true,
        citizen: {
          id: savedCitizen.id,
          name: savedCitizen.name,
          email: savedCitizen.email,
          phone: savedCitizen.phone
        },
        token: `citizen_${savedCitizen.id}_${Date.now()}`
      };
    } catch (error) {
      console.error('Erreur inscription citoyen:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'inscription'
      };
    }
  }

  @Post('login')
  async login(@Body() body: {
    email: string;
    password: string;
  }) {
    try {
      const citizen = await this.citizenRepository.findOne({
        where: { email: body.email }
      });
      
      if (!citizen || !await bcrypt.compare(body.password, citizen.password)) {
        return {
          success: false,
          message: 'Email ou mot de passe incorrect'
        };
      }



      // Lier les cas existants lors de la connexion
      await this.linkExistingCases(citizen);
      
      return {
        success: true,
        citizen: {
          id: citizen.id,
          name: citizen.name,
          email: citizen.email,
          phone: citizen.phone
        },
        token: `citizen_${citizen.id}_${Date.now()}`
      };
    } catch (error) {
      console.error('Erreur connexion citoyen:', error);
      return {
        success: false,
        message: 'Erreur lors de la connexion'
      };
    }
  }
  
  @Post('hash-passwords')
  async hashExistingPasswords() {
    try {
      const citizens = await this.citizenRepository.find();
      let updated = 0;
      
      for (const citizen of citizens) {
        // Vérifier si le mot de passe n'est pas déjà crypté
        if (citizen.password && !citizen.password.startsWith('$2b$')) {
          const hashedPassword = await bcrypt.hash(citizen.password, 10);
          await this.citizenRepository.update(citizen._id, { password: hashedPassword });
          updated++;
        }
      }
      
      return {
        success: true,
        message: `${updated} mots de passe cryptés`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors du cryptage'
      };
    }
  }
  
  private async linkExistingCases(citizen: Citizen): Promise<void> {
    try {
      // Trouver les cas avec le même téléphone ou email et citizenId null
      const casesToUpdate = await this.caseRepository.find({
        where: {
          citizenPhone: citizen.phone,
          citizenId: undefined
        }
      });
      
      for (const caseItem of casesToUpdate) {
        await this.caseRepository.update(caseItem._id,
        {
          citizenId: citizen.id,
          citizenName: citizen.name,
          citizenPhone: citizen.phone
        });
      }
      
      console.log(`Cas liés au citoyen ${citizen.name}`);
    } catch (error) {
      console.error('Erreur liaison cas:', error);
    }
  }
}