import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import { lookbookApi, productApi } from '../api/services';
import { ArrowRight, Bookmark, SlidersHorizontal, X, ExternalLink, ShoppingBag, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Lookbook() {
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('All Looks');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('All Season');
  const [selectedColor, setSelectedColor] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Selected Look Modal for Quick Shop
  const [activeLookModal, setActiveLookModal] = useState(null);

  const fetchLookbooksData = async () => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategory !== 'All Looks' ? selectedCategory : undefined,
        productType: selectedProductType || undefined,
        season: selectedSeason !== 'All Season' ? selectedSeason : undefined,
        color: selectedColor || undefined,
      };

      const res = await lookbookApi.getLookbooks(params);
      if (res.success && res.lookbooks && res.lookbooks.length > 0) {
        setLookbooks(res.lookbooks);
      } else {
        // Sample editorial fallbacks if DB table is currently empty
        setLookbooks([
          {
            id: 'lb-1',
            title: 'Urban Minimal',
            subtitle: 'Clean fits. Everyday edge.',
            category: 'Men',
            productType: 'T-Shirts',
            season: 'Summer',
            coverImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
            isNew: true,
          },
          {
            id: 'lb-2',
            title: 'Neutral Vibes',
            subtitle: 'Soft tones. Strong presence.',
            category: 'Women',
            productType: 'Hoodies',
            season: 'Winter',
            coverImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
            isNew: true,
          },
          {
            id: 'lb-3',
            title: 'Graphic Story',
            subtitle: 'Bold prints. Real expression.',
            category: 'Men',
            productType: 'T-Shirts',
            season: 'Summer',
            coverImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
            isNew: false,
          },
          {
            id: 'lb-4',
            title: 'Weekend Mode',
            subtitle: 'Relaxed fits for off-duty days.',
            category: 'Unisex',
            productType: 'Bottoms',
            season: 'All Season',
            coverImage: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
            isNew: false,
          },
          {
            id: 'lb-5',
            title: 'Street Essential',
            subtitle: 'Timeless pieces. Always in style.',
            category: 'Women',
            productType: 'T-Shirts',
            season: 'Summer',
            coverImage: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
            isNew: false,
          },
          {
            id: 'lb-6',
            title: 'Layer Up',
            subtitle: 'Comfort that layers with you.',
            category: 'Men',
            productType: 'Hoodies',
            season: 'Winter',
            coverImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
            isNew: false,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load lookbooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookbooksData();
  }, [selectedCategory, selectedProductType, selectedSeason, selectedColor]);

  const handleClearAll = () => {
    setSelectedCategory('All Looks');
    setSelectedProductType('');
    setSelectedSeason('All Season');
    setSelectedColor('');
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2 font-medium">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-bold">Lookbook</span>
        </nav>

        {/* Hero Banner Section (Text Left, Image Right) */}
        <div className="bg-stone/20 border border-line rounded-2xl overflow-hidden mb-10 grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 p-8 md:p-12 space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black text-ink uppercase tracking-tight leading-none">
              LOOKBOOK
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-md font-medium">
              Your daily dose of style inspiration. Explore curated looks and new ways to wear your favorites.
            </p>
          </div>
          <div className="lg:col-span-6 h-64 lg:h-[320px] bg-stone relative overflow-hidden border-t lg:border-t-0 lg:border-l border-line">
            <img
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&auto=format&fit=crop&q=80"
              alt="TNT Lookbook Banner"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>

        {/* Main Section: Left Filters (1/4) + Right Looks Grid (3/4) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Sidebar Filters */}
          <div className="w-full lg:w-64 shrink-0 space-y-6">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-ink">FILTERS</span>
              <button onClick={handleClearAll} className="text-[10px] font-bold text-muted underline hover:text-ink">
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <span className="block text-[10px] font-black uppercase text-ink mb-2">Category</span>
              <div className="space-y-1.5 text-xs font-medium text-ink">
                {['All Looks', 'Men', 'Women', 'Unisex', 'Accessories'].map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                    <input
                      type="radio"
                      name="categoryFilter"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="rounded-full text-ink focus:ring-0 cursor-pointer"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Product Type Filter */}
            <div className="space-y-2 border-t border-line pt-4">
              <span className="block text-[10px] font-black uppercase text-ink mb-2">Product Type</span>
              <div className="space-y-1.5 text-xs font-medium text-ink">
                {['T-Shirts', 'Hoodies', 'Shirts', 'Bottoms', 'Jackets', 'Accessories'].map((pt) => (
                  <label key={pt} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                    <input
                      type="checkbox"
                      checked={selectedProductType === pt}
                      onChange={() => setSelectedProductType(selectedProductType === pt ? '' : pt)}
                      className="rounded border-line text-ink focus:ring-0 cursor-pointer"
                    />
                    <span>{pt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Season Filter */}
            <div className="space-y-2 border-t border-line pt-4">
              <span className="block text-[10px] font-black uppercase text-ink mb-2">Season</span>
              <div className="space-y-1.5 text-xs font-medium text-ink">
                {['Summer', 'Winter', 'All Season'].map((sn) => (
                  <label key={sn} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                    <input
                      type="radio"
                      name="seasonFilter"
                      checked={selectedSeason === sn}
                      onChange={() => setSelectedSeason(sn)}
                      className="rounded-full text-ink focus:ring-0 cursor-pointer"
                    />
                    <span>{sn}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Color Swatches */}
            <div className="space-y-2 border-t border-line pt-4">
              <span className="block text-[10px] font-black uppercase text-ink mb-2">Color</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Black', hex: '#000000' },
                  { name: 'White', hex: '#FFFFFF' },
                  { name: 'Beige', hex: '#E5D3C0' },
                  { name: 'Grey', hex: '#808080' },
                  { name: 'Navy', hex: '#000080' },
                ].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(selectedColor === c.name ? '' : c.name)}
                    className={'w-6 h-6 rounded-full border transition-all relative flex items-center justify-center ' + (selectedColor === c.name ? 'ring-2 ring-ink ring-offset-2' : 'border-line hover:scale-105')}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={fetchLookbooksData}
              className="w-full py-3 bg-ink text-paper text-xs font-black uppercase tracking-wider rounded-lg hover:bg-ink/90 transition-all"
            >
              APPLY FILTERS
            </button>
          </div>

          {/* Right Main Column: Look Cards */}
          <div className="flex-1 w-full space-y-6">
            
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h2 className="text-xs font-black uppercase text-ink tracking-wider">
                ALL LOOKS ({lookbooks.length})
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted uppercase">Sort by :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-paper border border-line text-xs font-semibold text-ink rounded px-3 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-muted">
                Loading style lookbooks...
              </div>
            ) : lookbooks.length === 0 ? (
              <div className="border border-line rounded-xl p-12 text-center space-y-3 bg-paper">
                <p className="text-xs font-bold text-ink uppercase">No matching lookbooks found</p>
                <p className="text-[11px] text-muted max-w-sm mx-auto">Try resetting filters to see more style looks.</p>
                <button onClick={handleClearAll} className="px-6 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded">
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {lookbooks.map((lb) => (
                  <div
                    key={lb.id}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-line shadow-xs hover:shadow-md transition-all bg-stone"
                  >
                    {lb.isNew && (
                      <span className="absolute top-4 left-4 z-10 bg-paper text-ink text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider shadow-xs">
                        NEW
                      </span>
                    )}

                    <img
                      src={lb.coverImage}
                      alt={lb.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-paper space-y-2">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">{lb.title}</h3>
                        <p className="text-xs text-paper/80 font-medium">{lb.subtitle}</p>
                      </div>

                      <button
                        onClick={() => setActiveLookModal(lb)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-paper/60 text-paper text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-paper hover:text-ink transition-all w-fit mt-1"
                      >
                        VIEW LOOK <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom CTA Banner */}
            <div className="border border-line rounded-2xl p-6 bg-stone/20 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-ink shrink-0">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase text-ink">See something you love?</h3>
                  <p className="text-[11px] text-muted mt-0.5">Shop the looks you like directly or save them for later.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toast.success('Look saved to collection!')}
                  className="px-5 py-2.5 border border-line text-xs font-black uppercase text-ink rounded-xl hover:bg-stone transition-all"
                >
                  SAVE YOUR LOOKS
                </button>
                <Link
                  to="/collections"
                  className="px-5 py-2.5 bg-ink text-paper text-xs font-black uppercase tracking-wider rounded-xl hover:bg-ink/90 transition-all flex items-center gap-1.5"
                >
                  SHOP ALL COLLECTIONS <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>

      {/* Look Quick Modal */}
      {activeLookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <button onClick={() => setActiveLookModal(null)} className="absolute top-4 right-4 text-muted hover:text-ink"><X className="w-5 h-5" /></button>
            <h3 className="font-black text-sm uppercase text-ink tracking-wider">{activeLookModal.title}</h3>
            <p className="text-xs text-muted">{activeLookModal.subtitle}</p>

            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone border border-line">
              <img src={activeLookModal.coverImage} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button onClick={() => setActiveLookModal(null)} className="px-4 py-2 border border-line rounded text-xs font-bold text-ink">CLOSE</button>
              <Link to="/products" onClick={() => setActiveLookModal(null)} className="px-5 py-2 bg-ink text-paper text-xs font-bold uppercase rounded">SHOP PRODUCTS IN LOOK</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
