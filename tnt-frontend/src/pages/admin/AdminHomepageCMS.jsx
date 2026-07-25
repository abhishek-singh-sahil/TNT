import { useState, useEffect } from 'react';
import { cmsApi, adminApi } from '../../api/services';
import { Plus, Trash2, Save, X, Image as ImageIcon, Sparkles, Upload, Loader2, ArrowRight, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminHomepageCMS() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Dynamic CMS Data States
  const [announcementText, setAnnouncementText] = useState('');
  const [heroSlides, setHeroSlides] = useState([]);
  const [trustFeatures, setTrustFeatures] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [brandStory, setBrandStory] = useState({
    heading: '',
    description: '',
    imageUrl: '',
    buttonText: '',
    buttonUrl: ''
  });
  const [instagramPics, setInstagramPics] = useState([]);
  const [whyChooseUs, setWhyChooseUs] = useState([]);

  // Modals Open state
  const [activeModal, setActiveModal] = useState(null); // 'hero', 'trust', 'promotion', 'instagram', 'whyus'

  // Form states with optional id for Edit CRUD
  const [slideForm, setSlideForm] = useState({ id: '', title: '', subtitle: '', image: '', buttonText: 'SHOP NOW', link: '/products' });
  const [trustForm, setTrustForm] = useState({ id: '', icon: 'Truck', title: '', subtitle: '', order: '0' });
  const [promoForm, setPromoForm] = useState({ id: '', title: '', subtitle: '', imageUrl: '', buttonText: 'SHOP NOW', buttonUrl: '/products', couponCode: '', bgColor: '#f5f5f7' });
  const [instaForm, setInstaForm] = useState({ id: '', imageUrl: '', caption: '', link: 'https://instagram.com', order: '0' });
  const [whyForm, setWhyForm] = useState({ id: '', icon: 'Shirt', title: '', subtitle: '', order: '0' });

  const loadCMSData = async () => {
    try {
      setLoading(true);
      const res = await cmsApi.getHomepageData();
      if (res.success && res.data) {
        setAnnouncementText(res.data.announcement || '');
        setHeroSlides(res.data.heroSlides || []);
        setTrustFeatures(res.data.trustFeatures || []);
        setPromotions(res.data.promotions || []);
        if (res.data.brandStory) setBrandStory(res.data.brandStory);
        setInstagramPics(res.data.instagramPics || []);
        setWhyChooseUs(res.data.whyChooseUs || []);
      }
    } catch (err) {
      console.error('Failed to load CMS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCMSData();
  }, []);

  // Handle direct file uploads to server / Cloudinary fallback
  const handleFileUpload = async (e, targetFormSetter, targetFieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const res = await adminApi.uploadImage(formData);
      if (res.success && res.url) {
        targetFormSetter((prev) => ({ ...prev, [targetFieldName]: res.url }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(res.message || 'Image upload failed');
      }
    } catch (err) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Dedicated file upload for Brand Story
  const handleBrandStoryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const res = await adminApi.uploadImage(formData);
      if (res.success && res.url) {
        setBrandStory((prev) => ({ ...prev, imageUrl: res.url }));
        toast.success('Brand story image uploaded!');
      } else {
        toast.error(res.message || 'Image upload failed');
      }
    } catch (err) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePublishAll = async () => {
    try {
      const res = await cmsApi.updateHomepageCMS({
        announcementMessage: announcementText,
        brandStory
      });
      if (res.success) {
        toast.success('Configurations published successfully!');
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to publish changes');
    }
  };

  // CMS Add / Update Operations
  const handleCreateHeroSlide = async (e) => {
    e.preventDefault();
    try {
      const res = await cmsApi.updateHomepageCMS({ heroSlide: slideForm });
      if (res.success) {
        toast.success(slideForm.id ? 'Hero slide updated!' : 'Hero banner slide created successfully!');
        setActiveModal(null);
        setSlideForm({ id: '', title: '', subtitle: '', image: '', buttonText: 'SHOP NOW', link: '/products' });
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save slide');
    }
  };

  const handleCreateTrustFeature = async (e) => {
    e.preventDefault();
    try {
      const res = await cmsApi.updateHomepageCMS({ trustFeature: trustForm });
      if (res.success) {
        toast.success(trustForm.id ? 'Trust feature updated!' : 'Trust feature icon added!');
        setActiveModal(null);
        setTrustForm({ id: '', icon: 'Truck', title: '', subtitle: '', order: '0' });
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save trust feature');
    }
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();
    try {
      const res = await cmsApi.updateHomepageCMS({ promotion: promoForm });
      if (res.success) {
        toast.success(promoForm.id ? 'Promotion updated!' : 'Promotional campaign card added!');
        setActiveModal(null);
        setPromoForm({ id: '', title: '', subtitle: '', imageUrl: '', buttonText: 'SHOP NOW', buttonUrl: '/products', couponCode: '', bgColor: '#f5f5f7' });
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save promotion');
    }
  };

  const handleCreateInstagramPic = async (e) => {
    e.preventDefault();
    try {
      const res = await cmsApi.updateHomepageCMS({ instagramPic: instaForm });
      if (res.success) {
        toast.success(instaForm.id ? 'Social post updated!' : 'Instagram gallery post added!');
        setActiveModal(null);
        setInstaForm({ id: '', imageUrl: '', caption: '', link: 'https://instagram.com', order: '0' });
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save instagram picture');
    }
  };

  const handleCreateWhyChooseUs = async (e) => {
    e.preventDefault();
    try {
      const res = await cmsApi.updateHomepageCMS({ whyChooseUsItem: whyForm });
      if (res.success) {
        toast.success(whyForm.id ? 'Reason updated!' : 'Why Choose Us card added!');
        setActiveModal(null);
        setWhyForm({ id: '', icon: 'Shirt', title: '', subtitle: '', order: '0' });
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save item');
    }
  };

  // CMS Delete Operations
  const handleDeleteSlide = async (id) => {
    if (!window.confirm('Delete this hero banner slide?')) return;
    try {
      const res = await adminApi.deleteHeroBanner(id);
      if (res.success) {
        toast.success('Hero slide deleted successfully');
        setActiveModal(null);
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete slide');
    }
  };

  const handleDeleteTrustFeature = async (id) => {
    if (!window.confirm('Delete this trust feature?')) return;
    try {
      const res = await adminApi.deleteTrustFeature(id);
      if (res.success) {
        toast.success('Trust feature deleted');
        setActiveModal(null);
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete feature');
    }
  };

  const handleDeletePromotion = async (id) => {
    if (!window.confirm('Delete this promotion card?')) return;
    try {
      const res = await adminApi.deletePromotion(id);
      if (res.success) {
        toast.success('Promotion deleted');
        setActiveModal(null);
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete promotion');
    }
  };

  const handleDeleteInstagramPic = async (id) => {
    if (!window.confirm('Delete this social image?')) return;
    try {
      const res = await adminApi.deleteInstagramPic(id);
      if (res.success) {
        toast.success('Instagram photo deleted');
        setActiveModal(null);
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete image');
    }
  };

  const handleDeleteWhyChooseUs = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const res = await adminApi.deleteWhyChooseUs(id);
      if (res.success) {
        toast.success('Why Choose Us item deleted');
        setActiveModal(null);
        loadCMSData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete item');
    }
  };

  // Click row/card load handlers
  const handleEditSlide = (slide) => {
    setSlideForm({
      id: slide.id,
      title: slide.title,
      subtitle: slide.subtitle || '',
      image: slide.image,
      buttonText: slide.buttonText || 'SHOP NOW',
      link: slide.link || '/products'
    });
    setActiveModal('hero');
  };

  const handleEditTrustFeature = (feat) => {
    setTrustForm({
      id: feat.id,
      icon: feat.icon,
      title: feat.title,
      subtitle: feat.subtitle,
      order: String(feat.order || '0')
    });
    setActiveModal('trust');
  };

  const handleEditPromotion = (promo) => {
    setPromoForm({
      id: promo.id,
      title: promo.title,
      subtitle: promo.subtitle || '',
      imageUrl: promo.imageUrl || '',
      buttonText: promo.buttonText || 'SHOP NOW',
      buttonUrl: promo.buttonUrl || '/products',
      couponCode: promo.couponCode || '',
      bgColor: promo.bgColor || '#f5f5f7'
    });
    setActiveModal('promotion');
  };

  const handleEditInstagramPic = (pic) => {
    setInstaForm({
      id: pic.id,
      imageUrl: pic.imageUrl,
      caption: pic.caption || '',
      link: pic.link || 'https://instagram.com',
      order: String(pic.order || '0')
    });
    setActiveModal('instagram');
  };

  const handleEditWhyChooseUs = (item) => {
    setWhyForm({
      id: item.id,
      icon: item.icon,
      title: item.title,
      subtitle: item.subtitle,
      order: String(item.order || '0')
    });
    setActiveModal('whyus');
  };

  // Add click openers
  const openAddHero = () => {
    setSlideForm({ id: '', title: '', subtitle: '', image: '', buttonText: 'SHOP NOW', link: '/products' });
    setActiveModal('hero');
  };

  const openAddTrust = () => {
    setTrustForm({ id: '', icon: 'Truck', title: '', subtitle: '', order: '0' });
    setActiveModal('trust');
  };

  const openAddPromotion = () => {
    setPromoForm({ id: '', title: '', subtitle: '', imageUrl: '', buttonText: 'SHOP NOW', buttonUrl: '/products', couponCode: '', bgColor: '#f5f5f7' });
    setActiveModal('promotion');
  };

  const openAddInsta = () => {
    setInstaForm({ id: '', imageUrl: '', caption: '', link: 'https://instagram.com', order: '0' });
    setActiveModal('instagram');
  };

  const openAddWhyUs = () => {
    setWhyForm({ id: '', icon: 'Shirt', title: '', subtitle: '', order: '0' });
    setActiveModal('whyus');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink">HOMEPAGE DYNAMIC CMS PANEL</h1>
          <p className="text-xs text-muted font-semibold">Click any row, card, or element below to open edit controls (Full CRUD setup).</p>
        </div>
        <button
          onClick={handlePublishAll}
          className="px-5 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 flex items-center gap-2 shadow-sm"
        >
          <Save className="w-4 h-4" /> PUBLISH CHANGES
        </button>
      </div>

      {/* 1. Announcement Bar */}
      <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-3">
        <span className="font-extrabold text-[10px] uppercase text-muted tracking-wider block">Top Announcement strip message</span>
        <input
          type="text"
          value={announcementText}
          onChange={(e) => setAnnouncementText(e.target.value)}
          placeholder="e.g. FREE SHIPPING ON ALL ORDERS ABOVE ₹1999"
          className="w-full border border-line rounded px-3 py-2.5 text-xs text-ink bg-stone focus:outline-none"
        />
      </div>

      {/* 2. Hero Banners Carousel */}
      <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-line pb-3">
          <span className="font-extrabold text-[10px] uppercase text-muted tracking-wider">Hero Banner Slides (Click row to edit)</span>
          <button onClick={openAddHero} className="px-3 py-1.5 bg-stone border border-line rounded text-[10px] font-bold uppercase text-ink hover:bg-paper">
            + Add Hero Banner
          </button>
        </div>
        {heroSlides.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">No slides registered. Hero section will be hidden on homepage.</p>
        ) : (
          <div className="space-y-3">
            {heroSlides.map((slide) => (
              <div
                key={slide.id}
                onClick={() => handleEditSlide(slide)}
                className="p-3.5 bg-stone border border-line rounded-lg flex items-center justify-between gap-4 cursor-pointer hover:bg-stone/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img src={slide.image} alt="" className="w-20 h-14 object-cover rounded border border-line" />
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-ink block truncate">{slide.title}</span>
                    <span className="text-[10px] text-muted block truncate">{slide.subtitle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="p-1 hover:bg-stone rounded text-ink"><Edit className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Trust Strip Icons */}
      <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-line pb-3">
          <span className="font-extrabold text-[10px] uppercase text-muted tracking-wider">Trust Features strip (Click card to edit)</span>
          <button onClick={openAddTrust} className="px-3 py-1.5 bg-stone border border-line rounded text-[10px] font-bold uppercase text-ink hover:bg-paper">
            + Add Feature
          </button>
        </div>
        {trustFeatures.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">No trust features configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trustFeatures.map((feat) => (
              <div
                key={feat.id}
                onClick={() => handleEditTrustFeature(feat)}
                className="p-3 bg-stone border border-line rounded-lg flex justify-between items-center cursor-pointer hover:bg-stone/85 transition-colors"
              >
                <div>
                  <span className="font-bold text-xs text-ink block">{feat.title}</span>
                  <span className="text-[10px] text-muted block">{feat.subtitle} (Icon: {feat.icon})</span>
                </div>
                <Edit className="w-3.5 h-3.5 text-muted" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Brand Story Section */}
      <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
        <span className="font-extrabold text-[10px] uppercase text-muted tracking-wider block">Brand Story Section</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold uppercase text-muted mb-1">Story Heading</label>
              <input
                type="text"
                value={brandStory.heading}
                onChange={(e) => setBrandStory({ ...brandStory, heading: e.target.value })}
                className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-muted mb-1">Description</label>
              <textarea
                rows={3}
                value={brandStory.description}
                onChange={(e) => setBrandStory({ ...brandStory, description: e.target.value })}
                className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="block text-[9px] font-bold uppercase text-muted mb-1">Direct Model Photo Upload</label>
            <div className="border-2 border-dashed border-line rounded-lg p-6 text-center space-y-2 relative bg-stone hover:bg-stone/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleBrandStoryUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 mx-auto text-muted" />
              <span className="text-xs font-semibold text-ink block">Click to upload story photo</span>
              <p className="text-[10px] text-muted">Saves directly to Cloudinary fallback folder</p>
            </div>
            {brandStory.imageUrl && (
              <div className="flex items-center gap-2 border border-line p-2 rounded bg-paper">
                <img src={brandStory.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
                <span className="text-[10px] font-mono text-muted truncate flex-1">{brandStory.imageUrl}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Promotional Cards */}
      <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-line pb-3">
          <span className="font-extrabold text-[10px] uppercase text-muted tracking-wider">Promotional Cards (Click card to edit)</span>
          <button onClick={openAddPromotion} className="px-3 py-1.5 bg-stone border border-line rounded text-[10px] font-bold uppercase text-ink hover:bg-paper">
            + Add Promotion Card
          </button>
        </div>
        {promotions.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">No promotional campaign cards active.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                onClick={() => handleEditPromotion(promo)}
                className="p-4 bg-stone border border-line rounded-lg flex justify-between items-start cursor-pointer hover:bg-stone/85 transition-colors"
              >
                <div className="space-y-1">
                  <span className="font-extrabold text-sm text-ink block">{promo.title}</span>
                  <span className="text-[10px] text-muted block">{promo.subtitle}</span>
                </div>
                <Edit className="w-4 h-4 text-muted" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Instagram Gallery */}
      <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-line pb-3">
          <span className="font-extrabold text-[10px] uppercase text-muted tracking-wider">Instagram Feed Grid (Click thumbnail to edit)</span>
          <button onClick={openAddInsta} className="px-3 py-1.5 bg-stone border border-line rounded text-[10px] font-bold uppercase text-ink hover:bg-paper">
            + Add Social Post
          </button>
        </div>
        {instagramPics.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">No social grid items installed.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {instagramPics.map((pic) => (
              <div
                key={pic.id}
                onClick={() => handleEditInstagramPic(pic)}
                className="relative aspect-square border border-line rounded overflow-hidden cursor-pointer group bg-stone hover:border-ink transition-colors"
              >
                <img src={pic.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-paper transition-opacity">
                  <Edit className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Why Choose Us */}
      <div className="bg-paper border border-line rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-line pb-3">
          <span className="font-extrabold text-[10px] uppercase text-muted tracking-wider">Why Choose Us Items (Click to edit)</span>
          <button onClick={openAddWhyUs} className="px-3 py-1.5 bg-stone border border-line rounded text-[10px] font-bold uppercase text-ink hover:bg-paper">
            + Add Reason Card
          </button>
        </div>
        {whyChooseUs.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">No items configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {whyChooseUs.map((item) => (
              <div
                key={item.id}
                onClick={() => handleEditWhyChooseUs(item)}
                className="p-3 bg-stone border border-line rounded-lg flex justify-between items-center cursor-pointer hover:bg-stone/85 transition-colors"
              >
                <div>
                  <span className="font-bold text-xs text-ink block">{item.title}</span>
                  <span className="text-[10px] text-muted block">{item.subtitle} (Icon: {item.icon})</span>
                </div>
                <Edit className="w-3.5 h-3.5 text-muted" />
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Modals for creation and modification */}

      {/* A. Hero slide creator/editor modal */}
      {activeModal === 'hero' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {slideForm.id ? 'Edit Hero Banner Slide' : 'Add Hero Slide Banner'}
              </span>
              <button onClick={() => setActiveModal(null)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateHeroSlide} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Slide Title</label>
                <input
                  type="text"
                  required
                  value={slideForm.title}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Subtitle</label>
                <input
                  type="text"
                  value={slideForm.subtitle}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              
              {/* Direct image upload box */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Direct Model Photo Upload</label>
                <div className="border border-dashed border-line rounded p-4 text-center bg-stone space-y-2 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setSlideForm, 'image')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 mx-auto text-muted" />
                  <span className="text-[11px] font-bold text-ink block">Choose image file</span>
                </div>
                {slideForm.image && (
                  <div className="mt-2 flex items-center gap-2 border border-line p-1.5 rounded bg-paper">
                    <img src={slideForm.image} alt="" className="w-8 h-8 object-cover rounded" />
                    <span className="text-[9px] font-mono text-muted truncate flex-1">{slideForm.image}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Button Text</label>
                  <input
                    type="text"
                    value={slideForm.buttonText}
                    onChange={(e) => setSlideForm({ ...slideForm, buttonText: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Link URL</label>
                  <input
                    type="text"
                    value={slideForm.link}
                    onChange={(e) => setSlideForm({ ...slideForm, link: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2 border-t border-line">
                {slideForm.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(slideForm.id)}
                    className="px-4 py-3 border border-red-200 text-red-600 rounded text-xs font-bold uppercase hover:bg-red-50"
                  >
                    DELETE
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-ink text-paper text-xs font-bold uppercase rounded flex items-center justify-center gap-2"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {slideForm.id ? 'SAVE HERO BANNER' : 'CREATE HERO BANNER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Trust features modal */}
      {activeModal === 'trust' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {trustForm.id ? 'Edit Trust Feature' : 'Add Trust Indicator Icon'}
              </span>
              <button onClick={() => setActiveModal(null)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTrustFeature} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Select Lucide Icon Name</label>
                <input
                  type="text"
                  required
                  value={trustForm.icon}
                  onChange={(e) => setTrustForm({ ...trustForm, icon: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Headline Title</label>
                <input
                  type="text"
                  required
                  value={trustForm.title}
                  onChange={(e) => setTrustForm({ ...trustForm, title: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Subtitle text</label>
                <input
                  type="text"
                  required
                  value={trustForm.subtitle}
                  onChange={(e) => setTrustForm({ ...trustForm, subtitle: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              
              <div className="flex gap-3 pt-2 border-t border-line">
                {trustForm.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTrustFeature(trustForm.id)}
                    className="px-4 py-3 border border-red-200 text-red-600 rounded text-xs font-bold uppercase hover:bg-red-50"
                  >
                    DELETE
                  </button>
                )}
                <button type="submit" className="flex-1 py-3 bg-ink text-paper text-xs font-bold uppercase rounded">
                  {trustForm.id ? 'SAVE CHANGES' : 'ADD TRUST FEATURE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. Promotion modal */}
      {activeModal === 'promotion' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {promoForm.id ? 'Edit Promo Card' : 'Add Promo Card'}
              </span>
              <button onClick={() => setActiveModal(null)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePromotion} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Campaign Headline Title</label>
                <input
                  type="text"
                  required
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Campaign Subtitle</label>
                <input
                  type="text"
                  required
                  value={promoForm.subtitle}
                  onChange={(e) => setPromoForm({ ...promoForm, subtitle: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              
              {/* Direct image uploader for promotion */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Card Image Photo Upload</label>
                <div className="border border-dashed border-line rounded p-4 text-center bg-stone space-y-2 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setPromoForm, 'imageUrl')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 mx-auto text-muted" />
                  <span className="text-[11px] font-bold text-ink block">Choose image file</span>
                </div>
                {promoForm.imageUrl && (
                  <div className="mt-2 flex items-center gap-2 border border-line p-1.5 rounded bg-paper">
                    <img src={promoForm.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                    <span className="text-[9px] font-mono text-muted truncate flex-1">{promoForm.imageUrl}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Promo Coupon Code (Optional)</label>
                <input
                  type="text"
                  value={promoForm.couponCode}
                  onChange={(e) => setPromoForm({ ...promoForm, couponCode: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              
              <div className="flex gap-3 pt-2 border-t border-line">
                {promoForm.id && (
                  <button
                    type="button"
                    onClick={() => handleDeletePromotion(promoForm.id)}
                    className="px-4 py-3 border border-red-200 text-red-600 rounded text-xs font-bold uppercase hover:bg-red-50"
                  >
                    DELETE
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-ink text-paper text-xs font-bold uppercase rounded flex items-center justify-center gap-2"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {promoForm.id ? 'SAVE PROMOTION' : 'ADD PROMOTION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. Instagram modal */}
      {activeModal === 'instagram' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {instaForm.id ? 'Edit Social Post' : 'Add Instagram Photo'}
              </span>
              <button onClick={() => setActiveModal(null)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInstagramPic} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Photo Upload</label>
                <div className="border border-dashed border-line rounded p-4 text-center bg-stone space-y-2 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setInstaForm, 'imageUrl')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 mx-auto text-muted" />
                  <span className="text-[11px] font-bold text-ink block">Choose image file</span>
                </div>
                {instaForm.imageUrl && (
                  <div className="mt-2 flex items-center gap-2 border border-line p-1.5 rounded bg-paper">
                    <img src={instaForm.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                    <span className="text-[9px] font-mono text-muted truncate flex-1">{instaForm.imageUrl}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Caption / Details</label>
                <input
                  type="text"
                  value={instaForm.caption}
                  onChange={(e) => setInstaForm({ ...instaForm, caption: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              
              <div className="flex gap-3 pt-2 border-t border-line">
                {instaForm.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteInstagramPic(instaForm.id)}
                    className="px-4 py-3 border border-red-200 text-red-600 rounded text-xs font-bold uppercase hover:bg-red-50"
                  >
                    DELETE
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-ink text-paper text-xs font-bold uppercase rounded flex items-center justify-center gap-2"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {instaForm.id ? 'SAVE CHANGES' : 'ADD SOCIAL POST'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. Why Choose Us modal */}
      {activeModal === 'whyus' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {whyForm.id ? 'Edit Reason Card' : 'Add Reason Card'}
              </span>
              <button onClick={() => setActiveModal(null)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWhyChooseUs} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Select Lucide Icon Name</label>
                <input
                  type="text"
                  required
                  value={whyForm.icon}
                  onChange={(e) => setWhyForm({ ...whyForm, icon: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Headline Title</label>
                <input
                  type="text"
                  required
                  value={whyForm.title}
                  onChange={(e) => setWhyForm({ ...whyForm, title: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Subtitle description</label>
                <input
                  type="text"
                  required
                  value={whyForm.subtitle}
                  onChange={(e) => setWhyForm({ ...whyForm, subtitle: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              
              <div className="flex gap-3 pt-2 border-t border-line">
                {whyForm.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteWhyChooseUs(whyForm.id)}
                    className="px-4 py-3 border border-red-200 text-red-600 rounded text-xs font-bold uppercase hover:bg-red-50"
                  >
                    DELETE
                  </button>
                )}
                <button type="submit" className="flex-1 py-3 bg-ink text-paper text-xs font-bold uppercase rounded">
                  {whyForm.id ? 'SAVE CHANGES' : 'ADD REASON'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
