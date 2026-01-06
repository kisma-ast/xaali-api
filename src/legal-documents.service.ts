import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { LegalDocument } from './legal-document.entity';
import { VectorStoreService } from './vector-store.service';
import { AI_CONFIG } from './config';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class LegalDocumentsService {
  private readonly logger = new Logger(LegalDocumentsService.name);
  private readonly openaiApiKey = AI_CONFIG.OPENAI_API_KEY;

  constructor(
    @InjectRepository(LegalDocument)
    private readonly docRepository: MongoRepository<LegalDocument>,
    private readonly vectorStoreService: VectorStoreService,
  ) { }

  /**
   * Ingeste un fichier PDF
   */
  async ingestPdfFile(file: Express.Multer.File): Promise<any> {
    try {
      this.logger.log(`Processing PDF: ${file.originalname}`);

      // Extract text
      const pdfData = await pdfParse(file.buffer);
      const text = pdfData.text;

      return await this.ingestTextContent(text, file.originalname);

    } catch (error) {
      this.logger.error(`Error ingesting PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ingeste un contenu texte brut (utile pour les tests ou autres formats)
   */
  async ingestTextContent(text: string, title: string): Promise<any> {
    try {
      if (!text || text.length < 50) {
        throw new Error('Content is too short or empty');
      }

      // Create Document Record
      const doc = new LegalDocument();
      doc.title = title;
      doc.filename = title; // Using title as filename for text
      doc.processed = false;
      const savedDoc = await this.docRepository.save(doc);

      // Chunking
      const chunks = this.splitTextIntoChunks(text, 1000, 200);
      this.logger.log(`Split into ${chunks.length} chunks.`);

      // Generating Embeddings in batches
      const batchSize = 20;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batchTexts = chunks.slice(i, i + batchSize);
        const embeddings = await this.vectorStoreService.generateEmbeddings(batchTexts);

        const chunkEntities = batchTexts.map((txt, idx) => ({
          documentId: savedDoc._id,
          text: txt,
          embedding: embeddings[idx],
          chunkIndex: i + idx,
          metadata: {
            source: title,
            chunkTotal: chunks.length
          }
        }));

        await this.vectorStoreService.saveChunks(chunkEntities);
      }

      // Update status
      savedDoc.processed = true;
      savedDoc.chunkCount = chunks.length;
      await this.docRepository.save(savedDoc);

      return { success: true, documentId: savedDoc._id, chunks: chunks.length };
    } catch (error) {
      this.logger.error(`Error ingesting text content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pose une question avec RAG
   */
  async askLegalQuestion(question: string): Promise<{ content: string | null; foundContext: boolean }> {
    try {
      // 1. Embed question
      const [questionEmbedding] = await this.vectorStoreService.generateEmbeddings([question]);

      // 2. Search similar chunks
      const relevantChunks = await this.vectorStoreService.searchSimilar(questionEmbedding, 5);

      if (relevantChunks.length === 0) {
        return { content: null, foundContext: false };
      }

      // 3. Construct Context
      const context = relevantChunks.map((c, i) => `[Source: ${c.metadata?.source || 'Doc'}]\n${c.text}`).join('\n\n---\n\n');

      // 4. Generate Answer with OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Tu es Xaali, un expert juridique sénégalais.
Utilise UNIQUEMENT le contexte fourni ci-dessous pour répondre à la question.
Si la réponse ne se trouve pas dans le contexte, dis-le clairement.
Cite tes sources en te basant sur les métadonnées fournies.
Langue: Français.`
            },
            {
              role: 'user',
              content: `Contexte:\n${context}\n\nQuestion: ${question}`
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Détecter si l'IA refuse de répondre par manque de contexte
      const refusalPatterns = [
        "ne contient pas d'informations",
        "ne peux pas répondre",
        "ne trouve pas dans le contexte",
        "pas d'informations spécifiques",
        "contexte fourni ne mentionne pas",
        "désolé, mais je ne peux",
        "aucune information n'est fournie",
        "il n'est pas possible de répondre",
        "je n'ai pas accès à ces informations"
      ];

      const isRefusal = refusalPatterns.some(pattern => content.toLowerCase().includes(pattern));

      if (isRefusal) {
        return { content: null, foundContext: false };
      }

      return { content: content, foundContext: true };

    } catch (error) {
      this.logger.error(`Error asking question: ${error.message}`);
      throw error;
    }
  }

  // Helper for chunking
  private splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }
    return chunks;
  }
}