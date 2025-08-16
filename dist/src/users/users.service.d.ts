import { Repository } from 'typeorm';
import { User } from '../user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User | null>;
    create(user: Partial<User>): Promise<User>;
    update(id: number, user: Partial<User>): Promise<User | null>;
    remove(id: number): Promise<void>;
}
