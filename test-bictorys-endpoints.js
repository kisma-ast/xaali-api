const axios = require('axios');

const config = {
  MERCHANT_ID: 'acbd9255-4dd3-4867-898d-5c0bf9bf7472',
  API_KEY: 'developertest_public-acbd9255-4dd3-4867-898d-5c0bf9bf7472.tDVidwjy7iTtlkcwWNaMg5MBhY1znxQzcgEBs9ZPU8kiFjPce06lb4t3x90WtWH8',
  SECRET_KEY: 'test_secret-acbd9255-4dd3-4867-898d-5c0bf9bf7472.lHi92K6MgbcXi5vWgFKIzdzvj1jkrGOQYS8HCEg5H9Su8Gg80qAK3P6o1CD2htjg'
};

const testEndpoints = async () => {
  const endpoints = [
    'https://api.bictorys.com/v1/payments/initiate',
    'https://sandbox.bictorys.com/api/v1/payments/initiate', 
    'https://sandbox.bictorys.com/v1/payments/initiate',
    'https://api.bictorys.com/payments/initiate',
    'https://sandbox.bictorys.com/payments/initiate'
  ];

  const paymentData = {
    merchant_id: config.MERCHANT_ID,
    amount: 1000,
    currency: 'XOF',
    phone: '+221771234567',
    provider: 'wave',
    reference: `TEST_${Date.now()}`,
    description: 'Test Xaali'
  };

  for (const endpoint of endpoints) {
    console.log(`\n🧪 Test: ${endpoint}`);
    
    try {
      const response = await axios.post(endpoint, paymentData, {
        headers: {
          'Authorization': `Bearer ${config.API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Succès!', response.data);
      break;
    } catch (error) {
      console.log(`❌ ${error.response?.status || 'TIMEOUT'}: ${error.response?.statusText || error.message}`);
      
      if (error.response?.data && typeof error.response.data === 'object') {
        console.log('📄 Détails:', error.response.data);
      }
    }
  }

  // Test avec l'endpoint de checkout direct
  console.log('\n🧪 Test checkout direct...');
  const checkoutUrl = `https://sandbox.bictorys.com/checkout?merchant=${config.MERCHANT_ID}&amount=1000&currency=XOF&reference=TEST_${Date.now()}&phone=%2B221771234567&provider=wave`;
  console.log('🔗 URL générée:', checkoutUrl);
  
  try {
    const response = await axios.get(checkoutUrl, { timeout: 10000 });
    console.log('✅ Checkout accessible:', response.status);
  } catch (error) {
    console.log('❌ Checkout inaccessible:', error.response?.status, error.message);
  }
};

testEndpoints();