import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLawyerFields1752611125073 implements MigrationInterface {
  name = 'AddLawyerFields1752611125073';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lawyer"
      ADD COLUMN "phone" character varying,
      ADD COLUMN "experience" character varying,
      ADD COLUMN "lawFirm" character varying,
      ADD COLUMN "barNumber" character varying,
      ADD COLUMN "description" text,
      ADD COLUMN "mobileMoneyAccount" character varying,
      ADD COLUMN "pricing" json
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lawyer"
      DROP COLUMN "phone",
      DROP COLUMN "experience",
      DROP COLUMN "lawFirm",
      DROP COLUMN "barNumber",
      DROP COLUMN "description",
      DROP COLUMN "mobileMoneyAccount",
      DROP COLUMN "pricing"
    `);
  }
} 