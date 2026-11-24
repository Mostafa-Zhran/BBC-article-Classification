import React, { useState, useEffect } from 'react';
import { 
  Database, BarChart2, Layers, CheckCircle2, 
  RefreshCw, Filter
} from 'lucide-react';
import PlotlyChart from '../components/PlotlyChart';
import { API_BASE_URL, getApiHeaders } from '../config';

const CATEGORY_COLORS = {
  Business: '#00E5FF',
  Sport: '#00FF88',
  Entertainment: '#FF007F',
  Politics: '#A855F7',
  Tech: '#FF9100',
  tech: '#FF9100',
  business: '#00E5FF',
  sport: '#00FF88',
  entertainment: '#FF007F',
  politics: '#A855F7'
};

export default function DatasetAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distributionMode, setDistributionMode] = useState('clean'); // 'clean' or 'raw'
  const [activeWordCategory, setActiveWordCategory] = useState('business');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/analytics`, {
      headers: getApiHeaders()
    })
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load analytics:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={24} color="#00E5FF" />
        <span className="mono">Loading Analytics Telemetry...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#EF4444' }}>
        Failed to fetch analytics from backend API. Please make sure the backend is running.
      </div>
    );
  }

  // ── Plotly 1: Class Distribution Donut Chart ──────────────
  const activeDist = distributionMode === 'clean' ? data.clean_distribution : data.raw_distribution;
  const classLabels = Object.keys(activeDist);
  const classValues = Object.values(activeDist);
  const totalCount = distributionMode === 'clean' ? data.summary.total_cleaned : data.summary.total_raw;
  const donutColors = classLabels.map(l => CATEGORY_COLORS[l] || '#00E5FF');

  const donutChartData = [{
    values: classValues,
    labels: classLabels,
    type: 'pie',
    hole: 0.62,
    marker: { colors: donutColors },
    textinfo: 'label+percent',
    textfont: { color: '#FFFFFF', family: 'Plus Jakarta Sans', size: 11 },
    hoverinfo: 'label+value+percent',
  }];

  const donutChartLayout = {
    showlegend: false,
    margin: { l: 15, r: 15, t: 15, b: 15 },
    height: 280,
    annotations: [{
      text: `<b>${totalCount}</b><br><span style="font-size:11px;color:#9CA3AF;">${distributionMode === 'clean' ? 'Cleaned' : 'Raw'}</span>`,
      showarrow: false,
      font: { size: 16, color: '#FFFFFF', family: 'JetBrains Mono' }
    }]
  };

  // ── Plotly 2: Model Benchmark Comparison ─────────────────
  const modelNames = data.model_benchmarks.map(m => m.model);
  const modelF1 = data.model_benchmarks.map(m => m.f1);
  const modelColors = data.model_benchmarks.map(m => m.color);

  const modelChartData = [{
    x: modelNames,
    y: modelF1,
    type: 'bar',
    marker: {
      color: modelColors,
      line: { color: 'rgba(255,255,255,0.2)', width: 1 }
    },
    text: modelF1.map(v => `${(v * 100).toFixed(2)}%`),
    textposition: 'outside',
    textfont: { color: '#F3F4F6', family: 'JetBrains Mono', size: 11 },
    hoverinfo: 'x+y'
  }];

  const modelChartLayout = {
    yaxis: {
      range: [0.94, 1.015],
      tickformat: '.1%',
      gridcolor: 'rgba(255,255,255,0.06)',
      tickfont: { color: '#9CA3AF', size: 10 }
    },
    xaxis: {
      tickfont: { color: '#F3F4F6', size: 11, weight: 600 }
    },
    margin: { l: 45, r: 15, t: 25, b: 35 },
    height: 280
  };

  // ── Plotly 3: Confusion Matrix Heatmap ────────────────────
  const cmLabels = data.confusion_matrix.labels;
  const cmMatrix = data.confusion_matrix.matrix;

  const cmChartData = [{
    z: cmMatrix,
    x: cmLabels,
    y: cmLabels,
    type: 'heatmap',
    colorscale: [
      [0, '#0A1220'],
      [0.05, '#0E284D'],
      [0.5, '#0284C7'],
      [1, '#00E5FF']
    ],
    showscale: false,
    hoverongaps: false
  }];

  const cmAnnotations = [];
  for (let i = 0; i < cmLabels.length; i++) {
    for (let j = 0; j < cmLabels.length; j++) {
      const val = cmMatrix[i][j];
      cmAnnotations.push({
        x: cmLabels[j],
        y: cmLabels[i],
        text: `<b>${val}</b>`,
        showarrow: false,
        font: {
          color: val > 30 ? '#05070B' : val > 0 ? '#00E5FF' : '#4B5563',
          size: 12,
          family: 'JetBrains Mono'
        }
      });
    }
  }

  const cmChartLayout = {
    annotations: cmAnnotations,
    xaxis: {
      title: { text: 'Predicted Category', font: { size: 11, color: '#9CA3AF' } },
      tickfont: { color: '#F3F4F6', size: 10 },
      tickangle: -20
    },
    yaxis: {
      title: { text: 'True Category', font: { size: 11, color: '#9CA3AF' } },
      tickfont: { color: '#F3F4F6', size: 10 },
      autorange: 'reversed'
    },
    margin: { l: 65, r: 15, t: 15, b: 45 },
    height: 300
  };

  // ── Plotly 4: Preprocessing Reduction Funnel ──────────────
  const funnelStages = data.token_funnel.map(f => f.stage);
  const funnelCounts = data.token_funnel.map(f => f.count);

  const funnelChartData = [{
    type: 'funnel',
    y: funnelStages,
    x: funnelCounts,
    textinfo: 'value+percent initial',
    marker: {
      color: ['#00E5FF', '#A855F7', '#00FF88'],
      line: { width: 1, color: 'rgba(255,255,255,0.2)' }
    },
    textfont: { family: 'JetBrains Mono', color: '#FFF', size: 11 }
  }];

  const funnelChartLayout = {
    margin: { l: 120, r: 25, t: 15, b: 15 },
    height: 300
  };

  // ── Top Words for Active Category ────────────────────────
  const currentWords = (data.top_words[activeWordCategory] || []).slice(0, 8);
  const wordsX = currentWords.map(w => w.weight).reverse();
  const wordsY = currentWords.map(w => w.word).reverse();
  const activeColor = CATEGORY_COLORS[activeWordCategory] || '#00E5FF';

  const wordsChartData = [{
    type: 'bar',
    x: wordsX,
    y: wordsY,
    orientation: 'h',
    marker: {
      color: activeColor,
      line: { color: 'rgba(255,255,255,0.2)', width: 1 }
    },
    text: wordsX.map(v => `+${v.toFixed(3)}`),
    textposition: 'inside',
    textfont: { family: 'JetBrains Mono', color: '#05070B', size: 11, weight: 700 }
  }];

  const wordsChartLayout = {
    xaxis: {
      title: { text: 'SVM Weight Coefficient', font: { size: 11, color: '#9CA3AF' } },
      gridcolor: 'rgba(255,255,255,0.06)',
      tickfont: { color: '#9CA3AF', size: 10 }
    },
    yaxis: {
      tickfont: { color: '#F3F4F6', size: 11, family: 'JetBrains Mono' }
    },
    margin: { l: 85, r: 25, t: 15, b: 35 },
    height: 300
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      
      {/* ── KPI Summary Cards ──────────────────────────────────── */}
      <div className="kpi-grid">
        
        <div className="glass-card" style={{ padding: '20px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00E5FF', marginBottom: '8px' }}>
            <Database size={16} />
            <span className="mono" style={{ fontSize: '0.72em', fontWeight: 700 }}>DATASET VOLUME</span>
          </div>
          <div style={{ fontSize: '1.9em', fontWeight: 800, color: '#FFF' }}>
            {data.summary.total_cleaned}
          </div>
          <p style={{ fontSize: '0.78em', color: 'var(--text-dim)', marginTop: '4px' }}>
            Cleaned articles ({data.summary.total_raw} raw)
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00FF88', marginBottom: '8px' }}>
            <CheckCircle2 size={16} />
            <span className="mono" style={{ fontSize: '0.72em', fontWeight: 700 }}>MODEL ACCURACY</span>
          </div>
          <div style={{ fontSize: '1.9em', fontWeight: 800, color: '#00FF88' }}>
            {data.summary.best_f1}
          </div>
          <p style={{ fontSize: '0.78em', color: 'var(--text-dim)', marginTop: '4px' }}>
            Macro F1 on test set (319 items)
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF9100', marginBottom: '8px' }}>
            <Filter size={16} />
            <span className="mono" style={{ fontSize: '0.72em', fontWeight: 700 }}>DUPLICATES REMOVED</span>
          </div>
          <div style={{ fontSize: '1.9em', fontWeight: 800, color: '#FF9100' }}>
            {data.summary.duplicates_removed}
          </div>
          <p style={{ fontSize: '0.78em', color: 'var(--text-dim)', marginTop: '4px' }}>
            Exact duplicate articles dropped
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A855F7', marginBottom: '8px' }}>
            <Layers size={16} />
            <span className="mono" style={{ fontSize: '0.72em', fontWeight: 700 }}>VOCAB REDUCTION</span>
          </div>
          <div style={{ fontSize: '1.9em', fontWeight: 800, color: '#A855F7' }}>
            {data.summary.vocabulary_reduction}
          </div>
          <p style={{ fontSize: '0.78em', color: 'var(--text-dim)', marginTop: '4px' }}>
            From 773 to 410 tokens/article
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF007F', marginBottom: '8px' }}>
            <BarChart2 size={16} />
            <span className="mono" style={{ fontSize: '0.72em', fontWeight: 700 }}>AVG LENGTH</span>
          </div>
          <div style={{ fontSize: '1.9em', fontWeight: 800, color: '#FFF' }}>
            {data.summary.avg_words}
          </div>
          <p style={{ fontSize: '0.78em', color: 'var(--text-dim)', marginTop: '4px' }}>
            Words per article (~2,232 chars)
          </p>
        </div>

      </div>

      {/* ── Class Comparison Table (Full Precision) ──────────── */}
      <div className="glass-card" style={{ padding: '24px', minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.05em', fontWeight: 700, color: '#FFF' }}>
              Class Distribution & Sizing Audit
            </h3>
            <p style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>
              Verified counts: Raw Kaggle dataset (2,225) vs Cleaned dataset (2,126)
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: '0.72em', color: '#00E5FF', background: 'rgba(0, 229, 255, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
              5 BALANCED CATEGORIES
            </span>
            <span className="mono" style={{ fontSize: '0.68em', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 8px', borderRadius: '8px' }}>
              ⇄ Scroll to view all
            </span>
          </div>
        </div>

        <div className="table-scroll-container">
          <table className="audit-table">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-dim)' }}>
                <th>Category</th>
                <th>Raw Articles (2,225)</th>
                <th>Raw Share %</th>
                <th>Cleaned Articles (2,126)</th>
                <th>Cleaned Share %</th>
                <th>Duplicates Dropped</th>
              </tr>
            </thead>
            <tbody>
              {data.class_table.map((row) => (
                <tr key={row.category} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#FFF' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: row.color, flexShrink: 0 }}></span>
                    {row.category}
                  </td>
                  <td className="mono">{row.raw_count}</td>
                  <td className="mono">{row.raw_pct}%</td>
                  <td style={{ fontWeight: 700, color: row.color }} className="mono">{row.clean_count}</td>
                  <td className="mono">{row.clean_pct}%</td>
                  <td style={{ color: '#FF9100' }} className="mono">-{row.duplicates_removed}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 800, color: '#FFF', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <td>Total</td>
                <td className="mono">2,225</td>
                <td className="mono">100.0%</td>
                <td style={{ color: '#00FF88' }} className="mono">2,126</td>
                <td className="mono">100.0%</td>
                <td style={{ color: '#FF9100' }} className="mono">-99</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Row 1 Charts: Distribution & Model Benchmarks ────── */}
      <div className="charts-grid">
        
        {/* Class Distribution Donut */}
        <div className="glass-card" style={{ padding: '22px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.02em', fontWeight: 700, color: '#FFF' }}>
                Class Distribution
              </h3>
              <p style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>
                Articles per category ({distributionMode === 'clean' ? '2,126 Cleaned' : '2,225 Raw'})
              </p>
            </div>
            
            {/* Clean vs Raw Toggle */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '3px' }}>
              <button
                onClick={() => setDistributionMode('clean')}
                style={{
                  background: distributionMode === 'clean' ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                  color: distributionMode === 'clean' ? '#00E5FF' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '4px 10px',
                  fontSize: '0.75em',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cleaned (2,126)
              </button>
              <button
                onClick={() => setDistributionMode('raw')}
                style={{
                  background: distributionMode === 'raw' ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                  color: distributionMode === 'raw' ? '#00E5FF' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '4px 10px',
                  fontSize: '0.75em',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Raw (2,225)
              </button>
            </div>
          </div>

          <PlotlyChart data={donutChartData} layout={donutChartLayout} />
        </div>

        {/* Model Benchmarks */}
        <div className="glass-card" style={{ padding: '22px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.02em', fontWeight: 700, color: '#FFF' }}>
                Model Performance Benchmark
              </h3>
              <p style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>
                Macro F1 score comparison on stratified validation data
              </p>
            </div>
            <span className="mono" style={{ fontSize: '0.7em', color: '#00FF88', background: 'rgba(0, 255, 136, 0.1)', padding: '3px 8px', borderRadius: '12px' }}>
              SVM BEST: 99.05%
            </span>
          </div>
          <PlotlyChart data={modelChartData} layout={modelChartLayout} />
        </div>

      </div>

      {/* ── Row 2 Charts: Confusion Matrix & Reduction Funnel ── */}
      <div className="charts-grid">
        
        {/* Confusion Matrix Heatmap */}
        <div className="glass-card" style={{ padding: '22px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.02em', fontWeight: 700, color: '#FFF' }}>
                Confusion Matrix (Linear SVM)
              </h3>
              <p style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>
                Sealed test set: 316 of 319 correct predictions (99.06% accuracy)
              </p>
            </div>
            <span className="mono" style={{ fontSize: '0.7em', color: '#00E5FF', background: 'rgba(0, 229, 255, 0.1)', padding: '3px 8px', borderRadius: '12px' }}>
              319 SAMPLES
            </span>
          </div>
          <PlotlyChart data={cmChartData} layout={cmChartLayout} />
        </div>

        {/* NLP Reduction Funnel */}
        <div className="glass-card" style={{ padding: '22px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.02em', fontWeight: 700, color: '#FFF' }}>
                Vocabulary Reduction Funnel
              </h3>
              <p style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>
                Average token count reduction per article through NLP stages
              </p>
            </div>
            <span className="mono" style={{ fontSize: '0.7em', color: '#A855F7', background: 'rgba(168, 85, 247, 0.1)', padding: '3px 8px', borderRadius: '12px' }}>
              -47% NOISE
            </span>
          </div>
          <PlotlyChart data={funnelChartData} layout={funnelChartLayout} />
        </div>

      </div>

      {/* ── Row 3 Chart: Top Predictive Keywords Explorer ─────── */}
      <div className="glass-card" style={{ padding: '22px', minWidth: 0, overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.02em', fontWeight: 700, color: '#FFF' }}>
              Top Predictive Features (Model Explainability)
            </h3>
            <p style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>
              Top 8 TF-IDF terms with highest Linear SVM weights per topic
            </p>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['business', 'sport', 'entertainment', 'politics', 'tech'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveWordCategory(cat)}
                style={{
                  background: activeWordCategory === cat ? CATEGORY_COLORS[cat] : 'rgba(255, 255, 255, 0.05)',
                  color: activeWordCategory === cat ? '#05070B' : '#9CA3AF',
                  border: `1px solid ${activeWordCategory === cat ? CATEGORY_COLORS[cat] : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '20px',
                  padding: '5px 14px',
                  fontSize: '0.78em',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <PlotlyChart data={wordsChartData} layout={wordsChartLayout} />
      </div>

    </div>
  );
}
