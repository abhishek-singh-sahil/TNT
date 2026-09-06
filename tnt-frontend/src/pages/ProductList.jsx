import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrencySymbol } from "../store/settingsSlice";
import ProductCard from "../components/product/ProductCard";
import TrustStrip from "../components/common/TrustStrip";
import { productApi } from "../api/services";
import {
  ChevronDown, ChevronUp, PackageX, RefreshCw, SlidersHorizontal,
  X, LayoutGrid, List, ChevronLeft, ChevronRight
} from "lucide-react";

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-3.5">
      <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => setOpen(!open)}>
        <span className="text-[11px] font-black uppercase tracking-widest text-ink">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted flex-shrink-0" />}
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}

function SidebarFilters({ dbCategories, dbColors, selectedCategories, toggleCategory, selectedSizes, toggleSize, selectedColors, toggleColor, priceMax, setPriceMax, selectedMaterials, toggleMaterial, handleApplyFilters, handleClearFilters }) {
  const currencySymbol = useSelector(selectCurrencySymbol);
  const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const MATERIALS = ["Cotton", "Cotton Blend", "Polyester", "Linen"];
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const visibleSizes = showAllSizes ? SIZES : SIZES.slice(0, 6);
  const visibleColors = showAllColors ? dbColors : dbColors.slice(0, 8);

  return (
    <div>
      <div className="flex items-center justify-between pb-3 border-b border-line mb-1">
        <span className="text-[11px] font-black uppercase tracking-widest text-ink">Filters</span>
        <button type="button" onClick={handleClearFilters} className="text-[10px] text-muted hover:text-ink font-semibold underline underline-offset-2 transition-colors">Clear All</button>
      </div>

      <FilterSection title="Category" defaultOpen={true}>
        <div className="space-y-2">
          {dbCategories.map(cat => {
            const isChecked = selectedCategories.includes(cat.slug);
            return (
              <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={isChecked} onChange={() => toggleCategory(cat.slug)} className="w-3.5 h-3.5 rounded-sm border-line accent-ink cursor-pointer flex-shrink-0" />
                <span className={`text-xs transition-colors ${isChecked ? "font-bold text-ink" : "text-muted group-hover:text-ink font-medium"}`}>{cat.name}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Size" defaultOpen={true}>
        <div className="space-y-2">
          {visibleSizes.map(size => {
            const isChecked = selectedSizes.includes(size);
            return (
              <label key={size} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={isChecked} onChange={() => toggleSize(size)} className="w-3.5 h-3.5 rounded-sm border-line accent-ink cursor-pointer flex-shrink-0" />
                <span className={`text-xs transition-colors ${isChecked ? "font-bold text-ink" : "text-muted group-hover:text-ink font-medium"}`}>{size}</span>
              </label>
            );
          })}
          {SIZES.length > 6 && (
            <button type="button" onClick={() => setShowAllSizes(!showAllSizes)} className="text-[10px] text-ink font-bold underline underline-offset-2 hover:opacity-70 transition-opacity pt-0.5">
              {showAllSizes ? "- Less" : `+ ${SIZES.length - 6} More`}
            </button>
          )}
        </div>
      </FilterSection>

      <FilterSection title="Color" defaultOpen={true}>
        <div className="flex flex-wrap gap-2">
          {visibleColors.map(color => {
            const isSelected = selectedColors.includes(color.name);
            return (
              <button key={color.id} type="button" onClick={() => toggleColor(color.name)} title={color.name}
                className={`w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 ${isSelected ? "border-ink scale-110" : "border-white hover:scale-105"}`}
                style={{ backgroundColor: color.hexCode || "#ccc", boxShadow: "0 0 0 1px rgba(0,0,0,0.15)" }}
              />
            );
          })}
          {dbColors.length > 8 && (
            <button type="button" onClick={() => setShowAllColors(!showAllColors)} className="text-[10px] text-muted hover:text-ink font-bold border border-line rounded-full px-2 py-0.5 transition-colors">
              {showAllColors ? "Less" : "+ More"}
            </button>
          )}
        </div>
      </FilterSection>

      <FilterSection title="Price" defaultOpen={true}>
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] text-muted font-semibold">
            <span>{currencySymbol}499</span>
            <span>{currencySymbol}{priceMax.toLocaleString()}</span>
          </div>
          <input type="range" min={499} max={5000} step={100} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full h-1 accent-ink cursor-pointer rounded-full" />
        </div>
      </FilterSection>

      <FilterSection title="Material" defaultOpen={true}>
        <div className="space-y-2">
          {MATERIALS.map(mat => {
            const isChecked = selectedMaterials.includes(mat);
            return (
              <label key={mat} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={isChecked} onChange={() => toggleMaterial(mat)} className="w-3.5 h-3.5 rounded-sm border-line accent-ink cursor-pointer flex-shrink-0" />
                <span className={`text-xs transition-colors ${isChecked ? "font-bold text-ink" : "text-muted group-hover:text-ink font-medium"}`}>{mat}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Fit" defaultOpen={false}>
        <div className="space-y-2">
          {["Regular Fit", "Slim Fit", "Oversized", "Relaxed Fit"].map(fit => (
            <label key={fit} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-line accent-ink cursor-pointer flex-shrink-0" />
              <span className="text-xs text-muted group-hover:text-ink font-medium">{fit}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Pattern" defaultOpen={false}>
        <div className="space-y-2">
          {["Solid", "Graphic Print", "Striped", "Camo"].map(pat => (
            <label key={pat} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-line accent-ink cursor-pointer flex-shrink-0" />
              <span className="text-xs text-muted group-hover:text-ink font-medium">{pat}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Sleeve Length" defaultOpen={false}>
        <div className="space-y-2">
          {["Half Sleeve", "Full Sleeve", "Sleeveless"].map(sl => (
            <label key={sl} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-line accent-ink cursor-pointer flex-shrink-0" />
              <span className="text-xs text-muted group-hover:text-ink font-medium">{sl}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <div className="pt-4 space-y-2">
        <button type="button" onClick={handleApplyFilters} className="w-full py-2.5 bg-ink text-paper text-[11px] font-black uppercase tracking-widest rounded hover:bg-ink/90 transition-colors">Apply Filters</button>
        <button type="button" onClick={handleClearFilters} className="w-full text-[10px] text-muted hover:text-ink font-semibold underline underline-offset-2 transition-colors">Clear All Filters</button>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const getPages = () => {
    const pages = [];
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) pages.push(i);
    return pages;
  };
  return (
    <div className="flex items-center justify-center gap-1.5 pt-8 pb-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 border border-line rounded text-muted hover:text-ink hover:border-ink/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
      {currentPage > 3 && <><button onClick={() => onPageChange(1)} className="w-8 h-8 text-xs font-semibold text-muted hover:text-ink rounded border border-transparent hover:border-line transition-all">1</button>{currentPage > 4 && <span className="text-muted text-xs px-1">…</span>}</>}
      {getPages().map(p => (
        <button key={p} onClick={() => onPageChange(p)} className={`w-8 h-8 text-xs font-semibold rounded border transition-all ${p === currentPage ? "bg-ink text-paper border-ink" : "border-line text-muted hover:text-ink hover:border-ink/40"}`}>{p}</button>
      ))}
      {currentPage < totalPages - 2 && <>{currentPage < totalPages - 3 && <span className="text-muted text-xs px-1">…</span>}<button onClick={() => onPageChange(totalPages)} className="w-8 h-8 text-xs font-semibold text-muted hover:text-ink rounded border border-transparent hover:border-line transition-all">{totalPages}</button></>}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border border-line rounded text-muted hover:text-ink hover:border-ink/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const { slug } = useParams();
  const currencySymbol = useSelector(selectCurrencySymbol);

  const categoryParam = searchParams.get("category");
  const collectionParam = searchParams.get("collection");

  const [collectionInfo, setCollectionInfo] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbColors, setDbColors] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategories, setSelectedCategories] = useState(categoryParam ? [categoryParam] : []);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [priceMax, setPriceMax] = useState(2499);
  const [selectedSort, setSelectedSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 12;

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, colorRes, collRes] = await Promise.all([productApi.getCategories(), productApi.getColors(), productApi.getCollections()]);
        if (catRes.success) {
          setDbCategories(catRes.categories || []);
          if (categoryParam) { const f = catRes.categories?.find(c => c.slug === categoryParam); if (f) setCategoryInfo(f); }
        }
        if (colorRes.success) setDbColors(colorRes.colors || []);
        if (collRes.success && slug) { const f = collRes.collections?.find(c => c.slug === slug); if (f) setCollectionInfo(f); }
      } catch (err) { console.error(err); }
    };
    fetchMeta();
  }, [slug, categoryParam]);

  const fetchProducts = useCallback(async (pg = 1) => {
    try {
      setLoading(true);
      const urlGender = pathname.includes("/men") ? "men" : pathname.includes("/women") ? "women" : pathname.includes("/accessories") ? "accessories" : undefined;
      const params = {
        page: pg, limit: LIMIT, sort: selectedSort,
        category: selectedCategories.length > 0 ? selectedCategories.join(",") : categoryParam || undefined,
        collection: slug || collectionParam || undefined,
        gender: urlGender,
        color: selectedColors.length > 0 ? selectedColors.join(",") : undefined,
        size: selectedSizes.length > 0 ? selectedSizes.join(",") : undefined,
        maxPrice: priceMax,
        isNewArrival: pathname.includes("/new-arrivals") ? true : undefined,
        onSale: pathname.includes("/sale") ? true : undefined
      };
      const res = await productApi.getProducts(params);
      if (res.success) {
        setProducts(res.products || []);
        const tc = res.total ?? res.products?.length ?? 0;
        setTotalCount(tc);
        setTotalPages(Math.max(1, Math.ceil(tc / LIMIT)));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [pathname, slug, categoryParam, collectionParam, selectedSort, selectedCategories, selectedColors, selectedSizes, priceMax]);

  useEffect(() => { setPage(1); fetchProducts(1); }, [pathname, slug, categoryParam, collectionParam, selectedSort]);

  const handleApplyFilters = () => { setPage(1); fetchProducts(1); setIsDrawerOpen(false); };
  const handleClearFilters = () => {
    setSelectedCategories([]); setSelectedSizes([]); setSelectedColors([]); setSelectedMaterials([]); setPriceMax(2499);
    setSearchParams({}); setPage(1); setTimeout(() => fetchProducts(1), 50); setIsDrawerOpen(false);
  };
  const handlePageChange = (pg) => { if (pg < 1 || pg > totalPages) return; setPage(pg); fetchProducts(pg); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const toggleCategory = (v) => setSelectedCategories(p => p.includes(v) ? p.filter(s => s !== v) : [...p, v]);
  const toggleSize = (v) => setSelectedSizes(p => p.includes(v) ? p.filter(s => s !== v) : [...p, v]);
  const toggleColor = (v) => setSelectedColors(p => p.includes(v) ? p.filter(s => s !== v) : [...p, v]);
  const toggleMaterial = (v) => setSelectedMaterials(p => p.includes(v) ? p.filter(s => s !== v) : [...p, v]);

  const getPageTitle = () => {
    if (collectionInfo?.name) return collectionInfo.name.toUpperCase();
    if (categoryInfo?.name) return categoryInfo.name.toUpperCase();
    if (pathname.includes("/new-arrivals")) return "NEW ARRIVALS";
    if (pathname.includes("/sale")) return "SALE";
    if (pathname.includes("/men")) return "MEN";
    if (pathname.includes("/women")) return "WOMEN";
    if (pathname.includes("/accessories")) return "ACCESSORIES";
    return "ALL PRODUCTS";
  };
  const getPageDesc = () => {
    if (collectionInfo?.description) return collectionInfo.description;
    if (categoryInfo?.description) return categoryInfo.description;
    if (pathname.includes("/new-arrivals")) return "Fresh drops. New season styles. Just landed.";
    if (pathname.includes("/sale")) return "Big discounts on premium streetwear. Limited time only.";
    return "Timeless designs. Premium comfort. Made for every day.";
  };
  const bannerImg = collectionInfo?.bannerImage || categoryInfo?.bannerImage || null;
  const isCollPage = !!slug;

  const getBreadcrumb = () => {
    if (slug && collectionInfo) return [{ label: "Collections", href: "/collections" }, { label: collectionInfo.name }];
    if (categoryParam && categoryInfo) return [{ label: "Products", href: "/products" }, { label: categoryInfo.name }];
    if (pathname.includes("/new-arrivals")) return [{ label: "New Arrivals" }];
    if (pathname.includes("/sale")) return [{ label: "Sale" }];
    if (pathname.includes("/men")) return [{ label: "Men" }];
    if (pathname.includes("/women")) return [{ label: "Women" }];
    if (pathname.includes("/accessories")) return [{ label: "Accessories" }];
    return [{ label: "All Products" }];
  };

  const filterProps = { dbCategories, dbColors, selectedCategories, toggleCategory, selectedSizes, toggleSize, selectedColors, toggleColor, priceMax, setPriceMax, selectedMaterials, toggleMaterial, handleApplyFilters, handleClearFilters };

  return (
    <div className="bg-paper min-h-screen">

      {/* Collection Banner */}
      {(isCollPage || bannerImg) && (
        <div className="relative w-full overflow-hidden" style={{ minHeight: 220 }}>
          {bannerImg
            ? <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bannerImg})` }} />
            : <div className="absolute inset-0 bg-stone/60" />
          }
          <div className="absolute inset-0 bg-gradient-to-r from-paper/85 via-paper/50 to-transparent" />
          <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col justify-center" style={{ minHeight: 220 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60 mb-2">
              {isCollPage ? "Collection" : categoryInfo ? "Category" : "Catalog"}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-ink leading-none tracking-tight mb-3">{getPageTitle()}</h1>
            <p className="text-sm text-ink/70 font-medium max-w-sm leading-relaxed">{getPageDesc()}</p>
          </div>
        </div>
      )}

      {/* Breadcrumb + Toolbar */}
      <div className="border-b border-line">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <nav className="flex items-center gap-1.5 text-[11px] text-muted font-medium flex-wrap">
            <Link to="/" className="hover:text-ink transition-colors">Home</Link>
            {getBreadcrumb().map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="text-muted/50">›</span>
                {crumb.href ? <Link to={crumb.href} className="hover:text-ink transition-colors">{crumb.label}</Link> : <span className="text-ink font-bold">{crumb.label}</span>}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-muted font-medium hidden sm:block">{loading ? "..." : `${totalCount} Products`}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted font-medium hidden sm:block">Sort by:</span>
              <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)} className="bg-paper border border-line text-[11px] font-semibold text-ink rounded px-3 py-1.5 focus:outline-none focus:border-ink cursor-pointer">
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
            <div className="hidden sm:flex items-center border border-line rounded overflow-hidden">
              <button type="button" onClick={() => setViewMode("grid")} className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => setViewMode("list")} className={`p-1.5 border-l border-line transition-colors ${viewMode === "list" ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}><List className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6">
        <div className="flex gap-8 items-start">
          {/* Sidebar */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0"><SidebarFilters {...filterProps} /></aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {/* Mobile toolbar */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <span className="text-[11px] text-muted font-medium">{loading ? "..." : `${totalCount} Products`}</span>
              <button type="button" onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-line rounded text-xs font-bold text-ink hover:bg-stone/50 transition-colors uppercase">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </button>
            </div>

            {loading && products.length === 0 ? (
              <div className="py-24 flex flex-col items-center gap-3"><RefreshCw className="w-6 h-6 animate-spin text-muted" /><span className="text-xs text-muted">Loading products...</span></div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-stone border border-line flex items-center justify-center mx-auto"><PackageX className="w-6 h-6 text-muted" /></div>
                <h3 className="text-sm font-extrabold text-ink uppercase">No products found</h3>
                <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">Try adjusting your filters to discover more styles.</p>
                <button type="button" onClick={handleClearFilters} className="px-6 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded tracking-wider inline-block hover:bg-ink/90 transition-colors">Reset Filters</button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((p) => {
                  const imageSrc = p.image || p.images?.[0]?.url || "";
                  const price = p.price ?? p.basePrice ?? 0;
                  return (
                    <Link key={p.id} to={`/product/${p.slug || p.id}`} className="flex items-center gap-5 border border-line rounded-xl p-4 hover:shadow-sm transition-all group bg-paper">
                      <div className="w-20 h-24 bg-stone border border-line rounded-lg overflow-hidden flex-shrink-0">
                        {imageSrc ? <img src={imageSrc} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-muted text-xs">{p.name}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-ink">{p.name}</p>
                        <p className="text-xs text-muted mt-0.5">{p.category?.name}</p>
                        <p className="font-extrabold text-sm text-ink mt-2">{currencySymbol}{price.toLocaleString("en-IN")}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-[320px] bg-paper border-r border-line h-full flex flex-col shadow-2xl z-10">
            <div className="flex justify-between items-center px-5 py-4 border-b border-line flex-shrink-0">
              <span className="font-black text-xs uppercase text-ink tracking-widest">Filters</span>
              <button onClick={() => setIsDrawerOpen(false)} className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 pb-20"><SidebarFilters {...filterProps} /></div>
            <div className="p-4 border-t border-line bg-paper flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex-1 py-3 border border-line rounded-xl text-xs font-bold uppercase text-ink hover:bg-stone transition-colors"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 py-3 bg-ink text-paper rounded-xl text-xs font-bold uppercase hover:bg-black transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8"><TrustStrip /></div>
    </div>
  );
}