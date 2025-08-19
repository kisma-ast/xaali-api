"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePaymentEntity1704000000000 = void 0;
const typeorm_1 = require("typeorm");
class UpdatePaymentEntity1704000000000 {
    name = 'UpdatePaymentEntity1704000000000';
    async up(queryRunner) {
        const hasCurrency = await queryRunner.hasColumn('payment', 'currency');
        if (!hasurrency) {
            await queryRunner.addColumn('payment', new typeorm_1.TableColumn({
                name: 'currency',
                type: 'varchar',
                default: "'XOF'",
                isNullable: false
            }));
        }
        await queryRunner.query(`
      ALTER TABLE payment 
      MODIFY COLUMN status ENUM('pending', 'success', 'failed', 'cancelled') 
      DEFAULT 'pending'
    `);
        const columnsToAdd = [
            { name: 'transactionId', type: 'varchar', isNullable: true },
            { name: 'reference', type: 'varchar', isNullable: true },
            { name: 'phoneNumber', type: 'varchar', isNullable: true },
            { name: 'provider', type: 'varchar', isNullable: true },
            { name: 'description', type: 'varchar', isNullable: true },
            { name: 'paymentUrl', type: 'varchar', isNullable: true },
            { name: 'qrCode', type: 'text', isNullable: true },
            { name: 'completedAt', type: 'datetime', isNullable: true },
            { name: 'errorMessage', type: 'text', isNullable: true },
            { name: 'metadata', type: 'json', isNullable: true }
        ];
        for (const column of columnsToAdd) {
            const hasColumn = await queryRunner.hasColumn('payment', column.name);
            if (!hasColumn) {
                await queryRunner.addColumn('payment', new typeorm_1.TableColumn(column));
            }
        }
        const hasCreatedAt = await queryRunner.hasColumn('payment', 'createdAt');
        if (!hasCreatedAt) {
            await queryRunner.addColumn('payment', new typeorm_1.TableColumn({
                name: 'createdAt',
                type: 'datetime',
                default: 'CURRENT_TIMESTAMP',
                isNullable: false
            }));
        }
        const hasUpdatedAt = await queryRunner.hasColumn('payment', 'updatedAt');
        if (!hasUpdatedAt) {
            await queryRunner.addColumn('payment', new typeorm_1.TableColumn({
                name: 'updatedAt',
                type: 'datetime',
                default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
                isNullable: false
            }));
        }
        await queryRunner.query(`
      ALTER TABLE payment 
      MODIFY COLUMN amount DECIMAL(10,2) NOT NULL
    `);
        await queryRunner.query(`
      ALTER TABLE payment 
      MODIFY COLUMN userId INT NULL,
      MODIFY COLUMN caseId INT NULL
    `);
        const hasDate = await queryRunner.hasColumn('payment', 'date');
        if (hasDate) {
            await queryRunner.dropColumn('payment', 'date');
        }
    }
    async down(queryRunner) {
        const columnsToRemove = [
            'currency', 'transactionId', 'reference', 'phoneNumber', 'provider',
            'description', 'paymentUrl', 'qrCode', 'completedAt', 'errorMessage',
            'metadata', 'createdAt', 'updatedAt'
        ];
        for (const columnName of columnsToRemove) {
            const hasColumn = await queryRunner.hasColumn('payment', columnName);
            if (hasColumn) {
                await queryRunner.dropColumn('payment', columnName);
            }
        }
        await queryRunner.addColumn('payment', new typeorm_1.TableColumn({
            name: 'date',
            type: 'datetime',
            isNullable: false
        }));
        await queryRunner.query(`
      ALTER TABLE payment 
      MODIFY COLUMN status VARCHAR(255) NOT NULL,
      MODIFY COLUMN amount DECIMAL NOT NULL,
      MODIFY COLUMN userId INT NOT NULL,
      MODIFY COLUMN caseId INT NOT NULL
    `);
    }
}
exports.UpdatePaymentEntity1704000000000 = UpdatePaymentEntity1704000000000;
//# sourceMappingURL=1704000000000-UpdatePaymentEntity.js.map