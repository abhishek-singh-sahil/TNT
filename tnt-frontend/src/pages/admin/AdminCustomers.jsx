import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../../api/services';
import {
  Users, UserPlus, Search, Download, Calendar, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, ShoppingBag, DollarSign, Star, MoreVertical,
  Check, X, Edit2, Mail, Trash2, Eye, RefreshCw, MapPin, Phone,
  Package, CheckCircle, XCircle, Clock, Truck, AlertCircle, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import ActionMenu from '../../components/common/ActionMenu';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_CONFIG = {
  DELIVERED:  { label: 'Delivered', cls: 'bg-green-50 text-green-700 border-green-200' },
  CONFIRMED:  { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  PROCESSING: { label: 'Processing', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  SHIPPED:    { label: 'Shipped', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  CANCELLED:  { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
  PENDING:    { label: 'Pending', cls: 'bg-slate-50 text-slate-600 border-slate-200' }
};

// ── Date range calculator ─────────────────────────────────────────────────────
function getDateParams(option, customStart, customEnd) {
  const now = new Date();
  let start = null, end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (option === 'today')      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (option === 'yesterday') { start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999); }
  else if (option === 'last-7')  start = new Date(now.getTime() - 7 * 864e5);
  else if (option === 'last-30') start = new Date(now.getTime() - 30 * 864e5);
  else if (option === 'this-month') start = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (option === 'last-month') { start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); }
  else if (option === 'custom') { if (customStart) start = new Date(customStart); if (customEnd) { end = new Date(customEnd); end.setHours(23,59,59,999); } }
  return { startDate: start?.toISOString(), endDate: end?.toISOString() };
}

// ── Stats Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, label, value, change, prefix = '' }) {
  const isPositive = change === null ? null : change >= 0;
  return (
    <div className="bg-paper border border-line rounded-xl p-5 flex gap-4 items-start shadow-xs hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${iconBg}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase text-muted tracking-wider">{label}</p>
        <p className="text-2xl font-black text-ink leading-tight mt-0.5">{prefix}{value}</p>
        {change !== null && change !== undefined ? (
          <p className={`text-[10px] font-bold flex items-center gap-1 mt-1.5 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}% vs. previous
          </p>
        ) : (
          <p className="text-[10px] text-muted mt-1.5">— No previous data</p>
        )}
      </div>
    </div>
  );
}

// ── Order Status Badge ────────────────────────────────────────────────────────
function OrderBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-stone text-ink border-line' };
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${cfg.cls}`}>{cfg.label}</span>;
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminCustomers() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [locations, setLocations] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
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

  // Details Panel
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [detailOrders, setDetailOrders] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', city: '', state: '' });
  const [saving, setSaving] = useState(false);

  // Bulk
  const [selectedIds, setSelectedIds] = useState([]);

  // Email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: '', content: '', imageUrl: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Action menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // ── Fetch Locations (once) ─────────────────────────────────────────────────
  useEffect(() => {
    adminApi.getCustomerLocations().then(r => {
      if (r.success) setLocations(r.locations || []);
    }).catch(() => {});
  }, []);

  // ── Date params ───────────────────────────────────────────────────────────
  const dateParams = getDateParams(dateOption, customStart, customEnd);

  // ── Fetch Stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await adminApi.getCustomerStats(dateParams);
      if (r.success) setStats(r.stats);
    } catch (e) { console.error(e); }
    finally { setStatsLoading(false); }
  }, [dateOption, customStart, customEnd]);

  // ── Fetch Customers ────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async (resetPage = false) => {
    setLoading(true);
    setSelectedIds([]);
    const activePage = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    try {
      const params = { page: activePage, limit, search, status: selectedStatus, location: selectedLocation, sort };
      const r = await adminApi.getCustomers(params);
      if (r.success) {
        setCustomers(r.customers);
        setTotalPages(r.pagination.totalPages || 1);
        setTotalCount(r.pagination.total || 0);
        if (!selectedCustomer && r.customers.length > 0) {
          openDetails(r.customers[0]);
        }
      }
    } catch (e) { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [page, search, selectedStatus, selectedLocation, sort]);

  useEffect(() => { fetchStats(); }, [dateOption, customStart, customEnd]);
  useEffect(() => { fetchCustomers(true); }, [search, selectedStatus, selectedLocation, sort, dateOption]);
  useEffect(() => { fetchCustomers(false); }, [page]);

  // ── Open Details Panel ─────────────────────────────────────────────────────
  const openDetails = async (customer) => {
    setSelectedCustomer(customer);
    setDetailLoading(true);
    setShowMobileDetails(true);
    try {
      const [detailRes, ordersRes] = await Promise.all([
        adminApi.getCustomerById(customer.id),
        adminApi.getCustomerOrders(customer.id, { limit: 5 })
      ]);
      if (detailRes.success) setDetailCustomer(detailRes.customer);
      if (ordersRes.success) setDetailOrders(ordersRes.orders);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  // ── Edit Customer ──────────────────────────────────────────────────────────
  const handleOpenEdit = (c) => {
    setEditForm({ firstName: c.firstName, lastName: c.lastName || '', email: c.email, phone: c.phone || '', rewardPoints: String(c.rewardPoints || 0), isBlocked: c.isBlocked });
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await adminApi.updateCustomer(selectedCustomer.id, editForm);
      if (r.success) {
        toast.success('Customer updated successfully');
        setShowEditModal(false);
        fetchCustomers(false);
        openDetails({ ...selectedCustomer, ...editForm });
      }
    } catch (e) { toast.error(e.message || 'Failed to update customer'); }
    finally { setSaving(false); }
  };

  // ── Add Customer ───────────────────────────────────────────────────────────
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await adminApi.createCustomer(addForm);
      if (r.success) {
        toast.success('Customer account created successfully');
        setShowAddModal(false);
        setAddForm({ firstName: '', lastName: '', email: '', phone: '', password: '', city: '', state: '' });
        fetchCustomers(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create customer');
    } finally { setSaving(false); }
  };

  // ── Toggle Status ──────────────────────────────────────────────────────────
  const handleToggleStatus = async (c) => {
    const newBlocked = !c.isBlocked;
    const label = newBlocked ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${label} ${c.firstName}'s account?`)) return;
    try {
      const r = await adminApi.updateCustomer(c.id, { isBlocked: newBlocked });
      if (r.success) {
        toast.success(`Customer ${newBlocked ? 'deactivated' : 'activated'} successfully`);
        fetchCustomers(false);
        if (selectedCustomer?.id === c.id) openDetails({ ...c, isBlocked: newBlocked });
      }
    } catch (e) { toast.error(e.message || 'Failed to update status'); }
    setOpenMenuId(null);
  };

  // ── Email ──────────────────────────────────────────────────────────────────
  const handleOpenEmail = (c) => {
    setEmailTarget(c);
    setEmailForm({ subject: '', content: '', imageUrl: '' });
    setShowEmailModal(true);
    setOpenMenuId(null);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject || !emailForm.content) { toast.error('Subject and content required'); return; }
    setSendingEmail(true);
    try {
      const r = await adminApi.sendBlastEmail({ userId: emailTarget.id, ...emailForm });
      if (r.success) { toast.success('Email sent successfully'); setShowEmailModal(false); }
    } catch (e) { toast.error(e.message || 'Failed to send email'); }
    finally { setSendingEmail(false); }
  };

  // ── Bulk Actions ───────────────────────────────────────────────────────────
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${action} ${selectedIds.length} customer(s)?`)) return;
    try {
      const r = await adminApi.bulkCustomerAction(action, selectedIds);
      if (r.success) { toast.success(r.message); setSelectedIds([]); fetchCustomers(false); }
    } catch (e) { toast.error(e.message || 'Bulk action failed'); }
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const url = adminApi.exportCustomersUrl({ search, status: selectedStatus, location: selectedLocation });
    window.open(url, '_blank');
    toast.success('CSV export started');
  };

  // ── Checkbox helpers ───────────────────────────────────────────────────────
  const toggleAll = (e) => setSelectedIds(e.target.checked ? customers.map(c => c.id) : []);
  const toggleRow = (e, id) => setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dateLabel = dateOption === 'custom' && customStart ? `${customStart} – ${customEnd || '...'}` :
    { 'today': 'Today', 'yesterday': 'Yesterday', 'last-7': 'Last 7 Days', 'last-30': 'Last 30 Days', 'this-month': 'This Month', 'last-month': 'Last Month' }[dateOption] || 'Select Period';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-ink flex items-center gap-2">
            <Users className="w-5 h-5 text-muted" /> Customer Management
          </h1>
          <p className="text-xs text-muted mt-0.5">Manage and engage with your customers</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start">
          {/* Date Range */}
          <div className="relative flex items-center bg-paper border border-line rounded-lg px-3 py-2 text-xs font-bold text-ink gap-2 hover:bg-stone transition-colors">
            <Calendar className="w-3.5 h-3.5 text-muted flex-shrink-0" />
            <select
              value={dateOption}
              onChange={(e) => { setDateOption(e.target.value); setShowCustomDate(e.target.value === 'custom'); }}
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-bold rounded-lg hover:bg-ink/90 transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Customer
          </button>
        </div>
      </div>

      {/* ── Statistics Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-4.5 h-4.5 text-blue-500" />}
          iconBg="bg-blue-50 border-blue-100"
          label="Total Customers"
          value={statsLoading ? '...' : fmt(stats.totalCustomers)}
          change={stats.totalCustomersChange ?? null}
        />
        <StatCard
          icon={<UserPlus className="w-4.5 h-4.5 text-green-500" />}
          iconBg="bg-green-50 border-green-100"
          label="New Customers"
          value={statsLoading ? '...' : fmt(stats.newCustomers)}
          change={stats.newCustomersChange ?? null}
        />
        <StatCard
          icon={<ShoppingBag className="w-4.5 h-4.5 text-amber-500" />}
          iconBg="bg-amber-50 border-amber-100"
          label="Total Orders"
          value={statsLoading ? '...' : fmt(stats.totalOrders)}
          change={stats.totalOrdersChange ?? null}
        />
        <StatCard
          icon={<Star className="w-4.5 h-4.5 text-yellow-500 fill-yellow-400" />}
          iconBg="bg-yellow-50 border-yellow-100"
          label="Avg. Order Value"
          value={statsLoading ? '...' : fmtCurrency(stats.avgOrderValue)}
          change={stats.avgOrderValueChange ?? null}
        />
      </div>

      {/* ── Main Layout: Table + Details Panel ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* ── LEFT: Customers Table ───────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Filters + Export */}
          <div className="bg-paper border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-xs">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-0 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-stone border border-line rounded-lg pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-ink/30 transition-colors"
                />
              </div>

              {/* Location dropdown */}
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none min-w-[130px]"
              >
                <option value="all">All Locations</option>
                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>

              {/* Status dropdown */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none min-w-[110px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 border border-line rounded-lg text-xs font-bold text-ink hover:bg-stone transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Table header row count */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-ink">Customers <span className="text-muted font-semibold ml-1">{fmt(totalCount)}</span></span>
            <select value={sort} onChange={e => setSort(e.target.value)} className="bg-stone border border-line rounded-lg px-2 py-1 text-[10px] text-ink focus:outline-none font-bold">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-muted mx-auto mb-3" />
                <p className="text-xs text-muted">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <Users className="w-10 h-10 mx-auto text-line animate-pulse" />
                <h3 className="font-extrabold text-xs text-ink">No Customers Found</h3>
                <p className="text-[10px] text-muted">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-stone/50 border-b border-line text-[10px] text-muted font-bold">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" checked={selectedIds.length === customers.length && customers.length > 0} onChange={toggleAll} className="rounded" />
                      </th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3 text-center">Orders</th>
                      <th className="px-4 py-3 text-right">Spent</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {customers.map(c => {
                      const isSelected = selectedCustomer?.id === c.id;
                      const isChecked = selectedIds.includes(c.id);
                      return (
                        <tr
                          key={c.id}
                          onClick={() => openDetails(c)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-stone/30' : 'hover:bg-stone/10'}`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isChecked} onChange={e => toggleRow(e, c.id)} className="rounded" />
                          </td>

                          {/* Customer */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3 min-w-[140px]">
                              <div className="w-8 h-8 rounded-full bg-stone border border-line flex items-center justify-center overflow-hidden flex-shrink-0">
                                {c.avatar ? (
                                  <img src={c.avatar} alt={c.firstName} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-black text-muted uppercase">{(c.firstName || 'A')[0]}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-ink truncate">{c.firstName} {c.lastName}</div>
                                {c.location && (
                                  <div className="text-[10px] text-muted flex items-center gap-0.5 mt-0.5 truncate">
                                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{c.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3.5 font-mono text-muted text-[11px] max-w-[160px] truncate">{c.email}</td>

                          {/* Phone */}
                          <td className="px-4 py-3.5 text-muted">{c.phone || '—'}</td>

                          {/* Orders */}
                          <td className="px-4 py-3.5 text-center font-bold text-ink">{c.orderCount}</td>

                          {/* Spent */}
                          <td className="px-4 py-3.5 text-right font-bold text-ink">{fmtCurrency(c.totalSpent)}</td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${c.isBlocked ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                              {c.isBlocked ? 'Inactive' : 'Active'}
                            </span>
                          </td>

                          {/* Actions ⋯ */}
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
                                  onClick: () => openDetails(c)
                                },
                                {
                                  label: 'Edit Customer',
                                  icon: <Edit2 className="w-3.5 h-3.5" />,
                                  onClick: () => handleOpenEdit(c)
                                },
                                {
                                  label: 'Send Email',
                                  icon: <Mail className="w-3.5 h-3.5" />,
                                  onClick: () => handleOpenEmail(c)
                                },
                                { divider: true },
                                {
                                  label: c.isBlocked ? 'Activate' : 'Deactivate',
                                  icon: c.isBlocked ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />,
                                  danger: !c.isBlocked,
                                  onClick: () => handleToggleStatus(c)
                                }
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

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-paper border-2 border-ink rounded-xl p-4 flex items-center justify-between shadow-lg">
              <span className="text-xs font-bold text-ink">{selectedIds.length} selected</span>
              <div className="flex gap-2">
                <button onClick={() => handleBulkAction('ACTIVATE')} className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-green-700 transition-colors">Activate</button>
                <button onClick={() => handleBulkAction('DEACTIVATE')} className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-amber-600 transition-colors">Deactivate</button>
                <button onClick={() => { const url = adminApi.exportCustomersUrl({ ids: selectedIds.join(',') }); window.open(url, '_blank'); }} className="px-3 py-1.5 border border-line text-ink text-[10px] font-bold uppercase rounded-lg hover:bg-stone transition-colors">Export</button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && customers.length > 0 && (
            <div className="flex items-center justify-between border-t border-line pt-4 text-xs font-semibold text-ink">
              <span className="text-muted">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {fmt(totalCount)} customers</span>
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
                    <button key={pNum} onClick={() => setPage(pNum)} className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${page === pNum ? 'bg-ink text-paper border-ink' : 'border-line hover:bg-stone'}`}>{pNum}</button>
                  );
                })}
                {totalPages > 7 && page < totalPages - 3 && <span className="text-muted px-1">…</span>}
                {totalPages > 7 && (
                  <button onClick={() => setPage(totalPages)} className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${page === totalPages ? 'bg-ink text-paper border-ink' : 'border-line hover:bg-stone'}`}>{totalPages}</button>
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-line rounded-lg hover:bg-stone disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Details Panel (Desktop) ──────────────────────────────── */}
        <div className="hidden xl:block bg-paper border border-line rounded-2xl overflow-hidden shadow-xs sticky top-4">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Customer Details</span>
            {detailCustomer && (
              <button onClick={() => handleOpenEdit(selectedCustomer)} className="p-1.5 border border-line rounded-lg text-muted hover:text-ink hover:bg-stone transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {detailLoading ? (
            <div className="py-20 text-center"><RefreshCw className="w-6 h-6 animate-spin text-muted mx-auto" /></div>
          ) : !detailCustomer ? (
            <div className="py-20 text-center space-y-2 px-5">
              <Users className="w-8 h-8 mx-auto text-line" />
              <p className="text-[10px] font-bold uppercase text-muted">Select a customer</p>
              <p className="text-[10px] text-muted">Click any row to view their full profile and order history.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
              {/* Customer header */}
              <div className="px-5 py-4 flex gap-3 items-start">
                <div className="w-12 h-12 rounded-full bg-stone border border-line overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {detailCustomer.avatar ? (
                    <img src={detailCustomer.avatar} alt={detailCustomer.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-muted uppercase">{(detailCustomer.firstName || 'A')[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-ink text-sm leading-tight truncate">{detailCustomer.firstName} {detailCustomer.lastName}</h3>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${detailCustomer.isBlocked ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                      {detailCustomer.isBlocked ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted mt-0.5 truncate">{detailCustomer.email}</p>
                  <p className="text-[11px] text-muted">{detailCustomer.phone || '—'}</p>
                </div>
              </div>

              {/* Order stats mini-cards */}
              <div className="grid grid-cols-2 gap-3 px-5 pb-4">
                <div className="bg-stone/40 border border-line rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted mb-1"><ShoppingBag className="w-3 h-3" /><span className="text-[9px] font-bold uppercase">Total Orders</span></div>
                  <div className="text-xl font-black text-ink">{detailCustomer.totalOrders}</div>
                </div>
                <div className="bg-stone/40 border border-line rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted mb-1"><DollarSign className="w-3 h-3" /><span className="text-[9px] font-bold uppercase">Total Spent</span></div>
                  <div className="text-base font-black text-ink">{fmtCurrency(detailCustomer.totalSpent)}</div>
                </div>
              </div>

              <div className="border-t border-line" />

              {/* Customer Information */}
              <div className="px-5 py-4 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted block">Customer Information</span>
                <div className="space-y-2 text-xs">
                  {[
                    { icon: Users, label: 'Name', val: `${detailCustomer.firstName} ${detailCustomer.lastName}` },
                    { icon: Mail, label: 'Email', val: detailCustomer.email },
                    { icon: Phone, label: 'Phone', val: detailCustomer.phone || '—' },
                    { icon: MapPin, label: 'Location', val: detailCustomer.location || '—' },
                    { icon: Calendar, label: 'Member Since', val: fmtDate(detailCustomer.createdAt) }
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-start gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[9px] text-muted uppercase font-bold block">{label}</span>
                        <span className="text-ink font-semibold truncate block">{val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-line" />

              {/* Order History */}
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted">Order History</span>
                  <a href={`/admin/orders?customer=${detailCustomer.id}`} className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1">
                    View All <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {detailOrders.length === 0 ? (
                  <p className="text-[11px] text-muted text-center py-4">No order history found</p>
                ) : (
                  <div className="space-y-2.5">
                    {detailOrders.map(o => (
                      <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-line hover:bg-stone/30 transition-colors">
                        {o.productImage ? (
                          <img src={o.productImage} alt={o.productName} className="w-9 h-9 object-cover rounded-lg border border-line bg-stone flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-stone border border-line flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-muted" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-ink text-xs truncate">{o.productName}</div>
                          <div className="text-[10px] text-muted">{fmtDate(o.createdAt)}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-ink text-xs">{fmtCurrency(o.totalAmount)}</div>
                          <OrderBadge status={o.orderStatus} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="border-t border-line px-5 py-4 flex gap-2">
                <button
                  onClick={() => handleToggleStatus(selectedCustomer)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${detailCustomer.isBlocked ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-amber-200 text-amber-600 hover:bg-amber-50'}`}
                >
                  {detailCustomer.isBlocked ? 'Activate' : 'Deactivate'}
                </button>
                <button
                  onClick={() => handleOpenEmail(selectedCustomer)}
                  className="flex-1 py-2 bg-ink text-paper rounded-lg text-xs font-bold uppercase hover:bg-ink/90 transition-colors"
                >
                  Send Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Sheet: Customer Details ────────────────────────── */}
      {showMobileDetails && selectedCustomer && (
        <div className="fixed inset-0 z-50 xl:hidden bg-black/60 backdrop-blur-xs flex items-end">
          <div className="bg-paper rounded-t-2xl w-full max-h-[88vh] flex flex-col shadow-2xl">
            <div className="w-12 h-1.5 bg-line rounded-full mx-auto my-3 flex-shrink-0" />
            <div className="flex justify-between items-center px-5 pb-3 border-b border-line flex-shrink-0">
              <span className="text-xs font-black uppercase tracking-wider text-muted">Customer Details</span>
              <button onClick={() => setShowMobileDetails(false)} className="p-1 border border-line rounded-lg text-muted hover:text-ink">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 pb-8">
              {detailLoading ? (
                <div className="py-16 text-center"><RefreshCw className="w-6 h-6 animate-spin text-muted mx-auto" /></div>
              ) : detailCustomer ? (
                <div className="text-xs">
                  {/* Header */}
                  <div className="px-5 py-4 flex items-center gap-3 border-b border-line">
                    <div className="w-12 h-12 rounded-full bg-stone border border-line flex items-center justify-center overflow-hidden flex-shrink-0">
                      {detailCustomer.avatar ? <img src={detailCustomer.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-black text-muted uppercase">{(detailCustomer.firstName || 'A')[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-ink text-sm">{detailCustomer.firstName} {detailCustomer.lastName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${detailCustomer.isBlocked ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{detailCustomer.isBlocked ? 'Inactive' : 'Active'}</span>
                      </div>
                      <p className="text-muted text-[11px] truncate">{detailCustomer.email}</p>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 px-5 py-4">
                    <div className="bg-stone/40 border border-line rounded-xl p-3 text-center">
                      <p className="text-[9px] font-bold uppercase text-muted mb-1">Total Orders</p>
                      <p className="text-xl font-black text-ink">{detailCustomer.totalOrders}</p>
                    </div>
                    <div className="bg-stone/40 border border-line rounded-xl p-3 text-center">
                      <p className="text-[9px] font-bold uppercase text-muted mb-1">Total Spent</p>
                      <p className="text-base font-black text-ink">{fmtCurrency(detailCustomer.totalSpent)}</p>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="px-5 pb-4 space-y-2 border-t border-line pt-4">
                    <span className="text-[10px] font-black uppercase text-muted">Customer Information</span>
                    {[
                      { icon: Phone, val: detailCustomer.phone || '—' },
                      { icon: MapPin, val: detailCustomer.location || '—' },
                      { icon: Calendar, val: `Member since ${fmtDate(detailCustomer.createdAt)}` }
                    ].map(({ icon: Icon, val }) => (
                      <div key={val} className="flex items-center gap-2 text-muted"><Icon className="w-3.5 h-3.5 flex-shrink-0" /><span>{val}</span></div>
                    ))}
                  </div>
                  {/* Orders */}
                  <div className="px-5 pb-4 border-t border-line pt-4 space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-muted">Order History</span>
                    {detailOrders.length === 0 ? (
                      <p className="text-muted text-center py-4 text-[11px]">No orders found</p>
                    ) : detailOrders.map(o => (
                      <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-line">
                        {o.productImage ? <img src={o.productImage} alt="" className="w-9 h-9 object-cover rounded-lg border border-line bg-stone flex-shrink-0" /> : <div className="w-9 h-9 rounded-lg bg-stone border border-line flex items-center justify-center flex-shrink-0"><Package className="w-4 h-4 text-muted" /></div>}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-ink truncate">{o.productName}</div>
                          <div className="text-muted text-[10px]">{fmtDate(o.createdAt)}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-ink">{fmtCurrency(o.totalAmount)}</div>
                          <OrderBadge status={o.orderStatus} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mobile actions */}
                  <div className="px-5 pt-2 flex gap-2">
                    <button onClick={() => { handleToggleStatus(selectedCustomer); setShowMobileDetails(false); }} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border ${detailCustomer.isBlocked ? 'border-green-200 text-green-600' : 'border-amber-200 text-amber-600'}`}>
                      {detailCustomer.isBlocked ? 'Activate' : 'Deactivate'}
                    </button>
                    <button onClick={() => { handleOpenEdit(selectedCustomer); setShowMobileDetails(false); }} className="flex-1 py-2.5 bg-ink text-paper rounded-lg text-xs font-bold uppercase">Edit</button>
                    <button onClick={() => { handleOpenEmail(selectedCustomer); setShowMobileDetails(false); }} className="flex-1 py-2.5 border border-line text-ink rounded-lg text-xs font-bold uppercase">Email</button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Customer Modal ───────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <div><h3 className="font-extrabold text-xs uppercase tracking-widest text-ink">Add New Customer</h3><p className="text-[10px] text-muted mt-0.5">Create a customer account directly from admin panel</p></div>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-muted hover:text-ink" /></button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">First Name *</label>
                  <input required value={addForm.firstName} onChange={e => setAddForm({...addForm, firstName: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Last Name</label>
                  <input value={addForm.lastName} onChange={e => setAddForm({...addForm, lastName: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Email Address *</label>
                <input required type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Phone</label>
                  <input value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Password *</label>
                  <input required type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" placeholder="Min 6 chars" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">City</label>
                  <input value={addForm.city} onChange={e => setAddForm({...addForm, city: e.target.value})} placeholder="e.g. New Delhi" className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">State</label>
                  <input value={addForm.state} onChange={e => setAddForm({...addForm, state: e.target.value})} placeholder="e.g. Delhi" className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
              </div>
              <button disabled={saving} type="submit" className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} {saving ? 'Creating...' : 'Create Customer Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Customer Modal ──────────────────────────────────────────── */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-ink">Edit Customer</h3>
              <button onClick={() => setShowEditModal(false)}><X className="w-5 h-5 text-muted hover:text-ink" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">First Name *</label>
                  <input required value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Last Name</label>
                  <input value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Email *</label>
                <input required type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Reward Points</label>
                  <input type="number" value={editForm.rewardPoints} onChange={e => setEditForm({...editForm, rewardPoints: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 border border-line rounded-lg bg-stone/40 cursor-pointer">
                <input type="checkbox" checked={editForm.isBlocked} onChange={e => setEditForm({...editForm, isBlocked: e.target.checked})} className="rounded" />
                <div>
                  <span className="text-xs font-bold text-ink block">Suspend Account</span>
                  <span className="text-[10px] text-muted">Customer will be blocked from logging in</span>
                </div>
              </label>
              <div className="flex gap-2 pt-2">
                <button disabled={saving} type="submit" className="flex-1 py-3 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-3 border border-line text-ink text-xs font-bold uppercase rounded-lg hover:bg-stone">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Email Modal ──────────────────────────────────────────────────── */}
      {showEmailModal && emailTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-widest text-ink">Send Email</h3>
                <p className="text-[10px] text-muted mt-0.5">To: {emailTarget.firstName} {emailTarget.lastName} — {emailTarget.email}</p>
              </div>
              <button onClick={() => setShowEmailModal(false)}><X className="w-5 h-5 text-muted hover:text-ink" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Subject *</label>
                <input required value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Message *</label>
                <textarea required rows={5} value={emailForm.content} onChange={e => setEmailForm({...emailForm, content: e.target.value})} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none resize-none" />
              </div>
              <button disabled={sendingEmail} type="submit" className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 flex items-center justify-center gap-2 disabled:opacity-60">
                {sendingEmail ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</> : <><Mail className="w-4 h-4" /> Send Email</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
