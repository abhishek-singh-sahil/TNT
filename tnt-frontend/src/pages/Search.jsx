import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import TrustStrip from '../components/common/TrustStrip';
import { Search as SearchIcon, X, Filter, ChevronDown, RefreshCw } from 'lucide-react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || 'oversized t-shirt';
  const [query, setQuery] = useState(initialQuery);

  const [activeCategoryPill, setActiveCategoryPill] = useState('All');
  const [priceRange, setPriceRange] = useState(1999);
  const [visibleCount, setVisibleCount] = useState(10);

  const searchResults = [
    {
      id: 'p1',
      name: 'Oversized Minimal Tee',
      price: 1499,
      variantText: 'Jet Black | M',
      colors: ['Jet Black', 'White', 'Beige'],
      stockStatus: 'In Stock',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p3',
      name: 'Signature Back Print Tee',
      price: 1649,
      variantText: 'White | M',
      colors: ['White', 'Jet Black'],
      stockStatus: 'In Stock',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p7',
      name: 'Essential Oversized Tee',
      price: 1299,
      variantText: 'Charcoal | L',
      colors: ['Charcoal', 'Olive Green'],
      stockStatus: 'In Stock',
      image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p8',
      name: 'Clean Oversized Tee',
      price: 1199,
      variantText: 'White | M',
      colors: ['White', 'Olive Green'],
      stockStatus: 'Low Stock',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p9',
      name: 'Oversized Everyday Tee',
      price: 1499,
      variantText: 'Mocha Brown | L',
      colors: ['Mocha Brown', 'Jet Black', 'Beige'],
      stockStatus: 'In Stock',
      image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p10',
      name: 'Relaxed Oversized Tee',
      price: 1199,
      variantText: 'Sand | M',
      colors: ['Sand', 'Jet Black', 'Grey'],
      stockStatus: 'In Stock',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p11',
      name: 'Core Oversized Tee',
      price: 1199,
      variantText: 'Forest Green | L',
      colors: ['Forest Green', 'Jet Black'],
      stockStatus: 'In Stock',
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p12',
      name: 'Graphic Oversized Tee',
      price: 1699,
      variantText: 'Lavender | M',
      colors: ['Lavender', 'Jet Black'],
      stockStatus: 'In Stock',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p13',
      name: 'Premium Oversized Tee',
      price: 1399,
      variantText: 'Navy Blue | L',
      colors: ['Navy Blue', 'Jet Black'],
      stockStatus: 'In Stock',
      image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p14',
      name: 'Women Oversized Tee',
      price: 1199,
      variantText: 'Jet Black | M',
      colors: ['Jet Black', 'Lavender'],
      stockStatus: 'In Stock',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Search</span>
        </nav>

        {/* Search Bar Input Pill */}
        <div className="max-w-2xl mx-auto mb-8 relative">
          <SearchIcon className="w-5 h-5 text-muted absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-stone border border-line rounded-full text-sm font-semibold text-ink focus:outline-none focus:border-ink shadow-xs"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-3.5 text-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink uppercase tracking-tight">
              SEARCH RESULTS FOR "{query.toUpperCase()}"
            </h1>
            <p className="text-xs text-muted">24 items found</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Sort by:</span>
            <select className="bg-paper border border-line text-xs font-semibold text-ink rounded px-3 py-1.5 focus:outline-none">
              <option value="relevance">Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar mb-8">
          {[
            { label: 'All', count: 24 },
            { label: 'Men', count: 16 },
            { label: 'Women', count: 6 },
            { label: 'Unisex', count: 2 },
          ].map((pill) => (
            <button
              key={pill.label}
              onClick={() => setActiveCategoryPill(pill.label)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeCategoryPill === pill.label
                  ? 'bg-ink text-paper shadow-sm'
                  : 'bg-stone text-ink hover:bg-line border border-line'
              }`}
            >
              {pill.label} ({pill.count})
            </button>
          ))}
        </div>

        {/* Layout with Sidebar & Products Grid */}
        <div className="flex gap-8">
          {/* Left Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-paper border border-line rounded-lg p-5 sticky top-24 space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-extrabold text-ink uppercase text-xs">FILTERS</h3>
                <button className="text-xs text-muted hover:text-ink">Clear All</button>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-xs font-bold uppercase text-ink mb-3 flex justify-between">
                  Category <ChevronDown className="w-3.5 h-3.5" />
                </h4>
                <div className="space-y-2 text-xs text-ink font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-line text-ink" /> T-Shirts (24)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-line text-ink" /> Oversized T-Shirts (24)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-line text-ink" /> Polos (3)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-line text-ink" /> Hoodies (8)
                  </label>
                </div>
              </div>

              {/* Gender */}
              <div className="border-t border-line pt-4">
                <h4 className="text-xs font-bold uppercase text-ink mb-3 flex justify-between">
                  Gender <ChevronDown className="w-3.5 h-3.5" />
                </h4>
                <div className="space-y-2 text-xs text-ink font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-line text-ink" /> Men (24)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-line text-ink" /> Women (10)
                  </label>
                </div>
              </div>

              {/* Size */}
              <div className="border-t border-line pt-4">
                <h4 className="text-xs font-bold uppercase text-ink mb-3">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                    <button key={s} className="px-3 py-1.5 border border-line text-xs font-bold rounded hover:bg-stone">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Dual Slider */}
              <div className="border-t border-line pt-4">
                <h4 className="text-xs font-bold uppercase text-ink mb-3">Price Range</h4>
                <input
                  type="range"
                  min="399"
                  max="1999"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full accent-ink"
                />
                <div className="flex justify-between text-xs font-bold text-ink mt-1">
                  <span>₹399</span>
                  <span>₹{priceRange}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded">
                  APPLY FILTERS
                </button>
                <button className="w-full py-2.5 border border-line text-xs font-bold uppercase text-ink rounded hover:bg-stone">
                  CLEAR ALL
                </button>
              </div>
            </div>
          </aside>

          {/* Main Search Product Grid */}
          <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.slice(0, visibleCount).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < searchResults.length && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setVisibleCount(visibleCount + 6)}
                  className="px-8 py-3 bg-paper border border-line rounded text-xs font-bold uppercase tracking-wider text-ink hover:bg-stone transition-all inline-flex items-center gap-2"
                >
                  LOAD MORE <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
