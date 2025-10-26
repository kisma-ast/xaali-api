import { Injectable, Logger } from '@nestjs/common';
import { AI_CONFIG } from './config';

@Injectable()
export class LegalDocumentsService {
  private readonly logger = new Logger(LegalDocumentsService.name);
  private readonly openaiApiKey = AI_CONFIG.OPENAI_API_KEY;

  /**
   * Ingère des fichiers PDF juridiques
   */
  async ingestPdfFiles(files: Express.Multer.File[]) {
    try {
      this.logger.log(`📚 Upload de ${files.length} fichiers PDF`);

      // Créer un assistant OpenAI spécialisé en droit sénégalais
      const assistant = await this.createLegalAssistant();
      
      // Créer un vector store pour les documents
      const vectorStore = await this.createVectorStore();
      
      // Uploader les PDF directement
      const fileIds = [];
      for (const file of files) {
        const fileId = await this.uploadPdfFile(file);
        fileIds.push(fileId);
      }
      
      // Associer les fichiers au vector store
      await this.addFilesToVectorStore(vectorStore.id, fileIds);
      
      // Associer le vector store à l'assistant
      await this.updateAssistantWithVectorStore(assistant.id, vectorStore.id);
      
      this.logger.log(`✅ ${files.length} PDF ingérés avec succès`);
      return { assistantId: assistant.id, vectorStoreId: vectorStore.id, filesCount: files.length };
      
    } catch (error) {
      this.logger.error(`❌ Erreur ingestion PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ingère des documents juridiques sénégalais dans OpenAI
   */
  async ingestLegalDocuments(documents: Array<{
    title: string;
    content: string;
    type: 'code' | 'loi' | 'decret' | 'jurisprudence';
    reference: string;
  }>) {
    try {
      this.logger.log(`📚 Ingestion de ${documents.length} documents juridiques`);

      // Créer un assistant OpenAI spécialisé en droit sénégalais
      const assistant = await this.createLegalAssistant();
      
      // Créer un vector store pour les documents
      const vectorStore = await this.createVectorStore();
      
      // Uploader les documents
      const fileIds = [];
      for (const doc of documents) {
        const fileId = await this.uploadDocument(doc);
        fileIds.push(fileId);
      }
      
      // Associer les fichiers au vector store
      await this.addFilesToVectorStore(vectorStore.id, fileIds);
      
      // Associer le vector store à l'assistant
      await this.updateAssistantWithVectorStore(assistant.id, vectorStore.id);
      
      this.logger.log(`✅ Documents ingérés avec succès`);
      return { assistantId: assistant.id, vectorStoreId: vectorStore.id };
      
    } catch (error) {
      this.logger.error(`❌ Erreur ingestion: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crée un assistant OpenAI spécialisé en droit sénégalais
   */
  private async createLegalAssistant() {
    const response = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: 'Xaali - Expert Juridique Sénégalais',
        instructions: `Tu es Xaali, un expert juridique sénégalais. Tu dois:
1. Répondre uniquement basé sur les documents juridiques sénégalais fournis
2. Citer précisément les articles, lois et références
3. Indiquer si une information n'est pas dans tes documents
4. Utiliser un langage juridique précis mais accessible`,
        model: 'gpt-4o-mini',
        tools: [{ type: 'file_search' }]
      })
    });

    return await response.json();
  }

  /**
   * Crée un vector store pour les documents
   */
  private async createVectorStore() {
    const response = await fetch('https://api.openai.com/v1/vector_stores', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: 'Documents Juridiques Sénégalais'
      })
    });

    return await response.json();
  }

  /**
   * Upload un fichier PDF vers OpenAI
   */
  private async uploadPdfFile(file: Express.Multer.File) {
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: 'application/pdf' });
    
    formData.append('file', blob, file.originalname);
    formData.append('purpose', 'assistants');

    const response = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: formData
    });

    const result = await response.json();
    this.logger.log(`📄 PDF uploadé: ${file.originalname} -> ${result.id}`);
    return result.id;
  }

  /**
   * Upload un document vers OpenAI
   */
  private async uploadDocument(doc: any) {
    const formData = new FormData();
    const blob = new Blob([`# ${doc.title}\n\nRéférence: ${doc.reference}\nType: ${doc.type}\n\n${doc.content}`], 
      { type: 'text/plain' });
    
    formData.append('file', blob, `${doc.reference}.txt`);
    formData.append('purpose', 'assistants');

    const response = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: formData
    });

    const result = await response.json();
    return result.id;
  }

  /**
   * Ajoute des fichiers au vector store
   */
  private async addFilesToVectorStore(vectorStoreId: string, fileIds: string[]) {
    const response = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/file_batches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        file_ids: fileIds
      })
    });

    return await response.json();
  }

  /**
   * Met à jour l'assistant avec le vector store
   */
  private async updateAssistantWithVectorStore(assistantId: string, vectorStoreId: string) {
    const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId]
          }
        }
      })
    });

    return await response.json();
  }

  /**
   * Pose une question à l'assistant juridique
   */
  async askLegalQuestion(question: string, assistantId: string) {
    try {
      // Créer un thread
      const thread = await this.createThread();
      
      // Ajouter le message
      await this.addMessage(thread.id, question);
      
      // Lancer l'assistant
      const run = await this.runAssistant(thread.id, assistantId);
      
      // Attendre la réponse
      const response = await this.waitForResponse(thread.id, run.id);
      
      return response;
      
    } catch (error) {
      this.logger.error(`❌ Erreur question: ${error.message}`);
      throw error;
    }
  }

  private async createThread() {
    const response = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    return await response.json();
  }

  private async addMessage(threadId: string, content: string) {
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: content
      })
    });
    return await response.json();
  }

  private async runAssistant(threadId: string, assistantId: string) {
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });
    return await response.json();
  }

  private async waitForResponse(threadId: string, runId: string) {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const runStatus = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      const run = await runStatus.json();
      
      if (run.status === 'completed') {
        const messages = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        
        const messagesData = await messages.json();
        return messagesData.data[0].content[0].text.value;
      }
      
      if (run.status === 'failed') {
        throw new Error('Assistant run failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Timeout waiting for response');
  }
}