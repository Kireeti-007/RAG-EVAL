import { DocumentChunk, DocumentItem, RAGConfig, RetrievedChunk } from '../types';

/**
 * Estimate token count using roughly ~4 characters per token
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.trim().length / 3.8);
}

/**
 * Chunks a document based on selected strategy
 */
export function chunkDocument(
  docId: string,
  docTitle: string,
  content: string,
  strategy: RAGConfig['chunkStrategy'] = 'recursive',
  chunkSize: number = 400,
  overlap: number = 60
): DocumentChunk[] {
  if (!content || !content.trim()) return [];

  let rawChunks: string[] = [];

  switch (strategy) {
    case 'markdown':
      rawChunks = chunkByMarkdownHeaders(content, chunkSize, overlap);
      break;
    case 'fixed':
      rawChunks = chunkFixedSize(content, chunkSize, overlap);
      break;
    case 'semantic':
      rawChunks = chunkSemanticSentences(content, chunkSize, overlap);
      break;
    case 'recursive':
    default:
      rawChunks = chunkRecursive(content, chunkSize, overlap);
      break;
  }

  return rawChunks.map((chunkText, idx) => ({
    id: `${docId}_chunk_${idx + 1}`,
    docId,
    docTitle,
    content: chunkText.trim(),
    chunkIndex: idx + 1,
    tokenCount: estimateTokens(chunkText),
    metadata: {
      strategy,
      charLength: chunkText.length,
    }
  }));
}

/**
 * Recursive character splitter
 */
function chunkRecursive(text: string, chunkSize: number, overlap: number): string[] {
  const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];
  
  function splitHelper(currentText: string, sepIndex: number): string[] {
    if (currentText.length <= chunkSize) {
      return [currentText];
    }
    if (sepIndex >= separators.length) {
      // Hard slice
      const chunks: string[] = [];
      let i = 0;
      while (i < currentText.length) {
        const end = Math.min(i + chunkSize, currentText.length);
        chunks.push(currentText.slice(i, end));
        i += chunkSize - overlap;
        if (i <= 0) break;
      }
      return chunks;
    }

    const sep = separators[sepIndex];
    const parts = currentText.split(sep);
    const result: string[] = [];
    let currentAccum = '';

    for (let part of parts) {
      const candidate = currentAccum ? `${currentAccum}${sep}${part}` : part;
      if (candidate.length <= chunkSize) {
        currentAccum = candidate;
      } else {
        if (currentAccum) {
          result.push(currentAccum);
          // compute overlap from end of currentAccum
          const overlapText = currentAccum.slice(Math.max(0, currentAccum.length - overlap));
          currentAccum = overlapText ? `${overlapText}${sep}${part}` : part;
        } else {
          // Single part exceeds chunkSize, recurse with finer separator
          const subChunks = splitHelper(part, sepIndex + 1);
          result.push(...subChunks);
        }
      }
    }
    if (currentAccum && currentAccum.trim()) {
      result.push(currentAccum);
    }
    return result;
  }

  return splitHelper(text, 0).filter(c => c.trim().length > 15);
}

/**
 * Fixed size character chunker with overlap
 */
function chunkFixedSize(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start += Math.max(1, chunkSize - overlap);
  }
  return chunks.filter(c => c.trim().length > 10);
}

/**
 * Markdown header hierarchy chunker
 */
function chunkByMarkdownHeaders(text: string, maxChunkSize: number, overlap: number): string[] {
  const lines = text.split('\n');
  const sections: { header: string; content: string }[] = [];
  let currentHeader = 'Introduction';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('#')) {
      if (currentLines.length > 0) {
        sections.push({ header: currentHeader, content: currentLines.join('\n') });
        currentLines = [];
      }
      currentHeader = line.replace(/^#+\s*/, '').trim();
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    sections.push({ header: currentHeader, content: currentLines.join('\n') });
  }

  const chunks: string[] = [];
  for (const section of sections) {
    const fullSectionText = `### ${section.header}\n${section.content}`.trim();
    if (fullSectionText.length <= maxChunkSize) {
      chunks.push(fullSectionText);
    } else {
      const subChunks = chunkRecursive(fullSectionText, maxChunkSize, overlap);
      chunks.push(...subChunks);
    }
  }
  return chunks.filter(c => c.trim().length > 15);
}

/**
 * Semantic sentence chunker (groups full sentences until chunk limit)
 */
