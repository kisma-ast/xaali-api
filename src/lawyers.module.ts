import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LawyersService } from './lawyers.service';
import { LawyersController } from './lawyers.controller';
import { Lawyer } from './lawyer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lawyer])],
  controllers: [LawyersController],
  providers: [LawyersService],
})
export class LawyersModule {} 