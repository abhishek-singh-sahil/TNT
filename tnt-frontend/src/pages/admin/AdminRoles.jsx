import { useState } from 'react';
import { ShieldCheck, Check, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminRoles() {
  const roles = [
    'Super Admin',
    'Store Manager',
    'Order Manager',
    'Inventory Manager',
    'Marketing Manager',
    'Customer Support',
    'Content Manager',
    'Staff',
  ];

  const permissions = [
    { key: 'view_products', label: 'Can View Products' },
    { key: 'edit_products', label: 'Can Edit / Create Products' },
    { key: 'delete_products', label: 'Can Delete Products' },
    { key: 'manage_orders', label: 'Can Manage Orders & Shipping' },
    { key: 'access_analytics', label: 'Can Access Financial Analytics' },
    { key: 'edit_homepage', label: 'Can Edit Homepage CMS' },
    { key: 'manage_users', label: 'Can Manage Users & Staff' },
    { key: 'manage_coupons', label: 'Can Create & Manage Coupons' },
  ];

  const [permissionMatrix, setPermissionMatrix] = useState({
    'Super Admin': permissions.map((p) => p.key),
    'Store Manager': ['view_products', 'edit_products', 'manage_orders', 'edit_homepage', 'manage_coupons'],
    'Order Manager': ['view_products', 'manage_orders'],
    'Inventory Manager': ['view_products', 'edit_products'],
    'Customer Support': ['view_products', 'manage_orders'],
  });

  const togglePermission = (role, pKey) => {
    const current = permissionMatrix[role] || [];
    const updated = current.includes(pKey)
      ? current.filter((k) => k !== pKey)
      : [...current, pKey];
    setPermissionMatrix({ ...permissionMatrix, [role]: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink">ROLE-BASED ACCESS CONTROL (RBAC)</h1>
          <p className="text-xs text-muted">Configure granular permissions for administrative staff and management roles.</p>
        </div>
        <button
          onClick={() => toast.success('RBAC Permission matrix updated!')}
          className="px-5 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ink/90 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> SAVE PERMISSIONS
        </button>
      </div>

      <div className="bg-paper border border-line rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
            <tr>
              <th className="p-4">Permission Name</th>
              {roles.map((r) => (
                <th key={r} className="p-4 text-center">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {permissions.map((p) => (
              <tr key={p.key} className="hover:bg-stone/40">
                <td className="p-4 font-bold text-ink">{p.label}</td>
                {roles.map((r) => {
                  const isChecked = (permissionMatrix[r] || []).includes(p.key);
                  return (
                    <td key={r} className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(r, p.key)}
                        className="rounded border-line text-ink"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
