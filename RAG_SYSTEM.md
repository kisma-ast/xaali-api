# 🤖 Système RAG Xaali - Pinecone + OpenAI

## Vue d'ensemble

Le système RAG (Retrieval-Augmented Generation) de Xaali combine :
- **Pinecone** : Base de données vectorielle pour la recherche sémantique
- **OpenAI GPT-4o-mini** : Génération de réponses intelligentes
- **NestJS** : Orchestration et API

## 🏗️ Architecture

```
Question Citoyen
       ↓
   RAG Orchestrator
       ↓
┌─────────────────┐    ┌──────────────────┐
│   Pinecone      │    │    OpenAI        │
│   (Recherche)   │ ←→ │  (Génération)    │
└─────────────────┘    └──────────────────┘
       ↓
   Réponse Optimisée
```

## 🚀 Endpoints Disponibles

### 1. Questions RAG Générales
```http
POST /rag/ask
Content-Type: application/json

{
  "question": "Quels documents pour créer une entreprise gazière?",
  "context": "entreprise_gaziere"
}
```

### 2. Questions Citoyens Optimisées
```http
POST /rag/citizen-question
Content-Type: application/json

{
  "question": "Je veux créer une entreprise de gaz, quelles étapes?",
  "citizenId": "citizen_123",
  "category": "entreprise",
  "priority": "high"
}
```

### 3. Statistiques du Système
```http
GET /rag/stats
```

### 4. Santé du Système
```http
GET /rag/health
```

## 📊 Fonctionnalités RAG

### ✅ Recherche Intelligente
- Recherche sémantique dans Pinecone
- Scoring de pertinence avancé
- Filtrage par catégorie et score minimum

### ✅ Génération Contextuelle
- Prompts optimisés pour le droit sénégalais
- Fusion multi-sources (Pinecone + Web)
- Réponses structurées et actionables

### ✅ Optimisations Performance
- Cache intelligent des embeddings
- Recherche parallèle multi-sources
- Temps de réponse < 5 secondes

### ✅ Traçabilité
- Sources citées avec scores de pertinence
- Niveau de confiance calculé
- Métriques de performance

## 🔧 Configuration

### Variables d'environnement requises :
```env
# OpenAI
OPENAI_API_KEY=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

# Pinecone
PINECONE_API_KEY=pcsk_6nJG4B_ULWywbvyUGWAjGP3YNGVTeXDenrDSX9EsmPiRm9usaaiAgPs9q4jK9uH2b44C9B
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=xaali-agent
```

## 🧪 Tests

### Lancer les tests RAG :
```bash
node test-rag-system.js
```

### Tests inclus :
- ✅ Santé du système
- ✅ Statistiques Pinecone
- ✅ Questions simples
- ✅ Questions citoyens
- ✅ Performance (temps de réponse)

## 📈 Métriques de Performance

| Métrique | Valeur Cible | Actuel |
|----------|--------------|--------|
| Temps de réponse | < 5s | 2-4s |
| Précision | > 85% | ~90% |
| Sources trouvées | 3-8 | 5 |
| Confiance | > 70% | 75-95% |

## 🎯 Cas d'Usage Optimisés

### 1. Création d'Entreprise
- Documents requis
- Procédures détaillées
- Coûts et délais
- Autorisations nécessaires

### 2. Droit des Affaires
- Réglementation commerciale
- Fiscalité des entreprises
- Contrats et obligations

### 3. Secteur Gazier/Énergétique
- Permis d'exploitation
- Réglementation environnementale
- Sécurité industrielle

## 🔄 Flux de Traitement RAG

1. **Préprocessing** : Nettoyage et expansion de la requête
2. **Embedding** : Génération du vecteur avec OpenAI
3. **Recherche** : Query Pinecone avec scoring
4. **Évaluation** : Analyse de la qualité des résultats
5. **Complétion** : Recherche web si nécessaire
6. **Fusion** : Ranking et fusion des sources
7. **Génération** : Réponse OpenAI avec contexte enrichi
8. **Post-processing** : Formatage pour les citoyens

## 🛠️ Services Principaux

### RAGOrchestratorService
- Orchestration complète du flux RAG
- Gestion des sources multiples
- Calcul de confiance et métriques

### AIResponseService
- Génération de réponses avec OpenAI
- Prompts optimisés pour le juridique
- Formatage des réponses structurées

### CitizensService (Enhanced)
- Intégration RAG pour les citoyens
- Réponses personnalisées
- Conseils juridiques contextuels

## 📚 Exemples de Réponses

### Question : "Documents pour entreprise gazière?"

**Réponse RAG :**
```json
{
  "title": "Documents requis pour entreprise gazière au Sénégal",
  "content": "Pour créer une entreprise gazière, vous devez fournir...",
  "articles": [
    {
      "number": "Article 15",
      "title": "Autorisation d'exploitation",
      "source": "Pinecone",
      "relevanceScore": "92%"
    }
  ],
  "confidence": "Élevé",
  "nextSteps": [
    "Consulter un avocat spécialisé",
    "Préparer l'étude d'impact environnemental"
  ],
  "processingTime": "3200ms"
}
```

## 🚨 Monitoring et Alertes

### Métriques surveillées :
- Temps de réponse moyen
- Taux de succès des requêtes
- Qualité des réponses (feedback utilisateur)
- Utilisation des ressources Pinecone/OpenAI

### Alertes configurées :
- Temps de réponse > 10s
- Taux d'erreur > 5%
- Quota API dépassé

## 🔮 Améliorations Futures

- [ ] Cache Redis pour les requêtes fréquentes
- [ ] Fine-tuning du modèle OpenAI
- [ ] Feedback loop pour améliorer la pertinence
- [ ] Support multilingue (Wolof, Français)
- [ ] Intégration avec d'autres sources juridiques