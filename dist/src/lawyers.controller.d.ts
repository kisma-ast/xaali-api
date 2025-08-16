import { LawyersService } from './lawyers.service';
import { Lawyer } from './lawyer.entity';
export declare class LawyersController {
    private readonly lawyersService;
    constructor(lawyersService: LawyersService);
    findAll(): Promise<Lawyer[]>;
    findOne(id: string): Promise<Lawyer | null>;
    create(lawyer: Partial<Lawyer>): Promise<Lawyer>;
    update(id: string, lawyer: Partial<Lawyer>): Promise<Lawyer | null>;
    remove(id: string): Promise<void>;
}
