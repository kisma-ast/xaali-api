import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Lawyer } from './lawyer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lawyer]),
    JwtModule.register({
      secret: 'xaali-secret-key', // En production, utiliser une variable d'environnement
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {} 