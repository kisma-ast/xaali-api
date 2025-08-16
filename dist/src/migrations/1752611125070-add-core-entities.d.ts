import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddCoreEntities1752611125070 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
