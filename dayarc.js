/* ============================================================
   DAYFLOW — "Day Arc" signature widget
   A live semicircular timeline of the workday: 6:00 -> 22:00,
   with a moving marker for the current time and colored segments
   for work / break / off blocks. Embodies "every workday,
   perfectly aligned."
   ============================================================ */

function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg - 180) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}
// map a time-of-day (hours, 0-24) within [rangeStart, rangeEnd] to 0-180deg
function timeToDeg(hours, rangeStart, rangeEnd) {
  const clamped = Math.max(rangeStart, Math.min(rangeEnd, hours));
  return ((clamped - rangeStart) / (rangeEnd - rangeStart)) * 180;
}

function renderDayArc(container, opts = {}) {
  const RANGE_START = 6, RANGE_END = 22; // 6am - 10pm
  const width = opts.width || 460;
  const height = opts.height || 190;
  const cx = width / 2, cy = height - 20, r = opts.radius || (width/2 - 30);

  const now = opts.now || new Date();
  const nowHours = now.getHours() + now.getMinutes()/60;

  const workStart = opts.workStart ?? 9.5;
  const breakStart = opts.breakStart ?? 13;
  const breakEnd = opts.breakEnd ?? 14;
  const workEnd = opts.workEnd ?? 18.5;

  const segs = [
    { from: RANGE_START, to: workStart, color: 'rgba(255,255,255,0.10)' },
    { from: workStart, to: breakStart, color: 'var(--indigo)' },
    { from: breakStart, to: breakEnd, color: 'var(--amber)' },
    { from: breakEnd, to: workEnd, color: 'var(--indigo)' },
    { from: workEnd, to: RANGE_END, color: 'rgba(255,255,255,0.10)' },
  ];

  const nowDeg = timeToDeg(nowHours, RANGE_START, RANGE_END);
  const marker = polar(cx, cy, r, nowDeg);

  let segPaths = segs.map(s => {
    const d = arcPath(cx, cy, r, timeToDeg(s.from, RANGE_START, RANGE_END), timeToDeg(s.to, RANGE_START, RANGE_END));
    return `<path d="${d}" stroke="${s.color}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  }).join('');

  // hour ticks
  let ticks = '';
  for (let h = RANGE_START; h <= RANGE_END; h += 4) {
    const p = polar(cx, cy, r + 20, timeToDeg(h, RANGE_START, RANGE_END));
    const label = h === 12 ? '12pm' : h > 12 ? (h-12)+'pm' : h+'am';
    ticks += `<text x="${p.x}" y="${p.y}" fill="var(--text-on-ink-dim)" font-size="10" font-family="JetBrains Mono, monospace" text-anchor="middle">${label}</text>`;
  }

  const progressDeg = timeToDeg(nowHours, RANGE_START, RANGE_END);
  const progressPath = arcPath(cx, cy, r, 0, progressDeg);

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="overflow:visible;">
      <path d="${arcPath(cx, cy, r, 0, 180)}" stroke="rgba(255,255,255,0.06)" stroke-width="10" fill="none" stroke-linecap="round"/>
      ${segPaths}
      ${ticks}
      <circle cx="${marker.x}" cy="${marker.y}" r="9" fill="var(--amber)" class="dayarc-pulse">
        <animate attributeName="r" values="7;10;7" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${marker.x}" cy="${marker.y}" r="15" fill="var(--amber)" opacity="0.25">
        <animate attributeName="r" values="13;20;13" dur="2.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.35;0;0.35" dur="2.2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;
}

function timeNowLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
