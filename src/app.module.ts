import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { LawyersModule } from './lawyers.module';
import { CasesModule } from './cases.module';
import { ConsultationsModule } from './consultations.module';
import { PaymentsModule } from './payments.module';
import { NotificationsModule } from './notifications.module';
import { CitizensModule } from './citizens.module';
import { AuthModule } from './auth.module';
import { WebRTCSignalingGateway } from './webrtc-signaling.gateway';
import { PineconeModule } from './pinecone';
import { LegalAssistantModule } from './legal-assistant.index';
import { BictorysModule } from './bictorys.module';
import { PayTechModule } from './paytech.module';
import { PaymentModule } from './payment/payment.module';
import { MessagesModule } from './messages.module';
import { FineTuningService } from './fine-tuning.service';
import { DatabaseSetupService } from './database-setup.service';
import { SeedDataService } from './seed-data.service';

import { RealAuthController } from './real-auth.controller';
import { CitizenAuthController } from './citizen-auth.controller';
import { MessagesController } from './messages.controller';
import { NotificationModule } from './notification.module';
import { GoogleAuthService } from './google-auth.service';
import { LegalDocumentsService } from './legal-documents.service';
import { LegalDocumentsController } from './legal-documents.controller';
import { EmailService } from './email.service';

import { SimplifiedCaseController } from './simplified-case.controller';
import { SimplifiedCaseService } from './simplified-case.service';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { Tracking } from './tracking.entity';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
import { Citizen } from './citizen.entity';
import { Consultation } from './consultation.entity';
import { Message } from './message.entity';
import { DossiersModule } from './dossiers.module';
import { Dossier } from './dossier.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mongodb',
        url: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
        entities: [Lawyer, Case, Citizen, Consultation, Message, Tracking, Dossier],
        synchronize: true,
        ssl: true,
        tlsAllowInvalidCertificates: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    LawyersModule,
    CasesModule,
    ConsultationsModule,
    PaymentsModule,
    NotificationsModule,
    NotificationModule, // Module pour NotificationService (partagé)
    CitizensModule,
    AuthModule,
    PineconeModule,
    LegalAssistantModule,
    BictorysModule,
    PayTechModule,
    PaymentModule,
    MessagesModule,
    DossiersModule,
    TypeOrmModule.forFeature([Lawyer, Case, Citizen, Consultation, Message, Tracking, Dossier]),
  ],
  controllers: [AppController, RealAuthController, CitizenAuthController, MessagesController, LegalDocumentsController, SimplifiedCaseController, TrackingController],
  providers: [
    GoogleAuthService, AppService, WebRTCSignalingGateway, FineTuningService, LegalDocumentsService, EmailService, SimplifiedCaseService, TrackingService],
})
export class AppModule {}