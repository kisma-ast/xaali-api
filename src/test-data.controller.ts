import { Controller, Post, Delete, Get, Logger } from '@nestjs/common';
import { SeedDataService } from './seed-data.service';
import { LawyersService } from './lawyers.service';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Lawyer } from './lawyer.entity';
import { Citizen } from './citizen.entity';

@Controller('test-data')
export class TestDataController {
  private readonly logger = new Logger(TestDataController.name);

  constructor(
    private readonly seedDataService: SeedDataService,
    private readonly lawyersService: LawyersService,
    @InjectRepository(Lawyer)
    private lawyersRepository: MongoRepository<Lawyer>,
    @InjectRepository(Citizen)
    private citizensRepository: MongoRepository<Citizen>,
  ) {}

  @Post('seed')
  async seedTestData() {
    this.logger.log('🌱 Initialisation des données de test...');
    try {
      await this.seedDataService.seedAll();
      return { 
        success: true, 
        message: 'Données de test créées avec succès' 
      };
    } catch (error) {
      this.logger.error('Erreur lors du seeding:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  @Delete('clean')
  async cleanTestData() {
    this.logger.log('🧹 Nettoyage des données de test...');
    try {
      // Supprimer tous les avocats de test
      await this.lawyersRepository.deleteMany({
        email: { $regex: /@xaali\.sn$|@test\.sn$/ }
      });
      
      // Supprimer tous les citoyens de test
      await this.citizensRepository.deleteMany({
        email: { $regex: /@test\.sn$/ }
      });
      
      this.logger.log('✅ Données de test supprimées');
      return { 
        success: true, 
        message: 'Données de test supprimées avec succès' 
      };
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  @Post('reset')
  async resetTestData() {
    this.logger.log('🔄 Réinitialisation des données de test...');
    try {
      // Nettoyer d'abord
      await this.cleanTestData();
      
      // Puis recréer
      await this.seedDataService.seedAll();
      
      return { 
        success: true, 
        message: 'Données de test réinitialisées avec succès' 
      };
    } catch (error) {
      this.logger.error('Erreur lors de la réinitialisation:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  @Get('status')
  async getTestDataStatus() {
    try {
      const lawyersCount = await this.lawyersRepository.count();
      const citizensCount = await this.citizensRepository.count();
      
      const testLawyers = await this.lawyersRepository.count({
        email: { $regex: /@xaali\.sn$/ }
      });
      
      const testCitizens = await this.citizensRepository.count({
        email: { $regex: /@test\.sn$/ }
      });

      return {
        success: true,
        data: {
          total: {
            lawyers: lawyersCount,
            citizens: citizensCount
          },
          test: {
            lawyers: testLawyers,
            citizens: testCitizens
          }
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du statut:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
}