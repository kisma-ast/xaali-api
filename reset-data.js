const https = require('https');
const http = require('http');

function resetData() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/test-data/reset',
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

resetData();