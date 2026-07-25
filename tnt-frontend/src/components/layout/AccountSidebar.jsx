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
  User,
  Bell,
  HelpCircle,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';

export default function AccountSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return (
      <aside className="w-full lg:w-72 shrink-0">
        <div className="bg-stone border border-line rounded-lg p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-paper border border-line flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-ink" />
          </div>
          <h3 className="font-extrabold text-ink text-sm uppercase mb-1">GUEST USER</h3>
          <p className="text-xs text-muted mb-4">Please log in to view your orders, addresses, and reward points.</p>
          <Link
            to="/login"
            className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 hover:bg-ink/90"
          >
            <LogIn className="w-4 h-4" /> SIGN IN NOW
          </Link>
        </div>
      </aside>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/account/dashboard', icon: LayoutGrid },
    { label: 'Orders', path: '/account/orders', icon: ShoppingBag },
    { label: 'Wishlist', path: '/wishlist', icon: Heart },
    { label: 'Addresses', path: '/account/addresses', icon: MapPin },
    { label: 'Returns & Exchanges', path: '/account/returns', icon: RotateCcw },
    { label: 'TNT Club Rewards', path: '/account/rewards', icon: Star, badge: user.rewardPoints || 0 },
    { label: 'Coupons', path: '/account/coupons', icon: Tag },
    { label: 'Reviews', path: '/account/reviews', icon: MessageSquare },
    { label: 'Account Details', path: '/account/details', icon: User },
    { label: 'Notifications', path: '/account/notifications', icon: Bell },
    { label: 'Help & Support', path: '/contact', icon: HelpCircle },
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0">
      {/* Dynamic Profile Card */}
      <div className="bg-stone border border-line rounded-lg p-5 mb-6 flex items-center gap-4">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.firstName}
            className="w-14 h-14 rounded-full object-cover border border-line"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-ink text-paper font-extrabold text-lg flex items-center justify-center border border-line">
            {user.firstName ? user.firstName[0] : 'U'}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-ink text-base">
            {user.firstName} {user.lastName || ''}
          </h3>
          <p className="text-xs text-muted mb-2 truncate max-w-[150px]">{user.email}</p>
          <div className="flex items-center gap-2">
            <span className="bg-ink text-paper text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> TNT CLUB
            </span>
            <span className="text-xs font-semibold text-ink">{user.rewardPoints || 0} Points</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="bg-stone border border-line rounded-lg p-2 space-y-1 mb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/account/orders' && location.pathname.startsWith('/account/orders'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-ink text-paper font-semibold shadow-sm'
                  : 'text-ink hover:bg-paper hover:text-ink'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-paper' : 'text-muted'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-paper/20 text-paper' : 'bg-mist text-ink'
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
          className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-all text-left"
        >
          <LogOut className="w-4 h-4 text-red-600" />
          <span>Logout</span>
        </button>
      </nav>

      {/* TNT Club Reward Card */}
      <div className="bg-ink text-paper rounded-lg p-5 border border-line">
        <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-yellow-400 uppercase mb-2">
          <Star className="w-4 h-4 fill-yellow-400" /> TNT CLUB
        </div>
        <p className="text-sm font-semibold mb-1">
          You have {user.rewardPoints || 0} points
        </p>
        <p className="text-xs text-muted/80 mb-4">
          Earn points on every purchase and unlock exclusive rewards.
        </p>
        <Link
          to="/account/rewards"
          className="block w-full text-center py-2 px-3 border border-paper text-paper text-xs font-semibold uppercase tracking-wider rounded hover:bg-paper hover:text-ink transition-all"
        >
          VIEW REWARDS
        </Link>
      </div>
    </aside>
  );
}
