import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(): Promise<Notification[]>;
    findOne(id: string): Promise<Notification | null>;
    create(notification: Partial<Notification>): Promise<Notification>;
    update(id: string, notification: Partial<Notification>): Promise<Notification | null>;
    remove(id: string): Promise<void>;
}
