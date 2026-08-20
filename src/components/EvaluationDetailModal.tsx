import React from 'react';
import { EvaluationScore } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Coins, 
  X, 
  Sparkles,
  Layers
} from 'lucide-react';

interface Props {
  evaluation: EvaluationScore | null;
  onClose: () => void;
}

export const EvaluationDetailModal: React.FC<Props> = ({ evaluation, onClose }) => {
  if (!evaluation) return null;

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30';
    if (score >= 0.65) return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
    return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 0.85) return 'bg-[#10B981]';
    if (score >= 0.65) return 'bg-[#F59E0B]';
    return 'bg-rose-500';
  };

  const metrics = [
    {
      name: 'Faithfulness',
      key: 'faithfulness',
      score: evaluation.faithfulness,
      description: 'Measures factual consistency of the answer against retrieved context.',
      explanation: evaluation.metricExplanations?.faithfulness,
      tag: 'Hallucination Defense',
    },
    {
      name: 'Answer Relevance',
      key: 'answerRelevance',
      score: evaluation.answerRelevance,
      description: 'Measures how directly and completely the response addresses the prompt.',
      explanation: evaluation.metricExplanations?.answerRelevance,
      tag: 'Query Alignment',
    },
    {
      name: 'Context Precision',
      key: 'contextPrecision',
      score: evaluation.contextPrecision,
      description: 'Measures whether signal-rich chunks are ranked higher in retrieval.',
      explanation: evaluation.metricExplanations?.contextPrecision,
      tag: 'Retrieval Quality',
    },
    {
      name: 'Context Recall',
      key: 'contextRecall',
      score: evaluation.contextRecall,
      description: 'Measures if retrieved chunks cover all ground truth requirements.',
      explanation: evaluation.metricExplanations?.contextRecall,
      tag: 'Completeness',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 font-mono">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0F0F11] border border-[#27272A] rounded shadow-2xl overflow-hidden text-[#EDEDED]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#27272A] bg-[#09090B]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-[#D1FF52]/10 text-[#D1FF52] border border-[#D1FF52]/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-white uppercase">Auto-Evaluation Trace & Judge Report</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D1FF52]/10 text-[#D1FF52] font-mono border border-[#D1FF52]/30 uppercase">
                  RAGAS
                </span>
              </div>
              <p className="text-[11px] text-[#71717A]">
                Deterministic LLM-as-a-Judge inspection with sentence-level claim verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#71717A] hover:text-white hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          {/* Top Score Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-1 p-3.5 rounded bg-[#09090B] border border-[#27272A] flex flex-col justify-between items-center text-center">
              <span className="text-[10px] font-medium text-[#71717A] uppercase tracking-wider">Overall RAGAS Score</span>
              <div className="my-1.5">
                <span className="text-3xl font-extrabold tracking-tight text-[#D1FF52]">
                  {(evaluation.overallScore * 100).toFixed(0)}%
                </span>
                <span className="block text-[10px] text-[#71717A] mt-0.5">Composite Index</span>
              </div>
              <div className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${
                evaluation.overallScore >= 0.8 
                  ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30' 
                  : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
              }`}>
                {evaluation.overallScore >= 0.8 ? 'Production Ready' : 'Needs Optimization'}
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {metrics.map((m) => (
                <div key={m.key} className="p-3 rounded bg-[#09090B] border border-[#27272A] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase text-[#71717A] truncate">{m.name}</span>
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">
                      {(m.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="h-1 w-full bg-[#27272A] rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${getScoreBarColor(m.score)}`}
                        style={{ width: `${Math.max(5, m.score * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-[#71717A] mt-1 block truncate uppercase">{m.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hallucination Risk Alert */}
          <div className={`p-3 rounded border flex items-start gap-3 text-xs ${
            evaluation.hallucinationDetected || evaluation.hallucinationRisk === 'HIGH' || evaluation.hallucinationRisk === 'MEDIUM'
              ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
              : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
          }`}>
            {evaluation.hallucinationDetected || evaluation.hallucinationRisk === 'HIGH' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Hallucination Detection: {evaluation.hallucinationRisk} Risk
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#09090B] border border-[#27272A]">
                  Faithfulness: {(evaluation.faithfulness * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] mt-1 text-[#EDEDED]">
                {evaluation.hallucinationDetected 
                  ? 'One or more claims in the generated response lack direct support from retrieved source chunks.'
                  : 'Zero ungrounded hallucinations detected. All factual propositions are strictly traceable to retrieved chunks.'}
              </p>
            </div>
          </div>

          {/* Executive Judge Critique */}
          <div className="p-3.5 rounded bg-[#09090B] border border-[#27272A] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#D1FF52] uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              <span>LLM-as-a-Judge Rationale & Critique</span>
            </div>
            <p className="text-xs text-[#EDEDED] leading-relaxed italic bg-[#18181B]/50 p-2.5 rounded border border-[#27272A]">
              "{evaluation.critique}"
            </p>
          </div>

          {/* Metric Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.map((m) => (
              <div key={m.key} className="p-3 rounded bg-[#09090B] border border-[#27272A] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">{m.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${getScoreColor(m.score)}`}>
                    {(m.score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A]">{m.description}</p>
                {m.explanation && (
                  <p className="text-[11px] text-[#EDEDED] bg-[#18181B]/60 p-2 rounded border border-[#27272A] mt-1">
                    <span className="text-[#D1FF52] font-medium">Analysis:</span> {m.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Grounded Claims vs Hallucinated Claims */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Grounded Claims */}
            <div className="p-3 rounded bg-[#09090B] border border-[#27272A] space-y-2">
              <div className="flex items-center gap-1.5 text-[#10B981] text-[10px] font-semibold uppercase tracking-widest">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Grounded Claims ({evaluation.groundedClaims?.length || 0})</span>
              </div>
              <ul className="space-y-1.5">
                {evaluation.groundedClaims && evaluation.groundedClaims.length > 0 ? (
                  evaluation.groundedClaims.map((claim, i) => (
                    <li key={i} className="text-[11px] text-[#EDEDED] bg-[#10B981]/5 border border-[#10B981]/20 p-2 rounded flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
                      <span>{claim}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[11px] text-[#71717A] italic">No explicitly parsed claims recorded.</li>
                )}
              </ul>
            </div>

            {/* Hallucinated Claims */}
            <div className="p-3 rounded bg-[#09090B] border border-[#27272A] space-y-2">
              <div className="flex items-center gap-1.5 text-[#F59E0B] text-[10px] font-semibold uppercase tracking-widest">
                <XCircle className="w-3.5 h-3.5" />
                <span>Ungrounded / Speculative Claims ({evaluation.hallucinatedClaims?.length || 0})</span>
              </div>
              <ul className="space-y-1.5">
                {evaluation.hallucinatedClaims && evaluation.hallucinatedClaims.length > 0 ? (
                  evaluation.hallucinatedClaims.map((claim, i) => (
                    <li key={i} className="text-[11px] text-rose-200 bg-rose-950/30 border border-rose-900/40 p-2 rounded flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{claim}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[11px] text-[#10B981] bg-[#10B981]/5 border border-[#10B981]/20 p-2 rounded flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                    <span>Zero ungrounded claims detected in this generation.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Operational Latency & Token Breakdown */}
          <div className="p-3 rounded bg-[#09090B] border border-[#27272A]">
            <div className="text-[10px] font-semibold text-[#71717A] uppercase tracking-widest mb-2">
              Operational Telemetry & Footprint
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-[#0F0F11] border border-[#27272A]">
                <span className="text-[#71717A] text-[10px] uppercase block mb-0.5">Total Latency</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D1FF52]" />
                  {evaluation.latencyMs}ms
                </span>
              </div>
              <div className="p-2 rounded bg-[#0F0F11] border border-[#27272A]">
                <span className="text-[#71717A] text-[10px] uppercase block mb-0.5">Eval Latency</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D1FF52]" />
                  {evaluation.evalLatencyMs || 210}ms
                </span>
              </div>
              <div className="p-2 rounded bg-[#0F0F11] border border-[#27272A]">
                <span className="text-[#71717A] text-[10px] uppercase block mb-0.5">Tokens (In / Out)</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#D1FF52]" />
                  {evaluation.promptTokens} / {evaluation.completionTokens}
                </span>
              </div>
              <div className="p-2 rounded bg-[#0F0F11] border border-[#27272A]">
                <span className="text-[#71717A] text-[10px] uppercase block mb-0.5">Query Cost</span>
                <span className="font-semibold text-[#10B981] flex items-center gap-1">
                  <Coins className="w-3 h-3 text-[#10B981]" />
                  ${((evaluation.promptTokens * 0.00000015) + (evaluation.completionTokens * 0.0000006)).toFixed(6)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 border-t border-[#27272A] bg-[#09090B] flex items-center justify-between">
          <span className="text-[10px] text-[#71717A]">
            Timestamp: {new Date(evaluation.timestamp).toLocaleTimeString()}
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded bg-[#D1FF52] hover:bg-[#c2f241] text-black text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Close Trace
          </button>
        </div>

      </div>
    </div>
  );
};
