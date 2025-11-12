import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { UnifiedPaymentController } from './unified-payment.controller';
import { PayTechProvider } from './paytech.provider';
import { OrangeMoneyProvider } from './orange-money.provider';
import { WaveProvider } from './wave.provider';
import { NotificationModule } from '../notification.module';
import { Case } from '../case.entity';
import { Lawyer } from '../lawyer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Lawyer]),
    NotificationModule, // Importer NotificationModule pour avoir accès à NotificationService
  ],
  controllers: [UnifiedPaymentController],
  providers: [
    PaymentService,
    PayTechProvider,
    OrangeMoneyProvider,
    WaveProvider,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}