// Test direct du service Bictorys
const fetch = require('node-fetch');

async function testBictorysValidation() {
  const testCases = [
    { phoneNumber: '771234567', amount: 1000 },
    { phoneNumber: '+221771234567', amount: 1500 },
    { phoneNumber: '701234567', amount: 2000 },
    { phoneNumber: '', amount: 1000 }, // Test erreur
  ];

  console.log('🧪 Test direct Bictorys API...\n');

  for (const testCase of testCases) {
    try {
      console.log(`📞 Test: ${testCase.phoneNumber || 'VIDE'} - ${testCase.amount} FCFA`);
      
      const response = await fetch('http://localhost:3000/payments/bictorys/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Succès: ${result.message}`);
        console.log(`   Provider: ${result.data?.provider}`);
        console.log(`   Numéro formaté: ${result.data?.formattedPhone}`);
      } else {
        console.log(`❌ Erreur ${response.status}: ${result.message}`);
      }
    } catch (error) {
      console.log(`💥 Erreur réseau: ${error.message}`);
    }
    console.log('');
  }
}

testBictorysValidation();