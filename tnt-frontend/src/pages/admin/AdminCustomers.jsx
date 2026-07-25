import { useState, useEffect } from 'react';
import { adminApi } from '../../api/services';
import { Users, Edit, Trash2, Mail, Plus, X, Search, Check, Star, Paperclip, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected User Modal CRUD state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    rewardPoints: '0',
  });

  // Email Blast Modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    userId: 'all', // 'all' or specific user ID
    targetName: 'All Customers',
    subject: '',
    content: '',
    imageUrl: '',
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCustomers();
      if (res.success && res.customers) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenEditModal = (cust) => {
    setSelectedCustomer(cust);
    setEditForm({
      firstName: cust.firstName,
      lastName: cust.lastName || '',
      email: cust.email,
      phone: cust.phone || '',
      rewardPoints: String(cust.rewardPoints || 0),
    });
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.updateCustomer(selectedCustomer.id, editForm);
      if (res.success) {
        toast.success('Customer details updated successfully!');
        setSelectedCustomer(null);
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${name}?`)) return;
    try {
      const res = await adminApi.deleteCustomer(id);
      if (res.success) {
        toast.success('Customer account deleted from database');
        setSelectedCustomer(null);
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer');
    }
  };

  const handleOpenEmailModal = (targetId, name) => {
    setEmailData({
      userId: targetId,
      targetName: name,
      subject: '',
      content: '',
      imageUrl: '',
    });
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailData.subject || !emailData.content) {
      toast.error('Subject and main content are required');
      return;
    }

    try {
      setSendingEmail(true);
      const res = await adminApi.sendBlastEmail(emailData);
      if (res.success) {
        toast.success(`Email broadcast successfully sent to: ${emailData.targetName}`);
        setEmailModalOpen(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send broadcast email');
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink">CUSTOMER MANAGEMENT</h1>
          <p className="text-xs text-muted">Manage buyer records, update reward tier points, and dispatch newsletter broadcasts.</p>
        </div>

        <button
          onClick={() => handleOpenEmailModal('all', 'All Registered Customers')}
          className="px-4 py-2 border border-line text-xs font-bold uppercase text-ink hover:bg-stone flex items-center gap-2 rounded-lg"
        >
          <Mail className="w-4 h-4" /> BROADCAST TO ALL USERS
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex items-center justify-between bg-paper p-4 border border-line rounded-xl">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customers by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone border border-line rounded-lg text-xs font-semibold text-ink focus:outline-none"
          />
        </div>
        <span className="text-xs text-muted font-bold">Total Members: {filteredCustomers.length}</span>
      </div>

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-paper border border-line rounded-xl p-16 text-center space-y-3">
          <Users className="w-10 h-10 mx-auto text-muted animate-pulse" />
          <span className="font-extrabold text-xs uppercase text-ink block">No Customers Found</span>
          <p className="text-[10px] text-muted max-w-xs mx-auto">Registered buyer profiles will appear here.</p>
        </div>
      ) : (
        <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Phone Contact</th>
                <th className="p-4">TNT Club points</th>
                <th className="p-4 text-right">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredCustomers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => handleOpenEditModal(c)}
                  className="hover:bg-stone/50 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-extrabold text-ink">
                    {c.firstName} {c.lastName || ''}
                  </td>
                  <td className="p-4 font-mono text-muted">{c.email}</td>
                  <td className="p-4 text-muted">{c.phone || '-'}</td>
                  <td className="p-4 font-bold text-ink flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span>{c.rewardPoints ?? 0}</span>
                  </td>
                  <td className="p-4 text-right text-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEmailModal(c.id, `${c.firstName} ${c.lastName || ''}`)}
                      className="p-1.5 text-muted hover:text-ink transition-colors"
                      title="Send individual email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(c.id, `${c.firstName} ${c.lastName || ''}`)}
                      className="p-1.5 text-muted hover:text-red-600 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Customer Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">Modify Customer Profile</span>
              <button onClick={() => setSelectedCustomer(null)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">TNT Club Points</label>
                  <input
                    type="number"
                    value={editForm.rewardPoints}
                    onChange={(e) => setEditForm({ ...editForm, rewardPoints: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> SAVE CHANGES
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomer(selectedCustomer.id, `${editForm.firstName} ${editForm.lastName}`)}
                  className="px-4 py-3 border border-red-200 text-red-600 text-xs font-bold uppercase rounded hover:bg-red-50 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-designed Broadcast Email Composer Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-4xl w-full shadow-2xl space-y-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Input Fields */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-line pb-3">
                <div>
                  <span className="font-extrabold text-xs uppercase text-ink tracking-wider block">BROADCAST EMAIL COMPOSER</span>
                  <span className="text-[10px] text-muted font-bold">Recipient target: {emailData.targetName}</span>
                </div>
                <button onClick={() => setEmailModalOpen(false)} className="text-muted hover:text-ink md:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Subject Header *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exclusive Spring Collection Drop is Here!"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Main Body Copy *</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Write your beautiful announcement message details here..."
                    value={emailData.content}
                    onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Banner Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or upload"
                    value={emailData.imageUrl}
                    onChange={(e) => setEmailData({ ...emailData, imageUrl: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 flex items-center justify-center gap-2"
                  >
                    {sendingEmail ? 'DISPATCHING EMAIL BLAST...' : 'SEND BROADCAST'} <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Pre-designed Live HTML Email Template Preview */}
            <div className="border border-line rounded-xl p-5 bg-stone/30 flex flex-col justify-between max-h-[500px] overflow-y-auto">
              <div>
                <div className="flex justify-between items-center border-b border-line pb-2 mb-4">
                  <span className="text-[10px] font-extrabold uppercase text-muted">HTML LIVE PREVIEW</span>
                  <button onClick={() => setEmailModalOpen(false)} className="text-muted hover:text-ink hidden md:block">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Email template envelope */}
                <div className="bg-paper border border-line p-5 rounded-lg space-y-4 shadow-sm text-ink">
                  {/* TNT Header */}
                  <div className="text-center border-b-2 border-ink pb-3 mb-4">
                    <span className="font-extrabold text-lg tracking-tighter text-ink block">TNT LUXURY STREETWEAR</span>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Official Store Newsletter</span>
                  </div>

                  {/* Subject and Content */}
                  <h2 className="font-extrabold text-sm text-ink uppercase tracking-tight">
                    {emailData.subject || '[Subject Line Placeholder]'}
                  </h2>
                  
                  <p className="text-[11px] text-muted whitespace-pre-line leading-relaxed">
                    {emailData.content || 'Your beautiful newsletter body copy will preview live here in real-time as you write...'}
                  </p>

                  {/* Optional Image */}
                  {emailData.imageUrl && (
                    <div className="my-4 text-center">
                      <img src={emailData.imageUrl} alt="Promo Banner" className="max-w-full rounded border border-line" />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-line/50 pt-3 text-[8px] text-muted text-center leading-normal">
                    <p className="font-bold text-ink">TNT Clothing Pvt. Ltd.</p>
                    <p>You received this because you are registered at tntclothing.com</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
