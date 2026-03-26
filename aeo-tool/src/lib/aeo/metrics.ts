import {
  ParsedQuestion, BrandMetrics, GapAnalysis, CategoryMetrics,
  FunnelMetrics, ClientVsCompetitor, AnalysisResult, AEOConfig
} from './types';
import { SCORING_WEIGHTS } from './constants';

function computeBrandMetrics(
  data: ParsedQuestion[],
  allBrands: string[],
  clientBrands: string[],
  totalQuestions: number
): BrandMetrics[] {
  const totalMentionsAll = allBrands.reduce((sum, b) =>
    sum + data.reduce((s, d) => s + d.brands[b].mentionCount, 0), 0);

  return allBrands.map(brand => {
    const isClient = clientBrands.includes(brand);
    const presence = data.filter(d => d.brands[brand].mentioned).length;
    const mentions = data.reduce((s, d) => s + d.brands[brand].mentionCount, 0);
    const topRecs = data.filter(d => d.brands[brand].isTopRecommendation).length;
    const cited = data.filter(d => d.brands[brand].citedUrl).length;
    const ranks = data.filter(d => d.brands[brand].rank > 0).map(d => d.brands[brand].rank);
    const rank1 = ranks.filter(r => r === 1).length;
    const sents = data.filter(d => d.brands[brand].sentiment !== '').map(d => d.brands[brand].sentiment);
    const posCount = sents.filter(s => s === 'Positive').length;
    const negCount = sents.filter(s => s === 'Negative').length;
    const neuCount = sents.filter(s => s === 'Neutral').length;
    const posSig = data.reduce((s, d) => s + d.brands[brand].positiveSignals, 0);
    const negSig = data.reduce((s, d) => s + d.brands[brand].negativeSignals, 0);

    const presencePct = presence / totalQuestions;
    const avgDepth = presence > 0 ? mentions / presence : 0;
    const sovPct = totalMentionsAll > 0 ? mentions / totalMentionsAll : 0;
    const citeRate = cited / totalQuestions;
    const conversion = presence > 0 ? cited / presence : 0;
    const avgRank = ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : 0;
    const sentScore = sents.length > 0 ? (posCount - negCount) / sents.length : 0;

    // Composite score
    const presenceScore = presencePct * 100;
    const citationScore = citeRate * 100;
    const sentimentScore = sentScore * 50 + 50;
    const topRecScore = (topRecs / totalQuestions) * 100;
    const depthScore = Math.min((avgDepth / 5) * 100, 100);
    const firstMentionScore = presence > 0 ? (rank1 / presence) * 100 : 0;

    const composite = Math.round((
      presenceScore * SCORING_WEIGHTS.presence +
      citationScore * SCORING_WEIGHTS.citation +
      sentimentScore * SCORING_WEIGHTS.sentiment +
      topRecScore * SCORING_WEIGHTS.topRec +
      depthScore * SCORING_WEIGHTS.depth +
      firstMentionScore * SCORING_WEIGHTS.firstMention
    ) * 10) / 10;

    return {
      name: brand,
      group: isClient ? 'client' : 'competitor',
      presence,
      presencePct,
      mentions,
      avgDepth: Math.round(avgDepth * 10) / 10,
      sovPct,
      topRecs,
      topRecPct: topRecs / totalQuestions,
      cited,
      citeRate,
      mentionToCiteConversion: conversion,
      avgRank: Math.round(avgRank * 10) / 10,
      rank1Count: rank1,
      positiveCount: posCount,
      neutralCount: neuCount,
      negativeCount: negCount,
      sentimentScore: Math.round(sentScore * 100) / 100,
      positiveSignals: posSig,
      negativeSignals: negSig,
      netSignals: posSig - negSig,
      compositeScore: composite,
    };
  });
}

function computeGapAnalysis(
  data: ParsedQuestion[],
  clientBrands: string[],
  competitorBrands: string[]
): GapAnalysis[] {
  return data.map(d => {
    const clientPresent = clientBrands.some(b => d.brands[b].mentioned);
    const compPresent = competitorBrands.some(b => d.brands[b].mentioned);
    const missingClient = clientBrands.filter(b => !d.brands[b].mentioned);
    const compsPresent = competitorBrands.filter(b => d.brands[b].mentioned);

    let type: GapAnalysis['type'];
    if (compPresent && !clientPresent) type = 'CRITICAL';
    else if (compPresent && missingClient.length > 0) type = 'PARTIAL';
    else if (!compPresent && !clientPresent) type = 'NO_BRANDS';
    else if (!compPresent) type = 'CLIENT_ONLY';
    else type = 'ALL_PRESENT';

    return {
      type,
      question: d.question,
      questionNum: d.questionNum,
      category: d.category,
      missingClientBrands: missingClient,
      competitorsPresent: compsPresent,
    };
  });
}

