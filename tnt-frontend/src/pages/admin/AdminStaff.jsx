import { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Edit2, ShieldAlert, RefreshCw, X, Send } from 'lucide-react';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Form States
  const [editingMember, setEditingMember] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [password, setPassword] = useState('');

  // Email States
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [targetStaff, setTargetStaff] = useState(null); // null means broadcast to all staff

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, rolesRes] = await Promise.all([
        apiClient.get('/admin/staff'),
        apiClient.get('/admin/roles')
      ]);
      if (staffRes.success) setStaff(staffRes.staff);
      if (rolesRes.success) setRoles(rolesRes.roles.filter(r => r.name !== 'CUSTOMER'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingMember(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRoleId(roles[0]?.id || '');
    setPassword('');
    setIsStaffModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFirstName(member.firstName || '');
    setLastName(member.lastName || '');
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setRoleId(member.roleId || '');
    setPassword('');
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      const payload = { firstName, lastName, email, phone, roleId };
      if (password) payload.password = password;

      if (editingMember) {
        // Update
        const res = await apiClient.put(`/admin/staff/${editingMember.id}`, payload);
        if (res.success) {
          toast.success('Staff member updated successfully');
          fetchData();
          setIsStaffModalOpen(false);
        }
      } else {
        // Create
        if (!password) {
          toast.error('Password is required for new staff members');
          return;
        }
        const res = await apiClient.post('/admin/staff', payload);
        if (res.success) {
          toast.success('Staff member added successfully');
          fetchData();
          setIsStaffModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save staff member');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      const res = await apiClient.delete(`/admin/staff/${id}`);
      if (res.success) {
        toast.success('Staff member deleted successfully');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete staff member');
    }
  };

  const openEmailModal = (member = null) => {
    setTargetStaff(member);
    setEmailSubject('');
    setEmailContent('');
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject || !emailContent) {
      toast.error('Please enter a subject and message');
      return;
    }
    try {
      const payload = {
        userId: targetStaff ? targetStaff.id : 'all',
        subject: emailSubject,
        content: emailContent
      };
      // Reuse email blast API on backend
      const res = await apiClient.post('/admin/email-blast', payload);
      if (res.success) {
        toast.success(targetStaff ? `Email sent to ${targetStaff.firstName}` : 'Broadcast sent to all staff');
        setIsEmailModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to dispatch email');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-line pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink uppercase tracking-tight">STAFF & TEAM MANAGEMENT</h1>
          <p className="text-xs text-muted">Create administrative profiles, configure team roles, and coordinate communication.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEmailModal(null)}
            className="px-4 py-2 border border-line rounded-lg text-xs font-bold text-ink hover:bg-stone/50 flex items-center gap-1.5 uppercase"
          >
            <Mail className="w-3.5 h-3.5" /> Broadcast to Staff
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Staff Member
          </button>
        </div>
      </div>

      {/* Staff Grid & Table */}
      {loading ? (
        <div className="py-24 text-center text-xs text-muted flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading administrative team...
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-stone/20 border border-line rounded-xl p-16 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-paper border border-line flex items-center justify-center text-ink mx-auto mb-2">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-extrabold text-ink uppercase">No Staff Profiles Configured</h3>
          <p className="text-xs text-muted leading-relaxed">
            Register administrators, support agents, and store operations managers to allocate access.
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded inline-block"
          >
            Create Staff Profile
          </button>
        </div>
      ) : (
        <div className="bg-paper border border-line rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Phone Contact</th>
                <th className="p-4 text-center">Security Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {staff.map(member => (
                <tr key={member.id} className="hover:bg-stone/20">
                  <td className="p-4 font-extrabold text-ink">
                    {member.firstName} {member.lastName || ''}
                  </td>
                  <td className="p-4 font-mono text-muted">{member.email}</td>
                  <td className="p-4 font-semibold text-muted">{member.phone || 'N/A'}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      member.role?.name === 'SUPER_ADMIN'
                        ? 'bg-red-100 text-red-700'
                        : member.role?.name === 'ADMIN'
                        ? 'bg-indigo-100 text-indigo-700'
                        : member.role?.name === 'MANAGER'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {member.role?.name || 'STAFF'}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-muted">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-1.5">
                    <button
                      onClick={() => openEmailModal(member)}
                      className="p-1.5 border border-line rounded text-muted hover:text-ink hover:bg-stone"
                      title="Send individual email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-1.5 border border-line rounded text-muted hover:text-indigo-600 hover:bg-stone"
                      title="Edit staff details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member.id)}
                      className="p-1.5 border border-line rounded text-muted hover:text-red-600 hover:bg-stone"
                      title="Delete profile"
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

      {/* STAFF CRUD MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-paper border border-line rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-scale-in">
            <button
              onClick={() => setIsStaffModalOpen(false)}
              className="absolute right-4 top-4 text-muted hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider mb-4 border-b border-line pb-2">
              {editingMember ? '⚡ EDIT STAFF PROFILE' : '⚡ CREATE STAFF PROFILE'}
            </h3>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-semibold text-ink focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-semibold text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-semibold text-ink focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted">Phone Contact</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-semibold text-ink focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted">Administrative Role</label>
                <select
                  value={roleId}
                  onChange={e => setRoleId(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-semibold text-ink focus:outline-none"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted">
                  {editingMember ? 'Password (Leave blank to keep)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingMember}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-semibold text-ink focus:outline-none"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="w-1/2 py-2.5 border border-line text-ink text-xs font-bold uppercase rounded hover:bg-stone"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMAIL DISPATCH MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-paper border border-line rounded-xl w-full max-w-lg p-6 relative shadow-2xl animate-scale-in">
            <button
              onClick={() => setIsEmailModalOpen(false)}
              className="absolute right-4 top-4 text-muted hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider mb-2 border-b border-line pb-2">
              ⚡ {targetStaff ? `MESSAGE TO ${targetStaff.firstName.toUpperCase()}` : 'BROADCAST MESSAGE TO STAFF'}
            </h3>
            <span className="text-[10px] text-muted block mb-4">
              {targetStaff ? `Direct mail dispatching to ${targetStaff.email}` : 'This email will be dispatched to all registered staff members.'}
            </span>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted">Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Maintenance Notice"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-semibold text-ink focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted">HTML Message Body</label>
                <textarea
                  required
                  rows={8}
                  placeholder="<p>Provide details here...</p>"
                  value={emailContent}
                  onChange={e => setEmailContent(e.target.value)}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-mono text-ink focus:outline-none"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="w-1/2 py-2.5 border border-line text-ink text-xs font-bold uppercase rounded hover:bg-stone"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Dispatch Mail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
