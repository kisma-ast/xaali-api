import { Controller, Post, Body, Logger } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  specialty: string;
  phone: string;
  experience: string;
  lawFirm: string;
  barNumber: string;
  cases?: any;
}

interface Notary {
  id: string;
  name: string;
  email: string;
  password: string;
  specialty: string;
  phone: string;
  experience: string;
  office: string;
  chamberNumber: string;
  cases?: any;
}

interface Bailiff {
  id: string;
  name: string;
  email: string;
  password: string;
  specialty: string;
  phone: string;
  experience: string;
  office: string;
  chamberNumber: string;
  cases?: any;
}

@Controller('memory-auth')
export class MemoryAuthController {
  private readonly logger = new Logger(MemoryAuthController.name);
  
  constructor(private readonly googleAuthService: GoogleAuthService) {}
  
  // Base de données en mémoire vide
  private users: User[] = [];

  // Base de données en mémoire vide
  private notaries: Notary[] = [];

  // Base de données en mémoire vide
  private bailiffs: Bailiff[] = [];

  // Méthode pour récupérer les cas d'un avocat
  private getCasesForLawyer(lawyerId: string) {
    const lawyer = this.users.find(u => u.id === lawyerId);
    return lawyer?.cases || { pending: [], completed: [], urgent: [] };
  }

  // Méthode pour récupérer les cas d'un notaire
  private getCasesForNotary(notaryId: string) {
    const notary = this.notaries.find(n => n.id === notaryId);
    return notary?.cases || { pending: [], completed: [], urgent: [] };
  }

