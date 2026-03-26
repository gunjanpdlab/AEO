import ExcelJS from 'exceljs';
import { AnalysisResult, BrandMetrics, ChartSet } from './types';

const NAVY = '2F5496';
const DARK_NAVY = '1F3864';
const LIGHT_BLUE = 'D6E4F0';
const ORANGE = 'ED7D31';
const LIGHT_ORANGE = 'FCE4D6';
const GREEN = '70AD47';
const RED = 'FF4444';
const LIGHT_GRAY = 'F2F2F2';
const WHITE = 'FFFFFF';

function headerStyle(ws: ExcelJS.Worksheet, row: number, cols: number) {
  const r = ws.getRow(row);
  for (let c = 1; c <= cols; c++) {
    const cell = r.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.font = { color: { argb: WHITE }, bold: true, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
      left: { style: 'thin', color: { argb: 'CCCCCC' } },
      right: { style: 'thin', color: { argb: 'CCCCCC' } },
    };
  }
}

function dataRow(ws: ExcelJS.Worksheet, row: number, cols: number, brand?: BrandMetrics) {
  const r = ws.getRow(row);
  for (let c = 1; c <= cols; c++) {
    const cell = r.getCell(c);
    cell.border = {
      top: { style: 'thin', color: { argb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
      left: { style: 'thin', color: { argb: 'CCCCCC' } },
      right: { style: 'thin', color: { argb: 'CCCCCC' } },
    };
    cell.font = { size: 9 };
    cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
  }
  if (brand) {
    const bgColor = brand.group === 'client' ? LIGHT_BLUE : LIGHT_ORANGE;
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    r.getCell(1).font = { bold: true, size: 9 };
  }
  if (row % 2 === 0) {
    for (let c = 2; c <= cols; c++) {
      r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
    }
  }
}

function sheetTitle(ws: ExcelJS.Worksheet, title: string, subtitle: string, cols: number) {
  ws.mergeCells(1, 1, 1, cols);
  const titleCell = ws.getCell('A1');
  titleCell.value = title;
  titleCell.font = { size: 14, bold: true, color: { argb: NAVY } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, cols);
  const subCell = ws.getCell('A2');
  subCell.value = subtitle;
  subCell.font = { size: 9, italic: true, color: { argb: '666666' } };
  ws.getRow(2).height = 18;
}

export async function generateAnalysisExcel(
  result: AnalysisResult,
  charts: ChartSet | null
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const { config, brandMetrics, gaps, gapSummary, categoryMetrics, funnelMetrics, clientVsCompetitor: cvc, parsedData, findings } = result;
  const allBrands = [...config.clientBrands, ...config.competitorBrands];
  const sorted = [...brandMetrics].sort((a, b) => b.compositeScore - a.compositeScore);

  // ============ 1. Executive Summary ============
  const ws1 = wb.addWorksheet('Executive Summary');
  ws1.columns = [
    { width: 22 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 18 },
  ];
  sheetTitle(ws1, `${config.clientName} AEO Analysis`, `${config.platform} | ${config.country} | ${config.date} | ${config.totalQuestions} Queries`, 9);

  // KPI Row
  const clientMetrics = sorted.filter(b => b.group === 'client');
  const avgComp = clientMetrics.length > 0 ? Math.round(clientMetrics.reduce((s, b) => s + b.compositeScore, 0) / clientMetrics.length) : 0;
  const kpis = [
    [`${cvc.clientPresence}/${config.totalQuestions}`, 'Client Presence'],
    [`${cvc.totalMentions > 0 ? Math.round(cvc.clientMentions / cvc.totalMentions * 100) : 0}%`, 'Client SOV'],
    [`${clientMetrics.reduce((s, b) => s + b.topRecs, 0)}`, 'Top Rec Wins'],
    [`${clientMetrics.reduce((s, b) => s + b.cited, 0)}`, 'URL Citations'],
    [`${gapSummary.CRITICAL || 0}`, 'Critical Gaps'],
    [`${avgComp}/100`, 'Avg Composite'],
  ];
  ws1.getRow(4).values = kpis.map(k => k[0]);
  ws1.getRow(5).values = kpis.map(k => k[1]);
  for (let c = 1; c <= 6; c++) {
    const cell4 = ws1.getRow(4).getCell(c);
    cell4.font = { size: 18, bold: true, color: { argb: NAVY } };
    cell4.alignment = { horizontal: 'center' };
    cell4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
    const cell5 = ws1.getRow(5).getCell(c);
    cell5.font = { size: 8, color: { argb: '666666' } };
    cell5.alignment = { horizontal: 'center' };
  }

  // Brand comparison table
  ws1.getRow(7).values = ['Brand', 'Group', 'Presence %', 'Mentions', 'Top Recs', 'URL Cites', 'Avg Rank', 'Sentiment', 'Composite'];
  headerStyle(ws1, 7, 9);
  sorted.forEach((b, i) => {
    const r = 8 + i;
    ws1.getRow(r).values = [
      b.name, b.group === 'client' ? 'Client' : 'Competitor',
      `${(b.presencePct * 100).toFixed(1)}%`, b.mentions, b.topRecs, b.cited,
      b.avgRank || '-', b.sentimentScore > 0 ? 'Positive' : b.sentimentScore < 0 ? 'Negative' : 'Neutral',
      b.compositeScore,
    ];
    dataRow(ws1, r, 9, b);
  });

  // Key Findings
  const findingsStart = 8 + sorted.length + 2;
  ws1.getCell(`A${findingsStart}`).value = 'KEY FINDINGS';
  ws1.getCell(`A${findingsStart}`).font = { size: 11, bold: true, color: { argb: NAVY } };
  findings.forEach((f, i) => {
    ws1.getCell(`A${findingsStart + 1 + i}`).value = `${i + 1}. ${f}`;
    ws1.getCell(`A${findingsStart + 1 + i}`).font = { size: 9 };
    ws1.mergeCells(findingsStart + 1 + i, 1, findingsStart + 1 + i, 9);
  });

  // ============ 2. Share of Voice ============
  const ws2 = wb.addWorksheet('Share of Voice');
  ws2.columns = [{ width: 22 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }];
  sheetTitle(ws2, 'Share of Voice Analysis', `Brand visibility and mention volume across ${config.totalQuestions} queries`, 6);
  ws2.getRow(4).values = ['Brand', 'Group', 'Presence %', 'Mentions', 'Avg Depth', 'SOV %'];
  headerStyle(ws2, 4, 6);
  sorted.forEach((b, i) => {
    ws2.getRow(5 + i).values = [b.name, b.group === 'client' ? 'Client' : 'Competitor',
      `${(b.presencePct * 100).toFixed(1)}%`, b.mentions, b.avgDepth, `${(b.sovPct * 100).toFixed(1)}%`];
    dataRow(ws2, 5 + i, 6, b);
  });

  // ============ 3. Citation Analysis ============
  const ws3 = wb.addWorksheet('Citation Analysis');
  ws3.columns = [{ width: 22 }, { width: 15 }, { width: 15 }, { width: 18 }, { width: 20 }];
  sheetTitle(ws3, 'Citation & URL Attribution', 'URL citation patterns and mention-to-citation conversion', 5);
  ws3.getRow(4).values = ['Brand', 'Group', 'URL Citations', 'Citation Rate', 'Mention-to-Cite %'];
  headerStyle(ws3, 4, 5);
  sorted.forEach((b, i) => {
    ws3.getRow(5 + i).values = [b.name, b.group === 'client' ? 'Client' : 'Competitor',
      b.cited, `${(b.citeRate * 100).toFixed(1)}%`, `${(b.mentionToCiteConversion * 100).toFixed(1)}%`];
    dataRow(ws3, 5 + i, 5, b);
  });

  // ============ 4. Rank & Recommendations ============
  const ws4 = wb.addWorksheet('Rank & Recommendations');
  ws4.columns = [{ width: 22 }, { width: 15 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 12 }];
  sheetTitle(ws4, 'Top Recommendations & Rank Position', 'Which brands lead in AI responses', 6);
  ws4.getRow(4).values = ['Brand', 'Group', 'Top Recs', 'Top Rec %', '#1 Rank Count', 'Avg Rank'];
  headerStyle(ws4, 4, 6);
  sorted.forEach((b, i) => {
    ws4.getRow(5 + i).values = [b.name, b.group === 'client' ? 'Client' : 'Competitor',
      b.topRecs, `${(b.topRecPct * 100).toFixed(1)}%`, b.rank1Count, b.avgRank || '-'];
    dataRow(ws4, 5 + i, 6, b);
  });

  // ============ 5. Sentiment Analysis ============
  const ws5 = wb.addWorksheet('Sentiment Analysis');
  ws5.columns = [{ width: 22 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }];
  sheetTitle(ws5, 'Sentiment Analysis', 'Positive, neutral, and negative signals by brand', 6);
  ws5.getRow(4).values = ['Brand', 'Positive', 'Neutral', 'Negative', 'Score', 'Net Signals'];
  headerStyle(ws5, 4, 6);
  sorted.forEach((b, i) => {
    ws5.getRow(5 + i).values = [b.name, b.positiveCount, b.neutralCount, b.negativeCount,
      b.sentimentScore.toFixed(2), b.netSignals >= 0 ? `+${b.netSignals}` : `${b.netSignals}`];
    dataRow(ws5, 5 + i, 6, b);
  });

  // ============ 6. Category Breakdown ============
  const ws6 = wb.addWorksheet('Category Breakdown');
  const catCols = ['Category', 'Queries', ...allBrands, 'Client SOV', 'Comp SOV'];
  ws6.columns = catCols.map(() => ({ width: 16 }));
  ws6.getColumn(1).width = 24;
  sheetTitle(ws6, 'Category Breakdown', 'Brand presence by question category', catCols.length);
  ws6.getRow(4).values = catCols;
  headerStyle(ws6, 4, catCols.length);
  categoryMetrics.forEach((c, i) => {
    const row = [c.category, c.questionCount,
      ...allBrands.map(b => `${((c.brandPresence[b] || 0) * 100).toFixed(0)}%`),
      `${(c.clientSov * 100).toFixed(0)}%`, `${(c.competitorSov * 100).toFixed(0)}%`];
    ws6.getRow(5 + i).values = row;
    dataRow(ws6, 5 + i, catCols.length);
  });

  // ============ 7. Funnel Analysis ============
  const ws7 = wb.addWorksheet('Funnel Analysis');
  const funnelCols = ['Stage', 'Queries', ...allBrands];
  ws7.columns = funnelCols.map(() => ({ width: 16 }));
  ws7.getColumn(1).width = 20;
  sheetTitle(ws7, 'Buyer Journey Funnel', 'Brand presence at each stage of the buyer journey', funnelCols.length);
  ws7.getRow(4).values = funnelCols;
  headerStyle(ws7, 4, funnelCols.length);
  funnelMetrics.forEach((f, i) => {
    const row = [f.stage, f.questionCount, ...allBrands.map(b => `${((f.brandPresence[b] || 0) * 100).toFixed(0)}%`)];
    ws7.getRow(5 + i).values = row;
    dataRow(ws7, 5 + i, funnelCols.length);
  });

  // ============ 8. Competitive Gaps ============
  const ws8 = wb.addWorksheet('Competitive Gaps');
  ws8.columns = [{ width: 18 }, { width: 10 }, { width: 14 }, { width: 40 }];
  sheetTitle(ws8, 'Competitive Gap Analysis', 'Gap classification and critical queries', 4);

  ws8.getRow(4).values = ['Gap Type', 'Count', '% of Queries', 'Description'];
  headerStyle(ws8, 4, 4);
  const gapTypes = [
    ['CRITICAL', gapSummary.CRITICAL || 0, 'Competitors appear, zero client brands'],
    ['PARTIAL', gapSummary.PARTIAL || 0, 'At least one client brand missing'],
    ['ALL PRESENT', gapSummary.ALL_PRESENT || 0, 'Both client and competitor brands appear'],
    ['CLIENT ONLY', gapSummary.CLIENT_ONLY || 0, 'Client brands appear, no competitors'],
    ['NO BRANDS', gapSummary.NO_BRANDS || 0, 'No tracked brands in the response'],
  ];
  gapTypes.forEach((g, i) => {
    ws8.getRow(5 + i).values = [g[0], g[1], `${((g[1] as number) / config.totalQuestions * 100).toFixed(1)}%`, g[2]];
    dataRow(ws8, 5 + i, 4);
  });

  const critGaps = gaps.filter(g => g.type === 'CRITICAL');
  if (critGaps.length > 0) {
    const start = 12;
    ws8.getCell(`A${start}`).value = 'CRITICAL GAP QUERIES';
    ws8.getCell(`A${start}`).font = { size: 11, bold: true, color: { argb: RED } };
    ws8.getRow(start + 1).values = ['#', 'Category', 'Query', 'Competitors Present'];
    headerStyle(ws8, start + 1, 4);
    critGaps.forEach((g, i) => {
      ws8.getRow(start + 2 + i).values = [g.questionNum, g.category, g.question, g.competitorsPresent.join(', ')];
      dataRow(ws8, start + 2 + i, 4);
    });
  }

  // ============ 9. Brand Scorecard ============
  const ws9 = wb.addWorksheet('Brand Scorecard');
  ws9.columns = [{ width: 22 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 14 }];
  sheetTitle(ws9, 'Brand AEO Scorecard', 'Composite scoring across six dimensions (0-100 scale)', 9);
  ws9.getRow(4).values = ['Brand', 'Group', 'Presence', 'Citation', 'Sentiment', 'Top Rec', 'Depth', '1st Mention', 'Composite'];
  headerStyle(ws9, 4, 9);
  sorted.forEach((b, i) => {
    const presence = (b.presencePct * 100).toFixed(0);
    const citation = (b.citeRate * 100).toFixed(0);
    const sentiment = (b.sentimentScore * 50 + 50).toFixed(0);
    const topRec = (b.topRecPct * 100).toFixed(0);
    const depth = Math.min((b.avgDepth / 5) * 100, 100).toFixed(0);
    const firstMention = b.presence > 0 ? ((b.rank1Count / b.presence) * 100).toFixed(0) : '0';
    ws9.getRow(5 + i).values = [b.name, b.group === 'client' ? 'Client' : 'Comp',
      presence, citation, sentiment, topRec, depth, firstMention, b.compositeScore];
    dataRow(ws9, 5 + i, 9, b);
    // Bold composite
    ws9.getRow(5 + i).getCell(9).font = { size: 9, bold: true };
  });

  // ============ 10. Raw Data ============
  const ws10 = wb.addWorksheet('Raw Data');
  const rawHeaders = ['#', 'Question', 'Category', 'Funnel Stage'];
  for (const b of allBrands) {
    rawHeaders.push(`${b} Mentioned`, `${b} Mentions`, `${b} Rank`, `${b} Cited URL`, `${b} Sentiment`, `${b} Top Rec`);
  }
  ws10.columns = rawHeaders.map((_, i) => ({ width: i < 2 ? (i === 0 ? 5 : 40) : 14 }));
  sheetTitle(ws10, 'Raw Analysis Data', `Per-question breakdown across ${allBrands.length} brands`, rawHeaders.length);
  ws10.getRow(4).values = rawHeaders;
  headerStyle(ws10, 4, rawHeaders.length);
  parsedData.forEach((d, i) => {
    const row: any[] = [d.questionNum, d.question, d.category, d.funnelStage];
    for (const b of allBrands) {
      const bd = d.brands[b];
      row.push(bd.mentioned ? 'Yes' : 'No', bd.mentionCount, bd.rank || '-',
        bd.citedUrl ? 'Yes' : 'No', bd.sentiment || '-', bd.isTopRecommendation ? 'Yes' : 'No');
    }
    ws10.getRow(5 + i).values = row;
    dataRow(ws10, 5 + i, rawHeaders.length);
  });

  // ============ 11. Charts (if available) ============
  if (charts) {
    const wsCharts = wb.addWorksheet('Charts');
    sheetTitle(wsCharts, 'Visual Analysis', 'Charts generated from analysis data', 12);
    let rowPos = 4;
    const chartEntries = Object.entries(charts);
    for (const [name, base64] of chartEntries) {
      try {
        const b64Data = base64.replace(/^data:image\/png;base64,/, '');
        const imageId = wb.addImage({ base64: b64Data, extension: 'png' });
        wsCharts.addImage(imageId, {
          tl: { col: 0, row: rowPos },
          ext: { width: 700, height: 400 },
        });
        rowPos += 22;
      } catch (e) {
        // Skip chart if it fails to embed
      }
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
