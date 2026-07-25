import { useState, useEffect } from 'react';
import { adminApi } from '../../api/services';
import { ShoppingBag, Truck, FileText, Printer, X, Check, Save, RefreshCw, Barcode } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'returns'
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printMode, setPrintMode] = useState(null); // 'invoice', 'pick_slip', 'shipping_label'

  // Status & Tracking form state for selected order
  const [status, setStatus] = useState('');
  const [courierPartner, setCourierPartner] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await adminApi.getOrders();
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    }
  };

  const fetchReturns = async () => {
    try {
      const res = await adminApi.getReturns();
      if (res.success && res.returns) {
        setReturns(res.returns);
      }
    } catch (err) {
      console.error('Failed to load admin returns:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchReturns()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setStatus(order.orderStatus);
    setCourierPartner(order.tracking?.courierPartner || '');
    setTrackingNumber(order.tracking?.trackingNumber || '');
    setPrintMode(null);
  };

  const handleUpdateStatus = async () => {
    try {
      const res = await adminApi.updateOrderStatus(selectedOrder.id, status);
      if (res.success) {
        toast.success('Order status updated! Customer notified by automated email.');
        fetchOrders();
        setSelectedOrder({ ...selectedOrder, orderStatus: status });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update order status');
    }
  };

  const handleUpdateTracking = async () => {
    if (!courierPartner || !trackingNumber) {
      toast.error('Both courier partner and tracking ID are required');
      return;
    }
    try {
      const res = await adminApi.updateOrderTracking(selectedOrder.id, {
        courierPartner,
        trackingNumber,
      });
      if (res.success) {
        toast.success('Courier partner and tracking ID set! Customer notified by email.');
        fetchOrders();
        setSelectedOrder({
          ...selectedOrder,
          tracking: { ...selectedOrder.tracking, courierPartner, trackingNumber },
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update tracking');
    }
  };

  const handleModerateReturn = async (id, newStatus) => {
    try {
      const res = await adminApi.updateReturnRequest(id, newStatus);
      if (res.success) {
        toast.success(`Return status marked as ${newStatus}!`);
        fetchReturns();
        fetchOrders(); // Refresh stock metrics or totals
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update return status');
    }
  };

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6 print:p-0">
      {/* Tabs Header (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink">TNT WAREHOUSE & FULFILLMENT DESK</h1>
          <p className="text-xs text-muted">Manage shipping labels, pick slips, tracking codes, and customer returns/refunds.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-stone p-1.5 rounded-lg border border-line">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${
              activeTab === 'orders' ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            ACTIVE ORDERS
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${
              activeTab === 'returns' ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            RETURN REQUESTS
          </button>
        </div>
      </div>

      {/* Orders View */}
      {activeTab === 'orders' && (
        <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs print:hidden">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <ShoppingBag className="w-12 h-12 mx-auto text-line mb-3 animate-bounce" />
              <span className="font-extrabold text-xs uppercase text-ink block">No Active Shipments</span>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total Paid</th>
                  <th className="p-4">Order Date</th>
                  <th className="p-4">Delivery Date</th>
                  <th className="p-4">Courier Partner</th>
                  <th className="p-4">Tracking ID</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => handleSelectOrder(o)}
                    className="hover:bg-stone/50 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-extrabold text-ink">{o.orderNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-ink">{o.user?.firstName} {o.user?.lastName || ''}</div>
                      <div className="text-[10px] text-muted font-mono">{o.user?.email}</div>
                    </td>
                    <td className="p-4 font-bold text-ink">₹{o.totalAmount.toLocaleString()}</td>
                    <td className="p-4 text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-muted">
                      {o.tracking?.deliveredAt ? new Date(o.tracking.deliveredAt).toLocaleDateString() : 'Pending'}
                    </td>
                    <td className="p-4 text-muted">{o.tracking?.courierPartner || '-'}</td>
                    <td className="p-4 font-mono text-muted">{o.tracking?.trackingNumber || '-'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                        {o.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Returns view */}
      {activeTab === 'returns' && (
        <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs print:hidden">
          {returns.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <RefreshCw className="w-12 h-12 mx-auto text-line mb-3 animate-spin" />
              <span className="font-extrabold text-xs uppercase text-ink block">No Return Requests Raised</span>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items to Return</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Request Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-stone/50">
                    <td className="p-4 font-extrabold text-ink">#{r.order?.orderNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-ink">{r.user?.firstName} {r.user?.lastName || ''}</div>
                      <div className="text-[10px] text-muted">{r.user?.email}</div>
                    </td>
                    <td className="p-4">
                      {r.items?.map((item) => (
                        <div key={item.id} className="font-semibold text-ink">
                          {item.productVariant?.product?.name} ({item.quantity} units)
                        </div>
                      ))}
                    </td>
                    <td className="p-4 font-medium text-muted">{r.reason}</td>
                    <td className="p-4 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                        r.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleModerateReturn(r.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-ink text-paper text-[10px] font-bold uppercase rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleModerateReturn(r.id, 'REJECTED')}
                            className="px-2.5 py-1 border border-line text-[10px] font-bold uppercase rounded text-red-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <button
                          onClick={() => handleModerateReturn(r.id, 'COMPLETED')}
                          className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded hover:bg-emerald-700"
                        >
                          Process Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invoice & Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:relative print:bg-transparent print:p-0 print:z-0">
          <div className="bg-paper rounded-xl p-6 max-w-4xl w-full border border-line shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto print:border-none print:shadow-none print:p-0 print:max-h-none print:overflow-visible">
            
            {/* Modal Header (Hidden during Print) */}
            <div className="flex justify-between items-start border-b border-line pb-3 print:hidden">
              <div>
                <h3 className="font-extrabold text-ink text-base uppercase">ORDER DESK — #{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-muted">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint('invoice')}
                  className="px-3 py-1.5 border border-line text-xs font-bold rounded text-ink flex items-center gap-1 hover:bg-stone transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Bill
                </button>
                <button
                  onClick={() => handlePrint('pick_slip')}
                  className="px-3 py-1.5 border border-line text-xs font-bold rounded text-ink flex items-center gap-1 hover:bg-stone transition-all"
                >
                  <FileText className="w-3.5 h-3.5" /> Pick Slip
                </button>
                <button
                  onClick={() => handlePrint('shipping_label')}
                  className="px-3 py-1.5 border border-line text-xs font-bold rounded text-ink flex items-center gap-1 hover:bg-stone transition-all"
                >
                  <Barcode className="w-3.5 h-3.5" /> Shipping Label
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-1.5 text-muted hover:text-ink">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Mode Selector Layouts */}

            {/* A. Standard Invoice view (Used as default or printMode === 'invoice') */}
            {(!printMode || printMode === 'invoice') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4">
                {/* Left Column: Customer & Delivery Address details */}
                <div className="space-y-4">
                  <div className="p-4 bg-stone border border-line rounded-lg print:bg-transparent">
                    <h4 className="font-extrabold text-[10px] text-muted uppercase tracking-wider mb-2">Customer Profile</h4>
                    <div className="text-sm font-bold text-ink">
                      {selectedOrder.user?.firstName} {selectedOrder.user?.lastName || ''}
                    </div>
                    <div className="text-xs text-muted font-mono">{selectedOrder.user?.email}</div>
                    <div className="text-xs text-muted">{selectedOrder.user?.phone || 'No phone number'}</div>
                  </div>

                  <div className="p-4 bg-stone border border-line rounded-lg print:bg-transparent">
                    <h4 className="font-extrabold text-[10px] text-muted uppercase tracking-wider mb-2">Shipping Address</h4>
                    <div className="text-xs text-ink space-y-1">
                      <p className="font-semibold">{selectedOrder.address?.fullName}</p>
                      <p>{selectedOrder.address?.street}</p>
                      <p>{selectedOrder.address?.locality}</p>
                      <p>
                        {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.postalCode}
                      </p>
                      <p>{selectedOrder.address?.country}</p>
                      <p className="pt-1.5 text-[10px] text-muted">Phone: {selectedOrder.address?.phone}</p>
                    </div>
                  </div>

                  {/* Status & Courier update controls (Hidden when printing) */}
                  <div className="p-4 border border-line rounded-lg space-y-4 print:hidden">
                    <h4 className="font-extrabold text-[10px] text-muted uppercase tracking-wider">Fulfillment Actions</h4>

                    {/* Manage Status */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-ink uppercase">Order Status</label>
                      <div className="flex gap-2">
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="flex-1 bg-stone border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PACKED">PACKED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="IN_TRANSIT">IN TRANSIT</option>
                          <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                        <button
                          onClick={handleUpdateStatus}
                          className="px-3.5 py-1.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90 flex items-center gap-1 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                      </div>
                    </div>

                    {/* Courier Partner & Tracking ID */}
                    <div className="space-y-2 pt-2 border-t border-line">
                      <label className="block text-[10px] font-bold text-ink uppercase">Assign Courier Details</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Courier (e.g. Delhivery)"
                          value={courierPartner}
                          onChange={(e) => setCourierPartner(e.target.value)}
                          className="bg-stone border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Tracking Number"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className="bg-stone border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleUpdateTracking}
                        className="w-full mt-1.5 py-2 border border-line text-xs font-bold uppercase rounded hover:bg-stone flex items-center justify-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Tracking Information
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Order items bill list */}
                <div className="p-4 bg-stone border border-line rounded-lg flex flex-col justify-between print:bg-transparent print:border-none print:p-0">
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-[10px] text-muted uppercase tracking-wider border-b border-line pb-2">Order Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs pb-2 border-b border-line/40">
                          <div>
                            <p className="font-bold text-ink">{item.productName}</p>
                            <p className="text-[10px] text-muted">{item.variantInfo} x{item.quantity}</p>
                          </div>
                          <span className="font-bold text-ink">₹{item.totalPrice.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 space-y-2.5 border-t border-line mt-6">
                    <div className="flex justify-between text-xs text-muted">
                      <span>Subtotal</span>
                      <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                        <span>Discount</span>
                        <span>-₹{selectedOrder.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedOrder.shippingFee > 0 && (
                      <div className="flex justify-between text-xs text-muted">
                        <span>Shipping Fee</span>
                        <span>₹{selectedOrder.shippingFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-ink pt-2 border-t border-line/60">
                      <span>Total Amount</span>
                      <span>₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* B. Warehouse Pick Slip View */}
            {printMode === 'pick_slip' && (
              <div className="space-y-6">
                <div className="text-center border-b border-ink pb-3">
                  <h2 className="font-extrabold text-lg tracking-wider text-ink">TNT LUXURY WAREHOUSE PICKING LIST</h2>
                  <p className="text-xs text-muted">Order ID: #{selectedOrder.orderNumber} | Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
                
                <table className="w-full text-xs border border-line text-left">
                  <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
                    <tr>
                      <th className="p-3">Item Variant SKU</th>
                      <th className="p-3">Product Name / Spec</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3 text-right">Picked Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-stone/20">
                        <td className="p-3 font-mono font-bold text-ink">{item.variantInfo}</td>
                        <td className="p-3">{item.productName}</td>
                        <td className="p-3 font-extrabold text-ink">{item.quantity} units</td>
                        <td className="p-3 text-right">
                          <div className="w-5 h-5 border-2 border-ink rounded ml-auto flex items-center justify-center font-bold text-[9px] text-ink">[ ]</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* C. Shipping Label View */}
            {printMode === 'shipping_label' && (
              <div className="max-w-md mx-auto border-4 border-ink p-6 rounded-lg space-y-4 font-mono text-xs text-ink bg-paper">
                <div className="flex justify-between items-start border-b-2 border-ink pb-3">
                  <div>
                    <h2 className="font-extrabold text-base tracking-tight uppercase text-ink">DELHIVERY</h2>
                    <span className="text-[10px] text-muted font-bold">Standard shipping</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold uppercase">TNT LUXURY</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-[9px] text-muted uppercase">SHIPPING ADDRESS:</span>
                  <p className="font-bold">{selectedOrder.address?.fullName}</p>
                  <p>{selectedOrder.address?.street}</p>
                  <p>{selectedOrder.address?.locality}</p>
                  <p>{selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.postalCode}</p>
                  <p className="font-bold">Phone: {selectedOrder.address?.phone}</p>
                </div>

                {/* Simulated barcode */}
                <div className="py-4 border-y border-ink text-center space-y-1">
                  <div className="h-10 bg-gradient-to-r from-ink via-paper to-ink w-full border border-ink/40 flex items-center justify-center opacity-90">
                    {/* Simulated barcode lines */}
                    <div className="flex w-full h-full">
                      {[...Array(30)].map((_, i) => (
                        <div key={i} className="flex-1 bg-ink" style={{ marginRight: `${i % 3 === 0 ? '4px' : '2px'}` }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold block tracking-widest">{selectedOrder.tracking?.trackingNumber || 'TNT1233455677'}</span>
                </div>

                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span>Order: #{selectedOrder.orderNumber}</span>
                  <span>COD: ₹0.00 (PAID)</span>
                </div>
              </div>
            )}

            {/* Print Only Bill Footer */}
            {(!printMode || printMode === 'invoice') && (
              <div className="hidden print:block text-[10px] text-center text-muted border-t border-line pt-6 mt-12">
                <p className="font-bold text-ink">Thank you for shopping with TNT LUXURY STREETWEAR</p>
                <p>For support, contact hello@tntclothing.com | +91 98765 43210</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
