import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { LawyerNotification } from './lawyer-notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Case, Lawyer, LawyerNotification])],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {} 