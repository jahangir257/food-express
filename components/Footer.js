'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Heart, UtensilsCrossed } from 'lucide-react';
export default function Footer() {
  const p = usePathname();
  if (['/admin', '/partner', '/rider'].some((x) => p.startsWith(x))) return null;
  return (<footer className="ftr"><div className="container ftr-grid">
    <div><div className="logo"><UtensilsCrossed size={24} /> foodie<b>express</b></div><p>Hot, fresh food from the best restaurants near you — delivered fast.</p>
      <div className="soc"><a href="#" aria-label="Facebook"><Facebook size={18} /></a><a href="#" aria-label="Instagram"><Instagram size={18} /></a><a href="#" aria-label="Twitter"><Twitter size={18} /></a></div></div>
    <div><h5>Explore</h5><Link href="/">Home</Link><Link href="/offers">Offers</Link><Link href="/orders">My orders</Link><Link href="/cart">Cart</Link></div>
    <div><h5>Join us</h5><Link href="/register">Partner with us</Link><Link href="/register">Ride with us</Link><Link href="/login">Log in</Link></div>
    <div><h5>Contact</h5><span><Mail size={15} /> support@foodieexpress.in</span><span><Phone size={15} /> +91 98765 43210</span><span><MapPin size={15} /> Kolkata, India</span></div>
  </div><div className="container ftr-bot"><span>© {new Date().getFullYear()} Foodie Express. All rights reserved.</span><span>Made with <Heart size={14} fill="currentColor" /> for food lovers</span></div></footer>);
}
