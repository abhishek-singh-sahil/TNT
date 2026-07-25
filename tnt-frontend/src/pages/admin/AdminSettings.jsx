import { useState } from 'react';
import { Settings, Key, Shield, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_live_TNT_LUXURY_2024_KEY');
  const [razorpaySecret, setRazorpaySecret] = useState('************************');
  const [codEnabled, setCodEnabled] = useState(true);
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const logs = [
    { id: '1', user: 'Admin User', action: 'UPDATED_CMS', target: 'Top Announcement Bar', timestamp: '21 Jul 2026, 20:30:15', ip: '127.0.0.1' },
    { id: '2', user: 'Admin User', action: 'UPDATED_ORDER_STATUS', target: 'Order #TNT12567 -> DELIVERED', timestamp: '21 Jul 2026, 19:45:00', ip: '127.0.0.1' },
    { id: '3', user: 'Store Manager', action: 'CREATED_COUPON', target: 'WELCOME10', timestamp: '21 Jul 2026, 18:20:10', ip: '127.0.0.1' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink">SYSTEM SETTINGS & AUDIT LOGS</h1>
          <p className="text-xs text-muted">Configure payment gateways, shipping rules, Cloudinary credentials, & view security audit logs.</p>
        </div>
        <button
          onClick={() => toast.success('System settings saved successfully!')}
          className="px-5 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ink/90 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> SAVE SETTINGS
        </button>
      </div>

      {/* Payment Gateway Configuration */}
      <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4" /> PAYMENT GATEWAYS & KEYS
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">Razorpay Key ID</label>
            <input
              type="text"
              value={razorpayKeyId}
              onChange={(e) => setRazorpayKeyId(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink bg-stone"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">Razorpay Key Secret</label>
            <input
              type="password"
              value={razorpaySecret}
              onChange={(e) => setRazorpaySecret(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink bg-stone"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2 border-t border-line">
          <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={codEnabled}
              onChange={() => setCodEnabled(!codEnabled)}
              className="rounded border-line text-ink"
            />
            <span>Enable Cash on Delivery (COD)</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={upiEnabled}
              onChange={() => setUpiEnabled(!upiEnabled)}
              className="rounded border-line text-ink"
            />
            <span>Enable UPI Direct QR Payment</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-red-600 cursor-pointer">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={() => setMaintenanceMode(!maintenanceMode)}
              className="rounded border-line text-red-600"
            />
            <span>Enable Maintenance Mode</span>
          </label>
        </div>
      </div>

      {/* Security Audit Logs */}
      <div className="bg-paper border border-line rounded-xl p-6 shadow-xs">
        <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-700" /> SYSTEM AUDIT LOGS
        </h3>

        <div className="border border-line rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target Resource</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-stone/30">
                  <td className="p-3 font-bold text-ink">{log.user}</td>
                  <td className="p-3 font-mono font-bold text-purple-700">{log.action}</td>
                  <td className="p-3">{log.target}</td>
                  <td className="p-3 text-muted">{log.timestamp}</td>
                  <td className="p-3 font-mono text-muted">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
