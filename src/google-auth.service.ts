import { Injectable, Logger } from '@nestjs/common';

export interface GoogleAuthResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  token?: string;
  message: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  async verifyGoogleToken(googleToken: string): Promise<GoogleAuthResponse> {
    try {
      this.logger.log('Verifying Google token...');

      // Vérifier le token avec l'API Google
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${googleToken}`);
      
      if (!response.ok) {
        return {
          success: false,
          message: 'Token Google invalide'
        };
      }

      const tokenInfo = await response.json();
      
      // Récupérer les informations utilisateur
      const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${googleToken}`);
      
      if (!userResponse.ok) {
        return {
          success: false,
          message: 'Impossible de récupérer les informations utilisateur'
        };
      }

      const userInfo = await userResponse.json();

      // Créer ou récupérer l'utilisateur
      const user = {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
      };

      // Générer un token de session
      const sessionToken = `google_${user.id}_${Date.now()}`;

      this.logger.log(`Google auth successful for: ${user.email}`);

      return {
        success: true,
        user,
        token: sessionToken,
        message: 'Connexion Google réussie'
      };

    } catch (error) {
      this.logger.error('Google auth error:', error);
      return {
        success: false,
        message: 'Erreur lors de la vérification Google'
      };
    }
  }
}