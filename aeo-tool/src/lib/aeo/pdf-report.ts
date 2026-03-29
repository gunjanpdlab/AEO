import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResult, BrandMetrics, ChartSet } from './types';

const NAVY: [number, number, number] = [47, 84, 150];
const DARK_NAVY: [number, number, number] = [31, 56, 100];
const GRAY: [number, number, number] = [102, 102, 102];
const LIGHT_GRAY: [number, number, number] = [242, 242, 242];
const GREEN_RGB: [number, number, number] = [112, 173, 71];
const RED_RGB: [number, number, number] = [255, 68, 68];

function addFooter(doc: jsPDF, pageNum: number, platform: string, country: string, date: string) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Page ${pageNum}`, pw / 2, 285, { align: 'center' });
  doc.text(`Source: ${platform} | ${country} | ${date}`, 15, 285);
  doc.text('Confidential', pw - 15, 285, { align: 'right' });
  doc.setDrawColor(47, 84, 150);
  doc.setLineWidth(0.3);
  doc.line(15, 12, pw - 15, 12);
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text(text, 15, y);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, y + 2, 195, y + 2);
  return y + 8;
}

function bodyText(doc: jsPDF, text: string, y: number, maxWidth = 180): number {
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, 15, y);
  return y + lines.length * 4.5;
}

function bulletPoint(doc: jsPDF, text: string, y: number, maxWidth = 175): number {
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text('*', 17, y);
  doc.text(lines, 22, y);
  return y + lines.length * 4.5;
}

function subSection(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(11);
  doc.setTextColor(...DARK_NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text(text, 15, y);
  return y + 6;
}

async function addChartImage(doc: jsPDF, base64: string, y: number, w = 170, h = 95): Promise<number> {
  if (!base64) return y;
  try {
    // Check if we need a new page
    if (y + h > 270) {
      doc.addPage();
      y = 20;
    }
    doc.addImage(base64, 'PNG', 15, y, w, h);
    return y + h + 5;
  } catch (e) {
    console.error('Failed to add chart image to PDF:', e);
    return y;
  }
}

export async function generateAnalysisPdf(
  result: AnalysisResult,
  charts: ChartSet | null
): Promise<Buffer> {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const { config, brandMetrics, gaps, gapSummary, categoryMetrics, funnelMetrics, clientVsCompetitor: cvc, findings } = result;
  const sorted = [...brandMetrics].sort((a, b) => b.compositeScore - a.compositeScore);
  const clientMetrics = sorted.filter(b => b.group === 'client');
  const compMetrics = sorted.filter(b => b.group === 'competitor');
  let pageNum = 1;

  // ===== COVER PAGE =====
  doc.setFontSize(32);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text(config.clientName, 15, 100);

  doc.setFontSize(24);
  doc.setTextColor(...DARK_NAVY);
  doc.text('AEO Audit Report', 15, 115);

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(2);
  doc.line(15, 122, 80, 122);

  doc.setFontSize(14);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('Answer Engine Optimization Analysis', 15, 135);

  doc.setFontSize(11);
  doc.text(`${config.platform} | ${config.country} | ${config.date}`, 15, 145);
  doc.text(`${config.totalQuestions} Search Queries Analyzed`, 15, 152);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, 170, 195, 170);

  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(`Client Brands: ${config.clientBrands.join(', ')}`, 15, 178);
  doc.setTextColor(197, 90, 17);
  doc.text(`Competitors: ${config.competitorBrands.join(', ')}`, 15, 185);

  // ===== PAGE 2: TABLE OF CONTENTS =====
  doc.addPage();
  pageNum++;
  addFooter(doc, pageNum, config.platform, config.country, config.date);

  let y = 25;
  y = sectionTitle(doc, 'Table of Contents', y);
  const toc = [
    '1. Executive Summary',
    '2. Brand Presence and Share of Voice',
    '3. Citation and URL Attribution Analysis',
    '4. Top Recommendations and Rank Position',
    '5. Sentiment Analysis',
    '6. Buyer Journey Funnel Analysis',
    '7. Competitive Gap Analysis',
    '8. Brand AEO Scorecard',
    '9. Recommendations and Next Steps',
  ];
  for (const item of toc) {
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(item, 20, y);
    y += 8;
  }

  // ===== PAGE 3: EXECUTIVE SUMMARY =====
  doc.addPage();
  pageNum++;
  addFooter(doc, pageNum, config.platform, config.country, config.date);

  y = 20;
  y = sectionTitle(doc, '1. Executive Summary', y);

  y = bodyText(doc, `This report presents a comprehensive Answer Engine Optimization (AEO) audit for ${config.clientName} and its ${config.clientBrands.length} properties: ${config.clientBrands.join(', ')}. The analysis covers ${config.totalQuestions} search queries submitted to ${config.platform}, measuring brand visibility, citation patterns, sentiment, and competitive positioning against ${config.competitorBrands.join(', ')}.`, y);
  y += 4;

  // KPI boxes
  const avgComp = clientMetrics.length > 0 ? Math.round(clientMetrics.reduce((s, b) => s + b.compositeScore, 0) / clientMetrics.length) : 0;
  const kpiData = [
    { val: `${cvc.clientPresence}/${config.totalQuestions}`, label: 'Client Presence' },
    { val: `${cvc.totalMentions > 0 ? Math.round(cvc.clientMentions / cvc.totalMentions * 100) : 0}%`, label: 'Client SOV' },
    { val: `${clientMetrics.reduce((s, b) => s + b.topRecs, 0)}`, label: 'Top Rec Wins' },
    { val: `${clientMetrics.reduce((s, b) => s + b.cited, 0)}`, label: 'URL Citations' },
    { val: `${gapSummary.CRITICAL || 0}`, label: 'Critical Gaps' },
    { val: `${avgComp}/100`, label: 'Avg Composite' },
  ];
  const kpiW = 28;
  for (let i = 0; i < 6; i++) {
    const x = 15 + i * (kpiW + 2);
    doc.setFillColor(242, 242, 242);
    doc.rect(x, y, kpiW, 18, 'F');
    doc.setFontSize(14);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.text(kpiData[i].val, x + kpiW / 2, y + 8, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text(kpiData[i].label, x + kpiW / 2, y + 14, { align: 'center' });
  }
  y += 24;

  // Brand comparison table
  autoTable(doc, {
    startY: y,
    head: [['Brand', 'Group', 'Presence %', 'Mentions', 'Top Recs', 'URL Cites', 'Avg Rank', 'Sentiment', 'Composite']],
    body: sorted.map(b => [
      b.name, b.group === 'client' ? 'Client' : 'Competitor',
      `${(b.presencePct * 100).toFixed(1)}%`, b.mentions, b.topRecs, b.cited,
      b.avgRank || '-', b.sentimentScore > 0 ? 'Positive' : b.sentimentScore < 0 ? 'Negative' : 'Neutral',
      b.compositeScore,
    ]),
    headStyles: { fillColor: NAVY, fontSize: 7, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 15 },
    tableWidth: 180,
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  y = subSection(doc, 'Key Findings', y);
  for (const f of findings) {
    if (y > 270) { doc.addPage(); pageNum++; addFooter(doc, pageNum, config.platform, config.country, config.date); y = 20; }
    y = bulletPoint(doc, f, y);
  }

  // ===== PAGE: PRESENCE & SOV =====
  doc.addPage();
  pageNum++;
  addFooter(doc, pageNum, config.platform, config.country, config.date);
  y = 20;
  y = sectionTitle(doc, '2. Brand Presence and Share of Voice', y);
  y = bodyText(doc, `Brand presence measures how often each brand appears in ${config.platform} responses. Share of voice measures each brand's proportion of total mentions.`, y);
  y += 2;

  if (charts?.brandPresence) y = await addChartImage(doc, charts.brandPresence, y);

  autoTable(doc, {
    startY: y,
    head: [['Brand', 'Group', 'Presence %', 'Mentions', 'Avg Depth', 'SOV %']],
    body: sorted.map(b => [b.name, b.group === 'client' ? 'Client' : 'Comp',
      `${(b.presencePct * 100).toFixed(1)}%`, b.mentions, b.avgDepth, `${(b.sovPct * 100).toFixed(1)}%`]),
    headStyles: { fillColor: NAVY, fontSize: 7, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 15 },
    tableWidth: 180,
  });

  // ===== PAGE: CITATION =====
  doc.addPage();
  pageNum++;
  addFooter(doc, pageNum, config.platform, config.country, config.date);
  y = 20;
  y = sectionTitle(doc, '3. Citation and URL Attribution', y);
  y = bodyText(doc, `Citation analysis tracks when ${config.platform} includes a direct URL link to a brand's website. URL citations are a stronger signal than simple mentions because they drive direct referral traffic.`, y);
  y += 2;

  if (charts?.urlCitations) y = await addChartImage(doc, charts.urlCitations, y);

  autoTable(doc, {
    startY: y,
    head: [['Brand', 'Group', 'URL Citations', 'Citation Rate', 'Mention-to-Cite %']],
    body: sorted.map(b => [b.name, b.group === 'client' ? 'Client' : 'Comp',
      b.cited, `${(b.citeRate * 100).toFixed(1)}%`, `${(b.mentionToCiteConversion * 100).toFixed(1)}%`]),
    headStyles: { fillColor: NAVY, fontSize: 7, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 15 },
    tableWidth: 180,
  });

  // ===== PAGE: RANK =====
  doc.addPage();
  pageNum++;
  addFooter(doc, pageNum, config.platform, config.country, config.date);
  y = 20;
  y = sectionTitle(doc, '4. Top Recommendations and Rank', y);
  y = bodyText(doc, 'This section examines which brands are positioned as the top recommendation and where brands appear in the response order.', y);
  y += 2;

  if (charts?.topRecommendationsPie) y = await addChartImage(doc, charts.topRecommendationsPie, y, 130, 90);

  autoTable(doc, {
    startY: y,
    head: [['Brand', 'Group', 'Top Recs', 'Top Rec %', '#1 Rank', 'Avg Rank']],
    body: sorted.map(b => [b.name, b.group === 'client' ? 'Client' : 'Comp',
      b.topRecs, `${(b.topRecPct * 100).toFixed(1)}%`, b.rank1Count, b.avgRank || '-']),
    headStyles: { fillColor: NAVY, fontSize: 7, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 15 },
    tableWidth: 180,
  });

  // ===== PAGE: SENTIMENT =====
  doc.addPage();
  pageNum++;
  addFooter(doc, pageNum, config.platform, config.country, config.date);
  y = 20;
  y = sectionTitle(doc, '5. Sentiment Analysis', y);
  y = bodyText(doc, `Sentiment analysis evaluates how ${config.platform} describes each brand by examining positive, neutral, and negative language signals around each mention.`, y);
  y += 2;

  if (charts?.sentimentDistribution) y = await addChartImage(doc, charts.sentimentDistribution, y);

  autoTable(doc, {
    startY: y,
    head: [['Brand', 'Positive', 'Neutral', 'Negative', 'Score', 'Net Signals']],
    body: sorted.map(b => [b.name, b.positiveCount, b.neutralCount, b.negativeCount,
      b.sentimentScore.toFixed(2), b.netSignals >= 0 ? `+${b.netSignals}` : b.netSignals]),
    headStyles: { fillColor: NAVY, fontSize: 7, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 15 },
    tableWidth: 180,
  });

  // ===== PAGE: FUNNEL =====
  doc.addPage();
  pageNum++;
  addFooter(doc, pageNum, config.platform, config.country, config.date);
  y = 20;
  y = sectionTitle(doc, '6. Buyer Journey Funnel', y);
  y = bodyText(doc, 'Queries were mapped to four buyer journey stages to identify where each brand has the strongest and weakest visibility.', y);
  y += 2;

  if (charts?.funnelAnalysis) y = await addChartImage(doc, charts.funnelAnalysis, y);

  const allBrands = [...config.clientBrands, ...config.competitorBrands];
  autoTable(doc, {
    startY: y,
    head: [['Stage', 'Queries', ...allBrands]],
    body: funnelMetrics.map(f => [
      f.stage, f.questionCount,
      ...allBrands.map(b => `${((f.brandPresence[b] || 0) * 100).toFixed(0)}%`),
    ]),
    headStyles: { fillColor: NAVY, fontSize: 6, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 6 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 15 },
    tableWidth: 180,
  });

  // ===== PAGE: GAPS =====
  doc.addPage();
  pageNum++;
  addFooter(doc, pageNum, config.platform, config.country, config.date);
  y = 20;
  y = sectionTitle(doc, '7. Competitive Gap Analysis', y);
  y = bodyText(doc, `Gap analysis identifies queries where competitors appear but ${config.clientName} brands do not. These represent immediate AEO improvement opportunities.`, y);
  y += 2;

  if (charts?.competitiveGaps) y = await addChartImage(doc, charts.competitiveGaps, y);

  const gapTableData = [
    ['CRITICAL', gapSummary.CRITICAL || 0, `${((gapSummary.CRITICAL || 0) / config.totalQuestions * 100).toFixed(1)}%`, 'Competitors appear, zero client brands'],
    ['PARTIAL', gapSummary.PARTIAL || 0, `${((gapSummary.PARTIAL || 0) / config.totalQuestions * 100).toFixed(1)}%`, 'At least one client brand missing'],
    ['ALL PRESENT', gapSummary.ALL_PRESENT || 0, `${((gapSummary.ALL_PRESENT || 0) / config.totalQuestions * 100).toFixed(1)}%`, 'Both sides appear'],
    ['CLIENT ONLY', gapSummary.CLIENT_ONLY || 0, `${((gapSummary.CLIENT_ONLY || 0) / config.totalQuestions * 100).toFixed(1)}%`, 'Client only, no competitors'],
    ['NO BRANDS', gapSummary.NO_BRANDS || 0, `${((gapSummary.NO_BRANDS || 0) / config.totalQuestions * 100).toFixed(1)}%`, 'No tracked brands'],
  ];
  autoTable(doc, {
    startY: y,
    head: [['Gap Type', 'Count', '% of Queries', 'Description']],
    body: gapTableData,
    headStyles: { fillColor: NAVY, fontSize: 7, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 15 },
    tableWidth: 180,
  });

  y = (doc as any).lastAutoTable.finalY + 6;
  const critGaps = gaps.filter(g => g.type === 'CRITICAL');
  if (critGaps.length > 0) {
    if (y > 230) { doc.addPage(); pageNum++; addFooter(doc, pageNum, config.platform, config.country, config.date); y = 20; }
    y = subSection(doc, `Critical Gap Queries (${critGaps.length})`, y);
    for (let i = 0; i < Math.min(critGaps.length, 15); i++) {
      if (y > 270) { doc.addPage(); pageNum++; addFooter(doc, pageNum, config.platform, config.country, config.date); y = 20; }
      y = bulletPoint(doc, `${critGaps[i].questionNum}. ${critGaps[i].question} [${critGaps[i].category}]`, y);
    }
    if (critGaps.length > 15) {
      y = bodyText(doc, `... and ${critGaps.length - 15} more. See the Excel report for the full list.`, y);
    }
  }

  // ===== PAGE: SCORECARD =====
  doc.addPage();
  pageNum++;
  addFooter(doc, pageNum, config.platform, config.country, config.date);
  y = 20;
  y = sectionTitle(doc, '8. Brand AEO Scorecard', y);
  y = bodyText(doc, 'The AEO Scorecard provides a composite score (0-100) based on six weighted dimensions: Presence (25%), Citation Rate (15%), Sentiment (15%), Top Recommendations (15%), Mention Depth (15%), and First-Mention Rate (15%).', y);
  y += 2;

  if (charts?.brandScorecard) y = await addChartImage(doc, charts.brandScorecard, y, 140, 100);

  autoTable(doc, {
    startY: y,
    head: [['Brand', 'Group', 'Presence', 'Citation', 'Sentiment', 'Top Rec', 'Depth', '1st Mention', 'Composite']],
    body: sorted.map(b => [
      b.name, b.group === 'client' ? 'Client' : 'Comp',
      (b.presencePct * 100).toFixed(0), (b.citeRate * 100).toFixed(0),
      (b.sentimentScore * 50 + 50).toFixed(0), (b.topRecPct * 100).toFixed(0),
      Math.min((b.avgDepth / 5) * 100, 100).toFixed(0),
      b.presence > 0 ? ((b.rank1Count / b.presence) * 100).toFixed(0) : '0',
      b.compositeScore,
    ]),
    headStyles: { fillColor: NAVY, fontSize: 6, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 15 },
    tableWidth: 180,
  });

  // ===== PAGE: RECOMMENDATIONS =====
  doc.addPage();
  pageNum++;
  addFooter(doc, pageNum, config.platform, config.country, config.date);
  y = 20;
  y = sectionTitle(doc, '9. Recommendations and Next Steps', y);

  y = subSection(doc, 'Immediate Priorities', y);
  const critCount = gapSummary.CRITICAL || 0;
  const weakestClient = [...clientMetrics].sort((a, b) => a.presencePct - b.presencePct)[0];
  const topCiter = [...brandMetrics].sort((a, b) => b.mentionToCiteConversion - a.mentionToCiteConversion)[0];

  const priorities = [
    `Close the ${critCount} critical gap queries. Create or optimize content targeting these queries with answer-first formatting, structured data, and clear entity attribution.`,
  ];
  if (weakestClient) {
    priorities.push(`Improve ${weakestClient.name} visibility as the highest-impact growth lever. Focus on getting it mentioned in informational and best-of queries.`);
  }
  if (topCiter && topCiter.group === 'competitor') {
    const worstCiter = [...clientMetrics].sort((a, b) => a.mentionToCiteConversion - b.mentionToCiteConversion)[0];
    if (worstCiter) {
      priorities.push(`Increase ${worstCiter.name} citation conversion from ${(worstCiter.mentionToCiteConversion * 100).toFixed(0)}% toward the ${(topCiter.mentionToCiteConversion * 100).toFixed(0)}% benchmark set by ${topCiter.name}.`);
    }
  }
  for (const p of priorities) { y = bulletPoint(doc, p, y); }

  y += 4;
  y = subSection(doc, 'Content Optimization', y);
  const contentRecs = [
    'Add answer-first content blocks to key landing pages. Place a concise, standalone answer within the first 150 words.',
    'Implement comprehensive FAQ schema (JSON-LD) on product pages, targeting query phrasings from this audit.',
    'Strengthen entity markup with complete Organization schema, including sameAs links and service descriptions.',
    'Create or update comparison content for all head-to-head queries.',
  ];
  for (const r of contentRecs) {
    if (y > 270) { doc.addPage(); pageNum++; addFooter(doc, pageNum, config.platform, config.country, config.date); y = 20; }
    y = bulletPoint(doc, r, y);
  }

  y += 4;
  y = subSection(doc, 'Monitoring and Tracking', y);
  const monitorRecs = [
    `Establish a monthly AEO tracking cadence using the same ${config.totalQuestions}-query set.`,
    'Expand monitoring to additional AI platforms for multi-platform visibility.',
    'Track citation URLs monthly to identify when pages gain or lose AI visibility.',
  ];
  if (weakestClient) {
    monitorRecs.push(`Set target: ${Math.min(Math.round(weakestClient.presencePct * 100 + 15), 60)}% presence for ${weakestClient.name} within 90 days.`);
  }
  for (const r of monitorRecs) {
    if (y > 270) { doc.addPage(); pageNum++; addFooter(doc, pageNum, config.platform, config.country, config.date); y = 20; }
    y = bulletPoint(doc, r, y);
  }

  // End of report
  y += 10;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.8);
  doc.line(15, y, 195, y);
  y += 6;
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text('End of Report', 105, y, { align: 'center' });
  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text(`This report was generated from ${config.totalQuestions} queries submitted to ${config.platform} on ${config.date}, targeting ${config.country}. All data reflects AI-generated responses captured at that point in time.`, 105, y, { align: 'center', maxWidth: 170 });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
