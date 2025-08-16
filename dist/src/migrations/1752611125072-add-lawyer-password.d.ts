import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddLawyerPassword1752611125072 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
