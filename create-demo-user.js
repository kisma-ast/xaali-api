// Script pour créer un utilisateur de démonstration
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://kismart07_db_user:6pDhQrrBz0kx75hz@xaali-db.gca64sm.mongodb.net/';

async function createDemoUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db('xaali-db');
    
    // Créer un avocat de démonstration
    const demoLawyer = {
      name: 'Maître Demo Xaali',
      email: 'demo@xaali.sn',
      password: 'demo123',
      specialty: 'Droit général',
      phone: '+221 77 000 00 00',
      experience: '5 ans',
      lawFirm: 'Cabinet Démo Xaali',
      barNumber: 'DEMO001',
      description: 'Avocat de démonstration pour tester la plateforme Xaali',
      mobileMoneyAccount: '+221 77 000 00 00',
      pricing: { 
        consultation: 5000, 
        dossier: 25000 
      },
      paymentMethod: 'mobile_money',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Créer un citoyen de démonstration
    const demoCitizen = {
      name: 'Citoyen Demo',
      email: 'citoyen.demo@xaali.sn',
      questionsAsked: 0,
      hasPaid: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insérer les données
    const lawyerResult = await db.collection('lawyer').insertOne(demoLawyer);
    console.log('✅ Avocat démo créé:', lawyerResult.insertedId);
    
    const citizenResult = await db.collection('citizen').insertOne(demoCitizen);
    console.log('✅ Citoyen démo créé:', citizenResult.insertedId);
    
    console.log('\n🎉 Utilisateurs de démonstration créés avec succès !');
    console.log('\n📋 Informations de connexion:');
    console.log('Avocat: demo@xaali.sn / demo123');
    console.log('Citoyen: citoyen.demo@xaali.sn');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
  }
}

createDemoUser();