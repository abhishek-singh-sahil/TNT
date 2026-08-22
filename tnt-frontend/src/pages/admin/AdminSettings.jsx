import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Settings, Key, Shield, Save, RefreshCw, Landmark, Truck, Bell, 
  Lock, Plus, Trash2, Edit2, X, Globe, Building, CheckCircle, 
  AlertCircle, Eye, EyeOff, LogOut, Smartphone, Mail, AlertTriangle, Info
} from 'lucide-react';
import { adminApi } from '../../api/services';
import { useRBAC } from '../../hooks/useRBAC';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'general';
  
  const { hasPermission } = useRBAC();
  const canEdit = hasPermission('edit_settings');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Settings states matching schema
  const [siteName, setSiteName] = useState('TNT Luxury Streetwear');
  const [siteEmail, setSiteEmail] = useState('contact@tntclothing.com');
  const [sitePhone, setSitePhone] = useState('+91 99999 88888');
  const [currency, setCurrency] = useState('INR');
  const [logo, setLogo] = useState('');
  const [favicon, setFavicon] = useState('');
  const [tagline, setTagline] = useState('Threadones - Wear Your Vibe');

  // Business Info
  const [businessName, setBusinessName] = useState('Threadones Private Limited');
  const [businessType, setBusinessType] = useState('Private Limited');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('123 Business Park, New Delhi, India');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [pinCode, setPinCode] = useState('110001');
  const [country, setCountry] = useState('India');

  // Store Status
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("We'll be back soon. Thank you for your patience!");

  // Store Config
  const [timezone, setTimezone] = useState('UTC+05:30');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [cancellationWindow, setCancellationWindow] = useState(30);

  // Payments
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [cardEnabled, setCardEnabled] = useState(true);
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [netBankingEnabled, setNetBankingEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(true);
  const [codCharge, setCodCharge] = useState(50);
  const [codMaxLimit, setCodMaxLimit] = useState(10000);
  const [storePaymentInfo, setStorePaymentInfo] = useState(true);

  // Shipping Free threshold
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingMin, setFreeShippingMin] = useState(1999);

  // Email Notifications
  const [emailNewOrder, setEmailNewOrder] = useState(true);
  const [emailOrderConfirm, setEmailOrderConfirm] = useState(true);
  const [emailOrderShipped, setEmailOrderShipped] = useState(true);
  const [emailOrderDelivered, setEmailOrderDelivered] = useState(true);
  const [emailOrderCancelled, setEmailOrderCancelled] = useState(true);
  const [emailPaymentFailed, setEmailPaymentFailed] = useState(true);
  const [emailLowStock, setEmailLowStock] = useState(true);

  // SMS Notifications
  const [smsOrderConfirm, setSmsOrderConfirm] = useState(true);
  const [smsShippingUpdate, setSmsShippingUpdate] = useState(true);
  const [smsDeliveryConfirm, setSmsDeliveryConfirm] = useState(true);
  const [smsPaymentAlert, setSmsPaymentAlert] = useState(true);
  const [smsLowStock, setSmsLowStock] = useState(true);
  const [smsNewReview, setSmsNewReview] = useState(true);
  const [smsFailedPayment, setSmsFailedPayment] = useState(true);

  // Email From Metadata
  const [emailFromName, setEmailFromName] = useState('Threadones');
  const [emailFromAddress, setEmailFromAddress] = useState('no-reply@tntclothing.com');
  const [emailReplyTo, setEmailReplyTo] = useState('support@tntclothing.com');

  // Security Toggles
  const [notifyNewLogin, setNotifyNewLogin] = useState(true);
  const [notifySuspiciousLogin, setNotifySuspiciousLogin] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Security: password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Relational data collections
  const [shippingZones, setShippingZones] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modals / forms state for Shipping Zone CRUD
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneRegions, setZoneRegions] = useState('');
  const [zoneStatus, setZoneStatus] = useState('ACTIVE');
  const [zoneDelivery, setZoneDelivery] = useState('2-4 working days');
  const [zoneRates, setZoneRates] = useState([]);
  
  // New rate rules form inside zone modal
  const [newRateWeight, setNewRateWeight] = useState('');
  const [newRateCharge, setNewRateCharge] = useState('');

  // Dirty State Protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Load settings on active tab changes
  useEffect(() => {
    fetchSettingsAndLogs();
  }, [activeTab]);

  const fetchSettingsAndLogs = async () => {
    try {
      setLoading(true);
      const [settingsRes, logsRes, zonesRes, sessionsRes] = await Promise.all([
        adminApi.getSettings(),
        adminApi.getAuditLogs(),
        adminApi.getShippingZones(),
        adminApi.getActiveSessions()
      ]);

      if (settingsRes.success && settingsRes.settings) {
        const s = settingsRes.settings;
        setSiteName(s.siteName || '');
        setSiteEmail(s.siteEmail || '');
        setSitePhone(s.sitePhone || '');
        setCurrency(s.currency || 'INR');
        setLogo(s.logo || '');
        setFavicon(s.favicon || '');
        setTagline(s.tagline || '');
        setBusinessName(s.businessName || '');
        setBusinessType(s.businessType || 'Private Limited');
        setGstin(s.gstin || '');
        setAddress(s.address || '');
        setCity(s.city || '');
        setState(s.state || '');
        setPinCode(s.pinCode || '');
        setCountry(s.country || 'India');
        setMaintenanceMode(s.maintenanceMode ?? false);
        setMaintenanceMessage(s.maintenanceMessage || '');
        setTimezone(s.timezone || 'UTC+05:30');
        setDateFormat(s.dateFormat || 'DD/MM/YYYY');
        setLowStockThreshold(s.lowStockThreshold ?? 5);
        setCancellationWindow(s.cancellationWindow ?? 30);
        setRazorpayKeyId(s.razorpayKeyId || '');
        setRazorpayKeySecret(s.razorpayKeySecret || '');
        setRazorpayEnabled(s.razorpayEnabled ?? true);
        setCardEnabled(s.cardEnabled ?? true);
        setUpiEnabled(s.upiEnabled ?? true);
        setNetBankingEnabled(s.netBankingEnabled ?? true);
        setCodEnabled(s.codEnabled ?? true);
        setCodCharge(s.codCharge ?? 50);
        setCodMaxLimit(s.codMaxLimit ?? 10000);
        setStorePaymentInfo(s.storePaymentInfo ?? true);
        setFreeShippingEnabled(s.freeShippingEnabled ?? true);
        setFreeShippingMin(s.freeShippingMin ?? 1999);
        setEmailNewOrder(s.emailNewOrder ?? true);
        setEmailOrderConfirm(s.emailOrderConfirm ?? true);
        setEmailOrderShipped(s.emailOrderShipped ?? true);
        setEmailOrderDelivered(s.emailOrderDelivered ?? true);
        setEmailOrderCancelled(s.emailOrderCancelled ?? true);
        setEmailPaymentFailed(s.emailPaymentFailed ?? true);
        setEmailLowStock(s.emailLowStock ?? true);
        setSmsOrderConfirm(s.smsOrderConfirm ?? true);
        setSmsShippingUpdate(s.smsShippingUpdate ?? true);
        setSmsDeliveryConfirm(s.smsDeliveryConfirm ?? true);
        setSmsPaymentAlert(s.smsPaymentAlert ?? true);
        setSmsLowStock(s.smsLowStock ?? true);
        setSmsNewReview(s.smsNewReview ?? true);
        setSmsFailedPayment(s.smsFailedPayment ?? true);
        setEmailFromName(s.emailFromName || '');
        setEmailFromAddress(s.emailFromAddress || '');
        setEmailReplyTo(s.emailReplyTo || '');
        setNotifyNewLogin(s.notifyNewLogin ?? true);
        setNotifySuspiciousLogin(s.notifySuspiciousLogin ?? true);
        setSessionTimeout(s.sessionTimeout ?? 30);
        setTwoFactorEnabled(s.twoFactorEnabled ?? false);
      }

      if (logsRes.success && logsRes.logs) {
        setAuditLogs(logsRes.logs);
      }
      
      if (zonesRes.success && zonesRes.zones) {
        setShippingZones(zonesRes.zones);
      }

      if (sessionsRes.success && sessionsRes.sessions) {
        setSessions(sessionsRes.sessions);
      }
      
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    if (!canEdit) {
      toast.error('You do not have permission to modify settings.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        siteName, siteEmail, sitePhone, currency, logo, favicon, tagline,
        businessName, businessType, gstin, address, city, state, pinCode, country,
        maintenanceMode, maintenanceMessage,
        timezone, dateFormat, lowStockThreshold, cancellationWindow,
        razorpayKeyId, razorpayKeySecret, razorpayEnabled,
        cardEnabled, upiEnabled, netBankingEnabled, codEnabled, codCharge, codMaxLimit, storePaymentInfo,
        freeShippingEnabled, freeShippingMin,
        emailNewOrder, emailOrderConfirm, emailOrderShipped, emailOrderDelivered, emailOrderCancelled, emailPaymentFailed, emailLowStock,
        smsOrderConfirm, smsShippingUpdate, smsDeliveryConfirm, smsPaymentAlert, smsLowStock, smsNewReview, smsFailedPayment,
        emailFromName, emailFromAddress, emailReplyTo,
        notifyNewLogin, notifySuspiciousLogin, sessionTimeout, twoFactorEnabled
      };

      const res = await adminApi.updateSettings(payload);
      if (res.success) {
        toast.success('System configurations saved successfully!');
        setIsDirty(false);
        fetchSettingsAndLogs();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  // Image Upload handler for Logo & Favicon
  const handleImageUpload = async (file, type) => {
    if (!file) return;
    if (!canEdit) {
      toast.error('You do not have permission to upload assets.');
      return;
    }
    
    // Validations
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.ico')) {
      toast.error('Invalid file format. Upload PNG, JPG, WEBP, or ICO.');
      return;
    }

    const maxSize = type === 'logo' ? 2 * 1024 * 1024 : 1024 * 1024; // 2MB or 1MB
    if (file.size > maxSize) {
      toast.error(`File size exceeds limit (${type === 'logo' ? '2MB' : '1MB'}).`);
      return;
    }

    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await adminApi.uploadImage(formData);
      if (res.success && res.url) {
        if (type === 'logo') setLogo(res.url);
        if (type === 'favicon') setFavicon(res.url);
        setIsDirty(true);
        toast.success(`${type} uploaded successfully!`, { id: toastId });
      } else {
        throw new Error('Upload response missing URL');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to upload ${type}`, { id: toastId });
    }
  };

  const handleRemoveImage = (type) => {
    if (!canEdit) return;
    if (type === 'logo') setLogo('');
    if (type === 'favicon') setFavicon('');
    setIsDirty(true);
    toast.success(`${type} removed from draft`);
  };

  // Update password API call
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setUpdatingPassword(true);
      const res = await adminApi.changePasswordSettings({ currentPassword, newPassword });
      if (res.success) {
        toast.success('Your account password updated. Logged out other devices.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchSettingsAndLogs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Active Session Revokes
  const handleRevokeSession = async (sessionId) => {
    try {
      const res = await adminApi.revokeSession(sessionId);
      if (res.success) {
        toast.success('Session terminated successfully');
        fetchSettingsAndLogs();
      }
    } catch (err) {
      toast.error('Failed to revoke session');
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (!window.confirm('Are you sure you want to log out of all other devices?')) return;
    try {
      const res = await adminApi.revokeAllOtherSessions();
      if (res.success) {
        toast.success('All other sessions revoked');
        fetchSettingsAndLogs();
      }
    } catch (err) {
      toast.error('Failed to revoke sessions');
    }
  };

  // Shipping Zone Save / Update
  const handleSaveShippingZone = async () => {
    if (!zoneName || !zoneRegions) {
      toast.error('Please enter zone name and regions');
      return;
    }
    
    try {
      const payload = {
        name: zoneName,
        regions: zoneRegions,
        status: zoneStatus,
        estimatedDelivery: zoneDelivery,
        rates: zoneRates
      };

      let res;
      if (editingZoneId) {
        res = await adminApi.updateShippingZone(editingZoneId, payload);
      } else {
        res = await adminApi.createShippingZone(payload);
      }

      if (res.success) {
        toast.success('Shipping zone saved');
        setZoneModalOpen(false);
        fetchSettingsAndLogs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save shipping zone');
    }
  };

  const handleAddRateRule = () => {
    if (!newRateWeight || !newRateCharge) return;
    setZoneRates([
      ...zoneRates,
      {
        id: `temp_${Date.now()}`,
        weightUpper: parseFloat(newRateWeight),
        charge: parseFloat(newRateCharge)
      }
    ]);
    setNewRateWeight('');
    setNewRateCharge('');
  };

  const handleRemoveRateRule = (rateId) => {
    setZoneRates(zoneRates.filter(r => r.id !== rateId));
  };

  const openCreateZoneModal = () => {
    setEditingZoneId(null);
    setZoneName('');
    setZoneRegions('');
    setZoneStatus('ACTIVE');
    setZoneDelivery('2-4 working days');
    setZoneRates([]);
    setZoneModalOpen(true);
  };

  const openEditZoneModal = (zone) => {
    setEditingZoneId(zone.id);
    setZoneName(zone.name);
    setZoneRegions(zone.regions);
    setZoneStatus(zone.status);
    setZoneDelivery(zone.estimatedDelivery);
    setZoneRates(zone.rates);
    setZoneModalOpen(true);
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shipping zone?')) return;
    try {
      const res = await adminApi.deleteShippingZone(id);
      if (res.success) {
        toast.success('Shipping zone deleted');
        fetchSettingsAndLogs();
      }
    } catch (err) {
      toast.error('Failed to delete zone');
    }
  };

  const changeTab = (newTab) => {
    if (isDirty) {
      if (!window.confirm('You have unsaved settings changes. Leave page?')) return;
    }
    navigate(`/admin/settings/${newTab}`);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-muted flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading system configurations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-line pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-muted tracking-wider">
            <Settings className="w-3.5 h-3.5" /> SYSTEM SETTINGS
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-ink mt-1">Configure Enterprise</h1>
          <p className="text-xs text-muted">Configure store appearance, payments, shipping, notifications, and security settings.</p>
        </div>
        {activeTab !== 'security' && (
          <button
            onClick={() => handleSaveSettings()}
            disabled={saving || !canEdit}
            className="px-5 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ink/90 flex items-center gap-2 disabled:opacity-50 transition-all shadow-xs"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> SAVING...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> SAVE SETTINGS
              </>
            )}
          </button>
        )}
      </div>

      {/* Horizontal Tabs Menu */}
      <div className="border-b border-line overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-1">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'store', label: 'Store', icon: Landmark },
            { id: 'payments', label: 'Payments', icon: Key },
            { id: 'shipping', label: 'Shipping', icon: Truck },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => changeTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  active 
                    ? 'border-ink text-ink bg-stone/20 font-black' 
                    : 'border-transparent text-muted hover:text-ink hover:border-line'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Draft Unsaved Alert */}
      {isDirty && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>You have unsaved changes in your settings draft. Please click <strong>Save Settings</strong> to commit them to the database.</span>
        </div>
      )}

      {/* TAB CONTENT PANELS */}
      <div className="space-y-6">
        
        {/* ─── TAB: GENERAL ──────────────────────────────────────── */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 gap-6">
            {/* Store Appearance */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted" /> STORE APPEARANCE
                </h3>
                <p className="text-[10px] text-muted mt-1">Upload brand assets and configure user tagline values.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Store Logo */}
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-ink border border-line rounded-lg flex items-center justify-center p-2 text-paper overflow-hidden relative shadow-inner">
                    {logo ? (
                      <img src={logo} alt="Logo" className="object-contain w-full h-full" />
                    ) : (
                      <span className="font-black text-xs">NO LOGO</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-ink">Store Logo</h4>
                    <p className="text-[10px] text-muted">PNG, JPG (Max 2MB)</p>
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 border border-line text-ink hover:bg-stone text-[10px] font-bold rounded-lg cursor-pointer transition-colors">
                        Change Logo
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e.target.files[0], 'logo')}
                          disabled={!canEdit}
                        />
                      </label>
                      {logo && (
                        <button
                          onClick={() => handleRemoveImage('logo')}
                          className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold rounded-lg transition-colors"
                          disabled={!canEdit}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-ink border border-line rounded-lg flex items-center justify-center p-4 text-paper overflow-hidden relative shadow-inner">
                    {favicon ? (
                      <img src={favicon} alt="Favicon" className="object-contain w-full h-full" />
                    ) : (
                      <span className="font-black text-[10px]">NO FAV</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-ink">Favicon</h4>
                    <p className="text-[10px] text-muted">ICO, PNG (Max 1MB)</p>
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 border border-line text-ink hover:bg-stone text-[10px] font-bold rounded-lg cursor-pointer transition-colors">
                        Change Favicon
                        <input 
                          type="file" 
                          accept="image/png, image/x-icon, image/vnd.microsoft.icon" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e.target.files[0], 'favicon')}
                          disabled={!canEdit}
                        />
                      </label>
                      {favicon && (
                        <button
                          onClick={() => handleRemoveImage('favicon')}
                          className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold rounded-lg transition-colors"
                          disabled={!canEdit}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Store Tagline (Optional)</label>
                <input 
                  type="text" 
                  value={tagline}
                  maxLength={100}
                  onChange={(e) => { setTagline(e.target.value); setIsDirty(true); }}
                  placeholder="Threadones - Wear Your Vibe"
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  disabled={!canEdit}
                />
                <div className="text-[9px] text-muted text-right mt-1">{tagline.length}/100</div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted" /> BUSINESS INFORMATION
                </h3>
                <p className="text-[10px] text-muted mt-1">Configure company tax documents and legal operational address.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Business Name</label>
                  <input 
                    type="text" 
                    value={businessName}
                    onChange={(e) => { setBusinessName(e.target.value); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Business Type</label>
                  <select 
                    value={businessType}
                    onChange={(e) => { setBusinessType(e.target.value); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  >
                    {['Private Limited', 'Public Limited', 'Partnership', 'Proprietorship', 'LLP', 'Other'].map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">GSTIN (Optional)</label>
                  <input 
                    type="text" 
                    value={gstin}
                    onChange={(e) => { setGstin(e.target.value.toUpperCase()); setIsDirty(true); }}
                    placeholder="07AAACT1234Q1ZS"
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-mono font-bold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setIsDirty(true); }}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  disabled={!canEdit}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">City</label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => { setCity(e.target.value); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">State</label>
                  <input 
                    type="text" 
                    value={state}
                    onChange={(e) => { setState(e.target.value); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">PIN Code</label>
                  <input 
                    type="text" 
                    value={pinCode}
                    onChange={(e) => { setPinCode(e.target.value); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Country</label>
                  <select 
                    value={country}
                    onChange={(e) => { setCountry(e.target.value); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Store Status Maintenance */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> STORE STATUS
                </h3>
                <p className="text-[10px] text-muted mt-1">Put the website under construction maintenance mode (restricts storefront checkouts).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
                    <input 
                      type="radio" 
                      name="storeStatus"
                      checked={!maintenanceMode}
                      onChange={() => { setMaintenanceMode(false); setIsDirty(true); }}
                      className="text-ink focus:ring-0"
                      disabled={!canEdit}
                    />
                    <span>Store Open</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
                    <input 
                      type="radio" 
                      name="storeStatus"
                      checked={maintenanceMode}
                      onChange={() => { setMaintenanceMode(true); setIsDirty(true); }}
                      className="text-ink focus:ring-0"
                      disabled={!canEdit}
                    />
                    <span>Maintenance Mode</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Maintenance Message</label>
                  <textarea
                    value={maintenanceMessage}
                    rows={2}
                    onChange={(e) => { setMaintenanceMessage(e.target.value); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  />
                  <p className="text-[9px] text-muted">This message will be shown to customers when Maintenance Mode is active.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: STORE CONFIG ─────────────────────────────────── */}
        {activeTab === 'store' && (
          <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                <Landmark className="w-4 h-4 text-muted" /> STORE LOCALIZATION & OPERATIONAL RULES
              </h3>
              <p className="text-[10px] text-muted mt-1">Configure currencies, dates, timezones, and cancellation rules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Site / Store Title</label>
                <input 
                  type="text" 
                  value={siteName}
                  onChange={(e) => { setSiteName(e.target.value); setIsDirty(true); }}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Store Support Email</label>
                <input 
                  type="email" 
                  value={siteEmail}
                  onChange={(e) => { setSiteEmail(e.target.value); setIsDirty(true); }}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Support Contact Phone</label>
                <input 
                  type="text" 
                  value={sitePhone}
                  onChange={(e) => { setSitePhone(e.target.value); setIsDirty(true); }}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Currency Code</label>
                <select 
                  value={currency}
                  onChange={(e) => { setCurrency(e.target.value); setIsDirty(true); }}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  disabled={!canEdit}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">System Timezone</label>
                <select 
                  value={timezone}
                  onChange={(e) => { setTimezone(e.target.value); setIsDirty(true); }}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  disabled={!canEdit}
                >
                  <option value="UTC+05:30">Kolkata (UTC+05:30)</option>
                  <option value="UTC+00:00">UTC / GMT (UTC+00:00)</option>
                  <option value="UTC-05:00">New York (UTC-05:00)</option>
                  <option value="UTC+01:00">London (UTC+01:00)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Date Output Format</label>
                <select 
                  value={dateFormat}
                  onChange={(e) => { setDateFormat(e.target.value); setIsDirty(true); }}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  disabled={!canEdit}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/12/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/25/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-12-25)</option>
                  <option value="MMM DD, YYYY">MMM DD, YYYY (e.g. Dec 25, 2026)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-line">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Low Stock Warning Alert Threshold</label>
                <input 
                  type="number" 
                  value={lowStockThreshold}
                  min={1}
                  onChange={(e) => { setLowStockThreshold(parseInt(e.target.value)); setIsDirty(true); }}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  disabled={!canEdit}
                />
                <p className="text-[9px] text-muted mt-1">Triggers system alert and sends low stock emails when a variant's stock falls below this number.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Customer Order Auto-Cancellation Window (Minutes)</label>
                <input 
                  type="number" 
                  value={cancellationWindow}
                  min={5}
                  onChange={(e) => { setCancellationWindow(parseInt(e.target.value)); setIsDirty(true); }}
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  disabled={!canEdit}
                />
                <p className="text-[9px] text-muted mt-1">Minutes allowed for customers to cancel confirmed orders before dispatch.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: PAYMENTS ─────────────────────────────────────── */}
        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 gap-6">
            {/* Razorpay Gateway */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted" /> PAYMENT GATEWAYS
                  </h3>
                  <p className="text-[10px] text-muted mt-1">Manage public/secret credentials for online credit & UPI gateways.</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping" />
                  Connected
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Razorpay Key ID</label>
                  <input 
                    type="text" 
                    value={razorpayKeyId}
                    onChange={(e) => { setRazorpayKeyId(e.target.value); setIsDirty(true); }}
                    placeholder="rzp_live_xxxxxxxxxxxxx"
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Razorpay Key Secret</label>
                  <div className="relative">
                    <input 
                      type={showSecret ? 'text' : 'password'} 
                      value={razorpayKeySecret}
                      onChange={(e) => { setRazorpayKeySecret(e.target.value); setIsDirty(true); }}
                      placeholder="••••••••••••••••••••"
                      className="w-full border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink bg-stone focus:outline-none pr-10"
                      disabled={!canEdit}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-2.5 text-muted hover:text-ink"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-line">
                <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={razorpayEnabled}
                    onChange={(e) => { setRazorpayEnabled(e.target.checked); setIsDirty(true); }}
                    className="rounded border-line text-ink focus:ring-0"
                    disabled={!canEdit}
                  />
                  <span>Enable Razorpay Gateway Integrations</span>
                </label>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-muted" /> ALLOWED PAYMENT METHODS
                </h3>
                <p className="text-[10px] text-muted mt-1">Enable or disable specific checkout routes. These limits are validated on server orders.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {[
                  { id: 'card', label: 'Credit / Debit Card', desc: 'Accept all major global credit cards.', state: cardEnabled, setState: setCardEnabled },
                  { id: 'upi', label: 'UPI', desc: 'Accept direct payments via GPay, PhonePe, Paytm.', state: upiEnabled, setState: setUpiEnabled },
                  { id: 'net', label: 'Net Banking', desc: 'Allow direct customer deposits.', state: netBankingEnabled, setState: setNetBankingEnabled },
                  { id: 'cod', label: 'Cash on Delivery (COD)', desc: 'Allow package collection delivery options.', state: codEnabled, setState: setCodEnabled }
                ].map(pm => (
                  <label key={pm.id} className="border border-line rounded-lg p-3 hover:bg-stone/20 flex items-start gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={pm.state}
                      onChange={(e) => { pm.setState(e.target.checked); setIsDirty(true); }}
                      className="rounded border-line text-ink focus:ring-0 mt-0.5"
                      disabled={!canEdit}
                    />
                    <div>
                      <div className="text-xs font-bold text-ink">{pm.label}</div>
                      <div className="text-[10px] text-muted mt-0.5">{pm.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* COD Settings */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-muted" /> CASH ON DELIVERY (COD) PARAMETERS
                </h3>
                <p className="text-[10px] text-muted mt-1">Set fee bounds and transaction limit cap values.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">COD Surcharge Fee (₹)</label>
                  <input 
                    type="number" 
                    value={codCharge}
                    onChange={(e) => { setCodCharge(parseFloat(e.target.value)); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit || !codEnabled}
                  />
                  <p className="text-[9px] text-muted mt-1">Additional charges applied on COD orders.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Maximum Order Value Allowed (₹)</label>
                  <input 
                    type="number" 
                    value={codMaxLimit}
                    onChange={(e) => { setCodMaxLimit(parseFloat(e.target.value)); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit || !codEnabled}
                  />
                  <p className="text-[9px] text-muted mt-1">Block COD if cart total exceeds this value.</p>
                </div>
                <div className="flex items-center pl-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={storePaymentInfo}
                      onChange={(e) => { setStorePaymentInfo(e.target.checked); setIsDirty(true); }}
                      className="rounded border-line text-ink focus:ring-0"
                      disabled={!canEdit}
                    />
                    <div>
                      <div>Store payment token logs</div>
                      <div className="text-[9px] text-muted font-normal">Allows tokenized checkouts for returning customers.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: SHIPPING ─────────────────────────────────────── */}
        {activeTab === 'shipping' && (
          <div className="grid grid-cols-1 gap-6">
            {/* Zones */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-muted" /> SHIPPING ZONES
                  </h3>
                  <p className="text-[10px] text-muted mt-1">Map operational zones with custom regional lists.</p>
                </div>
                <button
                  onClick={openCreateZoneModal}
                  disabled={!canEdit}
                  className="px-3.5 py-1.5 bg-ink text-paper text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1.5 hover:bg-ink/90 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Zone
                </button>
              </div>

              <div className="border border-line rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone border-b border-line font-bold uppercase text-ink">
                    <tr>
                      <th className="p-3">Zone Name</th>
                      <th className="p-3">Regions/Countries</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {shippingZones.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted">No shipping zones configured yet.</td>
                      </tr>
                    ) : (
                      shippingZones.map(zone => (
                        <tr key={zone.id} className="hover:bg-stone/30">
                          <td className="p-3 font-bold text-ink">{zone.name}</td>
                          <td className="p-3 text-muted">{zone.regions}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full tracking-wider ${
                              zone.status === 'ACTIVE' 
                                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' 
                                : 'bg-stone/10 text-muted border border-line'
                            }`}>
                              {zone.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <button
                              onClick={() => openEditZoneModal(zone)}
                              className="p-1 border border-line hover:bg-stone rounded text-ink transition-colors"
                              disabled={!canEdit}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteZone(zone.id)}
                              className="p-1 border border-red-200 text-red-600 hover:bg-red-50 rounded transition-colors"
                              disabled={!canEdit}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Flat Shipping Rules Preview Grid */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted" /> SHIPPING CHARGES INDEX
                </h3>
                <p className="text-[10px] text-muted mt-1">Review weight-based charges configured across different zones.</p>
              </div>

              <div className="border border-line rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone border-b border-line font-bold uppercase text-ink">
                    <tr>
                      <th className="p-3">Zone</th>
                      <th className="p-3">Order Weight</th>
                      <th className="p-3">Shipping Charge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {shippingZones.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-muted">No rules available. Configure zones first.</td>
                      </tr>
                    ) : (
                      shippingZones.flatMap(zone => 
                        zone.rates.map(rate => (
                          <tr key={rate.id} className="hover:bg-stone/30">
                            <td className="p-3 font-bold text-ink">{zone.name}</td>
                            <td className="p-3 text-muted">Up to {rate.weightUpper} kg</td>
                            <td className="p-3 font-bold text-indigo-700">₹{rate.charge}</td>
                          </tr>
                        ))
                      ).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted">No rates defined. Edit a zone to attach weight rates.</td>
                        </tr>
                      ) : (
                        shippingZones.flatMap(zone => 
                          zone.rates.map(rate => (
                            <tr key={rate.id} className="hover:bg-stone/30">
                              <td className="p-3 font-bold text-ink">{zone.name}</td>
                              <td className="p-3 text-muted">Up to {rate.weightUpper} kg</td>
                              <td className="p-3 font-bold text-ink">₹{rate.charge}</td>
                            </tr>
                          ))
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Free Shipping Settings */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted" /> FREE SHIPPING CRITERIA
                </h3>
                <p className="text-[10px] text-muted mt-1">Automatically wipe shipping charges on high-value orders.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="flex items-center">
                  <label className="flex items-center gap-3 text-xs font-bold text-ink cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={freeShippingEnabled}
                      onChange={(e) => { setFreeShippingEnabled(e.target.checked); setIsDirty(true); }}
                      className="rounded border-line text-ink focus:ring-0"
                      disabled={!canEdit}
                    />
                    <div>
                      <div>Enable Free Shipping Threshold</div>
                      <div className="text-[10px] text-muted font-normal mt-0.5">Offer free shipping on orders above a certain amount.</div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Free Shipping Minimum Limit (₹)</label>
                  <input 
                    type="number" 
                    value={freeShippingMin}
                    onChange={(e) => { setFreeShippingMin(parseFloat(e.target.value)); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit || !freeShippingEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Delivery estimates */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted" /> ESTIMATED DELIVERY TIMES
                </h3>
                <p className="text-[10px] text-muted mt-1">Review checkout delivery SLA estimates configured per zone.</p>
              </div>

              <div className="border border-line rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone border-b border-line font-bold uppercase text-ink">
                    <tr>
                      <th className="p-3">Zone</th>
                      <th className="p-3">Estimated Delivery Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {shippingZones.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-muted font-semibold">No estimates available.</td>
                      </tr>
                    ) : (
                      shippingZones.map(zone => (
                        <tr key={zone.id} className="hover:bg-stone/30">
                          <td className="p-3 font-bold text-ink">{zone.name}</td>
                          <td className="p-3 text-muted">{zone.estimatedDelivery}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: NOTIFICATIONS ────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Notifications checklist */}
              <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted" /> EMAIL NOTIFICATIONS
                  </h3>
                  <p className="text-[10px] text-muted mt-1">Toggle triggered emails dispatched to customers and admins.</p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { state: emailNewOrder, setter: setEmailNewOrder, label: 'New Order', desc: 'Send email when a new order is placed.' },
                    { state: emailOrderConfirm, setter: setEmailOrderConfirm, label: 'Order Confirmation', desc: 'Send email to customer when order is placed.' },
                    { state: emailOrderShipped, setter: setEmailOrderShipped, label: 'Order Shipped', desc: 'Send email when order is delivered to courier.' },
                    { state: emailOrderDelivered, setter: setEmailOrderDelivered, label: 'Order Delivered', desc: 'Send email when order is marked delivered.' },
                    { state: emailOrderCancelled, setter: setEmailOrderCancelled, label: 'Order Cancelled', desc: 'Send email when order is cancelled.' },
                    { state: emailPaymentFailed, setter: setEmailPaymentFailed, label: 'Payment Failed', desc: 'Send email when payment fails.' },
                    { state: emailLowStock, setter: setEmailLowStock, label: 'Low Stock Alert', desc: 'Send email for low stock products.' }
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={item.state}
                        onChange={(e) => { item.setter(e.target.checked); setIsDirty(true); }}
                        className="rounded border-line text-ink focus:ring-0 mt-0.5"
                        disabled={!canEdit}
                      />
                      <div>
                        <div className="text-xs font-bold text-ink">{item.label}</div>
                        <div className="text-[10px] text-muted">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted" /> SMS NOTIFICATIONS
                  </h3>
                  <p className="text-[10px] text-muted mt-1">Enable system mobile notifications (if provider active).</p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { state: smsOrderConfirm, setter: setSmsOrderConfirm, label: 'Order Confirmation', desc: 'Send SMS to customer when order is placed.' },
                    { state: smsShippingUpdate, setter: setSmsShippingUpdate, label: 'Shipping Update', desc: 'Send SMS for shipping/courier update.' },
                    { state: smsDeliveryConfirm, setter: setSmsDeliveryConfirm, label: 'Delivery Confirmation', desc: 'Send SMS when order is delivered.' },
                    { state: smsPaymentAlert, setter: setSmsPaymentAlert, label: 'Payment Alert', desc: 'Send SMS for payment-related alerts.' },
                    { state: smsLowStock, setter: setSmsLowStock, label: 'Low Stock', desc: 'Send SMS for low stock.' },
                    { state: smsNewReview, setter: setSmsNewReview, label: 'New Review', desc: 'Send SMS for new reviews.' },
                    { state: smsFailedPayment, setter: setSmsFailedPayment, label: 'Failed Payment', desc: 'Notify via SMS on failed payment.' }
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={item.state}
                        onChange={(e) => { item.setter(e.target.checked); setIsDirty(true); }}
                        className="rounded border-line text-ink focus:ring-0 mt-0.5"
                        disabled={!canEdit}
                      />
                      <div>
                        <div className="text-xs font-bold text-ink">{item.label}</div>
                        <div className="text-[10px] text-muted">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Email From Config */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted" /> EMAIL FROM SETTINGS
                </h3>
                <p className="text-[10px] text-muted mt-1">Define outbound sender credentials for nodemailer mail delivery.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">From Name</label>
                  <input 
                    type="text" 
                    value={emailFromName}
                    onChange={(e) => { setEmailFromName(e.target.value); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">From Email</label>
                  <input 
                    type="email" 
                    value={emailFromAddress}
                    onChange={(e) => { setEmailFromAddress(e.target.value); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Reply To Email</label>
                  <input 
                    type="email" 
                    value={emailReplyTo}
                    onChange={(e) => { setEmailReplyTo(e.target.value); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: SECURITY ─────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Change Password */}
              <form onSubmit={handleUpdatePassword} className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted" /> CHANGE PASSWORD
                  </h3>
                  <p className="text-[10px] text-muted mt-1 font-semibold">Change your password credentials securely.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase mb-1">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      required
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      required
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      required
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ink/90 flex items-center justify-center gap-2"
                >
                  {updatingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </button>
              </form>

              {/* Two-Factor Authentications */}
              <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted" /> TWO-FACTOR AUTHENTICATION (2FA)
                  </h3>
                  <p className="text-[10px] text-muted mt-1 font-semibold">Add an extra layer of security to your account.</p>
                </div>

                <div className="flex justify-between items-center bg-stone p-4 rounded-lg border border-line mt-2">
                  <div>
                    <div className="text-xs font-bold text-ink">Status</div>
                    <div className="text-[10px] text-muted mt-1">2FA is currently <strong className="text-red-600 font-extrabold">Disabled</strong></div>
                  </div>
                  <button
                    onClick={() => {
                      toast('2FA configuration requires setting up Google Authenticator app.', { icon: <Info className="w-4 h-4 text-blue-500" /> });
                    }}
                    className="px-4 py-2 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-lg"
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted" /> ACTIVE SESSIONS
                  </h3>
                  <p className="text-[10px] text-muted mt-1">Manage your active sessions on different devices.</p>
                </div>
                <button
                  onClick={handleRevokeAllOtherSessions}
                  className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                >
                  Logout All Other Sessions
                </button>
              </div>

              <div className="border border-line rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone border-b border-line font-bold uppercase text-ink">
                    <tr>
                      <th className="p-3">Device</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Last Active</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted">No active sessions logs found.</td>
                      </tr>
                    ) : (
                      sessions.map(s => (
                        <tr key={s.id} className="hover:bg-stone/30">
                          <td className="p-3 font-bold text-ink">{s.userAgent || 'Chrome on Windows'}</td>
                          <td className="p-3 text-muted">{s.ipAddress || 'New Delhi, India'}</td>
                          <td className="p-3 text-muted">{new Date(s.createdAt).toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRevokeSession(s.id)}
                              className="px-2.5 py-1.5 border border-line hover:bg-stone rounded text-red-600 font-bold transition-all"
                            >
                              Logout
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Login Security Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted" /> LOGIN SECURITY
                  </h3>
                  <p className="text-[10px] text-muted mt-1">Configure automated alert emails sent during logins.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={notifyNewLogin}
                      onChange={(e) => { setNotifyNewLogin(e.target.checked); setIsDirty(true); }}
                      className="rounded border-line text-ink focus:ring-0 mt-0.5"
                      disabled={!canEdit}
                    />
                    <div>
                      <div className="text-xs font-bold text-ink">Notify me on new login</div>
                      <div className="text-[10px] text-muted">Send email when a new session begins.</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={notifySuspiciousLogin}
                      onChange={(e) => { setNotifySuspiciousLogin(e.target.checked); setIsDirty(true); }}
                      className="rounded border-line text-ink focus:ring-0 mt-0.5"
                      disabled={!canEdit}
                    />
                    <div>
                      <div className="text-xs font-bold text-ink">Notify me on suspicious login</div>
                      <div className="text-[10px] text-muted">Send email on suspicious login attempts.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Session Timeout */}
              <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted" /> SESSION TIMEOUT
                  </h3>
                  <p className="text-[10px] text-muted mt-1">Choose auto-invalidation duration parameters.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Automatically logout inactive sessions after</label>
                  <select 
                    value={sessionTimeout}
                    onChange={(e) => { setSessionTimeout(parseInt(e.target.value)); setIsDirty(true); }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                    disabled={!canEdit}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audit Logs list on security tab */}
            <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-ink tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-700 animate-pulse" /> SYSTEM AUDIT LOGS
                </h3>
                <p className="text-[10px] text-muted mt-1">Review the historical trace of administration settings edits.</p>
              </div>

              <div className="border border-line rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone border-b border-line font-bold uppercase text-ink">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Target Resource</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted">No audit logs available.</td>
                      </tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-stone/30">
                          <td className="p-3 font-bold text-ink">{log.user}</td>
                          <td className="p-3 font-mono font-bold text-indigo-700">{log.action}</td>
                          <td className="p-3">{log.target}</td>
                          <td className="p-3 text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-3 font-mono text-muted">{log.ip}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Settings button for dirty draft states */}
      {activeTab !== 'security' && isDirty && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in shadow-2xl">
          <button
            onClick={() => handleSaveSettings()}
            disabled={saving || !canEdit}
            className="px-6 py-3 bg-ink text-paper text-xs font-black uppercase tracking-widest rounded-full hover:bg-ink/90 flex items-center gap-2 transition-all"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save System Settings
          </button>
        </div>
      )}

      {/* ─── MODAL DIALOG: SHIPPING ZONE CREATION / EDITING ─────── */}
      {zoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="font-extrabold text-sm uppercase text-ink tracking-wider">
                {editingZoneId ? 'Edit Shipping Zone' : 'Create Shipping Zone'}
              </h3>
              <button onClick={() => setZoneModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Zone Name</label>
                <input 
                  type="text" 
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. Local Area"
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Regions / States / Cities (Comma separated)</label>
                <input 
                  type="text" 
                  value={zoneRegions}
                  onChange={(e) => setZoneRegions(e.target.value)}
                  placeholder="e.g. New Delhi, Noida, Gurgaon"
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                />
                <p className="text-[9px] text-muted">Addresses city/state details are scanned against these region substrings during checkout.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Status</label>
                  <select 
                    value={zoneStatus}
                    onChange={(e) => setZoneStatus(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Estimated Delivery SLA Text</label>
                  <input 
                    type="text" 
                    value={zoneDelivery}
                    onChange={(e) => setZoneDelivery(e.target.value)}
                    placeholder="e.g. 2-4 working days"
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              {/* Zone Weight Rates configuration */}
              <div className="pt-2 border-t border-line space-y-2">
                <h4 className="text-[10px] font-extrabold uppercase text-ink tracking-wider">Weight Rates Rules</h4>
                
                {/* Rate creation form row */}
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="Max weight up to (kg)"
                    value={newRateWeight}
                    onChange={(e) => setNewRateWeight(e.target.value)}
                    className="flex-1 border border-line rounded-lg px-3 py-1.5 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  />
                  <input 
                    type="number" 
                    placeholder="Charge (₹)"
                    value={newRateCharge}
                    onChange={(e) => setNewRateCharge(e.target.value)}
                    className="flex-1 border border-line rounded-lg px-3 py-1.5 text-xs font-semibold text-ink bg-stone focus:outline-none"
                  />
                  <button 
                    onClick={handleAddRateRule}
                    className="px-3.5 py-1.5 bg-ink text-paper text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-ink/90 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Rules List */}
                <div className="border border-line rounded-lg max-h-[150px] overflow-y-auto divide-y divide-line">
                  {zoneRates.length === 0 ? (
                    <div className="p-3 text-center text-[10px] text-muted">No rules. Add weight-based rules above.</div>
                  ) : (
                    zoneRates.map(r => (
                      <div key={r.id} className="flex justify-between items-center p-2 text-xs font-semibold text-ink hover:bg-stone/20">
                        <span>Up to {r.weightUpper} kg</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">₹{r.charge}</span>
                          <button onClick={() => handleRemoveRateRule(r.id)} className="text-red-500 hover:text-red-700">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-3">
              <button 
                onClick={() => setZoneModalOpen(false)}
                className="px-4 py-2 border border-line text-ink text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-stone"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveShippingZone}
                className="px-5 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ink/90 transition-all shadow-xs"
              >
                Save Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
