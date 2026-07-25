import { useState, useEffect } from 'react';
import { adminApi } from '../../api/services';
import { FolderTree, Plus, X, Upload, Loader2, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Modal controllers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // When set, indicates editing/CRUD mod

  const [formData, setFormData] = useState({
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCategories();
      if (res.success && res.categories) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleRowClick = (cat) => {
    setEditingCategory(cat);
    setFormData({
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
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileData = new FormData();
    fileData.append('image', file);

    try {
      setUploading(true);
      const res = await adminApi.uploadImage(fileData);
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, [fieldName]: res.url }));
        toast.success('Category photo uploaded successfully!');
      } else {
        toast.error(res.message || 'Image upload failed');
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Category name is required!');
      return;
    }

    try {
      if (editingCategory) {
        // Edit / Update
        const res = await adminApi.updateCategory(editingCategory.id, formData);
        if (res.success) {
          toast.success('Category updated successfully!');
          setIsModalOpen(false);
          setEditingCategory(null);
          fetchCategories();
        }
      } else {
        // Create
        const res = await adminApi.createCategory(formData);
        if (res.success) {
          toast.success('Category created successfully!');
          setIsModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async () => {
    if (!editingCategory) return;
    if (!window.confirm(`Are you sure you want to delete ${editingCategory.name}?`)) return;

    try {
      const res = await adminApi.deleteCategory(editingCategory.id);
      if (res.success) {
        toast.success('Category deleted successfully!');
        setIsModalOpen(false);
        setEditingCategory(null);
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
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
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink">CATEGORIES & TAXONOMY (CRUD)</h1>
          <p className="text-xs text-muted">Click any row below to edit details or delete. Manage layouts, order, and banners.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> ADD CATEGORY
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-paper border border-line rounded-xl p-16 text-center space-y-3">
          <FolderTree className="w-10 h-10 mx-auto text-muted animate-pulse" />
          <span className="font-extrabold text-xs uppercase text-ink block">No Categories Available</span>
          <p className="text-[10px] text-muted max-w-xs mx-auto">Create categories first so you can organize your product drops.</p>
        </div>
      ) : (
        <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left cursor-pointer">
            <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
              <tr>
                <th className="p-4">Homepage Card</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Homepage Placed</th>
                <th className="p-4">Order</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.map((c) => (
                <tr key={c.id} onClick={() => handleRowClick(c)} className="hover:bg-stone/60 transition-colors">
                  <td className="p-4">
                    {c.homepageImage || c.cardImage ? (
                      <img src={c.homepageImage || c.cardImage} alt="" className="w-10 h-10 object-cover rounded border border-line" />
                    ) : (
                      <div className="w-10 h-10 bg-stone rounded border border-line flex items-center justify-center font-mono text-[9px]">NONE</div>
                    )}
                  </td>
                  <td className="p-4 font-extrabold text-ink">{c.name}</td>
                  <td className="p-4 font-mono text-muted">{c.slug}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.showOnHomepage ? 'bg-emerald-50 text-emerald-800' : 'bg-stone text-muted'}`}>
                      {c.showOnHomepage ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-ink">{c.displayOrder}</td>
                  <td className="p-4 text-right font-extrabold text-ink flex justify-end gap-2 items-center">
                    <button type="button" className="p-1 hover:bg-stone rounded text-ink"><Edit className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for both Creation & Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {editingCategory ? `Edit: ${editingCategory.name}` : 'Add Category Taxonomy'}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hoodies"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value || '0') })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide category description details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>

              {/* Checks */}
              <div className="flex items-center gap-4 py-2 border-y border-line">
                <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showOnHomepage}
                    onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
                    className="rounded border-line focus:ring-0"
                  />
                  SHOW ON HOMEPAGE
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded border-line focus:ring-0"
                  />
                  FEATURED CATEGORY
                </label>
              </div>

              {/* Images */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Homepage Image Card</label>
                  <div className="border border-dashed border-line rounded p-3 text-center bg-stone relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'homepageImage')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-5 h-5 mx-auto text-muted mb-1" />
                    <span className="text-[10px] font-bold text-ink block">Upload Card Photo</span>
                  </div>
                  {formData.homepageImage && (
                    <img src={formData.homepageImage} alt="" className="w-16 h-12 object-cover rounded mt-2 border border-line" />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Banner Image</label>
                  <div className="border border-dashed border-line rounded p-3 text-center bg-stone relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'bannerImage')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-5 h-5 mx-auto text-muted mb-1" />
                    <span className="text-[10px] font-bold text-ink block">Upload Banner Photo</span>
                  </div>
                  {formData.bannerImage && (
                    <img src={formData.bannerImage} alt="" className="w-16 h-12 object-cover rounded mt-2 border border-line" />
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-line">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleDeleteCategory}
                    className="px-4 py-3 border border-red-200 text-red-600 rounded text-xs font-bold uppercase hover:bg-red-50 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> DELETE
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCategory ? 'SAVE CATEGORY CHANGES' : 'CREATE TAXONOMY CATEGORY'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
