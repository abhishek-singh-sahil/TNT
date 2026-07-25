import { useState, useEffect } from 'react';
import { productApi, adminApi } from '../../api/services';
import { Search, Plus, Trash2, X, PackageOpen, ImageIcon, Upload, Loader2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPickerModal from '../../components/common/MediaPickerModal';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // When set, we are editing

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    basePrice: '',
    discountPrice: '',
    fit: 'Oversized Fit',
    washCare: 'Machine wash cold with like colors',
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
    isLimited: false,
    categoryIds: [],
    genderMen: false,
    genderWomen: false,
    isAccessories: false,
    collectionId: '',
    images: [],
    variants: []
  });

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [newColor, setNewColor] = useState({ name: '', hex: '#000000' });
  const [activeVariantColorIndex, setActiveVariantColorIndex] = useState(null);
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, colorRes, collRes] = await Promise.all([
        productApi.getProducts({ limit: 100 }),
        adminApi.getCategories(),
        productApi.getColors(),
        productApi.getCollections()
      ]);

      if (prodRes.success && prodRes.products) setProducts(prodRes.products);
      if (catRes.success && catRes.categories) setCategories(catRes.categories);
      if (colorRes.success && colorRes.colors) setColors(colorRes.colors);
      if (collRes.success && collRes.collections) setCollections(collRes.collections);
    } catch (err) {
      console.error('Failed to load catalog metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRowClick = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      description: prod.description || '',
      basePrice: prod.basePrice || '',
      discountPrice: prod.discountPrice || '',
      fit: prod.fit || 'Oversized Fit',
      washCare: prod.washCare || 'Machine wash cold with like colors',
      isFeatured: prod.isFeatured || false,
      isNewArrival: prod.isNewArrival || false,
      isBestSeller: prod.isBestSeller || false,
      isLimited: prod.isLimited || false,
      categoryIds: prod.categories?.map(c => c.id) || [],
      genderMen: prod.genderMen || false,
      genderWomen: prod.genderWomen || false,
      isAccessories: prod.isAccessories || false,
      collectionId: prod.collectionId || '',
      images: prod.images?.map(img => img.url) || [],
      variants: prod.variants?.map(v => ({
        colorId: v.color?.id || '',
        colorName: v.color?.name || '',
        colorHex: v.color?.hexCode || '',
        sizeName: v.size?.name || 'M',
        sku: v.sku,
        price: v.price || '',
        stock: v.stock || '50'
      })) || []
    });
    setCreateModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      for (const file of files) {
        const fileData = new FormData();
        fileData.append('image', file);
        const res = await adminApi.uploadImage(fileData);
        if (res.success && res.url) {
          setFormData((prev) => ({ ...prev, images: [...prev.images, res.url] }));
        }
      }
      toast.success('Images uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload one or more images');
    } finally {
      setUploading(false);
    }
  };

  const handleAddColorPicker = async () => {
    if (!newColor.name) {
      toast.error('Please enter a name for the color');
      return;
    }
    try {
      setUploading(true);
      const res = await adminApi.createColor({ name: newColor.name, hexCode: newColor.hex });
      if (res.success && res.color) {
        setColors((prev) => [...prev, res.color]);
        setNewColor({ name: '', hex: '#000000' });
        setColorPickerOpen(false);
        toast.success('Custom color registered persistently in database!');

        // Auto-select this color for the specific variant row that requested color creation
        if (activeVariantColorIndex !== null) {
          handleVariantChange(activeVariantColorIndex, 'colorId', res.color.id);
          setActiveVariantColorIndex(null);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save color in database');
    } finally {
      setUploading(false);
    }
  };

  const handleAddCollection = async () => {
    if (!newCollectionName) {
      toast.error('Please enter a name for the collection');
      return;
    }
    try {
      setUploading(true);
      const res = await adminApi.createCollection({ name: newCollectionName });
      if (res.success && res.collection) {
        setCollections((prev) => [res.collection, ...prev]);
        setFormData((prev) => ({ ...prev, collectionId: res.collection.id }));
        setNewCollectionName('');
        setCollectionPickerOpen(false);
        toast.success('Collection created successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create collection');
    } finally {
      setUploading(false);
    }
  };

  const handleAddVariantRow = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          colorId: '',
          colorName: '',
          colorHex: '',
          sizeName: 'M',
          sku: `${formData.sku}-${prev.variants.length + 1}`,
          price: formData.basePrice || '',
          stock: '50'
        }
      ]
    }));
  };

  const handleRemoveVariantRow = (idx) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx)
    }));
  };

  const handleVariantChange = (idx, field, val) => {
    const updated = [...formData.variants];
    updated[idx][field] = val;

    if (field === 'colorId') {
      const selected = colors.find(c => c.id === val);
      if (selected) {
        updated[idx].colorName = selected.name;
        updated[idx].colorHex = selected.hexCode;
      }
    }
    setFormData((prev) => ({ ...prev, variants: updated }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.basePrice) {
      toast.error('Please fill all required fields');
      return;
    }

    // MANDATORY VALIDATIONS
    if (formData.categoryIds.length === 0) {
      toast.error('At least one category selection is mandatory!');
      return;
    }
    if (formData.variants.length === 0) {
      toast.error('At least one product variant/color row is mandatory!');
      return;
    }
    const hasInvalidVariant = formData.variants.some(v => !v.colorId && !v.colorName);
    if (hasInvalidVariant) {
      toast.error('Selecting a color is mandatory for all variants!');
      return;
    }

    try {
      if (editingProduct) {
        const res = await productApi.updateProduct(editingProduct.id, formData);
        if (res.success) {
          toast.success('Product updated successfully!');
          setCreateModalOpen(false);
          setEditingProduct(null);
          loadData();
        }
      } else {
        const res = await productApi.createProduct(formData);
        if (res.success) {
          toast.success('Product created successfully!');
          setCreateModalOpen(false);
          loadData();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    if (!window.confirm(`Are you sure you want to delete ${editingProduct.name} from the database?`)) return;

    try {
      const res = await productApi.deleteProduct(editingProduct.id);
      if (res.success) {
        toast.success('Product deleted successfully');
        setCreateModalOpen(false);
        setEditingProduct(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      basePrice: '',
      discountPrice: '',
      fit: 'Oversized Fit',
      washCare: 'Machine wash cold with like colors',
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      isLimited: false,
      categoryIds: [],
      genderMen: false,
      genderWomen: false,
      isAccessories: false,
      collectionId: '',
      images: [],
      variants: []
    });
    setCreateModalOpen(true);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink">PRODUCT CATALOG MANAGEMENT (CRUD)</h1>
          <p className="text-xs text-muted">Click any row below to edit details, add images, select category checkboxes, and update variants.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> NEW PRODUCT
        </button>
      </div>

      {/* Search & Stats bar */}
      <div className="flex items-center justify-between bg-paper p-4 border border-line rounded-xl">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search products by SKU or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone border border-line rounded-lg text-xs font-semibold text-ink focus:outline-none"
          />
        </div>
        <span className="text-xs text-muted font-bold">Total Products: {filteredProducts.length}</span>
      </div>

      {/* Products list Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-paper border border-line rounded-xl p-16 text-center space-y-3">
          <PackageOpen className="w-10 h-10 mx-auto text-muted" />
          <span className="font-extrabold text-xs uppercase text-ink block">No Products Found</span>
        </div>
      ) : (
        <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left cursor-pointer">
            <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
              <tr>
                <th className="p-4">Product Details</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Categories</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Price</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredProducts.map((p) => (
                <tr key={p.id} onClick={() => handleRowClick(p)} className="hover:bg-stone/60 transition-colors">
                  <td className="p-4 font-extrabold text-ink flex items-center gap-3">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt="" className="w-8 h-8 object-cover rounded border border-line" />
                    ) : (
                      <div className="w-8 h-8 bg-stone rounded flex items-center justify-center border border-line">
                        <ImageIcon className="w-4 h-4 text-muted" />
                      </div>
                    )}
                    <span>{p.name}</span>
                  </td>
                  <td className="p-4 font-mono text-muted">{p.sku}</td>
                  <td className="p-4 truncate max-w-[150px]">
                    {p.categories?.map(c => c.name).join(', ') || 'Uncategorized'}
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold text-ink">
                      {[p.genderMen && 'Men', p.genderWomen && 'Women'].filter(Boolean).join(' / ') || 'Unisex'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-ink">₹{(p.basePrice ?? 0).toLocaleString()}</td>
                  <td className="p-4 text-right flex justify-end gap-2 items-center">
                    <button type="button" className="p-1 hover:bg-stone rounded text-ink"><Edit className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation/Editing Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add Catalog Product Drop'}
              </span>
              <button onClick={() => setCreateModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Row 1: Name & SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Classic Heavyweight Tee"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Base SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TNT-TEE-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Price, Gender & Categories (Checkboxes) */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Base Price (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="1499"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Gender / Accessories</label>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.genderMen}
                        onChange={(e) => setFormData({ ...formData, genderMen: e.target.checked })}
                      />
                      Men
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.genderWomen}
                        onChange={(e) => setFormData({ ...formData, genderWomen: e.target.checked })}
                      />
                      Women
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isAccessories}
                        onChange={(e) => setFormData({ ...formData, isAccessories: e.target.checked })}
                      />
                      Accessories
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Select Categories * (Mandatory)</label>
                  <div className="grid grid-cols-2 gap-2 border border-line rounded p-2 bg-stone max-h-[100px] overflow-y-auto">
                    {categories.map((c) => {
                      const isChecked = formData.categoryIds.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updated = isChecked
                                ? formData.categoryIds.filter((id) => id !== c.id)
                                : [...formData.categoryIds, c.id];
                              setFormData({ ...formData, categoryIds: updated });
                            }}
                            className="rounded border-line focus:ring-0"
                          />
                          {c.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row: Collection Selector & Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1 font-semibold">Select Collection</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.collectionId}
                      onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                      className="flex-1 border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                    >
                      <option value="">No Collection</option>
                      {collections.map((coll) => (
                        <option key={coll.id} value={coll.id}>{coll.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setCollectionPickerOpen(true)}
                      className="px-3 py-2 bg-stone border border-line rounded text-xs font-bold text-ink hover:bg-stone/85"
                    >
                      + Create
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1.5 font-semibold">Product Badges / Flags</label>
                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isNewArrival}
                        onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                      />
                      New Arrival
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      />
                      Featured Product
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isBestSeller}
                        onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                      />
                      Best Seller
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isLimited}
                        onChange={(e) => setFormData({ ...formData, isLimited: e.target.checked })}
                      />
                      Limited Edition
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 3: Product Description details */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Enter details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-line rounded px-3 py-2 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>

              {/* Row 4: Image Uploaders */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-2">Upload Product Images (Direct Upload)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border-2 border-dashed border-line rounded-lg p-4 text-center relative bg-stone hover:bg-stone/50 transition-colors flex flex-col justify-center items-center h-28">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-5 h-5 text-muted mb-1" />
                    <span className="text-[10px] font-bold text-ink">Choose files</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMediaPickerOpen(true)}
                    className="border-2 border-dashed border-line rounded-lg p-4 text-center bg-stone hover:bg-stone/50 transition-colors flex flex-col justify-center items-center h-28 cursor-pointer"
                  >
                    <span className="text-xl">🖼️</span>
                    <span className="text-[10px] font-bold text-ink mt-1">From Library</span>
                  </button>
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative rounded overflow-hidden border border-line h-28 bg-stone">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })}
                        className="absolute top-1 right-1 bg-paper/95 p-1 rounded text-red-600 border border-line"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 5: Dynamic Color Variants Matrix */}
              <div className="border-t border-line pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[10px] uppercase text-muted tracking-wider">Multi-Color Variants * (Mandatory)</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="px-2.5 py-1 bg-ink text-paper rounded text-[9px] font-bold uppercase"
                    >
                      + Add Variant Row
                    </button>
                  </div>
                </div>

                {formData.variants.length === 0 ? (
                  <p className="text-xs text-muted">No variants created yet. Clicking add variant row compiles sizes & custom colors.</p>
                ) : (
                  <div className="space-y-2">
                    {formData.variants.map((variant, idx) => (
                      <div key={idx} className="grid grid-cols-6 gap-2 bg-stone/50 p-2.5 rounded-lg border border-line items-center">
                        <div>
                          <label className="block text-[8px] font-bold uppercase text-muted mb-0.5">Select Color *</label>
                          <div className="flex gap-1 items-center">
                            <select
                              value={variant.colorId}
                              onChange={(e) => handleVariantChange(idx, 'colorId', e.target.value)}
                              className="flex-1 bg-paper border border-line rounded px-1 py-1 text-[10px] text-ink min-w-0"
                            >
                              <option value="">Select...</option>
                              {colors.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveVariantColorIndex(idx);
                                setColorPickerOpen(true);
                              }}
                              className="p-1 bg-paper border border-line rounded hover:bg-stone text-xs flex items-center justify-center"
                              title="Register new custom color category"
                            >
                              🎨
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold uppercase text-muted mb-0.5">Size</label>
                          <select
                            value={variant.sizeName}
                            onChange={(e) => handleVariantChange(idx, 'sizeName', e.target.value)}
                            className="w-full bg-paper border border-line rounded px-1.5 py-1 text-[10px] text-ink"
                          >
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold uppercase text-muted mb-0.5">SKU Code</label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                            className="w-full bg-paper border border-line rounded px-1.5 py-1 text-[10px] text-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold uppercase text-muted mb-0.5">Price</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                            className="w-full bg-paper border border-line rounded px-1.5 py-1 text-[10px] text-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold uppercase text-muted mb-0.5">Stock</label>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                            className="w-full bg-paper border border-line rounded px-1.5 py-1 text-[10px] text-ink"
                          />
                        </div>
                        <div className="text-right pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantRow(idx)}
                            className="p-1 border border-line rounded text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-line">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={handleDeleteProduct}
                    className="px-4 py-3 border border-red-200 text-red-600 rounded text-xs font-bold uppercase hover:bg-red-50 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> DELETE
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 flex items-center justify-center gap-2"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProduct ? 'SAVE PRODUCT CHANGES' : 'PUBLISH CATALOG PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Color Picker box popup */}
      {colorPickerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-3.5">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-ink">🎨 Register New Color</span>
              <button onClick={() => setColorPickerOpen(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Color Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sage Green"
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  className="w-full border border-line rounded px-3 py-1.5 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Select Color Block</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="w-12 h-10 border border-line rounded cursor-pointer"
                  />
                  <span className="font-mono text-xs text-muted uppercase font-bold">{newColor.hex}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddColorPicker}
                className="w-full py-2 bg-ink text-paper text-xs font-bold uppercase rounded"
              >
                ADD TO SELECTION LIST
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Collection Picker box popup */}
      {collectionPickerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-3.5">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="font-extrabold text-xs uppercase text-ink">📦 Create New Collection</span>
              <button onClick={() => setCollectionPickerOpen(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1 font-semibold">Collection Name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Drop 2026"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full border border-line rounded px-3 py-1.5 text-xs text-ink bg-stone focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCollection}
                className="w-full py-2 bg-ink text-paper text-xs font-bold uppercase rounded"
              >
                CREATE COLLECTION
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => setFormData({ ...formData, images: [...formData.images, url] })}
      />

    </div>
  );
}
