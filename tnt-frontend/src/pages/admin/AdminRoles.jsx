import { useState, useEffect } from 'react';
import {
  ShieldCheck, Check, Save, RefreshCw, Plus, Trash2, Edit, UserPlus,
  Lock, Search, Shield, ChevronDown, ChevronRight, X, User, Users,
  FolderOpen, Settings, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { adminApi } from '../../api/services';
import toast from 'react-hot-toast';

const fmtDate = (d) => {
  if (!d) return 'Never';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export default function AdminRoles() {
  // ─── Core State ────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Navigation Tabs: matrix | roles | staff | groups
  const [activeTab, setActiveTab] = useState('matrix');

  // Subviews: list | create | edit | view_permissions
  const [roleMode, setRoleMode] = useState('list'); 
  const [selectedRole, setSelectedRole] = useState(null);

  // Search/Filters
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');

  // Matrix edit state
  const [matrix, setMatrix] = useState({});

  // Dynamic role create/edit forms
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    groupIds: [],
    permissionIds: []
  });

  // Assign staff modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedStaffUser, setSelectedStaffUser] = useState(null);
  const [targetRoleId, setTargetRoleId] = useState('');
  const [isStaffEditMode, setIsStaffEditMode] = useState(false);

  // Permission Group modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    permissionIds: []
  });

  // UI Expansion
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedPreviewGroup, setSelectedPreviewGroup] = useState(null);

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes, groupsRes, staffRes] = await Promise.all([
        adminApi.getRoles(),
        adminApi.getPermissions(),
        adminApi.getPermissionGroups(),
        adminApi.getStaff()
      ]);

      if (rolesRes.success && permsRes.success && groupsRes.success && staffRes.success) {
        // Filter out CUSTOMER role for the admin matrix & roles panel
        const filteredRoles = rolesRes.roles.filter(r => r.name !== 'CUSTOMER');
        setRoles(filteredRoles);
        
        // Exclude system customer from staff list
        const filteredStaff = staffRes.staff.filter(s => s.role?.name !== 'CUSTOMER');
        setStaff(filteredStaff);
        
        setPermissions(permsRes.permissions);
        setGroups(groupsRes.groups);

        // Build Matrix State
        const initialMatrix = {};
        filteredRoles.forEach(role => {
          initialMatrix[role.id] = role.permissions.map(p => p.name);
        });
        setMatrix(initialMatrix);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load RBAC data configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Permission Matrix ────────────────────────────────────────────────────
  const togglePermission = (roleId, permissionName) => {
    const targetRole = roles.find(r => r.id === roleId);
    if (targetRole && targetRole.name === 'SUPER_ADMIN') {
      toast.error('SUPER_ADMIN permissions are absolute and cannot be modified.');
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
      const savePromises = roles
        .filter(r => r.name !== 'SUPER_ADMIN')
        .map(role => {
          const permissionKeys = matrix[role.id] || [];
          return adminApi.updateRolePermissions(role.id, { permissionKeys });
        });

      await Promise.all(savePromises);
      toast.success('Granular Role permissions saved successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save matrix permissions');
    } finally {
      setSaving(false);
    }
  };

  // ─── Sync / Import Permissions ────────────────────────────────────────────
  const handleImportPermissions = async () => {
    try {
      setSaving(true);
      const res = await adminApi.importPermissions();
      if (res.success) {
        toast.success(res.message || 'Permissions synchronized successfully!');
        fetchData();
      }
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setSaving(false);
    }
  };

  // ─── Roles CRUD Handlers ──────────────────────────────────────────────────
  const handleOpenCreateRole = () => {
    setRoleForm({
      name: '',
      description: '',
      status: 'ACTIVE',
      groupIds: [],
      permissionIds: []
    });
    setSelectedPreviewGroup(null);
    setRoleMode('create');
  };

  const handleOpenEditRole = (role) => {
    if (role.name === 'SUPER_ADMIN') {
      toast.error('SUPER_ADMIN role settings are protected and cannot be changed.');
      return;
    }
    setSelectedRole(role);
    
    // Calculate current group IDs (if all group permissions are linked to the role)
    const activeGroupIds = [];
    groups.forEach(g => {
      const gPermIds = g.permissions.map(p => p.id);
      const rolePermIds = role.permissions.map(p => p.id);
      const hasAll = gPermIds.every(id => rolePermIds.includes(id));
      if (hasAll && gPermIds.length > 0) {
        activeGroupIds.push(g.id);
      }
    });

    setRoleForm({
      name: role.name.replace(/_/g, ' '),
      description: role.description || '',
      status: role.status || 'ACTIVE',
      groupIds: activeGroupIds,
      permissionIds: role.permissions.map(p => p.id)
    });
    setSelectedPreviewGroup(null);
    setRoleMode('edit');
  };

  const handleToggleGroupInRole = (groupId) => {
    const isChecked = roleForm.groupIds.includes(groupId);
    const updatedGroups = isChecked
      ? roleForm.groupIds.filter(id => id !== groupId)
      : [...roleForm.groupIds, groupId];

    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const groupPermIds = group.permissions.map(p => p.id);
    let updatedPermIds = [...roleForm.permissionIds];

    if (isChecked) {
      // Remove permissions of this group
      updatedPermIds = updatedPermIds.filter(id => !groupPermIds.includes(id));
    } else {
      // Add permissions of this group
      updatedPermIds = Array.from(new Set([...updatedPermIds, ...groupPermIds]));
    }

    setRoleForm({
      ...roleForm,
      groupIds: updatedGroups,
      permissionIds: updatedPermIds
    });
  };

  const handleSaveRoleForm = async (e) => {
    e.preventDefault();
    if (!roleForm.name) {
      toast.error('Role name is required');
      return;
    }

    try {
      setSaving(true);
      if (roleMode === 'create') {
        const res = await adminApi.createRole(roleForm);
        if (res.success) {
          toast.success('New role created successfully!');
          setRoleMode('list');
          fetchData();
        }
      } else {
        const res = await adminApi.updateRole(selectedRole.id, roleForm);
        if (res.success) {
          toast.success('Role configuration updated!');
          setRoleMode('list');
          fetchData();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.name === 'SUPER_ADMIN') {
      toast.error('SUPER_ADMIN role cannot be deleted.');
      return;
    }
    if (role._count?.users > 0) {
      toast.error(`Cannot delete role ${role.name}. Reassign its ${role._count.users} staff members first.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) return;

    try {
      const res = await adminApi.deleteRole(role.id);
      if (res.success) {
        toast.success('Role deleted successfully');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete role');
    }
  };

  const handleToggleRoleStatus = async (role) => {
    if (role.name === 'SUPER_ADMIN') {
      toast.error('SUPER_ADMIN status cannot be changed.');
      return;
    }
    const nextStatus = role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await adminApi.updateRole(role.id, { status: nextStatus });
      if (res.success) {
        toast.success(`Role status marked as ${nextStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to change role status');
    }
  };

  // ─── Staff Reassignment ───────────────────────────────────────────────────
  const handleOpenAssignStaff = (staffMember = null) => {
    if (staffMember) {
      setSelectedStaffUser(staffMember);
      setTargetRoleId(staffMember.roleId);
      setIsStaffEditMode(true);
    } else {
      setSelectedStaffUser(null);
      setTargetRoleId('');
      setIsStaffEditMode(false);
    }
    setIsStaffModalOpen(true);
  };

  const handleSaveStaffRole = async () => {
    if (!selectedStaffUser || !targetRoleId) {
      toast.error('Please select both staff user and role');
      return;
    }
    
    // Super admin protection check
    if (selectedStaffUser.role?.name === 'SUPER_ADMIN') {
      const superAdmins = staff.filter(s => s.role?.name === 'SUPER_ADMIN');
      if (superAdmins.length <= 1) {
        toast.error('You cannot change the role of the last SUPER_ADMIN.');
        return;
      }
    }

    try {
      const res = await adminApi.updateStaffRole(selectedStaffUser.id, targetRoleId);
      if (res.success) {
        toast.success('Staff member role updated!');
        setIsStaffModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to assign role');
    }
  };

  // ─── Permission Groups CRUD ───────────────────────────────────────────────
  const handleOpenGroupModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        name: group.name,
        description: group.description || '',
        permissionIds: group.permissions?.map(p => p.id) || []
      });
    } else {
      setEditingGroup(null);
      setGroupForm({
        name: '',
        description: '',
        permissionIds: []
      });
    }
    setIsGroupModalOpen(true);
  };

  const togglePermissionInGroupForm = (id) => {
    const active = groupForm.permissionIds.includes(id);
    const updated = active
      ? groupForm.permissionIds.filter(x => x !== id)
      : [...groupForm.permissionIds, id];
    setGroupForm({ ...groupForm, permissionIds: updated });
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupForm.name) {
      toast.error('Group name is required');
      return;
    }
    try {
      if (editingGroup) {
        const res = await adminApi.updatePermissionGroup(editingGroup.id, groupForm);
        if (res.success) {
          toast.success('Permission group updated!');
          setIsGroupModalOpen(false);
          fetchData();
        }
      } else {
        const res = await adminApi.createPermissionGroup(groupForm);
        if (res.success) {
          toast.success('New permission group created!');
          setIsGroupModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save permission group');
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Are you sure you want to delete permission group "${group.name}"? Permissions inside will become ungrouped.`)) return;
    try {
      const res = await adminApi.deletePermissionGroup(group.id);
      if (res.success) {
        toast.success('Permission group deleted');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete group');
    }
  };

  // ─── Filtered Lists ───────────────────────────────────────────────────────
  const filteredStaff = staff.filter(s => {
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(staffSearch.toLowerCase()) || (s.email || '').toLowerCase().includes(staffSearch.toLowerCase());
    const matchesRole = staffRoleFilter === 'all' || s.roleId === staffRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Group permission lists for Matrix matrix view
  const permissionsByGroup = {};
  groups.forEach(g => {
    permissionsByGroup[g.name] = permissions.filter(p => p.groupId === g.id);
  });
  // Add ungrouped permissions just in case
  const ungrouped = permissions.filter(p => !p.groupId);
  if (ungrouped.length > 0) {
    permissionsByGroup['Ungrouped Permissions'] = ungrouped;
  }

  // ─── Expand/Collapse Groups in Role Permissions detail view ──────────────
  const toggleGroupExpanded = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const toggleAllGroups = (expand) => {
    const next = {};
    if (expand) {
      groups.forEach(g => { next[g.name] = true; });
      if (ungrouped.length > 0) next['Ungrouped Permissions'] = true;
    }
    setExpandedGroups(next);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-muted flex flex-col items-center justify-center gap-2.5">
        <RefreshCw className="w-5 h-5 animate-spin text-muted" />
        <span>Loading RBAC authorization configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-line pb-5 gap-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-ink flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-muted" /> Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-muted mt-0.5">Manage roles, permission groups and assign roles to staff members.</p>
        </div>
        {activeTab === 'matrix' && roleMode === 'list' && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleImportPermissions}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 border border-line text-ink text-xs font-bold uppercase rounded-lg hover:bg-stone transition-colors"
            >
              Import Permissions
            </button>
            <button
              onClick={handleSavePermissions}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 transition-colors shadow-xs"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Permissions
            </button>
          </div>
        )}
      </div>

      {/* ─── Navigation Tabs ───────────────────────────────────────────── */}
      {roleMode === 'list' && (
        <div className="flex border-b border-line gap-4 text-xs font-bold uppercase tracking-wider">
          <button onClick={() => setActiveTab('matrix')} className={`pb-3 border-b-2 transition-all ${activeTab === 'matrix' ? 'border-ink text-ink font-black' : 'border-transparent text-muted'}`}>Permission Matrix</button>
          <button onClick={() => setActiveTab('roles')} className={`pb-3 border-b-2 transition-all ${activeTab === 'roles' ? 'border-ink text-ink font-black' : 'border-transparent text-muted'}`}>Roles</button>
          <button onClick={() => setActiveTab('staff')} className={`pb-3 border-b-2 transition-all ${activeTab === 'staff' ? 'border-ink text-ink font-black' : 'border-transparent text-muted'}`}>Staff Assigned</button>
          <button onClick={() => setActiveTab('groups')} className={`pb-3 border-b-2 transition-all ${activeTab === 'groups' ? 'border-ink text-ink font-black' : 'border-transparent text-muted'}`}>Permission Groups</button>
        </div>
      )}

      {/* ─── TAB 1: Permission Matrix ──────────────────────────────────── */}
      {activeTab === 'matrix' && roleMode === 'list' && (
        <div className="bg-paper border border-line rounded-2xl shadow-xs overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone font-bold uppercase text-[10px] text-ink border-b border-line">
              <tr>
                <th className="p-4 w-[320px]">Permission Module / Action</th>
                {roles.map(r => (
                  <th key={r.id} className="p-4 text-center min-w-[120px]">
                    <div className="flex items-center justify-center gap-1.5 font-black">
                      <Shield className="w-3 h-3 text-muted" /> {r.name.replace(/_/g, ' ')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {Object.keys(permissionsByGroup).map(groupName => {
                const groupPerms = permissionsByGroup[groupName];
                return (
                  <tr key={groupName} className="bg-paper">
                    <td colSpan={roles.length + 1} className="p-0">
                      <div className="bg-stone/30 font-black text-ink uppercase tracking-tight py-2 px-4 border-y border-line text-[9px]">{groupName}</div>
                      <table className="w-full divide-y divide-line">
                        <tbody>
                          {groupPerms.map(p => (
                            <tr key={p.id} className="hover:bg-stone/10">
                              <td className="p-4 w-[320px] pl-6">
                                <div className="font-extrabold text-ink">{p.description || p.name.replace(/_/g, ' ')}</div>
                                <div className="text-[9px] text-muted font-mono">{p.name}</div>
                              </td>
                              {roles.map(r => {
                                const isSuper = r.name === 'SUPER_ADMIN';
                                const isChecked = (matrix[r.id] || []).includes(p.name);
                                return (
                                  <td key={r.id} className="p-4 text-center min-w-[120px]">
                                    <input
                                      type="checkbox"
                                      checked={isSuper || isChecked}
                                      disabled={isSuper}
                                      onChange={() => togglePermission(r.id, p.name)}
                                      className={`rounded text-ink ${isSuper ? 'bg-stone/50 border-stone cursor-not-allowed opacity-50' : 'cursor-pointer focus:ring-0'}`}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 2: Roles Tab ──────────────────────────────────────────── */}
      {activeTab === 'roles' && roleMode === 'list' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-sm uppercase text-ink">Roles list</h2>
              <p className="text-[10px] text-muted">Create custom system roles or edit existing functional configurations</p>
            </div>
            <button
              onClick={handleOpenCreateRole}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create Role
            </button>
          </div>

          <div className="bg-paper border border-line rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone text-[10px] font-bold uppercase text-muted border-b border-line">
                  <tr>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Users</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {roles.map(r => {
                    const isSuper = r.name === 'SUPER_ADMIN';
                    return (
                      <tr key={r.id} className="hover:bg-stone/10">
                        <td className="px-4 py-4.5 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-stone border border-line flex items-center justify-center text-ink flex-shrink-0">
                            <Shield className="w-4 h-4" />
                          </div>
                          <span className="font-extrabold text-ink uppercase tracking-tight text-[11px]">{r.name.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-4.5 text-muted max-w-sm truncate">{r.description || 'No description provided.'}</td>
                        <td className="px-4 py-4.5 font-bold text-ink">{r._count?.users || 0} users</td>
                        <td className="px-4 py-4.5 font-mono text-muted">
                          <button
                            onClick={() => { setSelectedRole(r); setRoleMode('view_permissions'); }}
                            className="hover:underline font-bold text-ink"
                          >
                            {isSuper ? 'All Permissions' : `${r.permissions?.length || 0} permissions`}
                          </button>
                        </td>
                        <td className="px-4 py-4.5">
                          <button
                            disabled={isSuper}
                            onClick={() => handleToggleRoleStatus(r)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                              r.status === 'ACTIVE'
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {r.status || 'ACTIVE'}
                          </button>
                        </td>
                        <td className="px-4 py-4.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditRole(r)}
                            disabled={isSuper}
                            className={`p-1.5 rounded hover:bg-stone text-muted hover:text-ink ${isSuper ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(r)}
                            disabled={isSuper}
                            className={`p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 ${isSuper ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Role: Create/Edit Role Panel ──────────────────────────────── */}
      {activeTab === 'roles' && (roleMode === 'create' || roleMode === 'edit') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-4.5">
            <button
              onClick={() => setRoleMode('list')}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-ink font-bold uppercase"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Roles
            </button>
            <h2 className="font-extrabold text-sm uppercase text-ink">
              {roleMode === 'create' ? 'Create / Edit Role' : `Edit Role: ${selectedRole?.name.replace(/_/g, ' ')}`}
            </h2>
          </div>

          <form onSubmit={handleSaveRoleForm} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Inputs */}
            <div className="lg:col-span-2 bg-paper border border-line rounded-2xl p-5 space-y-4 shadow-xs">
              <h3 className="font-bold text-xs uppercase text-ink border-b border-line pb-2.5">Role Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="e.g. Inventory Manager"
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Role Slug (Auto-generated)</label>
                  <input
                    type="text"
                    disabled
                    value={roleForm.name.trim().toUpperCase().replace(/\s+/g, '_')}
                    placeholder="e.g. INVENTORY_MANAGER"
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-muted bg-stone/50 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Description</label>
                <textarea
                  rows={3}
                  value={roleForm.description}
                  onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Summarize the core access limits for users with this role..."
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Status</label>
                <select
                  value={roleForm.status}
                  onChange={e => setRoleForm({ ...roleForm, status: e.target.value })}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Groups Selector */}
              <div className="pt-4 space-y-3">
                <h4 className="font-bold text-xs uppercase text-ink border-b border-line pb-2">Assign Permission Groups</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groups.map(g => {
                    const isChecked = roleForm.groupIds.includes(g.id);
                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedPreviewGroup(g)}
                        className={`border rounded-xl p-3 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          selectedPreviewGroup?.id === g.id ? 'border-ink bg-stone/20' : 'border-line hover:border-ink/20'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => { e.stopPropagation(); handleToggleGroupInRole(g.id); }}
                            className="rounded text-ink mt-0.5 cursor-pointer focus:ring-0"
                          />
                          <div>
                            <div className="font-bold text-ink text-xs">{g.name}</div>
                            <div className="text-[9px] text-muted line-clamp-1">{g.description}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {roleMode === 'create' ? 'Create Role' : 'Update Role'}
                </button>
              </div>
            </div>

            {/* Right Group details Preview */}
            <div className="bg-paper border border-line rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-xs uppercase text-ink border-b border-line pb-2.5">Group Details</h3>
              {selectedPreviewGroup ? (
                <div className="space-y-3.5 pt-2">
                  <div>
                    <h4 className="font-black text-ink text-sm">{selectedPreviewGroup.name}</h4>
                    <p className="text-[10px] text-muted mt-0.5">{selectedPreviewGroup.description}</p>
                  </div>
                  <div className="bg-stone/30 border border-line rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-ink uppercase tracking-tight">Contains {selectedPreviewGroup.permissions?.length || 0} permissions</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {selectedPreviewGroup.permissions?.map(p => (
                      <div key={p.id} className="flex items-center gap-2 py-1 text-xs">
                        <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        <span className="text-ink font-semibold">{p.description || p.name.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-muted flex flex-col items-center justify-center gap-2">
                  <FolderOpen className="w-8 h-8 text-muted" />
                  <span>Select a permission group to inspect details and granular keys.</span>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ─── Role: View Role Permissions detail page ──────────────────── */}
      {activeTab === 'roles' && roleMode === 'view_permissions' && selectedRole && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-4.5">
            <button
              onClick={() => setRoleMode('list')}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-ink font-bold uppercase"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Roles
            </button>
            <button
              onClick={() => handleOpenEditRole(selectedRole)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-line text-ink text-xs font-bold uppercase rounded-lg hover:bg-stone transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Permissions
            </button>
          </div>

          <div className="bg-paper border border-line rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-lg text-ink uppercase tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-muted" /> {selectedRole.name.replace(/_/g, ' ')}
                </h3>
                <p className="text-xs text-muted mt-1">{selectedRole.description || 'No description provided.'}</p>
              </div>
              <StatusBadge status={selectedRole.status} />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="border border-line rounded-xl p-3 bg-stone/20">
                <span className="block text-[9px] font-bold text-muted uppercase">Permission Groups</span>
                <span className="text-2xl font-black text-ink">
                  {groups.filter(g => g.permissions.some(p => selectedRole.permissions.some(rp => rp.id === p.id))).length}
                </span>
              </div>
              <div className="border border-line rounded-xl p-3 bg-stone/20">
                <span className="block text-[9px] font-bold text-muted uppercase">Total Permissions</span>
                <span className="text-2xl font-black text-ink">{selectedRole.permissions?.length || 0}</span>
              </div>
            </div>

            {/* Expandable Permissions details */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <h4 className="font-bold text-xs uppercase text-ink">Permission Groups & Permissions</h4>
                <div className="flex gap-2.5 text-[10px] font-bold uppercase text-ink">
                  <button onClick={() => toggleAllGroups(true)} className="hover:underline">Expand All</button>
                  <span>|</span>
                  <button onClick={() => toggleAllGroups(false)} className="hover:underline">Collapse All</button>
                </div>
              </div>

              <div className="space-y-3.5">
                {groups.map(g => {
                  const hasSome = g.permissions.some(p => selectedRole.permissions.some(rp => rp.id === p.id));
                  if (!hasSome) return null;

                  const isExpanded = expandedGroups[g.name];
                  const linkedPerms = g.permissions.filter(p => selectedRole.permissions.some(rp => rp.id === p.id));

                  return (
                    <div key={g.id} className="border border-line rounded-xl overflow-hidden bg-stone/10">
                      <div
                        onClick={() => toggleGroupExpanded(g.name)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone/20 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
                          <span className="font-extrabold text-ink text-xs">{g.name}</span>
                          <span className="text-[10px] text-muted">({linkedPerms.length} permissions)</span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-5 pb-4 pt-1 divide-y divide-line/40 text-xs">
                          {linkedPerms.map(p => (
                            <div key={p.id} className="py-2 flex items-center justify-between">
                              <span className="font-semibold text-ink">{p.description || p.name.replace(/_/g, ' ')}</span>
                              <span className="font-mono text-[9px] text-muted">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 3: Staff Assigned ─────────────────────────────────────── */}
      {activeTab === 'staff' && roleMode === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-extrabold text-sm uppercase text-ink">Staff Assigned to Roles</h2>
              <p className="text-[10px] text-muted">View and manage system staff members and their active roles</p>
            </div>
            <button
              onClick={() => handleOpenAssignStaff(null)}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 transition-colors shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" /> Assign Staff
            </button>
          </div>

          {/* Filters Toolbar */}
          <div className="bg-paper border border-line rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="text"
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                placeholder="Search staff by name or email..."
                className="w-full bg-stone border border-line rounded-lg pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <label className="text-[10px] font-bold uppercase text-muted whitespace-nowrap">Filter Role:</label>
              <select
                value={staffRoleFilter}
                onChange={e => setStaffRoleFilter(e.target.value)}
                className="w-full sm:w-44 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink bg-stone focus:outline-none"
              >
                <option value="all">All Roles</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-paper border border-line rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone text-[10px] font-bold uppercase text-muted border-b border-line">
                  <tr>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Login</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredStaff.map(s => {
                    const initials = `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase();
                    return (
                      <tr key={s.id} className="hover:bg-stone/10">
                        <td className="px-4 py-3.5 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-stone border border-line flex items-center justify-center text-[10px] font-black text-muted overflow-hidden flex-shrink-0">
                            {s.avatar ? <img src={s.avatar} alt="avatar" className="w-full h-full object-cover" /> : initials}
                          </div>
                          <div>
                            <span className="font-extrabold text-ink block">{s.firstName} {s.lastName}</span>
                            <span className="text-[9px] text-muted uppercase tracking-tight">{s.department || 'Operations'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted font-mono">{s.email}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-line rounded text-[10px] font-black uppercase text-ink bg-stone">
                            <Shield className="w-2.5 h-2.5 text-muted" /> {s.role?.name.replace(/_/g, ' ') || 'None'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${s.isBlocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {s.isBlocked ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted">{fmtDate(s.lastLogin)}</td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenAssignStaff(s)}
                            className="p-1.5 rounded hover:bg-stone text-muted hover:text-ink"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Permission Groups ─────────────────────────────────── */}
      {activeTab === 'groups' && roleMode === 'list' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-sm uppercase text-ink">Permission Groups</h2>
              <p className="text-[10px] text-muted">Create and manage permission groups to organize granular access keys easily</p>
            </div>
            <button
              onClick={() => handleOpenGroupModal(null)}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create Group
            </button>
          </div>

          <div className="bg-paper border border-line rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone text-[10px] font-bold uppercase text-muted border-b border-line">
                  <tr>
                    <th className="px-4 py-3">Group Name</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {groups.map(g => (
                    <tr key={g.id} className="hover:bg-stone/10">
                      <td className="px-4 py-3.5 font-extrabold text-ink">{g.name}</td>
                      <td className="px-4 py-3.5 text-muted max-w-sm truncate">{g.description || 'No description provided.'}</td>
                      <td className="px-4 py-3.5 font-bold text-ink">{g.permissions?.length || 0} permissions</td>
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenGroupModal(g)}
                          className="p-1.5 rounded hover:bg-stone text-muted hover:text-ink"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(g)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Assign Staff ───────────────────────────────────────── */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="font-extrabold text-xs uppercase text-ink">
                {isStaffEditMode ? 'Update Staff Role' : 'Assign Staff Role'}
              </h3>
              <button onClick={() => setIsStaffModalOpen(false)}><X className="w-5 h-5 text-muted" /></button>
            </div>
            <div className="space-y-4">
              {isStaffEditMode && selectedStaffUser ? (
                <div className="flex items-center gap-3 bg-stone/20 p-3 border border-line rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-stone border border-line flex items-center justify-center text-xs font-black text-muted">
                    {selectedStaffUser.firstName?.[0] || 'S'}{selectedStaffUser.lastName?.[0] || ''}
                  </div>
                  <div>
                    <span className="font-extrabold text-ink block text-xs">{selectedStaffUser.firstName} {selectedStaffUser.lastName || ''}</span>
                    <span className="text-[10px] text-muted">{selectedStaffUser.email}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Select Staff Member *</label>
                  <select
                    value={selectedStaffUser?.id || ''}
                    onChange={e => {
                      const s = staff.find(x => x.id === e.target.value);
                      setSelectedStaffUser(s);
                    }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  >
                    <option value="">Choose a staff member...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName || ''} ({s.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1.5">Select Role Assignment *</label>
                <select
                  value={targetRoleId}
                  onChange={e => setTargetRoleId(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                >
                  <option value="" disabled>Choose a role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-line">
                <button
                  onClick={() => setIsStaffModalOpen(false)}
                  className="flex-1 py-2 border border-line text-ink text-xs font-bold uppercase rounded-lg hover:bg-stone transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStaffRole}
                  className="flex-1 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 transition-colors"
                >
                  Confirm & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Create/Edit Permission Group ───────────────────────── */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-line pb-3 flex-shrink-0">
              <h3 className="font-extrabold text-xs uppercase text-ink">{editingGroup ? 'Edit Group' : 'Create Permission Group'}</h3>
              <button onClick={() => setIsGroupModalOpen(false)}><X className="w-5 h-5 text-muted" /></button>
            </div>
            <form onSubmit={handleGroupSubmit} className="space-y-4 overflow-y-auto flex-1 py-4 pr-1">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="e.g. Content Management"
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Description</label>
                <textarea
                  rows={2}
                  value={groupForm.description}
                  onChange={e => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Describe what area of the store this group manages..."
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1 border-b border-line pb-1.5">Select Granular Permissions</label>
                <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1">
                  {permissions.map(p => {
                    const isChecked = groupForm.permissionIds.includes(p.id);
                    return (
                      <div key={p.id} className="flex items-center justify-between py-1 border-b border-line/45">
                        <div className="min-w-0">
                          <span className="font-bold text-ink text-xs truncate block">{p.description || p.name.replace(/_/g, ' ')}</span>
                          <span className="text-[9px] text-muted font-mono">{p.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermissionInGroupForm(p.id)}
                          className="rounded text-ink cursor-pointer focus:ring-0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 flex-shrink-0 flex items-center justify-center gap-1.5"
              >
                {editingGroup ? 'Update Group' : 'Create Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
      active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-stone text-muted border-line'
    }`}>
      {status}
    </span>
  );
}
