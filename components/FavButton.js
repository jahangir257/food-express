'use client';
import { Heart } from 'lucide-react';
import { useApp } from './Providers';
// Heart toggle. Favourites are stored in the database (per user), never in localStorage.
export default function FavButton({ id, className = '', label = false }) {
  const { favs, toggleFav } = useApp(), on = favs.includes(String(id));
  return (<button type="button" className={'fav ' + (on ? 'on ' : '') + className} aria-pressed={on} aria-label={on ? 'Remove from favourites' : 'Add to favourites'}
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(String(id)); }}><Heart size={18} fill={on ? 'currentColor' : 'none'} />{label && <span>{on ? 'Saved' : 'Save'}</span>}</button>);
}
