import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { DossiersService } from './dossiers.service';

@Controller('dossiers')
export class DossiersController {
  constructor(private readonly dossiersService: DossiersService) {}

  @Get('tracking-code/:trackingCode')
  async getByTrackingCode(@Param('trackingCode') trackingCode: string) {
    try {
      const dossier = await this.dossiersService.findByTrackingCode(trackingCode);
      if (!dossier) {
        return { success: false, message: 'Dossier non trouvé' };
      }
      return { success: true, dossier };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('tracking-token/:trackingToken')
  async getByTrackingToken(@Param('trackingToken') trackingToken: string) {
    try {
      const dossier = await this.dossiersService.findByTrackingToken(trackingToken);
      if (!dossier) {
        return { success: false, message: 'Dossier non trouvé' };
      }
      return { success: true, dossier };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('sync/:caseId')
  async syncFromCase(@Param('caseId') caseId: string) {
    try {
      const dossier = await this.dossiersService.updateFromCase(caseId);
      if (!dossier) {
        return { success: false, message: 'Cas non trouvé' };
      }
      return { success: true, dossier };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}