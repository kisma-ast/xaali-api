const axios = require('axios');

// Test selon la documentation officielle Bictorys
const testBictorysOfficial = async () => {
  const config = {
    MERCHANT_ID: 'acbd9255-4dd3-4867-898d-5c0bf9bf7472',
    API_KEY: 'developertest_public-acbd9255-4dd3-4867-898d-5c0bf9bf7472.tDVidwjy7iTtlkcwWNaMg5MBhY1znxQzcgEBs9ZPU8kiFjPce06lb4t3x90WtWH8',
    SECRET_KEY: 'test_secret-acbd9255-4dd3-4867-898d-5c0bf9bf7472.lHi92K6MgbcXi5vWgFKIzdzvj1jkrGOQYS8HCEg5H9Su8Gg80qAK3P6o1CD2htjg'
  };

  console.log('📚 Test selon documentation officielle Bictorys...');

  // Test 1: Endpoint principal selon docs
  const endpoints = [
    'https://api.bictorys.com/v1/payment/initialize',
    'https://sandbox-api.bictorys.com/v1/payment/initialize', 
    'https://api.bictorys.com/payment/initialize',
    'https://sandbox.bictorys.com/api/payment/initialize'
  ];

  const paymentData = {
    amount: 1000,
    currency: 'XOF',
    customer_phone: '+221771234567',
    payment_method: 'mobile_money',
    provider: 'wave',
    reference: `XAALI_${Date.now()}`,
    description: 'Test Xaali Payment',
    return_url: 'http://localhost:3001/?payment=success',
    cancel_url: 'http://localhost:3001/?payment=cancelled',
    webhook_url: 'http://localhost:3000/bictorys/callback'
  };

  for (const endpoint of endpoints) {
    console.log(`\n🧪 Test: ${endpoint}`);
    
    try {
      const response = await axios.post(endpoint, paymentData, {
        headers: {
          'Authorization': `Bearer ${config.API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': config.API_KEY,
          'X-Merchant-Id': config.MERCHANT_ID
        },
        timeout: 15000
      });
      
      console.log('✅ Succès!', response.data);
      return;
    } catch (error) {
      console.log(`❌ ${error.response?.status || 'ERROR'}: ${error.response?.statusText || error.message}`);
      if (error.response?.data) {
        console.log('📄 Réponse:', error.response.data);
      }
    }
  }

  // Test 2: Format alternatif avec merchant_id dans le body
  console.log('\n🧪 Test avec merchant_id dans le body...');
  const altPaymentData = {
    merchant_id: config.MERCHANT_ID,
    ...paymentData
  };

  try {
    const response = await axios.post('https://api.bictorys.com/v1/payments', altPaymentData, {
      headers: {
        'Authorization': `Bearer ${config.API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Succès format alternatif!', response.data);
  } catch (error) {
    console.log('❌ Format alternatif échoué:', error.response?.status, error.response?.data);
  }

  // Test 3: Vérification des credentials
  console.log('\n🧪 Test validation credentials...');
  try {
    const response = await axios.get('https://api.bictorys.com/v1/merchant/profile', {
      headers: {
        'Authorization': `Bearer ${config.API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Credentials valides!', response.data);
  } catch (error) {
    console.log('❌ Credentials invalides:', error.response?.status, error.response?.data);
  }
};

testBictorysOfficial();