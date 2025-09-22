import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaytechFields1758205800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter les champs PayTech à l'entité Payment
    await queryRunner.addColumns('payment', [
      new TableColumn({
        name: 'paytechToken',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'paytechReference',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'paymentMethod',
        type: 'enum',
        enum: ['bictorys', 'paytech'],
        default: "'bictorys'",
      }),
      new TableColumn({
        name: 'citizenId',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les champs PayTech
    await queryRunner.dropColumns('payment', [
      'paytechToken',
      'paytechReference', 
      'paymentMethod',
      'citizenId',
    ]);
  }
}