import { Repository } from 'typeorm';
import { Consultation } from './consultation.entity';
export declare class ConsultationsService {
    private consultationsRepository;
    constructor(consultationsRepository: Repository<Consultation>);
    findAll(): Promise<Consultation[]>;
    findOne(id: number): Promise<Consultation | null>;
    create(consultation: Partial<Consultation>): Promise<Consultation>;
    update(id: number, consultation: Partial<Consultation>): Promise<Consultation | null>;
    remove(id: number): Promise<void>;
    createVideoConsultation(consultationData: Partial<Consultation>): Promise<Consultation>;
    startConsultation(id: number): Promise<Consultation | null>;
    endConsultation(id: number): Promise<Consultation | null>;
    findByMeetingId(meetingId: string): Promise<Consultation | null>;
    findByStatus(status: 'pending' | 'active' | 'completed' | 'cancelled'): Promise<Consultation[]>;
    private generateMeetingId;
    private generateMeetingPassword;
}
