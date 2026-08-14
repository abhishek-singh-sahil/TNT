import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import ProductCard from '../components/product/ProductCard';
import { Star, Heart, ShoppingBag, Truck, RotateCcw, Share2, Ruler, X, AlertTriangle, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../store/cartSlice';
import { toggleWishlist } from '../store/wishlistSlice';
import { selectCurrencySymbol } from '../store/settingsSlice';
import { productApi, reviewApi } from '../api/services';

export default function ProductDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const currencySymbol = useSelector(selectCurrencySymbol);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  
  // Policy Drawers
  const [shippingPolicyOpen, setShippingPolicyOpen] = useState(false);
  const [returnPolicyOpen, setReturnPolicyOpen] = useState(false);

  // Write Review form state
  const [reviewForm, setReviewForm] = useState({ title: '', comment: '', rating: 5 });

  // Pincode and Compare States
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [isCompared, setIsCompared] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await productApi.getProductBySlug(slug);
        if (res.success && res.product) {
          setProduct(res.product);
          // Set defaults
          const primaryImg = res.product.images?.find(i => i.isPrimary)?.url || res.product.images?.[0]?.url || '';
          setSelectedImage(primaryImg);
          
          if (res.product.variants && res.product.variants.length > 0) {
            setSelectedColor(res.product.variants[0].color?.name || 'Default');
            setSelectedSize(res.product.variants[0].size?.name || 'M');
          }
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    const saved = JSON.parse(localStorage.getItem('tnt_compare_ids') || '[]');
    setIsCompared(saved.includes(product.id));

    const viewed = JSON.parse(localStorage.getItem('tnt_recently_viewed') || '[]');
    const updated = [product.id, ...viewed.filter(id => id !== product.id)].slice(0, 6);
    localStorage.setItem('tnt_recently_viewed', JSON.stringify(updated));
  }, [product]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await productApi.getProducts({ limit: 100 });
        if (res.success && res.products) {
          setAllProducts(res.products);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCatalog();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-muted" />
        <h2 className="text-xl font-bold uppercase text-ink">Product Not Found</h2>
        <p className="text-xs text-muted max-w-sm">The product page you requested does not exist or has been removed from catalog.</p>
        <Link to="/products" className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase rounded">
          BACK TO PRODUCTS
        </Link>
      </div>
    );
  }

  const handleCompareToggle = () => {
    if (!product) return;
    const saved = JSON.parse(localStorage.getItem('tnt_compare_ids') || '[]');
    let updated;
    if (saved.includes(product.id)) {
      updated = saved.filter(id => id !== product.id);
      toast.success('Removed from comparison');
      setIsCompared(false);
    } else {
      if (saved.length >= 3) {
        toast.error('You can compare a maximum of 3 products at a time!');
        return;
      }
      updated = [...saved, product.id];
      toast.success('Added to comparison');
      setIsCompared(true);
    }
    localStorage.setItem('tnt_compare_ids', JSON.stringify(updated));
  };

  const handleBuyNow = () => {
    const matchedVariant = product.variants?.find(
      (v) => v.color?.name === selectedColor && v.size?.name === selectedSize
    );
    const price = product.basePrice ?? 0;

    dispatch(
      addItem({
        productId: product.id,
        variantId: matchedVariant?.id || `${product.id}-${selectedColor}-${selectedSize}`,
        name: product.name,
        price: price,
        color: selectedColor,
        size: selectedSize,
        image: selectedImage,
        qty: quantity,
      })
    );
    navigate('/checkout');
  };

  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }
    const isExpressEligible = parseInt(pincode) % 2 === 0;
    setPincodeStatus({
      estimatedDays: isExpressEligible ? '2-3 Business Days' : '4-5 Business Days',
      carrier: 'Delhivery / BlueDart',
      codAvailable: true
    });
    toast.success('Delivery coverage checked!');
  };

  const handleAddToCart = () => {
    const matchedVariant = product.variants?.find(
      (v) => v.color?.name === selectedColor && v.size?.name === selectedSize
    );

    const price = product.basePrice ?? 0;

    dispatch(
      addItem({
        productId: product.id,
        variantId: matchedVariant?.id || `${product.id}-${selectedColor}-${selectedSize}`,
        name: product.name,
        price: price,
        color: selectedColor,
        size: selectedSize,
        image: selectedImage,
        qty: quantity,
      })
    );
    toast.success(`Added ${quantity} x ${product.name} to cart!`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }
    try {
      const res = await reviewApi.createReview({
        productId: product.id,
        title: reviewForm.title,
        comment: reviewForm.comment,
        rating: reviewForm.rating,
        variantInfo: `${selectedColor} | ${selectedSize}`
      });
      if (res.success) {
        toast.success('Thank you! Review submitted successfully.');
        setWriteReviewOpen(false);
        setReviewForm({ title: '', comment: '', rating: 5 });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this amazing ${product.name} from TNT Clothing: `;
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const uniqueColors = Array.from(new Set(product.variants?.map(v => v.color?.name).filter(Boolean)));
  const uniqueSizes = Array.from(new Set(product.variants?.map(v => v.size?.name).filter(Boolean)));

  const relatedProducts = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.categories?.some((c) => product.categories?.some((pc) => pc.id === c.id))
    )
    .slice(0, 4);

  const recentlyViewedIds = JSON.parse(localStorage.getItem('tnt_recently_viewed') || '[]');
  const recentlyViewed = allProducts
    .filter((p) => p.id !== product.id && recentlyViewedIds.includes(p.id))
    .slice(0, 4);

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <Link to="/products" className="hover:text-ink">Catalog</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">{product.name}</span>
        </nav>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery with scale hover zoom */}
          <div className="space-y-4">
            <div className="h-[480px] sm:h-[600px] w-full bg-stone border border-line rounded-xl overflow-hidden shadow-sm relative group">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500 cursor-zoom-in"
              />
              <span className="absolute top-4 left-4 bg-ink text-paper text-[10px] font-extrabold uppercase px-3 py-1 rounded">
                PREMIUM FIT
              </span>
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 0 && (
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`w-20 h-24 rounded-lg overflow-hidden border-2 shrink-0 bg-stone transition-all ${
                      selectedImage === img.url ? 'border-ink shadow-md' : 'border-line opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-muted uppercase tracking-wider">SKU: {product.sku}</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-ink uppercase tracking-tight mt-1 mb-2">
                {product.name}
              </h1>

              <div className="flex items-center gap-3">
                <div className="flex text-ink">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-ink text-ink' : 'text-line'}`} />
                  ))}
                </div>
                <span className="text-xs font-bold text-ink">{product.rating} / 5</span>
                <span className="text-xs text-muted">({product.reviews?.length || 0} Reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 border-y border-line py-4">
              {product.discountPercentage > 0 ? (
                <>
                  <span className="text-3xl font-extrabold text-ink">{currencySymbol}{product.finalPrice?.toLocaleString()}</span>
                  <span className="text-lg text-muted line-through">{currencySymbol}{product.basePrice.toLocaleString()}</span>
                  <span
                    className="text-xs font-bold text-paper px-2.5 py-1 rounded"
                    style={{ backgroundColor: product.saleCampaign?.badgeColor || '#ff0000' }}
                  >
                    {product.saleCampaign?.badgeText || `-${product.discountPercentage}%`}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-extrabold text-ink">{currencySymbol}{product.basePrice.toLocaleString()}</span>
                  {product.discountPrice && (
                    <span className="text-lg text-muted line-through">{currencySymbol}{product.discountPrice.toLocaleString()}</span>
                  )}
                </>
              )}
            </div>

            <p className="text-sm text-ink/80 leading-relaxed">{product.description}</p>

            {/* Dynamic Colors */}
            {uniqueColors.length > 0 && (
              <div>
                <span className="block text-xs font-bold uppercase text-ink mb-2">Color: {selectedColor}</span>
                <div className="flex gap-3">
                  {uniqueColors.map((colorName) => {
                    const variant = product.variants?.find(v => v.color?.name === colorName);
                    return (
                      <button
                        key={colorName}
                        onClick={() => setSelectedColor(colorName)}
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedColor === colorName ? 'border-ink scale-110 shadow-sm' : 'border-line'
                        }`}
                        style={{ backgroundColor: variant?.color?.hexCode || '#ccc' }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Sizes */}
            {uniqueSizes.length > 0 && (
              <div>
                <div className="flex justify-between text-xs font-bold uppercase text-ink mb-2">
                  <span>Select Size: {selectedSize}</span>
                  <button onClick={() => setSizeGuideOpen(true)} className="text-muted hover:text-ink flex items-center gap-1 underline">
                    <Ruler className="w-3.5 h-3.5" /> Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {uniqueSizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-14 h-12 rounded-lg border-2 text-sm font-extrabold flex items-center justify-center transition-all ${
                        selectedSize === s ? 'bg-ink text-paper border-ink shadow-md' : 'bg-paper text-ink border-line hover:border-ink'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Share product */}
            <div className="flex items-center gap-3.5 text-xs font-bold text-ink">
              <Share2 className="w-4 h-4" /> SHARE:
              <button onClick={() => handleShare('whatsapp')} className="hover:underline">WhatsApp</button> |
              <button onClick={() => handleShare('facebook')} className="hover:underline">Facebook</button> |
              <button onClick={() => handleShare('link')} className="hover:underline">Copy Link</button>
            </div>

            {/* Add to Cart Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="flex items-center justify-between border border-line rounded-lg bg-stone px-3 py-3 sm:py-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-6 text-base font-bold text-ink">-</button>
                <span className="w-8 text-center text-sm font-bold text-ink">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-6 text-base font-bold text-ink">+</button>
              </div>

              <div className="flex-1 flex gap-2">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 bg-ink text-paper text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ink/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> ADD TO CART
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3 bg-stone border border-line text-ink text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-stone/80 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  BUY NOW
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    dispatch(toggleWishlist({ productId: product.id, name: product.name, price: product.basePrice, image: selectedImage }));
                    toast.success('Updated wishlist!');
                  }}
                  className="p-3 border border-line rounded-lg text-ink hover:bg-stone transition-all"
                  title="Add to Wishlist"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCompareToggle}
                  className="p-3 border border-line rounded-lg text-ink hover:bg-stone transition-all"
                  title="Add to Compare"
                >
                  <Scale className={`w-4 h-4 ${isCompared ? 'text-ink fill-current' : 'text-muted'}`} />
                </button>
              </div>
            </div>

            {/* Fabric & Care and Pincode Check */}
            <div className="space-y-4 border-t border-line pt-6">
              {/* Fabric & Care */}
              <div className="bg-stone p-4 rounded-lg border border-line space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-muted tracking-wider block">Fabric & Care</span>
                <p className="text-xs font-semibold text-ink leading-relaxed">
                  {product.washCare || 'Machine wash cold with like colors. Tumble dry low.'}
                </p>
                <p className="text-[10px] text-muted leading-relaxed font-semibold">
                  Fit Style: {product.fit || 'Oversized Streetwear Fit'}
                </p>
              </div>

              {/* Delivery Estimation Checker */}
              <div className="space-y-2">
                <span className="block text-xs font-bold uppercase text-ink">Delivery Estimate</span>
                <form onSubmit={handlePincodeCheck} className="flex gap-2">
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="Enter 6-digit Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-ink font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-ink text-paper text-xs font-bold uppercase rounded-lg hover:bg-black transition-colors shrink-0"
                  >
                    CHECK
                  </button>
                </form>
                {pincodeStatus && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] text-emerald-800 space-y-0.5 animate-fadeIn">
                    <p className="font-bold">Estimated Delivery: {pincodeStatus.estimatedDays}</p>
                    <p className="text-[10px] text-emerald-700/80 font-medium">Shipped via {pincodeStatus.carrier} (COD {pincodeStatus.codAvailable ? 'Available' : 'Unavailable'})</p>
                  </div>
                )}
              </div>
            </div>

            {/* Accordion Policy Drawer Triggers */}
            <div className="border-t border-line pt-6 space-y-3 text-xs">
              <button
                onClick={() => setShippingPolicyOpen(true)}
                className="w-full p-4 bg-stone rounded-lg border border-line text-left flex justify-between items-center font-bold text-ink"
              >
                <span>SHIPPING POLICY</span>
                <span>→</span>
              </button>
              <button
                onClick={() => setReturnPolicyOpen(true)}
                className="w-full p-4 bg-stone rounded-lg border border-line text-left flex justify-between items-center font-bold text-ink"
              >
                <span>RETURN & EXCHANGE POLICY</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Reviews Section */}
        <div className="border-t border-line pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-extrabold text-ink uppercase">CUSTOMER REVIEWS</h3>
              <p className="text-xs text-muted">{product.rating} out of 5 stars based on verified ratings</p>
            </div>
            <button
              onClick={() => setWriteReviewOpen(true)}
              className="px-5 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90"
            >
              WRITE A REVIEW
            </button>
          </div>

          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-4">
              {product.reviews.map((rev) => (
                <div key={rev.id} className="p-5 bg-stone border border-line rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-ink text-sm">{rev.user?.firstName || 'Anonymous'}</span>
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold ml-2">Verified Buyer</span>
                    </div>
                    <span className="text-xs text-muted">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex text-yellow-500 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-line'}`} />
                    ))}
                  </div>
                  <h4 className="font-bold text-ink text-sm mb-1">{rev.title}</h4>
                  <p className="text-xs text-ink/80">{rev.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted text-center py-6">No reviews submitted yet for this product.</p>
          )}
        </div>
      </div>

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-lg p-6 max-w-md w-full border border-line shadow-2xl relative">
            <button onClick={() => setSizeGuideOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-ink uppercase mb-4">SIZE GUIDE (INCHES)</h3>
            <table className="w-full text-xs text-center border-collapse border border-line">
              <thead>
                <tr className="bg-stone font-bold uppercase">
                  <th className="border border-line p-2">Size</th>
                  <th className="border border-line p-2">Chest</th>
                  <th className="border border-line p-2">Length</th>
                  <th className="border border-line p-2">Shoulder</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-line p-2 font-bold">S</td><td className="border border-line p-2">42"</td><td className="border border-line p-2">28"</td><td className="border border-line p-2">21"</td></tr>
                <tr><td className="border border-line p-2 font-bold">M</td><td className="border border-line p-2">44"</td><td className="border border-line p-2">29"</td><td className="border border-line p-2">22"</td></tr>
                <tr><td className="border border-line p-2 font-bold">L</td><td className="border border-line p-2">46"</td><td className="border border-line p-2">30"</td><td className="border border-line p-2">23"</td></tr>
                <tr><td className="border border-line p-2 font-bold">XL</td><td className="border border-line p-2">48"</td><td className="border border-line p-2">31"</td><td className="border border-line p-2">24"</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {writeReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-lg p-6 max-w-md w-full border border-line shadow-2xl relative space-y-4">
            <button onClick={() => setWriteReviewOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-ink uppercase tracking-wider">Submit Product Review</h3>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Rating</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                >
                  <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ (4/5)</option>
                  <option value="3">⭐⭐⭐ (3/5)</option>
                  <option value="2">⭐⭐ (2/5)</option>
                  <option value="1">⭐ (1/5)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Review Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fit is extremely good!"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Review Comment</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write your review comments here..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-colors"
              >
                SUBMIT REVIEW
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Policy Modal */}
      {shippingPolicyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-lg p-6 max-w-md w-full border border-line shadow-2xl relative space-y-4">
            <button onClick={() => setShippingPolicyOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-ink uppercase tracking-wider">Shipping Policy</h3>
            <div className="text-xs text-muted leading-relaxed space-y-2">
              <p>• Standard domestic delivery delivers in 3-5 business days across India.</p>
              <p>• Express shipping delivers in 1-2 business days (subject to zip availability).</p>
              <p>• Free shipping applies to all shopping carts exceeding ₹1,999.</p>
            </div>
          </div>
        </div>
      )}

      {/* Return Policy Modal */}
      {returnPolicyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-lg p-6 max-w-md w-full border border-line shadow-2xl relative space-y-4">
            <button onClick={() => setReturnPolicyOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-ink uppercase tracking-wider">Return & Exchange Policy</h3>
            <div className="text-xs text-muted leading-relaxed space-y-2">
              <p>• We offer a hassle-free 14-day return and exchange policy from delivery date.</p>
              <p>• Items must be returned in their original packaging with tags intact.</p>
              <p>• Refunds are processed back to your original payment method or UPI wallet within 3 business days of return inspection approval.</p>
            </div>
          </div>
        </div>
      )}

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 border-t border-line pt-12 mt-16 space-y-6">
          <div>
            <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest block">STYLE INSPIRATIONS</span>
            <h3 className="text-xl font-extrabold text-ink uppercase tracking-tight">Related Products</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Products Section */}
      {recentlyViewed.length > 0 && (
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 border-t border-line pt-12 mt-16 space-y-6">
          <div>
            <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest block">RECENTLY VIEWED</span>
            <h3 className="text-xl font-extrabold text-ink uppercase tracking-tight">Your Styling History</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Trust Strip */}
      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
