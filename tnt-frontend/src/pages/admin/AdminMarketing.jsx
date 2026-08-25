import { useState, useEffect, useCallback } from 'react';
import {
  Trash2, Edit3, Plus, Search, RefreshCw, X, Gift, Percent, Tag,
  ShieldCheck, ChevronRight, Check, Copy, BarChart2, Zap, Clock,
  Users, TrendingUp, AlertCircle, BadgePercent, Megaphone, Mail,
  ToggleLeft, ToggleRight, ChevronDown, Sparkles, Calendar,
  Package, Layers, Globe, Star, ArrowUpRight
} from 'lucide-react';
import { marketingApi, adminApi, productApi } from '../../api/services';
import toast from 'react-hot-toast';
import ActionMenu from '../../components/common/ActionMenu';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtMoney = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateInput = (d) => d ? new Date(d).toISOString().substring(0, 16) : '';

function couponStatus(coupon) {
  const now = new Date();
  if (!coupon.isActive) return { label: 'Disabled', cls: 'bg-stone text-muted border-line' };
  if (coupon.validFrom && new Date(coupon.validFrom) > now) return { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (coupon.validTill && new Date(coupon.validTill) < now) return { label: 'Expired', cls: 'bg-red-50 text-red-700 border-red-200' };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { label: 'Used Up', cls: 'bg-orange-50 text-orange-700 border-orange-200' };
  return { label: 'Active', cls: 'bg-green-50 text-green-700 border-green-200' };
}

function saleStatus(sale) {
  const now = new Date();
  if (sale.status === 'ENDED') return { label: 'Ended', cls: 'bg-stone text-muted border-line' };
  if (new Date(sale.startDate) > now) return { label: 'Upcoming', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (new Date(sale.endDate) < now) return { label: 'Expired', cls: 'bg-red-50 text-red-700 border-red-200' };
  return { label: 'Live', cls: 'bg-green-50 text-green-700 border-green-200' };
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-paper border border-line rounded-xl p-5 flex gap-4 items-start group hover:shadow-md transition-shadow duration-200">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase text-muted tracking-wider">{label}</p>
        <p className="text-xl font-black text-ink leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-muted mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-ink' : 'bg-line'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ─── Tab Bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Overview', Icon: BarChart2 },
  { id: 'coupons',   label: 'Coupons',  Icon: Tag },
  { id: 'sales',     label: 'Campaigns', Icon: Megaphone },
  { id: 'newsletter',label: 'Newsletter', Icon: Mail },
];

// ─── COUPON TYPE CONFIG ────────────────────────────────────────────────────────
const COUPON_TYPES = [
  { value: 'PERCENTAGE',    label: 'Percentage Off',   desc: 'e.g. 15% off total', Icon: Percent },
  { value: 'FLAT',          label: 'Flat Amount',      desc: 'e.g. ₹200 off',      Icon: BadgePercent },
  { value: 'FREE_SHIPPING', label: 'Free Shipping',    desc: 'Waive delivery fee',  Icon: Package },
];

const BLANK_COUPON = {
  name: '', code: '', description: '',
  couponType: 'PERCENTAGE', discountValue: '', maxDiscount: '', minOrderAmount: '',
  maxUses: '1000', maxUsesPerCustomer: '1', priority: '0',
  autoApply: false, stackable: false, newCustomerOnly: false, loggedInOnly: true,
  allowMultipleRedeem: false, applicability: 'STORE',
  applicableCategoryIds: [], applicableProductIds: [],
  excludedCategoryIds: [], excludedProductIds: [], excludeSaleProducts: false,
  validFrom: new Date().toISOString().substring(0, 16),
  validTill: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 16),
  isActive: true
};

const BLANK_SALE = {
  name: '', description: '', salePercentage: '',
  startDate: new Date().toISOString().substring(0, 16),
  endDate: new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 16),
  priority: '0', status: 'ACTIVE', bgColor: '#f5f5f7', badgeColor: '#e11d48',
  badgeText: 'SALE', displayOrder: '0', campaignType: 'PRODUCT',
  categoryIds: [], productIds: []
};

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminMarketing() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);

  // Coupon modal
  const [couponOpen, setCouponOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState(BLANK_COUPON);
  const [pickerCategory, setPickerCategory] = useState('');
  const [pickerProducts, setPickerProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  // Sale modal
  const [saleOpen, setSaleOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [saleForm, setSaleForm] = useState(BLANK_SALE);

  // ── Data loaders ────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const r = await marketingApi.getStats();
      if (r.success) setStats(r.stats);
    } catch (e) { console.error(e); }
  }, []);

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const r = await marketingApi.getCoupons({ search: couponSearch, filter: couponFilter });
      if (r.success) setCoupons(r.coupons);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [couponSearch, couponFilter]);

  const loadSales = useCallback(async () => {
    try {
      const r = await marketingApi.getSales();
      if (r.success) setSales(r.campaigns);
    } catch (e) { console.error(e); }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const [catR, prodR] = await Promise.all([
        adminApi.getCategories(),
        productApi.getProducts({ limit: 200 })
      ]);
      if (catR.success) setCategories(catR.categories);
      if (prodR.success) setProducts(prodR.products);
    } catch (e) { console.error(e); }
  }, []);

  const loadSubscribers = useCallback(async () => {
    try {
      const r = await adminApi.getNewsletterSubscribers();
      if (r.success && r.subscribers) setSubscribers(r.subscribers);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    loadStats(); loadCoupons(); loadSales(); loadMeta(); loadSubscribers();
  }, []);

  useEffect(() => { loadCoupons(); }, [couponFilter]);

  // ── Coupon helpers ──────────────────────────────────────────────────────────
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TNT';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setCouponForm(f => ({ ...f, code }));
  };

  const openCreateCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({ ...BLANK_COUPON });
    setPickerCategory(''); setPickerProducts([]);
    setCouponOpen(true);
  };

  const openEditCoupon = (c) => {
    setEditingCoupon(c);
    setCouponForm({
      ...c,
      validFrom: fmtDateInput(c.validFrom),
      validTill: fmtDateInput(c.validTill),
    });
    setPickerCategory(''); setPickerProducts([]);
    setCouponOpen(true);
  };

  const loadPickerProducts = async (slug) => {
    setPickerCategory(slug);
    if (!slug) { setPickerProducts([]); return; }
    const r = await productApi.getProducts({ category: slug, limit: 200 });
    if (r.success) setPickerProducts(r.products);
  };

  const saveCoupon = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCoupon) {
        await marketingApi.updateCoupon(editingCoupon.id, couponForm);
        toast.success('Coupon updated!');
      } else {
        await marketingApi.createCoupon(couponForm);
        toast.success('Coupon created!');
      }
      setCouponOpen(false);
      loadCoupons(); loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setSaving(false); }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Permanently delete this coupon?')) return;
    try {
      await marketingApi.deleteCoupon(id);
      toast.success('Coupon deleted');
      loadCoupons(); loadStats();
    } catch { toast.error('Delete failed'); }
  };

  const toggleCoupon = async (c) => {
    try {
      await marketingApi.updateCoupon(c.id, { isActive: !c.isActive });
      loadCoupons();
    } catch { toast.error('Failed to update'); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    });
  };

  // ── Sale helpers ────────────────────────────────────────────────────────────
  const openCreateSale = () => {
    setEditingSale(null);
    setSaleForm({ ...BLANK_SALE });
    setSaleOpen(true);
  };

  const openEditSale = (s) => {
    setEditingSale(s);
    setSaleForm({
      ...s,
      startDate: fmtDateInput(s.startDate),
      endDate: fmtDateInput(s.endDate),
      categoryIds: s.categories?.map(c => c.id) || [],
      productIds: s.products?.map(p => p.id) || [],
    });
    setSaleOpen(true);
  };

  const saveSale = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSale) {
        await marketingApi.updateSale(editingSale.id, saleForm);
        toast.success('Campaign updated!');
      } else {
        await marketingApi.createSale(saleForm);
        toast.success('Campaign created!');
      }
      setSaleOpen(false);
      loadSales(); loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setSaving(false); }
  };

  const deleteSale = async (id) => {
    if (!window.confirm('Delete this campaign permanently?')) return;
    try {
      await marketingApi.deleteSale(id);
      toast.success('Campaign deleted');
      loadSales(); loadStats();
    } catch { toast.error('Delete failed'); }
  };

  // ── Filtered coupons ────────────────────────────────────────────────────────
  const visibleCoupons = couponSearch
    ? coupons.filter(c =>
        c.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
        c.name.toLowerCase().includes(couponSearch.toLowerCase())
      )
    : coupons;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-10">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-b border-line pb-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-muted" />
            Coupons & Marketing
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Create promotional discounts, sale campaigns, and manage customer outreach.
          </p>
        </div>
        <div className="flex bg-stone border border-line rounded-lg p-0.5 gap-0.5 self-start sm:self-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                tab === id
                  ? 'bg-paper text-ink shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: DASHBOARD OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Tag}
              label="Active Coupons"
              value={stats ? fmt(stats.totalActiveCoupons) : '—'}
              sub={stats ? `${fmt(stats.scheduledCoupons)} scheduled · ${fmt(stats.expiredCoupons)} expired` : ''}
              accent="bg-blue-50 text-blue-600"
            />
            <StatCard
              icon={Megaphone}
              label="Live Campaigns"
              value={stats ? fmt(stats.runningSalesCount) : '—'}
              sub={stats ? `${fmt(stats.upcomingSales)} upcoming` : ''}
              accent="bg-purple-50 text-purple-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Discount Given"
              value={stats ? fmtMoney(stats.revenueGenerated) : '—'}
              sub={stats ? `Avg. ${fmtMoney(Math.round(stats.averageDiscount || 0))} per order` : ''}
              accent="bg-green-50 text-green-600"
            />
            <StatCard
              icon={Zap}
              label="Usage Today"
              value={stats ? fmt(stats.couponUsageToday) : '—'}
              sub={stats ? `${fmt(stats.couponUsageThisMonth)} this month` : ''}
              accent="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Detail Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Redemption Stats */}
            <div className="bg-paper border border-line rounded-xl p-5 space-y-4 col-span-1">
              <h2 className="text-[11px] font-extrabold text-muted tracking-widest border-b border-line pb-2">
                Coupon Redemptions
              </h2>
              <div className="space-y-3 text-xs font-semibold">
                {[
                  ['Usage today', `${fmt(stats?.couponUsageToday)} redemptions`],
                  ['Usage this month', `${fmt(stats?.couponUsageThisMonth)} redemptions`],
                  ['Average discount', fmtMoney(Math.round(stats?.averageDiscount || 0))],
                  ['Conversion rate', `${stats?.conversionRate || 0}%`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-muted">{k}</span>
                    <span className="text-ink">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sale Campaign Stats */}
            <div className="bg-paper border border-line rounded-xl p-5 space-y-4 col-span-1">
              <h2 className="text-[11px] font-extrabold text-muted tracking-widest border-b border-line pb-2">
                Sale Campaign Scope
              </h2>
              <div className="space-y-3 text-xs font-semibold">
                {[
                  ['Running campaigns', fmt(stats?.runningSalesCount)],
                  ['Upcoming campaigns', fmt(stats?.upcomingSales)],
                  ['Products on sale', `${fmt(stats?.productsOnSaleCount)} items`],
                  ['Categories on sale', `${fmt(stats?.categoriesOnSaleCount)} categories`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-muted">{k}</span>
                    <span className="text-ink">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-paper border border-line rounded-xl p-5 space-y-3 col-span-1">
              <h2 className="text-[11px] font-extrabold text-muted tracking-widest border-b border-line pb-2">
                Quick Actions
              </h2>
              <button
                onClick={() => { setTab('coupons'); openCreateCoupon(); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-ink text-paper rounded-lg text-xs font-bold hover:bg-ink/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Coupon
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
              <button
                onClick={() => { setTab('sales'); openCreateSale(); }}
                className="w-full flex items-center gap-3 px-4 py-3 border border-line rounded-lg text-xs font-bold text-ink hover:bg-stone transition-colors"
              >
                <Megaphone className="w-4 h-4" />
                Create Sale Campaign
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
              <button
                onClick={() => setTab('coupons')}
                className="w-full flex items-center gap-3 px-4 py-3 border border-line rounded-lg text-xs font-bold text-ink hover:bg-stone transition-colors"
              >
                <BarChart2 className="w-4 h-4" />
                View All Coupons
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </div>

          {/* Recent Coupons Table */}
          {coupons.length > 0 && (
            <div className="bg-paper border border-line rounded-xl overflow-hidden">
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-line">
                <span className="text-[11px] font-extrabold uppercase text-muted tracking-widest">Recent Coupons</span>
                <button onClick={() => setTab('coupons')} className="text-[11px] font-bold text-ink flex items-center gap-1 hover:underline">
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <table className="w-full text-xs font-semibold text-ink">
                <thead className="bg-stone/50 text-[10px] uppercase text-muted">
                  <tr>
                    <th className="px-5 py-3 text-left">Code</th>
                    <th className="px-5 py-3 text-left">Discount</th>
                    <th className="px-5 py-3 text-left">Valid Till</th>
                    <th className="px-5 py-3 text-center">Uses</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {coupons.slice(0, 5).map(c => {
                    const st = couponStatus(c);
                    return (
                      <tr key={c.id} className="hover:bg-stone/30">
                        <td className="px-5 py-3">
                          <span className="font-mono font-extrabold">{c.code}</span>
                          <span className="block text-[10px] text-muted">{c.name}</span>
                        </td>
                        <td className="px-5 py-3">
                          {c.couponType === 'PERCENTAGE' ? `${c.discountValue}% Off` : c.couponType === 'FLAT' ? `₹${c.discountValue} Off` : 'Free Shipping'}
                        </td>
                        <td className="px-5 py-3 text-muted">{fmtDate(c.validTill)}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="font-bold">{fmt(c.usedCount || c._count?.couponUsages || 0)}</span>
                          <span className="text-muted"> / {fmt(c.maxUses)}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${st.cls}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: COUPONS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'coupons' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-paper border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search code or name..."
                  value={couponSearch}
                  onChange={e => setCouponSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadCoupons()}
                  className="w-full bg-stone border border-line rounded-lg pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-ink/30 transition-colors"
                />
              </div>
              <button onClick={loadCoupons} className="px-3 py-2 border border-line rounded-lg text-muted hover:text-ink hover:bg-stone transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={couponFilter}
                onChange={e => setCouponFilter(e.target.value)}
                className="bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="disabled">Disabled</option>
              </select>
              <button
                onClick={openCreateCoupon}
                className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper rounded-lg text-xs font-bold uppercase hover:bg-ink/90 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Create Coupon
              </button>
            </div>
          </div>

          {/* Coupon Cards Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-muted mx-auto mb-3" />
              <p className="text-xs text-muted">Loading coupons...</p>
            </div>
          ) : visibleCoupons.length === 0 ? (
            <div className="py-20 text-center bg-paper border border-line rounded-xl">
              <Tag className="w-10 h-10 text-line mx-auto mb-3" />
              <p className="text-sm font-bold text-ink">No coupons found</p>
              <p className="text-xs text-muted mt-1 mb-4">Create your first coupon to get started.</p>
              <button
                onClick={openCreateCoupon}
                className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper rounded-lg text-xs font-bold uppercase"
              >
                <Plus className="w-4 h-4" /> Create Coupon
              </button>
            </div>
          ) : (
            <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-semibold text-ink">
                <thead className="bg-stone border-b border-line text-[10px] uppercase text-muted tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Coupon</th>
                    <th className="px-5 py-3.5">Type & Value</th>
                    <th className="px-5 py-3.5">Min. Order</th>
                    <th className="px-5 py-3.5">Validity</th>
                    <th className="px-5 py-3.5 text-center">Uses</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleCoupons.map(c => {
                    const st = couponStatus(c);
                    const usedCount = c.usedCount || c._count?.couponUsages || 0;
                    const usagePct = c.maxUses > 0 ? Math.min(100, (usedCount / c.maxUses) * 100) : 0;
                    return (
                      <tr key={c.id} className="hover:bg-stone/20 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-sm text-ink">{c.name}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <code className="font-mono text-[11px] bg-stone border border-line rounded px-1.5 py-0.5 text-ink">{c.code}</code>
                            <button
                              onClick={() => copyCode(c.code)}
                              className="opacity-0 group-hover:opacity-100 text-muted hover:text-ink transition-opacity"
                            >
                              {copiedCode === c.code
                                ? <Check className="w-3 h-3 text-green-500" />
                                : <Copy className="w-3 h-3" />
                              }
                            </button>
                          </div>
                          {c.description && (
                            <p className="text-[10px] text-muted mt-1 max-w-[200px] truncate">{c.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {c.couponType === 'PERCENTAGE' && <Percent className="w-3.5 h-3.5 text-blue-500" />}
                            {c.couponType === 'FLAT' && <BadgePercent className="w-3.5 h-3.5 text-green-500" />}
                            {c.couponType === 'FREE_SHIPPING' && <Package className="w-3.5 h-3.5 text-purple-500" />}
                            <span className="font-bold">
                              {c.couponType === 'PERCENTAGE' ? `${c.discountValue}%`
                                : c.couponType === 'FLAT' ? `₹${c.discountValue}`
                                : 'Free Ship'}
                            </span>
                          </div>
                          {c.maxDiscount && <div className="text-[10px] text-muted mt-0.5">Max cap ₹{c.maxDiscount}</div>}
                          <div className="text-[10px] text-muted capitalize mt-0.5">{c.applicability?.toLowerCase()}</div>
                        </td>
                        <td className="px-5 py-4">
                          {c.minOrderAmount > 0 ? <span>₹{fmt(c.minOrderAmount)}+</span> : <span className="text-muted">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-ink">{fmtDate(c.validFrom)}</div>
                          <div className="text-muted text-[10px]">till {fmtDate(c.validTill)}</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="font-bold">{fmt(usedCount)} / {fmt(c.maxUses)}</div>
                          <div className="w-full h-1 bg-line rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${usagePct >= 90 ? 'bg-red-500' : usagePct >= 60 ? 'bg-orange-400' : 'bg-green-500'}`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => toggleCoupon(c)}
                              className="p-1.5 rounded-md border border-line text-muted hover:text-ink hover:bg-stone transition-colors"
                              title={c.isActive ? 'Disable coupon' : 'Enable coupon'}
                            >
                              {c.isActive
                                ? <ToggleRight className="w-4 h-4 text-green-500" />
                                : <ToggleLeft className="w-4 h-4" />
                              }
                            </button>
                            <button
                              onClick={() => openEditCoupon(c)}
                              className="p-1.5 rounded-md border border-line text-muted hover:text-ink hover:bg-stone transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteCoupon(c.id)}
                              className="p-1.5 rounded-md border border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CAMPAIGNS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'sales' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-extrabold text-ink">Sale Campaigns</h2>
              <p className="text-[11px] text-muted">{sales.length} campaign{sales.length !== 1 ? 's' : ''} total</p>
            </div>
            <button
              onClick={openCreateSale}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper rounded-lg text-xs font-bold hover:bg-ink/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Campaign
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="py-20 text-center bg-paper border border-line rounded-xl">
              <Megaphone className="w-10 h-10 text-line mx-auto mb-3" />
              <p className="text-sm font-bold text-ink">No sale campaigns yet</p>
              <p className="text-xs text-muted mt-1 mb-4">Launch your first campaign to apply automatic discounts.</p>
              <button onClick={openCreateSale} className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper rounded-lg text-xs font-bold uppercase">
                <Plus className="w-4 h-4" /> Create Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sales.map(sale => {
                const st = saleStatus(sale);
                return (
                  <div
                    key={sale.id}
                    className="bg-paper border border-line rounded-xl overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Color Bar */}
                    <div
                      className="h-1.5 w-full"
                      style={{ backgroundColor: sale.badgeColor || '#e11d48' }}
                    />
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-ink leading-snug truncate">{sale.name}</h3>
                          <p className="text-[11px] text-muted mt-0.5 line-clamp-2">{sale.description || 'No description.'}</p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                          <span
                            className="text-[10px] font-black px-2.5 py-1 rounded-lg text-white"
                            style={{ backgroundColor: sale.badgeColor || '#e11d48' }}
                          >
                            -{sale.salePercentage}% {sale.badgeText}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px] pt-3 border-t border-line">
                        <div>
                          <span className="text-muted block text-[9px] font-bold mb-0.5">Start</span>
                          <span className="font-semibold text-ink">{fmtDate(sale.startDate)}</span>
                        </div>
                        <div>
                          <span className="text-muted block text-[9px] font-bold mb-0.5">End</span>
                          <span className="font-semibold text-ink">{fmtDate(sale.endDate)}</span>
                        </div>
                        <div>
                          <span className="text-muted block text-[9px] font-bold mb-0.5">Scope</span>
                          <span className="font-semibold text-ink capitalize">
                            {sale.campaignType === 'PRODUCT'
                              ? `${(sale.products || []).length} Products`
                              : sale.campaignType === 'CATEGORY'
                              ? `${(sale.categories || []).length} Categories`
                              : 'Storewide'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted block text-[9px] font-bold mb-0.5">Priority</span>
                          <span className="font-semibold text-ink">{sale.priority || 0}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto pt-3 border-t border-line">
                        <button
                          onClick={() => openEditSale(sale)}
                          className="flex-1 py-2 border border-line rounded-lg text-[11px] font-bold text-ink hover:bg-stone transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSale(sale.id)}
                          className="px-3 py-2 border border-red-100 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: NEWSLETTER
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'newsletter' && (
        <div className="space-y-4">
          <div className="bg-paper border border-line rounded-xl p-5 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-extrabold text-ink">Newsletter Subscribers</h2>
              <p className="text-[11px] text-muted mt-0.5">Emails subscribed for newsletters, early drops, and promotions.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-stone border border-line px-3 py-1.5 rounded-lg text-ink">
                <span className="text-muted">Total: </span>{fmt(subscribers.length)}
              </span>
            </div>
          </div>

          <div className="bg-paper border border-line rounded-xl overflow-hidden">
            {subscribers.length === 0 ? (
              <div className="py-20 text-center">
                <Mail className="w-10 h-10 text-line mx-auto mb-3" />
                <p className="text-sm font-bold text-ink">No subscribers yet</p>
                <p className="text-xs text-muted mt-1">Users who sign up for newsletter updates will appear here.</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-stone border-b border-line text-[10px] text-muted font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 text-left">#</th>
                    <th className="px-5 py-3.5 text-left">Email Address</th>
                    <th className="px-5 py-3.5 text-left">Subscribed On</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {subscribers.map((sub, i) => (
                    <tr key={sub.id} className="hover:bg-stone/30 transition-colors">
                      <td className="px-5 py-3.5 text-muted font-mono">{i + 1}</td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-ink">{sub.email}</td>
                      <td className="px-5 py-3.5 text-muted">
                        {fmtDate(sub.createdAt)} at {new Date(sub.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={async () => {
                            if (!window.confirm('Remove this subscriber?')) return;
                            try {
                              await adminApi.deleteNewsletterSubscriber(sub.id);
                              toast.success('Subscriber removed');
                              loadSubscribers();
                            } catch { toast.error('Failed to remove'); }
                          }}
                          className="px-2.5 py-1 border border-red-100 rounded-md text-red-500 hover:bg-red-50 text-[10px] font-bold uppercase transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT COUPON
      ══════════════════════════════════════════════════════════════════════ */}
      {couponOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-paper border border-line rounded-2xl w-full max-w-3xl shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-line">
              <div>
                <h2 className="text-sm font-extrabold uppercase text-ink tracking-wider">
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </h2>
                {editingCoupon && (
                  <code className="text-xs font-mono text-muted">{editingCoupon.code}</code>
                )}
              </div>
              <button onClick={() => setCouponOpen(false)} className="text-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveCoupon} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Coupon Type Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-2">Discount Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {COUPON_TYPES.map(({ value, label, desc, Icon }) => (
                    <label
                      key={value}
                      className={`flex flex-col gap-1.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        couponForm.couponType === value
                          ? 'border-ink bg-ink/5'
                          : 'border-line hover:border-ink/30 bg-paper'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={couponForm.couponType === value}
                        onChange={() => setCouponForm(f => ({ ...f, couponType: value }))}
                      />
                      <Icon className={`w-4 h-4 ${couponForm.couponType === value ? 'text-ink' : 'text-muted'}`} />
                      <span className={`text-[11px] font-bold ${couponForm.couponType === value ? 'text-ink' : 'text-muted'}`}>{label}</span>
                      <span className="text-[10px] text-muted">{desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Name & Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Coupon Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Festival 15% Discount"
                    value={couponForm.name}
                    onChange={e => setCouponForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none focus:border-ink/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Coupon Code *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. FESTIVAL15"
                      value={couponForm.code}
                      onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                      className="flex-1 border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none font-mono uppercase transition-colors focus:border-ink/30"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-3 py-2 bg-stone border border-line rounded-lg text-xs font-bold text-ink hover:bg-stone/80 transition-colors whitespace-nowrap"
                    >
                      🎲 Auto
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description shown to customer on the checkout page..."
                  value={couponForm.description || ''}
                  onChange={e => setCouponForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none resize-none transition-colors focus:border-ink/30"
                />
              </div>

              {/* Value & Caps */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">
                    {couponForm.couponType === 'PERCENTAGE' ? 'Discount %' : couponForm.couponType === 'FLAT' ? 'Flat Amount (₹)' : 'N/A'} *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={couponForm.couponType === 'PERCENTAGE' ? '15' : '200'}
                    value={couponForm.discountValue}
                    onChange={e => setCouponForm(f => ({ ...f, discountValue: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none transition-colors focus:border-ink/30"
                    disabled={couponForm.couponType === 'FREE_SHIPPING'}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={couponForm.maxDiscount || ''}
                    onChange={e => setCouponForm(f => ({ ...f, maxDiscount: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none transition-colors focus:border-ink/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 999"
                    value={couponForm.minOrderAmount || ''}
                    onChange={e => setCouponForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none transition-colors focus:border-ink/30"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Valid From</label>
                  <input
                    type="datetime-local"
                    value={couponForm.validFrom}
                    onChange={e => setCouponForm(f => ({ ...f, validFrom: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none transition-colors focus:border-ink/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Valid Till *</label>
                  <input
                    type="datetime-local"
                    required
                    value={couponForm.validTill}
                    onChange={e => setCouponForm(f => ({ ...f, validTill: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none transition-colors focus:border-ink/30"
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Max Total Uses</label>
                  <input
                    type="number"
                    value={couponForm.maxUses}
                    onChange={e => setCouponForm(f => ({ ...f, maxUses: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none transition-colors focus:border-ink/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Max Uses Per Customer</label>
                  <input
                    type="number"
                    value={couponForm.maxUsesPerCustomer}
                    onChange={e => setCouponForm(f => ({ ...f, maxUsesPerCustomer: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none transition-colors focus:border-ink/30"
                  />
                </div>
              </div>

              {/* Applicability */}
              <div className="border-t border-line pt-4 space-y-3">
                <label className="block text-[10px] font-bold uppercase text-muted">Applicability</label>
                <div className="flex gap-3">
                  {[
                    { value: 'STORE', label: 'Entire Store', Icon: Globe },
                    { value: 'CATEGORIES', label: 'Categories', Icon: Layers },
                    { value: 'PRODUCTS', label: 'Products', Icon: Package },
                  ].map(({ value, label, Icon }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer text-xs font-bold transition-all flex-1 justify-center ${
                        couponForm.applicability === value
                          ? 'border-ink bg-ink/5 text-ink'
                          : 'border-line text-muted hover:border-ink/30'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={couponForm.applicability === value}
                        onChange={() => setCouponForm(f => ({
                          ...f, applicability: value,
                          ...(value === 'STORE' ? { applicableCategoryIds: [], applicableProductIds: [] } : {}),
                          ...(value === 'CATEGORIES' ? { applicableProductIds: [] } : {}),
                          ...(value === 'PRODUCTS' ? { applicableCategoryIds: [] } : {}),
                        }))}
                      />
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </label>
                  ))}
                </div>

                {couponForm.applicability === 'CATEGORIES' && (
                  <div className="bg-stone/50 border border-line rounded-xl p-4 space-y-2">
                    <span className="block text-[10px] font-bold uppercase text-muted">Select Categories</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                      {categories.map(cat => {
                        const checked = couponForm.applicableCategoryIds.includes(cat.id);
                        return (
                          <label key={cat.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer hover:text-ink/80">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const list = checked
                                  ? couponForm.applicableCategoryIds.filter(id => id !== cat.id)
                                  : [...couponForm.applicableCategoryIds, cat.id];
                                setCouponForm(f => ({ ...f, applicableCategoryIds: list }));
                              }}
                              className="rounded"
                            />
                            <span className="truncate">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {couponForm.applicability === 'PRODUCTS' && (
                  <div className="bg-stone/50 border border-line rounded-xl p-4 space-y-2">
                    <span className="block text-[10px] font-bold uppercase text-muted">Filter by Category</span>
                    <select
                      value={pickerCategory}
                      onChange={e => loadPickerProducts(e.target.value)}
                      className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none"
                    >
                      <option value="">All Products</option>
                      {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    </select>
                    {(pickerCategory ? pickerProducts : products).length > 0 && (
                      <>
                        <span className="block text-[10px] font-bold uppercase text-muted">Select Products</span>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-paper border border-line p-3 rounded-lg">
                          {(pickerCategory ? pickerProducts : products).map(p => {
                            const checked = couponForm.applicableProductIds.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const list = checked
                                      ? couponForm.applicableProductIds.filter(id => id !== p.id)
                                      : [...couponForm.applicableProductIds, p.id];
                                    setCouponForm(f => ({ ...f, applicableProductIds: list }));
                                  }}
                                  className="rounded"
                                />
                                <span className="truncate">{p.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Restriction Flags */}
              <div className="border-t border-line pt-4">
                <label className="block text-[10px] font-bold uppercase text-muted mb-3">Restrictions & Flags</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'newCustomerOnly', label: 'New Customers Only' },
                    { key: 'loggedInOnly', label: 'Logged In Only' },
                    { key: 'excludeSaleProducts', label: 'Exclude Sale Products' },
                    { key: 'stackable', label: 'Stackable with Others' },
                    { key: 'autoApply', label: 'Auto Apply' },
                    { key: 'allowMultipleRedeem', label: 'Allow Multiple Redemptions' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                      <Toggle
                        checked={!!couponForm[key]}
                        onChange={() => setCouponForm(f => ({ ...f, [key]: !f[key] }))}
                      />
                      <span className="text-[11px] font-semibold text-ink group-hover:text-ink/80">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between bg-stone/50 border border-line rounded-xl p-4">
                <div>
                  <span className="text-xs font-bold text-ink block">Coupon Active</span>
                  <span className="text-[10px] text-muted">Enable or disable this coupon for customers</span>
                </div>
                <Toggle
                  checked={!!couponForm.isActive}
                  onChange={() => setCouponForm(f => ({ ...f, isActive: !f.isActive }))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setCouponOpen(false)}
                  className="flex-1 py-2.5 border border-line rounded-lg text-xs font-bold text-ink uppercase hover:bg-stone transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-ink text-paper text-xs font-bold rounded-lg uppercase hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT SALE CAMPAIGN
      ══════════════════════════════════════════════════════════════════════ */}
      {saleOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-paper border border-line rounded-2xl w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-line">
              <h2 className="text-sm font-extrabold uppercase text-ink tracking-wider">
                {editingSale ? 'Edit Campaign' : 'Create Sale Campaign'}
              </h2>
              <button onClick={() => setSaleOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveSale} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Campaign Title *</label>
                  <input
                    type="text" required
                    placeholder="e.g. End of Season Clearance"
                    value={saleForm.name}
                    onChange={e => setSaleForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none focus:border-ink/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Discount Percentage (%) *</label>
                  <input
                    type="number" required
                    placeholder="25"
                    value={saleForm.salePercentage}
                    onChange={e => setSaleForm(f => ({ ...f, salePercentage: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none focus:border-ink/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief details about items included in this campaign..."
                  value={saleForm.description || ''}
                  onChange={e => setSaleForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none resize-none focus:border-ink/30 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Start Date *</label>
                  <input
                    type="datetime-local" required
                    value={saleForm.startDate}
                    onChange={e => setSaleForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none focus:border-ink/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">End Date *</label>
                  <input
                    type="datetime-local" required
                    value={saleForm.endDate}
                    onChange={e => setSaleForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none focus:border-ink/30 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Badge Text</label>
                  <input
                    type="text"
                    value={saleForm.badgeText}
                    onChange={e => setSaleForm(f => ({ ...f, badgeText: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none focus:border-ink/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Badge Color</label>
                  <input
                    type="color"
                    value={saleForm.badgeColor}
                    onChange={e => setSaleForm(f => ({ ...f, badgeColor: e.target.value }))}
                    className="w-full border border-line rounded-lg h-9 p-1 bg-stone cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Priority</label>
                  <input
                    type="number"
                    value={saleForm.priority}
                    onChange={e => setSaleForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none focus:border-ink/30 transition-colors"
                  />
                </div>
              </div>

              {/* Campaign Scope */}
              <div className="border-t border-line pt-4 space-y-3">
                <label className="block text-[10px] font-bold uppercase text-muted">Campaign Scope</label>
                <div className="flex gap-3">
                  {[
                    { value: 'STORE', label: 'Storewide', Icon: Globe },
                    { value: 'CATEGORY', label: 'Categories', Icon: Layers },
                    { value: 'PRODUCT', label: 'Products', Icon: Package },
                  ].map(({ value, label, Icon }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer text-xs font-bold transition-all flex-1 justify-center ${
                        saleForm.campaignType === value
                          ? 'border-ink bg-ink/5 text-ink'
                          : 'border-line text-muted hover:border-ink/30'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={saleForm.campaignType === value}
                        onChange={() => setSaleForm(f => ({
                          ...f, campaignType: value,
                          ...(value === 'STORE' ? { categoryIds: [], productIds: [] } : {}),
                        }))}
                      />
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </label>
                  ))}
                </div>

                {saleForm.campaignType === 'CATEGORY' && (
                  <div className="bg-stone/50 border border-line rounded-xl p-4 space-y-2">
                    <span className="block text-[10px] font-bold uppercase text-muted">Select Categories</span>
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                      {categories.map(c => {
                        const checked = saleForm.categoryIds.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                            <input
                              type="checkbox" checked={checked}
                              onChange={() => {
                                const list = checked
                                  ? saleForm.categoryIds.filter(id => id !== c.id)
                                  : [...saleForm.categoryIds, c.id];
                                setSaleForm(f => ({ ...f, categoryIds: list }));
                              }}
                              className="rounded"
                            />
                            <span className="truncate">{c.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {saleForm.campaignType === 'PRODUCT' && (
                  <div className="bg-stone/50 border border-line rounded-xl p-4 space-y-2">
                    <span className="block text-[10px] font-bold uppercase text-muted">Filter by Category</span>
                    <select
                      value={pickerCategory}
                      onChange={e => loadPickerProducts(e.target.value)}
                      className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none"
                    >
                      <option value="">All Products</option>
                      {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    </select>
                    {(pickerCategory ? pickerProducts : products).length > 0 && (
                      <>
                        <span className="block text-[10px] font-bold uppercase text-muted">Select Products</span>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-paper border border-line p-3 rounded-lg">
                          {(pickerCategory ? pickerProducts : products).map(p => {
                            const checked = saleForm.productIds.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                                <input
                                  type="checkbox" checked={checked}
                                  onChange={() => {
                                    const list = checked
                                      ? saleForm.productIds.filter(id => id !== p.id)
                                      : [...saleForm.productIds, p.id];
                                    setSaleForm(f => ({ ...f, productIds: list }));
                                  }}
                                  className="rounded"
                                />
                                <span className="truncate">{p.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setSaleOpen(false)}
                  className="flex-1 py-2.5 border border-line rounded-lg text-xs font-bold text-ink uppercase hover:bg-stone transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-ink text-paper text-xs font-bold rounded-lg uppercase hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingSale ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
