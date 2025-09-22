import { Controller, Get, Post, Body, Param, Put, Delete, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { LawyersService } from './lawyers.service';
import { Lawyer } from './lawyer.entity';

@Controller('lawyers')
export class LawyersController {
  private readonly logger = new Logger(LawyersController.name);

  constructor(private readonly lawyersService: LawyersService) {}

  @Get()
  findAll(): Promise<Lawyer[]> {
    return this.lawyersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Lawyer | null> {
    return this.lawyersService.findOne(id);
  }

  @Get(':id/cases')
  findLawyerCases(@Param('id') id: string) {
    return this.lawyersService.findLawyerCases(id);
  }

  @Get(':id/details')
  findLawyerWithDetails(@Param('id') id: string) {
    return this.lawyersService.findLawyerWithDetails(id);
  }

  @Post()
  async create(@Body() lawyer: Partial<Lawyer>): Promise<Lawyer> {
    try {
      this.logger.log(`Requête de création d'avocat reçue:`, lawyer);
      return await this.lawyersService.create(lawyer);
    } catch (error) {
      this.logger.error(`Erreur dans le contrôleur:`, error);
      throw new HttpException(
        error.message || 'Erreur lors de la création de l\'avocat',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() lawyer: Partial<Lawyer>): Promise<Lawyer | null> {
    return this.lawyersService.update(id, lawyer);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.lawyersService.remove(id);
  }
} 