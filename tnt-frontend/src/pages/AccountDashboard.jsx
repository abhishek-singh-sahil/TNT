import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AccountSidebar from '../components/layout/AccountSidebar';
import TrustStrip from '../components/common/TrustStrip';
import { orderApi } from '../api/services';
import { ShoppingBag, Truck, Heart, Star, Settings, ArrowRight, ChevronRight, HelpCircle, LogIn } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function AccountDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchOrders() {
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
    }
    fetchOrders();
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

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <AccountSidebar />

          <main className="flex-1 space-y-8">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-ink uppercase tracking-tight">
                  Hey {user.firstName}! 👋
                </h1>
                <p className="text-xs text-muted">Here's what's happening with your account.</p>
              </div>
              <Link
                to="/account/details"
                className="inline-flex items-center gap-2 px-4 py-2 border border-line text-xs font-semibold text-ink rounded-md hover:bg-stone transition-all w-fit"
              >
                <Settings className="w-3.5 h-3.5" /> ACCOUNT SETTINGS
              </Link>
            </div>

            {/* 4 Summary Metric Cards */}
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

            {/* Recent Orders & Saved Addresses */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders List */}
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
                          <div className="text-[11px] text-muted">Total: ₹{order.totalAmount.toLocaleString()}</div>
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

              {/* Saved Addresses */}
              <div className="bg-paper border border-line rounded-lg p-6">
                <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider">SAVED ADDRESSES</h3>
                  <Link to="/account/addresses" className="text-xs text-muted hover:text-ink">View all →</Link>
                </div>

                {user.addresses && user.addresses.length > 0 ? (
                  <div className="space-y-3 text-xs">
                    {user.addresses.map((addr) => (
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
          </main>
        </div>
      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
