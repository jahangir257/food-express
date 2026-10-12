'use client';
import { UtensilsCrossed } from 'lucide-react';
export default function Loader({ inline = false }) {
  return (<div className={'fxl' + (inline ? ' inline' : '')} role="status" aria-label="Loading">
    <div className="fxl-ring"><span className="fxl-ico"><UtensilsCrossed size={inline ? 24 : 32} /></span></div>
    <div className="fxl-logo">foodie<b>express</b></div>
    <div className="fxl-dots"><i /><i /><i /></div>
  </div>);
}
