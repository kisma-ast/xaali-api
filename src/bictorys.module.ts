import { Module } from '@nestjs/common';
import { BictorysController } from './bictorys.controller';
import { BictorysService } from './bictorys.service';

@Module({
  controllers: [BictorysController],
  providers: [BictorysService],
  exports: [BictorysService]
})
export class BictorysModule {}