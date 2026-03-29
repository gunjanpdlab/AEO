import { ChartConfiguration } from 'chart.js';
import { AnalysisResult, ChartSet } from './types';
import { CLIENT_COLORS, COMPETITOR_COLORS } from './constants';

function getBrandColors(clientCount: number, compCount: number) {
  const cColors = CLIENT_COLORS.slice(0, clientCount);
  const compColors = COMPETITOR_COLORS.slice(0, compCount);
  return [...cColors, ...compColors];
}

async function renderChart(config: ChartConfiguration, w = 800, h = 500): Promise<string> {
  const chartConfig = JSON.stringify(config);
  const res = await fetch('https://quickchart.io/chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chart: chartConfig,
      width: w,
      height: h,
      backgroundColor: 'white',
      format: 'png',
      version: '4',
    }),
  });
  if (!res.ok) throw new Error(`QuickChart error: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function brandPresenceChart(result: AnalysisResult): Promise<string> {
  const { brandMetrics, config } = result;
  const colors = getBrandColors(config.clientBrands.length, config.competitorBrands.length);
  return renderChart({
    type: 'bar',
    data: {
      labels: brandMetrics.map(b => b.name),
      datasets: [{
        label: 'Presence %',
        data: brandMetrics.map(b => Math.round(b.presencePct * 1000) / 10),
        backgroundColor: colors,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: `Brand Presence in ${config.platform} Responses`, font: { size: 16, weight: 'bold' } },
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '% of Queries' }, ticks: { callback: (v: any) => v + '%' } },
      },
    },
  });
}

async function totalMentionsChart(result: AnalysisResult): Promise<string> {
  const { brandMetrics, config } = result;
  const colors = getBrandColors(config.clientBrands.length, config.competitorBrands.length);
  return renderChart({
    type: 'bar',
    data: {
      labels: brandMetrics.map(b => b.name),
      datasets: [{ label: 'Total Mentions', data: brandMetrics.map(b => b.mentions), backgroundColor: colors, borderWidth: 0 }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Total Mention Volume', font: { size: 16, weight: 'bold' } },
        legend: { display: false },
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Total Mentions' } } },
    },
  });
}

async function urlCitationsChart(result: AnalysisResult): Promise<string> {
  const { brandMetrics, config } = result;
  const colors = getBrandColors(config.clientBrands.length, config.competitorBrands.length);
  return renderChart({
    type: 'bar',
    data: {
      labels: brandMetrics.map(b => b.name),
      datasets: [{ label: 'URL Citations', data: brandMetrics.map(b => b.cited), backgroundColor: colors, borderWidth: 0 }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'URL Citation Count by Brand', font: { size: 16, weight: 'bold' } },
        legend: { display: false },
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'URL Citations' } } },
    },
  });
}

async function topRecommendationsPieChart(result: AnalysisResult): Promise<string> {
  const { brandMetrics, config } = result;
  const active = brandMetrics.filter(b => b.topRecs > 0);
  const colors = getBrandColors(config.clientBrands.length, config.competitorBrands.length);
  const activeColors = brandMetrics.map((b, i) => ({ recs: b.topRecs, color: colors[i] })).filter(x => x.recs > 0).map(x => x.color);
  return renderChart({
    type: 'doughnut',
    data: {
      labels: active.map(b => `${b.name} (${b.topRecs})`),
      datasets: [{ data: active.map(b => b.topRecs), backgroundColor: activeColors, borderWidth: 2, borderColor: '#fff' }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Top Recommendation Distribution', font: { size: 16, weight: 'bold' } },
        legend: { position: 'right' },
      },
    },
  }, 700, 500);
}

async function presenceByCategoryChart(result: AnalysisResult): Promise<string> {
  const { categoryMetrics, config } = result;
  const allBrands = [...config.clientBrands, ...config.competitorBrands];
  const colors = getBrandColors(config.clientBrands.length, config.competitorBrands.length);
  return renderChart({
    type: 'bar',
    data: {
      labels: categoryMetrics.map(c => c.category),
      datasets: allBrands.map((brand, i) => ({
        label: brand,
        data: categoryMetrics.map(c => Math.round((c.brandPresence[brand] || 0) * 1000) / 10),
        backgroundColor: colors[i],
        borderWidth: 0,
      })),
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Brand Presence by Question Category', font: { size: 16, weight: 'bold' } },
        legend: { position: 'top' },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '% of Queries' }, ticks: { callback: (v: any) => v + '%' } },
        x: { ticks: { maxRotation: 45, minRotation: 30 } },
      },
    },
  }, 1000, 550);
}

async function funnelChart(result: AnalysisResult): Promise<string> {
  const { funnelMetrics, config } = result;
  const allBrands = [...config.clientBrands, ...config.competitorBrands];
  const colors = getBrandColors(config.clientBrands.length, config.competitorBrands.length);
  return renderChart({
    type: 'bar',
    data: {
      labels: funnelMetrics.map(f => f.stage),
      datasets: allBrands.map((brand, i) => ({
        label: brand,
        data: funnelMetrics.map(f => Math.round((f.brandPresence[brand] || 0) * 1000) / 10),
        backgroundColor: colors[i],
        borderWidth: 0,
      })),
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Brand Visibility Across Buyer Journey', font: { size: 16, weight: 'bold' } },
        legend: { position: 'top' },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '% of Queries' }, ticks: { callback: (v: any) => v + '%' } },
      },
    },
  }, 900, 500);
}

async function sentimentChart(result: AnalysisResult): Promise<string> {
  const { brandMetrics } = result;
  return renderChart({
    type: 'bar',
    data: {
      labels: brandMetrics.map(b => b.name),
      datasets: [
        { label: 'Positive', data: brandMetrics.map(b => b.positiveCount), backgroundColor: '#70AD47', borderWidth: 0 },
        { label: 'Neutral', data: brandMetrics.map(b => b.neutralCount), backgroundColor: '#FFC000', borderWidth: 0 },
        { label: 'Negative', data: brandMetrics.map(b => b.negativeCount), backgroundColor: '#FF4444', borderWidth: 0 },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      plugins: {
        title: { display: true, text: 'Sentiment Distribution by Brand', font: { size: 16, weight: 'bold' } },
        legend: { position: 'bottom' },
      },
      scales: { x: { stacked: true, title: { display: true, text: 'Response Count' } }, y: { stacked: true } },
    },
  }, 800, 450);
}

async function radarChart(result: AnalysisResult): Promise<string> {
  const { brandMetrics, config } = result;
  const colors = getBrandColors(config.clientBrands.length, config.competitorBrands.length);
  const dims = ['Presence', 'Citation', 'Sentiment', 'Top Rec', 'Depth', 'First Mention'];

  return renderChart({
    type: 'radar',
    data: {
      labels: dims,
      datasets: brandMetrics.map((b, i) => {
        const presence = b.presencePct * 100;
        const citation = b.citeRate * 100;
        const sentiment = b.sentimentScore * 50 + 50;
        const topRec = b.topRecPct * 100;
        const depth = Math.min((b.avgDepth / 5) * 100, 100);
        const firstMention = b.presence > 0 ? (b.rank1Count / b.presence) * 100 : 0;
        return {
          label: b.name,
          data: [presence, citation, sentiment, topRec, depth, firstMention],
          borderColor: colors[i],
          backgroundColor: colors[i] + '15',
          borderWidth: 2,
          pointRadius: 3,
        };
      }),
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Brand AEO Scorecard', font: { size: 16, weight: 'bold' } },
        legend: { position: 'right' },
      },
      scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
    },
  }, 700, 600);
}

async function clientVsCompetitorChart(result: AnalysisResult): Promise<string> {
  const { clientVsCompetitor: cvc, config } = result;
  return renderChart({
    type: 'doughnut',
    data: {
      labels: [`${config.clientName} (${cvc.clientMentions})`, `Competitors (${cvc.competitorMentions})`],
      datasets: [{
        data: [cvc.clientMentions, cvc.competitorMentions],
        backgroundColor: ['#2F5496', '#ED7D31'],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Client vs. Competitor Mention Volume Share', font: { size: 16, weight: 'bold' } },
        legend: { position: 'bottom' },
      },
    },
  }, 600, 500);
}

async function competitiveGapsChart(result: AnalysisResult): Promise<string> {
  const { gapSummary } = result;
  const labels = ['CRITICAL', 'PARTIAL', 'ALL_PRESENT', 'CLIENT_ONLY', 'NO_BRANDS'];
  const displayLabels = ['Critical', 'Partial', 'All Present', 'Client Only', 'No Brands'];
  const gapColors = ['#FF4444', '#FFC000', '#7BA0D4', '#70AD47', '#CCCCCC'];
  return renderChart({
    type: 'bar',
    data: {
      labels: displayLabels,
      datasets: [{
        label: 'Queries',
        data: labels.map(l => gapSummary[l] || 0),
        backgroundColor: gapColors,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Competitive Gap Analysis Summary', font: { size: 16, weight: 'bold' } },
        legend: { display: false },
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Queries' } } },
    },
  });
}

async function mentionToCitationChart(result: AnalysisResult): Promise<string> {
  const { brandMetrics, config } = result;
  const colors = getBrandColors(config.clientBrands.length, config.competitorBrands.length);
  return renderChart({
    type: 'bar',
    data: {
      labels: brandMetrics.map(b => b.name),
      datasets: [{
        label: 'Conversion %',
        data: brandMetrics.map(b => Math.round(b.mentionToCiteConversion * 1000) / 10),
        backgroundColor: colors,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Mention-to-Citation Conversion Rate', font: { size: 16, weight: 'bold' } },
        legend: { display: false },
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Conversion %' }, ticks: { callback: (v: any) => v + '%' } } },
    },
  });
}

async function avgRankChart(result: AnalysisResult): Promise<string> {
  const { brandMetrics, config } = result;
  const colors = getBrandColors(config.clientBrands.length, config.competitorBrands.length);
  return renderChart({
    type: 'bar',
    data: {
      labels: brandMetrics.map(b => b.name),
      datasets: [{
        label: 'Avg Rank',
        data: brandMetrics.map(b => b.avgRank),
        backgroundColor: colors,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Average First-Mention Rank Position', font: { size: 16, weight: 'bold' } },
        legend: { display: false },
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Avg Position (lower = better)' } } },
    },
  });
}

export async function generateAllCharts(result: AnalysisResult): Promise<ChartSet> {
  const [
    brandPresence, totalMentions, urlCitations, topRecommendationsPie,
    presenceByCategory, funnelAnalysis, sentimentDistribution, brandScorecard,
    clientVsCompetitorSov, competitiveGaps, mentionToCitation, avgRankPosition,
  ] = await Promise.all([
    brandPresenceChart(result),
    totalMentionsChart(result),
    urlCitationsChart(result),
    topRecommendationsPieChart(result),
    presenceByCategoryChart(result),
    funnelChart(result),
    sentimentChart(result),
    radarChart(result),
    clientVsCompetitorChart(result),
    competitiveGapsChart(result),
    mentionToCitationChart(result),
    avgRankChart(result),
  ]);

  return {
    brandPresence, totalMentions, urlCitations, topRecommendationsPie,
    presenceByCategory, funnelAnalysis, sentimentDistribution, brandScorecard,
    clientVsCompetitorSov, competitiveGaps, mentionToCitation, avgRankPosition,
  };
}
