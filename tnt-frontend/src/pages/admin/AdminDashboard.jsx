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
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalSales: '₹0',
    todaySales: '₹0',
    weeklySales: '₹0',
    monthlySales: '₹0',
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    activeProducts: 0,
    conversionRate: '0.0%',
  });
  const [graphData, setGraphData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await adminApi.getMetrics();
        if (res.success && res.metrics) {
          setMetrics(res.metrics);
          setGraphData(res.salesGraphData || []);
          setLowStock(res.lowStockItems || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink">OVERVIEW DASHBOARD</h1>
        <p className="text-xs text-muted">Real-time enterprise metrics calculated directly from database records.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-paper border border-line rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase mb-2">
            <span>TOTAL REVENUE</span>
            <DollarSign className="w-4 h-4 text-ink" />
          </div>
          <div className="text-2xl font-extrabold text-ink">{metrics.totalSales}</div>
          <p className="text-[10px] text-muted mt-2">Calculated from successful payments</p>
        </div>

        <div className="bg-paper border border-line rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase mb-2">
            <span>TOTAL ORDERS</span>
            <ShoppingBag className="w-4 h-4 text-ink" />
          </div>
          <div className="text-2xl font-extrabold text-ink">{metrics.totalOrders}</div>
          <p className="text-[10px] text-muted mt-2">{metrics.pendingOrders} pending, {metrics.deliveredOrders} delivered</p>
        </div>

        <div className="bg-paper border border-line rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase mb-2">
            <span>REGISTERED CUSTOMERS</span>
            <Users className="w-4 h-4 text-ink" />
          </div>
          <div className="text-2xl font-extrabold text-ink">{metrics.totalCustomers}</div>
          <p className="text-[10px] text-muted mt-2">Excluding administrative accounts</p>
        </div>

        <div className="bg-paper border border-line rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase mb-2">
            <span>CONVERSION RATE</span>
            <TrendingUp className="w-4 h-4 text-ink" />
          </div>
          <div className="text-2xl font-extrabold text-ink">{metrics.conversionRate}</div>
          <p className="text-[10px] text-muted mt-2">Total orders vs session visitors</p>
        </div>
      </div>

      {/* Analytics & Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Graph */}
        <div className="lg:col-span-2 bg-paper border border-line rounded-xl p-6 shadow-xs">
          <h3 className="font-extrabold text-xs uppercase text-ink tracking-wider mb-6">SALES PERFORMANCE</h3>
          {graphData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center border border-dashed border-line rounded-lg text-center p-6 bg-stone/20">
              <ShoppingBag className="w-8 h-8 text-muted mb-2 animate-pulse" />
              <span className="font-extrabold text-xs uppercase text-ink">NO SALES DATA YET</span>
              <p className="text-[10px] text-muted max-w-xs mt-1">Once orders are placed and processed, real-time revenue curves will display here.</p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E7" />
                  <XAxis dataKey="month" stroke="#6B6B6B" fontSize={11} />
                  <YAxis stroke="#6B6B6B" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#000000" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-paper border border-line rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-xs uppercase text-ink tracking-wider mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" /> INVENTORY REORDER ALERTS
            </h3>
            {lowStock.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <AlertTriangle className="w-8 h-8 mx-auto text-line mb-2" />
                <span className="font-bold text-[11px] uppercase">All Stock Healthy</span>
                <p className="text-[10px] mt-1">No items currently below reorder levels.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {lowStock.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-ink">{item.name}</span>
                    </div>
                    <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                      {item.stock} Left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
