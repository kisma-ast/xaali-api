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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: +configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', '1107'),
        database: configService.get<string>('DB_DATABASE', 'xaali'),
        autoLoadEntities: true,
        synchronize: true,
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
  providers: [AppService, WebRTCSignalingGateway],
})
export class AppModule {}
