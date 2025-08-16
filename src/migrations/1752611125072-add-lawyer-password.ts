import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLawyerPassword1752611125072 implements MigrationInterface {
  name = 'AddLawyerPassword1752611125072';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lawyer" 
      ADD COLUMN "password" character varying NOT NULL DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lawyer" 
      DROP COLUMN "password"
    `);
  }
} 