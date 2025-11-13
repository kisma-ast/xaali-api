import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { DossiersService } from './dossiers.service';

@Controller('dossiers')
export class DossiersController {
  constructor(private readonly dossiersService: DossiersService) {}

  @Get('tracking-code/:trackingCode')
  async getByTrackingCode(@Param('trackingCode') trackingCode: string) {
    try {
      console.log(`🔍 Recherche dossier avec trackingCode: ${trackingCode}`);
      const dossier = await this.dossiersService.findByTrackingCode(trackingCode);
      if (!dossier) {
        console.log(`❌ Dossier non trouvé pour trackingCode: ${trackingCode}`);
        return { success: false, message: 'Dossier non trouvé' };
      }
      console.log(`✅ Dossier trouvé: ${dossier.id} - ${dossier.trackingCode}`);
      return { success: true, dossier };
    } catch (error) {
      console.error(`❌ Erreur recherche dossier: ${error.message}`);
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

  @Get('list')
  async listAll() {
    try {
      const dossiers = await this.dossiersService.findAll();
      return { success: true, dossiers, count: dossiers.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}