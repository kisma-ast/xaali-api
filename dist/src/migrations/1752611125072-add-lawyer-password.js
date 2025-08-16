"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLawyerPassword1752611125072 = void 0;
class AddLawyerPassword1752611125072 {
    name = 'AddLawyerPassword1752611125072';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "lawyer" 
      ADD COLUMN "password" character varying NOT NULL DEFAULT ''
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "lawyer" 
      DROP COLUMN "password"
    `);
    }
}
exports.AddLawyerPassword1752611125072 = AddLawyerPassword1752611125072;
//# sourceMappingURL=1752611125072-add-lawyer-password.js.map