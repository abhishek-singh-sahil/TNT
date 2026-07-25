import { useState, useEffect } from 'react';
import { Trash2, Edit3, Plus, Search, RefreshCw, X, Gift, Percent, Tag, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { marketingApi, adminApi, productApi } from '../../api/services';

export default function AdminMarketing() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState('all');

  // Coupon Form state
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    name: '',
    code: '',
    description: '',
    couponType: 'PERCENTAGE',
    discountValue: '',
    maxDiscount: '',
    minOrderAmount: '',
    maxUses: '1000',
    maxUsesPerCustomer: '1',
    priority: '0',
    autoApply: false,
    stackable: false,
    newCustomerOnly: false,
    loggedInOnly: true,
    allowMultipleRedeem: false,
    applicability: 'STORE',
    applicableCategoryIds: [],
    applicableProductIds: [],
    excludedCategoryIds: [],
    excludedProductIds: [],
    excludeSaleProducts: false,
    validFrom: '',
    validTill: '',
    isActive: true
  });

  // Category Product Picker helpers
  const [pickerCategory, setPickerCategory] = useState('');
  const [pickerProducts, setPickerProducts] = useState([]);

  // Sale Form state
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [saleForm, setSaleForm] = useState({
    name: '',
    description: '',
    salePercentage: '',
    startDate: '',
    endDate: '',
    priority: '0',
    status: 'ACTIVE',
    bgColor: '#f5f5f7',
    badgeColor: '#ff0000',
    badgeText: 'SALE',
    displayOrder: '0',
    campaignType: 'PRODUCT',
    categoryIds: [],
    productIds: []
  });

  useEffect(() => {
    fetchStats();
    fetchCoupons();
    fetchSales();
    fetchMetadata();
  }, [couponFilter]);

   const fetchStats = async () => {
    try {
      const res = await marketingApi.getStats();
      if (res.success) setStats(res.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await marketingApi.getCoupons({ search: couponSearch, filter: couponFilter });
      if (res.success) setCoupons(res.coupons);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await marketingApi.getSales();
      if (res.success) setSales(res.campaigns);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        adminApi.getCategories(),
        productApi.getProducts({ limit: 100 })
      ]);
      if (catRes.success) setCategories(catRes.categories);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPickerProducts = async (catSlug) => {
    try {
      setPickerCategory(catSlug);
      const res = await productApi.getProducts({ category: catSlug, limit: 100 });
      if (res.success) {
        setPickerProducts(res.products);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TNT';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponForm({ ...couponForm, code });
  };

  // Coupon CRUD Actions
  const handleOpenCouponCreate = () => {
    setEditingCoupon(null);
    setCouponForm({
      name: '',
      code: '',
      description: '',
      couponType: 'PERCENTAGE',
      discountValue: '',
      maxDiscount: '',
      minOrderAmount: '',
      maxUses: '1000',
      maxUsesPerCustomer: '1',
      priority: '0',
      autoApply: false,
      stackable: false,
      newCustomerOnly: false,
      loggedInOnly: true,
      allowMultipleRedeem: false,
      applicability: 'STORE',
      applicableCategoryIds: [],
      applicableProductIds: [],
      excludedCategoryIds: [],
      excludedProductIds: [],
      excludeSaleProducts: false,
      validFrom: new Date().toISOString().substring(0, 16),
      validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
      isActive: true
    });
    setCouponModalOpen(true);
  };

  const handleOpenCouponEdit = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      ...coupon,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().substring(0, 16) : '',
      validTill: coupon.validTill ? new Date(coupon.validTill).toISOString().substring(0, 16) : ''
    });
    setCouponModalOpen(true);
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await marketingApi.updateCoupon(editingCoupon.id, couponForm);
      } else {
        await marketingApi.createCoupon(couponForm);
      }
      setCouponModalOpen(false);
      fetchCoupons();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon permanently?')) return;
    try {
      await marketingApi.deleteCoupon(id);
      fetchCoupons();
      fetchStats();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleToggleCouponActive = async (coupon) => {
    try {
      await marketingApi.updateCoupon(coupon.id, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Sale Campaign Actions
  const handleOpenSaleCreate = () => {
    setEditingSale(null);
    setSaleForm({
      name: '',
      description: '',
      salePercentage: '',
      startDate: new Date().toISOString().substring(0, 16),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
      priority: '0',
      status: 'ACTIVE',
      bgColor: '#f5f5f7',
      badgeColor: '#ff0000',
      badgeText: 'SALE',
      displayOrder: '0',
      campaignType: 'PRODUCT',
      categoryIds: [],
      productIds: []
    });
    setSaleModalOpen(true);
  };

  const handleOpenSaleEdit = (sale) => {
    setEditingSale(sale);
    setSaleForm({
      ...sale,
      startDate: sale.startDate ? new Date(sale.startDate).toISOString().substring(0, 16) : '',
      endDate: sale.endDate ? new Date(sale.endDate).toISOString().substring(0, 16) : '',
      categoryIds: sale.categories.map(c => c.id),
      productIds: sale.products.map(p => p.id)
    });
    setSaleModalOpen(true);
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSale) {
        await marketingApi.updateSale(editingSale.id, saleForm);
      } else {
        await marketingApi.createSale(saleForm);
      }
      setSaleModalOpen(false);
      fetchSales();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm('Delete this sale campaign permanently?')) return;
    try {
      await marketingApi.deleteSale(id);
      fetchSales();
      fetchStats();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight uppercase text-ink">Coupons & Campaigns Suite</h1>
          <p className="text-xs text-muted">Create custom storefront promotional discounts, coupon validation structures, and sale flags.</p>
        </div>
        <div className="flex border border-line rounded bg-stone p-0.5 self-start md:self-auto text-[11px] font-bold uppercase">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded transition-all ${activeTab === 'dashboard' ? 'bg-paper text-ink shadow-xs' : 'text-muted hover:text-ink'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3 py-1.5 rounded transition-all ${activeTab === 'coupons' ? 'bg-paper text-ink shadow-xs' : 'text-muted hover:text-ink'}`}
          >
            Coupons
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded transition-all ${activeTab === 'sales' ? 'bg-paper text-ink shadow-xs' : 'text-muted hover:text-ink'}`}
          >
            Sales Campaigns
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-paper border border-line rounded-lg p-4 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">Active Coupons</span>
              <span className="text-2xl font-black text-ink">{stats.totalActiveCoupons} Active</span>
            </div>
            <div className="bg-paper border border-line rounded-lg p-4 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">Running Campaigns</span>
              <span className="text-2xl font-black text-ink">{stats.runningSalesCount} Campaigns</span>
            </div>
            <div className="bg-paper border border-line rounded-lg p-4 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">Discount Redeemed</span>
              <span className="text-2xl font-black text-ink">₹{stats.revenueGenerated?.toLocaleString() || 0}</span>
            </div>
            <div className="bg-paper border border-line rounded-lg p-4 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">Conversion Rate</span>
              <span className="text-2xl font-black text-green-600">{stats.conversionRate}% Rate</span>
            </div>
          </div>

          {/* Detailed Statistics List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-paper border border-line rounded-xl p-5 space-y-4">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider block border-b border-line pb-2">
                Coupon & Discount Redeems
              </span>
              <div className="space-y-3.5 text-xs font-semibold text-ink">
                <div className="flex justify-between">
                  <span className="text-muted">Coupon Usage Today</span>
                  <span>{stats.couponUsageToday} redemptions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Coupon Usage This Month</span>
                  <span>{stats.couponUsageThisMonth} redemptions</span>
                </div>
                <div className="flex justify-between border-t border-line pt-3 mt-3">
                  <span className="text-muted">Average Discount Applied</span>
                  <span>₹{Math.round(stats.averageDiscount || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-paper border border-line rounded-xl p-5 space-y-4">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider block border-b border-line pb-2">
                Sales Scope Overview
              </span>
              <div className="space-y-3.5 text-xs font-semibold text-ink">
                <div className="flex justify-between">
                  <span className="text-muted">Scheduled (Upcoming) campaigns</span>
                  <span>{stats.upcomingSales} sales</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Products currently on sale</span>
                  <span>{stats.productsOnSaleCount} items</span>
                </div>
                <div className="flex justify-between border-t border-line pt-3 mt-3">
                  <span className="text-muted">Categories currently on sale</span>
                  <span>{stats.categoriesOnSaleCount} categories</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COUPONS TAB */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="bg-paper border border-line rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1 max-w-md w-full">
              <input
                type="text"
                placeholder="Search coupon code or name..."
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
              />
              <button
                onClick={fetchCoupons}
                className="px-4 py-2 bg-ink text-paper text-xs font-bold rounded uppercase flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> Search
              </button>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={couponFilter}
                onChange={(e) => setCouponFilter(e.target.value)}
                className="bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
              >
                <option value="all">All Coupons</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
              <button
                onClick={handleOpenCouponCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper rounded text-xs font-bold uppercase hover:bg-ink/90"
              >
                <Plus className="w-4 h-4" /> Create Coupon
              </button>
            </div>
          </div>

          {/* Coupons List Grid */}
          {loading ? (
            <div className="py-16 text-center text-xs text-muted flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="bg-paper border border-line rounded-lg py-16 text-center text-xs text-muted">
              No matching coupons found. Click "Create Coupon" above to set one up.
            </div>
          ) : (
            <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-semibold text-ink">
                <thead className="bg-stone border-b border-line uppercase text-[10px] font-bold text-muted">
                  <tr>
                    <th className="p-4">Coupon Name & Code</th>
                    <th className="p-4">Type & Value</th>
                    <th className="p-4">Applicability</th>
                    <th className="p-4">Validation Dates</th>
                    <th className="p-4 text-center">Uses</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-stone/20">
                      <td className="p-4">
                        <div className="font-extrabold text-ink">{coupon.name}</div>
                        <div className="font-mono text-[10px] text-muted">{coupon.code}</div>
                      </td>
                      <td className="p-4">
                        <div className="capitalize">{coupon.couponType.toLowerCase().replace('_', ' ')}</div>
                        <div className="text-muted text-[10px]">
                          {coupon.couponType === 'PERCENTAGE' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Flat`}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="capitalize">{coupon.applicability.toLowerCase()}</div>
                        <div className="text-muted text-[10px]">
                          {coupon.applicability === 'STORE' ? 'All catalog items' : 'Selected links'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>Till {new Date(coupon.validTill).toLocaleDateString()}</div>
                        <div className="text-[9px] text-muted">From {new Date(coupon.validFrom).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold">{coupon.usedCount}</span>
                        <span className="text-muted text-[10px]"> / {coupon.maxUses}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleCouponActive(coupon)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            coupon.isActive && new Date(coupon.validTill) >= new Date()
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {coupon.isActive && new Date(coupon.validTill) >= new Date() ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenCouponEdit(coupon)}
                          className="p-1 border border-line rounded text-muted hover:text-ink"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="p-1 border border-line rounded text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SALES TAB */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="bg-paper border border-line rounded-lg p-4 flex justify-between items-center">
            <span className="text-xs font-bold text-muted uppercase">Active Discount Campaigns</span>
            <button
              onClick={handleOpenSaleCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper rounded text-xs font-bold uppercase hover:bg-ink/90"
            >
              <Plus className="w-4 h-4" /> Create Sale Campaign
            </button>
          </div>

          {/* Sales List Grid */}
          {sales.length === 0 ? (
            <div className="bg-paper border border-line rounded-lg py-16 text-center text-xs text-muted">
              No active sale campaigns created yet. Click "Create Campaign" above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sales.map((sale) => (
                <div key={sale.id} className="bg-paper border border-line rounded-xl p-5 space-y-3.5 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-sm text-ink">{sale.name}</h3>
                        <p className="text-[11px] text-muted">{sale.description || 'No description provided.'}</p>
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                        style={{ backgroundColor: sale.badgeColor, color: '#ffffff' }}
                      >
                        {sale.badgeText} -{sale.salePercentage}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[11px] text-ink border-t border-line pt-3">
                      <div>
                        <span className="text-muted block text-[9px] uppercase">Duration</span>
                        {new Date(sale.startDate).toLocaleDateString()} - {new Date(sale.endDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-muted block text-[9px] uppercase">Scope</span>
                        {sale.campaignType === 'PRODUCT'
                          ? `${sale.products.length} Products`
                          : sale.campaignType === 'CATEGORY'
                          ? `${sale.categories.length} Categories`
                          : 'Storewide'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-line mt-3">
                    <button
                      onClick={() => handleOpenSaleEdit(sale)}
                      className="flex-1 py-1.5 border border-line rounded text-xs font-bold text-ink hover:bg-stone/50 uppercase"
                    >
                      Edit Campaign
                    </button>
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      className="px-3 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COUPON MODAL POPUP */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
              </span>
              <button onClick={() => setCouponModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCouponSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Coupon Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Festival 15% discount"
                    value={couponForm.name}
                    onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Coupon Code *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. FESTIVAL15"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                      className="flex-1 border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="px-3 py-2 bg-stone border border-line rounded text-xs font-bold text-ink hover:bg-stone/85"
                    >
                      🎲 Auto
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Get 15% off on your purchase when you spend 1999 or more."
                  value={couponForm.description || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Discount Type *</label>
                  <select
                    value={couponForm.couponType}
                    onChange={(e) => setCouponForm({ ...couponForm, couponType: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (INR)</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    placeholder="15"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Max Discount (Cap)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={couponForm.maxDiscount || ''}
                    onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Valid From</label>
                  <input
                    type="datetime-local"
                    value={couponForm.validFrom}
                    onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Valid Till *</label>
                  <input
                    type="datetime-local"
                    required
                    value={couponForm.validTill}
                    onChange={(e) => setCouponForm({ ...couponForm, validTill: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              {/* Constraints */}
              <div className="grid grid-cols-3 gap-4 border-t border-line pt-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Minimum Order Amount</label>
                  <input
                    type="number"
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Max Total Uses</label>
                  <input
                    type="number"
                    value={couponForm.maxUses}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Max Uses Per Customer</label>
                  <input
                    type="number"
                    value={couponForm.maxUsesPerCustomer}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUsesPerCustomer: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              {/* Applicability section */}
              <div className="border-t border-line pt-4 space-y-3">
                <span className="block text-[10px] font-bold uppercase text-muted">Applicability Choice</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="applicability"
                      checked={couponForm.applicability === 'STORE'}
                      onChange={() => setCouponForm({ ...couponForm, applicability: 'STORE', applicableCategoryIds: [], applicableProductIds: [] })}
                    />
                    Entire Store
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="applicability"
                      checked={couponForm.applicability === 'CATEGORIES'}
                      onChange={() => setCouponForm({ ...couponForm, applicability: 'CATEGORIES', applicableProductIds: [] })}
                    />
                    Selected Categories
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="applicability"
                      checked={couponForm.applicability === 'PRODUCTS'}
                      onChange={() => setCouponForm({ ...couponForm, applicability: 'PRODUCTS', applicableCategoryIds: [] })}
                    />
                    Selected Products
                  </label>
                </div>

                {couponForm.applicability === 'CATEGORIES' && (
                  <div className="space-y-2 bg-stone/20 p-3 border border-line rounded-lg">
                    <span className="block text-[9px] font-bold uppercase text-muted mb-1">Select Category Scope</span>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {categories.map(cat => {
                        const isChecked = couponForm.applicableCategoryIds.includes(cat.id);
                        return (
                          <label key={cat.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const list = isChecked
                                  ? couponForm.applicableCategoryIds.filter(id => id !== cat.id)
                                  : [...couponForm.applicableCategoryIds, cat.id];
                                setCouponForm({ ...couponForm, applicableCategoryIds: list });
                              }}
                            />
                            {cat.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {couponForm.applicability === 'PRODUCTS' && (
                  <div className="space-y-3 bg-stone/20 p-3 border border-line rounded-lg">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <span className="block text-[9px] font-bold uppercase text-muted mb-1">Category Filter</span>
                        <select
                          value={pickerCategory}
                          onChange={(e) => loadPickerProducts(e.target.value)}
                          className="w-full bg-paper border border-line rounded px-2 py-1 text-xs text-ink focus:outline-none"
                        >
                          <option value="">Select Category...</option>
                          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {pickerProducts.length > 0 && (
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-muted mb-1">Select Products</span>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-paper border border-line p-2 rounded">
                          {pickerProducts.map(p => {
                            const isChecked = couponForm.applicableProductIds.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const list = isChecked
                                      ? couponForm.applicableProductIds.filter(id => id !== p.id)
                                      : [...couponForm.applicableProductIds, p.id];
                                    setCouponForm({ ...couponForm, applicableProductIds: list });
                                  }}
                                />
                                {p.name}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Advanced restriction switches */}
              <div className="border-t border-line pt-4 grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={couponForm.newCustomerOnly}
                    onChange={(e) => setCouponForm({ ...couponForm, newCustomerOnly: e.target.checked })}
                  />
                  New Customers Only
                </label>
                <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={couponForm.excludeSaleProducts}
                    onChange={(e) => setCouponForm({ ...couponForm, excludeSaleProducts: e.target.checked })}
                  />
                  Exclude Sale Products
                </label>
                <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={couponForm.isActive}
                    onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  />
                  Enable Coupon
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="flex-1 py-2 border border-line rounded text-xs font-bold text-ink uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-ink text-paper text-xs font-bold rounded uppercase"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALE CAMPAIGN MODAL POPUP */}
      {saleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-medium">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {editingSale ? `Edit Campaign: ${editingSale.name}` : 'Create Sale Campaign'}
              </span>
              <button onClick={() => setSaleModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Campaign Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. End of Season Clearance"
                    value={saleForm.name}
                    onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Discount Percentage (%) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25"
                    value={saleForm.salePercentage}
                    onChange={(e) => setSaleForm({ ...saleForm, salePercentage: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details about items included in this campaign..."
                  value={saleForm.description || ''}
                  onChange={(e) => setSaleForm({ ...saleForm, description: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Start Date *</label>
                  <input
                    type="datetime-local"
                    required
                    value={saleForm.startDate}
                    onChange={(e) => setSaleForm({ ...saleForm, startDate: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">End Date *</label>
                  <input
                    type="datetime-local"
                    required
                    value={saleForm.endDate}
                    onChange={(e) => setSaleForm({ ...saleForm, endDate: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={saleForm.badgeText}
                    onChange={(e) => setSaleForm({ ...saleForm, badgeText: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Badge Color</label>
                  <input
                    type="color"
                    value={saleForm.badgeColor}
                    onChange={(e) => setSaleForm({ ...saleForm, badgeColor: e.target.value })}
                    className="w-full border border-line rounded h-9 w-full bg-stone p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Display Priority</label>
                  <input
                    type="number"
                    value={saleForm.priority}
                    onChange={(e) => setSaleForm({ ...saleForm, priority: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              {/* Campaign Scope Applicability */}
              <div className="border-t border-line pt-4 space-y-3">
                <span className="block text-[10px] font-bold uppercase text-muted">Campaign Application Range</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="campaignType"
                      checked={saleForm.campaignType === 'STORE'}
                      onChange={() => setSaleForm({ ...saleForm, campaignType: 'STORE', categoryIds: [], productIds: [] })}
                    />
                    Storewide Discount
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="campaignType"
                      checked={saleForm.campaignType === 'CATEGORY'}
                      onChange={() => setSaleForm({ ...saleForm, campaignType: 'CATEGORY', productIds: [] })}
                    />
                    Selected Categories
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="campaignType"
                      checked={saleForm.campaignType === 'PRODUCT'}
                      onChange={() => setSaleForm({ ...saleForm, campaignType: 'PRODUCT', categoryIds: [] })}
                    />
                    Selected Products
                  </label>
                </div>

                {saleForm.campaignType === 'CATEGORY' && (
                  <div className="bg-stone/20 p-3 border border-line rounded-lg">
                    <span className="block text-[9px] font-bold uppercase text-muted mb-1.5">Apply to Categories</span>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {categories.map(c => {
                        const isChecked = saleForm.categoryIds.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const list = isChecked
                                  ? saleForm.categoryIds.filter(id => id !== c.id)
                                  : [...saleForm.categoryIds, c.id];
                                setSaleForm({ ...saleForm, categoryIds: list });
                              }}
                            />
                            {c.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {saleForm.campaignType === 'PRODUCT' && (
                  <div className="bg-stone/20 p-3 border border-line rounded-lg space-y-3">
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-muted mb-1">Filter Products by Category</span>
                      <select
                        value={pickerCategory}
                        onChange={(e) => loadPickerProducts(e.target.value)}
                        className="w-full bg-paper border border-line rounded px-2 py-1 text-xs text-ink focus:outline-none"
                      >
                        <option value="">Select Category...</option>
                        {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                      </select>
                    </div>

                    {pickerProducts.length > 0 && (
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-muted mb-1">Select Products</span>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-paper border border-line p-2 rounded">
                          {pickerProducts.map(p => {
                            const isChecked = saleForm.productIds.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const list = isChecked
                                      ? saleForm.productIds.filter(id => id !== p.id)
                                      : [...saleForm.productIds, p.id];
                                    setSaleForm({ ...saleForm, productIds: list });
                                  }}
                                />
                                {p.name}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setSaleModalOpen(false)}
                  className="flex-1 py-2 border border-line rounded text-xs font-bold text-ink uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-ink text-paper text-xs font-bold rounded uppercase"
                >
                  Save Sale Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
