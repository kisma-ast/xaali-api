import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { LawyersService } from './lawyers.service';
import { Lawyer } from './lawyer.entity';

@Controller('lawyers')
export class LawyersController {
  constructor(private readonly lawyersService: LawyersService) {}

  @Get()
  findAll(): Promise<Lawyer[]> {
    return this.lawyersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Lawyer | null> {
    return this.lawyersService.findOne(Number(id));
  }

  @Post()
  create(@Body() lawyer: Partial<Lawyer>): Promise<Lawyer> {
    return this.lawyersService.create(lawyer);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() lawyer: Partial<Lawyer>): Promise<Lawyer | null> {
    return this.lawyersService.update(Number(id), lawyer);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.lawyersService.remove(Number(id));
  }
} 