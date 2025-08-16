import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddCitizenEntities1752611125071 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
