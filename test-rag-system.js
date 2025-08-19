const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

// Tests du système RAG
async function testRAGSystem() {
  console.log('🧪 Test du système RAG Pinecone + OpenAI');
  console.log('=' .repeat(50));

  try {
    // 1. Test de santé du système
    console.log('\n1️⃣ Test de santé du système RAG...');
    const healthResponse = await fetch(`${API_BASE}/rag/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Santé:', healthData.data?.status || 'Unknown');

    // 2. Test des statistiques
    console.log('\n2️⃣ Récupération des statistiques...');
    const statsResponse = await fetch(`${API_BASE}/rag/stats`);
    const statsData = await statsResponse.json();
    console.log('📊 Documents indexés:', statsData.data?.performance?.totalDocuments || 0);

    // 3. Test question simple
    console.log('\n3️⃣ Test question simple...');
    const simpleQuestion = {
      question: "Quels documents sont nécessaires pour créer une entreprise gazière au Sénégal?"
    };

    const simpleResponse = await fetch(`${API_BASE}/rag/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simpleQuestion)
    });

    const simpleData = await simpleResponse.json();
    if (simpleData.success) {
      console.log('✅ Réponse générée en:', simpleData.data.processingTime + 'ms');
      console.log('🎯 Confiance:', (simpleData.data.confidence * 100).toFixed(1) + '%');
      console.log('📚 Sources utilisées:', simpleData.data.sources.length);
    }

    // 4. Test question citoyen
    console.log('\n4️⃣ Test question citoyen...');
    const citizenQuestion = {
      question: "Je veux créer une entreprise de distribution de gaz. Quelles sont les étapes et les coûts?",
      category: "entreprise_gaziere",
      priority: "high"
    };

    const citizenResponse = await fetch(`${API_BASE}/rag/citizen-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(citizenQuestion)
    });

    const citizenData = await citizenResponse.json();
    if (citizenData.success) {
      console.log('✅ Réponse citoyen générée');
      console.log('💡 Réponse rapide:', citizenData.data.userFriendly?.quickAnswer?.substring(0, 100) + '...');
      console.log('📋 Actions suggérées:', citizenData.data.userFriendly?.actionItems?.length || 0);
    }

    // 5. Test questions multiples
    console.log('\n5️⃣ Test questions multiples...');
    const questions = [
      "Quel est le délai pour obtenir un permis d'exploitation gazière?",
      "Combien coûte la création d'une SARL au Sénégal?",
      "Quelles sont les autorisations environnementales requises?"
    ];

    for (let i = 0; i < questions.length; i++) {
      const response = await fetch(`${API_BASE}/rag/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questions[i] })
      });

      const data = await response.json();
      if (data.success) {
        console.log(`  ${i + 1}. ✅ ${questions[i]} (${data.data.processingTime}ms)`);
      } else {
        console.log(`  ${i + 1}. ❌ ${questions[i]} - Erreur`);
      }
    }

    console.log('\n🎉 Tests RAG terminés avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Test de performance
async function testRAGPerformance() {
  console.log('\n⚡ Test de performance RAG');
  console.log('=' .repeat(30));

  const testQuestion = "Procédure de création d'entreprise gazière";
  const iterations = 5;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    try {
      const response = await fetch(`${API_BASE}/rag/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: testQuestion })
      });

      const data = await response.json();
      const totalTime = Date.now() - start;
      times.push(totalTime);
      
      console.log(`Test ${i + 1}: ${totalTime}ms (RAG: ${data.data?.processingTime || 'N/A'}ms)`);
    } catch (error) {
      console.log(`Test ${i + 1}: Erreur - ${error.message}`);
    }
  }

  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`\n📊 Statistiques de performance:`);
    console.log(`   Temps moyen: ${avgTime.toFixed(0)}ms`);
    console.log(`   Temps min: ${minTime}ms`);
    console.log(`   Temps max: ${maxTime}ms`);
  }
}

// Exécuter les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests du système RAG Xaali');
  console.log('🔗 Pinecone + OpenAI + NestJS');
  console.log('');

  await testRAGSystem();
  await testRAGPerformance();

  console.log('\n✨ Tous les tests terminés!');
}

// Vérifier si le serveur est démarré
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/rag/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Point d'entrée
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Serveur non accessible sur http://localhost:3000');
    console.log('💡 Démarrez le serveur avec: npm run start:dev');
    return;
  }

  await runAllTests();
}

main().catch(console.error);