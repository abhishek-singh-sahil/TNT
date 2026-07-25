import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, Package, Users, Star, Tag, Image, Settings, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders');

  const stats = [
    { label: 'Total Revenue', value: '₹4,89,500', change: '+18.4%' },
    { label: 'Total Orders', value: '142', change: '+12.1%' },
    { label: 'Active Products', value: '28', change: '+4' },
    { label: 'Registered Customers', value: '1,280', change: '+85' },
  ];

  const adminOrders = [
    { id: 'TNT12567', customer: 'Akhtar Raza', amount: 3698, status: 'DELIVERED', date: '20 May 2024' },
    { id: 'TNT12501', customer: 'Akhtar Raza', amount: 2199, status: 'SHIPPED', date: '15 May 2024' },
    { id: 'TNT12445', customer: 'Priya Sharma', amount: 1649, status: 'OUT_FOR_DELIVERY', date: '10 May 2024' },
    { id: 'TNT12402', customer: 'Rohan Verma', amount: 899, status: 'DELIVERED', date: '05 May 2024' },
  ];

  const adminProducts = [
    { name: 'Oversized Minimal Tee', sku: 'TNT-TEE-001', stock: 75, price: 1499, status: 'In Stock' },
    { name: 'Essential Beige Hoodie', sku: 'TNT-HD-002', stock: 45, price: 2199, status: 'In Stock' },
    { name: 'Signature Back Print Tee', sku: 'TNT-TEE-003', stock: 50, price: 1649, status: 'In Stock' },
    { name: 'TNT Classic Cap', sku: 'TNT-CAP-004', stock: 100, price: 899, status: 'In Stock' },
  ];

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-line pb-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink uppercase tracking-tight">
              ADMIN CONTROL PANEL
            </h1>
            <p className="text-xs text-muted">Manage product catalog, orders, lookbooks, customer reviews, & site announcements</p>
          </div>
          <button
            onClick={() => toast.success('New product wizard opened!')}
            className="px-4 py-2 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> ADD PRODUCT
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, idx) => (
            <div key={idx} className="bg-stone border border-line rounded-lg p-5">
              <span className="text-[10px] font-bold text-muted uppercase">{s.label}</span>
              <div className="text-2xl font-extrabold text-ink my-1">{s.value}</div>
              <span className="text-xs font-semibold text-emerald-600">{s.change} vs last month</span>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line gap-6 mb-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-xs font-bold uppercase ${activeTab === 'orders' ? 'border-b-2 border-ink text-ink' : 'text-muted'}`}
          >
            Orders Management
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 text-xs font-bold uppercase ${activeTab === 'products' ? 'border-b-2 border-ink text-ink' : 'text-muted'}`}
          >
            Product Catalog
          </button>
          <button
            onClick={() => setActiveTab('lookbooks')}
            className={`pb-3 text-xs font-bold uppercase ${activeTab === 'lookbooks' ? 'border-b-2 border-ink text-ink' : 'text-muted'}`}
          >
            Lookbooks & Banners
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'orders' && (
          <div className="bg-paper border border-line rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {adminOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone/40">
                    <td className="p-3 font-bold text-ink">{o.id}</td>
                    <td className="p-3">{o.customer}</td>
                    <td className="p-3 font-bold">₹{o.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted">{o.date}</td>
                    <td className="p-3 text-right">
                      <button className="px-3 py-1 bg-stone border border-line rounded text-[11px] font-bold text-ink hover:bg-paper">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-paper border border-line rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {adminProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-stone/40">
                    <td className="p-3 font-bold text-ink">{p.name}</td>
                    <td className="p-3 text-muted">{p.sku}</td>
                    <td className="p-3 font-bold">₹{p.price.toLocaleString()}</td>
                    <td className="p-3">{p.stock} units</td>
                    <td className="p-3"><span className="text-emerald-700 font-semibold">{p.status}</span></td>
                    <td className="p-3 text-right space-x-2">
                      <button className="p-1 text-muted hover:text-ink"><Edit className="w-4 h-4" /></button>
                      <button className="p-1 text-muted hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
