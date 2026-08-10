import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  ShoppingBag,
  Heart,
  MapPin,
  RotateCcw,
  Star,
  Tag,
  MessageSquare,
  BookOpen,
  Bell,
  User,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';

export default function AccountSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', path: '/account/dashboard', icon: LayoutGrid },
    { label: 'Orders', path: '/account/orders', icon: ShoppingBag },
    { label: 'Wishlist', path: '/wishlist', icon: Heart, badge: wishlistItems.length },
    { label: 'Addresses', path: '/account/addresses', icon: MapPin },
    { label: 'Returns & Exchanges', path: '/account/returns', icon: RotateCcw },
    { label: 'TNT Club Rewards', path: '/account/rewards', icon: Star, badge: user.rewardPoints || 320 },
    { label: 'Coupons', path: '/account/coupons', icon: Tag, badge: 2 },
    { label: 'Reviews', path: '/account/reviews', icon: MessageSquare },
    { label: 'Notifications', path: '/account/notifications', icon: Bell },
    { label: 'Account Details', path: '/account/details', icon: User },
    { label: 'Help & Support', path: '/account/customercare', icon: HelpCircle },
  ];

  const initials = user.firstName ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase() : 'U';

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      {/* 1. Header Profile block */}
      <div className="bg-paper border border-line rounded-lg p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-ink text-paper font-bold text-sm flex items-center justify-center border border-line overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-sm text-ink">{user.firstName} {user.lastName || ''}</h3>
            <p className="text-[10px] text-muted truncate max-w-[130px]">{user.email}</p>
            <div className="inline-flex items-center gap-1 bg-ink text-paper text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" /> TNT CLUB
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-ink block">{user.rewardPoints || 320}</span>
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Points</span>
        </div>
      </div>

      {/* 2. Navigation items list */}
      <nav className="bg-paper border border-line rounded-lg p-3 space-y-1 shadow-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/account/orders' && location.pathname.startsWith('/account/orders'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${
                isActive
                  ? 'bg-ink text-paper'
                  : 'text-ink hover:bg-stone/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-paper' : 'text-muted'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                    isActive ? 'bg-paper/20 text-paper' : 'bg-stone text-ink border border-line'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <button
          onClick={() => {
            dispatch(logout());
            navigate('/login');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-bold uppercase text-red-600 hover:bg-red-50 transition-all text-left"
        >
          <LogOut className="w-4 h-4 text-red-600" />
          <span>Logout</span>
        </button>
      </nav>

      {/* 3. Bottom Black Card */}
      <div className="bg-ink text-paper rounded-lg p-5 border border-line/20 shadow-sm relative overflow-hidden flex flex-col justify-between h-44">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-yellow-400 uppercase mb-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> TNT CLUB
          </div>
          <p className="text-xs font-bold text-paper">
            You have {user.rewardPoints || 320} points.
          </p>
          <p className="text-[10px] text-paper/70 mt-1 leading-relaxed">
            Redeem points and get exclusive rewards.
          </p>
        </div>
        <Link
          to="/account/rewards"
          className="block w-full text-center py-2.5 bg-paper text-ink text-[10px] font-black uppercase tracking-wider rounded hover:bg-paper/90 transition-all"
        >
          VIEW REWARDS
        </Link>
      </div>
    </aside>
  );
}
