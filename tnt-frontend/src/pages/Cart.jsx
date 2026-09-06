import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectSettings, selectCurrencySymbol } from '../store/settingsSlice';
import { removeItem, updateQty, clearCart, addItem } from '../store/cartSlice';
import { toggleWishlist } from '../store/wishlistSlice';
import { productApi } from '../api/services';
import TrustStrip from '../components/common/TrustStrip';
import { 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  Heart, 
  X, 
  Plus, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);

  const settings = useSelector(selectSettings);
  const currencySymbol = useSelector(selectCurrencySymbol) || '₹';
  const freeShippingThreshold = settings?.freeShippingMin || 1999;

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  // Free shipping math
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const progressPercent = Math.min(100, Math.max(0, (subtotal / freeShippingThreshold) * 100));
  const amountAway = freeShippingThreshold - subtotal;

  // Recommended products slider
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const sliderRef = useRef(null);

  useEffect(() => {
    // Fetch real products for "YOU MIGHT ALSO LIKE"
    productApi.getProducts({ limit: 10 })
      .then((res) => {
        const list = res.data?.products || res.data || [];
        setRecommendedProducts(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error('Failed to load recommended products', err));
  }, []);

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMoveToWishlist = (item) => {
    dispatch(toggleWishlist({ 
      productId: item.productId, 
      name: item.name, 
      price: item.price, 
      image: item.image 
    }));
    dispatch(removeItem({ productId: item.productId, variantId: item.variantId }));
    toast.success(`Moved ${item.name} to Wishlist!`);
  };

  const handleRemoveItem = (item) => {
    dispatch(removeItem({ productId: item.productId, variantId: item.variantId }));
    toast.success('Removed item from cart');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
      toast.success('Cart cleared');
    }
  };

  // Color Swatch helper map
  const getColorHex = (colorName) => {
    if (!colorName) return null;
    const name = colorName.toLowerCase();
    if (name.includes('black') || name.includes('jet')) return '#111111';
    if (name.includes('white')) return '#FFFFFF';
    if (name.includes('beige') || name.includes('khaki') || name.includes('sand')) return '#D2B48C';
    if (name.includes('olive') || name.includes('green')) return '#556B2F';
    if (name.includes('blue') || name.includes('navy')) return '#000080';
    if (name.includes('grey') || name.includes('gray')) return '#888888';
    if (name.includes('red')) return '#CC0000';
    if (name.includes('brown')) return '#654321';
    return '#CCCCCC';
  };

  const shippingCost = isFreeShipping || subtotal === 0 ? 0 : 99;
  const finalTotal = Math.max(0, subtotal + shippingCost);

  return (
    <div className="bg-[#FFFFFF] min-h-screen pt-4 pb-16 font-sans text-ink">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-4 flex items-center gap-2">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Cart</span>
        </nav>

        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-ink uppercase tracking-tight">
            YOUR CART <span className="font-bold text-ink">({totalCount})</span>
          </h1>

          {/* Dynamic Free Shipping Banner & Bar */}
          {cartItems.length > 0 && (
            <div className="mt-3 max-w-xl">
              <p className="text-xs sm:text-sm text-ink mb-2">
                {isFreeShipping ? (
                  <span className="font-bold text-emerald-600">You're eligible for FREE shipping!</span>
                ) : (
                  <>
                    You're <span className="font-bold">{currencySymbol}{amountAway.toLocaleString()}</span> away from <span className="font-bold text-emerald-600">FREE</span> shipping!
                  </>
                )}
              </p>

              {/* Progress track with floating truck badge */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 bg-gray-200 h-2.5 rounded-full overflow-visible">
                  <div 
                    className="bg-black h-full rounded-full transition-all duration-300 relative" 
                    style={{ width: `${progressPercent}%` }}
                  >
                    {/* Truck Circle Icon Badge */}
                    <div className="absolute -right-3 -top-2 w-6 h-6 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center z-10">
                      <Truck className="w-3.5 h-3.5 text-black" />
                    </div>
                  </div>
                </div>

                <span className="text-xs font-bold text-gray-700 shrink-0">
                  {currencySymbol}{subtotal.toLocaleString()} / {currencySymbol}{freeShippingThreshold.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-stone/50 border border-line rounded-2xl max-w-md mx-auto my-10">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted mb-4 stroke-[1.5]" />
            <h2 className="text-lg font-bold text-ink uppercase mb-2">Your cart is currently empty</h2>
            <p className="text-xs text-muted mb-6">Discover our latest collection and add your favorite items.</p>
            <Link
              to="/products"
              className="px-8 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-md hover:bg-ink/90 inline-block transition-all shadow-sm"
            >
              EXPLORE COLLECTION
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Desktop Table Column Headers Bar */}
              <div className="hidden sm:grid grid-cols-12 bg-[#F4F4F4] text-[11px] font-extrabold text-gray-600 uppercase tracking-wider px-4 py-2.5 rounded-md">
                <div className="col-span-6">PRODUCT</div>
                <div className="col-span-2 text-center">PRICE</div>
                <div className="col-span-2 text-center">QUANTITY</div>
                <div className="col-span-2 text-right">TOTAL</div>
              </div>

              {/* Item Cards List */}
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const hex = getColorHex(item.color);
                  return (
                    <div 
                      key={`${item.productId}-${item.variantId}`}
                      className="border border-gray-200 rounded-lg p-4 sm:p-5 bg-white relative hover:shadow-xs transition-shadow"
                    >
                      {/* Top Right Remove Cross Icon */}
                      <button
                        onClick={() => handleRemoveItem(item)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-black p-1 transition-colors"
                        title="Remove Item"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center">
                        
                        {/* Product Info (Col 6) */}
                        <div className="sm:col-span-6 flex items-center gap-4 w-full">
                          <Link to={`/product/${item.productId}`} className="shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-md bg-stone border border-gray-100"
                            />
                          </Link>

                          <div className="space-y-1.5 min-w-0 flex-1">
                            <Link 
                              to={`/product/${item.productId}`} 
                              className="font-bold text-sm text-ink hover:underline line-clamp-1 block"
                            >
                              {item.name}
                            </Link>

                            <p className="text-xs text-gray-500 font-medium">
                              Color: <span className="text-gray-800">{item.color || 'Default'}</span>
                              <span className="mx-1.5 text-gray-300">|</span> 
                              Size: <span className="text-gray-800">{item.size || 'M'}</span>
                            </p>

                            {/* Color Swatch Circles */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              {hex && (
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block"
                                  style={{ backgroundColor: hex }}
                                  title={item.color}
                                />
                              )}
                            </div>

                            {/* In Stock Badge */}
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold pt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                              <span>In Stock</span>
                            </div>
                          </div>
                        </div>

                        {/* Price (Col 2) */}
                        <div className="sm:col-span-2 text-center hidden sm:block">
                          <span className="font-bold text-sm text-gray-900">
                            {currencySymbol}{item.price.toLocaleString()}
                          </span>
                        </div>

                        {/* Quantity Stepper (Col 2) */}
                        <div className="sm:col-span-2 flex justify-center w-full sm:w-auto">
                          <div className="flex items-center border border-gray-300 rounded-md bg-white px-2 py-1">
                            <button
                              onClick={() => dispatch(updateQty({ productId: item.productId, variantId: item.variantId, qty: item.qty - 1 }))}
                              className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-black font-bold text-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-black">{item.qty}</span>
                            <button
                              onClick={() => dispatch(updateQty({ productId: item.productId, variantId: item.variantId, qty: item.qty + 1 }))}
                              className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-black font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Total (Col 2) */}
                        <div className="sm:col-span-2 text-right w-full sm:w-auto flex sm:block justify-between items-center border-t sm:border-t-0 pt-2 sm:pt-0">
                          <span className="sm:hidden text-xs font-semibold text-gray-500">Total:</span>
                          <span className="font-bold text-sm text-black">
                            {currencySymbol}{(item.price * item.qty).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Move to Wishlist Link on bottom right */}
                      <div className="flex justify-end mt-2 pt-2 border-t border-gray-50">
                        <button
                          onClick={() => handleMoveToWishlist(item)}
                          className="text-[11px] font-semibold text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5" /> Move to Wishlist
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Control Buttons */}
              <div className="flex items-center justify-between pt-4">
                <Link
                  to="/products"
                  className="px-4 py-2 border border-gray-300 rounded-md text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
                </Link>

                <button
                  onClick={handleClearCart}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                </button>
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-4 sticky top-24">
              <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-xs space-y-5">
                
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-black border-b border-gray-100 pb-3">
                  ORDER SUMMARY
                </h2>

                {/* Subtotal breakdown */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({totalCount} {totalCount === 1 ? 'Item' : 'Items'})</span>
                    <span className="font-bold text-black">{currencySymbol}{subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-bold text-emerald-600">
                      {isFreeShipping ? 'FREE' : `${currencySymbol}${shippingCost}`}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-extrabold text-black block">Total</span>
                      <span className="text-[10px] text-gray-400 font-medium">(Inclusive of all taxes)</span>
                    </div>
                    <span className="text-2xl font-black text-black">
                      {currencySymbol}{finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA Buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full py-3.5 bg-black text-white text-xs font-extrabold uppercase tracking-wider rounded-md hover:bg-black/90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    PROCEED TO CHECKOUT <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full py-3 bg-white border border-gray-300 text-black text-xs font-bold rounded-md hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Buy with <span className="font-extrabold text-emerald-700 italic">UPI</span>
                  </button>
                </div>

                {/* Promo Savings Banner */}
                <div className="bg-[#FAF5EE] border border-[#F3E8DA] rounded-lg p-3.5 flex items-start gap-3">
                  <Truck className="w-5 h-5 text-amber-900 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-950">
                      You save {currencySymbol}{isFreeShipping ? '625' : '150'} on this order
                    </p>
                    <p className="text-[11px] text-amber-800/80 font-medium mt-0.5">
                      Add more items to save more!
                    </p>
                  </div>
                </div>

                {/* Guarantee Checklist */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-3 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-black">FREE Shipping</p>
                      <p className="text-[11px] text-gray-500">On orders above {currencySymbol}{freeShippingThreshold}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-black">14-Day Easy Returns</p>
                      <p className="text-[11px] text-gray-500">No questions asked</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-black">Secure Payments</p>
                      <p className="text-[11px] text-gray-500">100% safe & secure</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-black">100% Original Products</p>
                      <p className="text-[11px] text-gray-500">Quality you can trust</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* YOU MIGHT ALSO LIKE Carousel Section */}
        {recommendedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-black">
                YOU MIGHT ALSO LIKE
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollSlider('left')}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollSlider('right')}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slider Container */}
            <div 
              ref={sliderRef}
              className="flex gap-5 overflow-x-auto scrollbar-none pb-4 scroll-smooth"
            >
              {recommendedProducts.map((product) => {
                const img = product.image || product.images?.[0]?.url || '';
                const pPrice = product.price || product.basePrice || 0;
                const isWish = wishlistItems.some(w => w.productId === product.id);

                return (
                  <div 
                    key={product.id} 
                    className="w-48 sm:w-56 shrink-0 group border border-gray-100 rounded-lg p-2.5 bg-white relative hover:shadow-sm transition-all"
                  >
                    <div className="relative aspect-[3/4] bg-stone rounded-md overflow-hidden mb-3">
                      <Link to={`/product/${product.slug || product.id}`}>
                        <img 
                          src={img} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* Wishlist Heart button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          dispatch(toggleWishlist({ productId: product.id, ...product }));
                          toast.success(isWish ? 'Removed from wishlist' : 'Added to wishlist');
                        }}
                        className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full hover:bg-white transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 text-black" fill={isWish ? '#000000' : 'none'} />
                      </button>
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <Link 
                          to={`/product/${product.slug || product.id}`}
                          className="text-xs font-bold text-black line-clamp-1 hover:underline block"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs font-extrabold text-black mt-0.5">
                          {currencySymbol}{pPrice.toLocaleString()}
                        </p>
                      </div>

                      {/* Quick add (+) button */}
                      <button
                        onClick={() => {
                          const variant = product.variants?.[0];
                          dispatch(addItem({
                            productId: product.id,
                            variantId: variant?.id || `${product.id}-default`,
                            name: product.name,
                            price: pPrice,
                            color: variant?.color?.name || 'Default',
                            size: variant?.size?.name || 'M',
                            image: img,
                            qty: 1
                          }));
                          toast.success(`Added ${product.name} to cart!`);
                        }}
                        className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-black hover:text-white hover:border-black transition-colors shrink-0"
                        title="Add to cart"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Feature Strip at Bottom */}
      <div className="mt-16 border-t border-gray-100 pt-8">
        <TrustStrip />
      </div>
    </div>
  );
}
