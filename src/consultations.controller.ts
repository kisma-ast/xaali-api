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
    return this.consultationsService.findOne(Number(id));
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
    return this.consultationsService.startConsultation(Number(id));
  }

  @Put(':id/end')
  endConsultation(@Param('id') id: string): Promise<Consultation | null> {
    return this.consultationsService.endConsultation(Number(id));
  }

  @Get('meeting/:meetingId')
  findByMeetingId(@Param('meetingId') meetingId: string): Promise<Consultation | null> {
    return this.consultationsService.findByMeetingId(meetingId);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: 'pending' | 'active' | 'completed' | 'cancelled'): Promise<Consultation[]> {
    return this.consultationsService.findByStatus(status);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() consultation: Partial<Consultation>): Promise<Consultation | null> {
    return this.consultationsService.update(Number(id), consultation);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.consultationsService.remove(Number(id));
  }
} 