function computeCategoryMetrics(
  data: ParsedQuestion[],
  allBrands: string[],
  clientBrands: string[],
  competitorBrands: string[]
): CategoryMetrics[] {
  const categories = [...new Set(data.map(d => d.category))].sort();
  return categories.map(cat => {
    const catData = data.filter(d => d.category === cat);
    const n = catData.length;

    const brandPresence: Record<string, number> = {};
    let clientMentions = 0;
    let compMentions = 0;

    for (const brand of allBrands) {
      const present = catData.filter(d => d.brands[brand].mentioned).length;
      brandPresence[brand] = n > 0 ? present / n : 0;
      const totalM = catData.reduce((s, d) => s + d.brands[brand].mentionCount, 0);
      if (clientBrands.includes(brand)) clientMentions += totalM;
      else compMentions += totalM;
    }

    const totalM = clientMentions + compMentions;
    return {
      category: cat,
      questionCount: n,
      brandPresence,
      clientSov: totalM > 0 ? clientMentions / totalM : 0,
      competitorSov: totalM > 0 ? compMentions / totalM : 0,
    };
  });
}

function computeFunnelMetrics(
  data: ParsedQuestion[],
  allBrands: string[],
  clientBrands: string[],
  competitorBrands: string[]
): FunnelMetrics[] {
  const stages = ['Awareness', 'Consideration', 'Decision', 'Post-Purchase'];
  return stages.map(stage => {
    const stageData = data.filter(d => d.funnelStage === stage);
    const n = stageData.length;
    const brandPresence: Record<string, number> = {};
    const brandSov: Record<string, number> = {};

    const totalMentionsInStage = allBrands.reduce((sum, b) =>
      sum + stageData.reduce((s, d) => s + d.brands[b].mentionCount, 0), 0);

    for (const brand of allBrands) {
      const present = stageData.filter(d => d.brands[brand].mentioned).length;
      brandPresence[brand] = n > 0 ? present / n : 0;
      const bMentions = stageData.reduce((s, d) => s + d.brands[brand].mentionCount, 0);
      brandSov[brand] = totalMentionsInStage > 0 ? bMentions / totalMentionsInStage : 0;
    }

    return { stage, questionCount: n, brandPresence, brandSov };
  });
}

function computeClientVsCompetitor(
  data: ParsedQuestion[],
  clientBrands: string[],
  competitorBrands: string[]
): ClientVsCompetitor {
  let clientOnly = 0, compOnly = 0, both = 0, neither = 0;
  let clientMentions = 0, compMentions = 0;

  for (const d of data) {
    const cp = clientBrands.some(b => d.brands[b].mentioned);
    const cmp = competitorBrands.some(b => d.brands[b].mentioned);
    if (cp && cmp) both++;
    else if (cp) clientOnly++;
    else if (cmp) compOnly++;
    else neither++;

    for (const b of clientBrands) clientMentions += d.brands[b].mentionCount;
    for (const b of competitorBrands) compMentions += d.brands[b].mentionCount;
  }

  return {
    clientPresence: clientOnly + both,
    competitorPresence: compOnly + both,
    bothPresent: both,
    clientOnly,
    competitorOnly: compOnly,
    neither,
    clientMentions,
    competitorMentions: compMentions,
    totalMentions: clientMentions + compMentions,
  };
}

