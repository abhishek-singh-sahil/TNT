import { useState, useEffect } from 'react';
import { adminApi } from '../../api/services';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Calendar,
  Settings,
  Bell,
  RefreshCw,
  Plus,
  Check,
  Star,
  Tag,
  Loader,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useRBAC } from '../../hooks/useRBAC';

export default function AdminDashboard() {
  const currencySymbol = '₹';
  const { user } = useSelector((state) => state.auth);
  const { hasPermission } = useRBAC();

  const hasReports = hasPermission('view_reports');
  const hasOrders = hasPermission('view_orders');
  const hasCustomers = hasPermission('view_customers');
  const hasProducts = hasPermission('view_products');
  const hasReviews = hasPermission('view_reviews');

  // States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRangeKey, setDateRangeKey] = useState('last30');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [salesTab, setSalesTab] = useState('revenue'); // revenue | orders
  
  // Restock modal state
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState('50');
  const [restockLoading, setRestockLoading] = useState(false);

  // Calculate static ranges
  const getDateRange = (key) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    switch (key) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(today.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last7':
        start.setDate(today.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'last30':
        start.setDate(today.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        start.setDate(today.getDate() - 30);
        break;
    }
    return { start, end };
  };

  const fetchDashboardData = async (rangeKey, startInput = null, endInput = null) => {
    setLoading(true);
    try {
      let start, end;
      if (rangeKey === 'custom' && startInput && endInput) {
        start = new Date(startInput);
        end = new Date(endInput);
      } else {
        const range = getDateRange(rangeKey);
        start = range.start;
        end = range.end;
      }

      const res = await adminApi.getDashboardData({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error('Failed to load metrics');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(dateRangeKey);
  }, [dateRangeKey]);

  // Handle Restock submit
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockItem || parseInt(restockQty) <= 0) return;
    setRestockLoading(true);
    try {
      const res = await adminApi.restockVariant({
        productVariantId: restockItem.id,
        quantity: parseInt(restockQty)
      });
      if (res.success) {
        toast.success('Inventory restocked successfully!');
        setRestockItem(null);
        // Refresh data
        fetchDashboardData(dateRangeKey, customDates.start, customDates.end);
      } else {
        toast.error(res.message || 'Restock failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Restock API call failed');
    } finally {
      setRestockLoading(false);
    }
  };

  const formatCurrency = (val) => `${currencySymbol}${val.toLocaleString()}`;

  const dateRangeOptions = [
    { label: 'Today', key: 'today' },
    { label: 'Yesterday', key: 'yesterday' },
    { label: 'Last 7 Days', key: 'last7' },
    { label: 'Last 30 Days', key: 'last30' },
    { label: 'This Month', key: 'thisMonth' },
    { label: 'Last Month', key: 'lastMonth' },
    { label: 'This Year', key: 'thisYear' },
  ];

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-stone rounded" />
            <div className="h-4 w-72 bg-stone rounded" />
          </div>
          <div className="h-10 w-44 bg-stone rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-paper border border-line rounded-xl p-5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-paper border border-line rounded-xl" />
          <div className="h-80 bg-paper border border-line rounded-xl" />
        </div>
      </div>
    );
  }

  // Fallback defaults if null
  const kpis = data?.kpis || {
    revenue: { value: 0, change: 0, sparkline: [] },
    orders: { value: 0, change: 0, sparkline: [] },
    customers: { value: 0, change: 0, sparkline: [] },
    conversion: { value: 0, change: 0, sparkline: [] },
  };

  const salesPerformance = data?.salesPerformance || {
    revenue: 0,
    orders: 0,
    aov: 0,
    newCustomers: 0,
    chart: [],
  };

  const inventoryAlerts = data?.inventoryAlerts || [];
  const recentOrders = data?.recentOrders || [];
  const topSellingProducts = data?.topSellingProducts || [];
  const customerGrowth = data?.customerGrowth || { total: 0, change: 0, chart: [] };
  const recentReviews = data?.recentReviews || [];

  const visibleKpis = [hasReports, hasOrders, hasCustomers, hasReports].filter(Boolean).length;

  return (
    <div className="space-y-8 pb-16">
      {/* Dashboard Top Header & Date Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-muted font-medium">Track, analyze and manage your business performance in real time.</p>
        </div>
        
        {/* Date Selector Dropdown */}
        <div className="relative w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={dateRangeKey}
              onChange={(e) => {
                const val = e.target.value;
                setDateRangeKey(val);
                if (val !== 'custom') {
                  setShowCustomPicker(false);
                } else {
                  setShowCustomPicker(true);
                }
              }}
              className="bg-paper border border-line text-xs px-3.5 py-2 rounded-lg font-bold text-ink tracking-wider focus:outline-none focus:border-ink cursor-pointer flex-1 sm:flex-initial"
            >
              {dateRangeOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
              <option value="custom">Custom Range</option>
            </select>
            
            <button
              onClick={() => fetchDashboardData(dateRangeKey, customDates.start, customDates.end)}
              className="p-2 bg-stone border border-line rounded-lg hover:bg-stone/80 text-ink transition-colors"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Custom Date Picker Inputs */}
          {showCustomPicker && (
            <div className="absolute right-0 mt-2 bg-paper border border-line rounded-xl p-4 shadow-xl z-50 space-y-3 w-64 animate-fadeIn">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Set custom dates</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-muted mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customDates.start}
                    onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                    className="w-full bg-stone border border-line rounded p-2 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-muted mb-1">End Date</label>
                  <input
                    type="date"
                    value={customDates.end}
                    onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                    className="w-full bg-stone border border-line rounded p-2 text-xs text-ink focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  fetchDashboardData('custom', customDates.start, customDates.end);
                  setShowCustomPicker(false);
                }}
                disabled={!customDates.start || !customDates.end}
                className="w-full py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 disabled:opacity-50 transition-colors"
              >
                Apply Range
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      {visibleKpis > 0 ? (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${visibleKpis} gap-5`}>
          {hasReports && (
            <KPISparkCard
              title="Total Revenue"
              value={formatCurrency(kpis.revenue.value)}
              change={kpis.revenue.change}
              sparklineData={kpis.revenue.sparkline}
              type="revenue"
              icon={DollarSign}
              onClick={() => setSalesTab('revenue')}
            />
          )}
          {hasOrders && (
            <KPISparkCard
              title="Total Orders"
              value={kpis.orders.value}
              change={kpis.orders.change}
              sparklineData={kpis.orders.sparkline}
              type="orders"
              icon={ShoppingBag}
              onClick={() => setSalesTab('orders')}
            />
          )}
          {hasCustomers && (
            <KPISparkCard
              title="Registered Customers"
              value={kpis.customers.value}
              change={kpis.customers.change}
              sparklineData={kpis.customers.sparkline}
              type="customers"
              icon={Users}
              onClick={() => setSalesTab('customers')}
            />
          )}
          {hasReports && (
            <KPISparkCard
              title="Conversion Rate"
              value={`${kpis.conversion.value}%`}
              change={kpis.conversion.change}
              sparklineData={kpis.conversion.sparkline}
              type="conversion"
              icon={TrendingUp}
              onClick={() => setSalesTab('conversion')}
            />
          )}
        </div>
      ) : (
        <div className="bg-paper border border-line rounded-xl p-6 text-center text-xs text-muted font-bold uppercase tracking-wider">
          No KPI metrics visible for this staff role.
        </div>
      )}

      {/* Sales Performance Chart + Low Stock Alert Panel */}
      {(hasReports || hasOrders || hasProducts) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Sales Chart panel */}
          {(hasReports || hasOrders) && (
            <div className={`${hasProducts ? 'lg:col-span-2' : 'lg:col-span-3'} bg-paper border border-line rounded-xl p-6 shadow-xs flex flex-col justify-between`}>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-line pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-ink tracking-tight">Sales Performance</h3>
                    <p className="text-[10px] text-muted">Core operational graphs mapped dynamically to order transaction logs.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasReports && (
                      <button
                        onClick={() => setSalesTab('revenue')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          salesTab === 'revenue' ? 'bg-ink text-paper' : 'text-ink hover:bg-stone'
                        }`}
                      >
                        Revenue
                      </button>
                    )}
                    {hasOrders && (
                      <button
                        onClick={() => setSalesTab('orders')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          salesTab === 'orders' ? 'bg-ink text-paper' : 'text-ink hover:bg-stone'
                        }`}
                      >
                        Orders
                      </button>
                    )}
                    {hasCustomers && (
                      <button
                        onClick={() => setSalesTab('customers')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          salesTab === 'customers' ? 'bg-ink text-paper' : 'text-ink hover:bg-stone'
                        }`}
                      >
                        Customers
                      </button>
                    )}
                    {hasReports && (
                      <button
                        onClick={() => setSalesTab('conversion')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          salesTab === 'conversion' ? 'bg-ink text-paper' : 'text-ink hover:bg-stone'
                        }`}
                      >
                        Conversion
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Summary Statistics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                  <div className="border-r border-line pr-2">
                    <span className="text-[9px] font-bold text-muted tracking-wider block">Total Revenue</span>
                    <span className="text-base font-extrabold text-ink block">{hasReports ? formatCurrency(salesPerformance.revenue) : '₹0'}</span>
                    <span className="text-[9px] text-emerald-600 font-bold">
                      {hasReports ? `${kpis.revenue.change >= 0 ? '↑' : '↓'} ${Math.abs(kpis.revenue.change)}% vs last period` : 'Not Authorized'}
                    </span>
                  </div>
                  <div className="sm:border-r border-line pr-2">
                    <span className="text-[9px] font-bold text-muted tracking-wider block">Total Orders</span>
                    <span className="text-base font-extrabold text-ink block">{hasOrders ? salesPerformance.orders : 0}</span>
                    <span className="text-[9px] text-emerald-600 font-bold">
                      {hasOrders ? `${kpis.orders.change >= 0 ? '↑' : '↓'} ${Math.abs(kpis.orders.change)}%` : 'Not Authorized'}
                    </span>
                  </div>
                  <div className="border-r border-line pr-2">
                    <span className="text-[9px] font-bold text-muted tracking-wider block">Average Order Value</span>
                    <span className="text-base font-extrabold text-ink block">{hasReports ? formatCurrency(salesPerformance.aov) : '₹0'}</span>
                    <span className="text-[9px] text-emerald-600 font-bold">
                      Active basket averages
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted tracking-wider block">New Customers</span>
                    <span className="text-base font-extrabold text-ink block">{hasCustomers ? salesPerformance.newCustomers : 0}</span>
                    <span className="text-[9px] text-emerald-600 font-bold">
                      Registered signups
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Recharts Graph */}
              <div className="h-64 mt-4">
                {salesPerformance.chart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center border border-dashed border-line rounded-lg text-center p-6 bg-stone/20">
                    <ShoppingBag className="w-8 h-8 text-muted mb-2 animate-pulse" />
                    <span className="font-extrabold text-xs text-ink">No Transaction Metrics</span>
                    <p className="text-[10px] text-muted max-w-xs mt-1">Once orders are placed and processed, real-time curves will display here.</p>
                  </div>
                ) : (() => {
                  const chartData = (salesPerformance.chart || []).map((d, idx) => {
                    const convVal = kpis.conversion?.sparkline?.[idx] || 0;
                    return { ...d, conversion: convVal };
                  });

                  let graphData = chartData;
                  let graphKey = 'revenue';
                  let graphName = 'Revenue';
                  let graphStroke = '#10b981';

                  if (salesTab === 'revenue') {
                    graphData = chartData;
                    graphKey = 'revenue';
                    graphName = 'Revenue';
                    graphStroke = '#10b981';
                  } else if (salesTab === 'orders') {
                    graphData = chartData;
                    graphKey = 'orders';
                    graphName = 'Orders';
                    graphStroke = '#3b82f6';
                  } else if (salesTab === 'customers') {
                    graphData = data?.customerGrowth?.chart || [];
                    graphKey = 'count';
                    graphName = 'Customers';
                    graphStroke = '#a855f7';
                  } else if (salesTab === 'conversion') {
                    graphData = chartData;
                    graphKey = 'conversion';
                    graphName = 'Conversion Rate';
                    graphStroke = '#f59e0b';
                  }

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E7" />
                        <XAxis dataKey="label" stroke="#6B6B6B" fontSize={10} tickLine={false} />
                        <YAxis stroke="#6B6B6B" fontSize={10} tickLine={false} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-paper border border-line p-3 rounded-lg shadow-md text-xs font-semibold">
                                  <p className="text-muted mb-1">{label}</p>
                                  {payload.map((p, idx) => (
                                    <p key={idx} className="text-ink">
                                      <span className="font-bold">{graphName}:</span> {graphKey === 'revenue' ? formatCurrency(p.value) : graphKey === 'conversion' ? `${p.value}%` : p.value}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line type="monotone" dataKey={graphKey} name={graphName} stroke={graphStroke} strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Low Inventory alerts sidebar */}
          {hasProducts && (
            <div className={`${hasReports || hasOrders ? 'col-span-1' : 'lg:col-span-3'} bg-paper border border-line rounded-xl p-6 shadow-xs flex flex-col justify-between`}>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-line pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-ink tracking-tight">Inventory Reorder Alerts</h3>
                    <p className="text-[10px] text-muted">Add stocks to items matching low-stock benchmarks.</p>
                  </div>
                  <Link to="/admin/products" className="text-[10px] font-bold text-ink hover:underline tracking-wider">
                    View All
                  </Link>
                </div>

                {/* Alerts List */}
                {inventoryAlerts.length === 0 ? (
                  <div className="text-center py-16 text-muted">
                    <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <span className="font-bold text-[11px]">All Stock Healthy</span>
                    <p className="text-[10px] mt-1">No items currently below reorder levels.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {inventoryAlerts.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded bg-stone border border-line flex items-center justify-center overflow-hidden shrink-0">
                            {item.image ? (
                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-muted" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-ink block truncate">{item.name}</span>
                            <span className="text-[9px] text-muted block truncate">SKU: {item.sku}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-bold text-ink block">{item.stock} / {item.reorderLevel}</span>
                            <span className={`text-[9px] font-extrabold ${
                              item.status === 'Critical' ? 'text-red-600' : 'text-amber-600'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setRestockItem(item);
                              setRestockQty('50');
                            }}
                            className="px-3 py-1.5 bg-ink text-paper text-[10px] font-bold rounded hover:bg-ink/90 transition-colors"
                          >
                            Restock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lower Row Panels: Recent Orders, Top Selling, Customer Growth, Recent Reviews */}
      {(() => {
        const visibleLower = [hasOrders, hasReports, hasCustomers, hasReviews].filter(Boolean).length;
        if (visibleLower === 0) return null;

        return (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${visibleLower} gap-6`}>
            {/* Recent Orders table widget */}
            {hasOrders && (
              <div className="bg-paper border border-line rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-line pb-2.5">
                    <span className="font-extrabold text-xs text-ink tracking-wider">Recent Orders</span>
                    <Link to="/admin/orders" className="text-[9px] font-bold text-ink hover:underline tracking-wider">
                      View All
                    </Link>
                  </div>
                  {recentOrders.length === 0 ? (
                    <p className="text-[10px] text-muted py-6 text-center">No orders placed in this period.</p>
                  ) : (
                    <div className="divide-y divide-line">
                      {recentOrders.map((o) => (
                        <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-ink block">#{o.id}</span>
                            <span className="text-[9px] text-muted block">{o.customer}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-ink block">{formatCurrency(o.amount)}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                              o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              o.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-100' :
                              'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Top Selling Products */}
            {hasReports && (
              <div className="bg-paper border border-line rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-line pb-2.5">
                    <span className="font-extrabold text-xs text-ink tracking-wider">Top Selling Products</span>
                    <Link to="/admin/products" className="text-[9px] font-bold text-ink hover:underline tracking-wider">
                      View All
                    </Link>
                  </div>
                  {topSellingProducts.length === 0 ? (
                    <p className="text-[10px] text-muted py-6 text-center">No transactions recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-line">
                      {topSellingProducts.map((p) => (
                        <div key={p.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-ink block truncate">{p.name}</span>
                            <span className="text-[9px] text-muted block">{formatCurrency(p.revenue)} Revenue</span>
                          </div>
                          <span className="font-bold text-ink shrink-0 bg-stone px-2 py-1 rounded text-[10px]">
                            {p.unitsSold} Sold
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customer Growth card with small chart */}
            {hasCustomers && (
              <div className="bg-paper border border-line rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-line pb-2.5">
                    <span className="font-extrabold text-xs text-ink tracking-wider">Customer Growth</span>
                    <Link to="/admin/customers" className="text-[9px] font-bold text-ink hover:underline tracking-wider">
                      View All
                    </Link>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-ink block tracking-tight">{customerGrowth.total}</span>
                    <span className="text-[9px] text-muted block font-semibold">Total Customer Base</span>
                    <span className={`text-[10px] font-bold mt-1 inline-flex items-center gap-0.5 ${
                      customerGrowth.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {customerGrowth.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {Math.abs(customerGrowth.change)}% vs last month
                    </span>
                  </div>
                </div>

                {/* Mini Bar Chart */}
                <div className="h-20 mt-4">
                  {customerGrowth.chart.length === 0 ? (
                    <div className="w-full h-full bg-stone/20 rounded animate-pulse" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={customerGrowth.chart}>
                        <Bar dataKey="count" fill="#a855f7" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Recent Reviews widget */}
            {hasReviews && (
              <div className="bg-paper border border-line rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-line pb-2.5">
                    <span className="font-extrabold text-xs text-ink tracking-wider">Recent Reviews</span>
                    <Link to="/admin/reviews" className="text-[9px] font-bold text-ink hover:underline tracking-wider">
                      View All
                    </Link>
                  </div>
                  {recentReviews.length === 0 ? (
                    <p className="text-[10px] text-muted py-6 text-center">No reviews submitted recently.</p>
                  ) : (
                    <div className="divide-y divide-line">
                      {recentReviews.map((r) => (
                        <div key={r.id} className="py-2 flex flex-col gap-1 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-ink">{r.customer}</span>
                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-2.5 h-2.5 ${i < r.rating ? 'fill-current' : 'text-stone-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-muted italic truncate font-medium">"{r.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Restocking Action Modal Overlay */}
      {restockItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[999] backdrop-blur-xs">
          <div className="bg-paper border border-line rounded-xl p-6 w-full max-w-sm shadow-2xl relative space-y-4 animate-scaleUp">
            <button
              onClick={() => setRestockItem(null)}
              className="absolute top-4 right-4 text-muted hover:text-ink transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h4 className="text-sm font-black text-ink uppercase tracking-tight">Restock Product Inventory</h4>
              <p className="text-[11px] text-muted">Add stock counts directly to the system registry.</p>
            </div>
            
            <div className="bg-stone p-3 rounded-lg border border-line space-y-1">
              <span className="text-[9px] font-bold uppercase text-muted block">Selected Variant</span>
              <span className="text-xs font-bold text-ink block">{restockItem.name}</span>
              <span className="text-[10px] text-muted block">SKU: {restockItem.sku} | Current Stock: {restockItem.stock}</span>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Restock Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-ink font-semibold"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="flex-1 py-2.5 border border-line text-ink text-xs font-bold uppercase rounded-lg hover:bg-stone transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restockLoading}
                  className="flex-1 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  {restockLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sparkline Card sub-component
function KPISparkCard({ title, value, change, sparklineData, type, icon: Icon, onClick }) {
  const isPositive = change >= 0;
  
  const themes = {
    revenue: { bg: 'bg-emerald-50', text: 'text-emerald-600', stroke: '#10b981' },
    orders: { bg: 'bg-blue-50', text: 'text-blue-600', stroke: '#3b82f6' },
    customers: { bg: 'bg-purple-50', text: 'text-purple-600', stroke: '#a855f7' },
    conversion: { bg: 'bg-amber-50', text: 'text-amber-600', stroke: '#f59e0b' }
  }[type] || { bg: 'bg-stone', text: 'text-ink', stroke: '#111' };

  const chartData = (sparklineData || []).map((val, idx) => ({ idx, val }));

  return (
    <div onClick={onClick} className="bg-paper border border-line rounded-xl p-5 flex items-center justify-between shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
      <div className="space-y-1.5 flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${themes.bg} ${themes.text} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-muted tracking-wider truncate">{title}</span>
        </div>
        <div className="text-2xl font-black text-ink tracking-tight">{value}</div>
        <div className="flex items-center gap-1 text-[10px] font-bold">
          <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
            {isPositive ? '↑' : '↓'} {Math.abs(change)}%
          </span>
          <span className="text-muted">vs last month</span>
        </div>
      </div>
      
      {/* Sparkline chart */}
      <div className="w-16 h-10 shrink-0">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="val" 
                stroke={themes.stroke} 
                strokeWidth={1.5} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-stone/20 rounded animate-pulse" />
        )}
      </div>
    </div>
  );
}
