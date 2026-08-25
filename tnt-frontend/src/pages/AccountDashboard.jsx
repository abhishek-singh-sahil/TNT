import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import AccountSidebar from '../components/layout/AccountSidebar';
import { orderApi, addressApi, authApi, marketingApi } from '../api/services';
import { ShoppingBag, Truck, Heart, Star, Settings, ArrowRight, ChevronRight, HelpCircle, LogIn, Shield, Plus, Trash2, Edit2, User, Mail, Phone, CheckCircle, Copy, AlertTriangle, ChevronLeft, CreditCard, Lock, Tag, MapPin, BookOpen, Bell } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUser } from '../store/authSlice';
import { selectCurrencySymbol, selectSettings } from '../store/settingsSlice';
import toast from 'react-hot-toast';

export default function AccountDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const currentPath = location.pathname;

  const { user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const currencySymbol = useSelector(selectCurrencySymbol);
  const systemSettings = useSelector(selectSettings);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Dynamic Support Tickets, Alerts & Notification Prefs
  const [supportTickets, setSupportTickets] = useState([
    { id: 'T-101', subject: 'Refund delay for Order #TNT-9943', message: 'I returned the items 4 days ago, haven\'t received payment.', date: '2026-08-10', status: 'RESOLVED', response: 'Refund has been initiated via Razorpay. It will reflect in your account within 24 hours.' },
  ]);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });

  const [notifPrefs, setNotifPrefs] = useState({
    orderUpdatesEmail: true,
    orderUpdatesSMS: true,
    promotionsEmail: false,
    promotionsSMS: false,
    securityEmail: true,
  });

  const [alertsList, setAlertsList] = useState([
    { id: 1, text: 'Order #TNT-1834 has been successfully delivered.', date: 'Today at 2:30 PM', read: false },
    { id: 2, text: 'Your signup welcome bonus of 320 Reward Points has been credited.', date: 'Yesterday', read: true },
    { id: 3, text: 'Password changed successfully.', date: '4 days ago', read: true },
  ]);

  const [notifTab, setNotifTab] = useState('alerts');
  const [printingOrder, setPrintingOrder] = useState(null); // 'alerts' or 'settings'

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

  const fetchCoupons = async () => {
    try {
      const res = await marketingApi.getActiveCoupons();
      if (res.success && res.coupons) {
        setCoupons(res.coupons);
      }
    } catch (err) {
      console.error('Failed to load active coupons:', err);
    }
  };

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
    fetchCoupons();
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

  // Helper for Back Header navigation (Only visible on mobile subpages)
  const renderBackHeader = (title) => (
    <div className="flex items-center justify-between py-4 px-2 bg-paper border-b border-line mb-6 lg:hidden">
      <button
        onClick={() => navigate('/account/dashboard')}
        className="text-[11px] font-extrabold text-ink uppercase flex items-center gap-1.5 hover:underline"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="text-xs font-extrabold uppercase text-ink tracking-wider">{title}</h2>
      <div className="w-12"></div>
    </div>
  );

  // Subviews Renderers
  const renderOrdersView = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      {renderBackHeader("Order History")}
      <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">Order History</h3>
      
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
              <div className="bg-stone/50 border border-line rounded p-2.5 space-y-1 text-[11px] text-ink font-medium max-w-sm mt-2">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal:</span>
                  <span>{currencySymbol}{(order.subtotal || order.totalAmount).toLocaleString()}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                    <span>-{currencySymbol}{order.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {order.shippingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Shipping Fee:</span>
                    <span>+{currencySymbol}{order.shippingFee.toLocaleString()}</span>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Estimated Tax:</span>
                    <span>+{currencySymbol}{order.taxAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-1.5 mt-1 font-black text-xs">
                  <span>Total paid:</span>
                  <span>{currencySymbol}{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
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
                className="px-4 py-2 border border-line text-xs font-bold uppercase rounded hover:bg-stone text-ink transition-all text-center min-w-[100px]"
              >
                TRACK
              </Link>
              <button
                type="button"
                onClick={() => setPrintingOrder(order)}
                className="px-4 py-2 border border-line text-xs font-bold uppercase rounded hover:bg-stone text-ink transition-all text-center min-w-[100px]"
              >
                INVOICE
              </button>
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
      {renderBackHeader("Addresses")}
      <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">Manage Addresses</h3>

      <div className="flex items-center justify-between">
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

  const renderReturnsView = () => {
    const eligibleOrders = orders.filter(o => o.orderStatus === 'DELIVERED');
    const returnHistory = orders.filter(o => ['RETURNED', 'RETURN_REQUESTED', 'RETURN_STARTED', 'RETURNED_AND_REFUNDED'].includes(o.orderStatus));

    return (
      <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
        {renderBackHeader("Returns & Refunds")}
        <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">Returns & Exchanges</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Eligible for Return</h4>
            <div className="space-y-3">
              {eligibleOrders.map(o => (
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
              {eligibleOrders.length === 0 && (
                <p className="text-xs text-muted italic">No orders currently eligible for return.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-line">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Return History & Status</h4>
            <div className="space-y-3">
              {returnHistory.map(o => {
                let badgeCls = "bg-amber-50 text-amber-700 border-amber-200";
                let badgeText = "Return Pending";
                if (o.orderStatus === 'RETURN_STARTED') {
                  badgeCls = "bg-indigo-50 text-indigo-700 border-indigo-200";
                  badgeText = "Return Started";
                } else if (o.orderStatus === 'RETURNED_AND_REFUNDED') {
                  badgeCls = "bg-green-50 text-green-700 border-green-200";
                  badgeText = "Returned & Refunded";
                }
                return (
                  <div key={o.id} className="p-4 border border-line rounded flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-ink">Order #{o.orderNumber}</p>
                      <p className="text-[11px] text-muted">Status updated: {new Date(o.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase ${badgeCls}`}>
                        {badgeText}
                      </span>
                      <Link
                        to={`/account/orders/${o.orderNumber}/track`}
                        className="text-xs font-bold text-ink underline"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
              {returnHistory.length === 0 && (
                <p className="text-xs text-muted italic">No return tickets filed yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRewardsView = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      {renderBackHeader("TNT Wallet & Rewards")}
      <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">TNT Club Rewards</h3>

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
            <span className="text-3xl font-extrabold text-yellow-400">{user.rewardPoints || 320} POINTS</span>
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
      {renderBackHeader("Coupons")}
      <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">Available Coupons</h3>

      {coupons.length === 0 ? (
        <div className="text-center py-12 bg-stone/20 border border-line rounded-lg">
          <Tag className="w-8 h-8 text-muted mx-auto mb-2" />
          <p className="text-xs text-muted font-bold uppercase">No coupons available</p>
          <p className="text-[10px] text-muted mt-1">Check back later for exclusive deals!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="p-4 border border-dashed border-ink/40 rounded bg-stone/40 flex justify-between items-center">
              <div>
                <span className="bg-ink text-paper text-[10px] font-bold px-2 py-0.5 rounded">{coupon.code}</span>
                <p className="text-xs font-bold text-ink mt-2">{coupon.name}</p>
                {coupon.description && <p className="text-[10px] text-muted">{coupon.description}</p>}
                <p className="text-[9px] text-muted font-semibold mt-1">
                  Discount: {coupon.couponType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} Off
                  {coupon.minOrderAmount > 0 && ` • Min Order: ₹${coupon.minOrderAmount}`}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(coupon.code);
                  toast.success(`Copied ${coupon.code}!`);
                }}
                className="text-xs font-bold text-ink underline uppercase hover:text-ink/80 transition-colors"
              >
                COPY
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDetailsView = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      {renderBackHeader("Account Profile")}
      <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">Profile Details</h3>

      <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg mx-auto">
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

  const renderCustomerCare = () => {
    const handleTicketSubmit = (e) => {
      e.preventDefault();
      const newTicket = {
        id: `T-${Math.floor(100 + Math.random() * 900)}`,
        subject: ticketForm.subject,
        message: ticketForm.message,
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING',
      };
      setSupportTickets([newTicket, ...supportTickets]);
      setTicketForm({ subject: '', message: '' });
      toast.success('Support ticket raised! Our team will respond shortly.');
    };

    return (
      <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
        {renderBackHeader("Help & Support")}
        <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">Help & Support</h3>

        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Need help with your order, refund, or delivery? Reach out to our dedicated support channels. We typically respond within 2-4 business hours.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 border border-line rounded bg-stone/30">
              <span className="text-[10px] font-bold text-muted block uppercase">CALL HELPLINE</span>
              <span className="text-sm font-extrabold text-ink">{systemSettings?.sitePhone || '+91 99999 88888'}</span>
            </div>
            <div className="p-4 border border-line rounded bg-stone/30">
              <span className="text-[10px] font-bold text-muted block uppercase">EMAIL SUPPORT</span>
              <span className="text-sm font-extrabold text-ink">{systemSettings?.siteEmail || 'threadntones25@gmail.com'}</span>
            </div>
          </div>

          <div className="border-t border-line pt-6">
            <h4 className="text-xs font-extrabold uppercase text-ink mb-3">Send a Direct Ticket</h4>
            <form onSubmit={handleTicketSubmit} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Query regarding Order Delivery/Refund"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full text-xs bg-stone border border-line p-2 rounded focus:outline-none focus:border-ink font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Message Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please provide your order number and query details..."
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  className="w-full text-xs bg-stone border border-line p-2 rounded focus:outline-none focus:border-ink font-semibold"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-black transition-colors">
                Submit Ticket
              </button>
            </form>
          </div>

          {/* Raised tickets history */}
          {supportTickets.length > 0 && (
            <div className="border-t border-line pt-6 space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-ink font-sans">Ticket History</h4>
              <div className="space-y-3">
                {supportTickets.map(t => (
                  <div key={t.id} className="p-4 border border-line rounded-lg bg-stone/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-ink">#{t.id} - {t.subject}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed font-semibold">Message: {t.message}</p>
                    <span className="text-[9px] text-muted block font-semibold">Raised on {t.date}</span>
                    {t.response && (
                      <div className="mt-2 p-2.5 bg-paper rounded border border-line text-[10px] text-ink leading-relaxed space-y-1">
                        <span className="font-extrabold text-ink uppercase block">Support Agent response:</span>
                        <p className="font-semibold text-muted/90">{t.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTNTVerse = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-4 animate-fadeIn">
      {renderBackHeader("TNTVERSE Program")}
      <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">Lookbook & TNTVERSE</h3>

      <div className="max-w-md mx-auto text-center space-y-4 py-8">
        <div className="w-16 h-16 rounded-full bg-ink text-paper flex items-center justify-center mx-auto text-xl font-extrabold tracking-widest animate-pulse">TNT</div>
        <h3 className="text-base font-extrabold uppercase text-ink tracking-wider">TNTVERSE INFLUENCER PROGRAM</h3>
        <p className="text-xs text-muted leading-relaxed">
          Connect, create, and earn. Apply to our community program to share your street style outfits. Get free hoodies, custom discount codes, and earn 10% commission on orders.
        </p>
        <div className="bg-stone p-4 rounded border border-line text-left text-xs space-y-2">
          <div className="font-bold text-ink">Requirement Checklist:</div>
          <p>• 1,000+ Followers on Instagram or TikTok</p>
          <p>• High-contrast streetwear styling fashion posts</p>
          <p>• Active engagement and genuine audience base</p>
        </div>
        <button onClick={() => toast.success('Application submitted!')} className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded">Apply to TNTVERSE</button>
      </div>
    </div>
  );

  const renderSavedCards = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      {renderBackHeader("Saved Cards")}
      <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">Saved Cards</h3>

      <div className="text-center py-16 space-y-4 max-w-sm mx-auto">
        <Lock className="w-12 h-12 text-ink mx-auto" />
        <h3 className="text-sm font-extrabold uppercase text-ink">SECURE CARD ENCLAVE</h3>
        <p className="text-xs text-muted leading-relaxed">
          For your safety, TNT does not store credit card credentials on our servers. All transactions are securely processed via Razorpay.
        </p>
      </div>
    </div>
  );

  const renderHowToReturn = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-4 animate-fadeIn">
      {renderBackHeader("How To Return")}
      <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">Simple Returns Walkthrough</h3>
      <div className="space-y-4 text-xs leading-relaxed text-ink pt-2">
        <div className="flex gap-3">
          <span className="font-extrabold bg-stone w-6 h-6 flex items-center justify-center rounded-full shrink-0 border border-line">1</span>
          <div>
            <p className="font-bold uppercase text-[10px]">Go to Orders</p>
            <p className="text-muted">Navigate to your order list and select the delivered order containing the items you wish to return.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="font-extrabold bg-stone w-6 h-6 flex items-center justify-center rounded-full shrink-0 border border-line">2</span>
          <div>
            <p className="font-bold uppercase text-[10px]">Request Pick Up</p>
            <p className="text-muted">Click the "Request Return" button next to eligible products, select return reasons, and hit submit.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="font-extrabold bg-stone w-6 h-6 flex items-center justify-center rounded-full shrink-0 border border-line">3</span>
          <div>
            <p className="font-bold uppercase text-[10px]">Prepare Packaging</p>
            <p className="text-muted">Keep tags intact. Pack items in original box and seal them cleanly. Courier picks up package within 24-48h.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-4 animate-fadeIn">
      {renderBackHeader("Terms of Service")}
      <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">Terms & Conditions</h3>
      <div className="text-xs text-muted space-y-3 leading-relaxed">
        <p className="font-bold text-ink">1. Acceptance of Terms</p>
        <p>By browsing, accessing, or placing orders on TNT, you acknowledge that you have read, understood, and agreed to be bound by our services rules.</p>
        <p className="font-bold text-ink">2. Fabric Integrity & Quality</p>
        <p>TNT strives to provide high-quality organic loopback cotton. However, slight variations in washing shades are natural characteristics of dye finishes.</p>
      </div>
    </div>
  );

  const renderPromotions = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-4 animate-fadeIn">
      {renderBackHeader("Promotions Policy")}
      <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">Promotional Guidelines</h3>
      <div className="text-xs text-muted space-y-3 leading-relaxed">
        <p className="font-bold text-ink">1. Coupon Applicability</p>
        <p>Coupon codes cannot be stacked. Only one coupon code can be applied per checkout sequence. Minimum threshold requirements are checked before shipping deductions.</p>
        <p className="font-bold text-ink">2. Cashback & Referral Points</p>
        <p>Loyalty club reward points have no monetary cash value and are solely redeemable for product catalogs discount checkouts.</p>
      </div>
    </div>
  );

  const renderReturnsPolicy = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-4 animate-fadeIn">
      {renderBackHeader("Returns & Refunds Policy")}
      <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">Returns Guidelines</h3>
      <div className="text-xs text-muted space-y-3 leading-relaxed">
        <p className="font-bold text-ink">1. 14-Day Guarantee</p>
        <p>You can return clean, unworn garments with tags attached within 14 days of successful delivery. Excluded items include limited collaborations and custom sales.</p>
        <p className="font-bold text-ink">2. Quality Check Verification</p>
        <p>Refunds are initiated to the source payment method only after verifying returned goods quality checks at our verification warehouse.</p>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-4 animate-fadeIn">
      {renderBackHeader("Privacy Policy")}
      <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">We Respect Your Privacy</h3>
      <div className="text-xs text-muted space-y-3 leading-relaxed">
        <p className="font-bold text-ink">1. Customer Data Safety</p>
        <p>TNT does not sell or distribute personal profiling databases, emails, or phone numbers to third-party advertisers. All records are stored with full database encryption.</p>
        <p className="font-bold text-ink">2. Session Cookies</p>
        <p>Cookies are utilized solely to cache cart states, session checks, and preferences metrics to enhance loading speeds.</p>
      </div>
    </div>
  );

  const renderFees = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-4 animate-fadeIn">
      {renderBackHeader("Fees & Payments")}
      <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider">Fees Structure</h3>
      <div className="text-xs text-muted space-y-3 leading-relaxed">
        <p className="font-bold text-ink">1. Shipping Charges</p>
        <p>Free shipping is automatically applied to orders crossing the system threshold limits. Standard checkout delivery rates apply otherwise.</p>
        <p className="font-bold text-ink">2. Cash on Delivery (COD)</p>
        <p>A handling processing surcharge fee may apply to COD checkouts, visible in checkout tables.</p>
      </div>
    </div>
  );

  const renderNotifications = () => {
    const handleMarkAllRead = () => {
      setAlertsList(alertsList.map(a => ({ ...a, read: true })));
      toast.success('All alerts marked as read!');
    };

    const handleTogglePref = (key) => {
      setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key] });
    };

    const handleSaveNotifPref = (e) => {
      e.preventDefault();
      toast.success('Notification preferences updated successfully!');
    };

    return (
      <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
        {renderBackHeader("Notifications")}
        <div className="flex justify-between items-center border-b border-line pb-3">
          <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider">Notifications</h3>
          
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setNotifTab('alerts')}
              className={`px-3 py-1.5 font-bold rounded uppercase tracking-wider ${notifTab === 'alerts' ? 'bg-ink text-paper' : 'border border-line text-ink'}`}
            >
              Alerts
            </button>
            <button
              onClick={() => setNotifTab('settings')}
              className={`px-3 py-1.5 font-bold rounded uppercase tracking-wider ${notifTab === 'settings' ? 'bg-ink text-paper' : 'border border-line text-ink'}`}
            >
              Settings
            </button>
          </div>
        </div>

        {notifTab === 'alerts' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-muted uppercase">Recent Activity</span>
              {alertsList.some(a => !a.read) && (
                <button onClick={handleMarkAllRead} className="text-[9px] font-bold text-ink underline uppercase hover:text-ink/80">
                  Mark all as read
                </button>
              )}
            </div>

            {alertsList.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-line" />
                <span className="font-bold text-xs uppercase text-ink block">No alerts yet</span>
              </div>
            ) : (
              <div className="divide-y divide-line border border-line rounded-lg overflow-hidden bg-stone/20">
                {alertsList.map(a => (
                  <div key={a.id} className={`p-4 flex justify-between items-start gap-4 transition-colors ${a.read ? 'bg-transparent' : 'bg-paper border-l-2 border-ink'}`}>
                    <div className="space-y-1">
                      <p className={`text-xs text-ink leading-relaxed ${a.read ? 'font-medium text-muted/95' : 'font-semibold'}`}>{a.text}</p>
                      <span className="text-[9px] text-muted block font-semibold">{a.date}</span>
                    </div>
                    {!a.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-ink shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveNotifPref} className="space-y-5">
            <div className="space-y-4">
              {/* Row 1: Order Updates */}
              <div className="p-4 bg-stone/30 rounded-lg border border-line space-y-3">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Order & Fulfillment Updates</h4>
                <p className="text-[10px] text-muted leading-relaxed">Receive instant updates regarding your checkout status, warehouse packaging, AWB generation, and delivery courier schedules.</p>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.orderUpdatesEmail}
                      onChange={() => handleTogglePref('orderUpdatesEmail')}
                      className="rounded border-line text-ink focus:ring-0"
                    />
                    <span>Email Alerts</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.orderUpdatesSMS}
                      onChange={() => handleTogglePref('orderUpdatesSMS')}
                      className="rounded border-line text-ink focus:ring-0"
                    />
                    <span>SMS / WhatsApp Alerts</span>
                  </label>
                </div>
              </div>

              {/* Row 2: Promotions */}
              <div className="p-4 bg-stone/30 rounded-lg border border-line space-y-3">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Promotional Offers & Early Drops</h4>
                <p className="text-[10px] text-muted leading-relaxed">Be the first to know about upcoming streetwear capsule collections, coupon drops, and VIP styling reward points.</p>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.promotionsEmail}
                      onChange={() => handleTogglePref('promotionsEmail')}
                      className="rounded border-line text-ink focus:ring-0"
                    />
                    <span>Email Updates</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.promotionsSMS}
                      onChange={() => handleTogglePref('promotionsSMS')}
                      className="rounded border-line text-ink focus:ring-0"
                    />
                    <span>SMS alerts</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Security */}
              <div className="p-4 bg-stone/30 rounded-lg border border-line space-y-3">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Account Security & Activity</h4>
                <p className="text-[10px] text-muted leading-relaxed">Email alerts regarding login attempts, details edits, and password change attempts.</p>
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={notifPrefs.securityEmail}
                    disabled
                    className="rounded border-line text-ink opacity-50 cursor-not-allowed"
                  />
                  <span>Email Security Codes (Mandatory)</span>
                </label>
              </div>
            </div>

            <button type="submit" className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-black transition-colors">
              Save Preferences
            </button>
          </form>
        )}
      </div>
    );
  };

  // Desktop Empty-States / General Dashboard Overview
  const renderDashboardOverview = () => (
    <div className="space-y-6 animate-fadeIn bg-paper border border-line rounded-lg p-6 shadow-sm">
      <div>
        <h2 className="text-sm font-black uppercase text-ink tracking-widest border-b border-line pb-3">Dashboard Overview</h2>
        <p className="text-xs text-muted mt-2 leading-relaxed">
          Welcome to your streetwear dashboard hub, {user.firstName}! Track recent purchases, manage delivery locations, and view saved styling collections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
        {/* Orders Card */}
        <div className="border border-line bg-stone/20 rounded-lg p-4 flex flex-col justify-between h-36">
          <div>
            <ShoppingBag className="w-4 h-4 text-muted mb-1" />
            <h4 className="text-[11px] font-bold uppercase text-ink">Orders Registry</h4>
            <p className="text-[10px] text-muted mt-1">You have {orders.length} order(s) registered in your purchase timeline.</p>
          </div>
          <button onClick={() => navigate('/account/orders')} className="w-full py-1.5 bg-ink text-paper text-[10px] font-bold uppercase rounded hover:bg-ink/90">
            View Orders
          </button>
        </div>

        {/* Address Card */}
        <div className="border border-line bg-stone/20 rounded-lg p-4 flex flex-col justify-between h-36">
          <div>
            <MapPin className="w-4 h-4 text-muted mb-1" />
            <h4 className="text-[11px] font-bold uppercase text-ink">Saved Locations</h4>
            <p className="text-[10px] text-muted mt-1">Manage shipping locations and contact tags ({addresses.length}).</p>
          </div>
          <button onClick={() => navigate('/account/addresses')} className="w-full py-1.5 bg-ink text-paper text-[10px] font-bold uppercase rounded hover:bg-ink/90">
            Manage Address
          </button>
        </div>

        {/* Wishlist Card */}
        <div className="border border-line bg-stone/20 rounded-lg p-4 flex flex-col justify-between h-36">
          <div>
            <Heart className="w-4 h-4 text-muted mb-1" />
            <h4 className="text-[11px] font-bold uppercase text-ink">Wishlist Styles</h4>
            <p className="text-[10px] text-muted mt-1">You have {wishlistItems.length} styles added to your wishlist bookmark.</p>
          </div>
          <button onClick={() => navigate('/wishlist')} className="w-full py-1.5 bg-ink text-paper text-[10px] font-bold uppercase rounded hover:bg-ink/90">
            View Favorites
          </button>
        </div>
      </div>
    </div>
  );

  // Shein-Style Menu List (Mobile Dashboard View)
  const renderAccountMenuMobile = () => {
    const initials = user.firstName ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase() : 'U';

    const menuItems = [
      { label: 'Orders', path: '/account/orders' },
      { label: 'Wishlist', path: '/wishlist', badge: wishlistItems.length },
      { label: 'Addresses', path: '/account/addresses' },
      { label: 'Returns & Exchanges', path: '/account/returns' },
      { label: 'TNT Club Rewards', path: '/account/rewards', badge: user.rewardPoints || 320 },
      { label: 'Coupons', path: '/account/coupons', badge: coupons.length },
      { label: 'Reviews', path: '/account/reviews' },
      { label: 'Notifications', path: '/account/notifications' },
      { label: 'Account Details', path: '/account/details' },
      { label: 'Help & Support', path: '/account/customercare' },
    ];

    return (
      <div className="space-y-6 pb-12 animate-fadeIn bg-paper border border-line rounded-xl p-4 sm:p-6 shadow-sm">
        {/* Header App Bar */}
        <div className="py-4 border-b border-line flex items-center justify-between bg-paper">
          <h2 className="text-sm font-extrabold uppercase text-ink tracking-wider">My Account</h2>
        </div>

        {/* Staff highlighted Admin Dashboard panel */}
        {user.role?.name !== 'CUSTOMER' && (
          <div className="bg-ink text-paper p-4 rounded flex items-center justify-between shadow-soft border border-line/25 animate-pulse">
            <div>
              <p className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">STAFF PROFILE</p>
              <h4 className="text-xs font-extrabold uppercase mt-0.5 text-paper">Admin Management Control</h4>
            </div>
            <Link
              to="/admin"
              className="px-3.5 py-1.5 bg-yellow-400 text-ink text-[10px] font-extrabold uppercase rounded shadow-sm hover:bg-yellow-300 transition-all"
            >
              Enter Panel
            </Link>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-stone/60 border border-line rounded-lg px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-ink text-paper font-bold text-lg flex items-center justify-center">
              {initials}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-base text-ink">{user.firstName} {user.lastName || ''}</h3>
              <p className="text-xs text-muted font-medium">{user.email}</p>
              {user.phone && <p className="text-xs text-muted font-medium">{user.phone}</p>}
            </div>
          </div>
          <button
            onClick={() => navigate('/account/details')}
            className="text-xs font-extrabold text-ink underline"
          >
            Edit
          </button>
        </div>

        {/* Menu Items List */}
        <div className="divide-y divide-line border border-line rounded-lg overflow-hidden bg-paper">
          {menuItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (item.path.startsWith('/wishlist')) {
                  navigate(item.path);
                } else {
                  navigate(item.path);
                }
              }}
              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-stone/30 active:bg-stone/50 transition-all"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink uppercase tracking-wide">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-stone text-ink border border-line rounded font-extrabold">
                      {item.badge}
                    </span>
                  )}
                  {item.isNew && (
                    <span className="bg-red-600 text-paper text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                </div>
                {item.subtext && <p className="text-[10px] text-muted font-medium">{item.subtext}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-muted shrink-0" />
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="pt-4">
          <button
            onClick={() => {
              dispatch(logout());
              navigate('/login');
            }}
            className="w-full py-3.5 bg-paper border border-ink text-ink text-xs font-bold uppercase rounded-md text-center hover:bg-stone transition-all"
          >
            Logout
          </button>
        </div>

        {/* Build Version Footer */}
        <p className="text-center text-[10px] text-muted font-bold tracking-wider pt-2">
          Version 1.0.20 Build 41
        </p>
      </div>
    );
  };

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
      case '/account/customercare':
        return renderCustomerCare();
      case '/account/tntverse':
        return renderTNTVerse();
      case '/account/savedcards':
        return renderSavedCards();
      case '/account/howtoreturn':
        return renderHowToReturn();
      case '/account/terms':
        return renderTerms();
      case '/account/promotions':
        return renderPromotions();
      case '/account/returns-policy':
        return renderReturnsPolicy();
      case '/account/privacy':
        return renderPrivacy();
      case '/account/fees':
        return renderFees();
      case '/account/notifications':
        return renderNotifications();
      case '/account/dashboard':
      default:
        return isMobile ? renderAccountMenuMobile() : renderDashboardOverview();
    }
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className={`max-w-container mx-auto px-4 lg:px-8 ${printingOrder ? 'print:hidden' : ''}`}>
        {isMobile ? (
          // Mobile responsive: either Shein Menu or Selected subview full width
          <div className="max-w-2xl mx-auto">
            {loading && currentPath !== '/account/dashboard' ? (
              <div className="flex items-center justify-center py-24 text-ink font-semibold">
                Loading account details...
              </div>
            ) : (
              renderContent()
            )}
          </div>
        ) : (
          // Desktop responsive: Sidebar on the left, Selected subview on the right!
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <AccountSidebar />
            <main className="flex-1 w-full lg:max-w-4xl">
              {loading && currentPath !== '/account/dashboard' ? (
                <div className="flex items-center justify-center py-24 text-ink font-semibold">
                  Loading account details...
                </div>
              ) : (
                renderContent()
              )}
            </main>
          </div>
        )}
      </div>

      {/* Address Book Add/Edit Modal */}
      {showAddrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper border border-line rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="font-extrabold text-ink text-xs uppercase tracking-wider">
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

      {/* Printable Invoice Overlay Modal */}
      {printingOrder && (() => {
        const isDelhi = (printingOrder.address?.state || '').toLowerCase().includes('delhi');
        const gstRate = 5;
        const subtotal = printingOrder.subtotal || 0;
        const discount = printingOrder.discountAmount || 0;
        const shipping = printingOrder.shippingFee || 0;
        const grandTotal = printingOrder.totalAmount || 0;
        
        const taxableSubtotal = Math.round((subtotal - discount) / (1 + (gstRate / 100)) * 100) / 100;
        const totalTax = Math.round((subtotal - discount - taxableSubtotal) * 100) / 100;
        
        const cgst = isDelhi ? Math.round((totalTax / 2) * 100) / 100 : 0;
        const sgst = isDelhi ? Math.round((totalTax / 2) * 100) / 100 : 0;
        const igst = !isDelhi ? totalTax : 0;

        const numberToWords = (num) => {
          const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
          const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
          const convert = (n) => {
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
            if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
            if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
            if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
            return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
          };
          const rounded = Math.round(num);
          if (rounded === 0) return 'Zero';
          return convert(rounded) + ' Rupees Only';
        };

        return (
          <>
            {/* Screen Overlay (Hidden during print) */}
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
              <div className="bg-paper border border-line rounded-xl p-6 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-line pb-3">
                  <span className="font-extrabold text-xs uppercase text-ink tracking-wider">Purchase Invoice</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-ink text-paper text-[10px] font-bold rounded uppercase hover:bg-ink/90"
                    >
                      Print Bill
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintingOrder(null)}
                      className="px-3 py-1.5 border border-line text-[10px] font-bold rounded text-ink uppercase hover:bg-stone"
                    >
                      Close
                    </button>
                  </div>
                </div>
                
                {/* Visual Invoice Preview on Screen */}
                <div className="space-y-4 text-xs">
                  <div className="text-center border-b-2 border-line pb-4">
                    <h2 className="text-lg font-black uppercase text-ink tracking-tight">THREAD & TONES</h2>
                    <p className="text-[10px] text-muted font-bold uppercase">Official Buyer Purchase Receipt</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-muted uppercase block">ORDER NUMBER</span>
                      <span className="font-extrabold text-ink">#{printingOrder.orderNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-muted uppercase block">ORDER DATE</span>
                      <span className="font-semibold text-ink">{new Date(printingOrder.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="border border-line rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
                        <tr>
                          <th className="p-3">Item Description</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {printingOrder.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3 font-semibold text-ink">{item.productName}</td>
                            <td className="p-3 text-center text-muted font-medium">{item.quantity}</td>
                            <td className="p-3 text-right text-muted font-medium">₹{(item.price || 0).toLocaleString()}</td>
                            <td className="p-3 text-right text-ink font-bold">₹{((item.price || 0) * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right space-y-1 pr-2">
                    <div className="flex justify-between text-muted"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                    {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>- ₹{discount.toLocaleString()}</span></div>}
                    <div className="flex justify-between text-muted"><span>Shipping</span><span>₹{shipping.toLocaleString()}</span></div>
                    <div className="flex justify-between font-black border-t border-line pt-2 mt-2 text-sm text-ink">
                      <span>Total Amount</span>
                      <span>₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actual Print Invoice Layout (Only visible in Print Mode) */}
            <div className="hidden print:block p-4 text-[10px] text-ink font-sans leading-normal max-w-4xl mx-auto border border-line bg-white">
              {/* Header */}
              <div className="text-center border-b border-line pb-2 mb-3">
                <h2 className="text-sm font-black tracking-widest uppercase">TAX INVOICE</h2>
                <p className="text-[8px] text-muted italic">Issued in compliance with GST Rules in India</p>
              </div>

              {/* Seller & Invoice Details */}
              <div className="grid grid-cols-2 gap-4 border-b border-line pb-3 mb-3">
                <div>
                  <h3 className="font-extrabold text-xs text-ink uppercase">THREAD & TONES PRIVATE LIMITED</h3>
                  <p className="text-muted text-[9px] mt-0.5">123 Business Park, Okhla Phase 3</p>
                  <p className="text-muted text-[9px]">New Delhi, Delhi, India - 110020</p>
                  <p className="font-bold text-ink mt-1">GSTIN: 07AAACT0000A1Z1</p>
                  <p className="text-muted">State: Delhi | State Code: 07</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[9px] text-muted uppercase">Invoice Details</p>
                  <p className="font-black text-xs text-ink mt-0.5">Invoice No: #{printingOrder.orderNumber}</p>
                  <p className="text-muted">Date: {new Date(printingOrder.createdAt).toLocaleString('en-IN')}</p>
                  <p className="font-bold text-ink">Place of Supply: {printingOrder.address?.state || 'Delhi'}</p>
                  <p className="text-muted">Payment: {printingOrder.payment?.paymentMethod || 'COD'} ({printingOrder.paymentStatus})</p>
                </div>
              </div>

              {/* Billing & Shipping Address */}
              <div className="grid grid-cols-2 gap-4 border-b border-line pb-3 mb-3">
                <div className="border-r border-line pr-2">
                  <h4 className="font-extrabold text-[9px] text-muted uppercase mb-1">Bill To (Buyer)</h4>
                  <p className="font-bold text-ink">{user?.firstName} {user?.lastName}</p>
                  <p className="text-muted">{user?.email}</p>
                  <p className="text-muted">{user?.phone}</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-[9px] text-muted uppercase mb-1">Ship To (Recipient)</h4>
                  {printingOrder.address ? (
                    <>
                      <p className="font-bold text-ink">{printingOrder.address.fullName}</p>
                      <p className="text-muted">{printingOrder.address.street}</p>
                      {printingOrder.address.locality && <p className="text-muted">{printingOrder.address.locality}</p>}
                      <p className="text-muted">{printingOrder.address.city}, {printingOrder.address.state} - {printingOrder.address.postalCode}</p>
                      <p className="text-muted">Phone: {printingOrder.address.phone}</p>
                    </>
                  ) : (
                    <p className="italic text-muted">No shipping address recorded</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-3 border-collapse text-[9px]">
                <thead>
                  <tr className="border-b border-ink bg-stone/50 font-bold uppercase">
                    <th className="py-1.5 px-2 text-left w-6">S.No</th>
                    <th className="py-1.5 px-2 text-left">Description of Goods</th>
                    <th className="py-1.5 px-2 text-center">HSN Code</th>
                    <th className="py-1.5 px-2 text-right">Qty</th>
                    <th className="py-1.5 px-2 text-right">Unit Price</th>
                    <th className="py-1.5 px-2 text-right">CGST (2.5%)</th>
                    <th className="py-1.5 px-2 text-right">SGST (2.5%)</th>
                    <th className="py-1.5 px-2 text-right">IGST (5%)</th>
                    <th className="py-1.5 px-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {printingOrder.items?.map((item, idx) => {
                    const itemPrice = item.price || 0;
                    const itemTotal = itemPrice * item.quantity;
                    const itemDiscountRatio = discount > 0 ? (itemTotal / subtotal) * discount : 0;
                    const itemTaxable = Math.round((itemTotal - itemDiscountRatio) / (1 + (gstRate / 100)) * 100) / 100;
                    const itemTax = Math.round((itemTotal - itemDiscountRatio - itemTaxable) * 100) / 100;
                    
                    const itemCgst = isDelhi ? Math.round((itemTax / 2) * 100) / 100 : 0;
                    const itemSgst = isDelhi ? Math.round((itemTax / 2) * 100) / 100 : 0;
                    const itemIgst = !isDelhi ? itemTax : 0;

                    return (
                      <tr key={item.id}>
                        <td className="py-1.5 px-2 text-left">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-semibold">
                          {item.productName}
                          {item.variantInfo && <span className="text-muted block text-[8px]">{item.variantInfo}</span>}
                        </td>
                        <td className="py-1.5 px-2 text-center text-muted">61091000</td>
                        <td className="py-1.5 px-2 text-right">{item.quantity}</td>
                        <td className="py-1.5 px-2 text-right">₹{itemPrice.toLocaleString()}</td>
                        <td className="py-1.5 px-2 text-right text-muted">₹{itemCgst.toLocaleString()}</td>
                        <td className="py-1.5 px-2 text-right text-muted">₹{itemSgst.toLocaleString()}</td>
                        <td className="py-1.5 px-2 text-right text-muted">₹{itemIgst.toLocaleString()}</td>
                        <td className="py-1.5 px-2 text-right font-bold">₹{itemTotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Calculations Blocks */}
              <div className="grid grid-cols-2 gap-4 items-start pt-2">
                <div className="border border-line rounded p-2.5 space-y-1">
                  <span className="text-[8px] font-bold text-muted uppercase block">Amount in Words</span>
                  <span className="font-extrabold text-ink block leading-snug">{numberToWords(grandTotal)}</span>
                  
                  <div className="pt-2 border-t border-line mt-2 text-[8px] text-muted space-y-0.5">
                    <p className="font-bold text-ink">Terms & Conditions:</p>
                    <p>1. Goods once sold will not be taken back without approval registry.</p>
                    <p>2. Subject to New Delhi jurisdiction only.</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-right font-medium pr-1">
                  <div className="flex justify-between text-muted"><span>Taxable Value</span><span>₹{taxableSubtotal.toLocaleString()}</span></div>
                  {isDelhi ? (
                    <>
                      <div className="flex justify-between text-muted"><span>Central Tax (CGST 2.5%)</span><span>₹{cgst.toLocaleString()}</span></div>
                      <div className="flex justify-between text-muted"><span>State Tax (SGST 2.5%)</span><span>₹{sgst.toLocaleString()}</span></div>
                    </>
                  ) : (
                    <div className="flex justify-between text-muted"><span>Integrated Tax (IGST 5.0%)</span><span>₹{igst.toLocaleString()}</span></div>
                  )}
                  {discount > 0 && <div className="flex justify-between text-green-600 font-bold"><span>Discount (Coupon)</span><span>- ₹{discount.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-muted"><span>Shipping Charge</span><span>₹{shipping.toLocaleString()}</span></div>
                  <div className="flex justify-between font-black border-t border-ink pt-1.5 mt-1.5 text-xs text-ink">
                    <span>Grand Total</span>
                    <span>₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Signature Block */}
              <div className="flex justify-between items-end pt-8 mt-4 border-t border-dashed border-line">
                <div className="text-[7px] text-muted max-w-sm">
                  Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                </div>
                <div className="text-center w-48 border-t border-line pt-1 text-[8px] font-bold">
                  <p className="text-[7px] text-muted mb-6 uppercase">For Thread & Tones Pvt Ltd</p>
                  Authorized Signatory
                </div>
              </div>
            </div>
          </>
        );
      })()}

      <div className="mt-16 hidden lg:block print:hidden">
        <TrustStrip />
      </div>
    </div>
  );
}
