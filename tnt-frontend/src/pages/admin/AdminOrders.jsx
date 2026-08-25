import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi, productApi } from '../../api/services';
import {
  ShoppingBag, Search, Download, Calendar, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Truck, CheckCircle, XCircle, Clock, Package,
  MoreVertical, X, RefreshCw, MapPin, Phone, Mail, User, Printer,
  Plus, Edit2, Eye, AlertCircle, Send, Barcode, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import ActionMenu from '../../components/common/ActionMenu';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtC = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ORDER_STATUS_CONFIG = {
  PENDING:          { label: 'Pending',          cls: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400' },
  CONFIRMED:        { label: 'Confirmed',         cls: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-400' },
  PACKED:           { label: 'Processing',        cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-400' },
  SHIPPED:          { label: 'Shipped',           cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-400' },
  IN_TRANSIT:       { label: 'In Transit',        cls: 'bg-cyan-50 text-cyan-700 border-cyan-200',    dot: 'bg-cyan-400' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400' },
  DELIVERED:        { label: 'Delivered',         cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-400' },
  CANCELLED:        { label: 'Cancelled',         cls: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-400' },
  RETURNED:         { label: 'Returned',          cls: 'bg-rose-50 text-rose-700 border-rose-200',    dot: 'bg-rose-400' },
};

const PAY_STATUS_CONFIG = {
  SUCCESS:  { label: 'Paid',     cls: 'text-green-600 font-bold' },
  PENDING:  { label: 'Pending',  cls: 'text-amber-600 font-bold' },
  FAILED:   { label: 'Failed',   cls: 'text-red-600 font-bold' },
  REFUNDED: { label: 'Refunded', cls: 'text-slate-500 font-bold' },
};

const ALL_STATUSES = ['PENDING','CONFIRMED','PACKED','SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','RETURNED'];

const VALID_TRANSITIONS = {
  PENDING:          ['CONFIRMED','CANCELLED'],
  CONFIRMED:        ['PACKED','CANCELLED'],
  PACKED:           ['SHIPPED','CANCELLED'],
  SHIPPED:          ['IN_TRANSIT','CANCELLED'],
  IN_TRANSIT:       ['OUT_FOR_DELIVERY','CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        [],
  CANCELLED:        [],
  RETURNED:         [],
};

// ── Date range ────────────────────────────────────────────────────────────────
function getDateRange(option, customStart, customEnd) {
  const now = new Date();
  let start, end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (option === 'today')       start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (option === 'yesterday') { start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999); }
  else if (option === 'last-7') start = new Date(now.getTime() - 7 * 864e5);
  else if (option === 'last-30') start = new Date(now.getTime() - 30 * 864e5);
  else if (option === 'this-month') start = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (option === 'last-month') { start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); }
  else if (option === 'custom') { if (customStart) start = new Date(customStart); if (customEnd) { end = new Date(customEnd); end.setHours(23, 59, 59, 999); } }
  else start = null;
  return { startDate: start?.toISOString(), endDate: end?.toISOString() };
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = ORDER_STATUS_CONFIG[status] || { label: status, cls: 'bg-stone text-muted border-line', dot: 'bg-muted' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, label, value, change }) {
  const up = change === null ? null : change >= 0;
  return (
    <div className="bg-paper border border-line rounded-xl p-4 flex gap-3 items-start shadow-xs hover:shadow-sm transition-shadow">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase text-muted tracking-wider leading-none">{label}</p>
        <p className="text-2xl font-black text-ink leading-tight mt-0.5">{value}</p>
        {change !== null && change !== undefined ? (
          <p className={`text-[10px] font-bold flex items-center gap-0.5 mt-1 ${up ? 'text-green-600' : 'text-red-500'}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}% vs. last period
          </p>
        ) : <p className="text-[10px] text-muted mt-1">— No previous data</p>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminOrders() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [tabCounts, setTabCounts] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [dateOption, setDateOption] = useState('this-month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 8;

  // Details panel
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Status update
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Tracking
  const [courierPartner, setCourierPartner] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showTrackingForm, setShowTrackingForm] = useState(false);

  // Create order
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', content: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Bulk
  const [selectedIds, setSelectedIds] = useState([]);

  // Action menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Search debounce
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── Date params ───────────────────────────────────────────────────────────
  const dateParams = getDateRange(dateOption, customStart, customEnd);

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // ── Fetch Stats + Tab counts ──────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        adminApi.getOrderStats(dateParams),
        adminApi.getOrderTabCounts(dateParams)
      ]);
      if (sRes.success) setStats(sRes.stats);
      if (tRes.success) setTabCounts(tRes.counts);
    } catch (e) { console.error(e); }
    finally { setStatsLoading(false); }
  }, [dateOption, customStart, customEnd]);

  // ── Fetch Orders ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (resetPage = false) => {
    setLoading(true);
    setSelectedIds([]);
    const activePage = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    try {
      const params = {
        page: activePage, limit,
        search: debouncedSearch,
        status: activeTab === 'all' ? 'all' : activeTab,
        payment: paymentFilter,
        sort,
        ...dateParams
      };
      const r = await adminApi.getOrders(params);
      if (r.success) {
        setOrders(r.orders);
        setTotalPages(r.pagination.totalPages || 1);
        setTotalCount(r.pagination.total || 0);
      }
    } catch (e) { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, activeTab, paymentFilter, sort, dateOption, customStart, customEnd]);

  useEffect(() => { fetchStats(); }, [dateOption, customStart, customEnd]);
  useEffect(() => { fetchOrders(true); }, [debouncedSearch, activeTab, paymentFilter, sort, dateOption, customStart, customEnd]);
  useEffect(() => { fetchOrders(false); }, [page]);

  // ── Open Details ──────────────────────────────────────────────────────────
  const openDetails = async (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setCourierPartner(order.tracking?.courierPartner || '');
    setTrackingNumber(order.tracking?.trackingNumber || '');
    setShowTrackingForm(false);
    setDetailLoading(true);
    setShowMobileDetail(true);
    try {
      const r = await adminApi.getOrderById(order.id);
      if (r.success) setDetailOrder(r.order);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  // ── Status update ─────────────────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === detailOrder?.orderStatus) {
      toast.error('Please select a different status');
      return;
    }

    if (newStatus === 'SHIPPED' && (!courierPartner || !trackingNumber)) {
      toast.error('Both Courier Partner and Tracking Number are required for shipping');
      return;
    }

    setUpdatingStatus(true);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'SHIPPED') {
        payload.courierPartner = courierPartner;
        payload.trackingNumber = trackingNumber;
      }
      const r = await adminApi.updateOrderStatus(selectedOrder.id, payload);
      if (r.success) {
        toast.success('Order status updated! Customer notified by email.');
        fetchOrders(false);
        fetchStats();
        openDetails({ ...selectedOrder, orderStatus: newStatus });
      }
    } catch (e) { toast.error(e.message || 'Failed to update status'); }
    finally { setUpdatingStatus(false); }
  };

  // ── Tracking update ───────────────────────────────────────────────────────
  const handleUpdateTracking = async () => {
    if (!courierPartner || !trackingNumber) { toast.error('Both courier and tracking number required'); return; }
    try {
      const r = await adminApi.updateOrderTracking(selectedOrder.id, { courierPartner, trackingNumber });
      if (r.success) {
        toast.success('Tracking info updated! Customer notified.');
        fetchOrders(false);
        setShowTrackingForm(false);
      }
    } catch (e) { toast.error(e.message || 'Failed to update tracking'); }
  };

  // ── Send Email ────────────────────────────────────────────────────────────
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject || !emailForm.content) { toast.error('Subject and content required'); return; }
    setSendingEmail(true);
    try {
      const r = await adminApi.sendBlastEmail({ userId: selectedOrder.user?.id, ...emailForm });
      if (r.success) { toast.success('Email sent!'); setShowEmailModal(false); }
    } catch (e) { toast.error(e.message || 'Failed to send email'); }
    finally { setSendingEmail(false); }
  };

  // ── Cancel Order ──────────────────────────────────────────────────────────
  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    setUpdatingStatus(true);
    try {
      const r = await adminApi.updateOrderStatus(selectedOrder.id, 'CANCELLED');
      if (r.success) {
        toast.success('Order cancelled. Customer notified.');
        fetchOrders(false);
        fetchStats();
        openDetails({ ...selectedOrder, orderStatus: 'CANCELLED' });
      }
    } catch (e) { toast.error(e.message || 'Failed to cancel order'); }
    finally { setUpdatingStatus(false); }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const url = adminApi.exportOrdersUrl({
      search: debouncedSearch, status: activeTab, payment: paymentFilter, ...dateParams
    });
    window.open(url, '_blank');
    toast.success('CSV export started');
  };

  // ── Print invoice ─────────────────────────────────────────────────────────
  const handlePrint = () => { setTimeout(() => window.print(), 200); };

  // ── Bulk ──────────────────────────────────────────────────────────────────
  const toggleAll = (e) => setSelectedIds(e.target.checked ? orders.map(o => o.id) : []);
  const toggleRow = (e, id) => setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const TABS = [
    { key: 'all',        label: 'All Orders',  count: tabCounts.all },
    { key: 'pending',    label: 'Pending',      count: tabCounts.pending },
    { key: 'processing', label: 'Processing',   count: tabCounts.processing },
    { key: 'shipped',    label: 'Shipped',      count: tabCounts.shipped },
    { key: 'delivered',  label: 'Delivered',    count: tabCounts.delivered },
    { key: 'cancelled',  label: 'Cancelled',    count: tabCounts.cancelled },
  ];

  const allowedNext = VALID_TRANSITIONS[detailOrder?.orderStatus] || [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-12 print:p-0">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-line pb-5 print:hidden">
        <div>
          <h1 className="text-xl font-black tracking-tight text-ink flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-muted" /> Order Management
          </h1>
          <p className="text-xs text-muted mt-0.5">Track, manage and update customer orders in real time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start">
          {/* Date range */}
          <div className="relative flex items-center bg-paper border border-line rounded-lg px-3 py-2 text-xs font-bold text-ink gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted flex-shrink-0" />
            <select
              value={dateOption}
              onChange={e => { setDateOption(e.target.value); setShowCustomDate(e.target.value === 'custom'); }}
              className="bg-transparent focus:outline-none appearance-none pr-4 cursor-pointer"
            >
              <option value="this-month">This Month</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last-7">Last 7 Days</option>
              <option value="last-30">Last 30 Days</option>
              <option value="last-month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <span className="pointer-events-none absolute right-3 text-muted text-[10px]">▼</span>
          </div>
          {showCustomDate && (
            <div className="flex items-center gap-1.5 bg-stone border border-line px-3 py-1.5 rounded-lg text-xs">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-transparent text-ink text-[11px] font-bold focus:outline-none" />
              <span className="text-muted">–</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-transparent text-ink text-[11px] font-bold focus:outline-none" />
            </div>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-bold rounded-lg hover:bg-ink/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Create Order
          </button>
        </div>
      </div>

      {/* ── Statistics Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 print:hidden">
        <StatCard icon={<ShoppingBag className="w-4 h-4 text-blue-500" />}   iconBg="bg-blue-50 border-blue-100"   label="Total Orders"     value={statsLoading ? '...' : fmt(stats.totalOrders)}     change={stats.totalOrdersChange ?? null} />
        <StatCard icon={<Clock className="w-4 h-4 text-amber-500" />}        iconBg="bg-amber-50 border-amber-100" label="Pending Orders"    value={statsLoading ? '...' : fmt(stats.pendingOrders)}   change={stats.pendingOrdersChange ?? null} />
        <StatCard icon={<Truck className="w-4 h-4 text-indigo-500" />}       iconBg="bg-indigo-50 border-indigo-100" label="Shipped Orders"   value={statsLoading ? '...' : fmt(stats.shippedOrders)}   change={stats.shippedOrdersChange ?? null} />
        <StatCard icon={<CheckCircle className="w-4 h-4 text-green-500" />}  iconBg="bg-green-50 border-green-100"  label="Delivered Orders"  value={statsLoading ? '...' : fmt(stats.deliveredOrders)} change={stats.deliveredOrdersChange ?? null} />
        <StatCard icon={<XCircle className="w-4 h-4 text-red-400" />}        iconBg="bg-red-50 border-red-100"     label="Cancelled Orders"  value={statsLoading ? '...' : fmt(stats.cancelledOrders)} change={stats.cancelledOrdersChange ?? null} />
      </div>

      {/* ── Main Layout ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start print:block">

        {/* ── LEFT: Orders Table ──────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-3 print:hidden">

          {/* Filters */}
          <div className="bg-paper border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-xs">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
              <div className="relative flex-1 min-w-0 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search orders, customers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-stone border border-line rounded-lg pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-ink/30"
                />
              </div>
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none min-w-[110px]">
                <option value="all">All Payment</option>
                <option value="online">Online</option>
                <option value="cod">COD</option>
              </select>
              <select value={sort} onChange={e => setSort(e.target.value)} className="bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none min-w-[120px]">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 border border-line rounded-lg text-xs font-bold text-ink hover:bg-stone transition-colors whitespace-nowrap">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Status Tabs */}
          <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs">
            <div className="flex overflow-x-auto border-b border-line bg-stone/30">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.key ? 'border-ink text-ink bg-paper' : 'border-transparent text-muted hover:text-ink'}`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${activeTab === tab.key ? 'bg-ink text-paper' : 'bg-stone text-muted'}`}>
                      {fmt(tab.count)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-7 h-7 animate-spin text-muted mx-auto mb-3" />
                <p className="text-xs text-muted">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <Package className="w-10 h-10 mx-auto text-line" />
                <h3 className="font-extrabold text-xs text-ink">No Orders Found</h3>
                <p className="text-[10px] text-muted">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-stone/40 text-[10px] text-muted font-bold border-b border-line">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" checked={selectedIds.length === orders.length && orders.length > 0} onChange={toggleAll} className="rounded" />
                      </th>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {orders.map(o => {
                      const isSelected = selectedOrder?.id === o.id;
                      const isChecked  = selectedIds.includes(o.id);
                      const payMethod  = o.payment?.paymentMethod || '';
                      const isCod      = payMethod.toUpperCase().includes('COD');
                      const payStatusCfg = PAY_STATUS_CONFIG[o.paymentStatus] || { label: o.paymentStatus, cls: 'text-muted' };
                      return (
                        <tr
                          key={o.id}
                          onClick={() => openDetails(o)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-stone/30' : 'hover:bg-stone/10'}`}
                        >
                          <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isChecked} onChange={e => toggleRow(e, o.id)} className="rounded" />
                          </td>
                          <td className="px-4 py-3.5 font-extrabold text-ink">#{o.orderNumber}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-ink">{o.user?.firstName} {o.user?.lastName || ''}</div>
                            <div className="text-[10px] text-muted font-mono truncate max-w-[140px]">{o.user?.email}</div>
                          </td>
                          <td className="px-4 py-3.5 text-muted whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                          <td className="px-4 py-3.5 font-bold text-ink">{fmtC(o.totalAmount)}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-ink">{isCod ? 'COD' : 'Online'}</div>
                            <div className={`text-[10px] ${payStatusCfg.cls}`}>{payStatusCfg.label}</div>
                          </td>
                          <td className="px-4 py-3.5"><StatusBadge status={o.orderStatus} /></td>
                          <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                            <ActionMenu
                              trigger={
                                <button className="p-1.5 rounded border border-line text-muted hover:text-ink hover:bg-stone transition-colors">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                              }
                              items={[
                                {
                                  label: 'View Details',
                                  icon: <Eye className="w-3.5 h-3.5" />,
                                  onClick: () => openDetails(o)
                                },
                                {
                                  label: 'Contact Customer',
                                  icon: <Mail className="w-3.5 h-3.5" />,
                                  onClick: () => { openDetails(o); setShowEmailModal(true); }
                                },
                                {
                                  label: 'Print Invoice',
                                  icon: <Printer className="w-3.5 h-3.5" />,
                                  onClick: () => { openDetails(o); setTimeout(handlePrint, 500); }
                                },
                                ...(o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'RETURNED' ? [
                                  { divider: true },
                                  {
                                    label: 'Cancel Order',
                                    icon: <XCircle className="w-3.5 h-3.5" />,
                                    danger: true,
                                    onClick: () => {
                                      openDetails(o);
                                      if (!window.confirm('Cancel this order?')) return;
                                      adminApi.updateOrderStatus(o.id, 'CANCELLED').then(r => {
                                        if (r.success) {
                                          toast.success('Order cancelled');
                                          fetchOrders(false);
                                          fetchStats();
                                        }
                                      });
                                    }
                                  }
                                ] : [])
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-paper border-2 border-ink rounded-xl p-4 flex items-center justify-between shadow-lg">
              <span className="text-xs font-bold text-ink">{selectedIds.length} orders selected</span>
              <button onClick={handleExport} className="px-3 py-1.5 border border-line text-ink text-[10px] font-bold uppercase rounded-lg hover:bg-stone transition-colors">Export Selected</button>
            </div>
          )}

          {/* Pagination */}
          {!loading && orders.length > 0 && (
            <div className="flex items-center justify-between text-xs font-semibold text-ink pt-1">
              <span className="text-muted">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {fmt(totalCount)} orders</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-line rounded-lg hover:bg-stone disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  let pNum;
                  if (totalPages <= 7) pNum = i + 1;
                  else if (page <= 4) pNum = i + 1;
                  else if (page >= totalPages - 3) pNum = totalPages - 6 + i;
                  else pNum = page - 3 + i;
                  if (pNum < 1 || pNum > totalPages) return null;
                  return (
                    <button key={pNum} onClick={() => setPage(pNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${page === pNum ? 'bg-ink text-paper border-ink' : 'border-line hover:bg-stone'}`}>
                      {pNum}
                    </button>
                  );
                })}
                {totalPages > 7 && page < totalPages - 3 && <span className="text-muted px-1">…</span>}
                {totalPages > 7 && <button onClick={() => setPage(totalPages)} className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${page === totalPages ? 'bg-ink text-paper border-ink' : 'border-line hover:bg-stone'}`}>{totalPages}</button>}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-line rounded-lg hover:bg-stone disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Order Details Panel (Desktop) ────────────────────────── */}
        <div className="hidden xl:block bg-paper border border-line rounded-2xl overflow-hidden shadow-xs sticky top-4 print:hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line print:hidden">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Order Details</span>
            {detailOrder && (
              <div className="flex gap-1.5">
                <button onClick={handlePrint} className="p-1.5 border border-line rounded-lg text-muted hover:text-ink hover:bg-stone transition-colors" title="Print invoice"><Printer className="w-3.5 h-3.5" /></button>
                <button onClick={() => { setSelectedOrder(null); setDetailOrder(null); }} className="p-1.5 border border-line rounded-lg text-muted hover:text-ink hover:bg-stone"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {detailLoading ? (
            <div className="py-24 text-center"><RefreshCw className="w-6 h-6 animate-spin text-muted mx-auto" /></div>
          ) : !detailOrder ? (
            <div className="py-24 text-center space-y-2 px-5">
              <Package className="w-9 h-9 mx-auto text-line" />
              <p className="text-[10px] font-bold uppercase text-muted">Select an order</p>
              <p className="text-[10px] text-muted">Click any row to view full details.</p>
            </div>
          ) : (
            <OrderDetailContent
              order={detailOrder}
              newStatus={newStatus}
              setNewStatus={setNewStatus}
              allowedNext={allowedNext}
              updatingStatus={updatingStatus}
              handleUpdateStatus={handleUpdateStatus}
              handleCancelOrder={handleCancelOrder}
              courierPartner={courierPartner}
              setCourierPartner={setCourierPartner}
              trackingNumber={trackingNumber}
              setTrackingNumber={setTrackingNumber}
              showTrackingForm={showTrackingForm}
              setShowTrackingForm={setShowTrackingForm}
              handleUpdateTracking={handleUpdateTracking}
              onContactCustomer={() => { setShowEmailModal(true); }}
            />
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Sheet: Order Details ──────────────────────────── */}
      {showMobileDetail && selectedOrder && (
        <div className="fixed inset-0 z-50 xl:hidden bg-black/60 backdrop-blur-xs flex items-end">
          <div className="bg-paper rounded-t-2xl w-full max-h-[92vh] flex flex-col shadow-2xl">
            <div className="w-12 h-1.5 bg-line rounded-full mx-auto my-3 flex-shrink-0" />
            <div className="flex justify-between items-center px-5 pb-3 border-b border-line flex-shrink-0">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Order Details</span>
              <div className="flex gap-1.5">
                <button onClick={handlePrint} className="p-1.5 border border-line rounded-lg text-muted"><Printer className="w-4 h-4" /></button>
                <button onClick={() => setShowMobileDetail(false)} className="p-1.5 border border-line rounded-lg text-muted"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 pb-6">
              {detailLoading ? (
                <div className="py-16 text-center"><RefreshCw className="w-6 h-6 animate-spin text-muted mx-auto" /></div>
              ) : detailOrder ? (
                <OrderDetailContent
                  order={detailOrder}
                  newStatus={newStatus}
                  setNewStatus={setNewStatus}
                  allowedNext={allowedNext}
                  updatingStatus={updatingStatus}
                  handleUpdateStatus={handleUpdateStatus}
                  handleCancelOrder={handleCancelOrder}
                  courierPartner={courierPartner}
                  setCourierPartner={setCourierPartner}
                  trackingNumber={trackingNumber}
                  setTrackingNumber={setTrackingNumber}
                  showTrackingForm={showTrackingForm}
                  setShowTrackingForm={setShowTrackingForm}
                  handleUpdateTracking={handleUpdateTracking}
                  onContactCustomer={() => { setShowEmailModal(true); }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Email Modal ──────────────────────────────────────────────────── */}
      {showEmailModal && detailOrder && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <div>
                <h3 className="font-extrabold text-xs uppercase text-ink">Contact Customer</h3>
                <p className="text-[10px] text-muted mt-0.5">To: {detailOrder.user?.firstName} — {detailOrder.user?.email}</p>
              </div>
              <button onClick={() => setShowEmailModal(false)}><X className="w-5 h-5 text-muted hover:text-ink" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Subject *</label>
                <input required value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Message *</label>
                <textarea required rows={5} value={emailForm.content} onChange={e => setEmailForm({ ...emailForm, content: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none resize-none" />
              </div>
              <button disabled={sendingEmail} type="submit" className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 flex items-center justify-center gap-2 disabled:opacity-60">
                {sendingEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Order Modal ───────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateOrderModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchOrders(true); fetchStats(); }} />
      )}

      {/* ── Print Invoice Layout ─────────────────────────────────────────── */}
      {detailOrder && (() => {
        const isDelhi = (detailOrder.address?.state || '').toLowerCase().includes('delhi');
        const gstRate = 5;
        const subtotal = detailOrder.subtotal || 0;
        const discount = detailOrder.discountAmount || 0;
        const shipping = detailOrder.shippingFee || 0;
        const grandTotal = detailOrder.totalAmount || 0;
        
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
          <div className="hidden print:block p-4 text-[10px] text-ink font-sans leading-normal max-w-4xl mx-auto border border-line">
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
                <p className="font-black text-xs text-ink mt-0.5">Invoice No: #{detailOrder.orderNumber}</p>
                <p className="text-muted">Date: {fmtDateTime(detailOrder.createdAt)}</p>
                <p className="font-bold text-ink">Place of Supply: {detailOrder.address?.state || 'Delhi'}</p>
                <p className="text-muted">Payment: {detailOrder.payment?.paymentMethod || 'COD'} ({detailOrder.paymentStatus})</p>
              </div>
            </div>

            {/* Billing & Shipping Address */}
            <div className="grid grid-cols-2 gap-4 border-b border-line pb-3 mb-3">
              <div className="border-r border-line pr-2">
                <h4 className="font-extrabold text-[9px] text-muted uppercase mb-1">Bill To (Buyer)</h4>
                <p className="font-bold text-ink">{detailOrder.user?.firstName} {detailOrder.user?.lastName}</p>
                <p className="text-muted">{detailOrder.user?.email}</p>
                <p className="text-muted">{detailOrder.user?.phone}</p>
              </div>
              <div>
                <h4 className="font-extrabold text-[9px] text-muted uppercase mb-1">Ship To (Recipient)</h4>
                {detailOrder.address ? (
                  <>
                    <p className="font-bold text-ink">{detailOrder.address.fullName}</p>
                    <p className="text-muted">{detailOrder.address.street}</p>
                    {detailOrder.address.locality && <p className="text-muted">{detailOrder.address.locality}</p>}
                    <p className="text-muted">{detailOrder.address.city}, {detailOrder.address.state} - {detailOrder.address.postalCode}</p>
                    <p className="text-muted">Phone: {detailOrder.address.phone}</p>
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
                {detailOrder.items?.map((item, idx) => {
                  const itemPrice = item.price || 0;
                  const itemTotal = item.totalPrice || 0;
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
                        <span className="text-muted block text-[8px]">{item.variantInfo}</span>
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
        );
      })()}
    </div>
  );
}

// ── Order Detail Content Component ────────────────────────────────────────────
function OrderDetailContent({ order, newStatus, setNewStatus, allowedNext, updatingStatus, handleUpdateStatus, handleCancelOrder, courierPartner, setCourierPartner, trackingNumber, setTrackingNumber, showTrackingForm, setShowTrackingForm, handleUpdateTracking, onContactCustomer }) {
  const fmtC = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const timeline = Array.isArray(order.timeline) ? [...order.timeline].reverse() : [];
  const canCancel = !['CANCELLED', 'RETURNED', 'DELIVERED'].includes(order.orderStatus);

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-160px)] xl:max-h-[calc(100vh-160px)]">
      {/* Order Header */}
      <div className="px-5 py-4 border-b border-line">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-black text-ink text-base">#{order.orderNumber}</div>
            <div className="text-[11px] text-muted mt-0.5">{fmtDateTime(order.createdAt)}</div>
          </div>
          <StatusBadge status={order.orderStatus} />
        </div>
      </div>

      {/* Customer */}
      <div className="px-5 py-4 border-b border-line">
        <div className="text-[10px] font-black uppercase tracking-wider text-muted mb-3">Customer</div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-stone border border-line flex items-center justify-center overflow-hidden flex-shrink-0">
            {order.user?.avatar
              ? <img src={order.user.avatar} alt={order.user.firstName} className="w-full h-full object-cover" />
              : <span className="text-[11px] font-black text-muted uppercase">{(order.user?.firstName || 'A')[0]}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink text-xs">{order.user?.firstName} {order.user?.lastName}</div>
            <div className="text-[10px] text-muted truncate">{order.user?.email}</div>
            <div className="text-[10px] text-muted">{order.user?.phone || '—'}</div>
          </div>
          <button onClick={onContactCustomer} className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 border border-line rounded-lg text-[10px] font-bold text-ink hover:bg-stone transition-colors">
            <Mail className="w-3 h-3" /> Contact
          </button>
        </div>
      </div>

      {/* Shipping Address */}
      {order.address && (
        <div className="px-5 py-4 border-b border-line">
          <div className="text-[10px] font-black uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Shipping Address
          </div>
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-ink">{order.address.fullName}</div>
            <div className="text-muted">{order.address.street}{order.address.locality ? `, ${order.address.locality}` : ''}</div>
            <div className="text-muted">{order.address.city}, {order.address.state} — {order.address.postalCode}</div>
            <div className="text-muted">{order.address.country}</div>
            {order.address.phone && <div className="text-muted flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{order.address.phone}</div>}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="px-5 py-4 border-b border-line">
        <div className="text-[10px] font-black uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
          <Package className="w-3 h-3" /> Order Items ({order.items?.length || 0})
        </div>
        <div className="space-y-3">
          {order.items?.map(item => {
            const img = item.product?.images?.[0]?.url;
            let variantLabel = item.variantInfo;
            try { const v = JSON.parse(item.variantInfo); variantLabel = [v.size, v.color].filter(Boolean).join(' · '); } catch {}
            return (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-stone border border-line overflow-hidden flex-shrink-0">
                  {img ? <img src={img} alt={item.productName} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-muted m-auto" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-ink text-xs truncate">{item.productName}</div>
                  <div className="text-[10px] text-muted">{variantLabel} · Qty: {item.quantity}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-ink text-xs">{fmtC(item.totalPrice)}</div>
                  <div className="text-[10px] text-muted">{fmtC(item.price)} each</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="px-5 py-4 border-b border-line">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-muted"><span>Subtotal</span><span className="font-semibold text-ink">{fmtC(order.subtotal)}</span></div>
          <div className="flex justify-between text-muted"><span>Shipping</span><span className={`font-semibold ${order.shippingFee === 0 ? 'text-green-600' : 'text-ink'}`}>{order.shippingFee === 0 ? 'FREE' : fmtC(order.shippingFee)}</span></div>
          {order.taxAmount > 0 && <div className="flex justify-between text-muted"><span>Tax (GST)</span><span className="font-semibold text-ink">{fmtC(order.taxAmount)}</span></div>}
          {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span><span className="font-semibold">– {fmtC(order.discountAmount)}</span></div>}
          <div className="flex justify-between font-black text-ink border-t border-line pt-2 mt-1 text-sm"><span>Total</span><span>{fmtC(order.totalAmount)}</span></div>
        </div>
        <div className="mt-2 text-[10px] text-muted">
          Payment: <span className="font-bold text-ink">{order.payment?.paymentMethod || 'N/A'}</span> ·{' '}
          <span className={PAY_STATUS_CONFIG[order.paymentStatus]?.cls}>{PAY_STATUS_CONFIG[order.paymentStatus]?.label || order.paymentStatus}</span>
        </div>
      </div>

      {/* Tracking Info */}
      <div className="px-5 py-4 border-b border-line">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-black uppercase tracking-wider text-muted flex items-center gap-1.5"><Barcode className="w-3 h-3" /> Tracking Details</div>
          <button onClick={() => setShowTrackingForm(!showTrackingForm)} className="text-[10px] font-bold text-ink border border-line rounded px-2 py-0.5 hover:bg-stone transition-colors">
            {showTrackingForm ? 'Cancel' : <><Edit2 className="w-2.5 h-2.5 inline mr-1" />{order.tracking ? 'Edit' : 'Add'}</>}
          </button>
        </div>
        {!showTrackingForm ? (
          <div className="text-xs space-y-0.5 text-muted">
            {order.tracking ? (
              <>
                <div>Courier: <span className="font-semibold text-ink">{order.tracking.courierPartner || '—'}</span></div>
                <div>Tracking #: <span className="font-mono font-bold text-ink">{order.tracking.trackingNumber || '—'}</span></div>
              </>
            ) : (
              <span className="italic">No tracking details registered for this package.</span>
            )}
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            <input value={courierPartner} onChange={e => setCourierPartner(e.target.value)} placeholder="Courier partner (e.g. Delhivery)..." className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
            <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Tracking number..." className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
            <button onClick={handleUpdateTracking} className="w-full py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90">Save Tracking</button>
          </div>
        )}
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="px-5 py-4 border-b border-line">
          <div className="text-[10px] font-black uppercase tracking-wider text-muted mb-3">Order Timeline</div>
          <div className="space-y-3 relative">
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-line" />
            {timeline.map((ev, i) => {
              const cfg = ORDER_STATUS_CONFIG[ev.status] || { dot: 'bg-muted', label: ev.status };
              return (
                <div key={i} className="flex items-start gap-3 relative">
                  <div className={`w-3 h-3 rounded-full border-2 border-paper flex-shrink-0 mt-0.5 z-10 ${cfg.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-ink text-xs">{cfg.label}</div>
                    <div className="text-[10px] text-muted">{ev.time}</div>
                    {ev.note && <div className="text-[10px] text-muted italic mt-0.5">{ev.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Update */}
      <div className="px-5 py-4">
        <div className="text-[10px] font-black uppercase tracking-wider text-muted mb-3">Update Status</div>
        {allowedNext.length === 0 ? (
          <p className="text-[11px] text-muted italic">No status transitions available from current state.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="flex-1 bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none"
              >
                <option value={order.orderStatus}>{ORDER_STATUS_CONFIG[order.orderStatus]?.label || order.orderStatus} (current)</option>
                {allowedNext.map(s => (
                  <option key={s} value={s}>{ORDER_STATUS_CONFIG[s]?.label || s}</option>
                ))}
              </select>
              <button
                disabled={updatingStatus || newStatus === order.orderStatus}
                onClick={handleUpdateStatus}
                className="px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
              >
                {updatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                Update
              </button>
            </div>
            {newStatus === 'SHIPPED' && (
              <div className="space-y-2 p-3 border border-line bg-stone/20 rounded-lg animate-fadeIn">
                <div className="text-[9px] font-bold text-muted uppercase">Courier Info Required for Shipping</div>
                <input
                  required
                  value={courierPartner}
                  onChange={e => setCourierPartner(e.target.value)}
                  placeholder="Courier Partner (e.g. Delhivery, Bluedart)"
                  className="w-full border border-line bg-paper rounded px-3 py-2 text-xs text-ink focus:outline-none focus:border-ink font-semibold"
                />
                <input
                  required
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="Tracking Number"
                  className="w-full border border-line bg-paper rounded px-3 py-2 text-xs text-ink focus:outline-none focus:border-ink font-semibold"
                />
              </div>
            )}
          </div>
        )}
        {canCancel && (
          <button onClick={handleCancelOrder} className="w-full mt-3 py-2 border border-red-200 text-red-600 text-xs font-bold uppercase rounded-lg hover:bg-red-50 transition-colors">
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}

// ── Create Order Modal ────────────────────────────────────────────────────────
function CreateOrderModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=customer, 2=items, 3=review
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      if (customerSearch.length >= 2) {
        try {
          const r = await adminApi.getCustomers({ search: customerSearch, limit: 5 });
          if (r.success) setCustomers(r.customers);
        } catch {}
      } else setCustomers([]);
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (productSearch.length >= 2) {
        try {
          const r = await productApi.getProducts({ search: productSearch, limit: 5 });
          if (r.success || r.products) setProducts(r.products || []);
        } catch {
          setProducts([]);
        }
      } else setProducts([]);
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const handleSelectCustomer = async (c) => {
    setSelectedCustomer(c);
    setCustomerSearch(`${c.firstName} ${c.lastName || ''}`);
    setCustomers([]);
    try {
      const r = await adminApi.getCustomerById(c.id);
      if (r.success) {
        setCustomerAddresses(r.customer.addresses || []);
        const def = r.customer.addresses?.find(a => a.isDefault) || r.customer.addresses?.[0];
        if (def) setSelectedAddressId(def.id);
      }
    } catch {}
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedAddressId || cartItems.length === 0) {
      toast.error('Please select customer, address, and add at least one item');
      return;
    }
    setSaving(true);
    try {
      const r = await adminApi.createOrder({
        customerId: selectedCustomer.id,
        addressId: selectedAddressId,
        items: cartItems.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
        paymentMethod,
        couponCode: couponCode || undefined
      });
      if (r.success) {
        toast.success('Order created successfully!');
        onSuccess();
      }
    } catch (e) {
      toast.error(e.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-paper border border-line rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-line flex-shrink-0">
          <div>
            <h3 className="font-black text-xs uppercase tracking-widest text-ink">Create New Order</h3>
            <p className="text-[10px] text-muted mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted hover:text-ink" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Step 1: Customer */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-muted mb-1">Customer *</label>
            <div className="relative">
              <input
                value={customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
                placeholder="Search customer by name or email..."
                className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
              />
              {customers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-paper border border-line rounded-lg shadow-lg z-10 mt-1 overflow-hidden">
                  {customers.map(c => (
                    <button key={c.id} onClick={() => handleSelectCustomer(c)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-stone text-left">
                      <User className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                      <div><div className="font-bold">{c.firstName} {c.lastName}</div><div className="text-muted text-[10px]">{c.email}</div></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          {customerAddresses.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-muted mb-1">Shipping Address *</label>
              <select value={selectedAddressId} onChange={e => setSelectedAddressId(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none">
                {customerAddresses.map(a => (
                  <option key={a.id} value={a.id}>{a.fullName}, {a.street}, {a.city}, {a.state} — {a.postalCode}</option>
                ))}
              </select>
            </div>
          )}

          {/* Items */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-muted mb-1">Add Products</label>
            <p className="text-[10px] text-muted mb-2">Product/variant selection requires browsing the product catalog. For now, add item details manually:</p>
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2 p-2 bg-stone border border-line rounded-lg">
                <div className="flex-1 text-xs">
                  <div className="font-bold text-ink">{item.productName}</div>
                  <div className="text-muted text-[10px]">Variant ID: {item.variantId} · Qty: {item.quantity}</div>
                </div>
                <button onClick={() => setCartItems(prev => prev.filter((_, i) => i !== idx))} className="p-1 text-red-500 hover:text-red-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              To add items, please use the existing checkout flow or contact the development team for an advanced item picker.
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-muted mb-1">Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none">
                <option value="COD">COD (Cash on Delivery)</option>
                <option value="Online">Online Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-muted mb-1">Coupon Code</label>
              <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Optional" className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-line flex-shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-line text-ink text-xs font-bold uppercase rounded-lg hover:bg-stone">Cancel</button>
          <button disabled={saving || !selectedCustomer || !selectedAddressId} onClick={handleSubmit} className="flex-1 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
