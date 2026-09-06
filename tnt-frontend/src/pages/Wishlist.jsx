import { useState } from 'react';
import { Link } from 'react-router-dom';
import AccountSidebar from '../components/layout/AccountSidebar';
import TrustStrip from '../components/common/TrustStrip';
import { Share2, ShoppingBag, Heart, ArrowRight, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../store/cartSlice';

export default function Wishlist() {
  const dispatch = useDispatch();
  const wishlistItemsState = useSelector((state) => state.wishlist?.items || []);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const defaultItems = [
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
  ];

  const [items, setItems] = useState(defaultItems);

  const handleMoveAllToCart = () => {
    items.forEach((item) => {
      dispatch(
        addItem({
          productId: item.id,
          variantId: item.id + '-default',
          name: item.name,
          price: item.price,
          image: item.image,
          qty: 1,
        })
      );
    });
    toast.success('Moved all items to cart!');
  };

  const handleRemove = (id) => {
    setItems(items.filter((i) => i.id !== id));
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
                  MY WISHLIST ({items.length})
                </h1>
                <p className="text-xs text-muted mt-0.5">Items you love, right here. Don't let them go!</p>
              </div>

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
            </div>

            {/* Product Cards Grid (5-cols on desktop layout) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group bg-paper border border-line rounded-xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-all relative"
                >
                  {/* Heart Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-paper/90 flex items-center justify-center border border-line hover:bg-red-50 text-ink shadow-xs"
                  >
                    <Heart className="w-3.5 h-3.5 fill-ink text-ink" />
                  </button>

                  <div>
                    {/* Product Image */}
                    <div className="aspect-[3/4] bg-stone overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="p-3 space-y-1">
                      <h3 className="font-extrabold text-xs text-ink truncate leading-snug">{item.name}</h3>
                      <p className="text-[10px] text-muted">{item.variant}</p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-black text-ink">₹{item.price.toLocaleString()}</span>
                        <div className="flex gap-1">
                          {item.colors.map((hex, idx) => (
                            <span key={idx} className="w-2.5 h-2.5 rounded-full border border-line" style={{ backgroundColor: hex }} />
                          ))}
                        </div>
                      </div>

                      <div className="text-[9px] font-bold text-green-600 flex items-center gap-1 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {item.stock}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="p-3 pt-0 space-y-1.5">
                    <button
                      onClick={() => {
                        dispatch(addItem({ productId: item.id, variantId: item.id + '-default', name: item.name, price: item.price, image: item.image, qty: 1 }));
                        toast.success('Added ' + item.name + ' to cart!');
                      }}
                      className="w-full py-2 bg-ink text-paper text-[10px] font-extrabold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 hover:bg-ink/90 transition-all"
                    >
                      <ShoppingBag className="w-3 h-3" /> ADD TO CART
                    </button>
                    <button
                      onClick={() => {
                        dispatch(addItem({ productId: item.id, variantId: item.id + '-default', name: item.name, price: item.price, image: item.image, qty: 1 }));
                        window.location.href = '/checkout';
                      }}
                      className="w-full py-1.5 border border-line text-ink text-[10px] font-extrabold uppercase tracking-wider rounded flex items-center justify-center gap-1 hover:bg-stone transition-all"
                    >
                      <Zap className="w-3 h-3" /> QUICK BUY
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Callout Banner */}
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
