'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
export default function Slider({ className = '', children, deps = [] }) {
  const ref = useRef(), [can, setCan] = useState({ l: false, r: false });
  const upd = () => { const e = ref.current; if (!e) return; setCan({ l: e.scrollLeft > 4, r: e.scrollLeft + e.clientWidth < e.scrollWidth - 4 }); };
  useEffect(() => { upd(); const e = ref.current; if (!e) return; const ro = new ResizeObserver(upd); ro.observe(e); return () => ro.disconnect(); }, deps);
  const raf = useRef();
  const go = (d) => { // eased, smooth slide
    const e = ref.current; if (!e) return; cancelAnimationFrame(raf.current);
    const from = e.scrollLeft, max = e.scrollWidth - e.clientWidth, to = Math.max(0, Math.min(max, from + d * Math.max(240, e.clientWidth * 0.75)));
    const dur = 520, t0 = performance.now(), ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now) => { const t = Math.min(1, (now - t0) / dur); e.scrollLeft = from + (to - from) * ease(t); if (t < 1) raf.current = requestAnimationFrame(step); };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (<div className={'slr' + (can.l ? ' fl' : '') + (can.r ? ' fr' : '')}>
    <button type="button" className={'slr-b l' + (can.l ? '' : ' off')} tabIndex={can.l ? 0 : -1} aria-label="Previous" onClick={() => go(-1)}><ArrowLeft size={18} /></button>
    <div className="slr-clip"><div ref={ref} className={'slr-in ' + className} onScroll={upd}>{children}</div></div>
    <button type="button" className={'slr-b r' + (can.r ? '' : ' off')} tabIndex={can.r ? 0 : -1} aria-label="Next" onClick={() => go(1)}><ArrowRight size={18} /></button>
  </div>);
}
