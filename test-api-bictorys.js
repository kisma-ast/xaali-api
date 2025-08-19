// Script de test pour l'API Bictorys
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/payments/bictorys';

async function testValidation(phoneNumber) {
  try {
    console.log(`\n🧪 Test de validation pour: "${phoneNumber}"`);
    
    const response = await fetch(`${API_BASE}/test-validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Réponse: ${result.message}`);
      console.log(`   Détails: ${JSON.stringify(result.validation, null, 2)}`);
    } else {
      console.log(`❌ Erreur: ${result.message}`);
    }
  } catch (error) {
    console.log(`💥 Erreur de connexion: ${error.message}`);
  }
}

async function testPayment(phoneNumber, amount = 1000) {
  try {
    console.log(`\n💰 Test de paiement pour: "${phoneNumber}" - ${amount} XOF`);
    
    const response = await fetch(`${API_BASE}/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        phoneNumber, 
        amount,
        description: 'Test de paiement Xaali'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Paiement initié avec succès!`);
      console.log(`   Transaction ID: ${result.data.transactionId}`);
      console.log(`   Provider: ${result.data.provider}`);
      console.log(`   Numéro formaté: ${result.data.formattedPhone}`);
    } else {
      console.log(`❌ Erreur: ${result.message}`);
    }
  } catch (error) {
    console.log(`💥 Erreur de connexion: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Démarrage des tests API Bictorys...');
  console.log('📡 URL de base:', API_BASE);
  
  // Tests de validation
  console.log('\n=== TESTS DE VALIDATION ===');
  await testValidation('771234567');      // Orange valide
  await testValidation('+221771234567');  // Orange valide avec préfixe
  await testValidation('701234567');      // MTN valide
  await testValidation('601234567');      // Moov valide
  await testValidation('761234567');      // Free/MTN valide
  await testValidation('551234567');      // Invalide
  await testValidation('77123456');       // Trop court
  await testValidation('');               // Vide
  
  // Tests de paiement
  console.log('\n=== TESTS DE PAIEMENT ===');
  await testPayment('771234567', 1000);   // Orange
  await testPayment('701234567', 2000);   // MTN
  await testPayment('601234567', 1500);   // Moov
  await testPayment('551234567', 1000);   // Invalide
  
  console.log('\n✨ Tests terminés!');
}

// Vérifier si le serveur est démarré
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/providers`);
    if (response.ok) {
      console.log('✅ Serveur accessible');
      return true;
    } else {
      console.log('❌ Serveur non accessible (réponse non OK)');
      return false;
    }
  } catch (error) {
    console.log('❌ Serveur non accessible:', error.message);
    console.log('💡 Assurez-vous que le serveur NestJS est démarré sur le port 3000');
    return false;
  }
}

// Exécuter les tests
checkServer().then(isServerRunning => {
  if (isServerRunning) {
    runTests();
  } else {
    console.log('\n🛑 Impossible d\'exécuter les tests - serveur non accessible');
    console.log('📝 Pour démarrer le serveur: npm run start:dev');
  }
});