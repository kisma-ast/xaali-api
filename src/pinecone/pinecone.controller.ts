import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PineconeService, VectorDocument } from './pinecone.service';
import { EmbeddingService } from './embedding.service';
@Controller('pinecone')
export class PineconeController {
  private readonly logger = new Logger(PineconeController.name);

  constructor(
    private readonly pineconeService: PineconeService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Post('upload-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined, // Utiliser la mémoire pour avoir accès au buffer
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  )
  async uploadPDF(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { category?: string },
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      this.logger.log(`Processing PDF: ${file.originalname}`);
      this.logger.log(`File size: ${file.size} bytes`);
      this.logger.log(`Buffer length: ${file.buffer?.length || 0} bytes`);

      // Parse le PDF
      const text = await this.pineconeService.parsePDF(file.buffer);
      
      // Divise le texte en chunks minuscules pour économiser la mémoire
      const chunks = this.pineconeService.splitTextIntoChunks(text, 500, 100);
      
      // Traite les chunks un par un pour éviter l'overflow mémoire
      const batchSize = 1;
      const allDocuments: VectorDocument[] = [];
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        this.logger.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)} (${batch.length} chunks)`);
        
        // Génère les embeddings pour ce batch avec retry
        let embeddings: number[][];
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            embeddings = await this.embeddingService.generateEmbeddings(batch);
            break; // Succès, sortir de la boucle
          } catch (error) {
            retryCount++;
            this.logger.warn(`Embedding generation failed (attempt ${retryCount}/${maxRetries}): ${error.message}`);
            
            if (retryCount >= maxRetries) {
              throw new Error(`Failed to generate embeddings after ${maxRetries} attempts: ${error.message}`);
            }
            
            // Attendre avant de réessayer (backoff exponentiel)
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          }
        }
        
        // Crée les documents pour ce batch
        const batchDocuments = batch.map((chunk, batchIndex) => ({
          id: `${file.originalname}-chunk-${i + batchIndex}`,
          values: embeddings[batchIndex],
          metadata: {
            text: chunk,
            source: file.originalname,
            page: Math.floor((i + batchIndex) / 2) + 1,
            category: body.category || 'legal',
            timestamp: new Date().toISOString(),
          },
        }));
        
        allDocuments.push(...batchDocuments);
        
        // Upload ce batch vers Pinecone
        await this.pineconeService.uploadDocuments(batchDocuments);
        
        // Pause très longue pour libérer la mémoire
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force garbage collection si disponible
        if (global.gc) {
          global.gc();
        }
        
        // Log de progression
        this.logger.log(`Completed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}`);
      }
      
      return {
        message: 'PDF uploaded and processed successfully',
        filename: file.originalname,
        chunks: allDocuments.length,
        documents: allDocuments.map(doc => ({
          id: doc.id,
          metadata: doc.metadata,
        })),
      };
    } catch (error) {
      this.logger.error('Error uploading PDF:', error);
      throw error;
    }
  }

  @Post('upload-pdf-simple')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined,
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit pour commencer
      },
    }),
  )
  async uploadPDFSimple(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { category?: string },
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      this.logger.log(`🚀 Starting simple upload for: ${file.originalname}`);
      this.logger.log(`📊 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      // Parse le PDF
      this.logger.log('📖 Parsing PDF...');
      const text = await this.pineconeService.parsePDF(file.buffer);
      this.logger.log(`📝 Extracted ${text.length} characters`);

      // Divise en chunks très petits
      const chunks = this.pineconeService.splitTextIntoChunks(text, 200, 50);
      this.logger.log(`✂️ Split into ${chunks.length} small chunks`);

      // Traite seulement les 5 premiers chunks pour tester
      const testChunks = chunks.slice(0, 5);
      this.logger.log(`🧪 Testing with first ${testChunks.length} chunks`);

      const allDocuments: VectorDocument[] = [];

      for (let i = 0; i < testChunks.length; i++) {
        const chunk = testChunks[i];
        this.logger.log(`🔄 Processing chunk ${i + 1}/${testChunks.length}`);

        try {
          // Génère l'embedding pour ce chunk
          this.logger.log('🧠 Generating embedding...');
          const embedding = await this.embeddingService.generateEmbedding(chunk);
          this.logger.log('✅ Embedding generated successfully');

          // Crée le document
          const document: VectorDocument = {
            id: `${file.originalname}-test-chunk-${i}`,
            values: embedding,
            metadata: {
              text: chunk,
              source: file.originalname,
              page: i + 1,
              category: body.category || 'legal',
              timestamp: new Date().toISOString(),
            },
          };

          allDocuments.push(document);

          // Upload vers Pinecone
          this.logger.log('🌲 Uploading to Pinecone...');
          await this.pineconeService.uploadDocuments([document]);
          this.logger.log('✅ Uploaded to Pinecone successfully');

          // Pause entre les chunks
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          this.logger.error(`❌ Error processing chunk ${i + 1}:`, error.message);
          throw new Error(`Failed to process chunk ${i + 1}: ${error.message}`);
        }
      }

      this.logger.log('🎉 All chunks processed successfully!');

      return {
        message: 'PDF uploaded and processed successfully (test mode)',
        filename: file.originalname,
        chunksProcessed: allDocuments.length,
        totalChunks: chunks.length,
        documents: allDocuments.map(doc => ({
          id: doc.id,
          textPreview: doc.metadata.text.substring(0, 100) + '...',
          category: doc.metadata.category,
        })),
      };

    } catch (error) {
      this.logger.error('❌ Error in simple upload:', error);
      throw error;
    }
  }

  @Post('upload-pdf-simple-dummy')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined,
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadPDFSimpleDummy(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { category?: string },
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      this.logger.log(`🚀 Starting PDF upload: ${file.originalname}`);
      this.logger.log(`📊 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      // Parse le PDF
      this.logger.log('📖 Parsing PDF...');
      const text = await this.pineconeService.parsePDF(file.buffer);
      this.logger.log(`📝 Extracted ${text.length} characters`);

      // Divise en chunks
      const chunks = this.pineconeService.splitTextIntoChunks(text, 300, 50);
      this.logger.log(`✂️ Split into ${chunks.length} chunks`);

      // Traite seulement les 3 premiers chunks
      const testChunks = chunks.slice(0, 3);
      this.logger.log(`🧪 Processing ${testChunks.length} chunks`);

      const allDocuments: VectorDocument[] = [];

      for (let i = 0; i < testChunks.length; i++) {
        const chunk = testChunks[i];
        this.logger.log(`🔄 Processing chunk ${i + 1}/${testChunks.length}`);

        // Utilise des vecteurs aléatoires
        const dummyVector = Array.from({ length: 1024 }, () => Math.random() - 0.5);
        
        const document: VectorDocument = {
          id: `${file.originalname}-dummy-chunk-${i}`,
          values: dummyVector,
          metadata: {
            text: chunk,
            source: file.originalname,
            page: i + 1,
            category: body.category || 'legal',
            timestamp: new Date().toISOString(),
          },
        };

        allDocuments.push(document);

        // Upload vers Pinecone
        this.logger.log('🌲 Uploading to Pinecone...');
        await this.pineconeService.uploadDocuments([document]);
        this.logger.log('✅ Uploaded to Pinecone successfully');

        // Pause entre les chunks
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.logger.log('🎉 PDF upload completed successfully!');

      return {
        message: 'PDF uploaded successfully (with dummy vectors)',
        filename: file.originalname,
        chunksProcessed: allDocuments.length,
        totalChunks: chunks.length,
        documents: allDocuments.map(doc => ({
          id: doc.id,
          textPreview: doc.metadata.text.substring(0, 100) + '...',
          category: doc.metadata.category,
        })),
      };

    } catch (error) {
      this.logger.error('❌ Error in PDF upload:', error);
      throw error;
    }
  }

  @Post('upload-vectors')
  async uploadVectors(@Body() documents: VectorDocument[]) {
    try {
      await this.pineconeService.uploadDocuments(documents);
      return {
        message: 'Vectors uploaded successfully',
        count: documents.length,
      };
    } catch (error) {
      this.logger.error('Error uploading vectors:', error);
      throw error;
    }
  }

  @Post('search')
  async searchVectors(
    @Body() body: {
      vector: number[];
      topK?: number;
      filter?: any;
    },
  ) {
    try {
      const results = await this.pineconeService.searchSimilar(
        body.vector,
        body.topK || 5,
        body.filter,
      );
      return {
        results,
        count: results.length,
      };
    } catch (error) {
      this.logger.error('Error searching vectors:', error);
      throw error;
    }
  }

  @Post('search-text')
  async searchByText(
    @Body() body: {
      query: string;
      topK?: number;
      filter?: any;
    },
  ) {
    try {
      // Génère l'embedding pour la requête textuelle
      const queryEmbedding = await this.embeddingService.generateEmbedding(body.query);
      
      // Recherche les documents similaires
      const results = await this.pineconeService.searchSimilar(
        queryEmbedding,
        body.topK || 5,
        body.filter,
      );
      
      return {
        query: body.query,
        results,
        count: results.length,
      };
    } catch (error) {
      this.logger.error('Error searching by text:', error);
      throw error;
    }
  }

  @Post('upload-text')
  async uploadText(
    @Body() body: { 
      text: string; 
      category?: string; 
      source?: string;
    },
  ) {
    try {
      if (!body.text || body.text.trim().length === 0) {
        throw new BadRequestException('Text is required');
      }

      this.logger.log('🚀 Starting text upload');
      this.logger.log(`📝 Text length: ${body.text.length} characters`);

      // Divise le texte en chunks
      const chunks = this.pineconeService.splitTextIntoChunks(body.text, 200, 50);
      this.logger.log(`✂️ Split into ${chunks.length} chunks`);

      // Traite seulement les 3 premiers chunks
      const testChunks = chunks.slice(0, 3);
      this.logger.log(`🧪 Testing with first ${testChunks.length} chunks`);

      const allDocuments: VectorDocument[] = [];

      for (let i = 0; i < testChunks.length; i++) {
        const chunk = testChunks[i];
        this.logger.log(`🔄 Processing chunk ${i + 1}/${testChunks.length}`);

        try {
          // Génère l'embedding
          this.logger.log('🧠 Generating embedding...');
          const embedding = await this.embeddingService.generateEmbedding(chunk);
          this.logger.log('✅ Embedding generated successfully');

          // Crée le document
          const document: VectorDocument = {
            id: `text-upload-${Date.now()}-chunk-${i}`,
            values: embedding,
            metadata: {
              text: chunk,
              source: body.source || 'manual-upload',
              page: i + 1,
              category: body.category || 'legal',
              timestamp: new Date().toISOString(),
            },
          };

          allDocuments.push(document);

          // Upload vers Pinecone
          this.logger.log('🌲 Uploading to Pinecone...');
          await this.pineconeService.uploadDocuments([document]);
          this.logger.log('✅ Uploaded to Pinecone successfully');

          // Pause entre les chunks
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          this.logger.error(`❌ Error processing chunk ${i + 1}:`, error.message);
          throw new Error(`Failed to process chunk ${i + 1}: ${error.message}`);
        }
      }

      this.logger.log('🎉 All text chunks processed successfully!');

      return {
        message: 'Text uploaded and processed successfully',
        chunksProcessed: allDocuments.length,
        totalChunks: chunks.length,
        documents: allDocuments.map(doc => ({
          id: doc.id,
          textPreview: doc.metadata.text.substring(0, 100) + '...',
          category: doc.metadata.category,
        })),
      };

    } catch (error) {
      this.logger.error('❌ Error in text upload:', error);
      throw error;
    }
  }

  @Post('test-simple')
  async testSimple() {
    try {
      this.logger.log('🚀 Test simple upload starting...');
      
      // Texte de test très court
      const testText = "Le droit civil régit les relations entre les personnes.";
      
      this.logger.log('🧠 Generating embedding...');
      const embedding = await this.embeddingService.generateEmbedding(testText);
      this.logger.log('✅ Embedding generated successfully');
      
      // Crée un document simple
      const document: VectorDocument = {
        id: `test-${Date.now()}`,
        values: embedding,
        metadata: {
          text: testText,
          source: 'test-simple',
          page: 1,
          category: 'droit-civil',
          timestamp: new Date().toISOString(),
        },
      };
      
      this.logger.log('🌲 Uploading to Pinecone...');
      await this.pineconeService.uploadDocuments([document]);
      this.logger.log('✅ Uploaded to Pinecone successfully');
      
      return {
        message: 'Test upload successful!',
        document: {
          id: document.id,
          text: document.metadata.text,
          category: document.metadata.category,
        },
      };
      
    } catch (error) {
      this.logger.error('❌ Test failed:', error.message);
      throw error;
    }
  }

  @Post('test-pinecone-only')
  async testPineconeOnly() {
    try {
      this.logger.log('🚀 Testing Pinecone connection only...');
      
      // Test simple avec des vecteurs aléatoires
      const dummyVector = Array.from({ length: 1024 }, () => Math.random() - 0.5);
      
      const document: VectorDocument = {
        id: `test-pinecone-${Date.now()}`,
        values: dummyVector,
        metadata: {
          text: "Test document",
          source: 'test-pinecone-only',
          page: 1,
          category: 'test',
          timestamp: new Date().toISOString(),
        },
      };
      
      this.logger.log('🌲 Uploading dummy vector to Pinecone...');
      await this.pineconeService.uploadDocuments([document]);
      this.logger.log('✅ Pinecone upload successful!');
      
      return {
        message: 'Pinecone connection test successful!',
        documentId: document.id,
        vectorLength: dummyVector.length,
      };
      
    } catch (error) {
      this.logger.error('❌ Pinecone test failed:', error.message);
      throw error;
    }
  }

  @Post('upload-simple')
  async uploadSimple(
    @Body() body: { 
      text: string; 
      category?: string; 
      source?: string;
    },
  ) {
    try {
      if (!body.text || body.text.trim().length === 0) {
        throw new BadRequestException('Text is required');
      }

      this.logger.log('🚀 Starting simple upload...');
      this.logger.log(`📝 Text: "${body.text}"`);

      // Divise le texte en chunks
      const chunks = this.pineconeService.splitTextIntoChunks(body.text, 200, 50);
      this.logger.log(`✂️ Split into ${chunks.length} chunks`);

      const allDocuments: VectorDocument[] = [];

      // Traite seulement les 2 premiers chunks
      const testChunks = chunks.slice(0, 2);
      this.logger.log(`🧪 Processing ${testChunks.length} chunks`);

      for (let i = 0; i < testChunks.length; i++) {
        const chunk = testChunks[i];
        this.logger.log(`🔄 Processing chunk ${i + 1}/${testChunks.length}`);

        // Utilise des vecteurs aléatoires au lieu d'OpenAI
        const dummyVector = Array.from({ length: 1024 }, () => Math.random() - 0.5);
        
        const document: VectorDocument = {
          id: `simple-upload-${Date.now()}-chunk-${i}`,
          values: dummyVector,
          metadata: {
            text: chunk,
            source: body.source || 'simple-upload',
            page: i + 1,
            category: body.category || 'legal',
            timestamp: new Date().toISOString(),
          },
        };

        allDocuments.push(document);

        // Upload vers Pinecone
        this.logger.log('🌲 Uploading to Pinecone...');
        await this.pineconeService.uploadDocuments([document]);
        this.logger.log('✅ Uploaded to Pinecone successfully');

        // Pause entre les chunks
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this.logger.log('🎉 All chunks processed successfully!');

      return {
        message: 'Simple upload completed successfully!',
        chunksProcessed: allDocuments.length,
        totalChunks: chunks.length,
        documents: allDocuments.map(doc => ({
          id: doc.id,
          textPreview: doc.metadata.text.substring(0, 50) + '...',
          category: doc.metadata.category,
        })),
      };

    } catch (error) {
      this.logger.error('❌ Error in simple upload:', error);
      throw error;
    }
  }

  @Post('upload-pdf-ultra-simple')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined,
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  async uploadPDFUltraSimple(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { category?: string },
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      this.logger.log(`🚀 ULTRA SIMPLE: Processing ${file.originalname}`);
      this.logger.log(`📊 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      // Parse le PDF
      this.logger.log('📖 Parsing PDF...');
      const text = await this.pineconeService.parsePDF(file.buffer);
      this.logger.log(`📝 Extracted ${text.length} characters`);

      // Prend seulement les 100 premiers caractères
      const shortText = text.substring(0, 100);
      this.logger.log(`✂️ Using first 100 characters: "${shortText}..."`);

      // Crée un seul document avec vecteur aléatoire
      const dummyVector = Array.from({ length: 1024 }, () => Math.random() - 0.5);
      
      const document: VectorDocument = {
        id: `ultra-simple-${Date.now()}`,
        values: dummyVector,
        metadata: {
          text: shortText,
          source: file.originalname,
          page: 1,
          category: body.category || 'legal',
          timestamp: new Date().toISOString(),
        },
      };

      // Upload vers Pinecone
      this.logger.log('🌲 Uploading to Pinecone...');
      await this.pineconeService.uploadDocuments([document]);
      this.logger.log('✅ Uploaded to Pinecone successfully!');

      return {
        message: 'PDF uploaded successfully (ultra simple mode)',
        filename: file.originalname,
        textPreview: shortText,
        documentId: document.id,
        category: body.category || 'legal',
      };

    } catch (error) {
      this.logger.error('❌ Error in ultra simple upload:', error);
      throw error;
    }
  }

  @Post('upload-structured-text')
  async uploadStructuredText(
    @Body() body: { 
      title: string;
      content: string;
      category: string;
      source?: string;
      author?: string;
      date?: string;
    },
  ) {
    try {
      if (!body.title || !body.content || !body.category) {
        throw new BadRequestException('Title, content and category are required');
      }

      this.logger.log('🚀 Starting structured text upload...');
      this.logger.log(`📝 Title: "${body.title}"`);
      this.logger.log(`📄 Content length: ${body.content.length} characters`);
      this.logger.log(`🏷️ Category: ${body.category}`);

      // Divise le contenu en chunks de 500 caractères
      const chunks = this.pineconeService.splitTextIntoChunks(body.content, 500, 100);
      this.logger.log(`✂️ Split into ${chunks.length} chunks`);

      const allDocuments: VectorDocument[] = [];

      // Traite tous les chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        this.logger.log(`🔄 Processing chunk ${i + 1}/${chunks.length}`);

        // Utilise des vecteurs aléatoires (1024 dimensions)
        const dummyVector = Array.from({ length: 1024 }, () => Math.random() - 0.5);
        
        const document: VectorDocument = {
          id: `structured-${Date.now()}-chunk-${i}`,
          values: dummyVector,
          metadata: {
            text: chunk,
            title: body.title,
            source: body.source || 'structured-upload',
            author: body.author || 'unknown',
            date: body.date || new Date().toISOString(),
            page: i + 1,
            category: body.category,
            timestamp: new Date().toISOString(),
            chunkIndex: i,
            totalChunks: chunks.length,
          },
        };

        allDocuments.push(document);

        // Upload vers Pinecone
        this.logger.log('🌲 Uploading to Pinecone...');
        await this.pineconeService.uploadDocuments([document]);
        this.logger.log('✅ Uploaded to Pinecone successfully');

        // Pause entre les chunks
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      this.logger.log('🎉 All structured text chunks processed successfully!');

      return {
        message: 'Structured text uploaded successfully!',
        title: body.title,
        category: body.category,
        chunksProcessed: allDocuments.length,
        totalChunks: chunks.length,
        documents: allDocuments.map(doc => ({
          id: doc.id,
          chunkIndex: doc.metadata.chunkIndex,
          textPreview: doc.metadata.text.substring(0, 100) + '...',
          category: doc.metadata.category,
        })),
      };

    } catch (error) {
      this.logger.error('❌ Error in structured text upload:', error);
      throw error;
    }
  }

  @Get('stats')
  async getStats() {
    try {
      const stats = await this.pineconeService.getIndexStats();
      return stats;
    } catch (error) {
      this.logger.error('Error getting stats:', error);
      throw error;
    }
  }

  @Delete('document/:id')
  async deleteDocument(@Param('id') id: string) {
    try {
      await this.pineconeService.deleteDocument(id);
      return {
        message: 'Document deleted successfully',
        id,
      };
    } catch (error) {
      this.logger.error('Error deleting document:', error);
      throw error;
    }
  }

  @Delete('documents')
  async deleteDocuments(@Body() body: { ids: string[] }) {
    try {
      await this.pineconeService.deleteDocuments(body.ids);
      return {
        message: 'Documents deleted successfully',
        count: body.ids.length,
      };
    } catch (error) {
      this.logger.error('Error deleting documents:', error);
      throw error;
    }
  }

  // Méthode utilitaire pour générer des vecteurs factices (fallback)
  private generateDummyVector(dimensions: number): number[] {
    return Array.from({ length: dimensions }, () => Math.random() - 0.5);
  }
}

