"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLawyerFields1752611125073 = void 0;
class AddLawyerFields1752611125073 {
    name = 'AddLawyerFields1752611125073';
    async up(queryRunner) {
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
    async down(queryRunner) {
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
exports.AddLawyerFields1752611125073 = AddLawyerFields1752611125073;
//# sourceMappingURL=AddLawyerFields1752611125073.js.map