  // Méthode pour récupérer les cas d'un huissier
  private getCasesForBailiff(bailiffId: string) {
    const bailiff = this.bailiffs.find(b => b.id === bailiffId);
    return bailiff?.cases || { pending: [], completed: [], urgent: [] };
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    this.logger.log(`Tentative de connexion: ${loginDto.email}`);
    
    const user = this.users.find(u => u.email === loginDto.email);
    
    if (!user) {
      this.logger.warn(`Utilisateur non trouvé: ${loginDto.email}`);
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    if (user.password !== loginDto.password) {
      this.logger.warn(`Mot de passe incorrect pour: ${loginDto.email}`);
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    this.logger.log(`Connexion réussie: ${loginDto.email}`);
    
    const { password, ...userData } = user;
    const cases = this.getCasesForLawyer(user.id);
    
    this.logger.log(`Données utilisateur: ${JSON.stringify(userData)}`);
    this.logger.log(`Cas trouvés: ${JSON.stringify(cases)}`);
    
    const response = {
      success: true,
      lawyer: { ...userData, cases },
      token: `token_${user.id}_${Date.now()}`
    };
    
    this.logger.log(`Réponse complète: ${JSON.stringify(response)}`);
    
    return response;
  }

  @Post('register')
  async register(@Body() registerDto: any) {
    this.logger.log(`Tentative d'inscription: ${registerDto.email}`);
    
    const existingUser = this.users.find(u => u.email === registerDto.email);
    
    if (existingUser) {
      this.logger.warn(`Email déjà utilisé: ${registerDto.email}`);
      return { success: false, message: 'Cet email est déjà utilisé' };
    }

    const newUser = {
      id: (this.users.length + 1).toString(),
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password || 'password123',
      specialty: registerDto.specialty,
      phone: registerDto.phone || '+221 77 000 00 00',
      experience: registerDto.experience || '1 an',
      lawFirm: registerDto.lawFirm || 'Cabinet Indépendant',
      barNumber: `BAR${Date.now()}`
    };

    this.users.push(newUser);
    this.logger.log(`Utilisateur créé: ${newUser.email}`);

    const { password, ...userData } = newUser;
    
    return {
      success: true,
      lawyer: userData,
      token: `token_${newUser.id}_${Date.now()}`
    };
  }

  @Post('list-users')
  async listUsers() {
    return {
      success: true,
      users: this.users.map(u => ({ id: u.id, name: u.name, email: u.email }))
    };
  }

  @Post('get-cases')
  async getCases(@Body() body: { lawyerId: string }) {
    const cases = this.getCasesForLawyer(body.lawyerId);
    return {
      success: true,
      cases
    };
  }

  @Post('google-auth')
  async googleAuth(@Body() body: { googleToken: string; googleUser: any }) {
    this.logger.log(`Google auth attempt for: ${body.googleUser?.email}`);
    
    try {
      if (!body.googleUser || !body.googleUser.email) {
        return {
          success: false,
          message: 'Données Google manquantes'
        };
      }
      
      // Vérifier si l'utilisateur existe déjà
      let user = this.users.find(u => u.email === body.googleUser.email);
      
      if (!user) {
        // Créer un nouvel utilisateur
        user = {
          id: (this.users.length + 1).toString(),
          name: body.googleUser.name,
          email: body.googleUser.email,
          password: 'google_auth', // Pas de mot de passe pour Google Auth
          specialty: 'Droit général',
          phone: '+221 77 000 00 00',
          experience: '1 an',
          lawFirm: 'Cabinet Indépendant',
          barNumber: `GOOGLE${Date.now()}`
        };
        
        this.users.push(user);
        this.logger.log(`New Google user created: ${user.email}`);
      } else {
        this.logger.log(`Existing Google user login: ${user.email}`);
      }
      
      const { password, ...userData } = user;
      const cases = this.getCasesForLawyer(user.id);
      
      return {
        success: true,
        lawyer: { ...userData, cases },
        token: `google_${user.id}_${Date.now()}`
      };
    } catch (error) {
      this.logger.error('Google auth error:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'authentification Google'
      };
    }
  }

  // Endpoints pour les notaires
  @Post('notary-login')
  async notaryLogin(@Body() loginDto: { email: string; password: string }) {
    this.logger.log(`Tentative de connexion notaire: ${loginDto.email}`);
    
    const notary = this.notaries.find(n => n.email === loginDto.email);
    
    if (!notary) {
      this.logger.warn(`Notaire non trouvé: ${loginDto.email}`);
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    if (notary.password !== loginDto.password) {
      this.logger.warn(`Mot de passe incorrect pour notaire: ${loginDto.email}`);
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    this.logger.log(`Connexion notaire réussie: ${loginDto.email}`);
    
    const { password, ...notaryData } = notary;
    const cases = this.getCasesForNotary(notary.id);
    
    return {
      success: true,
      notary: { ...notaryData, cases },
      token: `notary_token_${notary.id}_${Date.now()}`
    };
  }

  @Post('notary-register')
  async notaryRegister(@Body() registerDto: any) {
    this.logger.log(`Tentative d'inscription notaire: ${registerDto.email}`);
    
    const existingNotary = this.notaries.find(n => n.email === registerDto.email);
    
    if (existingNotary) {
      this.logger.warn(`Email déjà utilisé par un notaire: ${registerDto.email}`);
      return { success: false, message: 'Cet email est déjà utilisé' };
    }

    const newNotary = {
      id: (this.notaries.length + 1).toString(),
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password || 'password123',
      specialty: registerDto.specialty,
      phone: registerDto.phone || '+221 77 000 00 00',
      experience: registerDto.experience || '1 an',
      office: registerDto.office || 'Étude Notariale Indépendante',
      chamberNumber: `NOT${Date.now()}`
    };

    this.notaries.push(newNotary);
    this.logger.log(`Notaire créé: ${newNotary.email}`);

    const { password, ...notaryData } = newNotary;
    
    return {
      success: true,
      notary: notaryData,
      token: `notary_token_${newNotary.id}_${Date.now()}`
    };
  }

  @Post('notary-google-auth')
  async notaryGoogleAuth(@Body() body: { googleToken: string; googleUser: any }) {
    this.logger.log(`Google auth attempt for notary: ${body.googleUser?.email}`);
    
    try {
      if (!body.googleUser || !body.googleUser.email) {
        return {
          success: false,
          message: 'Données Google manquantes'
        };
      }
      
      let notary = this.notaries.find(n => n.email === body.googleUser.email);
      
      if (!notary) {
        notary = {
          id: (this.notaries.length + 1).toString(),
          name: body.googleUser.name,
          email: body.googleUser.email,
          password: 'google_auth',
          specialty: 'Actes authentiques',
          phone: '+221 77 000 00 00',
          experience: '1 an',
          office: 'Étude Notariale Indépendante',
          chamberNumber: `GOOGLE_NOT${Date.now()}`
        };
        
        this.notaries.push(notary);
        this.logger.log(`New Google notary created: ${notary.email}`);
      } else {
        this.logger.log(`Existing Google notary login: ${notary.email}`);
      }
      
      const { password, ...notaryData } = notary;
      const cases = this.getCasesForNotary(notary.id);
      
      return {
        success: true,
        notary: { ...notaryData, cases },
        token: `google_notary_${notary.id}_${Date.now()}`
      };
    } catch (error) {
      this.logger.error('Google notary auth error:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'authentification Google'
      };
    }
  }

  @Post('get-notary-cases')
  async getNotaryCases(@Body() body: { notaryId: string }) {
    const cases = this.getCasesForNotary(body.notaryId);
    return {
      success: true,
      cases
    };
  }

  // Endpoints pour les huissiers
  @Post('bailiff-login')
  async bailiffLogin(@Body() loginDto: { email: string; password: string }) {
    this.logger.log(`Tentative de connexion huissier: ${loginDto.email}`);
    
    const bailiff = this.bailiffs.find(b => b.email === loginDto.email);
    
    if (!bailiff) {
      this.logger.warn(`Huissier non trouvé: ${loginDto.email}`);
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    if (bailiff.password !== loginDto.password) {
      this.logger.warn(`Mot de passe incorrect pour huissier: ${loginDto.email}`);
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    this.logger.log(`Connexion huissier réussie: ${loginDto.email}`);
    
    const { password, ...bailiffData } = bailiff;
    const cases = this.getCasesForBailiff(bailiff.id);
    
    return {
      success: true,
      bailiff: { ...bailiffData, cases },
      token: `bailiff_token_${bailiff.id}_${Date.now()}`
    };
  }

  @Post('bailiff-register')
  async bailiffRegister(@Body() registerDto: any) {
    this.logger.log(`Tentative d'inscription huissier: ${registerDto.email}`);
    
    const existingBailiff = this.bailiffs.find(b => b.email === registerDto.email);
    
    if (existingBailiff) {
      this.logger.warn(`Email déjà utilisé par un huissier: ${registerDto.email}`);
      return { success: false, message: 'Cet email est déjà utilisé' };
    }

    const newBailiff = {
      id: (this.bailiffs.length + 1).toString(),
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password || 'password123',
      specialty: registerDto.specialty,
      phone: registerDto.phone || '+221 77 000 00 00',
      experience: registerDto.experience || '1 an',
      office: registerDto.office || 'Étude d\'Huissier Indépendante',
      chamberNumber: `HUI${Date.now()}`
    };

    this.bailiffs.push(newBailiff);
    this.logger.log(`Huissier créé: ${newBailiff.email}`);

    const { password, ...bailiffData } = newBailiff;
    
    return {
      success: true,
      bailiff: bailiffData,
      token: `bailiff_token_${newBailiff.id}_${Date.now()}`
    };
  }

  @Post('bailiff-google-auth')
  async bailiffGoogleAuth(@Body() body: { googleToken: string; googleUser: any }) {
    this.logger.log(`Google auth attempt for bailiff: ${body.googleUser?.email}`);
    
    try {
      if (!body.googleUser || !body.googleUser.email) {
        return {
          success: false,
          message: 'Données Google manquantes'
        };
      }
      
      let bailiff = this.bailiffs.find(b => b.email === body.googleUser.email);
      
      if (!bailiff) {
        bailiff = {
          id: (this.bailiffs.length + 1).toString(),
          name: body.googleUser.name,
          email: body.googleUser.email,
          password: 'google_auth',
          specialty: 'Significations d\'actes',
          phone: '+221 77 000 00 00',
          experience: '1 an',
          office: 'Étude d\'Huissier Indépendante',
          chamberNumber: `GOOGLE_HUI${Date.now()}`
        };
        
        this.bailiffs.push(bailiff);
        this.logger.log(`New Google bailiff created: ${bailiff.email}`);
      } else {
        this.logger.log(`Existing Google bailiff login: ${bailiff.email}`);
      }
      
      const { password, ...bailiffData } = bailiff;
      const cases = this.getCasesForBailiff(bailiff.id);
      
      return {
        success: true,
        bailiff: { ...bailiffData, cases },
        token: `google_bailiff_${bailiff.id}_${Date.now()}`
      };
    } catch (error) {
      this.logger.error('Google bailiff auth error:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'authentification Google'
      };
    }
  }

  @Post('get-bailiff-cases')
  async getBailiffCases(@Body() body: { bailiffId: string }) {
    const cases = this.getCasesForBailiff(body.bailiffId);
    return {
      success: true,
      cases
    };
  }
}