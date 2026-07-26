import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AccountSidebar from '../components/layout/AccountSidebar';
import TrustStrip from '../components/common/TrustStrip';
import { orderApi, addressApi, authApi } from '../api/services';
import { ShoppingBag, Truck, Heart, Star, Settings, ArrowRight, ChevronRight, HelpCircle, LogIn, Shield, Plus, Trash2, Edit2, User, Mail, Phone, CheckCircle, Copy, AlertTriangle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../store/authSlice';
import { selectCurrencySymbol } from '../store/settingsSlice';
import toast from 'react-hot-toast';

export default function AccountDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const currentPath = location.pathname;

  const { user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const currencySymbol = useSelector(selectCurrencySymbol);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);

  // Address CRUD states
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addrForm, setAddrForm] = useState({
    type: 'Home',
    fullName: '',
    phone: '',
    street: '',
    locality: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone || '',
        password: ''
      });
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const res = await addressApi.getAddresses();
      if (res.success) {
        setAddresses(res.addresses);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getMyOrders();
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to fetch user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchOrders();
    loadAddresses();
  }, [user]);

  if (!user) {
    return (
      <div className="bg-paper min-h-screen pt-8 pb-16">
        <div className="max-w-container mx-auto px-4 text-center py-16 bg-stone border border-line rounded-xl max-w-md">
          <h2 className="text-xl font-bold text-ink uppercase mb-2">PLEASE SIGN IN</h2>
          <p className="text-xs text-muted mb-6">You must be logged in to view your account dashboard.</p>
          <Link to="/login" className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase rounded">
            SIGN IN NOW
          </Link>
        </div>
      </div>
    );
  }

  const inTransitCount = orders.filter((o) => ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length;

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingAddress) {
        res = await addressApi.updateAddress(editingAddress.id, addrForm);
      } else {
        res = await addressApi.createAddress({
          ...addrForm,
          isDefault: addresses.length === 0
        });
      }
      if (res.success) {
        toast.success(editingAddress ? 'Address updated!' : 'Address added!');
        setShowAddrModal(false);
        setEditingAddress(null);
        setAddrForm({
          type: 'Home',
          fullName: '',
          phone: '',
          street: '',
          locality: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India'
        });
        loadAddresses();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await addressApi.deleteAddress(id);
      if (res.success) {
        toast.success('Address deleted successfully');
        loadAddresses();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete address');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      toast.loading('Updating profile...');
      const res = await authApi.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone,
        password: profileForm.password || undefined
      });
      toast.dismiss();
      if (res.success) {
        toast.success('Profile updated successfully!');
        dispatch(updateUser(res.user));
        setProfileForm(prev => ({ ...prev, password: '' }));
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.message || 'Failed to update profile');
    }
  };

  // View Renderers
  const renderOverview = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink uppercase tracking-tight">
            Hey {user.firstName}! 👋
          </h1>
          <p className="text-xs text-muted">Here's what's happening with your account.</p>
        </div>
        <div className="flex gap-2">
          {user.role?.name !== 'CUSTOMER' && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-md hover:bg-ink/90 transition-all w-fit"
            >
              <Shield className="w-3.5 h-3.5" /> OFFICIAL DASHBOARD
            </Link>
          )}
          <Link
            to="/account/details"
            className="inline-flex items-center gap-2 px-4 py-2 border border-line text-xs font-semibold text-ink rounded-md hover:bg-stone transition-all w-fit"
          >
            <Settings className="w-3.5 h-3.5" /> ACCOUNT SETTINGS
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-stone border border-line rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-ink shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase">TOTAL ORDERS</span>
              <div className="text-2xl font-extrabold text-ink">{orders.length}</div>
            </div>
          </div>
          <Link to="/account/orders" className="text-xs font-semibold text-ink hover:underline flex items-center gap-1 mt-4">
            View all orders <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-stone border border-line rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-ink shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase">ORDERS IN TRANSIT</span>
              <div className="text-2xl font-extrabold text-ink">{inTransitCount}</div>
            </div>
          </div>
          <Link to="/account/orders" className="text-xs font-semibold text-ink hover:underline flex items-center gap-1 mt-4">
            Track your orders <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-stone border border-line rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-ink shrink-0">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase">WISHLIST ITEMS</span>
              <div className="text-2xl font-extrabold text-ink">{wishlistItems.length}</div>
            </div>
          </div>
          <Link to="/wishlist" className="text-xs font-semibold text-ink hover:underline flex items-center gap-1 mt-4">
            View your wishlist <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-stone border border-line rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-yellow-500 shrink-0">
              <Star className="w-5 h-5 fill-yellow-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase">TNT CLUB POINTS</span>
              <div className="text-2xl font-extrabold text-ink">{user.rewardPoints || 0}</div>
            </div>
          </div>
          <Link to="/account/rewards" className="text-xs font-semibold text-ink hover:underline flex items-center gap-1 mt-4">
            View rewards <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Grid of Recent Orders and Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-paper border border-line rounded-lg p-6">
          <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
            <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider">RECENT ORDERS</h3>
            <Link to="/account/orders" className="text-xs font-semibold text-ink hover:underline flex items-center gap-1">
              View all orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <ShoppingBag className="w-12 h-12 mx-auto text-line mb-3" />
              <p className="text-xs font-semibold">No orders placed yet.</p>
              <Link to="/products" className="text-xs font-bold text-ink underline mt-2 block">
                START SHOPPING
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {orders.slice(0, 4).map((order) => (
                <Link
                  key={order.id}
                  to={`/account/orders/${order.orderNumber}/track`}
                  className="py-3.5 flex items-center justify-between hover:bg-stone/50 px-2 rounded transition-all group"
                >
                  <div>
                    <div className="font-bold text-ink text-sm group-hover:underline">Order #{order.orderNumber}</div>
                    <div className="text-[11px] text-muted">Total: {currencySymbol}{order.totalAmount.toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border bg-stone text-ink">
                      {order.orderStatus}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-ink" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Saved Addresses preview */}
        <div className="bg-paper border border-line rounded-lg p-6">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider">SAVED ADDRESSES</h3>
            <Link to="/account/addresses" className="text-xs text-muted hover:text-ink">View all →</Link>
          </div>

          {addresses.length > 0 ? (
            <div className="space-y-3 text-xs">
              {addresses.slice(0, 2).map((addr) => (
                <div key={addr.id} className="p-3 bg-stone border border-line rounded">
                  <span className="font-bold text-ink">{addr.type} ({addr.fullName})</span>
                  <p className="text-muted mt-1">{addr.street}, {addr.city}, {addr.state} - {addr.postalCode}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted text-center py-6">No saved addresses yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderOrdersView = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      <div className="border-b border-line pb-4">
        <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">YOUR ORDER HISTORY</h3>
        <p className="text-xs text-muted mt-0.5">Track, review, or return your purchased items</p>
      </div>

      <div className="divide-y divide-line">
        {orders.map((order) => (
          <div key={order.id} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-ink">Order #{order.orderNumber}</span>
                <span className="text-[10px] text-muted">| {new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-muted">
                Payment: <span className="font-semibold uppercase">{order.payment?.paymentMethod || 'Online Method'}</span> ({order.paymentStatus})
              </p>
              <p className="text-xs text-ink font-extrabold">
                Total: {currencySymbol}{order.totalAmount.toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {order.items?.map((item) => (
                  <div key={item.id} className="bg-stone text-ink text-[10px] px-2.5 py-1 rounded border border-line">
                    {item.productName} ({item.quantity})
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/account/orders/${order.orderNumber}/track`}
                className="px-4 py-2 border border-line text-xs font-bold uppercase rounded hover:bg-stone text-ink transition-all"
              >
                TRACK SHIPMENT
              </Link>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-16 text-muted">
            <ShoppingBag className="w-12 h-12 mx-auto text-line mb-3" />
            <p className="text-xs font-semibold">You have not placed any orders yet.</p>
            <Link to="/products" className="text-xs font-bold text-ink underline mt-2 block">
              GO SHOPPING
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const renderAddressesView = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">YOUR ADDRESS BOOK</h3>
          <p className="text-xs text-muted mt-0.5">Manage your shipping destinations</p>
        </div>
        <button
          onClick={() => {
            setEditingAddress(null);
            setAddrForm({
              type: 'Home',
              fullName: '',
              phone: '',
              street: '',
              locality: '',
              city: '',
              state: '',
              postalCode: '',
              country: 'India'
            });
            setShowAddrModal(true);
          }}
          className="px-3 py-1.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> ADD NEW
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className="p-4 border border-line rounded bg-stone/40 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-ink text-paper text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded">
                  {addr.type}
                </span>
                {addr.isDefault && (
                  <span className="border border-line bg-paper text-ink text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded">
                    DEFAULT
                  </span>
                )}
              </div>
              <p className="font-extrabold text-sm text-ink pt-1">{addr.fullName}</p>
              <p className="text-xs text-ink">{addr.street}</p>
              {addr.locality && <p className="text-xs text-ink">{addr.locality}</p>}
              <p className="text-xs text-ink">{addr.city}, {addr.state} - {addr.postalCode}</p>
              <p className="text-xs text-ink">{addr.country}</p>
              <p className="text-xs text-muted pt-1">Phone: {addr.phone}</p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-line mt-4">
              <button
                onClick={() => {
                  setEditingAddress(addr);
                  setAddrForm({
                    type: addr.type,
                    fullName: addr.fullName,
                    phone: addr.phone,
                    street: addr.street,
                    locality: addr.locality || '',
                    city: addr.city,
                    state: addr.state,
                    postalCode: addr.postalCode,
                    country: addr.country
                  });
                  setShowAddrModal(true);
                }}
                className="text-xs font-semibold text-ink flex items-center gap-1 hover:underline"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => handleDeleteAddress(addr.id)}
                className="text-xs font-semibold text-red-600 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted">
            No saved addresses found. Click "ADD NEW" to add your shipping address.
          </div>
        )}
      </div>
    </div>
  );

  const renderReturnsView = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      <div className="border-b border-line pb-4">
        <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">RETURNS & EXCHANGES</h3>
        <p className="text-xs text-muted mt-0.5">Check status of your return requests</p>
      </div>

      <div className="space-y-4">
        {orders.filter(o => o.orderStatus === 'DELIVERED').map(o => (
          <div key={o.id} className="p-4 border border-line rounded bg-stone/20 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-ink">Order #{o.orderNumber}</p>
              <p className="text-[11px] text-muted">Delivered on {new Date(o.updatedAt).toLocaleDateString()}</p>
            </div>
            <Link
              to={`/account/orders/${o.orderNumber}/track`}
              className="px-3 py-1.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90"
            >
              Initiate Return
            </Link>
          </div>
        ))}

        <div className="text-center py-12 border border-line rounded bg-stone/10 text-muted">
          <AlertTriangle className="w-8 h-8 mx-auto text-muted/60 mb-2" />
          <p className="text-xs">No active return or exchange tickets filed.</p>
        </div>
      </div>
    </div>
  );

  const renderRewardsView = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      <div className="border-b border-line pb-4">
        <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">TNT CLUB REWARDS</h3>
        <p className="text-xs text-muted mt-0.5">Earn points on every purchase and climb tiers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-ink text-paper p-6 rounded-lg border border-line relative overflow-hidden flex flex-col justify-between h-52">
          <div className="absolute -top-6 -right-6 p-4 opacity-5">
            <Star className="w-48 h-48 fill-white" />
          </div>
          <div>
            <p className="text-yellow-400 font-extrabold text-[9px] tracking-widest uppercase mb-1">MEMBERSHIP PASS</p>
            <h4 className="text-lg font-bold">TNT CLUB {user.rewardPoints >= 1500 ? 'GOLD' : 'SILVER'}</h4>
          </div>
          <div>
            <span className="text-[9px] text-paper/70 block uppercase">AVAILABLE BALANCE</span>
            <span className="text-3xl font-extrabold text-yellow-400">{user.rewardPoints || 0} POINTS</span>
          </div>
          <p className="text-[10px] text-paper/60">Every spend accumulates 5% reward points on final checkout values.</p>
        </div>

        <div className="border border-line rounded-lg p-5 bg-stone/40 space-y-4">
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider">REWARD TIERS</h4>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <span className={`font-semibold ${user.rewardPoints < 500 ? 'text-ink font-extrabold' : 'text-muted'}`}>Bronze Tier</span>
              <span className="text-muted">&lt; 500 Points</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <span className={`font-semibold ${user.rewardPoints >= 500 && user.rewardPoints < 1500 ? 'text-ink font-extrabold' : 'text-muted'}`}>Silver Tier</span>
              <span className="text-muted">500 - 1500 Points</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <span className={`font-semibold ${user.rewardPoints >= 1500 && user.rewardPoints < 3000 ? 'text-ink font-extrabold' : 'text-muted'}`}>Gold Tier</span>
              <span className="text-muted">1500 - 3000 Points</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-semibold ${user.rewardPoints >= 3000 ? 'text-ink font-extrabold' : 'text-muted'}`}>Platinum Tier</span>
              <span className="text-muted">&gt; 3000 Points</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCouponsView = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      <div className="border-b border-line pb-4">
        <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">AVAILABLE COUPONS</h3>
        <p className="text-xs text-muted mt-0.5">Use dynamic coupon codes during checkout to get discount cuts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-dashed border-ink/40 rounded bg-stone/40 flex justify-between items-center">
          <div>
            <span className="bg-ink text-paper text-[10px] font-bold px-2 py-0.5 rounded">WELCOME10</span>
            <p className="text-xs font-bold text-ink mt-2">10% Off on all items</p>
            <p className="text-[10px] text-muted">Valid for new customers</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText('WELCOME10');
              toast.success('Copied WELCOME10!');
            }}
            className="text-xs font-bold text-ink underline"
          >
            COPY
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailsView = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      <div className="border-b border-line pb-4">
        <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">ACCOUNT DETAILS</h3>
        <p className="text-xs text-muted mt-0.5">Update your personal profile details & credentials</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-ink uppercase mb-1">First Name</label>
            <input
              type="text"
              required
              value={profileForm.firstName}
              onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
              className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-ink uppercase mb-1">Last Name</label>
            <input
              type="text"
              value={profileForm.lastName}
              onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
              className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-ink uppercase mb-1">Email Address</label>
          <input
            type="email"
            required
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-ink uppercase mb-1">Phone Number</label>
          <input
            type="text"
            value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-ink uppercase mb-1">New Password (leave blank to keep current)</label>
          <input
            type="password"
            value={profileForm.password}
            onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
            className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
            placeholder="••••••••"
          />
        </div>

        <div className="pt-4 border-t border-line flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90 flex items-center gap-1.5"
          >
            SAVE CHANGES
          </button>
        </div>
      </form>
    </div>
  );

  const renderContent = () => {
    switch (currentPath) {
      case '/account/orders':
        return renderOrdersView();
      case '/account/addresses':
        return renderAddressesView();
      case '/account/returns':
        return renderReturnsView();
      case '/account/rewards':
        return renderRewardsView();
      case '/account/coupons':
        return renderCouponsView();
      case '/account/details':
        return renderDetailsView();
      case '/account/dashboard':
      default:
        return renderOverview();
    }
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <AccountSidebar />

          <main className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-24 text-ink font-semibold">
                Loading account details...
              </div>
            ) : (
              renderContent()
            )}
          </main>
        </div>
      </div>

      {/* Address Book Add/Edit Modal */}
      {showAddrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-paper border border-line rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="font-extrabold text-ink text-sm uppercase tracking-wider">
                {editingAddress ? 'EDIT ADDRESS' : 'ADD NEW ADDRESS'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddrModal(false)}
                className="text-xs text-muted hover:text-ink font-bold"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">Address Label</label>
                  <select
                    value={addrForm.type}
                    onChange={(e) => setAddrForm({ ...addrForm, type: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={addrForm.fullName}
                    onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={addrForm.phone}
                  onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                  className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                  placeholder="+91 99999 88888"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink uppercase mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={addrForm.street}
                  onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                  className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                  placeholder="Flat No, Building, Street Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addrForm.city}
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                    placeholder="Kanpur"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={addrForm.state}
                    onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                    placeholder="Uttar Pradesh"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={addrForm.postalCode}
                    onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                    placeholder="208001"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={addrForm.country}
                    onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-line flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddrModal(false)}
                  className="px-4 py-2 border border-line rounded text-xs font-bold text-ink hover:bg-stone"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink text-paper rounded text-xs font-bold hover:bg-ink/90"
                >
                  {editingAddress ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
