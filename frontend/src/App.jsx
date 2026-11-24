import React, { useState } from 'react';
import { 
  TrendingUp, Film, Landmark, Trophy, Cpu, 
  Newspaper, RefreshCw, Copy, Check, BarChart3, 
  Layers, ShieldCheck, Activity, FileText, Sparkles,
  PieChart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import DatasetAnalytics from './pages/DatasetAnalytics';
import { API_BASE_URL, getApiHeaders } from './config';

const SECTOR_ICONS = {
  business: TrendingUp,
  entertainment: Film,
  politics: Landmark,
  sport: Trophy,
  tech: Cpu,
};

const TAG_COLORS = {
  Business: '#00E5FF',
  Technology: '#FF9100',
  Politics: '#A855F7',
  Sport: '#00FF88',
  Entertainment: '#FF007F',
};

const PRESET_SCENARIOS = [
  {
    tag: "Business",
    title: "Global Central Bank Rate Cuts",
    text: "Wall Street closed sharply higher following the Federal Reserve's dovish monetary policy statement. Benchmark Treasury yields plunged as investors priced in aggressive interest rate cuts across global credit markets, driving capital reallocation into emerging equity markets and boosting the FTSE 100."
  },
  {
    tag: "Technology",
    title: "Next-Gen Computing & Mobile Tech",
    text: "Sony, Microsoft and Apple unveiled their next-generation computing hardware, digital software platforms, and mobile technology gadgets. Industry analysts highlighted significant breakthroughs in high-speed broadband, wireless networks, and semiconductor microprocessor performance."
  },
  {
    tag: "Politics",
    title: "Parliament Budget & Tax Reforms",
    text: "Prime Minister Tony Blair and the Labour government faced fierce opposition in Parliament during the House of Commons debate over proposed legislation, public spending reforms, and national election strategy."
  },
  {
    tag: "Sport",
    title: "Champions League Extra-Time Drama",
    text: "Manchester City secured the Champions League trophy after an exhilarating tactical showdown, netting three goals in extra time to outpace Real Madrid before 75,000 spectators at Wembley Stadium. The manager praised the striker's finishing."
  },
  {
    tag: "Entertainment",
    title: "Academy Awards Best Actress Victory",
    text: "Hollywood actress swept the awards season, winning the Oscar, BAFTA, and Golden Globe for her leading role in the acclaimed biographical drama released earlier this year before international box office records."
  }
];

function AppLogo() {
  return (
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      background: 'linear-gradient(145deg, #0E1626, #060912)',
      border: '1px solid rgba(0, 229, 255, 0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 0 25px rgba(0, 229, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
      flexShrink: 0
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2.5L20 7.2V16.8L12 21.5L4 16.8V7.2L12 2.5Z" stroke="#00E5FF" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(0, 229, 255, 0.08)" />
        <path d="M12 21.5V12" stroke="#00E5FF" strokeWidth="1.3" opacity="0.75" />
        <path d="M20 7.2L12 12L4 7.2" stroke="#00E5FF" strokeWidth="1.3" opacity="0.75" />
        <circle cx="12" cy="12" r="2" fill="#00FF88" />
      </svg>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('classifier');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  const handleClassify = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Classification failed');
      }

      const data = await response.json();
      setResult(data);

      // Trigger celebratory confetti effect for ALL categories with matching colors
      const confettiColors = {
        business: ['#00E5FF', '#38BDF8', '#0EA5E9', '#FFFFFF'],
        entertainment: ['#FF007F', '#EC4899', '#F43F5E', '#FFFFFF'],
        politics: ['#A855F7', '#C084FC', '#9333EA', '#FFFFFF'],
        sport: ['#00FF88', '#10B981', '#34D399', '#FFFFFF'],
        tech: ['#FF9100', '#F59E0B', '#FBBF24', '#FFFFFF'],
      };

      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.65 },
        colors: confettiColors[data.category] || ['#00E5FF', '#00FF88', '#BD00FF']
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const report = `BBC News Classification\n` +
      `Category: ${result.meta.title}\n` +
      `Confidence: ${result.confidence}%\n` +
      `Latency: ${result.latency_ms} ms\n` +
      `Word Count: ${result.metrics.word_count}\n` +
      `Key Words: ${result.keywords.map(k => k.word).join(', ')}`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const IconComponent = result ? SECTOR_ICONS[result.category] || Activity : Activity;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Navigation ───────────────────────────────────────── */}
      <header className="app-header" style={{
        background: 'rgba(8, 12, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AppLogo />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25em', fontWeight: 800, letterSpacing: '-0.3px', color: '#FFF' }}>
                  BBC News Classifier
                </span>
              </div>
              <p style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>
                Multi-Class Text Classification System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="nav-tabs-container" style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              onClick={() => setActiveTab('classifier')}
              style={{
                background: activeTab === 'classifier' ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                color: activeTab === 'classifier' ? '#00E5FF' : 'var(--text-muted)',
                border: activeTab === 'classifier' ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '6px 16px',
                fontSize: '0.85em',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <FileText size={15} />
              Classifier
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                background: activeTab === 'analytics' ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                color: activeTab === 'analytics' ? '#00E5FF' : 'var(--text-muted)',
                border: activeTab === 'analytics' ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '6px 16px',
                fontSize: '0.85em',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <BarChart3 size={15} />
              Dataset & Visuals
            </button>
          </div>

          <div className="header-metrics-badge" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 255, 136, 0.08)',
              border: '1px solid rgba(0, 255, 136, 0.25)',
              padding: '6px 14px',
              borderRadius: '30px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF88', display: 'inline-block' }} className="animate-pulse-glow"></span>
              <span className="mono" style={{ fontSize: '0.75em', color: '#00FF88', fontWeight: 600 }}>
                ONLINE
              </span>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '6px 14px',
              borderRadius: '30px',
              fontSize: '0.75em',
              color: 'var(--text-muted)'
            }} className="mono">
              F1 SCORE <strong style={{ color: '#FFF' }}>99.05%</strong>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content Dashboard ─────────────────────────────── */}
      <main className="app-main" style={{ flex: 1 }}>
        {activeTab === 'classifier' ? (
          <div className="dashboard-grid">
          
          {/* ── LEFT COLUMN: Text Input & Presets ───────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, width: '100%', maxWidth: '100%' }}>
            
            {/* Input Card */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#00E5FF" />
                  <span style={{ fontWeight: 700, fontSize: '0.95em', letterSpacing: '0.5px' }}>
                    ARTICLE TEXT
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '0.75em', color: 'var(--text-dim)' }}>
                  {wordCount} words • {charCount} characters
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste news headline and body here...&#10;&#10;e.g. Wall Street surged following Federal Reserve interest rate announcements..."
                style={{
                  width: '100%',
                  height: '210px',
                  padding: '16px',
                  fontSize: '0.95em',
                  lineHeight: '1.6',
                  marginBottom: '18px'
                }}
              />

              <div className="classifier-actions">
                <button
                  onClick={handleClassify}
                  disabled={loading || !inputText.trim()}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #00E5FF 0%, #0070F3 100%)',
                    color: '#05070B',
                    fontWeight: 800,
                    fontSize: '0.95em',
                    letterSpacing: '0.3px',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 22px',
                    cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
                    opacity: loading || !inputText.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 24px rgba(0, 229, 255, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      CLASSIFYING...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      CLASSIFY ARTICLE
                    </>
                  )}
                </button>

                <button
                  onClick={() => { setInputText(''); setResult(null); setError(null); }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-muted)',
                    borderRadius: '12px',
                    padding: '0 20px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  Clear
                </button>
              </div>

              {error && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: '#F87171',
                  fontSize: '0.85em'
                }}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Presets */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Sparkles size={16} color="#BD00FF" />
                <span style={{ fontWeight: 700, fontSize: '0.88em', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                  SAMPLE ARTICLES (CLICK TO TEST)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', minWidth: 0 }}>
                {PRESET_SCENARIOS.map((sc, i) => (
                  <div
                    key={i}
                    onClick={() => { setInputText(sc.text); setResult(null); }}
                    className="preset-card-item"
                  >
                    <div className="preset-card-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="mono" style={{ fontSize: '0.68em', fontWeight: 700, color: TAG_COLORS[sc.tag] || '#00E5FF', background: `${TAG_COLORS[sc.tag] || '#00E5FF'}18`, border: `1px solid ${TAG_COLORS[sc.tag] || '#00E5FF'}33`, padding: '2px 7px', borderRadius: '4px' }}>
                          {sc.tag}
                        </span>
                        <span style={{ fontSize: '0.88em', fontWeight: 600, color: '#FFF' }}>
                          {sc.title}
                        </span>
                      </div>
                      <p className="preset-card-desc">
                        {sc.text}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.8em', color: '#00E5FF', flexShrink: 0 }}>→</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: Classification Results ────────────── */}
          <div style={{ minWidth: 0, width: '100%', maxWidth: '100%' }}>
            {!result ? (
              <div className="glass-card" style={{
                height: '100%',
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center',
                borderStyle: 'dashed',
                minWidth: 0
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px'
                }}>
                  <BarChart3 size={28} color="#6B7280" />
                </div>
                <h3 className="mono" style={{ fontSize: '1.05em', color: '#9CA3AF', marginBottom: '8px', letterSpacing: '1px' }}>
                  AWAITING ARTICLE
                </h3>
                <p style={{ fontSize: '0.85em', color: '#6B7280', maxWidth: '340px' }}>
                  Enter an article on the left or select an example above to view category predictions and analysis.
                </p>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, width: '100%' }}>
                
                {/* 1. Category Result Card */}
                <div className="glass-card" style={{
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  borderColor: result.meta.color,
                  boxShadow: `0 14px 40px ${result.meta.color}25`
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '180px',
                    height: '180px',
                    background: `radial-gradient(circle, ${result.meta.color}40 0%, transparent 70%)`,
                    pointerEvents: 'none'
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: result.meta.color, flexShrink: 0 }} className="animate-pulse-glow"></span>
                      <span className="mono" style={{ fontSize: '0.78em', fontWeight: 700, color: result.meta.color, letterSpacing: '1px' }}>
                        PREDICTED CATEGORY
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="mono" style={{ background: 'rgba(0,0,0,0.4)', padding: '3px 10px', borderRadius: '15px', fontSize: '0.75em', color: '#00FF88' }}>
                        {result.latency_ms} ms
                      </span>
                      <button
                        onClick={handleCopyReport}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px',
                          color: '#FFF',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.75em'
                        }}
                      >
                        {copied ? <Check size={14} color="#00FF88" /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="hero-verdict-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', minWidth: 0, width: '100%' }}>
                    <div className="hero-verdict-icon" style={{
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${result.meta.color}33, ${result.meta.color}11)`,
                      border: `1px solid ${result.meta.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 25px ${result.meta.color}35`,
                      flexShrink: 0
                    }}>
                      <IconComponent size={30} color={result.meta.color} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <h2 className="hero-verdict-title" style={{ wordBreak: 'break-word' }}>
                        {result.meta.title}
                      </h2>
                      <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-word' }}>
                        {result.meta.description}
                      </p>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="mono" style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>CONFIDENCE</span>
                      <span className="mono" style={{ fontSize: '1em', fontWeight: 800, color: result.meta.color }}>
                        {result.confidence}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${result.confidence}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${result.meta.color}88, ${result.meta.color})`,
                        borderRadius: '10px',
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                      }} />
                    </div>
                  </div>
                </div>

                {/* 2. Category Probabilities */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Layers size={16} color="#00E5FF" />
                    <span style={{ fontWeight: 700, fontSize: '0.88em', letterSpacing: '0.5px' }}>
                      CATEGORY PROBABILITIES
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(result.probabilities).map(([cat, prob]) => {
                      const isTop = cat === result.category;
                      const CatIcon = SECTOR_ICONS[cat] || Activity;
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CatIcon size={14} color={isTop ? result.meta.color : '#6B7280'} />
                              <span style={{ fontSize: '0.85em', fontWeight: isTop ? 700 : 500, color: isTop ? '#FFF' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                                {cat}
                              </span>
                            </div>
                            <span className="mono" style={{ fontSize: '0.82em', fontWeight: isTop ? 700 : 400, color: isTop ? result.meta.color : '#9CA3AF' }}>
                              {prob}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${prob}%`,
                              height: '100%',
                              background: isTop ? result.meta.color : 'rgba(255,255,255,0.25)',
                              borderRadius: '6px',
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Key Influential Words */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <ShieldCheck size={16} color="#00FF88" />
                    <span style={{ fontWeight: 700, fontSize: '0.88em', letterSpacing: '0.5px' }}>
                      KEY INFLUENTIAL WORDS
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78em', color: 'var(--text-dim)', marginBottom: '14px' }}>
                    Words that contributed most to this classification decision:
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.keywords.map((kw, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${i < 3 ? result.meta.color + '55' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '8px',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontSize: '0.82em', fontWeight: 600, color: '#FFF' }}>
                          {kw.word}
                        </span>
                        <span className="mono" style={{ fontSize: '0.72em', color: result.meta.color, fontWeight: 700 }}>
                          +{kw.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Article Metrics */}
                <div className="telemetry-grid">
                  <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.65em', color: 'var(--text-dim)' }} className="mono">LEXICAL DIVERSITY</span>
                    <strong style={{ fontSize: '1.1em', color: '#FFF' }} className="mono">{result.metrics.lexical_diversity}%</strong>
                  </div>
                  <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.65em', color: 'var(--text-dim)' }} className="mono">TOKENS</span>
                    <strong style={{ fontSize: '1.1em', color: '#FFF' }} className="mono">{result.metrics.token_count}</strong>
                  </div>
                  <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.65em', color: 'var(--text-dim)' }} className="mono">UNIQUE WORDS</span>
                    <strong style={{ fontSize: '1.1em', color: '#FFF' }} className="mono">{result.metrics.unique_tokens}</strong>
                  </div>
                  <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.65em', color: 'var(--text-dim)' }} className="mono">MODEL F1</span>
                    <strong style={{ fontSize: '1.1em', color: '#00FF88' }} className="mono">99.05%</strong>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
        ) : (
          <DatasetAnalytics />
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '20px 28px',
        textAlign: 'center',
        color: '#4B5563',
        fontSize: '0.8em'
      }} className="mono">
        BBC News Classification • Linear SVM + TF-IDF
      </footer>
    </div>
  );
}
