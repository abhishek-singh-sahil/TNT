import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import { productApi } from '../api/services';
import { ShoppingBag, X, Scale } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addItem } from '../store/cartSlice';
import toast from 'react-hot-toast';

export default function Compare() {
  const dispatch = useDispatch();
  const [compareList, setCompareList] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load compared product IDs from session/localStorage
    const saved = JSON.parse(localStorage.getItem('tnt_compare_ids') || '[]');
    async function loadComparedProducts() {
      try {
        setLoading(true);
        const res = await productApi.getProducts();
        if (res.success && res.products) {
          setProducts(res.products);
          setCompareList(res.products.filter(p => saved.includes(p.id)));
        }
      } catch (err) {
        console.error('Failed to load compared products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadComparedProducts();
  }, []);

  const handleRemoveCompare = (id) => {
    const updated = compareList.filter(p => p.id !== id);
    setCompareList(updated);
    localStorage.setItem('tnt_compare_ids', JSON.stringify(updated.map(p => p.id)));
    toast.success('Product removed from comparison');
  };

  const handleAddCompare = (prod) => {
    if (compareList.length >= 3) {
      toast.error('You can compare a maximum of 3 products at a time!');
      return;
    }
    if (compareList.some(p => p.id === prod.id)) return;
    const updated = [...compareList, prod];
    setCompareList(updated);
    localStorage.setItem('tnt_compare_ids', JSON.stringify(updated.map(p => p.id)));
    toast.success('Product added to comparison');
  };

  const handleAddToCart = (product) => {
    dispatch(
      addItem({
        productId: product.id,
        variantId: product.variants?.[0]?.id || `${product.id}-default`,
        name: product.name,
        price: product.basePrice,
        color: product.variants?.[0]?.color?.name || 'Default',
        size: product.variants?.[0]?.size?.name || 'M',
        image: product.images?.[0]?.url || '',
        qty: 1,
      })
    );
    toast.success(`Added ${product.name} to cart!`);
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Compare Products</span>
        </nav>

        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink uppercase tracking-tight mb-3">
            COMPARE STREETWEAR SPECIFICATIONS
          </h1>
          <p className="text-xs text-muted max-w-2xl leading-relaxed">
            Compare premium heavyweight fits side-by-side to find your perfect style and size.
          </p>
        </div>

        {compareList.length === 0 ? (
          <div className="bg-stone border border-line rounded-xl p-16 text-center space-y-4 max-w-xl mx-auto my-8">
            <Scale className="w-12 h-12 mx-auto text-muted" />
            <h3 className="text-sm font-extrabold text-ink uppercase">NO PRODUCTS SELECTED</h3>
            <p className="text-xs text-muted">
              Add products to comparison from the catalog search list to compare their specifications side-by-side.
            </p>
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-ink uppercase mb-2">Quick Add to Compare:</label>
              <div className="flex flex-wrap gap-2 justify-center">
                {products.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddCompare(p)}
                    className="px-3 py-1.5 bg-paper border border-line text-[11px] font-semibold text-ink rounded hover:bg-stone transition-all"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {/* Row Header Labels Column */}
            <div className="hidden md:block bg-stone border border-line rounded-lg p-5 mt-[340px] space-y-8 text-xs font-bold text-ink uppercase tracking-wider">
              <div className="h-6">SKU Code</div>
              <div className="h-6">Base Price</div>
              <div className="h-6">Fit Type</div>
              <div className="h-6">Fabric Material</div>
              <div className="h-6">Rating</div>
              <div className="h-6">Availability</div>
            </div>

            {/* Compared Product Columns */}
            {compareList.map((p) => {
              const image = p.images?.[0]?.url || '';
              return (
                <div key={p.id} className="bg-paper border border-line rounded-xl p-5 relative space-y-6">
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveCompare(p.id)}
                    className="absolute top-3 right-3 bg-stone rounded-full p-1 text-muted hover:text-ink transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Product card overview */}
                  <div className="space-y-3">
                    <img src={image} alt={p.name} className="w-full h-64 object-cover rounded-lg border border-line" />
                    <h3 className="font-extrabold text-sm text-ink uppercase tracking-tight truncate">{p.name}</h3>
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded flex items-center justify-center gap-1.5 hover:bg-ink/90 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> ADD TO CART
                    </button>
                  </div>

                  {/* Compare specifications */}
                  <div className="space-y-8 text-xs text-ink md:space-y-8 md:pt-4">
                    <div className="border-t border-line/50 pt-2">
                      <span className="font-bold text-[9px] text-muted uppercase block md:hidden">SKU</span>
                      <span className="font-mono">{p.sku}</span>
                    </div>

                    <div className="border-t border-line/50 pt-2">
                      <span className="font-bold text-[9px] text-muted uppercase block md:hidden">Price</span>
                      <span className="font-bold">₹{p.basePrice.toLocaleString()}</span>
                    </div>

                    <div className="border-t border-line/50 pt-2">
                      <span className="font-bold text-[9px] text-muted uppercase block md:hidden">Fit</span>
                      <span>{p.fit || 'Oversized Fit'}</span>
                    </div>

                    <div className="border-t border-line/50 pt-2">
                      <span className="font-bold text-[9px] text-muted uppercase block md:hidden">Fabric</span>
                      <span>{p.material || 'Organic Cotton'}</span>
                    </div>

                    <div className="border-t border-line/50 pt-2">
                      <span className="font-bold text-[9px] text-muted uppercase block md:hidden">Rating</span>
                      <span className="font-semibold">{p.rating} / 5</span>
                    </div>

                    <div className="border-t border-line/50 pt-2">
                      <span className="font-bold text-[9px] text-muted uppercase block md:hidden">Availability</span>
                      <span className="text-emerald-700 font-bold">In Stock</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
