import { useState } from 'react';
import { orderApi } from '../api/services';
import TrustStrip from '../components/common/TrustStrip';
import { Search, Loader2, ArrowLeft, AlertTriangle, Truck, MapPin, CheckCircle2 } from 'lucide-react';

export default function GuestTrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!orderNumber || !email) {
      toast.error('Please enter order number and email');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setOrder(null);
      const res = await orderApi.getOrderTracking(orderNumber);
      if (res.success && res.order) {
        // Validate user email matches order email
        const orderEmail = res.order.user?.email || res.order.email;
        if (orderEmail && orderEmail.toLowerCase() !== email.toLowerCase()) {
          setError('Verification failed: The email address does not match this order number.');
        } else {
          setOrder(res.order);
        }
      } else {
        setError('Order not found. Please verify your order number.');
      }
    } catch (err) {
      setError(err.message || 'Failed to locate order.');
    } finally {
      setLoading(false);
    }
  };

  const getStepProgress = (status) => {
    switch (status) {
      case 'PENDING': return 15;
      case 'PROCESSING': return 50;
      case 'SHIPPED': return 80;
      case 'DELIVERED': return 100;
      default: return 15;
    }
  };

  return (
    <div className="bg-paper min-h-screen pb-16">
      {/* Banner */}
      <section className="bg-stone border-b border-line py-12 text-center">
        <span className="text-[10px] font-extrabold tracking-widest2 text-ink uppercase block mb-1">REAL-TIME SHIPMENT STATUS</span>
        <h1 className="text-2xl font-black uppercase text-ink tracking-tight">TRACK YOUR ORDER</h1>
      </section>

      <div className="max-w-2xl mx-auto px-4 mt-12">
        {/* Search State Form */}
        {!order ? (
          <div className="bg-paper border border-line rounded-xl p-6 md:p-8 space-y-6 shadow-xs">
            <div className="text-center space-y-1">
              <h2 className="font-extrabold text-xs uppercase text-ink tracking-wide">Enter Order Codes</h2>
              <p className="text-[10px] text-muted">Lookup tracking status by entering order number and registered billing email.</p>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Order Number / ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TNT-1786523910"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-semibold text-ink focus:outline-none placeholder-muted"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Registered Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. customer@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-semibold text-ink focus:outline-none placeholder-muted"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded text-[11px] font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                TRACK STATUS NOW
              </button>
            </form>
          </div>
        ) : (
          /* Tracker Status Details View */
          <div className="space-y-6">
            <button 
              onClick={() => setOrder(null)} 
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink font-bold uppercase"
            >
              <ArrowLeft className="w-4 h-4" /> Track another shipment
            </button>

            <div className="bg-paper border border-line rounded-xl p-6 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase block">ORDER CODE</span>
                  <span className="text-base font-black text-ink">#{order.orderNumber}</span>
                </div>
                <div className="text-right sm:text-left">
                  <span className="text-[10px] font-bold text-muted uppercase block">SHIPMENT STATUS</span>
                  <span className="inline-block px-2.5 py-1 bg-ink text-paper text-[9px] font-extrabold uppercase rounded-full tracking-wider mt-0.5">
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-3">
                <div className="h-2 w-full bg-stone rounded-full relative overflow-hidden">
                  <div 
                    className="h-full bg-ink transition-all duration-700" 
                    style={{ width: `${getStepProgress(order.status)}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[9px] font-extrabold uppercase text-muted tracking-wider">
                  <span className={order.status === 'PENDING' ? 'text-ink' : ''}>1. Received</span>
                  <span className={order.status === 'PROCESSING' ? 'text-ink' : ''}>2. Processing</span>
                  <span className={order.status === 'SHIPPED' ? 'text-ink' : ''}>3. Shipped</span>
                  <span className={order.status === 'DELIVERED' ? 'text-ink' : ''}>4. Delivered</span>
                </div>
              </div>

              {/* Courier Tracking info if available */}
              {order.tracking && order.tracking.trackingNumber ? (
                <div className="bg-stone p-4 rounded-lg border border-line space-y-2">
                  <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest block">Courier Logistics Log</span>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-muted uppercase block">Courier Partner</span>
                      <span className="font-extrabold text-ink">{order.tracking.courierPartner || 'TNT EXPRESS'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted uppercase block">AWB Tracking Number</span>
                      <span className="font-mono font-bold text-ink">{order.tracking.trackingNumber}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-stone/50 p-4 rounded-lg border border-line text-center text-xs text-muted">
                  ✏️ Shipment details are being verified by warehouse agents. Check back shortly.
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-3">
                <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest block">Shipment Items list</span>
                <div className="divide-y divide-line">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.product?.images?.[0] && (
                          <img src={item.product.images[0].url} alt="" className="w-10 h-12 object-cover rounded border border-line bg-stone" />
                        )}
                        <div>
                          <span className="text-xs font-bold text-ink block line-clamp-1">{item.product?.name || item.productName}</span>
                          <span className="text-[10px] text-muted block">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-ink">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
