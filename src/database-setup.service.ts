import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseSetupService {
  private readonly logger = new Logger(DatabaseSetupService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async checkAndSetupDatabase(): Promise<void> {
    try {
      this.logger.log('🔍 Vérification de la connexion MongoDB...');
      
      // Vérifier la connexion
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      this.logger.log('✅ Connexion MongoDB établie');
      
      // Synchroniser les entités (créer les collections si elles n'existent pas)
      await this.dataSource.synchronize();
      
      this.logger.log('✅ Synchronisation des entités terminée');
      
      // Vérifier les collections existantes
      const collections = await this.listCollections();
      this.logger.log(`📊 Collections MongoDB: ${collections.join(', ')}`);
      
    } catch (error) {
      this.logger.error('❌ Erreur lors de la configuration de la base de données:', error);
      throw error;
    }
  }

  private async listCollections(): Promise<string[]> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      const collections = await queryRunner.manager.query('db.runCommand({listCollections: 1})');
      await queryRunner.release();
      
      return collections.cursor.firstBatch.map((col: any) => col.name);
    } catch (error) {
      this.logger.warn('Impossible de lister les collections:', error.message);
      return [];
    }
  }
}