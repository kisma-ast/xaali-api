import { Module } from '@nestjs/common';
import { PayTechService } from './paytech.service';
import { PayTechController } from './paytech.controller';

@Module({
  controllers: [PayTechController],
  providers: [PayTechService],
  exports: [PayTechService],
})
export class PayTechModule {}