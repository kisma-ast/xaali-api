import { Controller, Post, Body, HttpException, HttpStatus, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Lawyer } from './lawyer.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() lawyerData: {
    name: string;
    email: string;
    password: string;
    specialty: string;
    phone?: string;
    experience?: string;
    lawFirm?: string;
    barNumber?: string;
    description?: string;
    mobileMoneyAccount?: string;
    pricing?: any;
    paymentMethod?: string;
    paymentAmount?: string;
  }): Promise<{ lawyer: Lawyer; token: string; message: string }> {
    try {
      const result = await this.authService.register(lawyerData);
      return {
        ...result,
        message: 'Inscription réussie !',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de l\'inscription',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('login')
  async login(@Body() loginData: { email: string; password: string }): Promise<{
    lawyer: Lawyer;
    token: string;
    message: string;
  }> {
    try {
      const result = await this.authService.login(loginData.email, loginData.password);
      return {
        ...result,
        message: 'Connexion réussie !',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Email ou mot de passe incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Get('me')
  async getProfile(@Headers('authorization') authHeader: string): Promise<Lawyer> {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new HttpException('Token manquant', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.validateToken(token);
    } catch (error) {
      throw new HttpException(
        error.message || 'Token invalide',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
} 