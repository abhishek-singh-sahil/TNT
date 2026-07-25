import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation, useParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import TrustStrip from '../components/common/TrustStrip';
import { productApi } from '../api/services';
import { Filter, Grid, List, RefreshCw, PackageX } from 'lucide-react';

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const { slug } = useParams();
  const categoryParam = searchParams.get('category');
  const collectionParam = searchParams.get('collection');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedSort, setSelectedSort] = useState('newest');

  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoading(true);
        const gender = pathname.includes('/men') ? 'men' : pathname.includes('/women') ? 'women' : pathname.includes('/accessories') ? 'accessories' : undefined;
        const isNewArrival = pathname.includes('/new-arrivals') ? true : undefined;
        const onSale = pathname.includes('/sale') ? true : undefined;
        const res = await productApi.getProducts({
          category: categoryParam,
          collection: slug || collectionParam,
          sort: selectedSort,
          gender,
          isNewArrival,
          onSale
        });
        if (res.success && res.products) {
          setProducts(res.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch catalog from backend:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, [categoryParam, collectionParam, slug, selectedSort, pathname]);

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Catalog</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink uppercase tracking-tight mb-2">
            PRODUCT CATALOG ({products.length})
          </h1>
          <p className="text-xs text-muted">
            Explore heavyweight streetwear pieces engineered for quality, fit, and style.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-line pb-4 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted font-medium">Showing {products.length} Products</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-paper border border-line text-xs font-semibold text-ink rounded px-3 py-1.5 focus:outline-none"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State or Product Grid */}
        {products.length === 0 ? (
          <div className="bg-stone border border-line rounded-xl p-16 text-center space-y-4 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-paper border border-line flex items-center justify-center text-ink mx-auto mb-2">
              <PackageX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-ink uppercase">
              {pathname.includes('/sale') ? 'NO ACTIVE SALE AVAILABLE' : 'NO PRODUCTS AVAILABLE YET'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {pathname.includes('/sale')
                ? 'There are currently no products under a promotional discount campaign.'
                : 'There are currently no products published in this catalog section. Admin will create and publish products from the Admin Panel.'}
            </p>
            <Link
              to="/admin"
              className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded inline-block mt-2"
            >
              GO TO ADMIN PANEL
            </Link>
          </div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
