'use client';
import { Children, Fragment, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
// Drop-in replacement for <select>: same props (value, onChange(e), <option> children, required, disabled, className, style)
const text = (n) => (n == null || typeof n === 'boolean' ? '' : Array.isArray(n) ? n.map(text).join('') : typeof n === 'object' ? text(n.props?.children) : String(n));
function parse(children, out = []) {
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return;
    if (c.type === Fragment || c.type === 'optgroup') return parse(c.props.children, out);
    if (c.type === 'option') out.push({ value: String(c.props.value ?? text(c.props.children)), label: text(c.props.children), disabled: !!c.props.disabled });
  });
  return out;
}
export default function Select({ value, onChange, children, className = '', style, disabled, required, name, placeholder = 'Select…', size, id, 'aria-label': aria }) {
  const opts = useMemo(() => parse(children), [children]);
  const [open, setOpen] = useState(false), [pos, setPos] = useState(null), [hi, setHi] = useState(-1);
  const btn = useRef(), menu = useRef();
  const cur = opts.find((o) => o.value === String(value ?? ''));
  const place = useCallback(() => {
    const r = btn.current?.getBoundingClientRect(); if (!r) return;
    const maxH = 260, below = window.innerHeight - r.bottom - 12, up = below < Math.min(maxH, opts.length * 40 + 12) && r.top > below;
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 180) - 8)), width: Math.max(r.width, 180), top: up ? undefined : r.bottom + 6, bottom: up ? window.innerHeight - r.top + 6 : undefined, maxH: Math.max(140, Math.min(maxH, (up ? r.top : below) - 8)) });
  }, [opts.length]);
  const close = () => setOpen(false);
  useEffect(() => {
    if (!open) return;
    place(); setHi(Math.max(0, opts.findIndex((o) => o.value === String(value ?? ''))));
    const down = (e) => { if (!btn.current?.contains(e.target) && !menu.current?.contains(e.target)) close(); };
    const sc = (e) => { if (!menu.current?.contains(e.target)) close(); };
    document.addEventListener('mousedown', down); window.addEventListener('scroll', sc, true); window.addEventListener('resize', close);
    return () => { document.removeEventListener('mousedown', down); window.removeEventListener('scroll', sc, true); window.removeEventListener('resize', close); };
  }, [open]);
  useEffect(() => { if (open && menu.current && hi >= 0) menu.current.children[hi]?.scrollIntoView({ block: 'nearest' }); }, [hi, open, pos]);
  const pick = (o) => { if (o.disabled) return; close(); btn.current?.focus(); if (o.value !== String(value ?? '')) onChange?.({ target: { value: o.value, name } , currentTarget: { value: o.value, name } }); };
  const key = (e) => {
    if (disabled) return;
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); return setOpen(true); }
    if (!open) return;
    if (e.key === 'Escape' || e.key === 'Tab') close();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(opts.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts[hi] && pick(opts[hi]); }
  };
  return (<div className={'sel ' + (size === 'sm' ? 'sm ' : '') + (open ? 'open ' : '') + className} style={style}>
    <button type="button" id={id} ref={btn} className="sel-btn" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-label={aria} onClick={() => setOpen((o) => !o)} onKeyDown={key}>
      <span className={'sel-v' + (cur && cur.value !== '' ? '' : ' ph')}>{cur ? cur.label || placeholder : placeholder}</span><ChevronDown size={16} className="sel-c" /></button>
    {required && <input className="sel-req" tabIndex={-1} required value={value ?? ''} onChange={() => {}} aria-hidden="true" />}
    {open && pos && typeof document !== 'undefined' && createPortal(<div ref={menu} role="listbox" className="sel-menu" style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH }}>
      {opts.map((o, i) => <div key={o.value + i} role="option" aria-selected={o.value === String(value ?? '')} className={'sel-o' + (o.value === String(value ?? '') ? ' on' : '') + (i === hi ? ' hi' : '') + (o.disabled ? ' dis' : '')} onMouseEnter={() => setHi(i)} onClick={() => pick(o)}><span className="grow">{o.label || '—'}</span>{o.value === String(value ?? '') && <Check size={15} />}</div>)}
      {!opts.length && <div className="sel-o dis">No options</div>}</div>, document.body)}
  </div>);
}
