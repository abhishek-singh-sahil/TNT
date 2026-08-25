import { useState, useEffect, useRef } from 'react';
import { adminApi, productApi } from '../../api/services';
import {
  FolderTree, Plus, X, Upload, Loader2, Trash2, Edit, Search,
  Eye, ToggleLeft, ToggleRight, ArrowRight, Package, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
      isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-stone text-muted border-line'
    }`}>
      {status}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminCategories() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingColls, setLoadingColls] = useState(true);

  // Search & Filter
  const [catSearch, setCatSearch] = useState('');
  const [collSearch, setCollSearch] = useState('');

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    showOnHomepage: false,
    displayOrder: 0,
    homepageImage: '',
    bannerImage: '',
    cardImage: '',
    featured: false,
    status: 'ACTIVE'
  });

  // Collection Modal
  const [isCollModalOpen, setIsCollModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [collForm, setCollForm] = useState({
    name: '',
    description: '',
    season: '',
    bannerImage: '',
    status: 'ACTIVE',
    displayOrder: 0,
    productIds: []
  });

  // Product Picker Modal for Collections
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerProducts, setPickerProducts] = useState([]);
  const [loadingPickerProducts, setLoadingPickerProducts] = useState(false);
  const [pickerSelectedIds, setPickerSelectedIds] = useState([]);

  const [uploading, setUploading] = useState(false);

  // ── Fetch Categories ──────────────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await adminApi.getCategories();
      if (res.success && res.categories) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCats(false);
    }
  };

  // ── Fetch Collections ─────────────────────────────────────────────────────
  const fetchCollections = async () => {
    try {
      setLoadingColls(true);
      const res = await adminApi.getCollections();
      if (res.success && res.collections) {
        setCollections(res.collections);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingColls(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCollections();
  }, []);

  // ── Image Upload ──────────────────────────────────────────────────────────
  const handleFileUpload = async (e, formType, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileData = new FormData();
    fileData.append('image', file);

    try {
      setUploading(true);
      const res = await adminApi.uploadImage(fileData);
      if (res.success && res.url) {
        if (formType === 'category') {
          setCatForm(prev => ({ ...prev, [fieldName]: res.url }));
        } else {
          setCollForm(prev => ({ ...prev, [fieldName]: res.url }));
        }
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(res.message || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const handleOpenCatModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCatForm({
        name: cat.name,
        description: cat.description || '',
        showOnHomepage: cat.showOnHomepage || false,
        displayOrder: cat.displayOrder || 0,
        homepageImage: cat.homepageImage || '',
        bannerImage: cat.bannerImage || '',
        cardImage: cat.cardImage || '',
        featured: cat.featured || false,
        status: cat.status || 'ACTIVE'
      });
    } else {
      setEditingCategory(null);
      setCatForm({
        name: '',
        description: '',
        showOnHomepage: false,
        displayOrder: 0,
        homepageImage: '',
        bannerImage: '',
        cardImage: '',
        featured: false,
        status: 'ACTIVE'
      });
    }
    setIsCatModalOpen(true);
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    if (!catForm.name) {
      toast.error('Category name is required');
      return;
    }
    try {
      if (editingCategory) {
        const res = await adminApi.updateCategory(editingCategory.id, catForm);
        if (res.success) {
          toast.success('Category updated!');
          setIsCatModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await adminApi.createCategory(catForm);
        if (res.success) {
          toast.success('Category created!');
          setIsCatModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCat = async (id, name, productCount) => {
    if (productCount > 0) {
      toast.error(`Cannot delete "${name}". Please reassign its ${productCount} products first.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      const res = await adminApi.deleteCategory(id);
      if (res.success) {
        toast.success('Category deleted!');
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  const handleToggleCatStatus = async (cat) => {
    const nextStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await adminApi.updateCategory(cat.id, { ...cat, status: nextStatus });
      if (res.success) {
        toast.success(`Category marked as ${nextStatus}`);
        fetchCategories();
      }
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  // ── Collection CRUD ───────────────────────────────────────────────────────
  const handleOpenCollModal = (coll = null) => {
    if (coll) {
      setEditingCollection(coll);
      setCollForm({
        name: coll.name,
        description: coll.description || '',
        season: coll.season || '',
        bannerImage: coll.bannerImage || '',
        status: coll.status || 'ACTIVE',
        displayOrder: coll.displayOrder || 0,
        productIds: coll.products?.map(p => p.id) || []
      });
      setPickerSelectedIds(coll.products?.map(p => p.id) || []);
    } else {
      setEditingCollection(null);
      setCollForm({
        name: '',
        description: '',
        season: '',
        bannerImage: '',
        status: 'ACTIVE',
        displayOrder: 0,
        productIds: []
      });
      setPickerSelectedIds([]);
    }
    setIsCollModalOpen(true);
  };

  const handleCollSubmit = async (e) => {
    e.preventDefault();
    if (!collForm.name) {
      toast.error('Collection name is required');
      return;
    }
    const payload = { ...collForm, productIds: pickerSelectedIds };
    try {
      if (editingCollection) {
        const res = await adminApi.updateCollection(editingCollection.id, payload);
        if (res.success) {
          toast.success('Collection updated!');
          setIsCollModalOpen(false);
          fetchCollections();
        }
      } else {
        const res = await adminApi.createCollection(payload);
        if (res.success) {
          toast.success('Collection created!');
          setIsCollModalOpen(false);
          fetchCollections();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save collection');
    }
  };

  const handleDeleteColl = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete collection "${name}"? Products inside will not be deleted.`)) return;
    try {
      const res = await adminApi.deleteCollection(id);
      if (res.success) {
        toast.success('Collection deleted!');
        fetchCollections();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete collection');
    }
  };

  const handleToggleCollStatus = async (coll) => {
    const nextStatus = coll.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await adminApi.updateCollection(coll.id, { ...coll, status: nextStatus });
      if (res.success) {
        toast.success(`Collection marked as ${nextStatus}`);
        fetchCollections();
      }
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  // ── Product Picker Search ─────────────────────────────────────────────────
  const fetchPickerProducts = async () => {
    setLoadingPickerProducts(true);
    try {
      const res = await productApi.getProducts({ search: pickerSearch, limit: 10 });
      if (res.success || res.products) {
        setPickerProducts(res.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPickerProducts(false);
    }
  };

  useEffect(() => {
    if (isPickerOpen) {
      const t = setTimeout(fetchPickerProducts, 300);
      return () => clearTimeout(t);
    }
  }, [pickerSearch, isPickerOpen]);

  const toggleProductSelection = (id) => {
    setPickerSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Filtered Tables ───────────────────────────────────────────────────────
  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );
  const filteredColls = collections.filter(c =>
    c.name.toLowerCase().includes(collSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-ink flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-muted" /> Categories & Collections
          </h1>
          <p className="text-xs text-muted mt-0.5">Manage product categories and create collections for better organization</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenCatModal(null)}
            className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-bold rounded-lg hover:bg-ink/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
          <button
            onClick={() => handleOpenCollModal(null)}
            className="flex items-center gap-1.5 px-4 py-2 border border-line text-ink text-xs font-bold rounded-lg hover:bg-stone transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Collection
          </button>
        </div>
      </div>

      {/* ── Main Layout (Side by Side) ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Categories Table Card ─────────────────────────────────── */}
        <div className="bg-paper border border-line rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm text-ink">Categories</h2>
              <span className="bg-stone border border-line px-1.5 py-0.5 rounded text-[9px] font-black text-muted">{categories.length}</span>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search categories..."
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
                className="w-full bg-stone border border-line rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-ink/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingCats ? (
              <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" /></div>
            ) : filteredCats.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted">No categories found.</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-stone/40 text-[10px] text-muted font-bold border-b border-line">
                  <tr>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Products</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 w-16">Sort</th>
                    <th className="px-4 py-2.5 text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredCats.map(c => {
                    const prodCount = c.products?.length || 0;
                    return (
                      <tr key={c.id} className="hover:bg-stone/10">
                        <td className="px-4 py-3 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-stone border border-line overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {c.homepageImage || c.image ? (
                              <img src={c.homepageImage || c.image} alt={c.name} className="w-full h-full object-cover" />
                            ) : <FolderTree className="w-3.5 h-3.5 text-muted" />}
                          </div>
                          <span className="font-extrabold text-ink">{c.name}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink">{prodCount}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleCatStatus(c)} title="Click to toggle">
                            <StatusBadge status={c.status} />
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-muted">{c.displayOrder}</td>
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button onClick={() => handleOpenCatModal(c)} className="p-1 rounded hover:bg-stone text-muted hover:text-ink"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteCat(c.id, c.name, prodCount)} className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── RIGHT: Collections Table & Previews ─────────────────────────── */}
        <div className="space-y-6">
          <div className="bg-paper border border-line rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm text-ink">Collections</h2>
                <span className="bg-stone border border-line px-1.5 py-0.5 rounded text-[9px] font-black text-muted">{collections.length}</span>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={collSearch}
                  onChange={e => setCollSearch(e.target.value)}
                  className="w-full bg-stone border border-line rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-ink/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingColls ? (
                <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" /></div>
              ) : filteredColls.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted">No collections found.</div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone/40 text-[10px] text-muted font-bold border-b border-line">
                    <tr>
                      <th className="px-4 py-2.5">Collection</th>
                      <th className="px-4 py-2.5">Products</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredColls.map(c => {
                      const prodCount = c.products?.length || 0;
                      return (
                        <tr key={c.id} className="hover:bg-stone/10">
                          <td className="px-4 py-3 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-stone border border-line overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {c.bannerImage ? (
                                <img src={c.bannerImage} alt={c.name} className="w-full h-full object-cover" />
                              ) : <ImageIcon className="w-3.5 h-3.5 text-muted" />}
                            </div>
                            <span className="font-extrabold text-ink">{c.name}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-ink">{prodCount}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleToggleCollStatus(c)} title="Click to toggle">
                              <StatusBadge status={c.status} />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                            <button onClick={() => handleOpenCollModal(c)} className="p-1 rounded hover:bg-stone text-muted hover:text-ink"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteColl(c.id, c.name)} className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Collection Preview Card ───────────────────────────────────── */}
          <div className="bg-paper border border-line rounded-2xl shadow-xs p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase text-ink flex items-center gap-1.5"><Eye className="w-4 h-4 text-muted" /> Collection Preview</h3>
              <a href="/collections" target="_blank" className="text-[10px] font-bold uppercase text-ink hover:underline flex items-center gap-0.5">View All <ArrowRight className="w-3 h-3" /></a>
            </div>
            {collections.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">No collections created.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {collections.slice(0, 2).map(c => {
                  const prodCount = c.products?.length || 0;
                  return (
                    <div key={c.id} className="border border-line rounded-xl overflow-hidden hover:border-ink/20 transition-all flex flex-col h-44 bg-stone/20">
                      <div className="h-20 bg-stone border-b border-line overflow-hidden relative">
                        {c.bannerImage ? (
                          <img src={c.bannerImage} alt={c.name} className="w-full h-full object-cover" />
                        ) : <ImageIcon className="w-5 h-5 text-muted m-auto absolute inset-0" />}
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h4 className="font-extrabold text-xs text-ink truncate">{c.name}</h4>
                          <p className="text-[10px] text-muted line-clamp-2 mt-0.5">{c.description || 'No description provided.'}</p>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-bold text-muted uppercase mt-1">
                          <span>{prodCount} Products</span>
                          <span className="text-ink flex items-center gap-0.5">Explore <ArrowRight className="w-2.5 h-2.5" /></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Category Modal ──────────────────────────────────────────────── */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="font-extrabold text-xs uppercase text-ink">{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button onClick={() => setIsCatModalOpen(false)}><X className="w-5 h-5 text-muted" /></button>
            </div>
            <form onSubmit={handleCatSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Category Name *</label>
                <input required value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Description</label>
                <textarea rows={3} value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Sort Order</label>
                  <input type="number" value={catForm.displayOrder} onChange={e => setCatForm({ ...catForm, displayOrder: parseInt(e.target.value) || 0 })} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Status</label>
                  <select value={catForm.status} onChange={e => setCatForm({ ...catForm, status: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Category Thumbnail / Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded border border-line bg-stone flex items-center justify-center overflow-hidden flex-shrink-0">
                    {catForm.homepageImage || catForm.image ? (
                      <img src={catForm.homepageImage || catForm.image} className="w-full h-full object-cover" />
                    ) : <ImageIcon className="w-4 h-4 text-muted" />}
                  </div>
                  <label className="flex-1 border border-dashed border-line rounded-lg p-2.5 text-center cursor-pointer hover:bg-stone text-xs text-muted flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading...' : 'Choose Image File'}
                    <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'category', 'homepageImage')} className="hidden" />
                  </label>
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 flex items-center justify-center gap-2">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Collection Modal ────────────────────────────────────────────── */}
      {isCollModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-line pb-3 flex-shrink-0">
              <h3 className="font-extrabold text-xs uppercase text-ink">{editingCollection ? 'Edit Collection' : 'Create Collection'}</h3>
              <button onClick={() => setIsCollModalOpen(false)}><X className="w-5 h-5 text-muted" /></button>
            </div>
            <form onSubmit={handleCollSubmit} className="space-y-3.5 overflow-y-auto flex-1 py-4 pr-1">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Collection Name *</label>
                <input required value={collForm.name} onChange={e => setCollForm({ ...collForm, name: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Description</label>
                <textarea rows={2} value={collForm.description} onChange={e => setCollForm({ ...collForm, description: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Season / Tagline</label>
                  <input value={collForm.season} onChange={e => setCollForm({ ...collForm, season: e.target.value })} placeholder="e.g. Summer 2026" className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Sort Order</label>
                  <input type="number" value={collForm.displayOrder} onChange={e => setCollForm({ ...collForm, displayOrder: parseInt(e.target.value) || 0 })} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Status</label>
                <select value={collForm.status} onChange={e => setCollForm({ ...collForm, status: e.target.value })} className="w-full border border-line rounded-lg px-3 py-2 text-xs text-ink bg-stone focus:outline-none">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Products ({pickerSelectedIds.length} assigned)</label>
                <button type="button" onClick={() => setIsPickerOpen(true)} className="w-full py-2 border border-line text-ink text-xs font-bold uppercase rounded-lg hover:bg-stone transition-colors flex items-center justify-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Manage Products
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Collection Banner Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded border border-line bg-stone flex items-center justify-center overflow-hidden flex-shrink-0">
                    {collForm.bannerImage ? (
                      <img src={collForm.bannerImage} className="w-full h-full object-cover" />
                    ) : <ImageIcon className="w-4 h-4 text-muted" />}
                  </div>
                  <label className="flex-1 border border-dashed border-line rounded-lg p-2.5 text-center cursor-pointer hover:bg-stone text-xs text-muted flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading...' : 'Choose Image File'}
                    <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'collection', 'bannerImage')} className="hidden" />
                  </label>
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 flex items-center justify-center gap-2 flex-shrink-0">
                {editingCollection ? 'Update Collection' : 'Create Collection'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Product Picker Modal ────────────────────────────────────────── */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col max-h-[80vh] space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3 flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-xs uppercase text-ink">Manage Collection Products</h3>
                <p className="text-[10px] text-muted mt-0.5">{pickerSelectedIds.length} items currently selected</p>
              </div>
              <button onClick={() => setIsPickerOpen(false)}><X className="w-5 h-5 text-muted" /></button>
            </div>
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder="Search products by name..."
                className="w-full border border-line rounded-lg pl-9 pr-3 py-2 text-xs text-ink bg-stone focus:outline-none"
              />
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-line pr-1">
              {loadingPickerProducts ? (
                <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" /></div>
              ) : pickerProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted">Type to search products.</div>
              ) : (
                pickerProducts.map(p => {
                  const isChecked = pickerSelectedIds.includes(p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded bg-stone border border-line overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-ink text-xs truncate">{p.name}</div>
                          <div className="text-[10px] text-muted font-mono">{p.sku}</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProductSelection(p.id)}
                        className="rounded"
                      />
                    </div>
                  );
                })
              )}
            </div>
            <button onClick={() => setIsPickerOpen(false)} className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-ink/90 flex-shrink-0">
              Done Selecting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
