import { ParsedQuestion, BrandMentionData, AEOConfig } from './types';
import { CATEGORY_RULES, FUNNEL_MAP, POSITIVE_WORDS, NEGATIVE_WORDS } from './constants';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findBrandMentions(text: string, brand: string): number[] {
  const pattern = new RegExp(escapeRegex(brand), 'gi');
  const positions: number[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    positions.push(match.index);
  }
  return positions;
}

function getMentionRank(text: string, allBrands: string[]): Record<string, number> {
  const positions: Array<{ brand: string; pos: number }> = [];
  for (const brand of allBrands) {
    const mentions = findBrandMentions(text, brand);
    if (mentions.length > 0) {
      positions.push({ brand, pos: mentions[0] });
    }
  }
  positions.sort((a, b) => a.pos - b.pos);
  const ranks: Record<string, number> = {};
  positions.forEach((item, idx) => {
    ranks[item.brand] = idx + 1;
  });
  return ranks;
}

function getNumberedPosition(text: string, brand: string): number {
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)[.)]\s/);
    if (match && line.toLowerCase().includes(brand.toLowerCase())) {
      return parseInt(match[1], 10);
    }
  }
  return 0;
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)]+/g);
  return matches || [];
}

function extractCitedDomains(text: string): string[] {
  const urls = extractUrls(text);
  return urls.map(url => {
    const match = url.match(/https?:\/\/(?:www\.)?([^/\s)]+)/);
    return match ? match[1].toLowerCase() : '';
  }).filter(Boolean);
}

function getSentiment(
  text: string,
  brand: string
): { sentiment: 'Positive' | 'Neutral' | 'Negative' | ''; posCount: number; negCount: number } {
  const textLower = text.toLowerCase();
  const brandLower = brand.toLowerCase();

  if (!textLower.includes(brandLower)) {
    return { sentiment: '', posCount: 0, negCount: 0 };
  }

  let posCount = 0;
  let negCount = 0;
  const pattern = new RegExp(escapeRegex(brandLower), 'gi');
  let match;

  while ((match = pattern.exec(textLower)) !== null) {
    const start = Math.max(0, match.index - 150);
    const end = Math.min(textLower.length, match.index + brand.length + 150);
    const window = textLower.slice(start, end);

    for (const word of POSITIVE_WORDS) {
      if (window.includes(word)) posCount++;
    }
    for (const word of NEGATIVE_WORDS) {
      if (window.includes(word)) negCount++;
    }
  }

  let sentiment: 'Positive' | 'Neutral' | 'Negative';
  if (posCount > negCount) sentiment = 'Positive';
  else if (negCount > posCount) sentiment = 'Negative';
  else sentiment = 'Neutral';

  return { sentiment, posCount, negCount };
}

function isTopRecommendation(text: string, brand: string): boolean {
  const numbered = getNumberedPosition(text, brand);
  if (numbered === 1) return true;

  const textLower = text.toLowerCase();
  const brandLower = brand.toLowerCase();
  const first500 = textLower.slice(0, 500);

  const patterns = [
    `${brandLower} is the best`,
    `${brandLower} is a top`,
    new RegExp(`best.*${escapeRegex(brandLower)}`).test(first500) ? 'match' : '',
    new RegExp(`top pick.*${escapeRegex(brandLower)}`).test(first500) ? 'match' : '',
    new RegExp(`recommend.*${escapeRegex(brandLower)}`).test(first500) ? 'match' : '',
  ];

  for (const p of patterns) {
    if (p === 'match') return true;
    if (p && first500.includes(p)) return true;
  }
  return false;
}

export function categorizeQuestion(question: string): string {
  const qLower = question.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => qLower.includes(kw))) {
      return rule.category;
    }
  }
  return 'General';
}

export function getFunnelStage(category: string): string {
  return FUNNEL_MAP[category] || 'Awareness';
}

export function parseResponse(
  questionNum: number,
  question: string,
  responseText: string,
  config: AEOConfig
): ParsedQuestion {
  const allBrands = [...config.clientBrands, ...config.competitorBrands];
  const category = categorizeQuestion(question);
  const funnelStage = getFunnelStage(category);
  const ranks = getMentionRank(responseText, allBrands);
  const citedDomains = extractCitedDomains(responseText);
  const urls = extractUrls(responseText);
  const hasCitations = /\[\d+\]/.test(responseText);

  const brands: Record<string, BrandMentionData> = {};
  let totalBrandsMentioned = 0;

  for (const brand of allBrands) {
    const mentions = findBrandMentions(responseText, brand);
    const mentioned = mentions.length > 0;
    if (mentioned) totalBrandsMentioned++;

    const { sentiment, posCount, negCount } = getSentiment(responseText, brand);
    const brandDomain = brand.toLowerCase().replace(/\s+/g, '');
    const isCited = citedDomains.some(d => d.includes(brandDomain));

    brands[brand] = {
      mentioned,
      mentionCount: mentions.length,
      rank: ranks[brand] || 0,
      numberedPosition: getNumberedPosition(responseText, brand),
      citedUrl: isCited,
      sentiment: mentioned ? sentiment : '',
      positiveSignals: posCount,
      negativeSignals: negCount,
      isTopRecommendation: isTopRecommendation(responseText, brand),
    };
  }

  return {
    questionNum,
    question,
    category,
    funnelStage,
    responseLength: responseText.length,
    totalBrandsMentioned,
    hasCitations,
    hasUrls: urls.length > 0,
    numUrls: urls.length,
    citedDomains,
    brands,
  };
}

export function parseAllResponses(
  questions: Array<{ text: string; responseText: string }>,
  config: AEOConfig
): ParsedQuestion[] {
  return questions.map((q, i) => parseResponse(i + 1, q.text, q.responseText, config));
}
