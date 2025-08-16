import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lawyer } from './lawyer.entity';

@Injectable()
export class LawyersService {
  constructor(
    @InjectRepository(Lawyer)
    private lawyersRepository: Repository<Lawyer>,
  ) {}

  findAll(): Promise<Lawyer[]> {
    return this.lawyersRepository.find();
  }

  findOne(id: number): Promise<Lawyer | null> {
    return this.lawyersRepository.findOneBy({ id });
  }

  create(lawyer: Partial<Lawyer>): Promise<Lawyer> {
    const newLawyer = this.lawyersRepository.create(lawyer);
    return this.lawyersRepository.save(newLawyer);
  }

  async update(id: number, lawyer: Partial<Lawyer>): Promise<Lawyer | null> {
    await this.lawyersRepository.update(id, lawyer);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.lawyersRepository.delete(id);
  }
} 