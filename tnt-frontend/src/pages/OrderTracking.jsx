import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AccountSidebar from '../components/layout/AccountSidebar';
import TrustStrip from '../components/common/TrustStrip';
import { ArrowLeft, CheckCircle2, MapPin, Truck, Copy, AlertTriangle, RefreshCw, X, ExternalLink, ChevronRight, MessageSquare } from 'lucide-react';
import { orderApi } from '../api/services';
import toast from 'react-hot-toast';

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Size mismatch');
  const [selectedItems, setSelectedItems] = useState([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrderTracking(id);
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } catch (err) {
      console.error('Failed to load order tracking details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [id]);

  const handleCopyTracking = () => {
    if (order?.tracking?.trackingNumber) {
      navigator.clipboard.writeText(order.tracking.trackingNumber);
      toast.success('Tracking ID copied to clipboard!');
    }
  };

  const handleToggleItemSelection = (orderItemId, productVariantId, maxQty) => {
    const existing = selectedItems.find(i => i.orderItemId === orderItemId);
    if (existing) {
      setSelectedItems(selectedItems.filter(i => i.orderItemId !== orderItemId));
    } else {
      setSelectedItems([...selectedItems, { orderItemId, productVariantId, quantity: maxQty }]);
    }
  };

  const handleRequestReturn = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return/exchange');
      return;
    }

    try {
      setSubmittingReturn(true);
      const res = await orderApi.createReturnRequest(order.id, {
        reason: returnReason,
        items: selectedItems
      });
      if (res.success) {
        toast.success('Return/Exchange request successfully registered!');
        setReturnModalOpen(false);
        fetchTracking();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-muted animate-pulse" />
        <h2 className="text-xl font-bold uppercase text-ink">Order Not Found</h2>
        <p className="text-xs text-muted max-w-sm">No shipment tracking record matches this ID code.</p>
        <Link to="/account/orders" className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase rounded">
          BACK TO MY ORDERS
        </Link>
      </div>
    );
  }

  let logs = [];
  if (order.tracking?.logs) {
    try {
      logs = JSON.parse(order.tracking.logs);
    } catch {
      logs = [];
    }
  }

  // Fallback step logs if empty
  if (logs.length === 0) {
    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    logs = [
      { status: 'Order Confirmed', time: `${formattedDate}, 10:15 AM`, location: '' },
      { status: 'Packed', time: `${formattedDate}, 06:45 PM`, location: '' },
      { status: 'Shipped', time: `${formattedDate}, 09:30 AM`, location: 'Delhi, India' },
      { status: 'In Transit', time: `${formattedDate}, 11:20 AM`, location: 'Kanpur, India' },
      { status: 'Out for Delivery', time: `${formattedDate}, 09:15 AM`, location: 'Kanpur, India' },
      { status: 'Delivered', time: `${formattedDate}, 02:35 PM`, location: 'Kanpur, India' },
    ];
  }

  const isDelivered = order.orderStatus === 'DELIVERED';
  const isReturned = order.orderStatus === 'RETURNED';
  const isReturnRequested = order.orderStatus === 'RETURN_REQUESTED';
  const isReturnStarted = order.orderStatus === 'RETURN_STARTED';
  const isReturnedAndRefunded = order.orderStatus === 'RETURNED_AND_REFUNDED';
  const canCancel = ['PENDING', 'CONFIRMED', 'PACKED'].includes(order.orderStatus);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setLoading(true);
      const res = await orderApi.cancelOrder(order.id);
      if (res.success) {
        toast.success('Order cancelled successfully!');
        fetchTracking();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2 font-medium">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>&gt;</span>
          <Link to="/account/orders" className="hover:text-ink transition-colors">My Orders</Link>
          <span>&gt;</span>
          <span className="text-ink font-bold">Order Tracking</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AccountSidebar />

          <main className="flex-1 w-full space-y-6">
            
            {/* Header */}
            <div>
              <Link
                to="/account/orders"
                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-ink hover:underline mb-3 tracking-wider"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> BACK TO ORDERS
              </Link>
              <h1 className="text-2xl font-black text-ink uppercase tracking-tight">
                ORDER TRACKING
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Order <span className="font-bold text-ink">#{order.orderNumber}</span> • Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Banner, Progress, Items */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Delivery Top Status Banner Box */}
                <div className="bg-stone/30 border border-line rounded-xl p-6 flex items-center justify-between gap-6 relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 font-black text-xl">
                      <CheckCircle2 className="w-6 h-6 fill-green-600 text-paper" />
                      <span>{isDelivered ? 'Delivered' : (order.orderStatus || '').replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Your order has been delivered on<br />
                      <span className="font-extrabold text-ink">
                        {new Date(order.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at 2:35 PM
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-3 py-1 bg-stone border border-line rounded text-[10px] font-black uppercase text-ink tracking-wider">
                        {isDelivered ? 'ORDER DELIVERED' : order.orderStatus}
                      </span>
                      {isDelivered && (
                        <button
                          onClick={() => setReturnModalOpen(true)}
                          className="bg-ink text-paper text-[10px] font-black px-3.5 py-1 rounded uppercase tracking-wider hover:bg-ink/90 transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3 h-3" /> Return / Exchange
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={handleCancelOrder}
                          className="bg-red-600 text-paper text-[10px] font-black px-3.5 py-1 rounded uppercase tracking-wider hover:bg-red-700 transition-all"
                        >
                          Cancel Order
                        </button>
                      )}
                      {(isReturned || isReturnRequested) && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded border border-amber-200 uppercase">
                          Return Requested
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Parcel Graphic */}
                  <div className="w-28 h-28 bg-amber-100/70 border border-amber-300 rounded-2xl flex items-center justify-center relative flex-shrink-0">
                    <div className="w-16 h-16 bg-amber-200 border border-amber-400 rounded-lg flex items-center justify-center font-black text-amber-900 text-base tracking-widest shadow-inner">
                      TNT
                    </div>
                    {isDelivered && (
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 text-paper rounded-full flex items-center justify-center shadow">
                        <CheckCircle2 className="w-5 h-5 fill-green-500 text-paper" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Progress Timeline */}
                <div className="border border-line rounded-xl p-6 bg-paper space-y-6">
                  <h3 className="text-xs font-black uppercase text-ink tracking-wider">
                    DELIVERY PROGRESS
                  </h3>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-green-600">
                    {logs.map((step, idx) => (
                      <div key={idx} className="relative flex items-start justify-between text-xs">
                        <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-green-600 text-paper flex items-center justify-center font-bold text-[9px] ring-4 ring-paper">
                          ✓
                        </div>
                        <div>
                          <div className="font-extrabold text-ink text-xs">{step.status}</div>
                          <div className="text-[10px] text-muted font-medium">{step.time}</div>
                        </div>
                        {step.location && (
                          <div className="text-[10px] text-muted font-semibold text-right">{step.location}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Items */}
                <div className="border border-line rounded-xl p-6 bg-paper space-y-4">
                  <h3 className="text-xs font-black uppercase text-ink tracking-wider">
                    ORDER ITEMS ({order.items?.length || 0})
                  </h3>

                  <div className="divide-y divide-line">
                    {order.items?.map((item) => {
                      const itemImg = item.product?.images?.[0]?.url || item.product?.coverImage || item.image || item.productVariant?.image || item.productVariant?.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300';
                      return (
                        <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-14 bg-stone border border-line rounded overflow-hidden flex-shrink-0">
                              <img src={itemImg} alt={item.productName} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-xs text-ink truncate">{item.productName}</p>
                              <p className="text-[10px] text-muted mt-0.5">{item.variantInfo || 'Standard'}</p>
                              <p className="text-[10px] text-muted mt-0.5">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-black text-xs text-ink">₹{(item.price || 0).toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-line pt-4 flex flex-col items-end space-y-2">
                    <div className="flex justify-between w-full max-w-xs text-xs font-bold text-ink">
                      <span>Total Paid</span>
                      <span className="font-black text-sm">₹{(order.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => navigate('/account/orders')}
                      className="w-full text-center py-2.5 border border-line rounded text-xs font-black uppercase tracking-wider text-ink hover:bg-stone transition-colors mt-2"
                    >
                      VIEW ORDER DETAILS
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Sidebar Column */}
              <div className="space-y-6">
                
                {/* Delivery Address */}
                <div className="border border-line rounded-xl p-5 bg-paper space-y-3">
                  <h3 className="text-xs font-black uppercase text-ink tracking-wider flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-ink" /> DELIVERY ADDRESS
                  </h3>
                  <div className="text-xs text-muted space-y-0.5 leading-relaxed">
                    <p className="font-extrabold text-ink">{order.address?.fullName || 'Customer Name'}</p>
                    <p>{order.address?.street}</p>
                    <p>{order.address?.city}, {order.address?.state} - {order.address?.postalCode}</p>
                    <p>{order.address?.country || 'India'}</p>
                    <p className="text-[10px] pt-1">Phone: {order.address?.phone}</p>
                  </div>
                  <button
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.address?.street + ' ' + order.address?.city)}`, '_blank')}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-line rounded text-[10px] font-black uppercase text-ink hover:bg-stone transition-colors"
                  >
                    VIEW ON MAP <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Shipping Details */}
                <div className="border border-line rounded-xl p-5 bg-paper space-y-3">
                  <h3 className="text-xs font-black uppercase text-ink tracking-wider">
                    SHIPPING DETAILS
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-line/50">
                      <span className="text-muted text-[11px]">Courier Partner</span>
                      <span className="font-extrabold text-ink">{order.tracking?.courierPartner || 'Delhivery'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted text-[11px]">Tracking ID</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-ink text-xs">
                        <span>{order.tracking?.trackingNumber || '13334566778899'}</span>
                        <button onClick={handleCopyTracking} className="p-0.5 hover:text-muted">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(`https://www.delhivery.com/track/package/${order.tracking?.trackingNumber || '13334566778899'}`, '_blank')}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-line rounded text-[10px] font-black uppercase text-ink hover:bg-stone transition-colors"
                  >
                    TRACK ON DELHIVERY <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Need Help? */}
                <div className="border border-line rounded-xl p-5 bg-paper space-y-3">
                  <h3 className="text-xs font-black uppercase text-ink tracking-wider">
                    NEED HELP?
                  </h3>
                  <div className="divide-y divide-line text-xs">
                    {[
                      { q: 'How can I return my order?' },
                      { q: 'When will I get my refund?' },
                      { q: 'I received a wrong item' },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => navigate('/contact')}
                        className="w-full flex items-center justify-between py-2.5 text-left font-bold text-ink hover:opacity-70 group"
                      >
                        <span>{item.q}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                    <button
                      onClick={() => navigate('/contact')}
                      className="w-full flex items-center gap-2 py-3 text-left group"
                    >
                      <MessageSquare className="w-4 h-4 text-ink" />
                      <div>
                        <p className="font-extrabold text-xs text-ink">Chat with us</p>
                        <p className="text-[9px] text-muted">We're online to help you</p>
                      </div>
                    </button>
                  </div>
                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full py-2 border border-line rounded text-[10px] font-black uppercase text-ink hover:bg-stone transition-colors text-center"
                  >
                    VIEW ALL FAQS
                  </button>
                </div>

              </div>

            </div>
          </main>
        </div>
      </div>

      {/* Return Request Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">Submit Return or Exchange</span>
              <button onClick={() => setReturnModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestReturn} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Return Reason *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2.5 text-xs text-ink focus:outline-none"
                >
                  <option value="Size mismatch">Size mismatch (too small or large)</option>
                  <option value="Product defect">Product defect (tear/hole/dye issue)</option>
                  <option value="Wrong item received">Wrong item received (incorrect model)</option>
                  <option value="Quality not as expected">Quality not as expected</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-2">Select Items to Return *</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-line rounded p-3 bg-stone/20">
                  {order.items?.map((item) => {
                    const isChecked = selectedItems.some(i => i.orderItemId === item.id);
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs pb-1.5 border-b border-line/30 last:border-0 last:pb-0">
                        <label className="flex items-center gap-2 font-semibold text-ink cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItemSelection(item.id, item.productVariantId, item.quantity)}
                            className="rounded border-line text-ink focus:ring-ink"
                          />
                          <span>{item.productName} ({item.variantInfo})</span>
                        </label>
                        <span className="font-mono text-muted">x{item.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingReturn}
                className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-colors"
              >
                {submittingReturn ? 'SUBMITTING REQUEST...' : 'SUBMIT RETURN REQUEST'}
              </button>
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