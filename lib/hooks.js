import { useEffect, useRef } from 'react';
export function usePoll(fn, ms) { const r = useRef(fn); r.current = fn; useEffect(() => { r.current(); const t = setInterval(() => r.current(), ms); return () => clearInterval(t); }, [ms]); }
