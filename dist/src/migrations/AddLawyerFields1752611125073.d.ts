import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddLawyerFields1752611125073 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
