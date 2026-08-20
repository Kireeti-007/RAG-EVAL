export interface DocumentChunk {
  id: string;
  docId: string;
  docTitle: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  sourceType: 'file' | 'pasted' | 'url' | 'preset';
  content: string;
  chunks: DocumentChunk[];
  totalTokens: number;
  uploadedAt: string;
  sizeBytes: number;
}

export interface RetrievedChunk {
  chunk: DocumentChunk;
  score: number; // overall combined score (0-1)
  vectorScore: number;
  keywordScore: number;
  rank: number;
  isUsedInAnswer?: boolean;
}

export interface EvaluationScore {
  id: string;
  timestamp: string;
  query: string;
  answer: string;
  groundTruth?: string;
  
  // Core RAGAS Metrics (0.0 to 1.0)
  faithfulness: number; // Grounded in context
  answerRelevance: number; // Addresses the query
  contextPrecision: number; // Relevant context ranked high
  contextRecall: number; // Retrieved context covers answer
  overallScore: number; // Harmonic mean or weighted composite
  
  // Qualitative flags
  hallucinationDetected: boolean;
  hallucinationRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  hallucinatedClaims: string[];
  groundedClaims: string[];
  
  // Breakdown explanation
  critique: string;
  metricExplanations: {
    faithfulness: string;
    answerRelevance: string;
    contextPrecision: string;
    contextRecall: string;
  };
  
  // Operational Metrics
  latencyMs: number;
  retrievalLatencyMs: number;
  generationLatencyMs: number;
  evalLatencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalCostUsd: number;
  
  retrievedChunks: RetrievedChunk[];
  ragConfigUsed: RAGConfig;
}

export interface RAGConfig {
  chunkStrategy: 'recursive' | 'fixed' | 'semantic' | 'markdown';
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  retrievalMode: 'hybrid' | 'vector' | 'keyword';
  hybridAlpha: number; // 0.0 = pure keyword (BM25), 1.0 = pure vector
  similarityThreshold: number;
  systemPrompt: string;
  temperature: number;
  model: string;
  judgeModel: string;
}

export interface TestCase {
  id: string;
  query: string;
  expectedAnswer: string;
  groundTruthDocId?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'adversarial';
  category: string;
  lastEvalScore?: EvaluationScore;
}

export interface BenchmarkRun {
  id: string;
  name: string;
  timestamp: string;
  testCaseCount: number;
  passedCount: number;
  avgFaithfulness: number;
  avgRelevance: number;
  avgContextPrecision: number;
  avgContextRecall: number;
  avgOverallScore: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  config: RAGConfig;
  results: EvaluationScore[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  retrievedChunks?: RetrievedChunk[];
  evaluation?: EvaluationScore;
  latencyMs?: number;
  tokenCount?: {
    prompt: number;
    completion: number;
  };
  isEvaluating?: boolean;
}
