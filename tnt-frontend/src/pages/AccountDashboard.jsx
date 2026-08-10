import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import AccountSidebar from '../components/layout/AccountSidebar';
import { orderApi, addressApi, authApi } from '../api/services';
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
                className="px-4 py-2 border border-line text-xs font-bold uppercase rounded hover:bg-stone text-ink transition-all text-center min-w-[120px]"
              >
                TRACK
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

  const renderReturnsView = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      {renderBackHeader("Returns & Refunds")}
      <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">Returns & Exchanges</h3>
      
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

  const renderCustomerCare = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      {renderBackHeader("Customer Care")}
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
            <span className="text-sm font-extrabold text-ink">{systemSettings?.siteEmail || 'contact@tntclothing.com'}</span>
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <h4 className="text-xs font-extrabold uppercase text-ink mb-3">Send a Direct Ticket</h4>
          <form onSubmit={(e) => { e.preventDefault(); toast.success('Ticket submitted successfully!'); }} className="space-y-3">
            <div>
              <label className="block text-[9px] font-bold uppercase text-ink mb-1">Subject</label>
              <input type="text" required placeholder="Query regarding Order Delivery/Refund" className="w-full text-xs bg-stone border border-line p-2 rounded focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-ink mb-1">Message Description</label>
              <textarea required rows={4} placeholder="Please provide your order number and query details..." className="w-full text-xs bg-stone border border-line p-2 rounded focus:outline-none focus:border-ink" />
            </div>
            <button type="submit" className="w-full py-2 bg-ink text-paper text-xs font-bold uppercase rounded">Submit Ticket</button>
          </form>
        </div>
      </div>
    </div>
  );

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

  const renderNotifications = () => (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6 animate-fadeIn">
      {renderBackHeader("Notifications")}
      <h3 className="hidden lg:block text-sm font-black uppercase text-ink tracking-wider border-b border-line pb-3">Notifications</h3>

      <div className="text-center py-16 text-muted space-y-2">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-line" />
        <span className="font-bold uppercase text-xs text-ink block">All Caught Up!</span>
        <p className="text-[10px] text-muted">You have no new alerts or order status update notifications.</p>
      </div>
    </div>
  );

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
      { label: 'Customer Care', path: '/account/customercare' },
      { label: 'TNT Wallet', path: '/account/rewards', isNew: true, subtext: 'Manage rewards and refunds' },
      { label: 'Saved Cards', path: '/account/savedcards' },
      { label: 'Address', path: '/account/addresses' },
      { label: 'Notifications', path: '/account/notifications' },
      { label: 'How To Return', path: '/account/howtoreturn' },
      { label: 'Terms & Conditions', path: '/account/terms' },
      { label: 'Promotions Terms & Conditions', path: '/account/promotions' },
      { label: 'Returns & Refunds Policy', path: '/account/returns-policy' },
      { label: 'We Respect Your Privacy', path: '/account/privacy' },
      { label: 'Fees & Payments', path: '/account/fees' },
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
              onClick={() => navigate(item.path)}
              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-stone/30 active:bg-stone/50 transition-all"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink uppercase tracking-wide">{item.label}</span>
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
      <div className="max-w-container mx-auto px-4 lg:px-8">
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

      <div className="mt-16 hidden lg:block">
        <TrustStrip />
      </div>
    </div>
  );
}
