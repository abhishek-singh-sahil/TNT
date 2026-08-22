import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Header from './Header';
import Footer from './Footer';
import LiveChat from '../common/LiveChat';

import { useSelector } from 'react-redux';
import { selectSettings } from '../../store/settingsSlice';
import { useRBAC } from '../../hooks/useRBAC';

export default function Layout() {
  const settings = useSelector(selectSettings);
  const { isStaff } = useRBAC();

  if (settings?.maintenanceMode && !isStaff) {
    return (
      <div className="min-h-screen bg-stone flex flex-col items-center justify-center p-6 relative overflow-hidden select-none font-sans">
        {/* Style block for animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shovel {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-18deg) translateY(-4px); }
          }
          @keyframes dump {
            0%, 100% { transform: rotate(0deg); }
            45%, 65% { transform: rotate(-22deg); }
          }
          @keyframes hoist {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(16px); }
          }
          @keyframes rock {
            0%, 100% { transform: rotate(0deg) translateY(0); }
            50% { transform: rotate(1deg) translateY(-2px); }
          }
          .animate-shovel { animation: shovel 4s ease-in-out infinite; }
          .animate-dump { animation: dump 5s ease-in-out infinite; }
          .animate-hoist { animation: hoist 3.5s ease-in-out infinite; }
          .animate-rock { animation: rock 3s ease-in-out infinite; }
        `}} />

        {/* Warning Stripe Header */}
        <div className="absolute top-0 left-0 w-full h-3 bg-stripes bg-amber-400 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[length:24px_24px] z-55" />

        {/* Outer Box */}
        <div className="max-w-2xl w-full bg-paper border border-line rounded-3xl p-8 md:p-12 shadow-2xl space-y-8 relative z-10 flex flex-col items-center animate-rock">
          
          {/* Logo Bar */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="h-10 md:h-12 object-contain" />
            ) : (
              <span className="text-3xl font-black tracking-tighter text-ink">TNT</span>
            )}
            <span className="text-[9px] font-black uppercase bg-ink text-paper px-2.5 py-0.5 rounded tracking-widest mt-1">
              ENTERPRISE
            </span>
          </div>

          {/* Construction Scene (SVGs) */}
          <div className="w-full max-w-lg h-44 bg-stone/30 border border-line rounded-2xl relative overflow-hidden flex items-end justify-center p-4 gap-8">
            {/* Background clouds */}
            <div className="absolute top-4 left-6 w-12 h-4 bg-paper/40 rounded-full blur-xs animate-pulse duration-[4000ms]" />
            <div className="absolute top-8 right-12 w-16 h-5 bg-paper/40 rounded-full blur-xs animate-pulse duration-[6000ms]" />

            {/* Ground grid line */}
            <div className="absolute bottom-4 left-0 w-full h-[1px] bg-line" />

            {/* 1. CRANE (Left Side) */}
            <div className="relative w-24 h-36 flex items-end justify-center">
              <svg viewBox="0 0 100 150" className="w-full h-full text-ink" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Mast (Tower) */}
                <line x1="50" y1="140" x2="50" y2="30" />
                <line x1="40" y1="140" x2="50" y2="120" />
                <line x1="60" y1="140" x2="50" y2="120" />
                <line x1="50" y1="100" x2="40" y2="120" />
                <line x1="50" y1="100" x2="60" y2="120" />
                <line x1="50" y1="100" x2="40" y2="80" />
                <line x1="50" y1="100" x2="60" y2="80" />
                <line x1="50" y1="60" x2="40" y2="80" />
                <line x1="50" y1="60" x2="60" y2="80" />
                <line x1="50" y1="60" x2="40" y2="40" />
                <line x1="50" y1="60" x2="60" y2="40" />
                <line x1="50" y1="30" x2="40" y2="40" />
                <line x1="50" y1="30" x2="60" y2="40" />

                {/* Counterweight & Cab */}
                <rect x="42" y="20" width="16" height="12" rx="2" fill="currentColor" className="text-stone" />
                
                {/* Horizontal Jib */}
                <line x1="10" y1="26" x2="90" y2="26" />
                <line x1="10" y1="26" x2="50" y2="10" />
                <line x1="90" y1="26" x2="50" y2="10" />

                {/* Pulley Trolley & Wire Hook (Animated) */}
                <g className="animate-hoist">
                  <line x1="75" y1="26" x2="75" y2="70" strokeDasharray="3,3" />
                  {/* Hook */}
                  <path d="M72,70 Q75,75 78,70 Q75,67 72,70" fill="currentColor" />
                  {/* Dangling construction sign */}
                  <rect x="65" y="75" width="20" height="15" rx="2" fill="#fbbf24" stroke="none" />
                  <line x1="70" y1="80" x2="80" y2="85" stroke="#000" strokeWidth="2" />
                  <line x1="70" y1="85" x2="80" y2="80" stroke="#000" strokeWidth="2" />
                </g>
              </svg>
            </div>

            {/* 2. HIVA / DUMPER TRUCK (Middle-Right) */}
            <div className="relative w-28 h-20 flex items-end">
              <svg viewBox="0 0 140 100" className="w-full h-full text-ink" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {/* Chassis / Wheels base */}
                <line x1="10" y1="80" x2="130" y2="80" />
                
                {/* Cab (Front) */}
                <path d="M95,80 L130,80 L130,55 L115,55 L105,35 L95,35 Z" fill="currentColor" className="text-stone" />
                <rect x="105" y="42" width="16" height="10" rx="1" fill="#fff" stroke="currentColor" strokeWidth="2" />
                <circle cx="120" cy="65" r="4" fill="currentColor" />

                {/* Wheels */}
                <circle cx="35" cy="80" r="11" fill="#1c1917" stroke="currentColor" strokeWidth="2" />
                <circle cx="35" cy="80" r="4" fill="#fff" />
                <circle cx="65" cy="80" r="11" fill="#1c1917" stroke="currentColor" strokeWidth="2" />
                <circle cx="65" cy="80" r="4" fill="#fff" />
                <circle cx="115" cy="80" r="11" fill="#1c1917" stroke="currentColor" strokeWidth="2" />
                <circle cx="115" cy="80" r="4" fill="#fff" />

                {/* Dumper Bed / Container (Animated tilting) */}
                <g className="animate-dump origin-[80px_70px]">
                  {/* Container bed */}
                  <path d="M15,70 L85,70 L90,30 L10,30 Z" fill="#fbbf24" />
                  {/* Bricks/Dirt inside */}
                  <rect x="25" y="18" width="15" height="12" rx="1" fill="currentColor" className="text-amber-700" stroke="none" />
                  <rect x="42" y="22" width="15" height="10" rx="1" fill="currentColor" className="text-amber-800" stroke="none" />
                  <rect x="52" y="15" width="14" height="11" rx="1" fill="currentColor" className="text-amber-900" stroke="none" />
                </g>
              </svg>
            </div>

            {/* 3. BULLDOZER (Right Side) */}
            <div className="relative w-28 h-20 flex items-end">
              <svg viewBox="0 0 140 100" className="w-full h-full text-ink" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {/* Bulldozer main body */}
                <path d="M30,75 L85,75 L85,50 L55,50 L45,32 L30,32 Z" fill="currentColor" className="text-stone" />
                
                {/* Cabin window */}
                <rect x="52" y="38" width="18" height="12" rx="1" fill="#fff" stroke="currentColor" strokeWidth="2" />
                
                {/* Exhaust Pipe */}
                <line x1="42" y1="32" x2="42" y2="18" strokeWidth="4" />
                <path d="M42,18 L46,15" />

                {/* Continuous Track / Wheels (Caterpillar) */}
                <rect x="25" y="70" width="65" height="16" rx="8" fill="#1c1917" />
                <circle cx="33" cy="78" r="5" fill="#fff" />
                <circle cx="57" cy="78" r="5" fill="#fff" />
                <circle cx="82" cy="78" r="5" fill="#fff" />

                {/* Shovel arm & Bucket (Animated) */}
                <g className="animate-shovel origin-[80px_60px]">
                  {/* Arm */}
                  <path d="M80,60 L110,65 L120,45" fill="none" stroke="#fbbf24" strokeWidth="5" />
                  {/* Bucket Shovel */}
                  <path d="M110,40 Q130,42 125,72 Q105,75 110,40" fill="#fbbf24" />
                  {/* Dirt pile under shovel */}
                  <path d="M125,70 Q135,72 130,80 L120,80 Z" fill="currentColor" className="text-amber-800" stroke="none" />
                </g>
              </svg>
            </div>
          </div>

          {/* Alert Message Cards */}
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-black uppercase tracking-tight text-ink flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              SYSTEM MAINTENANCE IN PROGRESS
            </h1>
            <p className="text-xs text-muted leading-relaxed font-semibold">
              {settings.maintenanceMessage || "We are currently conducting system upgrades to serve you better. We'll be back online shortly!"}
            </p>
          </div>

          {/* Footer badge */}
          <div className="flex flex-col items-center gap-2 pt-6 border-t border-line w-full">
            <div className="px-4 py-1.5 bg-stone border border-line rounded-full text-[10px] font-bold text-ink uppercase tracking-wider">
              ESTIMATED DURATION: ~30 MINS
            </div>
            <p className="text-[10px] text-muted font-bold">
              Need assistance? Email support: <a href={`mailto:${settings.siteEmail || 'support@tntclothing.com'}`} className="underline text-ink">{settings.siteEmail || 'support@tntclothing.com'}</a>
            </p>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <LiveChat />
    </div>
  );
}