function generateFindings(
  brandMetrics: BrandMetrics[],
  gaps: GapAnalysis[],
  cvc: ClientVsCompetitor,
  config: AEOConfig
): string[] {
  const findings: string[] = [];
  const clientMetrics = brandMetrics.filter(b => b.group === 'client');
  const compMetrics = brandMetrics.filter(b => b.group === 'competitor');

  const clientPresenceCount = cvc.clientPresence;
  const sovPct = cvc.totalMentions > 0 ? (cvc.clientMentions / cvc.totalMentions * 100).toFixed(0) : '0';
  findings.push(
    `${config.clientName} brands appear in ${clientPresenceCount} of ${config.totalQuestions} queries (${Math.round(clientPresenceCount / config.totalQuestions * 100)}%), holding ${sovPct}% of total mention volume.`
  );

  const topMentioner = [...brandMetrics].sort((a, b) => b.mentions - a.mentions)[0];
  const topRecommender = [...brandMetrics].sort((a, b) => b.topRecs - a.topRecs)[0];
  if (topMentioner.group === 'client') {
    findings.push(
      `${topMentioner.name} leads all brands in total mentions (${topMentioner.mentions}) and is the strongest individual property in the portfolio.`
    );
  }

  const topCompByPresence = [...compMetrics].sort((a, b) => b.presencePct - a.presencePct)[0];
  if (topCompByPresence) {
    findings.push(
      `${topCompByPresence.name} is the most visible competitor at ${(topCompByPresence.presencePct * 100).toFixed(1)}% presence with ${topCompByPresence.cited} URL citations. It is the primary competitive threat.`
    );
  }

  const weakestClient = [...clientMetrics].sort((a, b) => a.presencePct - b.presencePct)[0];
  if (weakestClient && topCompByPresence) {
    findings.push(
      `${weakestClient.name} has the most room for growth at ${(weakestClient.presencePct * 100).toFixed(0)}% presence, less than half that of ${topCompByPresence.name}. This is the biggest optimization opportunity.`
    );
  }

  const criticalGaps = gaps.filter(g => g.type === 'CRITICAL');
  if (criticalGaps.length > 0) {
    findings.push(
      `There are ${criticalGaps.length} queries where competitors appear but no ${config.clientName} brand is mentioned. These are immediate AEO opportunities.`
    );
  }

  const allPositive = brandMetrics.every(b => b.sentimentScore >= 0);
  if (allPositive) {
    findings.push('All brands carry positive sentiment overall. No reputation concerns were identified.');
  }

  const topCiter = [...brandMetrics].sort((a, b) => b.mentionToCiteConversion - a.mentionToCiteConversion)[0];
  if (topCiter) {
    findings.push(
      `${topCiter.name} leads in mention-to-citation conversion at ${(topCiter.mentionToCiteConversion * 100).toFixed(0)}%, efficient at turning mentions into URL links.`
    );
  }

  const compSov = cvc.totalMentions > 0 ? (cvc.competitorMentions / cvc.totalMentions * 100).toFixed(0) : '0';
  findings.push(
    `Client brands collectively hold ${sovPct}% of total mention volume versus ${compSov}% for competitors.`
  );

  return findings;
}

export function computeAnalysis(
  parsedData: ParsedQuestion[],
  config: AEOConfig
): AnalysisResult {
  const allBrands = [...config.clientBrands, ...config.competitorBrands];
  const totalQ = config.totalQuestions;

  const brandMetrics = computeBrandMetrics(parsedData, allBrands, config.clientBrands, totalQ);
  const gaps = computeGapAnalysis(parsedData, config.clientBrands, config.competitorBrands);
  const categoryMetrics = computeCategoryMetrics(parsedData, allBrands, config.clientBrands, config.competitorBrands);
  const funnelMetrics = computeFunnelMetrics(parsedData, allBrands, config.clientBrands, config.competitorBrands);
  const clientVsCompetitor = computeClientVsCompetitor(parsedData, config.clientBrands, config.competitorBrands);

  const gapSummary: Record<string, number> = {
    CRITICAL: gaps.filter(g => g.type === 'CRITICAL').length,
    PARTIAL: gaps.filter(g => g.type === 'PARTIAL').length,
    ALL_PRESENT: gaps.filter(g => g.type === 'ALL_PRESENT').length,
    CLIENT_ONLY: gaps.filter(g => g.type === 'CLIENT_ONLY').length,
    NO_BRANDS: gaps.filter(g => g.type === 'NO_BRANDS').length,
  };

  const findings = generateFindings(brandMetrics, gaps, clientVsCompetitor, config);

  return {
    config,
    parsedData,
    brandMetrics,
    gaps,
    gapSummary,
    categoryMetrics,
    funnelMetrics,
    clientVsCompetitor,
    findings,
  };
}
