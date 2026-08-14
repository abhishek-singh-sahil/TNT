import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  ShoppingBag,
  Package,
  FolderTree,
  Sliders,
  Image,
  Users,
  Star,
  Tag,
  FileText,
  HelpCircle,
  Mail,
  ShieldCheck,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  AlertOctagon,
  BarChart2,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';

export default function AdminLayout() {
  const location = useLocation();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isAdminUser = user && (user.role?.name === 'ADMIN' || user.role?.name === 'SUPER_ADMIN');

  if (!isAdminUser) {
    return (
      <div className="bg-paper min-h-screen flex items-center justify-center p-6 text-center">
        <div className="bg-stone border border-line rounded-xl p-8 max-w-sm w-full space-y-4">
          <AlertOctagon className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-base font-extrabold uppercase text-ink tracking-wider">Access Denied</h2>
          <p className="text-xs text-muted leading-relaxed font-semibold">You do not have permissions to access the enterprise administration panel.</p>
          <div className="pt-2 space-y-2">
            <Link
              to="/login"
              onClick={() => dispatch(logout())}
              className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded block hover:bg-ink/90 transition-colors"
            >
              SIGN IN AS ADMIN
            </Link>
            <Link
              to="/"
              className="w-full py-3 border border-line text-ink text-xs font-bold uppercase tracking-wider rounded block hover:bg-stone transition-colors"
            >
              BACK TO HOME
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allNavItems = [
    { label: 'Overview Dashboard', path: '/admin', icon: LayoutGrid },
    { label: 'Homepage CMS', path: '/admin/cms', icon: Sliders },
    { label: 'Product Catalog', path: '/admin/products', icon: Package },
    { label: 'Categories & Collections', path: '/admin/categories', icon: FolderTree },
    { label: 'Order Management', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Customer Management', path: '/admin/customers', icon: Users },
    { label: 'Reviews & Ratings', path: '/admin/reviews', icon: Star },
    { label: 'Coupons & Marketing', path: '/admin/coupons', icon: Tag },
    { label: 'Media Library', path: '/admin/media', icon: Image },
    { label: 'Blogs & Editorials', path: '/admin/blogs', icon: FileText },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart2 },
    { label: 'Staff Management', path: '/admin/staff', icon: Users, superOnly: true },
    { label: 'Role & Permissions', path: '/admin/roles', icon: ShieldCheck, superOnly: true },
    { label: 'System Settings', path: '/admin/settings', icon: Settings, superOnly: true },
  ];

  const navItems = allNavItems.filter(item => {
    if (item.superOnly) {
      return user?.role?.name === 'SUPER_ADMIN' || user?.role?.name === 'ADMIN';
    }
    return true;
  });

  return (
    <div className="min-h-screen flex bg-stone text-ink">
      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-paper border-r border-line flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Bar */}
          <div className="h-16 px-6 border-b border-line flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-tighter text-ink">TNT</span>
              <span className="text-[10px] font-extrabold uppercase bg-ink text-paper px-2 py-0.5 rounded tracking-widest">
                ENTERPRISE
              </span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-3 mb-2">CMS & OPERATIONS</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-ink text-paper shadow-sm'
                      : 'text-ink hover:bg-stone'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-paper' : 'text-muted'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin User Card */}
        <div className="p-4 border-t border-line bg-stone/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-ink text-paper font-extrabold text-xs flex items-center justify-center">
              {user?.firstName?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div>
              <div className="text-xs font-bold text-ink">{user?.firstName} {user?.lastName || ''}</div>
              <div className="text-[10px] text-muted">{user?.email}</div>
            </div>
          </div>
          <button onClick={() => dispatch(logout())} className="p-1 text-muted hover:text-red-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-paper border-b border-line px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-ink">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* View Live Store */}
            <Link
              to="/"
              className="text-xs font-bold text-ink hover:underline border border-line px-3.5 py-2 rounded-lg bg-stone/50 hover:bg-stone transition-colors uppercase tracking-wider hidden sm:block"
            >
              VIEW LIVE STORE ↗
            </Link>

            {/* Notification Bell */}
            <button className="p-2 border border-line rounded-lg text-ink hover:bg-stone relative transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-paper text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                3
              </span>
            </button>

            {/* Settings Gear Shortcut */}
            <Link to="/admin/settings" className="p-2 border border-line rounded-lg text-ink hover:bg-stone transition-colors">
              <Settings className="w-4 h-4" />
            </Link>

            {/* Admin Profile User Card */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-line">
              <div className="w-8 h-8 rounded-full bg-ink text-paper font-black text-xs flex items-center justify-center overflow-hidden border border-line shadow-inner">
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.firstName?.substring(0, 2).toUpperCase() || 'AD'}</span>
                )}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-ink">
                  {user?.firstName} {user?.lastName || ''}
                </div>
                <div className="text-[9px] font-extrabold text-muted uppercase tracking-wider">
                  {user?.role?.name === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin User'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="p-6 sm:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
