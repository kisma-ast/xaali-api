import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizensController } from './citizens.controller';
import { CitizensService } from './citizens.service';
import { Citizen } from './citizen.entity';
import { AiQuestion } from './ai-question.entity';
import { Case } from './case.entity';
import { LegalAssistantModule } from './legal-assistant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Citizen, AiQuestion, Case]),
    LegalAssistantModule,
  ],
  controllers: [CitizensController],
  providers: [CitizensService],
  exports: [CitizensService],
})
export class CitizensModule {} 