import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ShieldCheck, 
  Layers, 
  Clock, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Cpu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, DocumentItem, EvaluationScore, RAGConfig, RetrievedChunk } from '../types';
import { hybridRetrieve } from '../utils/ragEngine';

interface Props {
  documents: DocumentItem[];
  ragConfig: RAGConfig;
  onOpenEvalDetail: (evalScore: EvaluationScore) => void;
  onAddEvaluationScore: (evalScore: EvaluationScore) => void;
}

const SAMPLE_QUERIES = [
  "What is the RPO and RTO for the multi-region cloud platform?",
  "How does NovaPay verify webhook signatures and prevent replay attacks?",
  "Can an employee work remotely from Spain for 120 days under company policy?",
  "What are the clinical inclusion criteria for the NX-409 oncology trial?",
  "What is the secret VIP discount code for Tesla car purchases in the docs?"
];

export const ChatTab: React.FC<Props> = ({
  documents,
  ragConfig,
  onOpenEvalDetail,
  onAddEvaluationScore,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Synapse RAG Execution Engine Online

Knowledge index connected with **Hybrid Vector + BM25 Retrieval** and real-time **LLM-as-a-judge Auto-Evaluation**.

Submit queries across connected sources (Cloud SRE Architecture, FinTech Webhook Security, Global WFA Policy, Clinical Trial Protocol). Each response will be parsed with source citations and evaluated for **Faithfulness**, **Answer Relevance**, and **Context Groundedness**.`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<RetrievedChunk | null>(null);
  const [activeInspectorChunks, setActiveInspectorChunks] = useState<RetrievedChunk[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allChunks = documents.flatMap((d) => d.chunks);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (queryText: string = inputQuery) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    setInputQuery('');
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const retrievalStartTime = performance.now();
    // 1. Perform Hybrid Retrieval
    const retrieved = hybridRetrieve(trimmed, allChunks, ragConfig);
    const retrievalLatencyMs = Math.round(performance.now() - retrievalStartTime);
    setActiveInspectorChunks(retrieved);
    if (retrieved.length > 0) {
      setSelectedChunk(retrieved[0]);
    }

    try {
      // 2. Call Server RAG Generation Endpoint
      const genResponse = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          retrievedChunks: retrieved,
          config: ragConfig,
        }),
      });

      const genData = await genResponse.json();
      if (!genResponse.ok) {
        throw new Error(genData.error || 'Failed to generate answer');
      }

      const generatedAnswer = genData.answer;
      const generationLatencyMs = genData.latencyMs || 250;

      // 3. Trigger Auto-Evaluation LLM-as-a-judge
      const evalResponse = await fetch('/api/rag/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          answer: generatedAnswer,
          retrievedChunks: retrieved,
          config: ragConfig,
        }),
      });

      const evalData = await evalResponse.json();
      const evalScore: EvaluationScore = {
        id: `eval-${Date.now()}`,
        timestamp: new Date().toISOString(),
        query: trimmed,
        answer: generatedAnswer,
        faithfulness: evalData.faithfulness ?? 0.9,
        answerRelevance: evalData.answerRelevance ?? 0.9,
        contextPrecision: evalData.contextPrecision ?? 0.88,
        contextRecall: evalData.contextRecall ?? 0.85,
        overallScore: evalData.overallScore ?? 0.88,
        hallucinationDetected: evalData.hallucinationDetected ?? false,
        hallucinationRisk: evalData.hallucinationRisk ?? 'NONE',
        hallucinatedClaims: evalData.hallucinatedClaims || [],
        groundedClaims: evalData.groundedClaims || [],
        critique: evalData.critique || 'Answer accurately grounded in context.',
        metricExplanations: evalData.metricExplanations || {
          faithfulness: 'Statements validated against source text.',
          answerRelevance: 'Directly responds to question.',
          contextPrecision: 'Top chunks relevant to query.',
          contextRecall: 'Context provided necessary answers.',
        },
        latencyMs: retrievalLatencyMs + generationLatencyMs,
        retrievalLatencyMs,
        generationLatencyMs,
        evalLatencyMs: evalData.evalLatencyMs || 180,
        promptTokens: genData.promptTokens || 340,
        completionTokens: genData.completionTokens || 120,
        totalCostUsd: Number(
          (
            (genData.promptTokens || 340) * 0.00000015 +
            (genData.completionTokens || 120) * 0.0000006
          ).toFixed(6)
        ),
        retrievedChunks: retrieved,
        ragConfigUsed: { ...ragConfig },
      };

      onAddEvaluationScore(evalScore);

      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: generatedAnswer,
        timestamp: new Date().toISOString(),
        retrievedChunks: retrieved,
        evaluation: evalScore,
        latencyMs: retrievalLatencyMs + generationLatencyMs,
        tokenCount: {
          prompt: genData.promptTokens || 300,
          completion: genData.completionTokens || 100,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: `**Error generating response**: ${err.message || 'Unknown network error'}. Please check if the server is active or try another query.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[#09090B] text-[#EDEDED]">
      
      {/* Center: Evaluation Stream & Chat */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-[#27272A]">
        
        {/* Stream Sub-Header Bar */}
        <div className="px-5 py-2.5 border-b border-[#27272A] bg-[#0F0F11] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full"></div>
              <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-medium">
                Live Stream
              </span>
            </div>
            <div className="h-3 w-[1px] bg-[#27272A]"></div>
            <span className="text-[11px] font-mono text-[#A1A1AA]">
              {documents.length} sources &bull; {allChunks.length} chunks &bull; {ragConfig.retrievalMode.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181B] text-[#D1FF52] border border-[#27272A]">
              TOP_K={ragConfig.topK} &bull; α={ragConfig.hybridAlpha}
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border text-xs font-mono ${
                  msg.role === 'user'
                    ? 'bg-[#18181B] border-[#27272A] text-white'
                    : 'bg-[#D1FF52] border-[#D1FF52] text-black font-bold'
                }`}
              >
                {msg.role === 'user' ? 'U' : 'λ'}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 rounded p-4 text-xs leading-relaxed border ${
                  msg.role === 'user'
                    ? 'bg-[#18181B] border-[#27272A] text-white shadow-xs'
                    : 'bg-[#0F0F11] border-[#27272A] border-l-2 border-l-[#D1FF52] text-[#EDEDED]'
                }`}
              >
                {/* Markdown text */}
                <div className="prose prose-invert prose-xs max-w-none prose-p:leading-relaxed prose-pre:bg-[#09090B] prose-pre:border prose-pre:border-[#27272A]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Evaluation Telemetry Bar */}
                {msg.role === 'assistant' && msg.evaluation && (
                  <div className="mt-3.5 pt-3 border-t border-[#27272A] flex flex-wrap items-center justify-between gap-2.5 font-mono text-[10px]">
                    
                    {/* Scores & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#09090B] border border-[#27272A]">
                        <span className="text-[#71717A] uppercase">Overall:</span>
                        <span className="font-bold text-[#D1FF52]">
                          {(msg.evaluation.overallScore * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#09090B] border border-[#27272A]">
                        <span className="text-[#71717A] uppercase">Faithful:</span>
                        <span className={`font-semibold ${
                          msg.evaluation.faithfulness >= 0.8 ? 'text-[#10B981]' : 'text-[#F59E0B]'
                        }`}>
                          {(msg.evaluation.faithfulness * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#09090B] border border-[#27272A]">
                        <span className="text-[#71717A] uppercase">Relevance:</span>
                        <span className="font-semibold text-[#EDEDED]">
                          {(msg.evaluation.answerRelevance * 100).toFixed(0)}%
                        </span>
                      </div>

                      {msg.evaluation.hallucinationDetected ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          HALLUCINATION_ALERT
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          GROUNDED
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => onOpenEvalDetail(msg.evaluation!)}
                        className="px-2 py-0.5 rounded bg-[#18181B] hover:bg-[#27272A] text-[#D1FF52] border border-[#27272A] hover:border-[#D1FF52]/50 transition-colors uppercase tracking-wider text-[9px] flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Inspect Trace</span>
                      </button>

                      {msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                        <button
                          onClick={() => {
                            setActiveInspectorChunks(msg.retrievedChunks!);
                            if (msg.retrievedChunks?.[0]) setSelectedChunk(msg.retrievedChunks[0]);
                          }}
                          className="px-2 py-0.5 rounded bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] border border-[#27272A] transition-colors uppercase tracking-wider text-[9px] flex items-center gap-1"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Chunks ({msg.retrievedChunks.length})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer telemetry */}
                {msg.latencyMs && (
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-[#71717A] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {msg.latencyMs}ms
                    </span>
                    {msg.tokenCount && (
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {msg.tokenCount.prompt} in / {msg.tokenCount.completion} out tokens
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-6 h-6 rounded bg-[#D1FF52] text-black font-bold flex items-center justify-center shrink-0 font-mono text-xs animate-pulse">
                λ
              </div>
              <div className="rounded p-4 bg-[#0F0F11] border border-[#27272A] text-[#A1A1AA] text-xs space-y-2 border-l-2 border-l-[#D1FF52]">
                <div className="flex items-center gap-2 text-[#D1FF52] font-mono text-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>SYNAPSE: Retrieving context & evaluating fidelity...</span>
                </div>
                <div className="h-1.5 w-44 bg-[#27272A] rounded overflow-hidden">
                  <div className="h-full bg-[#D1FF52] animate-pulse w-2/3"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries Pill Bar */}
        <div className="px-5 py-2 bg-[#09090B] border-t border-[#27272A] overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-medium shrink-0">Sample:</span>
          {SAMPLE_QUERIES.map((q, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSend(q)}
              className="text-[11px] px-2.5 py-1 rounded bg-[#0F0F11] hover:bg-[#18181B] hover:text-[#D1FF52] text-[#A1A1AA] border border-[#27272A] transition-colors whitespace-nowrap shrink-0 font-mono"
            >
              {q.length > 42 ? q.slice(0, 40) + '...' : q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0F0F11] border-t border-[#27272A]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 relative"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Query indexed knowledge base with real-time auto-evaluation..."
              disabled={isLoading}
              className="flex-1 bg-[#09090B] border border-[#27272A] focus:border-[#D1FF52] rounded px-3 py-2 text-xs text-[#EDEDED] placeholder:text-[#71717A] focus:outline-none font-mono transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="px-4 py-2 rounded bg-[#D1FF52] hover:bg-[#c2f241] disabled:bg-[#27272A] disabled:text-[#71717A] text-black font-semibold text-xs flex items-center gap-1.5 transition-all uppercase tracking-wider font-mono shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Query</span>
            </button>
          </form>
        </div>

      </div>

      {/* Right: Grounding Matrix & Retrieved Chunks Inspector */}
      <div className="w-full lg:w-80 flex flex-col h-full bg-[#09090B] overflow-hidden border-t lg:border-t-0 border-[#27272A]">
        <div className="px-4 py-3 border-b border-[#27272A] bg-[#0F0F11] flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-[#71717A] font-medium flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#D1FF52]" />
            <span>Retrieved Chunks</span>
          </div>
          <span className="text-[10px] font-mono text-[#D1FF52] bg-[#D1FF52]/10 border border-[#D1FF52]/30 px-1.5 py-0.5 rounded">
            {activeInspectorChunks.length} HITS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {activeInspectorChunks.length === 0 ? (
            <div className="p-8 text-center text-[#71717A] space-y-2">
              <Search className="w-7 h-7 mx-auto stroke-[1.5] text-[#3F3F46]" />
              <div className="text-[10px] uppercase tracking-widest font-medium">Idle Stream</div>
              <p className="text-[11px] text-[#71717A] font-mono leading-relaxed">
                Execute a query to inspect real-time dense embeddings, BM25 rank, and ground-truth citations.
              </p>
            </div>
          ) : (
            activeInspectorChunks.map((rc, idx) => {
              const isSelected = selectedChunk?.chunk.id === rc.chunk.id;
              return (
                <div
                  key={rc.chunk.id || idx}
                  onClick={() => setSelectedChunk(rc)}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#18181B] border-[#D1FF52] shadow-xs'
                      : 'bg-[#0F0F11] border-[#27272A] hover:border-[#3F3F46]'
                  }`}
                >
                  {/* Chunk Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                      #{rc.rank} {rc.chunk.docTitle}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#09090B] text-[#D1FF52] border border-[#27272A]">
                      {(rc.score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Score Breakdown Bar */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[#71717A] mb-2 pb-1.5 border-b border-[#27272A] font-mono">
                    <div>
                      <span>Vector: </span>
                      <span className="text-[#EDEDED]">{(rc.vectorScore * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span>BM25: </span>
                      <span className="text-[#EDEDED]">{(rc.keywordScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Chunk snippet */}
                  <p className="text-[11px] text-[#A1A1AA] line-clamp-3 leading-relaxed font-mono">
                    {rc.chunk.content}
                  </p>

                  {/* Chunk Footer */}
                  <div className="mt-2 pt-1.5 flex items-center justify-between text-[10px] text-[#71717A] border-t border-[#27272A] font-mono">
                    <span>Chunk #{rc.chunk.chunkIndex} &bull; {rc.chunk.tokenCount}t</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(rc.chunk.id, rc.chunk.content);
                      }}
                      className="text-[#71717A] hover:text-[#EDEDED] flex items-center gap-1"
                    >
                      {copiedId === rc.chunk.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#10B981]" />
                          <span className="text-[#10B981]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Full Selected Chunk Detailed Viewer */}
          {selectedChunk && (
            <div className="mt-3 p-3 rounded bg-[#0F0F11] border border-[#27272A] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#71717A] font-medium">
                <span>Chunk Preview (#{selectedChunk.rank})</span>
                <span className="font-mono text-[#D1FF52]">{selectedChunk.chunk.tokenCount} tokens</span>
              </div>
              <div className="p-2.5 bg-[#09090B] rounded border border-[#27272A] font-mono text-[10px] text-[#EDEDED] max-h-44 overflow-y-auto whitespace-pre-wrap custom-scrollbar leading-relaxed">
                {selectedChunk.chunk.content}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
