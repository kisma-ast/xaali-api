import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
export declare class NotificationsService {
    private notificationsRepository;
    constructor(notificationsRepository: Repository<Notification>);
    findAll(): Promise<Notification[]>;
    findOne(id: number): Promise<Notification | null>;
    create(notification: Partial<Notification>): Promise<Notification>;
    update(id: number, notification: Partial<Notification>): Promise<Notification | null>;
    remove(id: number): Promise<void>;
}
