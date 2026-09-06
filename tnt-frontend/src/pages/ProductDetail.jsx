import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import ProductCard from '../components/product/ProductCard';
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  Truck, 
  RotateCcw, 
  Ruler, 
  X, 
  AlertTriangle, 
  Maximize2, 
  ShieldCheck, 
  Banknote, 
  Plus, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../store/cartSlice';
import { toggleWishlist, selectIsWishlisted } from '../store/wishlistSlice';
import { selectCurrencySymbol } from '../store/settingsSlice';
import { productApi } from '../api/services';

export default function ProductDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currencySymbol = useSelector(selectCurrencySymbol) || '₹';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('DESCRIPTION');

  // Complete The Look selected addon products
  const [lookAddons, setLookAddons] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const [res, catalogRes] = await Promise.all([
          productApi.getProductBySlug(slug),
          productApi.getProducts({ limit: 20 })
        ]);

        if (res.success && res.product) {
          const prod = res.product;
          setProduct(prod);

          const imgs = (prod.images && prod.images.length > 0)
            ? prod.images.map((i) => (typeof i === 'string' ? i : i.url))
            : [prod.coverImage || prod.image].filter(Boolean);

          setSelectedImage(imgs[0] || '');
          
          if (prod.variants && prod.variants.length > 0) {
            setSelectedColor(prod.variants[0].color?.name || prod.variants[0].colorName || '');
            setSelectedSize(prod.variants[0].size?.name || prod.variants[0].sizeName || 'M');
          } else {
            setSelectedSize('M');
          }
        }

        const catProducts = catalogRes.products || catalogRes.data?.products || catalogRes.data || [];
        if (Array.isArray(catProducts)) {
          setAllProducts(catProducts);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const isWishlisted = useSelector(selectIsWishlisted(product?.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-muted mb-3" />
        <h2 className="text-xl font-bold uppercase text-ink">Product Not Found</h2>
        <p className="text-xs text-muted max-w-sm mb-4">The item you are searching for might have been moved or removed.</p>
        <Link to="/products" className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase rounded">
          EXPLORE CATALOG
        </Link>
      </div>
    );
  }

  const pName = product.name;
  const pPrice = product.basePrice || product.price || 0;
  
  const imagesList = (product.images && product.images.length > 0)
    ? product.images.map((i) => (typeof i === 'string' ? i : i.url))
    : [product.coverImage || product.image].filter(Boolean);

  const categoryName = product.categories?.[0]?.name || product.category?.name || 'Collection';
  const collectionName = product.collection?.name || 'All Products';

  // Extract REAL colors from DB variants
  const availableColors = product.variants
    ? Array.from(
        new Map(
          product.variants
            .map((v) => [v.color?.name || v.colorName, v.color])
            .filter(([name, c]) => name && c)
        ).values()
      )
    : [];

  // Extract REAL sizes from DB variants
  const availableSizes = product.variants
    ? Array.from(
        new Set(
          product.variants
            .map((v) => v.size?.name || v.sizeName)
            .filter(Boolean)
        )
      )
    : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Real Reviews and Ratings
  const reviewsList = product.reviews || [];
  const reviewsCount = reviewsList.length || product.reviewCount || 0;
  const avgRating = reviewsList.length > 0
    ? (reviewsList.reduce((sum, r) => sum + (r.rating || 5), 0) / reviewsList.length).toFixed(1)
    : (product.rating ? Number(product.rating).toFixed(1) : null);

  // Complete the look dynamic products
  const lookAddonsList = allProducts.filter((p) => p.id !== product.id).slice(0, 4);
  const totalLookAddonPrice = lookAddons.reduce((sum, item) => sum + (item.basePrice || item.price || 0), 0);

  const handleAddToCart = () => {
    dispatch(
      addItem({
        productId: product.id,
        variantId: product.id + '-' + (selectedColor || 'def') + '-' + selectedSize,
        name: product.name,
        price: pPrice,
        color: selectedColor || 'Default',
        size: selectedSize || 'M',
        image: selectedImage || imagesList[0] || '',
        qty: quantity,
      })
    );
    toast.success(`Added ${product.name} to cart!`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const toggleLookAddon = (item) => {
    if (lookAddons.some((a) => a.id === item.id)) {
      setLookAddons(lookAddons.filter((a) => a.id !== item.id));
    } else {
      setLookAddons([...lookAddons, item]);
    }
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2 font-medium">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>&gt;</span>
          <Link to="/collections" className="hover:text-ink transition-colors">{collectionName}</Link>
          <span>&gt;</span>
          <span className="hover:text-ink transition-colors">{categoryName}</span>
          <span>&gt;</span>
          <span className="text-ink font-bold">{pName}</span>
        </nav>

        {/* Product Display Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
          
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 flex flex-col md:flex-row gap-4 items-start">
            
            {/* Thumbnail Strip */}
            {imagesList.length > 1 && (
              <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto no-scrollbar max-h-[560px] shrink-0">
                {imagesList.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={'w-16 h-20 rounded-lg overflow-hidden border transition-all relative shrink-0 ' + (selectedImage === imgUrl ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-ink/50')}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Box */}
            <div className="relative flex-1 aspect-[3/4] bg-stone border border-line rounded-2xl overflow-hidden shadow-xs w-full">
              {product.isNewArrival && (
                <span className="absolute top-4 left-4 z-10 bg-ink text-paper text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                  NEW ARRIVAL
                </span>
              )}

              {selectedImage && (
                <button
                  onClick={() => window.open(selectedImage, '_blank')}
                  className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-paper/90 backdrop-blur-xs border border-line flex items-center justify-center text-ink hover:bg-stone transition-all"
                  title="Fullscreen Image"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}

              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={pName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted font-bold text-sm bg-stone">
                  {pName}
                </div>
              )}

              <button
                onClick={() => setSizeGuideOpen(true)}
                className="absolute bottom-4 right-4 z-10 text-[10px] font-extrabold text-ink underline hover:opacity-80 bg-paper/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-line shadow-xs flex items-center gap-1"
              >
                View Size Guide ↗
              </button>
            </div>

          </div>

          {/* Right Column: Details & Actions */}
          <div className="lg:col-span-5 space-y-6">
            
            <div>
              {product.isNewArrival && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted block mb-1">
                  NEW ARRIVAL
                </span>
              )}
              <h1 className="text-3xl font-black text-ink uppercase tracking-tight leading-tight">
                {pName}
              </h1>
              {product.fabric && (
                <p className="text-xs font-semibold text-muted mt-1">{product.fabric}</p>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-ink">{currencySymbol}{pPrice.toLocaleString()}</span>
              <span className="text-[10px] text-muted font-semibold">Inclusive of all taxes</span>
            </div>

            {/* Rating Summary */}
            <div className="flex items-center gap-2 pt-1 border-y border-line py-3">
              <div className="flex text-ink">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={'w-3.5 h-3.5 ' + (avgRating && i < Math.round(Number(avgRating)) ? 'fill-ink text-ink' : 'text-line')} 
                  />
                ))}
              </div>
              <span className="text-xs font-black text-ink">
                {avgRating ? avgRating : 'No reviews yet'}
              </span>
              {reviewsCount > 0 && (
                <span className="text-xs text-muted font-medium">({reviewsCount} {reviewsCount === 1 ? 'Review' : 'Reviews'})</span>
              )}
              <span className="ml-auto text-[10px] font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" /> Verified Purchase
              </span>
            </div>

            {/* Real Colors Selector */}
            {availableColors.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="uppercase text-muted text-[10px]">COLOR: <span className="text-ink">{selectedColor}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  {availableColors.map((c) => (
                    <button
                      key={c.id || c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={'w-7 h-7 rounded-full border transition-all relative flex items-center justify-center ' + (selectedColor === c.name ? 'ring-2 ring-ink ring-offset-2' : 'border-line hover:scale-105')}
                      style={{ backgroundColor: c.hexCode || '#111111' }}
                      title={c.name}
                    >
                      {selectedColor === c.name && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.hexCode === '#FFFFFF' ? '#111' : '#fff' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Real Size Selector */}
            {availableSizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="uppercase text-muted text-[10px] font-bold">SIZE:</span>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[10px] font-bold text-ink underline hover:opacity-80"
                  >
                    Size Guide
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {availableSizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={'py-2.5 text-xs font-black rounded-lg border transition-all uppercase ' + (selectedSize === sz ? 'border-ink bg-ink text-paper shadow-xs' : 'border-line text-ink hover:border-ink/50')}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Estimation */}
            <div className="p-3.5 bg-stone/30 border border-line rounded-xl flex items-center gap-3 text-xs">
              <Truck className="w-5 h-5 text-ink flex-shrink-0" />
              <div>
                <p className="font-extrabold text-ink text-[11px]">Free Shipping on orders above {currencySymbol}1,999</p>
                <p className="text-[10px] text-muted font-medium">Standard Delivery in 3-5 business days</p>
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-ink text-paper text-xs font-black uppercase tracking-widest rounded-xl hover:bg-ink/90 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> ADD TO CART
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 border border-line text-ink text-xs font-black uppercase tracking-widest rounded-xl hover:bg-stone transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> BUY NOW
              </button>
            </div>

            {/* 3 Trust Badges Row */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-muted font-medium border-t border-line">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-ink flex-shrink-0" />
                <div>
                  <p className="font-extrabold text-ink leading-tight">14-Day Returns</p>
                  <p className="text-[9px]">Easy returns policy</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-ink flex-shrink-0" />
                <div>
                  <p className="font-extrabold text-ink leading-tight">Secure Payment</p>
                  <p className="text-[9px]">100% protected</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-ink flex-shrink-0" />
                <div>
                  <p className="font-extrabold text-ink leading-tight">Cash on Delivery</p>
                  <p className="text-[9px]">Available</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Tabs Section: DESCRIPTION & DETAILS */}
        <div className="border-t border-line pt-10 mb-16">
          <div className="flex gap-8 border-b border-line pb-3 overflow-x-auto no-scrollbar text-xs font-bold uppercase tracking-wider mb-8">
            {['DESCRIPTION', 'DETAILS', 'SHIPPING & RETURNS'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={'pb-3 relative transition-all whitespace-nowrap ' + (activeTab === tab ? 'text-ink font-black border-b-2 border-ink' : 'text-muted hover:text-ink')}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {activeTab === 'DESCRIPTION' && (
                <p className="text-xs text-muted leading-relaxed font-medium">
                  {product.description || 'Crafted with premium materials for comfort and style.'}
                </p>
              )}
              {activeTab === 'DETAILS' && (
                <div className="space-y-2 text-xs text-muted">
                  <p><span className="font-bold text-ink">SKU:</span> {product.sku || product.id}</p>
                  <p><span className="font-bold text-ink">Category:</span> {categoryName}</p>
                  <p><span className="font-bold text-ink">Collection:</span> {collectionName}</p>
                </div>
              )}
              {activeTab === 'SHIPPING & RETURNS' && (
                <div className="space-y-2 text-xs text-muted">
                  <p>Orders are shipped within 24-48 hours. Free shipping available on orders above {currencySymbol}1,999.</p>
                  <p>14-day hassle-free returns and exchanges.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* YOU MIGHT ALSO LIKE Carousel */}
        {allProducts.length > 1 && (
          <div className="border-t border-line pt-12 mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase tracking-wider text-ink">YOU MIGHT ALSO LIKE</h2>
              <Link to="/products" className="text-[10px] font-extrabold uppercase text-ink hover:underline flex items-center gap-1">
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {allProducts.filter(p => p.id !== product.id).slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* COMPLETE THE LOOK Section with Real Products */}
        {lookAddonsList.length > 0 && (
          <div className="border-t border-line pt-12 mb-16 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-wider text-ink">COMPLETE THE LOOK</h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Addon Items Row (9 cols) */}
              <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {lookAddonsList.map((item) => {
                  const isSelected = lookAddons.some((a) => a.id === item.id);
                  const img = item.image || item.images?.[0]?.url || item.coverImage || '';
                  const priceVal = item.basePrice || item.price || 0;

                  return (
                    <div key={item.id} className="border border-line rounded-xl p-3 bg-paper flex flex-col justify-between space-y-3 relative group">
                      <div className="aspect-square bg-stone rounded-lg overflow-hidden border border-line">
                        <img src={img} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-[11px] text-ink truncate">{item.name}</p>
                        <p className="font-black text-xs text-ink">{currencySymbol}{priceVal.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => toggleLookAddon(item)}
                        className={'w-full py-1.5 border rounded-lg text-xs font-bold flex items-center justify-center transition-all ' + (isSelected ? 'bg-ink text-paper border-ink' : 'border-line text-ink hover:bg-stone')}
                      >
                        {isSelected ? '✓ Added' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Total Box (3 cols) */}
              <div className="lg:col-span-3 border border-line rounded-xl p-5 bg-stone/20 space-y-4 text-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-muted tracking-wider">TOTAL PRICE</p>
                  <p className="text-2xl font-black text-ink mt-0.5">
                    {currencySymbol}{(pPrice + totalLookAddonPrice).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart();
                    lookAddons.forEach((a) => {
                      const img = a.image || a.images?.[0]?.url || '';
                      const priceVal = a.basePrice || a.price || 0;
                      dispatch(addItem({ productId: a.id, variantId: a.id + '-default', name: a.name, price: priceVal, image: img, qty: 1 }));
                    });
                    toast.success('Added complete look to cart!');
                  }}
                  className="w-full py-3.5 bg-ink text-paper text-xs font-black uppercase tracking-wider rounded-lg hover:bg-ink/90 transition-all shadow-sm"
                >
                  ADD ALL TO CART
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Trust Strip */}
      <TrustStrip />

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="text-xs font-black uppercase text-ink tracking-wider">SIZE GUIDE (INCHES)</h3>
              <button onClick={() => setSizeGuideOpen(false)} className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-line bg-stone/40 text-ink">
                    <th className="p-2 font-black">SIZE</th>
                    <th className="p-2 font-black">CHEST</th>
                    <th className="p-2 font-black">LENGTH</th>
                    <th className="p-2 font-black">SHOULDER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-muted">
                  <tr><td className="p-2 font-bold text-ink">XS</td><td className="p-2">38"</td><td className="p-2">27"</td><td className="p-2">19"</td></tr>
                  <tr><td className="p-2 font-bold text-ink">S</td><td className="p-2">40"</td><td className="p-2">28"</td><td className="p-2">20"</td></tr>
                  <tr><td className="p-2 font-bold text-ink">M</td><td className="p-2">42"</td><td className="p-2">29"</td><td className="p-2">21"</td></tr>
                  <tr><td className="p-2 font-bold text-ink">L</td><td className="p-2">44"</td><td className="p-2">30"</td><td className="p-2">22"</td></tr>
                  <tr><td className="p-2 font-bold text-ink">XL</td><td className="p-2">46"</td><td className="p-2">31"</td><td className="p-2">23"</td></tr>
                  <tr><td className="p-2 font-bold text-ink">XXL</td><td className="p-2">48"</td><td className="p-2">32"</td><td className="p-2">24"</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
