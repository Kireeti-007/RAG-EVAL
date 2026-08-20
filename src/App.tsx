import React, { useState } from 'react';
import { 
  Bot, 
  Layers, 
  BarChart3, 
  FileCheck, 
  Settings, 
  ShieldCheck, 
  Activity,
  Database,
  Terminal,
  Cpu
} from 'lucide-react';
import { BenchmarkRun, DocumentItem, EvaluationScore, RAGConfig, TestCase } from './types';
import { SAMPLE_DOCS, INITIAL_TEST_CASES } from './data/sampleDocs';
import { chunkDocument } from './utils/ragEngine';
import { ChatTab } from './components/ChatTab';
import { EvalDashboardTab } from './components/EvalDashboardTab';
import { BenchmarkingTab } from './components/BenchmarkingTab';
import { KnowledgeBaseTab } from './components/KnowledgeBaseTab';
import { SettingsTab } from './components/SettingsTab';
import { EvaluationDetailModal } from './components/EvaluationDetailModal';

const DEFAULT_RAG_CONFIG: RAGConfig = {
  chunkStrategy: 'recursive',
  chunkSize: 450,
  chunkOverlap: 60,
  topK: 4,
  retrievalMode: 'hybrid',
  hybridAlpha: 0.65,
  similarityThreshold: 0.15,
  systemPrompt: `You are an expert, precise enterprise RAG (Retrieval-Augmented Generation) assistant.
Answer the user's question accurately using ONLY the provided Context Sources.
Rules:
1. Ground your answer strictly on the provided sources. Do not make up facts or extrapolate beyond what is stated.
2. Cite your sources directly using bracket notation like [Document Name: Chunk #] or [SOURCE X] when stating key facts.
3. If the provided context does NOT contain enough information to answer the question, explicitly state: "Based on the provided documents, I do not have enough information to answer this question."`,
  temperature: 0.2,
  model: 'gemini-3.7-flash',
  judgeModel: 'gemini-3.7-flash',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'eval' | 'benchmarks' | 'knowledge' | 'settings'>('chat');
  const [ragConfig, setRagConfig] = useState<RAGConfig>(DEFAULT_RAG_CONFIG);
  const [selectedEvalDetail, setSelectedEvalDetail] = useState<EvaluationScore | null>(null);

  // Initialize preloaded documents
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    return SAMPLE_DOCS.map((sample) => {
      const chunks = chunkDocument(
        sample.id,
        sample.title,
        sample.content,
        DEFAULT_RAG_CONFIG.chunkStrategy,
        DEFAULT_RAG_CONFIG.chunkSize,
        DEFAULT_RAG_CONFIG.chunkOverlap
      );
      return {
        id: sample.id,
        title: sample.title,
        category: sample.category,
        sourceType: 'preset',
        content: sample.content,
        chunks,
        totalTokens: chunks.reduce((acc, c) => acc + c.tokenCount, 0),
        uploadedAt: new Date().toISOString(),
        sizeBytes: sample.content.length,
      };
    });
  });

  // Test cases
  const [testCases, setTestCases] = useState<TestCase[]>(INITIAL_TEST_CASES);

  // Initial seeded evaluation runs
  const [evaluations, setEvaluations] = useState<EvaluationScore[]>([
    {
      id: 'init-eval-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      query: 'What is the RPO and RTO for the multi-region cloud platform?',
      answer: 'According to the Multi-Region Architecture specs, the Recovery Point Objective (RPO) is <= 5 seconds for critical transactional state via asynchronous cross-region Raft replication (0 seconds for quorum-confirmed writes), and the Recovery Time Objective (RTO) is <= 45 seconds for automated DNS/Anycast rerouting.',
      faithfulness: 0.98,
      answerRelevance: 0.96,
      contextPrecision: 0.95,
      contextRecall: 0.92,
      overallScore: 0.95,
      hallucinationDetected: false,
      hallucinationRisk: 'NONE',
      hallucinatedClaims: [],
      groundedClaims: [
        'RPO is <= 5 seconds for critical transactional state (0s for quorum confirmed)',
        'RTO is <= 45 seconds for automated DNS/Anycast traffic rerouting',
      ],
      critique: 'Extremely high fidelity response with zero hallucinated artifacts. All quantitative metrics correspond exactly to the SRE architecture document.',
      metricExplanations: {
        faithfulness: 'Every numerical constraint matches the source verbatim.',
        answerRelevance: 'Directly and concisely answers both RPO and RTO parameters.',
        contextPrecision: 'The top-ranked chunk contained the complete Section 2 answer signal.',
        contextRecall: 'Retrieved context covered all SLA recovery specifications.',
      },
      latencyMs: 312,
      retrievalLatencyMs: 24,
      generationLatencyMs: 288,
      evalLatencyMs: 195,
      promptTokens: 420,
      completionTokens: 85,
      totalCostUsd: 0.000114,
      retrievedChunks: [],
      ragConfigUsed: DEFAULT_RAG_CONFIG,
    },
    {
      id: 'init-eval-2',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      query: 'How does NovaPay prevent replay attacks on webhook notifications?',
      answer: 'NovaPay prevents replay attacks through timestamp verification in the X-NovaPay-Signature header. Merchants must extract the Unix timestamp t and reject any request where |current_time - t| exceeds 300 seconds (5-minute window), followed by constant-time HMAC-SHA256 comparison.',
      faithfulness: 0.96,
      answerRelevance: 0.94,
      contextPrecision: 0.92,
      contextRecall: 0.90,
      overallScore: 0.93,
      hallucinationDetected: false,
      hallucinationRisk: 'NONE',
      hallucinatedClaims: [],
      groundedClaims: [
        'Timestamp t is extracted from X-NovaPay-Signature header',
        'Tolerance window is 300 seconds (5 minutes)',
        'Constant-time crypto.timingSafeEqual comparison required',
      ],
      critique: 'Solid factual precision with exact replay tolerance window and algorithm details.',
      metricExplanations: {
        faithfulness: 'All 4 verification steps match NovaPay specs precisely.',
        answerRelevance: 'Explains replay prevention without extraneous event listing.',
        contextPrecision: 'Section 2 cryptographic specs chunk retrieved with top rank.',
        contextRecall: 'Retrieved chunk fully explained security requirements.',
      },
      latencyMs: 340,
      retrievalLatencyMs: 28,
      generationLatencyMs: 312,
      evalLatencyMs: 180,
      promptTokens: 460,
      completionTokens: 92,
      totalCostUsd: 0.000124,
      retrievedChunks: [],
      ragConfigUsed: DEFAULT_RAG_CONFIG,
    },
    {
      id: 'init-eval-3',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      query: 'Can an employee work remotely from Spain for 120 days under company policy?',
      answer: 'No. The Global Remote Work Policy permits working outside primary tax jurisdiction for a maximum of 90 calendar days per rolling 12-month period. Exceeding 90 days creates corporate Permanent Establishment (PE) tax risk and requires written approval from Legal and People Operations.',
      faithfulness: 0.95,
      answerRelevance: 0.95,
      contextPrecision: 0.90,
      contextRecall: 0.92,
      overallScore: 0.93,
      hallucinationDetected: false,
      hallucinationRisk: 'NONE',
      hallucinatedClaims: [],
      groundedClaims: [
        'Remote work outside tax residency capped at 90 calendar days per 12 months',
        'Exceeding 90 days creates Permanent Establishment tax risk',
      ],
      critique: 'Correctly reasons across jurisdictional limit and specifies PE corporate tax liability reason.',
      metricExplanations: {
        faithfulness: 'Grounding accurately reflects Section 4 policy.',
        answerRelevance: 'Directly answers Spain 120-day inquiry with rationale.',
        contextPrecision: 'Retrieved WFA section with high relevance.',
        contextRecall: 'Sufficient policy context retrieved.',
      },
      latencyMs: 295,
      retrievalLatencyMs: 22,
      generationLatencyMs: 273,
      evalLatencyMs: 175,
      promptTokens: 390,
      completionTokens: 80,
      totalCostUsd: 0.000106,
      retrievedChunks: [],
      ragConfigUsed: DEFAULT_RAG_CONFIG,
    },
  ]);

  // Initial baseline benchmark run
  const [benchmarkRuns, setBenchmarkRuns] = useState<BenchmarkRun[]>([
    {
      id: 'run-init-baseline',
      name: 'Baseline Enterprise Golden Suite (Hybrid α=0.65)',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      testCaseCount: 5,
      passedCount: 5,
      avgFaithfulness: 0.94,
      avgRelevance: 0.92,
      avgContextPrecision: 0.90,
      avgContextRecall: 0.88,
      avgOverallScore: 0.91,
      avgLatencyMs: 325,
      totalCostUsd: 0.00062,
      config: DEFAULT_RAG_CONFIG,
      results: evaluations,
    },
  ]);

  const handleAddEvaluationScore = (score: EvaluationScore) => {
    setEvaluations((prev) => [score, ...prev]);
  };

  const handleUpdateConfig = (partial: Partial<RAGConfig>) => {
    setRagConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleResetDefaults = () => {
    setRagConfig(DEFAULT_RAG_CONFIG);
  };

  const handleAddTestCase = (tc: TestCase) => {
    setTestCases((prev) => [...prev, tc]);
  };

  const handleDeleteTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((t) => t.id !== id));
  };

  const handleBenchmarkCompleted = (run: BenchmarkRun) => {
    setBenchmarkRuns((prev) => [run, ...prev]);
    setEvaluations((prev) => [...run.results, ...prev]);
  };

  const totalChunks = documents.reduce((acc, d) => acc + d.chunks.length, 0);
  const avgFaithfulness = evaluations.length
    ? (
        evaluations.reduce((acc, e) => acc + e.faithfulness, 0) / evaluations.length
      ).toFixed(2)
    : '0.94';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090B] text-[#EDEDED] font-sans antialiased overflow-hidden select-none">
      
      {/* High Density Global Header */}
      <header className="h-14 shrink-0 bg-[#09090B] border-b border-[#27272A] px-5 flex items-center justify-between z-30">
        
        {/* Left: Brand Identity in High Density Theme */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#D1FF52] rounded flex items-center justify-center shadow-sm">
            <div className="w-2 h-2 bg-black rotate-45"></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">
              SYNAPSE <span className="text-[#71717A] text-xs font-medium">RAG EVAL</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#D1FF52] bg-[#D1FF52]/10 border border-[#D1FF52]/30 px-1.5 py-0.5 rounded font-mono font-medium">
              v2.4
            </span>
          </div>
        </div>

        {/* Center: High Density Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0F0F11] p-1 rounded border border-[#27272A]">
          {[
            { id: 'chat', label: 'Evaluation Stream & Chat', icon: Bot },
            { id: 'eval', label: 'Grounding Matrix & Analytics', icon: BarChart3 },
            { id: 'benchmarks', label: 'Benchmark Test Suite', icon: FileCheck },
            { id: 'knowledge', label: 'Vector Store & Chunks', icon: Layers },
            { id: 'settings', label: 'Pipeline Config', icon: Settings },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-[#18181B] text-[#D1FF52] border border-[#27272A] shadow-xs'
                    : 'text-[#71717A] hover:text-[#EDEDED] hover:bg-[#18181B]/50'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D1FF52]' : 'text-[#71717A]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Live Telemetry Status Badges */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-medium hidden sm:inline">
              Pipeline: <span className="text-[#10B981] font-mono font-semibold">Live</span>
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#27272A] hidden sm:block"></div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#EDEDED]">
              <span className="text-[10px] uppercase tracking-widest text-[#71717A]">Faithfulness</span>
              <span className="text-[#D1FF52] font-semibold">{avgFaithfulness}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-[#EDEDED]">
              <span className="text-[10px] uppercase tracking-widest text-[#71717A]">Chunks</span>
              <span className="text-white font-medium">{totalChunks}</span>
            </div>
            
            <span className="text-[10px] text-[#71717A] font-mono">0x7E2...A9B</span>
          </div>
        </div>

      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-[#0F0F11] border-b border-[#27272A] p-1 overflow-x-auto text-[11px]">
        {[
          { id: 'chat', label: 'Chat', icon: Bot },
          { id: 'eval', label: 'Eval', icon: BarChart3 },
          { id: 'benchmarks', label: 'Benchmark', icon: FileCheck },
          { id: 'knowledge', label: 'Sources', icon: Layers },
          { id: 'settings', label: 'Config', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-2.5 py-1 rounded flex items-center gap-1 text-xs ${
              activeTab === tab.id
                ? 'bg-[#18181B] text-[#D1FF52] border border-[#27272A] font-medium'
                : 'text-[#71717A]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden relative bg-[#09090B]">
        {activeTab === 'chat' && (
          <ChatTab
            documents={documents}
            ragConfig={ragConfig}
            onOpenEvalDetail={(ev) => setSelectedEvalDetail(ev)}
            onAddEvaluationScore={handleAddEvaluationScore}
          />
        )}

        {activeTab === 'eval' && (
          <EvalDashboardTab
            evaluations={evaluations}
            onOpenEvalDetail={(ev) => setSelectedEvalDetail(ev)}
          />
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarkingTab
            testCases={testCases}
            documents={documents}
            ragConfig={ragConfig}
            benchmarkRuns={benchmarkRuns}
            onAddTestCase={handleAddTestCase}
            onDeleteTestCase={handleDeleteTestCase}
            onBenchmarkCompleted={handleBenchmarkCompleted}
            onOpenEvalDetail={(ev) => setSelectedEvalDetail(ev)}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBaseTab
            documents={documents}
            ragConfig={ragConfig}
            onUpdateDocuments={setDocuments}
            onUpdateConfig={handleUpdateConfig}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            config={ragConfig}
            onUpdateConfig={handleUpdateConfig}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </main>

      {/* Evaluation Trace Detail Modal */}
      {selectedEvalDetail && (
        <EvaluationDetailModal
          evaluation={selectedEvalDetail}
          onClose={() => setSelectedEvalDetail(null)}
        />
      )}

    </div>
  );
}
