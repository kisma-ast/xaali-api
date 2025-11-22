import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LawyersService } from './lawyers.service';
import { LawyersController } from './lawyers.controller';
import { Lawyer } from './lawyer.entity';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lawyer])],
  controllers: [LawyersController],
  providers: [LawyersService, EmailService],
})
export class LawyersModule { } 