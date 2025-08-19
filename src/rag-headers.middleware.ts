import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RAGHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Ajouter des headers pour identifier les réponses RAG
    if (req.path.includes('/rag/') || req.path.includes('/legal-assistant/') || req.path.includes('/citizens/')) {
      res.setHeader('X-AI-System', 'Xaali-RAG');
      res.setHeader('X-RAG-Enabled', 'true');
      res.setHeader('X-RAG-Components', 'Pinecone,OpenAI,NestJS');
      res.setHeader('X-Response-Type', 'AI-Generated');
      res.setHeader('X-Legal-Disclaimer', 'AI-assisted legal information - consult a lawyer for specific advice');
    }
    
    next();
  }
}