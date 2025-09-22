import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';
import { ObjectId } from 'mongodb';

@Injectable()
export class LawyersService {
  private readonly logger = new Logger(LawyersService.name);

  constructor(
    @InjectRepository(Lawyer)
    private lawyersRepository: MongoRepository<Lawyer>,
  ) {}

  findAll(): Promise<Lawyer[]> {
    return this.lawyersRepository.find();
  }

  findOne(id: string): Promise<Lawyer | null> {
    return this.lawyersRepository.findOneBy({ _id: new ObjectId(id) });
  }

  async create(lawyer: Partial<Lawyer>): Promise<Lawyer> {
    try {
      this.logger.log(`Création d'un avocat: ${lawyer.name}`);
      
      // Validation des champs requis
      if (!lawyer.name || !lawyer.email) {
        throw new Error('Nom et email sont requis');
      }
      
      // Vérifier si l'email existe déjà
      const existingLawyer = await this.lawyersRepository.findOne({ where: { email: lawyer.email } });
      if (existingLawyer) {
        this.logger.warn(`Email déjà utilisé: ${lawyer.email}`);
        throw new Error('Cet email est déjà utilisé');
      }
      
      const newLawyer = this.lawyersRepository.create(lawyer);
      const savedLawyer = await this.lawyersRepository.save(newLawyer);
      
      this.logger.log(`Avocat créé avec succès: ID ${savedLawyer.id}`);
      return savedLawyer;
    } catch (error) {
      this.logger.error(`Erreur lors de la création de l'avocat:`, error);
      if (error.code === 11000) {
        throw new Error('Cet email est déjà utilisé');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<Lawyer | null> {
    return this.lawyersRepository.findOne({ where: { email } });
  }

  async update(id: string, lawyer: Partial<Lawyer>): Promise<Lawyer | null> {
    await this.lawyersRepository.update({ _id: new ObjectId(id) }, lawyer);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.lawyersRepository.delete({ _id: new ObjectId(id) });
  }

  async findLawyerCases(lawyerId: string) {
    return this.lawyersRepository.findOne({
      where: { _id: new ObjectId(lawyerId) },
      relations: ['cases', 'cases.citizen'],
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        cases: {
          id: true,
          title: true,
          description: true,
          status: true,
          isPaid: true,
          paymentAmount: true,
          createdAt: true,
          citizen: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async findLawyerWithDetails(lawyerId: string) {
    const lawyer = await this.lawyersRepository.findOne({
      where: { _id: new ObjectId(lawyerId) },
      relations: ['cases', 'cases.citizen']
    });

    if (!lawyer) return null;

    const stats = {
      totalCases: lawyer.cases.length,
      pendingCases: lawyer.cases.filter(c => c.status === 'pending').length,
      completedCases: lawyer.cases.filter(c => c.status === 'completed').length,
      totalRevenue: lawyer.cases
        .filter(c => c.isPaid)
        .reduce((sum, c) => sum + (c.paymentAmount || 0), 0)
    };

    return {
      ...lawyer,
      stats
    };
  }
} 