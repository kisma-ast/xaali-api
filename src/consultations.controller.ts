import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { Consultation } from './consultation.entity';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  findAll(): Promise<Consultation[]> {
    return this.consultationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Consultation | null> {
    return this.consultationsService.findOne(id);
  }

  @Post()
  create(@Body() consultation: Partial<Consultation>): Promise<Consultation> {
    return this.consultationsService.create(consultation);
  }

  @Post('video')
  createVideoConsultation(@Body() consultation: Partial<Consultation>): Promise<Consultation> {
    return this.consultationsService.createVideoConsultation(consultation);
  }

  @Put(':id/start')
  startConsultation(@Param('id') id: string): Promise<Consultation | null> {
    return this.consultationsService.startConsultation(id);
  }

  @Put(':id/end')
  endConsultation(@Param('id') id: string): Promise<Consultation | null> {
    return this.consultationsService.endConsultation(id);
  }

  @Get('meeting/:meetingId')
  findByMeetingId(@Param('meetingId') meetingId: string): Promise<Consultation | null> {
    return this.consultationsService.findByMeetingId(meetingId);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: 'pending' | 'active' | 'completed' | 'cancelled'): Promise<Consultation[]> {
    return this.consultationsService.findByStatus(status);
  }

  @Get('pending')
  async findPending() {
    const consultations = await this.consultationsService.findByStatus('pending');
    return {
      success: true,
      consultations: consultations
    };
  }

  @Post('accept/:id')
  async acceptConsultation(@Param('id') id: string, @Body() body: { lawyerId: string }) {
    try {
      const consultation = await this.consultationsService.update(id, {
        status: 'active',
        lawyerId: body.lawyerId,
        acceptedAt: new Date()
      });
      return {
        success: true,
        consultation: consultation
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de l\'acceptation de la consultation'
      };
    }
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() consultation: Partial<Consultation>): Promise<Consultation | null> {
    return this.consultationsService.update(id, consultation);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.consultationsService.remove(id);
  }
} 