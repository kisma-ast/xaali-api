import { Controller, Post, Body, HttpException, HttpStatus, Get, Headers, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Lawyer } from './lawyer.entity';
import { CasesService } from './cases.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly casesService: CasesService
  ) {}

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

  @Get('cases/pending')
  async getPendingCases() {
    try {
      // Récupérer les cas payés ET non assignés (disponibles pour les avocats)
      const cases = await this.casesService.getPaidAndAvailableCases();
      return {
        success: true,
        cases
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        cases: []
      };
    }
  }

  @Get('lawyer/:lawyerId/cases')
  async getLawyerCases(@Param('lawyerId') lawyerId: string) {
    try {
      const cases = await this.casesService.getCasesByLawyer(lawyerId);
      return {
        success: true,
        cases
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        cases: []
      };
    }
  }

  @Post('case/:caseId/accept')
  async acceptCase(@Param('caseId') caseId: string, @Body() body: { lawyerId: string }) {
    try {
      const acceptedCase = await this.casesService.assignLawyer(caseId, body.lawyerId);
      return {
        success: true,
        case: acceptedCase
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }


} 