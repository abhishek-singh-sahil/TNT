import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AccountSidebar from '../components/layout/AccountSidebar';
import TrustStrip from '../components/common/TrustStrip';
import { ArrowLeft, CheckCircle2, MapPin, Truck, Copy, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { orderApi } from '../api/services';
import toast from 'react-hot-toast';

export default function OrderTracking() {
  const { id } = useParams(); // Can be orderId or orderNumber
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Return request modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Size mismatch');
  const [selectedItems, setSelectedItems] = useState([]); // Array of { orderItemId, productVariantId, quantity }
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
        fetchTracking(); // Refresh details
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

  // Parse logs if present
  let logs = [];
  if (order.tracking?.logs) {
    try {
      logs = JSON.parse(order.tracking.logs);
    } catch {
      logs = [];
    }
  }

  const isDelivered = order.orderStatus === 'DELIVERED';
  const isReturned = order.orderStatus === 'RETURNED';

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <Link to="/account/orders" className="hover:text-ink">My Orders</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Order Tracking</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          <AccountSidebar />

          <main className="flex-1">
            <Link
              to="/account/orders"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase text-ink hover:underline mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
            </Link>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink uppercase tracking-tight">
                ORDER TRACKING
              </h1>
              <p className="text-xs text-muted mt-1">
                Order <span className="font-bold text-ink">#{order.orderNumber}</span> • Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Timeline & Items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Delivery Top Banner Box */}
                <div className="bg-stone border border-line rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 text-emerald-600 font-extrabold text-lg uppercase tracking-tight">
                      <CheckCircle2 className="w-6 h-6 fill-emerald-600 text-paper" /> {order.orderStatus}
                    </div>
                    <p className="text-xs text-muted">
                      Status timeline for your package shipment.<br />
                      Last update: <span className="font-semibold text-ink">{new Date(order.updatedAt).toLocaleDateString()}</span>
                    </p>
                    <div className="pt-2 flex gap-2">
                      {isDelivered && (
                        <button
                          onClick={() => setReturnModalOpen(true)}
                          className="bg-ink text-paper text-xs font-bold px-4.5 py-2.5 rounded uppercase tracking-wider hover:bg-ink/90 transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-4 h-4" /> Request Return/Exchange
                        </button>
                      )}
                      {isReturned && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded border border-amber-200">
                          RETURN REQUEST PENDING
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Graphic Widget */}
                  <div className="w-28 h-28 bg-amber-100 border-2 border-amber-300 rounded-xl flex items-center justify-center shadow-md shrink-0 relative">
                    <div className="w-16 h-16 bg-amber-200 border border-amber-400 rounded-lg flex items-center justify-center font-extrabold text-amber-900 text-xl tracking-widest shadow-inner">
                      TNT
                    </div>
                    {isDelivered && (
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Progress Steps */}
                {logs.length > 0 && (
                  <div className="bg-paper border border-line rounded-lg p-6">
                    <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider mb-6">
                      DELIVERY PROGRESS
                    </h3>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500">
                      {logs.map((step, idx) => (
                        <div key={idx} className="relative flex items-start justify-between text-xs">
                          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-paper flex items-center justify-center font-bold text-[10px] ring-4 ring-paper">
                            ✓
                          </div>
                          <div>
                            <div className="font-bold text-ink text-sm uppercase">{step.status}</div>
                            <div className="text-muted">{step.time}</div>
                          </div>
                          {step.location && (
                            <div className="text-muted font-medium text-right">{step.location}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Items Summary */}
                <div className="bg-paper border border-line rounded-lg p-6">
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider mb-4">
                    ORDER ITEMS ({order.items?.length || 0})
                  </h3>

                  <div className="divide-y divide-line">
                    {order.items?.map((item) => (
                      <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-16 object-cover rounded bg-stone border border-line flex items-center justify-center">
                            <Truck className="w-6 h-6 text-muted" />
                          </div>
                          <div>
                            <div className="font-bold text-ink text-sm">{item.productName}</div>
                            <div className="text-xs text-muted">{item.variantInfo}</div>
                            <div className="text-xs text-muted">Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="font-extrabold text-ink text-sm">₹{item.price.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-line pt-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-ink">Total Paid</span>
                    <span className="text-base font-extrabold text-ink">
                      ₹{order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Address & Shipping */}
              <div className="space-y-6">
                <div className="bg-paper border border-line rounded-lg p-5">
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-ink" /> DELIVERY ADDRESS
                  </h3>
                  <div className="text-xs text-ink space-y-1">
                    <p className="font-bold text-sm">{order.address?.fullName}</p>
                    <p>{order.address?.street}</p>
                    <p>{order.address?.city}, {order.address?.state} - {order.address?.postalCode}</p>
                    <p>{order.address?.country}</p>
                    <p className="text-muted pt-1">Phone: {order.address?.phone}</p>
                  </div>
                </div>

                <div className="bg-paper border border-line rounded-lg p-5">
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider mb-4 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-ink" /> SHIPPING DETAILS
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-line pb-2">
                      <span className="text-muted">Courier Partner</span>
                      <span className="font-bold text-ink">{order.tracking?.courierPartner || 'Pending'}</span>
                    </div>
                    {order.tracking?.trackingNumber && (
                      <div className="flex justify-between items-center border-b border-line pb-2">
                        <span className="text-muted">Tracking ID</span>
                        <span className="font-mono font-bold text-ink flex items-center gap-1">
                          {order.tracking.trackingNumber}
                          <button onClick={handleCopyTracking} className="p-0.5 hover:text-muted">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Return/Exchange Request Modal */}
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
