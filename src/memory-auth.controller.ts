import { Controller, Post, Body, Logger } from '@nestjs/common';

@Controller('memory-auth')
export class MemoryAuthController {
  private readonly logger = new Logger(MemoryAuthController.name);
  
  // Base de données en mémoire pour les tests
  private users = [
    {
      id: '1',
      name: 'Avocat Test 1',
      email: 'avocat1@test.com',
      password: 'password123',
      specialty: 'Droit de la famille',
      phone: '+221 77 123 45 67',
      experience: '8 ans',
      lawFirm: 'Cabinet Test 1',
      barNumber: 'BAR001SN'
    },
    {
      id: '2',
      name: 'Avocat Test 2',
      email: 'avocat2@test.com',
      password: 'password123',
      specialty: 'Droit commercial',
      phone: '+221 77 123 45 68',
      experience: '5 ans',
      lawFirm: 'Cabinet Test 2',
      barNumber: 'BAR002SN'
    },
    {
      id: '3',
      name: 'Citoyen Test 1',
      email: 'citoyen1@test.com',
      password: 'password123',
      specialty: 'Citoyen',
      phone: '+221 77 123 45 69',
      experience: 'N/A',
      lawFirm: 'N/A',
      barNumber: 'N/A'
    },
    {
      id: '4',
      name: 'Demo User',
      email: 'demo@xaali.sn',
      password: 'demo123',
      specialty: 'Droit général',
      phone: '+221 77 000 00 00',
      experience: '3 ans',
      lawFirm: 'Cabinet Demo',
      barNumber: 'DEMO001'
    },
    {
      id: '5',
      name: 'Maître Test',
      email: 'test@xaali.sn',
      password: 'password123',
      specialty: 'Droit civil et commercial',
      phone: '+221 77 555 55 55',
      experience: '10 ans',
      lawFirm: 'Cabinet Test & Associés',
      barNumber: 'TEST123',
      cases: {
        pending: [
          { id: 'P001', title: 'Divorce contentieux Diop vs Ndiaye', client: 'Mme Fatou Diop', priority: 'normal', date: '2024-09-15' },
          { id: 'P002', title: 'Succession famille Sall', client: 'M. Ousmane Sall', priority: 'normal', date: '2024-09-18' },
          { id: 'P003', title: 'Litige commercial SARL Baobab', client: 'SARL Baobab', priority: 'normal', date: '2024-09-20' }
        ],
        completed: [
          { id: 'C001', title: 'Contrat de bail commercial', client: 'M. Amadou Ba', completedDate: '2024-09-10', result: 'Favorable' },
          { id: 'C002', title: 'Recouvrement de créances', client: 'Entreprise Teranga', completedDate: '2024-09-05', result: 'Favorable' },
          { id: 'C003', title: 'Divorce par consentement mutuel', client: 'Famille Mbaye', completedDate: '2024-08-28', result: 'Accord trouvé' }
        ],
        urgent: [
          { id: 'U001', title: 'Référé commercial urgent', client: 'SA Sénégal Export', priority: 'urgent', deadline: '2024-09-25' },
          { id: 'U002', title: 'Garde d\'enfants urgente', client: 'Mme Aïssatou Thiam', priority: 'urgent', deadline: '2024-09-23' }
        ]
      }
    }
  ];

  // Méthode pour récupérer les cas d'un avocat
  private getCasesForLawyer(lawyerId: string) {
    const lawyer = this.users.find(u => u.id === lawyerId);
    return lawyer?.cases || { pending: [], completed: [], urgent: [] };
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
}