"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCitizenEntities1752611125071 = void 0;
class AddCitizenEntities1752611125071 {
    name = 'AddCitizenEntities1752611125071';
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "case" DROP CONSTRAINT "FK_case_citizen"`);
        await queryRunner.query(`ALTER TABLE "lawyer_notification" DROP CONSTRAINT "FK_lawyer_notification_case"`);
        await queryRunner.query(`ALTER TABLE "lawyer_notification" DROP CONSTRAINT "FK_lawyer_notification_lawyer"`);
        await queryRunner.query(`ALTER TABLE "ai_question" DROP CONSTRAINT "FK_ai_question_citizen"`);
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
        await queryRunner.query(`DROP TABLE "lawyer_notification"`);
        await queryRunner.query(`DROP TABLE "ai_question"`);
        await queryRunner.query(`DROP TABLE "citizen"`);
    }
}
exports.AddCitizenEntities1752611125071 = AddCitizenEntities1752611125071;
//# sourceMappingURL=1752611125071-add-citizen-entities.js.map