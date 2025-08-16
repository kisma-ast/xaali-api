import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment } from './payment.entity';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(): Promise<Payment[]> {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Payment | null> {
    return this.paymentsService.findOne(Number(id));
  }

  @Post()
  create(@Body() payment: Partial<Payment>): Promise<Payment> {
    return this.paymentsService.create(payment);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payment: Partial<Payment>): Promise<Payment | null> {
    return this.paymentsService.update(Number(id), payment);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.paymentsService.remove(Number(id));
  }
} 