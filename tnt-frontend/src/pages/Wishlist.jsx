import { useState } from 'react';
import { Link } from 'react-router-dom';
import AccountSidebar from '../components/layout/AccountSidebar';
import TrustStrip from '../components/common/TrustStrip';
import { Share2, ShoppingBag, Heart, ArrowRight, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../store/cartSlice';
import { removeFromWishlist, toggleWishlist } from '../store/wishlistSlice';

export default function Wishlist() {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const currencySymbol = useSelector((state) => state.settings?.currencySymbol || '₹');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleMoveAllToCart = () => {
    if (wishlistItems.length === 0) {
      toast.error('Your wishlist is empty');
      return;
    }
    wishlistItems.forEach((item) => {
      dispatch(
        addItem({
          productId: item.id || item.productId,
          variantId: (item.id || item.productId) + '-default',
          name: item.name || item.productName || 'Streetwear Product',
          price: item.basePrice || item.price || 999,
          image: item.images?.[0]?.url || item.coverImage || item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
          qty: 1,
        })
      );
    });
    toast.success('Moved all items to cart!');
  };

  const handleRemove = (item) => {
    dispatch(removeFromWishlist({ productId: item.id || item.productId }));
    toast.success('Item removed from wishlist');
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2 font-medium">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>&gt;</span>
          <Link to="/account/dashboard" className="hover:text-ink transition-colors">My Account</Link>
          <span>&gt;</span>
          <span className="text-ink font-bold">Wishlist</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AccountSidebar />

          <main className="flex-1 w-full space-y-6">
            
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-4 gap-4">
              <div>
                <h1 className="text-2xl font-black text-ink uppercase tracking-tight">
                  MY WISHLIST ({wishlistItems.length})
                </h1>
                <p className="text-xs text-muted mt-0.5">Items you love, right here. Don't let them go!</p>
              </div>

              {wishlistItems.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="px-4 py-2 border border-line text-xs font-bold text-ink rounded-lg hover:bg-stone transition-all flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" /> SHARE WISHLIST
                  </button>
                  <button
                    onClick={handleMoveAllToCart}
                    className="px-4 py-2 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ink/90 transition-all flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" /> MOVE ALL TO CART
                  </button>
                </div>
              )}
            </div>

            {/* Product Cards Grid / Empty State */}
            {wishlistItems.length === 0 ? (
              <div className="border border-line rounded-xl p-16 text-center space-y-4 bg-paper max-w-lg mx-auto my-8">
                <div className="w-16 h-16 rounded-full bg-stone border border-line flex items-center justify-center text-ink mx-auto mb-2">
                  <Heart className="w-8 h-8 text-muted/60" />
                </div>
                <h3 className="text-sm font-black text-ink uppercase">YOUR WISHLIST IS EMPTY</h3>
                <p className="text-xs text-muted leading-relaxed">
                  You haven't added any products to your wishlist yet. Click the heart icon on any product to save it here.
                </p>
                <Link
                  to="/products"
                  className="px-6 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded-lg inline-block"
                >
                  EXPLORE PRODUCTS
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                {wishlistItems.map((item) => {
                  const pId = item.id || item.productId;
                  const pName = item.name || item.productName || 'Streetwear Item';
                  const pPrice = item.basePrice || item.price || 999;
                  const pImage = item.images?.[0]?.url || item.coverImage || item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500';
                  
                  return (
                    <div
                      key={pId}
                      className="group bg-paper border border-line rounded-xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-all relative"
                    >
                      {/* Heart Remove Button */}
                      <button
                        onClick={() => handleRemove(item)}
                        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-paper/90 flex items-center justify-center border border-line hover:bg-red-50 text-red-600 shadow-xs"
                        title="Remove from wishlist"
                      >
                        <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                      </button>

                      <Link to={'/product/' + (item.slug || pId)} className="block">
                        {/* Product Image */}
                        <div className="aspect-[3/4] bg-stone overflow-hidden relative">
                          <img
                            src={pImage}
                            alt={pName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="p-3 space-y-1">
                          <h3 className="font-extrabold text-xs text-ink truncate leading-snug">{pName}</h3>
                          <p className="text-[10px] text-muted">{item.variantInfo || 'Standard'}</p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-black text-ink">{currencySymbol}{pPrice.toLocaleString()}</span>
                          </div>

                          <div className="text-[9px] font-bold text-green-600 flex items-center gap-1 pt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> In Stock
                          </div>
                        </div>
                      </Link>

                      {/* Card Action Buttons */}
                      <div className="p-3 pt-0 space-y-1.5">
                        <button
                          onClick={() => {
                            dispatch(addItem({ productId: pId, variantId: pId + '-default', name: pName, price: pPrice, image: pImage, qty: 1 }));
                            toast.success('Added ' + pName + ' to cart!');
                          }}
                          className="w-full py-2 bg-ink text-paper text-[10px] font-extrabold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 hover:bg-ink/90 transition-all"
                        >
                          <ShoppingBag className="w-3 h-3" /> ADD TO CART
                        </button>
                        <button
                          onClick={() => {
                            dispatch(addItem({ productId: pId, variantId: pId + '-default', name: pName, price: pPrice, image: pImage, qty: 1 }));
                            window.location.href = '/checkout';
                          }}
                          className="w-full py-1.5 border border-line text-ink text-[10px] font-extrabold uppercase tracking-wider rounded flex items-center justify-center gap-1 hover:bg-stone transition-all"
                        >
                          <Zap className="w-3 h-3" /> QUICK BUY
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Callout Banner */}
            {wishlistItems.length > 0 && (
              <div className="border border-line rounded-xl p-5 bg-stone/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-ink shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs uppercase text-ink">Still thinking?</h3>
                    <p className="text-[11px] text-muted mt-0.5">Items in your wishlist are saved, but they may sell out soon.</p>
                  </div>
                </div>
                <Link
                  to="/products"
                  className="px-6 py-2.5 bg-ink text-paper text-xs font-black uppercase tracking-wider rounded-lg hover:bg-ink/90 transition-colors"
                >
                  CONTINUE SHOPPING
                </Link>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Share Wishlist Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-xl p-6 max-w-md w-full border border-line shadow-2xl relative text-center">
            <button onClick={() => setShareModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black text-ink uppercase mb-2">SHARE YOUR WISHLIST</h3>
            <p className="text-xs text-muted mb-4">Copy the unique link below to share your curated wishlist with friends.</p>
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-mono text-ink mb-4 text-center"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Wishlist link copied to clipboard!');
                setShareModalOpen(false);
              }}
              className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded"
            >
              COPY LINK
            </button>
          </div>
        </div>
      )}

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
