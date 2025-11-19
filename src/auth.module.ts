import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Lawyer } from './lawyer.entity';
import { CasesService } from './cases.service';
import { Case } from './case.entity';
import { Citizen } from './citizen.entity';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lawyer, Case, Citizen]),
    JwtModule.register({
      secret: 'xaali-secret-key', // En production, utiliser une variable d'environnement
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CasesService, NotificationService, EmailService],
  exports: [AuthService],
})
export class AuthModule {} 