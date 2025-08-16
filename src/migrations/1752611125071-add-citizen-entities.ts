import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCitizenEntities1752611125071 implements MigrationInterface {
  name = 'AddCitizenEntities1752611125071';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table citizen
    await queryRunner.query(`
      CREATE TABLE "citizen" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying,
        "email" character varying,
        "questionsAsked" integer NOT NULL DEFAULT '0',
        "hasPaid" boolean NOT NULL DEFAULT false,
        "paymentId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_citizen_id" PRIMARY KEY ("id")
      )
    `);

    // Créer la table ai_question
    await queryRunner.query(`
      CREATE TABLE "ai_question" (
        "id" SERIAL NOT NULL,
        "question" text NOT NULL,
        "answer" text NOT NULL,
        "citizenId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_question_id" PRIMARY KEY ("id")
      )
    `);

    // Créer la table lawyer_notification
    await queryRunner.query(`
      CREATE TABLE "lawyer_notification" (
        "id" SERIAL NOT NULL,
        "lawyerId" integer NOT NULL,
        "caseId" integer NOT NULL,
        "type" character varying NOT NULL DEFAULT 'new_case',
        "isRead" boolean NOT NULL DEFAULT false,
        "isAccepted" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lawyer_notification_id" PRIMARY KEY ("id")
      )
    `);

    // Ajouter les contraintes de clé étrangère
    await queryRunner.query(`
      ALTER TABLE "ai_question" 
      ADD CONSTRAINT "FK_ai_question_citizen" 
      FOREIGN KEY ("citizenId") REFERENCES "citizen"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "lawyer_notification" 
      ADD CONSTRAINT "FK_lawyer_notification_lawyer" 
      FOREIGN KEY ("lawyerId") REFERENCES "lawyer"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "lawyer_notification" 
      ADD CONSTRAINT "FK_lawyer_notification_case" 
      FOREIGN KEY ("caseId") REFERENCES "case"("id") ON DELETE CASCADE
    `);

    // Modifier la table case pour supporter les citoyens anonymes
    await queryRunner.query(`
      ALTER TABLE "case" 
      ADD COLUMN "citizenId" uuid,
      ADD COLUMN "isPaid" boolean NOT NULL DEFAULT false,
      ADD COLUMN "paymentAmount" integer,
      ADD COLUMN "paymentId" character varying,
      ADD COLUMN "lawyerNotified" boolean NOT NULL DEFAULT false,
      ADD COLUMN "assignedLawyerId" integer,
      ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      ALTER TABLE "case" 
      ADD CONSTRAINT "FK_case_citizen" 
      FOREIGN KEY ("citizenId") REFERENCES "citizen"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les contraintes de clé étrangère
    await queryRunner.query(`ALTER TABLE "case" DROP CONSTRAINT "FK_case_citizen"`);
    await queryRunner.query(`ALTER TABLE "lawyer_notification" DROP CONSTRAINT "FK_lawyer_notification_case"`);
    await queryRunner.query(`ALTER TABLE "lawyer_notification" DROP CONSTRAINT "FK_lawyer_notification_lawyer"`);
    await queryRunner.query(`ALTER TABLE "ai_question" DROP CONSTRAINT "FK_ai_question_citizen"`);

    // Supprimer les colonnes ajoutées à la table case
    await queryRunner.query(`
      ALTER TABLE "case" 
      DROP COLUMN "citizenId",
      DROP COLUMN "isPaid",
      DROP COLUMN "paymentAmount",
      DROP COLUMN "paymentId",
      DROP COLUMN "lawyerNotified",
      DROP COLUMN "assignedLawyerId",
      DROP COLUMN "createdAt"
    `);

    // Supprimer les tables
    await queryRunner.query(`DROP TABLE "lawyer_notification"`);
    await queryRunner.query(`DROP TABLE "ai_question"`);
    await queryRunner.query(`DROP TABLE "citizen"`);
  }
} 