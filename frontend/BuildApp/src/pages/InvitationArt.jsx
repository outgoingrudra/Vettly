import React, { useEffect, useRef } from 'react';

// Cross sections of a twisted band, painted back to front like an engraved print.
function makePleats() {
  const strips = [];
  function point(t, edge) {
    const radius = 1 + edge * Math.cos(1.5 * t);
    const x = radius * Math.cos(t);
    const y = radius * Math.sin(t);
    const z = edge * Math.sin(1.5 * t);
    return [180 + 109 * x, 149 + 106 * (0.79 * y - 0.94 * z), 0.72 * y + 0.65 * z];
  }
  for (let i = 0; i < 240; i++) {
    const t = i * Math.PI / 120;
    const next = (i + 1) * Math.PI / 120;
    const corners = [point(t,-0.46), point(next,-0.46), point(next,0.46), point(t,0.46)];
    const xy = p => p.slice(0,2).map(v => v.toFixed(2)).join(',');
    strips.push({ depth: point(t,0)[2], points: corners.map(xy).join(' '),
      line: 'M' + xy(corners[0]) + 'L' + xy(corners[3]),
      light: 28 + 25 * Math.cos(t*1.5-0.6) + 10 * Math.sin(t) });
  }
  return strips.sort((a,b) => a.depth-b.depth);
}
const pleats = makePleats();

export default function InvitationArt({ interactive = false }) {
  const stage = useRef(null);
  useEffect(() => {
    if (!interactive) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let generation = 0;
    let dispose;
    async function sync() {
      const current = ++generation;
      dispose?.();
      dispose = undefined;
      if (motion.matches) return;
      try {
        const { mountRibbon } = await import('./ribbonScene');
        if (current === generation && stage.current) dispose = mountRibbon(stage.current);
      } catch {
        // The engraved illustration remains available if WebGL cannot start.
      }
    }
    sync();
    motion.addEventListener('change',sync);
    return () => { generation++; motion.removeEventListener('change',sync); dispose?.(); };
  }, [interactive]);
  return <figure className="invitation-print">
    <div className="print-heading"><strong>Vettly</strong><span>Interview invitation</span></div>
    <div className="ribbon-stage" ref={stage} aria-hidden="true">
    <svg viewBox="0 0 360 300" className="pleated-band" aria-hidden="true">
      {pleats.map(({points,line,light},i) => <g key={i}>
        <polygon points={points} fill={'hsl(var(--band-hue) 36% '+(light+12)+'%)'}/>
        <path d={line} fill="none" stroke={'hsl(var(--band-hue) 63% '+(light+35)+'%)'} strokeWidth=".95"/>
      </g>)}
    </svg>
    </div>
    <figcaption><div><small>Sample assessment</small><strong>Design systems</strong></div><span>30 min</span></figcaption>
  </figure>;
}
