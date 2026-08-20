import React from 'react';
import { Sliders, RotateCcw, ShieldCheck, Cpu, Database, Save, Check } from 'lucide-react';
import { RAGConfig } from '../types';

interface Props {
  config: RAGConfig;
  onUpdateConfig: (config: Partial<RAGConfig>) => void;
  onResetDefaults: () => void;
}

export const SettingsTab: React.FC<Props> = ({
  config,
  onUpdateConfig,
  onResetDefaults,
}) => {
  const [savedAlert, setSavedAlert] = React.useState(false);

  const handleSave = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#09090B] text-[#EDEDED] max-w-4xl mx-auto custom-scrollbar font-mono">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white uppercase">
            RAG Pipeline Architecture & Auto-Judge Config
          </h1>
          <p className="text-xs text-[#71717A] mt-1">
            Configure hybrid retrieval weighting, top-k depths, prompt synthesis rules, and LLM-as-a-judge scoring parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDefaults}
            className="px-3 py-1.5 rounded bg-[#18181B] hover:bg-[#27272A] text-[#EDEDED] border border-[#27272A] text-xs uppercase flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#D1FF52]" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Settings Sections */}
      <div className="space-y-4">
        
        {/* Retrieval & Search Engine Settings */}
        <div className="p-4 rounded bg-[#0F0F11] border border-[#27272A] space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-[#D1FF52] uppercase tracking-widest border-b border-[#27272A] pb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Retrieval & Hybrid Search Parameters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Retrieval Mode */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#71717A] uppercase tracking-widest block font-medium">Retrieval Engine Mode</label>
              <select
                value={config.retrievalMode}
                onChange={(e: any) => onUpdateConfig({ retrievalMode: e.target.value })}
                className="w-full bg-[#09090B] border border-[#27272A] rounded px-3 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#D1FF52]"
              >
                <option value="hybrid">Hybrid Search (Dense Vector + BM25 Sparse)</option>
                <option value="vector">Dense Semantic Vector Only</option>
                <option value="keyword">BM25 Exact Keyword Match Only</option>
              </select>
            </div>

            {/* Hybrid Alpha */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="text-[10px] text-[#71717A] uppercase tracking-widest">
                  Hybrid Alpha (Vector vs BM25 Weight)
                </label>
                <span className="text-[#D1FF52] font-bold">{config.hybridAlpha}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={config.hybridAlpha}
                onChange={(e) => onUpdateConfig({ hybridAlpha: Number(e.target.value) })}
                className="w-full accent-[#D1FF52] bg-[#27272A] h-1 rounded appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#71717A]">
                <span>0.0 (BM25)</span>
                <span>0.5 (Balanced)</span>
                <span>1.0 (Vector)</span>
              </div>
            </div>

            {/* Top-K Chunks */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="text-[10px] text-[#71717A] uppercase tracking-widest">Top-K Context Chunks</label>
                <span className="text-[#D1FF52] font-bold">{config.topK} chunks</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={config.topK}
                onChange={(e) => onUpdateConfig({ topK: Number(e.target.value) })}
                className="w-full accent-[#D1FF52] bg-[#27272A] h-1 rounded appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-[#71717A] block">Number of highest-ranked chunks passed to prompt</span>
            </div>

            {/* Similarity Threshold */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="text-[10px] text-[#71717A] uppercase tracking-widest">Similarity Cutoff Threshold</label>
                <span className="text-[#D1FF52] font-bold">{config.similarityThreshold}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.8"
                step="0.05"
                value={config.similarityThreshold}
                onChange={(e) => onUpdateConfig({ similarityThreshold: Number(e.target.value) })}
                className="w-full accent-[#D1FF52] bg-[#27272A] h-1 rounded appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-[#71717A] block">Discards chunks with lower match confidence</span>
            </div>

          </div>
        </div>

        {/* Model & Generation Settings */}
        <div className="p-4 rounded bg-[#0F0F11] border border-[#27272A] space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-[#D1FF52] uppercase tracking-widest border-b border-[#27272A] pb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>LLM Generation & Auto-Judge Config</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Primary Model */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#71717A] uppercase tracking-widest block font-medium">RAG Generator Model</label>
              <select
                value={config.model}
                onChange={(e: any) => onUpdateConfig({ model: e.target.value })}
                className="w-full bg-[#09090B] border border-[#27272A] rounded px-3 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#D1FF52]"
              >
                <option value="gemini-3.7-flash">gemini-3.7-flash (Recommended default)</option>
                <option value="gemini-flash-latest">gemini-flash-latest</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-low latency)</option>
              </select>
            </div>

            {/* Judge Model */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#71717A] uppercase tracking-widest block font-medium">LLM-as-a-Judge Model</label>
              <select
                value={config.judgeModel}
                onChange={(e: any) => onUpdateConfig({ judgeModel: e.target.value })}
                className="w-full bg-[#09090B] border border-[#27272A] rounded px-3 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#D1FF52]"
              >
                <option value="gemini-3.7-flash">gemini-3.7-flash (Strict schema evaluation)</option>
                <option value="gemini-flash-latest">gemini-flash-latest</option>
              </select>
            </div>

            {/* Temperature */}
            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-[10px] text-[#71717A] uppercase tracking-widest">Generation Temperature</label>
                <span className="text-[#D1FF52] font-bold">{config.temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={config.temperature}
                onChange={(e) => onUpdateConfig({ temperature: Number(e.target.value) })}
                className="w-full accent-[#D1FF52] bg-[#27272A] h-1 rounded appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-[#71717A] block">Low temperature (0.1 - 0.2) delivers deterministic, grounded context synthesis</span>
            </div>

          </div>
        </div>

        {/* System Prompt Instruction */}
        <div className="p-4 rounded bg-[#0F0F11] border border-[#27272A] space-y-2">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#D1FF52] uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RAG System Grounding Prompt</span>
            </div>
          </div>
          <textarea
            rows={5}
            value={config.systemPrompt}
            onChange={(e) => onUpdateConfig({ systemPrompt: e.target.value })}
            className="w-full bg-[#09090B] border border-[#27272A] rounded p-2.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#D1FF52] custom-scrollbar leading-relaxed"
          />
        </div>

      </div>

    </div>
  );
};
