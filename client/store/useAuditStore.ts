"use client";

import { create } from "zustand";

export type AuditData = {
  bias_score: number;
  demographic_parity_difference: number;
  disparate_impact_ratio: number;
  rows: number;
  columns: number;
  target?: string;
  sensitive_feature?: string;
  prediction?: string | null;
};

export type MitigationData = {
  before: { bias_score: number; demographic_parity_difference: number };
  after: { bias_score: number; demographic_parity_difference: number };
  biasScoreDelta: number;
  parityDelta: number;
  utilityRetained: number;
  chartData: Array<{ metric: string; before: number; after: number }>;
};

export type LlmAuditData = {
  implicit_bias_probability: number;
  reasoning: string;
};

type AuditStore = {
  auditData: AuditData | null;
  mitigationData: MitigationData | null;
  llmAuditData: LlmAuditData | null;
  geminiExplanation: string | null;
  riskSummary: string | null;
  roiImpact: string | null;
  isSearchOpen: boolean;
  setAuditData: (data: AuditData) => void;
  setMitigationData: (data: MitigationData | null) => void;
  setLlmAuditData: (data: LlmAuditData | null) => void;
  setGeminiExplanation: (payload: { explanation: string; riskSummary?: string | null; roiImpact?: string | null }) => void;
  setSearchOpen: (open: boolean) => void;
  resetAll: () => void;
};

export const useAuditStore = create<AuditStore>((set) => ({
  auditData: null,
  mitigationData: null,
  llmAuditData: null,
  geminiExplanation: null,
  riskSummary: null,
  roiImpact: null,
  isSearchOpen: false,
  setAuditData: (data) => set({ auditData: data }),
  setMitigationData: (data) => set({ mitigationData: data }),
  setLlmAuditData: (data) => set({ llmAuditData: data }),
  setGeminiExplanation: ({ explanation, riskSummary = null, roiImpact = null }) =>
    set({ geminiExplanation: explanation, riskSummary, roiImpact }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  resetAll: () =>
    set({
      auditData: null,
      mitigationData: null,
      llmAuditData: null,
      geminiExplanation: null,
      riskSummary: null,
      roiImpact: null,
      isSearchOpen: false,
    }),
}));
