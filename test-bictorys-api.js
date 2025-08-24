const axios = require('axios');

// Test direct de l'API Bictorys avec vos clés
const testBictorysAPI = async () => {
  const config = {
    MERCHANT_ID: 'acbd9255-4dd3-4867-898d-5c0bf9bf7472',
    API_KEY: 'developertest_public-acbd9255-4dd3-4867-898d-5c0bf9bf7472.tDVidwjy7iTtlkcwWNaMg5MBhY1znxQzcgEBs9ZPU8kiFjPce06lb4t3x90WtWH8',
    SECRET_KEY: 'test_secret-acbd9255-4dd3-4867-898d-5c0bf9bf7472.lHi92K6MgbcXi5vWgFKIzdzvj1jkrGOQYS8HCEg5H9Su8Gg80qAK3P6o1CD2htjg',
    API_URL: 'https://sandbox.bictorys.com/api/v1'
  };

  console.log('🧪 Test API Bictorys...');
  console.log('📋 Configuration:', {
    merchant: config.MERCHANT_ID,
    apiUrl: config.API_URL,
    hasApiKey: !!config.API_KEY,
    hasSecret: !!config.SECRET_KEY
  });

  try {
    // Test 1: Vérifier les endpoints disponibles
    console.log('\n1️⃣ Test endpoints...');
    
    // Test 2: Initier un paiement
    console.log('\n2️⃣ Test initiation paiement...');
    const paymentData = {
      merchant_id: config.MERCHANT_ID,
      amount: 1000,
      currency: 'XOF',
      phone: '+221771234567',
      provider: 'wave',
      reference: `TEST_${Date.now()}`,
      description: 'Test Xaali',
      webhook_url: 'http://localhost:3000/bictorys/callback',
      success_url: 'http://localhost:3001/?payment=success',
      cancel_url: 'http://localhost:3001/?payment=cancelled'
    };

    console.log('📤 Données envoyées:', paymentData);

    const response = await axios.post(`${config.API_URL}/payments/initiate`, paymentData, {
      headers: {
        'Authorization': `Bearer ${config.API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': config.API_KEY,
        'X-SECRET-KEY': config.SECRET_KEY
      },
      timeout: 30000
    });

    console.log('✅ Succès!');
    console.log('📥 Réponse:', response.data);
    console.log('🔗 URL de paiement:', response.data.data?.payment_url);

  } catch (error) {
    console.log('❌ Erreur:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Test alternatif avec différents headers
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('\n🔄 Test avec headers alternatifs...');
      try {
        const altResponse = await axios.post(`${config.API_URL}/payments/initiate`, paymentData, {
          headers: {
            'Authorization': config.API_KEY,
            'Content-Type': 'application/json',
            'X-Merchant-ID': config.MERCHANT_ID,
            'X-Secret': config.SECRET_KEY
          }
        });
        console.log('✅ Succès avec headers alternatifs!');
        console.log('📥 Réponse:', altResponse.data);
      } catch (altError) {
        console.log('❌ Échec aussi avec headers alternatifs:', altError.response?.data);
      }
    }
  }
};

testBictorysAPI();