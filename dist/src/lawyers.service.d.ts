import { Repository } from 'typeorm';
import { Lawyer } from './lawyer.entity';
export declare class LawyersService {
    private lawyersRepository;
    constructor(lawyersRepository: Repository<Lawyer>);
    findAll(): Promise<Lawyer[]>;
    findOne(id: number): Promise<Lawyer | null>;
    create(lawyer: Partial<Lawyer>): Promise<Lawyer>;
    update(id: number, lawyer: Partial<Lawyer>): Promise<Lawyer | null>;
    remove(id: number): Promise<void>;
}
