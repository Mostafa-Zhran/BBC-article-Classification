import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function PlotlyChart({ data, layout, config, style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const defaultLayout = {
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Plus Jakarta Sans, sans-serif', color: '#9CA3AF' },
      margin: { l: 40, r: 20, t: 30, b: 40 },
      ...layout,
    };

    const defaultConfig = {
      responsive: true,
      displayModeBar: false,
      ...config,
    };

    // Render Plotly chart
    Plotly.react(containerRef.current, data, defaultLayout, defaultConfig);

    // Initial resize after DOM paint
    const timer = setTimeout(() => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    }, 60);

    // ResizeObserver watches container dimensions directly (fixes tab switches, card resizing, animations)
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (containerRef.current) {
          Plotly.Plots.resize(containerRef.current);
        }
      });
      ro.observe(containerRef.current);
    }

    const handleWindowResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, layout, config]);

  return (
    <div 
      style={{ 
        width: '100%', 
        maxWidth: '100%', 
        overflow: 'hidden', 
        position: 'relative',
        minHeight: '280px', 
        ...style 
      }}
    >
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          maxWidth: '100%',
          overflow: 'hidden'
        }} 
      />
    </div>
  );
}
