import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Modules désactivés temporairement (dépendent de TypeORM)
// import { UsersModule } from './users/users.module';
// import { LawyersModule } from './lawyers.module';
// import { CasesModule } from './cases.module';
// import { ConsultationsModule } from './consultations.module';
// import { PaymentsModule } from './payments.module';
// import { NotificationsModule } from './notifications.module';
// import { CitizensModule } from './citizens.module';
// import { AuthModule } from './auth.module';
import { WebRTCSignalingGateway } from './webrtc-signaling.gateway';
import { PineconeModule } from './pinecone';
import { LegalAssistantModule } from './legal-assistant.index';
import { BictorysModule } from './bictorys.module';
import { PayTechModule } from './paytech.module';
import { FineTuningService } from './fine-tuning.service';
// Services désactivés temporairement (dépendent de TypeORM)
// import { DatabaseSetupService } from './database-setup.service';
// import { SeedDataService } from './seed-data.service';
// import { TestDataController } from './test-data.controller';
// import { SimpleAuthController } from './simple-auth.controller';
import { MemoryAuthController } from './memory-auth.controller';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
import { Citizen } from './citizen.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // MongoDB désactivé temporairement
    // TypeOrmModule.forRootAsync({...}),
    // Modules désactivés temporairement
    // UsersModule,
    // LawyersModule,
    // CasesModule,
    // ConsultationsModule,
    // PaymentsModule,
    // NotificationsModule,
    // CitizensModule,
    // AuthModule,
    PineconeModule,
    LegalAssistantModule,
    BictorysModule,
    PayTechModule,
    // TypeOrmModule.forFeature([Lawyer, Case, Citizen]),
  ],
  controllers: [AppController, MemoryAuthController],
  providers: [AppService, WebRTCSignalingGateway, FineTuningService],
})
export class AppModule {}