function chunkSemanticSentences(text: string, chunkSize: number, overlap: number): string[] {
  // Regex to split by sentences while preserving punctuation
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (let sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if ((currentChunk + ' ' + trimmed).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        // Add overlap from last sentence if possible
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(Math.max(0, words.length - Math.floor(overlap / 6))).join(' ');
        currentChunk = overlapWords ? `${overlapWords} ${trimmed}` : trimmed;
      } else {
        chunks.push(trimmed);
      }
    }
  }
  if (currentChunk && currentChunk.trim()) {
    chunks.push(currentChunk);
  }
  return chunks.filter(c => c.trim().length > 15);
}

// ----------------------------------------------------
// HYBRID RETRIEVAL (BM25 + Dense Cosine Vector Similarity)
// ----------------------------------------------------

/**
 * Tokenize text for BM25
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

/**
 * Compute BM25 scores for chunks given a query
 */
export function computeBM25Scores(query: string, chunks: DocumentChunk[]): number[] {
  if (chunks.length === 0) return [];
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return chunks.map(() => 0);

  const k1 = 1.5;
  const b = 0.75;
  const N = chunks.length;

  // Compute doc lengths and average length
  const docTokens = chunks.map(c => tokenize(c.content + ' ' + c.docTitle));
  const docLens = docTokens.map(dt => dt.length);
  const avgdl = docLens.reduce((a, b) => a + b, 0) / (N || 1);

  // Term frequencies per doc
  const docTermFreqs: Map<string, number>[] = docTokens.map(tokens => {
    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
    return tf;
  });

  // Document frequencies per term
  const df = new Map<string, number>();
  for (const term of queryTerms) {
    let count = 0;
    for (const tfMap of docTermFreqs) {
      if (tfMap.has(term)) count++;
    }
    df.set(term, count);
  }

  // Calculate BM25 for each chunk
  const scores: number[] = chunks.map((_, i) => {
    let score = 0;
    const tfMap = docTermFreqs[i];
    const docLen = docLens[i];

    for (const term of queryTerms) {
      const freq = tfMap.get(term) || 0;
      if (freq === 0) continue;
      const n = df.get(term) || 0;
      const idf = Math.log((N - n + 0.5) / (n + 0.5) + 1);
      const numerator = freq * (k1 + 1);
      const denominator = freq + k1 * (1 - b + b * (docLen / (avgdl || 1)));
      score += idf * (numerator / denominator);
    }
    return score;
  });

  // Normalize scores to [0, 1]
  const maxScore = Math.max(...scores, 0.0001);
  return scores.map(s => Math.max(0, Math.min(1, s / maxScore)));
}

/**
 * Computes semantic keyword/n-gram vector similarity fallback
 */
export function computeSemanticSim(query: string, chunk: DocumentChunk): number {
  const qTerms = new Set(tokenize(query));
  const cTerms = tokenize(chunk.content + ' ' + chunk.docTitle);
  if (qTerms.size === 0 || cTerms.length === 0) return 0;

  let hits = 0;
  for (const t of cTerms) {
    if (qTerms.has(t)) hits++;
  }
  const jaccard = hits / (qTerms.size + cTerms.length - hits);
  const coverage = Math.min(1, hits / (qTerms.size * 2));
  return Math.min(1, jaccard * 0.4 + coverage * 0.6);
}

/**
 * Hybrid retrieval engine combining vector & keyword
 */
export function hybridRetrieve(
  query: string,
  allChunks: DocumentChunk[],
  config: RAGConfig,
  vectorScoreMap?: Map<string, number>
): RetrievedChunk[] {
  if (allChunks.length === 0) return [];

  const bm25Scores = computeBM25Scores(query, allChunks);
  const alpha = config.hybridAlpha ?? 0.5; // 1.0 is pure vector, 0.0 is pure BM25

  const results: RetrievedChunk[] = allChunks.map((chunk, idx) => {
    const keywordScore = bm25Scores[idx] || 0;
    const vectorScore = vectorScoreMap?.get(chunk.id) ?? computeSemanticSim(query, chunk);

    let combinedScore = 0;
    if (config.retrievalMode === 'vector') {
      combinedScore = vectorScore;
    } else if (config.retrievalMode === 'keyword') {
      combinedScore = keywordScore;
    } else {
      // Hybrid blending
      combinedScore = alpha * vectorScore + (1 - alpha) * keywordScore;
    }

    return {
      chunk,
      score: combinedScore,
      vectorScore,
      keywordScore,
      rank: 0,
    };
  });

  // Filter by threshold and sort descending
  const threshold = config.similarityThreshold || 0.1;
  const filtered = results
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, config.topK || 4);

  return filtered.map((item, i) => ({
    ...item,
    rank: i + 1,
  }));
}
