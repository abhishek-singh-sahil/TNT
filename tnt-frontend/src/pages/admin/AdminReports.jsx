import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FileText, Download, Calendar, ArrowUpRight, ArrowDownRight, 
  TrendingUp, ShoppingBag, Percent, RefreshCw, Layers, 
  ChevronDown, Search, ArrowLeft, ArrowRight, Eye, Tag, 
  FileSpreadsheet, Users, HelpCircle, LayoutGrid, CheckCircle2,
  AlertTriangle, Play, HelpCircle as HelpIcon, BarChart2, X
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
  'Clothing',
  'Accessories',
  'Footwear'
];

export default function AdminReports() {
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();

  // Search parameters synced with URL
  const dateRange = searchParams.get('range') || 'Last 30 Days';
  const department = searchParams.get('department') || 'All Departments';
  const customStart = searchParams.get('start') || '';
  const customEnd = searchParams.get('end') || '';

  // Data states
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  // Active Detail Modal
  const [activeModal, setActiveModal] = useState(null); // 'sales' | 'products' | 'customers' | 'inventory'

  // Fetch report data
  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        // Resolve date range boundaries
        let startDate = '';
        let endDate = '';
        const today = new Date();

        if (dateRange === 'Today') {
          startDate = today.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
        } else if (dateRange === 'Yesterday') {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = yesterday.toISOString().split('T')[0];
          endDate = yesterday.toISOString().split('T')[0];
        } else if (dateRange === 'Last 7 Days') {
          const past = new Date(today);
          past.setDate(past.getDate() - 7);
          startDate = past.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
        } else if (dateRange === 'Last 30 Days') {
          const past = new Date(today);
          past.setDate(past.getDate() - 30);
          startDate = past.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
        } else if (dateRange === 'This Month') {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = firstDay.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
        } else if (dateRange === 'Last Month') {
          const firstDayPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastDayPrev = new Date(today.getFullYear(), today.getMonth(), 0);
          startDate = firstDayPrev.toISOString().split('T')[0];
          endDate = lastDayPrev.toISOString().split('T')[0];
        } else if (dateRange === 'This Year') {
          const firstDay = new Date(today.getFullYear(), 0, 1);
          startDate = firstDay.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
        } else if (dateRange === 'Custom Range') {
          startDate = customStart;
          endDate = customEnd;
        }

        const res = await apiClient.get('/admin/reports', {
          params: {
            startDate,
            endDate,
            department
          }
        });
        if (res.success) {
          setReportData(res);
        } else {
          setReportData(null);
        }
      } catch (err) {
        setReportData(null);
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [dateRange, department, customStart, customEnd]);

  const updateUrlParams = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newParams };
    
    // Clean defaults
    if (merged.range === 'Last 30 Days') delete merged.range;
    if (merged.department === 'All Departments') delete merged.department;
    if (!merged.start) delete merged.start;
    if (!merged.end) delete merged.end;

    setSearchParams(merged);
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const headers = ['Metric Name', 'Value', 'Comparison'];
    const rows = [
      ['Revenue', `₹${reportData.kpi.revenue.value}`, reportData.kpi.revenue.change],
      ['Orders', reportData.kpi.orders.value, reportData.kpi.orders.change],
      ['AOV', `₹${Math.round(reportData.kpi.aov.value)}`, reportData.kpi.aov.change],
      ['Refunds', `₹${reportData.kpi.refunds.value}`, reportData.kpi.refunds.change],
      ['Discounts', `₹${reportData.kpi.discounts.value}`, reportData.kpi.discounts.change]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tnt_analytics_${dateRange.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully');
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    const headers = ['Metric', 'Current Period Value', 'Trend Change vs Prev Period'];
    const rows = [
      ['Total Valid Revenue', `INR ${reportData.kpi.revenue.value.toLocaleString()}`, reportData.kpi.revenue.change],
      ['Valid Orders Placed', reportData.kpi.orders.value, reportData.kpi.orders.change],
      ['Average Order Value (AOV)', `INR ${Math.round(reportData.kpi.aov.value).toLocaleString()}`, reportData.kpi.aov.change],
      ['Total Processed Refunds', `INR ${reportData.kpi.refunds.value.toLocaleString()}`, reportData.kpi.refunds.change],
      ['Discounts & Coupons Applied', `INR ${reportData.kpi.discounts.value.toLocaleString()}`, reportData.kpi.discounts.change]
    ];

    // Excel HTML compatible string format
    let tableHtml = `<table border="1"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
    rows.forEach(r => {
      tableHtml += `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`;
    });
    tableHtml += `</tbody></table>`;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tnt_excel_report_${Date.now()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel Report exported successfully');
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>TNT Reports & Analytics</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; }
            h1 { text-transform: uppercase; font-size: 24px; font-weight: 900; margin-bottom: 5px; }
            .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 30px; }
            .kpi-grid { display: grid; grid-cols: 5; margin-bottom: 40px; border-bottom: 2px solid #111; padding-bottom: 20px; }
            .kpi-card { text-align: left; }
            .kpi-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #666; }
            .kpi-val { font-size: 20px; font-weight: 900; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #f7fafc; font-weight: bold; text-transform: uppercase; font-size: 10px; }
          </style>
        </head>
        <body>
          <h1>THREAD & TONES</h1>
          <div class="subtitle">Official Business Analytics - ${dateRange} (${department})</div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <div class="kpi-title">TOTAL REVENUE</div>
              <div class="kpi-val">₹${reportData.kpi.revenue.value.toLocaleString()}</div>
            </div>
            <div>
              <div class="kpi-title">TOTAL ORDERS</div>
              <div class="kpi-val">${reportData.kpi.orders.value}</div>
            </div>
            <div>
              <div class="kpi-title">AVERAGE ORDER VALUE</div>
              <div class="kpi-val">₹${Math.round(reportData.kpi.aov.value).toLocaleString()}</div>
            </div>
            <div>
              <div class="kpi-title">TOTAL REFUNDS</div>
              <div class="kpi-val">₹${reportData.kpi.refunds.value.toLocaleString()}</div>
            </div>
            <div>
              <div class="kpi-title">TOTAL DISCOUNTS</div>
              <div class="kpi-val">₹${reportData.kpi.discounts.value.toLocaleString()}</div>
            </div>
          </div>

          <h2>Sales Summary Report</h2>
          <table>
            <thead>
              <tr>
                <th>Sales Metric</th>
                <th>Performance Value</th>
                <th>Growth Delta</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Gross Revenue</td>
                <td>₹${reportData.kpi.revenue.value.toLocaleString()}</td>
                <td>${reportData.kpi.revenue.change}</td>
              </tr>
              <tr>
                <td>Total Successful Orders</td>
                <td>${reportData.kpi.orders.value}</td>
                <td>${reportData.kpi.orders.change}</td>
              </tr>
              <tr>
                <td>Average Basket Value (AOV)</td>
                <td>₹${Math.round(reportData.kpi.aov.value).toLocaleString()}</td>
                <td>${reportData.kpi.aov.change}</td>
              </tr>
              <tr>
                <td>Total Processed Refunds</td>
                <td>₹${reportData.kpi.refunds.value.toLocaleString()}</td>
                <td>${reportData.kpi.refunds.change}</td>
              </tr>
              <tr>
                <td>Total Coupon Discounts Applied</td>
                <td>₹${reportData.kpi.discounts.value.toLocaleString()}</td>
                <td>${reportData.kpi.discounts.change}</td>
              </tr>
            </tbody>
          </table>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('PDF print preview launched');
  };

  // Top Products Tab Manager
  const [productTab, setProductTab] = useState('bestSellers'); // 'bestSellers' | 'byRevenue' | 'byQuantity'

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      
      {/* 5. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-muted">Insights and reports to help you make better business decisions</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-paper text-xs font-bold rounded-lg tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-paper text-xs font-bold rounded-lg tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial px-4 py-2.5 border border-line text-ink text-xs font-bold rounded-lg hover:bg-stone flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* 9 & 10. Filters Area */}
      <div className="p-4 bg-paper border border-line rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => updateUrlParams({ range: e.target.value })}
              className="w-full sm:w-56 bg-stone border border-line rounded-lg pl-9 pr-3 py-1.5 text-xs font-bold text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Year">This Year</option>
              <option value="Custom Range">Custom Range</option>
            </select>
            <Calendar className="w-4 h-4 text-muted absolute left-3 top-2" />
          </div>

          <div className="relative">
            <select
              value={department}
              onChange={(e) => updateUrlParams({ department: e.target.value })}
              className="w-full sm:w-56 bg-stone border border-line rounded-lg px-3 py-1.5 text-xs font-bold text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              <option value="All Departments">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {dateRange === 'Custom Range' && (
          <div className="flex items-center gap-2 animate-fadeIn">
            <input
              type="date"
              value={customStart}
              onChange={(e) => updateUrlParams({ start: e.target.value })}
              className="bg-stone border border-line rounded px-2.5 py-1 text-xs text-ink font-semibold"
            />
            <span className="text-xs text-muted font-bold">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => updateUrlParams({ end: e.target.value })}
              className="bg-stone border border-line rounded px-2.5 py-1 text-xs text-ink font-semibold"
            />
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-paper border border-line rounded-xl p-5 space-y-3 shadow-xs">
                <div className="h-2 w-16 bg-stone rounded" />
                <div className="h-6 w-24 bg-stone/70 rounded" />
                <div className="h-2.5 w-12 bg-stone/50 rounded" />
              </div>
            ))}
          </div>
          <div className="p-12 text-center bg-paper border border-line rounded-xl text-xs text-muted flex justify-center items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> Gathering summary sheets...
          </div>
        </div>
      ) : !reportData ? (
        <div className="p-12 text-center bg-paper border border-line rounded-xl space-y-3 shadow-xs">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto animate-bounce" />
          <h3 className="font-extrabold text-sm text-ink">Failed to load Reports</h3>
          <p className="text-xs text-muted max-w-md mx-auto">There was an issue compiling the e-commerce transactions or connecting to the database server.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-5 py-2.5 bg-ink hover:bg-ink/90 text-paper text-xs font-bold rounded-lg tracking-wider"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* 7. KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Revenue Card */}
            <div className="bg-paper border border-line rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted tracking-widest block">Revenue</span>
                <span className="text-xl font-black text-ink block">₹{reportData.kpi.revenue.value.toLocaleString()}</span>
                <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${reportData.kpi.revenue.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {reportData.kpi.revenue.change.startsWith('+') ? '▲' : '▼'} {reportData.kpi.revenue.change} <span className="text-muted font-bold">vs last month</span>
                </span>
              </div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center border border-indigo-100">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            {/* 2. Orders Card */}
            <div className="bg-paper border border-line rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted tracking-widest block">Orders</span>
                <span className="text-xl font-black text-ink block">{reportData.kpi.orders.value}</span>
                <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${reportData.kpi.orders.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {reportData.kpi.orders.change.startsWith('+') ? '▲' : '▼'} {reportData.kpi.orders.change} <span className="text-muted font-bold">vs last month</span>
                </span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>

            {/* 3. AOV Card */}
            <div className="bg-paper border border-line rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted tracking-widest block">AOV</span>
                <span className="text-xl font-black text-ink block">₹{Math.round(reportData.kpi.aov.value).toLocaleString()}</span>
                <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${reportData.kpi.aov.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {reportData.kpi.aov.change.startsWith('+') ? '▲' : '▼'} {reportData.kpi.aov.change} <span className="text-muted font-bold">vs last month</span>
                </span>
              </div>
              <div className="w-10 h-10 bg-sky-50 text-sky-700 rounded-xl flex items-center justify-center border border-sky-100">
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>

            {/* 4. Refunds Card */}
            <div className="bg-paper border border-line rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted tracking-widest block">Refunds</span>
                <span className="text-xl font-black text-rose-600 block">₹{reportData.kpi.refunds.value.toLocaleString()}</span>
                <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${reportData.kpi.refunds.change.startsWith('+') ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {reportData.kpi.refunds.change.startsWith('+') ? '▲' : '▼'} {reportData.kpi.refunds.change} <span className="text-muted font-bold">vs last month</span>
                </span>
              </div>
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>

            {/* 5. Discounts Card */}
            <div className="bg-paper border border-line rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted tracking-widest block">Discounts</span>
                <span className="text-xl font-black text-ink block">₹{reportData.kpi.discounts.value.toLocaleString()}</span>
                <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${reportData.kpi.discounts.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {reportData.kpi.discounts.change.startsWith('+') ? '▲' : '▼'} {reportData.kpi.discounts.change} <span className="text-muted font-bold">vs last month</span>
                </span>
              </div>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
                <Tag className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Grid of Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 11. Sales Report Card */}
            <div className="bg-paper border border-line rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex justify-between items-center border-b border-line pb-3">
                <span className="font-extrabold text-xs text-ink tracking-wider">Sales Report</span>
                <button 
                  onClick={() => setActiveModal('sales')}
                  className="text-[9px] font-bold text-indigo-600 hover:underline"
                >
                  View Details
                </button>
              </div>
              <div className="divide-y divide-line text-xs font-semibold">
                {reportData.salesReport.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex justify-between items-center">
                    <span className="text-muted">{item.name}</span>
                    <div className="text-right space-y-0.5">
                      <span className="block font-extrabold text-ink">
                        {item.name === 'Orders' ? item.value : `₹${Math.round(item.value).toLocaleString()}`}
                      </span>
                      <span className={`block text-[9px] font-black ${item.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 12. Product Report Card */}
            <div className="bg-paper border border-line rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex justify-between items-center border-b border-line pb-3">
                <span className="font-extrabold text-xs text-ink tracking-wider">Product Report</span>
                <button 
                  onClick={() => setActiveModal('products')}
                  className="text-[9px] font-bold text-indigo-600 hover:underline"
                >
                  View Details
                </button>
              </div>
              <div className="divide-y divide-line text-xs font-semibold">
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-muted">Best Sellers</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">{reportData.productReport.bestSellers} products</span>
                    <span className="block text-[9px] text-emerald-600 font-bold">▲ 14%</span>
                  </div>
                </div>
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-muted">Worst Sellers</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">{reportData.productReport.worstSellers} products</span>
                    <span className="block text-[9px] text-rose-600 font-bold">▼ 6%</span>
                  </div>
                </div>
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-muted">Products by Revenue</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">{reportData.productReport.topProductsCount} products</span>
                    <span className="block text-[9px] text-emerald-600 font-bold">▲ 12%</span>
                  </div>
                </div>
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-muted">Products by Quantity</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">{reportData.productReport.topProductsCount} products</span>
                    <span className="block text-[9px] text-emerald-600 font-bold">▲ 8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 15. Customer Report Card */}
            <div className="bg-paper border border-line rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex justify-between items-center border-b border-line pb-3">
                <span className="font-extrabold text-xs text-ink tracking-wider">Customer Report</span>
                <button 
                  onClick={() => setActiveModal('customers')}
                  className="text-[9px] font-bold text-indigo-600 hover:underline"
                >
                  View Details
                </button>
              </div>
              <div className="divide-y divide-line text-xs font-semibold">
                <div className="py-4 flex justify-between items-center">
                  <span className="text-muted">New Customers</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">{reportData.customerReport.newCustomers}</span>
                    <span className="block text-[9px] text-emerald-600 font-bold">{reportData.customerReport.newCustomersChange}</span>
                  </div>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <span className="text-muted">Returning Customers</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">{reportData.customerReport.returningCustomers}</span>
                    <span className="block text-[9px] text-emerald-600 font-bold">▲ 10%</span>
                  </div>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <span className="text-muted">Customer Lifetime Value</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">₹{reportData.customerReport.clv.toLocaleString()}</span>
                    <span className="block text-[9px] text-emerald-600 font-bold">▲ 12%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Second Row: Inventory Report, Sales Trend Chart, and Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 17. Inventory Report Card */}
            <div className="bg-paper border border-line rounded-xl p-5 space-y-4 shadow-xs self-start">
              <div className="flex justify-between items-center border-b border-line pb-3">
                <span className="font-extrabold text-xs text-ink tracking-wider">Inventory Report</span>
                <button 
                  onClick={() => setActiveModal('inventory')}
                  className="text-[9px] font-bold text-indigo-600 hover:underline"
                >
                  View Details
                </button>
              </div>
              <div className="divide-y divide-line text-xs font-semibold">
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-muted">Stock Value</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">₹{reportData.inventoryReport.stockValue.toLocaleString()}</span>
                    <span className="block text-[9px] text-emerald-600 font-bold">▲ 9%</span>
                  </div>
                </div>
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-muted">Low Stock</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">{reportData.inventoryReport.lowStock} products</span>
                    <span className="block text-[9px] text-rose-600 font-bold">▼ 4%</span>
                  </div>
                </div>
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-muted">Out of Stock</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">{reportData.inventoryReport.outOfStock} products</span>
                    <span className="block text-[9px] text-rose-600 font-bold">▲ 20%</span>
                  </div>
                </div>
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-muted">Dead Stock</span>
                  <div className="text-right">
                    <span className="block font-extrabold text-ink">{reportData.inventoryReport.deadStock} products</span>
                    <span className="block text-[9px] text-rose-600 font-bold">▼ 10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 19. Sales Trend LineChart Container */}
            <div className="bg-paper border border-line rounded-xl p-5 space-y-4 shadow-xs lg:col-span-2">
              <div className="flex justify-between items-center border-b border-line pb-3">
                <div>
                  <span className="font-extrabold text-xs text-ink tracking-wider block">Sales Trend</span>
                  <span className="text-[10px] text-muted">Daily Revenue & Orders log</span>
                </div>
              </div>
              <div className="h-72 w-full text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
                    <YAxis yAxisId="left" stroke="#4f46e5" fontSize={10} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} />
                    <Tooltip formatter={(value, name) => [name === 'revenue' ? `₹${value}` : value, name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : name]} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} name="revenue" dot={{ r: 2 }} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="orders" dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* 21. Top Products Panel Card */}
          <div className="bg-paper border border-line rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs text-ink tracking-wider">Top Products</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setProductTab('bestSellers')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                    productTab === 'bestSellers' ? 'bg-ink text-paper border-ink' : 'bg-stone/50 border-line text-ink hover:bg-stone'
                  }`}
                >
                  Best Sellers
                </button>
                <button 
                  onClick={() => setProductTab('byRevenue')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                    productTab === 'byRevenue' ? 'bg-ink text-paper border-ink' : 'bg-stone/50 border-line text-ink hover:bg-stone'
                  }`}
                >
                  By Revenue
                </button>
                <button 
                  onClick={() => setProductTab('byQuantity')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                    productTab === 'byQuantity' ? 'bg-ink text-paper border-ink' : 'bg-stone/50 border-line text-ink hover:bg-stone'
                  }`}
                >
                  By Quantity
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {reportData.topProducts[productTab]?.map((prod) => (
                <div key={prod.id} className="bg-stone/20 border border-line rounded-xl overflow-hidden shadow-xs p-3 flex flex-col justify-between items-center text-center space-y-2">
                  <div className="w-20 h-24 bg-stone rounded-lg overflow-hidden border border-line flex items-center justify-center">
                    {prod.image ? (
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-muted uppercase">Fallback</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="block font-extrabold text-[11px] text-ink uppercase line-clamp-1">{prod.name}</span>
                    <span className="block text-[10px] text-muted font-bold">Qty: {prod.unitsSold} units</span>
                    <span className="block text-xs font-black text-ink">₹{Math.round(prod.revenue).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {reportData.topProducts[productTab]?.length === 0 && (
                <div className="col-span-5 text-center text-xs text-muted py-8">
                  No products sold in this category/period.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 23. Detailed Reports Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs text-ink tracking-wider">
                📊 Detailed {activeModal.charAt(0).toUpperCase() + activeModal.slice(1)} Sheet Analytics
              </span>
              <button onClick={() => setActiveModal(null)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Contents Depending on active modal */}
            {activeModal === 'sales' && (
              <div className="space-y-4 text-xs">
                <p className="text-[10px] text-muted">All active/completed transactions recorded in selected range:</p>
                <table className="w-full border-collapse border border-line text-left">
                  <thead className="bg-stone text-[9px] font-bold text-ink">
                    <tr>
                      <th className="border border-line p-3">Metric</th>
                      <th className="border border-line p-3">Report Details</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-muted">
                    <tr className="border-b border-line">
                      <td className="border border-line p-3 text-ink font-bold">Revenue</td>
                      <td className="border border-line p-3">₹{reportData?.kpi.revenue.value.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="border border-line p-3 text-ink font-bold">Orders Placed</td>
                      <td className="border border-line p-3">{reportData?.kpi.orders.value}</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="border border-line p-3 text-ink font-bold">AOV</td>
                      <td className="border border-line p-3">₹{Math.round(reportData?.kpi.aov.value).toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="border border-line p-3 text-ink font-bold">Refunds Processed</td>
                      <td className="border border-line p-3">₹{reportData?.kpi.refunds.value.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="border border-line p-3 text-ink font-bold">Discounts Redeemed</td>
                      <td className="border border-line p-3">₹{reportData?.kpi.discounts.value.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeModal === 'products' && (
              <div className="space-y-4 text-xs">
                <p className="text-[10px] text-muted font-bold">Best & worst performing items ranked by units sold:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-indigo-700 text-[10px] mb-2">Best Sellers list</h4>
                    <ul className="space-y-1.5 list-disc list-inside text-muted font-semibold">
                      {reportData?.topProducts.bestSellers.map(p => (
                        <li key={p.id}>{p.name} - {p.unitsSold} sold (₹{Math.round(p.revenue).toLocaleString()})</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-600 text-[10px] mb-2">Low Activity Stock products</h4>
                    <div className="text-[10px] text-muted">
                      Total items with zero conversions in current period: <span className="font-bold text-ink">{reportData?.inventoryReport.deadStock} items</span>.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'customers' && (
              <div className="space-y-4 text-xs font-semibold text-muted">
                <p className="text-[10px] text-muted font-bold">Customer Loyalty & Lifetime value metadata:</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-stone/40 border border-line rounded-lg text-center space-y-1">
                    <span className="block text-[9px] font-bold text-muted">New Signups</span>
                    <span className="block text-xl font-black text-ink">{reportData?.customerReport.newCustomers}</span>
                  </div>
                  <div className="p-4 bg-stone/40 border border-line rounded-lg text-center space-y-1">
                    <span className="block text-[9px] font-bold text-muted">Returning Users</span>
                    <span className="block text-xl font-black text-ink">{reportData?.customerReport.returningCustomers}</span>
                  </div>
                  <div className="p-4 bg-stone/40 border border-line rounded-lg text-center space-y-1">
                    <span className="block text-[9px] font-bold text-muted">Estimated CLV</span>
                    <span className="block text-xl font-black text-ink">₹{reportData?.customerReport.clv.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'inventory' && (
              <div className="space-y-4 text-xs">
                <p className="text-[10px] text-muted font-bold">Stock levels and reorder parameters:</p>
                <table className="w-full border-collapse border border-line text-left">
                  <thead className="bg-stone text-[9px] font-bold text-ink">
                    <tr>
                      <th className="border border-line p-3">Stock Attribute</th>
                      <th className="border border-line p-3">Current Count</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-muted">
                    <tr className="border-b border-line">
                      <td className="border border-line p-3 text-ink font-bold">Stock Value</td>
                      <td className="border border-line p-3">₹{reportData?.inventoryReport.stockValue.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="border border-line p-3 text-ink font-bold">Low Stock Warning (&le;10 units)</td>
                      <td className="border border-line p-3 text-rose-600">{reportData?.inventoryReport.lowStock} products</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="border border-line p-3 text-ink font-bold">Out of Stock</td>
                      <td className="border border-line p-3 text-rose-600">{reportData?.inventoryReport.outOfStock} products</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="border border-line p-3 text-ink font-bold">Dead Stock (0 Sales)</td>
                      <td className="border border-line p-3 text-rose-600">{reportData?.inventoryReport.deadStock} products</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-3 border-t border-line text-right">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-ink text-paper text-xs font-bold rounded-lg hover:bg-ink/90"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
