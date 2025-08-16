import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(): Promise<Notification[]> {
    return this.notificationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Notification | null> {
    return this.notificationsService.findOne(Number(id));
  }

  @Post()
  create(@Body() notification: Partial<Notification>): Promise<Notification> {
    return this.notificationsService.create(notification);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() notification: Partial<Notification>): Promise<Notification | null> {
    return this.notificationsService.update(Number(id), notification);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.notificationsService.remove(Number(id));
  }
} 