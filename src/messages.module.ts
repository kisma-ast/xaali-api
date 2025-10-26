import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { Message } from './message.entity';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { Citizen } from './citizen.entity';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Case, Lawyer, Citizen])],
  controllers: [MessagesController],
  providers: [EmailService],
  exports: [TypeOrmModule],
})
export class MessagesModule {}