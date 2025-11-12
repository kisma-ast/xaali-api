import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { Message } from './message.entity';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { Citizen } from './citizen.entity';
import { EmailService } from './email.service';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Case, Lawyer, Citizen]),
    NotificationModule, // Importer NotificationModule pour avoir accès à NotificationService
  ],
  controllers: [MessagesController],
  providers: [EmailService],
  exports: [TypeOrmModule],
})
export class MessagesModule {}