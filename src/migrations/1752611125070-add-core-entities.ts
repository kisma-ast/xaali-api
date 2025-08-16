import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoreEntities1752611125070 implements MigrationInterface {
    name = 'AddCoreEntities1752611125070'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment" ("id" SERIAL NOT NULL, "amount" numeric NOT NULL, "date" TIMESTAMP NOT NULL, "userId" integer NOT NULL, "caseId" integer NOT NULL, "status" character varying NOT NULL, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "message" text NOT NULL, "userId" integer NOT NULL, "read" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "consultation" ("id" SERIAL NOT NULL, "date" TIMESTAMP NOT NULL, "caseId" integer NOT NULL, "lawyerId" integer NOT NULL, "userId" integer NOT NULL, "notes" text, CONSTRAINT "PK_5203569fac28a4a626c42abe70b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lawyer" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "specialty" character varying NOT NULL, CONSTRAINT "UQ_dbb59778a8a53022b4d99ca0fed" UNIQUE ("email"), CONSTRAINT "PK_2f066db616cefee8fc9397c6abd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "case" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "status" character varying NOT NULL, "userId" integer NOT NULL, "lawyerId" integer NOT NULL, CONSTRAINT "PK_a1b20a2aef6fc438389d2c4aca0" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "case"`);
        await queryRunner.query(`DROP TABLE "lawyer"`);
        await queryRunner.query(`DROP TABLE "consultation"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "payment"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
