import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem, updateQty, clearCart } from '../store/cartSlice';
import TrustStrip from '../components/common/TrustStrip';
import { Trash2, ArrowRight, ShoppingBag, Tag, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const freeShippingThreshold = 1999;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Shopping Cart</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-ink uppercase tracking-tight mb-8">
          YOUR CART ({cartItems.length})
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16 bg-stone border border-line rounded-xl max-w-xl mx-auto">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted mb-4" />
            <h2 className="text-xl font-bold text-ink uppercase mb-2">Your cart is currently empty</h2>
            <p className="text-xs text-muted mb-6">Looks like you haven't added any luxury streetwear pieces yet.</p>
            <Link
              to="/products"
              className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 inline-block"
            >
              EXPLORE COLLECTION
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Items Table */}
            <div className="flex-1 space-y-6">
              {/* Free Shipping Progress Bar */}
              <div className="p-4 bg-stone border border-line rounded-lg">
                <div className="text-xs font-bold text-ink mb-1 flex justify-between">
                  <span>
                    {subtotal >= freeShippingThreshold
                      ? '✓ You qualify for FREE Standard Shipping!'
                      : `Add ₹${(freeShippingThreshold - subtotal).toLocaleString()} more for FREE Shipping`}
                  </span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-paper border border-line h-2 rounded-full overflow-hidden">
                  <div className="bg-ink h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-line border border-line rounded-lg bg-paper overflow-hidden">
                {cartItems.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-24 object-cover rounded bg-stone border border-line shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-ink text-sm">{item.name}</h3>
                        <p className="text-xs text-muted">{item.color} | {item.size}</p>
                        <p className="text-xs font-extrabold text-ink mt-1">₹{item.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-line rounded bg-stone px-2 py-1">
                        <button
                          onClick={() => dispatch(updateQty({ productId: item.productId, variantId: item.variantId, qty: item.qty - 1 }))}
                          className="px-2 font-bold text-ink"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold">{item.qty}</span>
                        <button
                          onClick={() => dispatch(updateQty({ productId: item.productId, variantId: item.variantId, qty: item.qty + 1 }))}
                          className="px-2 font-bold text-ink"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-sm text-ink">₹{(item.price * item.qty).toLocaleString()}</div>
                      </div>

                      <button
                        onClick={() => {
                          dispatch(removeItem({ productId: item.productId, variantId: item.variantId }));
                          toast.success('Removed item from cart');
                        }}
                        className="text-muted hover:text-red-600 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Summary */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-paper border border-line rounded-lg p-6 sticky top-24 space-y-6">
                <h3 className="font-extrabold text-ink uppercase text-xs tracking-wider border-b border-line pb-3">
                  ORDER SUMMARY
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span className="font-bold text-ink">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Estimated Shipping</span>
                    <span className="font-bold text-emerald-700">
                      {subtotal >= freeShippingThreshold ? 'FREE' : '₹99'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-ink pt-3 border-t border-line">
                    <span>Total Amount</span>
                    <span className="text-lg">₹{subtotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-all flex items-center justify-center gap-2"
                >
                  PROCEED TO CHECKOUT <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
