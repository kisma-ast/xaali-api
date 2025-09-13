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
import { FineTuningService } from './fine-tuning.service'; // Add this import

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mongodb',
        url: configService.get<string>('MONGODB_URI'),
        database: 'xaali-db',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    LawyersModule,
    CasesModule,
    ConsultationsModule,
    PaymentsModule,
    NotificationsModule,
    CitizensModule,
    AuthModule,
    PineconeModule,
    LegalAssistantModule,
    BictorysModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebRTCSignalingGateway, FineTuningService], // Add FineTuningService here
})
export class AppModule {}