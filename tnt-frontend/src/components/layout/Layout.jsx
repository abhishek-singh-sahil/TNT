import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import Header from './Header'
import Footer from './Footer'
import LiveChat from '../common/LiveChat'

import { useSelector } from 'react-redux';
import { selectSettings } from '../../store/settingsSlice';
import { useRBAC } from '../../hooks/useRBAC';

export default function Layout() {
  const settings = useSelector(selectSettings);
  const { isStaff } = useRBAC();

  if (settings?.maintenanceMode && !isStaff) {
    return (
      <div className="min-h-screen bg-stone/20 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-paper border border-line rounded-2xl p-8 shadow-xl space-y-6">
          <div className="flex flex-col items-center gap-2">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="h-12 object-contain" />
            ) : (
              <span className="text-3xl font-black tracking-tighter text-ink">TNT</span>
            )}
            <span className="text-[10px] font-extrabold uppercase bg-ink text-paper px-2 py-0.5 rounded tracking-widest mt-1">
              ENTERPRISE
            </span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-lg font-black uppercase text-ink tracking-wide">Under Maintenance</h1>
            <p className="text-xs text-muted leading-relaxed font-semibold">
              {settings.maintenanceMessage || "We are currently conducting system upgrades. We will be back shortly!"}
            </p>
          </div>

          <div className="text-[10px] text-muted font-bold pt-4 border-t border-line">
            Contact Support: {settings.siteEmail || 'contact@tntclothing.com'}
          </div>
        </div>
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

