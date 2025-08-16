import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lawyer } from './lawyer.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Lawyer)
    private lawyersRepository: Repository<Lawyer>,
    private jwtService: JwtService,
  ) {}

  async register(lawyerData: {
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
  }): Promise<{ lawyer: Lawyer; token: string }> {
    // Vérifier si l'email existe déjà
    const existingLawyer = await this.lawyersRepository.findOne({
      where: { email: lawyerData.email },
    });

    if (existingLawyer) {
      throw new UnauthorizedException('Un avocat avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(lawyerData.password, 10);

    // Créer le nouvel avocat
    const lawyer = this.lawyersRepository.create({
      name: lawyerData.name,
      email: lawyerData.email,
      password: hashedPassword,
      specialty: lawyerData.specialty,
      phone: lawyerData.phone,
      experience: lawyerData.experience,
      lawFirm: lawyerData.lawFirm,
      barNumber: lawyerData.barNumber,
      description: lawyerData.description,
      mobileMoneyAccount: lawyerData.mobileMoneyAccount,
      pricing: lawyerData.pricing,
      paymentMethod: lawyerData.paymentMethod,
      paymentAmount: lawyerData.paymentAmount,
    });

    const savedLawyer = await this.lawyersRepository.save(lawyer);

    // Générer le token JWT
    const payload = { sub: savedLawyer.id, email: savedLawyer.email };
    const token = this.jwtService.sign(payload);

    // Retourner l'avocat sans le mot de passe
    const { password, ...lawyerWithoutPassword } = savedLawyer;

    return {
      lawyer: lawyerWithoutPassword as Lawyer,
      token,
    };
  }

  async login(email: string, password: string): Promise<{ lawyer: Lawyer; token: string }> {
    // Trouver l'avocat par email
    const lawyer = await this.lawyersRepository.findOne({
      where: { email },
    });

    if (!lawyer) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, lawyer.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer le token JWT
    const payload = { sub: lawyer.id, email: lawyer.email };
    const token = this.jwtService.sign(payload);

    // Retourner l'avocat sans le mot de passe
    const { password: _, ...lawyerWithoutPassword } = lawyer;

    return {
      lawyer: lawyerWithoutPassword as Lawyer,
      token,
    };
  }

  async validateToken(token: string): Promise<Lawyer> {
    try {
      const payload = this.jwtService.verify(token);
      const lawyer = await this.lawyersRepository.findOne({
        where: { id: payload.sub },
      });

      if (!lawyer) {
        throw new UnauthorizedException('Token invalide');
      }

      const { password, ...lawyerWithoutPassword } = lawyer;
      return lawyerWithoutPassword as Lawyer;
    } catch (error) {
      throw new UnauthorizedException('Token invalide');
    }
  }
} 