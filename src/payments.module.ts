import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './payment.entity';
import { BictorysModule } from './bictorys.module';
import { PayTechModule } from './paytech.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), BictorysModule, PayTechModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {} 