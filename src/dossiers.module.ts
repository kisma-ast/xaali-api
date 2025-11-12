import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DossiersController } from './dossiers.controller';
import { DossiersService } from './dossiers.service';
import { Dossier } from './dossier.entity';
import { Case } from './case.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dossier, Case])],
  controllers: [DossiersController],
  providers: [DossiersService],
  exports: [DossiersService, TypeOrmModule],
})
export class DossiersModule {}