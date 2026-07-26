import { useState, useEffect } from 'react';
import { ShieldCheck, Check, Save, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api/services';
import toast from 'react-hot-toast';

export default function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Matrix: { [roleId]: [ 'view_products', 'edit_products', ... ] }
  const [matrix, setMatrix] = useState({});

  useEffect(() => {
    fetchRBACData();
  }, []);

  const fetchRBACData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        adminApi.getRoles(),
        adminApi.getPermissions()
      ]);

      if (rolesRes.success && permsRes.success) {
        // Filter out standard CUSTOMER role since it does not have administrative dashboard access
        const filteredRoles = rolesRes.roles.filter(r => r.name !== 'CUSTOMER');
        setRoles(filteredRoles);
        setPermissions(permsRes.permissions);

        // Build initial matrix from db data
        const initialMatrix = {};
        filteredRoles.forEach(role => {
          initialMatrix[role.id] = role.permissions.map(p => p.name);
        });
        setMatrix(initialMatrix);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load RBAC configurations');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (roleId, permissionName) => {
    // Super Admin has all permissions locked (cannot disable for security)
    const targetRole = roles.find(r => r.id === roleId);
    if (targetRole && targetRole.name === 'SUPER_ADMIN') {
      toast.error('SUPER_ADMIN permissions are absolute and cannot be disabled.');
      return;
    }

    const currentPerms = matrix[roleId] || [];
    const updated = currentPerms.includes(permissionName)
      ? currentPerms.filter(p => p !== permissionName)
      : [...currentPerms, permissionName];

    setMatrix({ ...matrix, [roleId]: updated });
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      
      // Save permissions for each role sequentially
      const savePromises = roles.map(role => {
        // SUPER_ADMIN permissions are bypass, but we save them anyway or skip
        const permissionKeys = matrix[role.id] || [];
        return adminApi.updateRolePermissions(role.id, { permissionKeys });
      });

      await Promise.all(savePromises);
      toast.success('Granular Role permissions saved successfully!');
      fetchRBACData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-muted flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading RBAC permission matrix...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-line pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-ink">ROLE-BASED ACCESS CONTROL (RBAC)</h1>
          <p className="text-xs text-muted">Configure granular permissions for administrative staff and management roles.</p>
        </div>
        <button
          onClick={handleSavePermissions}
          disabled={saving}
          className="px-5 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ink/90 flex items-center gap-2"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> SAVING...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> SAVE PERMISSIONS
            </>
          )}
        </button>
      </div>

      <div className="bg-paper border border-line rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
            <tr>
              <th className="p-4 w-[280px]">Permission Module</th>
              {roles.map((r) => (
                <th key={r.id} className="p-4 text-center">
                  <div className="text-ink">{r.name}</div>
                  <div className="text-[9px] text-muted font-normal capitalize">{r.description || 'Staff Role'}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {permissions.map((p) => (
              <tr key={p.id} className="hover:bg-stone/20">
                <td className="p-4">
                  <div className="font-extrabold text-ink uppercase tracking-tight text-[11px]">{p.name.replace(/_/g, ' ')}</div>
                  <div className="text-[10px] text-muted">{p.description || 'Administrative permission toggle'}</div>
                </td>
                {roles.map((r) => {
                  const isChecked = (matrix[r.id] || []).includes(p.name);
                  const isSuper = r.name === 'SUPER_ADMIN';
                  return (
                    <td key={r.id} className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSuper || isChecked}
                        disabled={isSuper}
                        onChange={() => togglePermission(r.id, p.name)}
                        className={`rounded border-line text-ink cursor-pointer ${
                          isSuper ? 'bg-stone/50 border-stone cursor-not-allowed opacity-60' : 'focus:ring-0'
                        }`}
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
