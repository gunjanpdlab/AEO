export interface AEOConfig {
  clientName: string;
  clientBrands: string[];
  competitorBrands: string[];
  platform: string;
  country: string;
  date: string;
  queryTitle: string;
  totalQuestions: number;
}

export interface BrandMentionData {
  mentioned: boolean;
  mentionCount: number;
  rank: number; // 0 = not mentioned, 1 = first mentioned
  numberedPosition: number; // 0 = not in a numbered list
  citedUrl: boolean;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | '';
  positiveSignals: number;
  negativeSignals: number;
  isTopRecommendation: boolean;
}

export interface ParsedQuestion {
  questionNum: number;
  question: string;
  category: string;
  funnelStage: string;
  responseLength: number;
  totalBrandsMentioned: number;
  hasCitations: boolean;
  hasUrls: boolean;
  numUrls: number;
  citedDomains: string[];
  brands: Record<string, BrandMentionData>;
}

export interface BrandMetrics {
  name: string;
  group: 'client' | 'competitor';
  presence: number;
  presencePct: number;
  mentions: number;
  avgDepth: number;
  sovPct: number;
  topRecs: number;
  topRecPct: number;
  cited: number;
  citeRate: number;
  mentionToCiteConversion: number;
  avgRank: number;
  rank1Count: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  sentimentScore: number;
  positiveSignals: number;
  negativeSignals: number;
  netSignals: number;
  compositeScore: number;
}

export interface GapAnalysis {
  type: 'CRITICAL' | 'PARTIAL' | 'ALL_PRESENT' | 'CLIENT_ONLY' | 'NO_BRANDS';
  question: string;
  questionNum: number;
  category: string;
  missingClientBrands: string[];
  competitorsPresent: string[];
}

export interface CategoryMetrics {
  category: string;
  questionCount: number;
  brandPresence: Record<string, number>; // brand -> presence %
  clientSov: number;
  competitorSov: number;
}

export interface FunnelMetrics {
  stage: string;
  questionCount: number;
  brandPresence: Record<string, number>;
  brandSov: Record<string, number>;
}

export interface ClientVsCompetitor {
  clientPresence: number;
  competitorPresence: number;
  bothPresent: number;
  clientOnly: number;
  competitorOnly: number;
  neither: number;
  clientMentions: number;
  competitorMentions: number;
  totalMentions: number;
}

export interface AnalysisResult {
  config: AEOConfig;
  parsedData: ParsedQuestion[];
  brandMetrics: BrandMetrics[];
  gaps: GapAnalysis[];
  gapSummary: Record<string, number>;
  categoryMetrics: CategoryMetrics[];
  funnelMetrics: FunnelMetrics[];
  clientVsCompetitor: ClientVsCompetitor;
  findings: string[];
}

export interface ChartSet {
  brandPresence: string; // base64 PNG
  totalMentions: string;
  urlCitations: string;
  topRecommendationsPie: string;
  presenceByCategory: string;
  funnelAnalysis: string;
  sentimentDistribution: string;
  brandScorecard: string;
  clientVsCompetitorSov: string;
  competitiveGaps: string;
  mentionToCitation: string;
  avgRankPosition: string;
}
