import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
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
  ShieldCheck,
  Settings,
  Bell,
  LogOut,
  AlertOctagon,
  BarChart2,
  Menu,
  X,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { useRBAC } from '../../hooks/useRBAC';
import { selectSettings } from '../../store/settingsSlice';
import { adminApi } from '../../api/services';

export default function AdminLayout() {
  const location = useLocation();
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [accessDeniedMessage, setAccessDeniedMessage] = useState(null);

  const {
    user,
    currentRole,
    isStaff,
    hasPermission
  } = useRBAC();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await adminApi.getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (isStaff) {
      fetchNotifications();
      const timer = setInterval(fetchNotifications, 30000);
      return () => clearInterval(timer);
    }
  }, [isStaff]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleAccessDenied = (e) => {
      setAccessDeniedMessage(e.detail.message || 'You do not have permission to perform this action.');
    };
    window.addEventListener('tnt-access-denied', handleAccessDenied);
    return () => window.removeEventListener('tnt-access-denied', handleAccessDenied);
  }, []);

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

  // Deny access if not a staff member
  if (!isStaff) {
    return (
      <div className="bg-paper min-h-screen flex items-center justify-center p-6 text-center">
        <div className="bg-stone border border-line rounded-xl p-8 max-w-sm w-full space-y-4">
          <AlertOctagon className="w-12 h-12 text-red-600 mx-auto animate-bounce" />
          <h2 className="text-base font-extrabold text-ink tracking-wider font-black">Access Denied</h2>
          <p className="text-xs text-muted leading-relaxed font-semibold">You do not have permissions to access the enterprise administration panel.</p>
          <div className="pt-2 space-y-2">
            <Link
              to="/login"
              onClick={() => dispatch(logout())}
              className="w-full py-3 bg-ink text-paper text-xs font-bold tracking-wider rounded block hover:bg-ink/90 transition-colors"
            >
              Sign In as Staff
            </Link>
            <Link
              to="/"
              className="w-full py-3 border border-line text-ink text-xs font-bold tracking-wider rounded block hover:bg-stone transition-colors"
            >
              Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Configuration for all staff modules, linked to database permissions
  const allNavItems = [
    { label: 'Overview Dashboard', path: '/admin', icon: LayoutGrid, permission: 'view_dashboard' },
    { label: 'Homepage CMS', path: '/admin/cms', icon: Sliders, permission: 'edit_homepage' },
    { label: 'Product Catalog', path: '/admin/products', icon: Package, permission: 'view_products' },
    { label: 'Categories & Collections', path: '/admin/categories', icon: FolderTree, permission: 'view_categories' },
    { label: 'Order Management', path: '/admin/orders', icon: ShoppingBag, permission: 'view_orders' },
    { label: 'Customer Management', path: '/admin/customers', icon: Users, permission: 'view_customers' },
    { label: 'Reviews & Ratings', path: '/admin/reviews', icon: Star, permission: 'view_reviews' },
    { label: 'Coupons & Marketing', path: '/admin/coupons', icon: Tag, permission: 'view_coupons' },
    { label: 'Media Library', path: '/admin/media', icon: Image, permission: 'view_media' },
    { label: 'Blogs & Editorials', path: '/admin/blogs', icon: FileText, permission: 'edit_homepage' },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart2, permission: 'view_reports' },
    { label: 'Staff Management', path: '/admin/staff', icon: Users, permission: 'view_staff' },
    { label: 'Role & Permissions', path: '/admin/roles', icon: ShieldCheck, permission: 'view_roles' },
    { label: 'System Settings', path: '/admin/settings', icon: Settings, permission: 'view_settings' },
  ];

  // Dynamically filter sidebar items based on permission
  const navItems = allNavItems.filter(item => hasPermission(item.permission));

  // Determine current active page object to enforce direct URL access security
  const currentPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
  const currentNavItem = allNavItems.find(item => item.path === currentPath);

  // If visiting an admin route manually that the user has no permissions to access
  if (currentNavItem && !hasPermission(currentNavItem.permission)) {
    return (
      <div className="bg-stone min-h-screen flex items-center justify-center p-6 text-center">
        <div className="bg-paper border border-line rounded-xl p-8 max-w-md w-full space-y-4 shadow-sm">
          <AlertOctagon className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-base font-extrabold text-ink tracking-wider font-black">403 — Unauthorized Access</h2>
          <p className="text-xs text-muted leading-relaxed font-semibold">
            You do not have the required permission <span className="font-mono bg-stone px-1 py-0.5 rounded">"{currentNavItem.permission}"</span> to view this module.
          </p>
          <div className="pt-2">
            <Link
              to="/admin"
              className="w-full py-3 bg-ink text-paper text-xs font-bold tracking-wider rounded block hover:bg-ink/90 transition-colors shadow-xs"
            >
              Go to Permitted Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format role name for display (e.g. SUPER_ADMIN -> Super Admin)
  const roleDisplayName = currentRole?.name
    ? currentRole.name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    : 'Staff User';

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
              {settings?.logo ? (
                <img src={settings.logo} alt={settings.siteName || 'TNT'} className="h-7 object-contain" />
              ) : (
                <span className="text-2xl font-extrabold tracking-tighter text-ink">TNT</span>
              )}
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
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-3 mb-2">CMS & Operations</div>
            {navItems.length > 0 ? (
              navItems.map((item) => {
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
              })
            ) : (
              <div className="px-3 py-4 text-xs text-muted font-semibold leading-relaxed">
                No modules authorized. Contact your system admin to assign permissions.
              </div>
            )}
          </nav>
        </div>

        {/* Footer Admin User Card */}
        <div className="p-4 border-t border-line bg-stone/50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-ink text-paper font-extrabold text-xs flex items-center justify-center flex-shrink-0">
              {user?.firstName?.substring(0, 2).toUpperCase() || 'ST'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-ink truncate">{user?.firstName} {user?.lastName || ''}</div>
              <div className="text-[9px] text-muted truncate font-mono">{roleDisplayName}</div>
            </div>
          </div>
          <button onClick={() => dispatch(logout())} className="p-1.5 text-muted hover:text-red-600 flex-shrink-0">
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
              className="text-xs font-bold text-ink hover:underline border border-line px-3.5 py-2 rounded-lg bg-stone/50 hover:bg-stone transition-colors tracking-wider hidden sm:block"
            >
              View Live Store ↗
            </Link>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 border border-line rounded-lg text-ink hover:bg-stone relative transition-colors"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-paper text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-paper border border-line rounded-xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                  <div className="px-4 py-3 bg-stone border-b border-line flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-ink tracking-wider">Alert Center</span>
                    {notifications.length > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        {notifications.length} Issues
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-line max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <Link
                          key={n.id}
                          to={n.actionUrl}
                          onClick={() => setShowNotifications(false)}
                          className="block px-4 py-3 hover:bg-stone transition-colors"
                        >
                          <div className="font-extrabold text-xs text-ink">{n.title}</div>
                          <div className="text-[11px] text-muted mt-0.5 leading-relaxed">{n.message}</div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-muted font-semibold flex flex-col items-center gap-1.5">
                        <span className="text-emerald-500 font-extrabold text-base">✓</span>
                        All products have healthy stock levels.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Gear Shortcut */}
            {hasPermission('view_settings') && (
              <Link to="/admin/settings" className="p-2 border border-line rounded-lg text-ink hover:bg-stone transition-colors">
                <Settings className="w-4 h-4" />
              </Link>
            )}

            {/* Admin Profile User Card */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-line">
              <div className="w-8 h-8 rounded-full bg-ink text-paper font-black text-xs flex items-center justify-center overflow-hidden border border-line shadow-inner">
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.firstName?.substring(0, 2).toUpperCase() || 'ST'}</span>
                )}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-ink">
                  {user?.firstName} {user?.lastName || ''}
                </div>
                <div className="text-[9px] font-extrabold text-muted uppercase tracking-wider">
                  {roleDisplayName}
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

      {/* ─── GLOBAL ACCESS DENIED POPUP OVERLAY ───────────────────────── */}
      {accessDeniedMessage && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-5 text-center animate-fade-in">
            <AlertOctagon className="w-16 h-16 text-red-600 mx-auto animate-bounce" />
            <div>
              <h3 className="font-extrabold text-sm uppercase text-ink tracking-wider">Access Denied</h3>
              <p className="text-xs text-muted leading-relaxed font-semibold mt-2">
                {accessDeniedMessage}
              </p>
            </div>
            <button
              onClick={() => setAccessDeniedMessage(null)}
              className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ink/90 transition-all shadow-xs"
            >
              Understand & Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
