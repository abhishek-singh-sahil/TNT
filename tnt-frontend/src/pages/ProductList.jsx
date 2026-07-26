import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrencySymbol } from '../store/settingsSlice';
import ProductCard from '../components/product/ProductCard';
import TrustStrip from '../components/common/TrustStrip';
import { productApi } from '../api/services';
import { ChevronDown, PackageX, RefreshCw, SlidersHorizontal, X } from 'lucide-react';

function FiltersContent({
  dbCategories,
  dbColors,
  selectedCategories,
  toggleCategory,
  selectedGenders,
  toggleGender,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  priceCap,
  setPriceCap,
  handleApplyFilters,
  handleClearFilters,
  selectedSort,
  setSelectedSort,
  showSort = false
}) {
  const currencySymbol = useSelector(selectCurrencySymbol);
  return (
    <div className="space-y-6">
      {showSort && (
        <div className="space-y-2">
          <span className="block text-[10px] font-bold uppercase text-ink">Sort Products By</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="w-full bg-stone border border-line text-xs font-semibold text-ink rounded px-3 py-2 focus:outline-none"
          >
            <option value="newest">Relevance / Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      )}

      {/* Category checklist */}
      <div className="space-y-2">
        <span className="block text-[10px] font-bold uppercase text-ink mb-2">Category</span>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {dbCategories.map(cat => {
            const isChecked = selectedCategories.includes(cat.slug);
            return (
              <label key={cat.id} className="flex items-center justify-between text-xs text-ink cursor-pointer font-medium hover:text-ink/80">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(cat.slug)}
                    className="rounded border-line focus:ring-0 text-ink cursor-pointer"
                  />
                  <span>{cat.name}</span>
                </div>
                <span className="text-[10px] text-muted font-bold">{cat._count?.products || 0}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Gender checklist */}
      <div className="space-y-2 border-t border-line pt-4">
        <span className="block text-[10px] font-bold uppercase text-ink mb-2">Gender</span>
        <div className="space-y-1.5">
          {['Men', 'Women', 'Unisex'].map(gender => {
            const isChecked = selectedGenders.includes(gender);
            return (
              <label key={gender} className="flex items-center justify-between text-xs text-ink cursor-pointer font-medium hover:text-ink/80">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleGender(gender)}
                    className="rounded border-line focus:ring-0 text-ink cursor-pointer"
                  />
                  <span>{gender}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Size blocks */}
      <div className="space-y-2 border-t border-line pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="block text-[10px] font-bold uppercase text-ink">Size</span>
          <span className="text-[9px] font-bold text-muted underline cursor-pointer hover:text-ink">Size Guide</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => {
            const isSelected = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(isSelected ? null : size)}
                className={`py-1.5 text-[10px] font-black rounded border transition-all ${
                  isSelected
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink hover:border-ink/50'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color swatches */}
      <div className="space-y-2 border-t border-line pt-4">
        <span className="block text-[10px] font-bold uppercase text-ink mb-2">Color</span>
        <div className="flex flex-wrap gap-2">
          {dbColors.map(color => {
            const isSelected = selectedColor === color.name;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColor(isSelected ? null : color.name)}
                className={`w-6 h-6 rounded-full border transition-all relative flex items-center justify-center ${
                  isSelected ? 'ring-2 ring-ink ring-offset-2' : 'border-line hover:scale-105'
                }`}
                style={{ backgroundColor: color.hexCode }}
                title={color.name}
              >
                {isSelected && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color.hexCode === '#ffffff' ? '#111' : '#fff' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range slider */}
      <div className="space-y-2 border-t border-line pt-4">
        <span className="block text-[10px] font-bold uppercase text-ink mb-1">Price Range</span>
        <input
          type="range"
          min={399}
          max={5000}
          value={priceCap}
          onChange={(e) => setPriceCap(Number(e.target.value))}
          className="w-full accent-ink bg-stone/80 rounded-lg h-1 appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-ink font-bold">
          <span>{currencySymbol}399</span>
          <span>{currencySymbol}{priceCap.toLocaleString()}</span>
        </div>
      </div>

      {/* Apply & Clear buttons */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-line">
        <button
          type="button"
          onClick={handleApplyFilters}
          className="py-2.5 bg-ink text-paper text-[10px] font-bold uppercase rounded tracking-wider hover:bg-ink/95"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={handleClearFilters}
          className="py-2.5 border border-line text-ink text-[10px] font-bold uppercase rounded tracking-wider hover:bg-stone/50"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const { slug } = useParams();

  const categoryParam = searchParams.get('category');
  const collectionParam = searchParams.get('collection');

  // Products & Loading
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbColors, setDbColors] = useState([]);

  // Sidebar Drawer state for mobile only
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters State (default priceCap is 5000)
  const [selectedCategories, setSelectedCategories] = useState(categoryParam ? [categoryParam] : []);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [priceCap, setPriceCap] = useState(5000);
  const [selectedSort, setSelectedSort] = useState('newest');

  // Quick Tab Filter Pill (All, Men, Women, Unisex)
  const [quickGenderFilter, setQuickGenderFilter] = useState('All');

  // Load More pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchCatalogData(true);
  }, [categoryParam, collectionParam, slug, selectedSort, pathname]);

  const fetchMetadata = async () => {
    try {
      const [catRes, colorRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getColors()
      ]);
      if (catRes.success) setDbCategories(catRes.categories);
      if (colorRes.success) setDbColors(colorRes.colors);
    } catch (err) {
      console.error('Failed to load filter metadata:', err);
    }
  };

  const fetchCatalogData = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      if (reset) {
        setPage(1);
        setProducts([]);
      }

      let urlGender = pathname.includes('/men') ? 'men' : pathname.includes('/women') ? 'women' : pathname.includes('/accessories') ? 'accessories' : undefined;
      const isNewArrival = pathname.includes('/new-arrivals') ? true : undefined;
      const onSale = pathname.includes('/sale') ? true : undefined;

      const params = {
        page: currentPage,
        limit,
        sort: selectedSort,
        category: selectedCategories.length > 0 ? selectedCategories.join(',') : categoryParam || undefined,
        collection: slug || collectionParam || undefined,
        gender: urlGender || (selectedGenders.length > 0 ? selectedGenders.map(g => g.toLowerCase()).join(',') : undefined),
        color: selectedColor || undefined,
        size: selectedSize || undefined,
        maxPrice: priceCap,
        isNewArrival,
        onSale
      };

      const res = await productApi.getProducts(params);
      if (res.success && res.products) {
        if (reset) {
          setProducts(res.products);
        } else {
          setProducts(prev => [...prev, ...res.products]);
        }
        setHasMore(res.products.length >= limit);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchCatalogData(true);
    setIsDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedGenders([]);
    setSelectedSize(null);
    setSelectedColor(null);
    setPriceCap(5000);
    setQuickGenderFilter('All');
    setSearchParams({});
    setTimeout(() => {
      fetchCatalogData(true);
    }, 100);
    setIsDrawerOpen(false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setTimeout(() => {
      fetchCatalogData(false);
    }, 50);
  };

  // Category Toggle
  const toggleCategory = (slugVal) => {
    setSelectedCategories(prev =>
      prev.includes(slugVal) ? prev.filter(s => s !== slugVal) : [...prev, slugVal]
    );
  };

  // Gender Toggle
  const toggleGender = (genderVal) => {
    setSelectedGenders(prev =>
      prev.includes(genderVal) ? prev.filter(g => g !== genderVal) : [...prev, genderVal]
    );
  };

  // Get active display list filtered locally by quick tab filters
  const getFilteredProducts = () => {
    if (quickGenderFilter === 'All') return products;
    if (quickGenderFilter === 'Men') {
      return products.filter(p => p.genderMen);
    }
    if (quickGenderFilter === 'Women') {
      return products.filter(p => p.genderWomen);
    }
    if (quickGenderFilter === 'Unisex') {
      return products.filter(p => p.genderMen && p.genderWomen);
    }
    return products;
  };

  const activeProducts = getFilteredProducts();

  // Quick counts
  const allCount = products.length;
  const menCount = products.filter(p => p.genderMen && !p.genderWomen).length;
  const womenCount = products.filter(p => p.genderWomen && !p.genderMen).length;
  const unisexCount = products.filter(p => p.genderMen && p.genderWomen).length;

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-[1650px] mx-auto px-4 md:px-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2 font-medium">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-bold">Catalog</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* DESKTOP SIDEBAR FILTERS (Visible on lg devices and up) */}
          <div className="hidden lg:block w-[260px] shrink-0 border border-line rounded-xl p-5 bg-paper">
            <FiltersContent
              dbCategories={dbCategories}
              dbColors={dbColors}
              selectedCategories={selectedCategories}
              toggleCategory={toggleCategory}
              selectedGenders={selectedGenders}
              toggleGender={toggleGender}
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              priceCap={priceCap}
              setPriceCap={setPriceCap}
              handleApplyFilters={handleApplyFilters}
              handleClearFilters={handleClearFilters}
              selectedSort={selectedSort}
              setSelectedSort={setSelectedSort}
            />
          </div>

          {/* MAIN PRODUCT GRID COLUMN */}
          <div className="flex-1 space-y-6 w-full">
            
            {/* Header and Sorting */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-ink uppercase tracking-tight">
                  {pathname.includes('/sale') ? 'SALE OFFERS' : 'PRODUCTS CATALOG'}
                </h1>
                <span className="text-xs text-muted font-bold">{activeProducts.length} items found</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Filter Drawer Toggle Button (Visible only on mobile/tablet) */}
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex lg:hidden items-center gap-2 px-4 py-2 border border-line rounded text-xs font-bold text-ink hover:bg-stone/50 bg-paper uppercase"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters & Sort
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted uppercase">Sort by:</span>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="bg-paper border border-line text-xs font-semibold text-ink rounded px-3 py-1.5 focus:outline-none focus:border-ink cursor-pointer"
                  >
                    <option value="newest">Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Customer Rating</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick gender filters pills */}
            <div className="flex gap-2 border-b border-line pb-4 overflow-x-auto no-scrollbar">
              {[
                { name: 'All', count: allCount },
                { name: 'Men', count: menCount },
                { name: 'Women', count: womenCount },
                { name: 'Unisex', count: unisexCount }
              ].map(tab => {
                const isActive = quickGenderFilter === tab.name;
                return (
                  <button
                    key={tab.name}
                    type="button"
                    onClick={() => setQuickGenderFilter(tab.name)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                      isActive ? 'bg-ink text-paper' : 'bg-stone/50 text-ink hover:bg-stone'
                    }`}
                  >
                    {tab.name} ({tab.count})
                  </button>
                );
              })}
            </div>

            {/* Grid display */}
            {loading && activeProducts.length === 0 ? (
              <div className="py-24 text-center text-xs text-muted flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading products catalog...
              </div>
            ) : activeProducts.length === 0 ? (
              <div className="bg-stone/20 border border-line rounded-xl p-16 text-center space-y-4 max-w-xl mx-auto my-8">
                <div className="w-16 h-16 rounded-full bg-paper border border-line flex items-center justify-center text-ink mx-auto mb-2">
                  <PackageX className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-extrabold text-ink uppercase">No matching products found</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Try adjusting your filter categories, sizes, or price slider range to discover styles.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded inline-block"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {activeProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination Load More */}
            {hasMore && activeProducts.length > 0 && (
              <div className="pt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-3 bg-paper border border-line text-ink text-xs font-bold uppercase tracking-wider rounded-lg inline-flex items-center gap-2 hover:bg-stone/50 transition-colors"
                >
                  {loading ? 'LOADING...' : 'LOAD MORE'}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MOBILE FILTER & SORT SLIDE OVER DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          {/* Backdrop blur overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-sm bg-paper border-r border-line h-full flex flex-col justify-between shadow-2xl z-10 transition-transform duration-300 animate-slide-in">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-line">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider flex items-center gap-2">
                ⚡ Refine Products
              </span>
              <button onClick={() => setIsDrawerOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filters Block */}
            <div className="flex-1 overflow-y-auto p-6">
              <FiltersContent
                dbCategories={dbCategories}
                dbColors={dbColors}
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
                selectedGenders={selectedGenders}
                toggleGender={toggleGender}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                priceCap={priceCap}
                setPriceCap={setPriceCap}
                handleApplyFilters={handleApplyFilters}
                handleClearFilters={handleClearFilters}
                selectedSort={selectedSort}
                setSelectedSort={setSelectedSort}
                showSort={true}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
