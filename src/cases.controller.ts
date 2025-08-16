import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CasesService } from './cases.service';
import { Case } from './case.entity';
import { LawyerNotification } from './lawyer-notification.entity';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  findAll(): Promise<Case[]> {
    return this.casesService.findAll();
  }

  @Get('pending')
  getPendingCases(): Promise<Case[]> {
    return this.casesService.getPendingCases();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Case | null> {
    return this.casesService.findOne(Number(id));
  }

  @Post()
  create(@Body() caseData: Partial<Case>): Promise<Case> {
    return this.casesService.create(caseData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() caseData: Partial<Case>): Promise<Case | null> {
    return this.casesService.update(Number(id), caseData);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.casesService.remove(Number(id));
  }

  @Get('lawyer/:lawyerId')
  getCasesByLawyer(@Param('lawyerId') lawyerId: string): Promise<Case[]> {
    return this.casesService.getCasesByLawyer(Number(lawyerId));
  }

  @Get('lawyer/:lawyerId/notifications')
  getLawyerNotifications(@Param('lawyerId') lawyerId: string): Promise<LawyerNotification[]> {
    return this.casesService.getLawyerNotifications(Number(lawyerId));
  }

  @Post('notifications/:notificationId/read')
  markNotificationAsRead(@Param('notificationId') notificationId: string): Promise<void> {
    return this.casesService.markNotificationAsRead(Number(notificationId));
  }

  @Post('notifications/:notificationId/accept')
  acceptCase(
    @Param('notificationId') notificationId: string,
    @Body() body: { lawyerId: number },
  ): Promise<Case> {
    return this.casesService.acceptCase(Number(notificationId), body.lawyerId);
  }
} 