import { useState } from 'react';
import { Link } from 'react-router-dom';
import AccountSidebar from '../components/layout/AccountSidebar';
import TrustStrip from '../components/common/TrustStrip';
import { Share2, ShoppingBag, Heart, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { addItem } from '../store/cartSlice';

export default function Wishlist() {
  const dispatch = useDispatch();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [wishlistItems, setWishlistItems] = useState([
    {
      id: 'p1',
      name: 'Oversized Minimal Tee',
      variant: 'Jet Black | M',
      price: 1499,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      stock: 'In Stock',
      colors: ['#000000', '#FFFFFF', '#E5D3C0'],
    },
    {
      id: 'p3',
      name: 'Signature Back Print Tee',
      variant: 'White | M',
      price: 1649,
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
      stock: 'In Stock',
      colors: ['#FFFFFF', '#000000'],
    },
    {
      id: 'p2',
      name: 'Essential Beige Hoodie',
      variant: 'Beige | L',
      price: 2199,
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
      stock: 'In Stock',
      colors: ['#E5D3C0', '#000000'],
    },
    {
      id: 'p4',
      name: 'TNT Classic Cap',
      variant: 'Jet Black | One Size',
      price: 899,
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80',
      stock: 'In Stock',
      colors: ['#000000'],
    },
    {
      id: 'p5',
      name: 'TNT Tote Bag',
      variant: 'Black | One Size',
      price: 1299,
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      stock: 'In Stock',
      colors: ['#000000'],
    },
  ]);

  const handleMoveAllToCart = () => {
    wishlistItems.forEach((item) => {
      dispatch(
        addItem({
          productId: item.id,
          variantId: `${item.id}-default`,
          name: item.name,
          price: item.price,
          color: item.variant.split('|')[0].trim(),
          size: item.variant.split('|')[1]?.trim() || 'M',
          image: item.image,
          qty: 1,
        })
      );
    });
    toast.success('Moved all items to cart!');
  };

  const handleRemove = (id) => {
    setWishlistItems(wishlistItems.filter((i) => i.id !== id));
    toast.success('Item removed from wishlist');
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <Link to="/account/dashboard" className="hover:text-ink">My Account</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Wishlist</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Account Sidebar */}
          <AccountSidebar />

          {/* Main Content */}
          <main className="flex-1">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-4 mb-6 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-ink uppercase tracking-tight">
                  MY WISHLIST ({wishlistItems.length})
                </h1>
                <p className="text-xs text-muted">Items you love, right here. Don't let them go!</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="px-4 py-2 border border-line text-xs font-bold text-ink rounded hover:bg-stone transition-all flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> SHARE WISHLIST
                </button>
                <button
                  onClick={handleMoveAllToCart}
                  className="px-4 py-2 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-all flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> MOVE ALL TO CART
                </button>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
              {wishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-paper border border-line rounded-lg overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all relative"
                >
                  {/* Heart Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-paper/90 backdrop-blur-xs flex items-center justify-center border border-line hover:bg-red-50 text-red-500 shadow-xs"
                  >
                    <Heart className="w-4 h-4 fill-red-500" />
                  </button>

                  <div>
                    {/* Image */}
                    <div className="h-72 bg-stone overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-2">
                      <div className="font-extrabold text-ink text-sm uppercase">{item.name}</div>
                      <div className="text-xs text-muted">{item.variant}</div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-base font-extrabold text-ink">₹{item.price.toLocaleString()}</span>
                        <div className="flex gap-1.5">
                          {item.colors.map((hex, idx) => (
                            <span key={idx} className="w-3.5 h-3.5 rounded-full border border-line" style={{ backgroundColor: hex }} />
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> {item.stock}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="p-4 pt-0 space-y-2">
                    <button
                      onClick={() => {
                        dispatch(addItem({ productId: item.id, variantId: `${item.id}-default`, name: item.name, price: item.price, image: item.image, qty: 1 }));
                        toast.success(`Added ${item.name} to cart!`);
                      }}
                      className="w-full py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> ADD TO CART
                    </button>
                    <button
                      onClick={() => {
                        dispatch(addItem({ productId: item.id, variantId: `${item.id}-default`, name: item.name, price: item.price, image: item.image, qty: 1 }));
                        window.location.href = '/checkout';
                      }}
                      className="w-full py-2 border border-line text-ink text-xs font-bold uppercase tracking-wider rounded hover:bg-stone transition-all"
                    >
                      ⚡ QUICK BUY
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Callout Banner */}
            <div className="bg-stone border border-line rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-ink shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-ink text-sm uppercase">Still thinking?</h3>
                  <p className="text-xs text-muted">Items in your wishlist are saved, but they may sell out soon.</p>
                </div>
              </div>
              <Link
                to="/products"
                className="px-6 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </main>
        </div>
      </div>

      {/* Share Wishlist Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-lg p-6 max-w-md w-full border border-line shadow-2xl relative text-center">
            <button onClick={() => setShareModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-ink uppercase mb-2">SHARE YOUR WISHLIST</h3>
            <p className="text-xs text-muted mb-4">Copy the unique link below to share your curated wishlist with friends.</p>
            <input
              type="text"
              readOnly
              value="https://tntclothing.com/wishlist/share/akhtar-raza-9912"
              className="w-full bg-stone border border-line rounded px-3 py-2 text-xs font-mono text-ink mb-4 text-center"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://tntclothing.com/wishlist/share/akhtar-raza-9912');
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
