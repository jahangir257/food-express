import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
export const metadata = { title: 'Foodie Express — Order food online', description: 'Order food from restaurants near you' };
export const viewport = { width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }) {
  return (<html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech&display=swap" rel="stylesheet" /></head>
    <body><Providers><div className="shell"><Header /><main className="main">{children}</main><Footer /></div></Providers></body></html>);
}
