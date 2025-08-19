import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdatePaymentEntity1704000000000 implements MigrationInterface {
  name = 'UpdatePaymentEntity1704000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne currency si elle n'existe pas
    const hasCurrency = await queryRunner.hasColumn('payment', 'currency');
    if (!hasurrency) {
      await queryRunner.addColumn('payment', new TableColumn({
        name: 'currency',
        type: 'varchar',
        default: "'XOF'",
        isNullable: false
      }));
    }

    // Modifier la colonne status pour utiliser un enum
    await queryRunner.query(`
      ALTER TABLE payment 
      MODIFY COLUMN status ENUM('pending', 'success', 'failed', 'cancelled') 
      DEFAULT 'pending'
    `);

    // Ajouter les nouvelles colonnes Bictorys
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
        await queryRunner.addColumn('payment', new TableColumn(column));
      }
    }

    // Ajouter les colonnes de timestamp si elles n'existent pas
    const hasCreatedAt = await queryRunner.hasColumn('payment', 'createdAt');
    if (!hasCreatedAt) {
      await queryRunner.addColumn('payment', new TableColumn({
        name: 'createdAt',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
        isNullable: false
      }));
    }

    const hasUpdatedAt = await queryRunner.hasColumn('payment', 'updatedAt');
    if (!hasUpdatedAt) {
      await queryRunner.addColumn('payment', new TableColumn({
        name: 'updatedAt',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        isNullable: false
      }));
    }

    // Modifier la colonne amount pour avoir une précision décimale
    await queryRunner.query(`
      ALTER TABLE payment 
      MODIFY COLUMN amount DECIMAL(10,2) NOT NULL
    `);

    // Rendre userId et caseId nullable
    await queryRunner.query(`
      ALTER TABLE payment 
      MODIFY COLUMN userId INT NULL,
      MODIFY COLUMN caseId INT NULL
    `);

    // Supprimer l'ancienne colonne date si elle existe et créer les nouvelles
    const hasDate = await queryRunner.hasColumn('payment', 'date');
    if (hasDate) {
      await queryRunner.dropColumn('payment', 'date');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les nouvelles colonnes
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

    // Restaurer l'ancienne structure
    await queryRunner.addColumn('payment', new TableColumn({
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