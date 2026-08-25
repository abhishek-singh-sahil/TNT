import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Users, UserCheck, UserX, Clock, Plus, Search, FileDown, 
  MoreVertical, ChevronLeft, ChevronRight, Edit3, Key, 
  Trash2, X, AlertTriangle, CheckCircle2, ChevronDown, 
  Mail, Settings, Bell, Shield, Sliders
} from 'lucide-react';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';
import ActionMenu from '../../components/common/ActionMenu';

const DEPARTMENTS = [
  'Engineering',
  'Customer Support',
  'Human Resources',
  'Finance',
  'Sales',
  'Marketing',
  'IT',
  'Operations'
];

export default function AdminStaff() {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();

  // API query params synced with URL
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || 'All Departments';
  const roleName = searchParams.get('role') || 'All Roles';
  const status = searchParams.get('status') || 'All Status';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Data states
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [kpis, setKpis] = useState({ totalStaff: 0, activeStaff: 0, inactiveStaff: 0 });

  // Checked item IDs for bulk selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Active action menu row ID
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resettingStaff, setResettingStaff] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailTarget, setEmailTarget] = useState(null);

  // Form inputs
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: '',
    department: 'Operations',
    password: '',
    isBlocked: false
  });
  const [newPassword, setNewPassword] = useState('');

  // Confirmation Modals
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState(null);
  const [bulkActionConfirm, setBulkActionConfirm] = useState(null); // 'activate' | 'deactivate' | 'delete'

  // Debounced search term
  const [searchVal, setSearchVal] = useState(search);

  // Fetch roles once on mount
  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await apiClient.get('/admin/roles');
        if (res.success && res.roles) {
          setRoles(res.roles.filter(r => r.name !== 'CUSTOMER'));
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    }
    loadRoles();
  }, []);

  // Fetch staff list whenever query params change
  useEffect(() => {
    fetchStaffList();
    // Close dropdowns on update
    setActiveMenuId(null);
  }, [page, search, department, roleName, status, sortBy, sortOrder]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrlParams({ search: searchVal, page: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchVal]);

  const fetchStaffList = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/staff', {
        params: {
          search,
          department,
          role: roleName,
          status,
          page,
          limit: 8,
          sortBy,
          sortOrder
        }
      });
      if (res.success) {
        setStaff(res.staff || []);
        setTotalItems(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.kpis) {
          setKpis(res.kpis);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch staff directory');
    } finally {
      setLoading(false);
    }
  };

  const updateUrlParams = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newParams };

    // Clean up defaults
    if (merged.page === 1 || merged.page === '1') delete merged.page;
    if (!merged.search) delete merged.search;
    if (merged.department === 'All Departments') delete merged.department;
    if (merged.role === 'All Roles') delete merged.role;
    if (merged.status === 'All Status') delete merged.status;
    if (merged.sortBy === 'createdAt') delete merged.sortBy;
    if (merged.sortOrder === 'desc') delete merged.sortOrder;

    setSearchParams(merged);
  };

  const handleSort = (field) => {
    const nextOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    updateUrlParams({ sortBy: field, sortOrder: nextOrder });
  };

  // Checkbox interactions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(staff.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  // Create & Edit operations
  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roleId: roles[0]?.id || '',
      department: 'Operations',
      password: '',
      isBlocked: false
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email || '',
      phone: member.phone || '',
      roleId: member.roleId || '',
      department: member.department || 'Operations',
      password: '',
      isBlocked: member.isBlocked || false
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.roleId) {
      toast.error('First name, Email and Role are required.');
      return;
    }

    try {
      if (editingStaff) {
        // Edit mode
        const res = await apiClient.put(`/admin/staff/${editingStaff.id}`, formData);
        if (res.success) {
          toast.success('Staff member profile updated');
          setIsCreateModalOpen(false);
          fetchStaffList();
        }
      } else {
        // Create mode
        if (!formData.password) {
          toast.error('Password is required for new staff accounts.');
          return;
        }
        const res = await apiClient.post('/admin/staff', formData);
        if (res.success) {
          toast.success('Staff member registered successfully');
          setIsCreateModalOpen(false);
          fetchStaffList();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save staff information');
    }
  };

  // Toggle user blocked status
  const handleToggleStatus = async (member) => {
    try {
      const res = await apiClient.put(`/admin/staff/${member.id}`, {
        isBlocked: !member.isBlocked
      });
      if (res.success) {
        toast.success(`Staff member account ${!member.isBlocked ? 'deactivated' : 'activated'} successfully`);
        fetchStaffList();
      }
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  // Password reset
  const handleOpenResetPassword = (member) => {
    setResettingStaff(member);
    setNewPassword('');
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    try {
      const res = await apiClient.put(`/admin/staff/${resettingStaff.id}`, {
        password: newPassword
      });
      if (res.success) {
        toast.success('Password updated successfully');
        setIsResetPasswordModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to update password');
    }
  };

  // Single Delete
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmStaff) return;
    try {
      const res = await apiClient.delete(`/admin/staff/${deleteConfirmStaff.id}`);
      if (res.success) {
        toast.success('Staff member permanently deleted');
        setDeleteConfirmStaff(null);
        fetchStaffList();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete staff member');
    }
  };

  // Bulk Actions execution
  const handleExecuteBulkAction = async () => {
    if (selectedIds.length === 0 || !bulkActionConfirm) return;
    try {
      if (bulkActionConfirm === 'activate') {
        await Promise.all(selectedIds.map(id => apiClient.put(`/admin/staff/${id}`, { isBlocked: false })));
        toast.success(`Activated ${selectedIds.length} staff members`);
      } else if (bulkActionConfirm === 'deactivate') {
        await Promise.all(selectedIds.map(id => apiClient.put(`/admin/staff/${id}`, { isBlocked: true })));
        toast.success(`Deactivated ${selectedIds.length} staff members`);
      } else if (bulkActionConfirm === 'delete') {
        await Promise.all(selectedIds.map(id => apiClient.delete(`/admin/staff/${id}`)));
        toast.success(`Deleted ${selectedIds.length} staff members`);
      }
      setSelectedIds([]);
      setBulkActionConfirm(null);
      fetchStaffList();
    } catch (err) {
      toast.error('Bulk operation failed');
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (staff.length === 0) {
      toast.error('No staff records found to export');
      return;
    }
    const headers = ['Staff ID', 'Name', 'Email', 'Role', 'Department', 'Status', 'Last Login', 'Created Date'];
    const rows = staff.map((member, index) => [
      `EMP${String(index + 1).padStart(3, '0')}`,
      `${member.firstName} ${member.lastName || ''}`,
      member.email,
      member.role?.name || 'STAFF',
      member.department || 'Operations',
      member.isBlocked ? 'Inactive' : 'Active',
      member.lastLogin ? new Date(member.lastLogin).toLocaleString() : 'Never logged in',
      new Date(member.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `staff_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Staff directory exported successfully');
  };

  // Broadcast email dispatch
  const handleOpenEmail = (member = null) => {
    setEmailTarget(member);
    setEmailSubject('');
    setEmailContent('');
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject || !emailContent) {
      toast.error('Subject and message content are required.');
      return;
    }
    try {
      const payload = {
        userId: emailTarget ? emailTarget.id : 'all',
        subject: emailSubject,
        content: emailContent
      };
      const res = await apiClient.post('/admin/email-blast', payload);
      if (res.success) {
        toast.success('Email dispatched successfully! Confirm details in spam folder.');
        setIsEmailModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to dispatch email broadcast');
    }
  };

  // Helpers
  const getInitials = (firstName, lastName) => {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'ST';
  };

  const getAvatarBg = (name) => {
    const colors = [
      'bg-violet-100 text-violet-700',
      'bg-emerald-100 text-emerald-700',
      'bg-indigo-100 text-indigo-700',
      'bg-pink-100 text-pink-700',
      'bg-sky-100 text-sky-700',
      'bg-amber-100 text-amber-700'
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'SUPER_ADMIN': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'ADMIN': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'MANAGER': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'SUPPORT': return 'bg-sky-50 text-sky-700 border-sky-100';
      default: return 'bg-stone text-ink border-line';
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${diffDays} Days Ago`;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* 5. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Staff Management</h1>
          <p className="text-xs text-muted">Manage and monitor all staff members efficiently</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-ink text-paper text-xs font-bold tracking-wider rounded-lg hover:bg-ink/90 flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* 6. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="bg-paper border border-line rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted tracking-widest block">Total Staff</span>
            <span className="text-3xl font-black text-ink block">{loading ? '...' : kpis.totalStaff}</span>
            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
              ▲ 12% <span className="text-muted font-bold">vs. last month</span>
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-paper border border-line rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">Active Staff</span>
            <span className="text-3xl font-black text-emerald-600 block">{loading ? '...' : kpis.activeStaff}</span>
            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
              ▲ 10% <span className="text-muted font-bold">vs. last month</span>
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-paper border border-line rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">Inactive Staff</span>
            <span className="text-3xl font-black text-rose-600 block">{loading ? '...' : kpis.inactiveStaff}</span>
            <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-0.5">
              ▼ 8% <span className="text-muted font-bold">vs. last month</span>
            </span>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-paper border border-line rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">Avg. Last Login</span>
            <span className="text-base font-black text-ink block uppercase tracking-tight py-1.5">
              {staff.length > 0 && staff[0].lastLogin ? formatRelativeTime(staff[0].lastLogin).split(',')[0] : 'Today'}
            </span>
            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
              ▲ 5% <span className="text-muted font-bold">vs. last month</span>
            </span>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-700 rounded-xl flex items-center justify-center border border-sky-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 8. Staff List Section */}
      <div className="bg-paper border border-line rounded-xl shadow-xs overflow-hidden">
        
        {/* Staff List Header */}
        <div className="p-5 border-b border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-extrabold text-sm text-ink tracking-wider">
            Staff List ({totalItems})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-ink text-paper text-[10px] font-bold tracking-wider rounded hover:bg-ink/90 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Staff
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-line text-[10px] font-bold text-ink tracking-wider rounded hover:bg-stone flex items-center gap-1.5 transition-all"
            >
              <FileDown className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={() => handleOpenEmail(null)}
              className="px-4 py-2 border border-line text-[10px] font-bold text-ink tracking-wider rounded hover:bg-stone flex items-center gap-1.5 transition-all"
              title="Broadcast email to all staff"
            >
              <Mail className="w-3.5 h-3.5" /> Broadcast
            </button>
          </div>
        </div>

        {/* 11 & 12. Search & Filters Bar */}
        <div className="p-5 bg-stone/40 border-b border-line grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative col-span-1 sm:col-span-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search staff by name, email or role..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-paper border border-line rounded-lg text-xs font-semibold text-ink focus:outline-none placeholder-muted focus:border-ink transition-colors"
            />
          </div>

          <div>
            <select
              value={department}
              onChange={(e) => updateUrlParams({ department: e.target.value, page: 1 })}
              className="w-full bg-paper border border-line rounded-lg px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:border-ink"
            >
              <option value="All Departments">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={roleName}
              onChange={(e) => updateUrlParams({ role: e.target.value, page: 1 })}
              className="w-full bg-paper border border-line rounded-lg px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:border-ink"
            >
              <option value="All Roles">All Roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => updateUrlParams({ status: e.target.value, page: 1 })}
              className="w-full bg-paper border border-line rounded-lg px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:border-ink"
            >
              <option value="All Status">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Bulk Selection Notification Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-ink text-paper px-5 py-3 flex items-center justify-between text-xs animate-fadeIn">
            <span className="font-semibold tracking-wider">
              {selectedIds.length} Staff Member{selectedIds.length > 1 ? 's' : ''} Selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setBulkActionConfirm('activate')}
                className="px-3 py-1 bg-paper/10 rounded hover:bg-paper/20 font-bold uppercase text-[10px]"
              >
                Bulk Activate
              </button>
              <button
                onClick={() => setBulkActionConfirm('deactivate')}
                className="px-3 py-1 bg-paper/10 rounded hover:bg-paper/20 font-bold uppercase text-[10px]"
              >
                Bulk Deactivate
              </button>
              <button
                onClick={() => setBulkActionConfirm('delete')}
                className="px-3 py-1 bg-red-600 text-paper rounded hover:bg-red-700 font-bold uppercase text-[10px]"
              >
                Bulk Delete
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-1 text-paper/60 hover:text-paper"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 13. Main Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 text-center text-xs text-muted flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 animate-spin" /> Fetching staff directory database...
            </div>
          ) : staff.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Sliders className="w-10 h-10 text-muted mx-auto" />
              <h4 className="font-extrabold text-xs uppercase text-ink">No Staff Records Match Filters</h4>
              <p className="text-[10px] text-muted">Try clearing your filters or widening search terms.</p>
              <button
                onClick={() => {
                  setSearchVal('');
                  setSearchParams({});
                }}
                 className="px-4 py-2 bg-stone border border-line rounded text-xs font-bold hover:bg-stone/80 text-ink"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-stone/50 font-bold text-ink border-b border-line select-none">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === staff.length}
                      onChange={handleSelectAll}
                      className="rounded border-line text-ink focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-stone" onClick={() => handleSort('firstName')}>
                    <span className="flex items-center gap-1">
                      Staff Member {sortBy === 'firstName' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </span>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-stone" onClick={() => handleSort('role')}>
                    <span className="flex items-center gap-1">
                      Security Role {sortBy === 'role' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </span>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-stone" onClick={() => handleSort('department')}>
                    <span className="flex items-center gap-1">
                      Department {sortBy === 'department' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </span>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-stone" onClick={() => handleSort('email')}>
                    <span className="flex items-center gap-1">
                      Email Address {sortBy === 'email' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </span>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-stone" onClick={() => handleSort('isBlocked')}>
                    <span className="flex items-center gap-1">
                      Status {sortBy === 'isBlocked' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </span>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-stone" onClick={() => handleSort('lastLogin')}>
                    <span className="flex items-center gap-1">
                      Last Login {sortBy === 'lastLogin' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </span>
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {staff.map((member, index) => {
                  const initials = getInitials(member.firstName, member.lastName);
                  const isChecked = selectedIds.includes(member.id);
                  const empId = `EMP${String((page - 1) * 8 + index + 1).padStart(3, '0')}`;

                  return (
                    <tr 
                      key={member.id} 
                      className={`hover:bg-stone/20 transition-all ${isChecked ? 'bg-stone/10' : ''}`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(member.id, e.target.checked)}
                          className="rounded border-line text-ink focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                        />
                      </td>

                      {/* Staff Identity */}
                      <td className="p-4 font-bold text-ink">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center overflow-hidden border border-line ${getAvatarBg(member.firstName)}`}>
                            {member.avatar ? (
                              <img src={member.avatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                          <div>
                            <span className="block font-extrabold uppercase text-xs tracking-tight">
                              {member.firstName} {member.lastName || ''}
                            </span>
                            <span className="block text-[10px] text-muted font-mono">{empId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badges */}
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getRoleBadgeStyle(member.role?.name)}`}>
                          {member.role?.name || 'STAFF'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="p-4 font-semibold text-muted">
                        {member.department || 'Operations'}
                      </td>

                      {/* Email */}
                      <td className="p-4 font-mono text-muted font-medium">
                        {member.email}
                      </td>

                      {/* Status Toggle switch */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(member)}
                            className={`w-9 h-5 rounded-full relative transition-colors duration-200 outline-none ${
                              !member.isBlocked ? 'bg-emerald-500' : 'bg-stone border border-line'
                            }`}
                          >
                            <span 
                              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${
                                !member.isBlocked ? 'left-[18px]' : 'left-[3px] border border-line/45'
                              }`} 
                            />
                          </button>
                          <span className={`text-[10px] font-extrabold uppercase ${!member.isBlocked ? 'text-emerald-700' : 'text-muted'}`}>
                            {!member.isBlocked ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="p-4 font-semibold text-muted font-mono">
                        {formatRelativeTime(member.lastLogin)}
                      </td>

                      {/* Row Actions Menu */}
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <ActionMenu
                          trigger={
                            <button className="p-1.5 border border-line rounded-lg text-muted hover:text-ink hover:bg-stone transition-all">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          }
                          items={[
                            {
                              label: 'Edit Staff',
                              icon: <Edit3 className="w-3.5 h-3.5 text-muted" />,
                              onClick: () => handleOpenEdit(member)
                            },
                            {
                              label: 'Reset Password',
                              icon: <Key className="w-3.5 h-3.5 text-muted" />,
                              onClick: () => handleOpenResetPassword(member)
                            },
                            {
                              label: member.isBlocked ? 'Activate' : 'Deactivate',
                              icon: <UserCheck className="w-3.5 h-3.5 text-muted" />,
                              onClick: () => handleToggleStatus(member)
                            },
                            {
                              label: 'Send Email',
                              icon: <Mail className="w-3.5 h-3.5 text-muted" />,
                              onClick: () => handleOpenEmail(member)
                            },
                            { divider: true },
                            {
                              label: 'Delete Member',
                              icon: <Trash2 className="w-3.5 h-3.5" />,
                              danger: true,
                              onClick: () => setDeleteConfirmStaff(member)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 28. Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="p-5 border-t border-line flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] text-muted font-bold uppercase">
              Showing {(page - 1) * 8 + 1} - {Math.min(page * 8, totalItems)} of {totalItems} staff members
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateUrlParams({ page: page - 1 })}
                disabled={page === 1}
                className="p-2 border border-line rounded-lg hover:bg-stone disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4 text-ink" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateUrlParams({ page: p })}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    page === p
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper text-ink border-line hover:bg-stone'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => updateUrlParams({ page: page + 1 })}
                disabled={page === totalPages}
                className="p-2 border border-line rounded-lg hover:bg-stone disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4 text-ink" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ADD / EDIT STAFF MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {editingStaff ? '⚡ Modify Staff Record' : '⚡ Add Staff Member'}
              </span>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-ink mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-ink mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-ink mb-1">Administrative Role *</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-ink mb-1">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Phone Contact</label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>

              {!editingStaff && (
                <div>
                  <label className="block text-[9px] font-bold uppercase text-ink mb-1">Secure Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="modalBlocked"
                  checked={formData.isBlocked}
                  onChange={(e) => setFormData({ ...formData, isBlocked: e.target.checked })}
                  className="rounded border-line text-ink focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="modalBlocked" className="text-[10px] font-bold uppercase text-ink cursor-pointer">
                  Suspend this staff member (Deactivate)
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-1/2 py-2.5 border border-line text-ink text-xs font-bold uppercase rounded-lg hover:bg-stone"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90"
                >
                  {editingStaff ? 'Save Changes' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">🔒 Reset Password</span>
              <button onClick={() => setIsResetPasswordModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-[11px] text-muted leading-relaxed">
              Reset password for <span className="font-bold text-ink">{resettingStaff?.firstName} {resettingStaff?.lastName}</span>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="w-1/2 py-2.5 border border-line text-ink text-xs font-bold uppercase rounded-lg hover:bg-stone"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90"
                >
                  Reset Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BRDCST EMAIL MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">✉️ Dispatch Staff Email</span>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[10px] text-muted leading-relaxed">
              {emailTarget 
                ? `Direct email to: ${emailTarget.firstName} ${emailTarget.lastName || ''} (${emailTarget.email})`
                : 'Broadcasting email notice to ALL active administrative staff members.'
              }
            </p>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Subject Header</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Action Required: System Inventory Update"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Message Content (HTML Supported)</label>
                <textarea
                  required
                  rows={6}
                  placeholder="<p>Write your official notice here...</p>"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink font-mono focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="w-1/2 py-2.5 border border-line text-ink text-xs font-bold uppercase rounded-lg hover:bg-stone"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Dispatch Mail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-ink uppercase">Delete Staff Member?</h4>
              <p className="text-[10px] text-muted leading-relaxed">
                Are you sure you want to permanently delete the profile for <span className="font-bold text-ink">{deleteConfirmStaff.firstName} {deleteConfirmStaff.lastName || ''}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmStaff(null)}
                className="w-1/2 py-2 border border-line text-ink text-xs font-bold uppercase rounded hover:bg-stone"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-1/2 py-2 bg-rose-600 text-paper text-xs font-bold uppercase rounded hover:bg-rose-700"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ACTION CONFIRMATION MODAL */}
      {bulkActionConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-ink uppercase">Confirm Bulk Action</h4>
              <p className="text-[10px] text-muted leading-relaxed">
                Are you sure you want to <span className="font-extrabold text-ink uppercase">{bulkActionConfirm}</span> the <span className="font-bold text-ink">{selectedIds.length} selected</span> staff members?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBulkActionConfirm(null)}
                className="w-1/2 py-2 border border-line text-ink text-xs font-bold uppercase rounded hover:bg-stone"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkAction}
                className="w-1/2 py-2 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
