const http = require('http');

function createTestUser() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/simple-auth/create-test-user',
    method: 'POST'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Résultat:', result);
        console.log('\n🎯 Utilisateur de test créé !');
        console.log('📧 Email: test@xaali.sn');
        console.log('🔑 Mot de passe: password123');
      } catch (error) {
        console.log('✅ Réponse:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erreur:', error);
  });

  req.end();
}

createTestUser();