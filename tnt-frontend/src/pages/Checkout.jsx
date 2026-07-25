import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import { ShieldCheck, Plus, Check, Edit2, QrCode, Lock, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../store/cartSlice';

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const [selectedAddress, setSelectedAddress] = useState('home');
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [promoApplied, setPromoApplied] = useState(true);

  // Default items if cart empty in demo
  const displayItems = cartItems.length > 0 ? cartItems : [
    {
      productId: 'p1',
      name: 'Oversized Minimal Tee',
      variant: 'Jet Black / M',
      price: 1499,
      qty: 1,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80',
    },
    {
      productId: 'p3',
      name: 'Signature Back Print Tee',
      variant: 'White / M',
      price: 1649,
      qty: 1,
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=300&auto=format&fit=crop&q=80',
    },
    {
      productId: 'p2',
      name: 'Essential Beige Hoodie',
      variant: 'Beige / M',
      price: 2199,
      qty: 1,
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&auto=format&fit=crop&q=80',
    },
    {
      productId: 'p4',
      name: 'TNT Classic Cap',
      variant: 'Jet Black / One Size',
      price: 899,
      qty: 1,
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&auto=format&fit=crop&q=80',
    },
  ];

  const subtotal = displayItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = promoApplied ? 625 : 0;
  const shippingFee = selectedShipping === 'express' ? 149 : selectedShipping === 'sameday' ? 249 : 0;
  const total = subtotal - discount + shippingFee;

  const handlePlaceOrder = () => {
    toast.success('Order placed successfully! Redirecting to confirmation...');
    dispatch(clearCart());
    setTimeout(() => {
      navigate('/account/orders/TNT12567/track');
    }, 1500);
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <Link to="/cart" className="hover:text-ink">Cart</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Checkout</span>
        </nav>

        {/* 4-Step Stepper Progress Bar */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-line -translate-y-1/2 z-0" />
            <div className="absolute top-1/2 left-0 w-1/3 h-0.5 bg-ink -translate-y-1/2 z-0" />

            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-ink text-paper font-bold text-xs flex items-center justify-center">
                1
              </div>
              <span className="text-xs font-bold text-ink">Address</span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-stone border-2 border-ink text-ink font-bold text-xs flex items-center justify-center">
                2
              </div>
              <span className="text-xs font-bold text-ink">Shipping</span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-paper border border-line text-muted font-bold text-xs flex items-center justify-center">
                3
              </div>
              <span className="text-xs font-medium text-muted">Payment</span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-paper border border-line text-muted font-bold text-xs flex items-center justify-center">
                4
              </div>
              <span className="text-xs font-medium text-muted">Review</span>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-line pb-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink uppercase tracking-tight">
            CHECKOUT
          </h1>
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4" /> 100% Secure Checkout
          </div>
        </div>

        {/* Form & Order Summary Layout */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Left Column Form */}
          <div className="flex-1 space-y-8">
            {/* Section 1: Delivery Address */}
            <div className="bg-paper border border-line rounded-lg p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink mb-1">
                DELIVERY ADDRESS
              </h2>
              <p className="text-xs text-muted mb-4">Add a new address or select from your saved addresses</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Home Address Card */}
                <div
                  onClick={() => setSelectedAddress('home')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedAddress === 'home' ? 'border-ink bg-stone/50' : 'border-line hover:border-ink/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddress === 'home' ? 'border-ink' : 'border-line'}`}>
                        {selectedAddress === 'home' && <div className="w-2 h-2 rounded-full bg-ink" />}
                      </div>
                      <span className="font-extrabold text-xs text-ink uppercase">Home</span>
                      <span className="bg-ink/10 text-ink text-[10px] font-bold px-2 py-0.5 rounded uppercase">DEFAULT</span>
                    </div>
                    <button className="text-xs text-muted hover:text-ink flex items-center gap-1">
                      <Edit2 className="w-3 h-3" /> EDIT
                    </button>
                  </div>
                  <div className="text-xs text-ink space-y-0.5">
                    <p className="font-bold">Akhtar Raza</p>
                    <p>23, Park Street, Civil Lines</p>
                    <p>Kanpur, Uttar Pradesh - 208001</p>
                    <p>India</p>
                    <p className="text-muted pt-1">+91 98765 43210</p>
                  </div>
                </div>

                {/* Office Address Card */}
                <div
                  onClick={() => setSelectedAddress('office')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedAddress === 'office' ? 'border-ink bg-stone/50' : 'border-line hover:border-ink/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddress === 'office' ? 'border-ink' : 'border-line'}`}>
                        {selectedAddress === 'office' && <div className="w-2 h-2 rounded-full bg-ink" />}
                      </div>
                      <span className="font-extrabold text-xs text-ink uppercase">Office</span>
                    </div>
                    <button className="text-xs text-muted hover:text-ink flex items-center gap-1">
                      <Edit2 className="w-3 h-3" /> EDIT
                    </button>
                  </div>
                  <div className="text-xs text-ink space-y-0.5">
                    <p className="font-bold">Akhtar Raza</p>
                    <p>TNT Clothing Pvt. Ltd., 15, Industrial Area</p>
                    <p>Panki, Kanpur, Uttar Pradesh - 208020</p>
                    <p>Phone: +91 98765 43210</p>
                  </div>
                </div>
              </div>

              <button className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1 hover:underline">
                <Plus className="w-4 h-4" /> Add New Address
              </button>
            </div>

            {/* Section 2: Shipping Method */}
            <div className="bg-paper border border-line rounded-lg p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink mb-4">
                SHIPPING METHOD
              </h2>

              <div className="space-y-3 mb-4">
                {/* Standard */}
                <label
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedShipping === 'standard' ? 'border-ink bg-stone/50' : 'border-line'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping === 'standard'}
                      onChange={() => setSelectedShipping('standard')}
                      className="text-ink focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-ink">Standard Shipping</div>
                      <div className="text-xs text-muted">Delivery in 3-5 business days</div>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs text-emerald-700 uppercase">FREE</span>
                </label>

                {/* Express */}
                <label
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedShipping === 'express' ? 'border-ink bg-stone/50' : 'border-line'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping === 'express'}
                      onChange={() => setSelectedShipping('express')}
                      className="text-ink focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-ink">Express Shipping</div>
                      <div className="text-xs text-muted">Delivery in 1-2 business days</div>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs text-ink">₹149</span>
                </label>

                {/* Same Day */}
                <label
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedShipping === 'sameday' ? 'border-ink bg-stone/50' : 'border-line'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping === 'sameday'}
                      onChange={() => setSelectedShipping('sameday')}
                      className="text-ink focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-ink">Same Day Delivery</div>
                      <div className="text-xs text-muted">Delivery within 24 hours</div>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs text-ink">₹249</span>
                </label>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Yay! You are eligible for FREE Standard Shipping.
              </div>
            </div>

            {/* Section 3: Payment Method */}
            <div className="bg-paper border border-line rounded-lg p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink mb-1">
                PAYMENT METHOD
              </h2>
              <p className="text-xs text-muted mb-4">All transactions are secure and encrypted</p>

              <div className="space-y-3">
                {/* UPI Option */}
                <div className={`border-2 rounded-lg overflow-hidden ${selectedPayment === 'upi' ? 'border-ink' : 'border-line'}`}>
                  <label
                    onClick={() => setSelectedPayment('upi')}
                    className="flex items-center justify-between p-4 cursor-pointer bg-stone/30"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={selectedPayment === 'upi'}
                        onChange={() => setSelectedPayment('upi')}
                        className="text-ink focus:ring-0"
                      />
                      <div>
                        <div className="font-bold text-xs text-ink">UPI</div>
                        <div className="text-xs text-muted">Pay using any UPI app (GPay, PhonePe, Paytm)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-xs text-purple-700">UPI</div>
                  </label>

                  {selectedPayment === 'upi' && (
                    <div className="p-6 border-t border-line bg-paper text-center space-y-4">
                      <p className="text-xs font-semibold text-muted">Scan & pay using any UPI app</p>

                      {/* QR Code Graphic Box with TNT branding */}
                      <div className="w-44 h-44 border-2 border-ink rounded-xl mx-auto p-2 bg-paper flex items-center justify-center shadow-md relative">
                        <img
                          src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=tntclothing@upi&pn=TNT%20Clothing&am=5621"
                          alt="UPI QR Code"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bg-paper border border-ink px-2 py-0.5 rounded font-extrabold text-[10px]">
                          TNT
                        </div>
                      </div>

                      <div className="text-xs text-muted">or enter UPI ID</div>
                      <div className="max-w-xs mx-auto flex gap-2">
                        <input
                          type="text"
                          placeholder="name@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full border border-line rounded px-3 py-2 text-xs focus:outline-none focus:border-ink"
                        />
                        <button
                          onClick={() => toast.success('UPI Payment Request Sent!')}
                          className="px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Credit / Debit Card */}
                <div className={`border-2 rounded-lg overflow-hidden ${selectedPayment === 'card' ? 'border-ink' : 'border-line'}`}>
                  <label
                    onClick={() => setSelectedPayment('card')}
                    className="flex items-center justify-between p-4 cursor-pointer bg-stone/30"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={selectedPayment === 'card'}
                        onChange={() => setSelectedPayment('card')}
                        className="text-ink focus:ring-0"
                      />
                      <div>
                        <div className="font-bold text-xs text-ink">Credit / Debit Card</div>
                        <div className="text-xs text-muted">Visa, Mastercard, RuPay & more</div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Net Banking */}
                <div className={`border-2 rounded-lg overflow-hidden ${selectedPayment === 'netbanking' ? 'border-ink' : 'border-line'}`}>
                  <label
                    onClick={() => setSelectedPayment('netbanking')}
                    className="flex items-center justify-between p-4 cursor-pointer bg-stone/30"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={selectedPayment === 'netbanking'}
                        onChange={() => setSelectedPayment('netbanking')}
                        className="text-ink focus:ring-0"
                      />
                      <div>
                        <div className="font-bold text-xs text-ink">Net Banking</div>
                        <div className="text-xs text-muted">All major Indian banks supported</div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Cash on Delivery */}
                <div className={`border-2 rounded-lg overflow-hidden ${selectedPayment === 'cod' ? 'border-ink' : 'border-line'}`}>
                  <label
                    onClick={() => setSelectedPayment('cod')}
                    className="flex items-center justify-between p-4 cursor-pointer bg-stone/30"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={selectedPayment === 'cod'}
                        onChange={() => setSelectedPayment('cod')}
                        className="text-ink focus:ring-0"
                      />
                      <div>
                        <div className="font-bold text-xs text-ink">Cash on Delivery</div>
                        <div className="text-xs text-muted">Pay cash when your shipment arrives</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-4 p-3 bg-stone rounded text-xs text-muted flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Your payment information is 100% secure with us.
              </div>
            </div>
          </div>

          {/* Right Sticky Order Summary */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-paper border border-line rounded-lg p-6 sticky top-24 space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-extrabold text-ink uppercase text-xs tracking-wider">
                  ORDER SUMMARY ({displayItems.length} Items)
                </h3>
                <Link to="/cart" className="text-xs text-muted hover:text-ink underline">
                  Edit Cart
                </Link>
              </div>

              {/* Items List */}
              <div className="space-y-4 max-h-72 overflow-y-auto no-scrollbar pr-1">
                {displayItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-14 object-cover rounded bg-stone border border-line shrink-0"
                      />
                      <div>
                        <div className="font-bold text-ink">{item.name}</div>
                        <div className="text-[11px] text-muted">{item.variant}</div>
                        <div className="text-[11px] text-muted">Qty: {item.qty}</div>
                      </div>
                    </div>
                    <span className="font-extrabold text-ink shrink-0">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2.5 text-xs pt-4 border-t border-line">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="font-bold text-ink">₹{subtotal.toLocaleString()}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount (WELCOME10)</span>
                    <span className="font-bold">- ₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="font-bold text-emerald-700">
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-ink pt-3 border-t border-line">
                  <span>Total <span className="text-[10px] font-normal text-muted block">(Inclusive of all taxes)</span></span>
                  <span className="text-lg">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Green Savings Callout */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-center text-xs font-bold text-emerald-800">
                🟢 You are saving ₹625 on this order!
              </div>

              {/* Place Order Primary CTA */}
              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" /> PLACE ORDER
              </button>

              <p className="text-[10px] text-muted text-center leading-relaxed">
                By placing this order, you agree to our{' '}
                <Link to="/terms" className="underline">Terms & Conditions</Link> and{' '}
                <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
              </p>

              {/* Trust badges */}
              <div className="pt-4 border-t border-line space-y-2 text-[11px] text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-ink" />
                  <span>Secure Payments - 100% safe & secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-ink" />
                  <span>Easy Returns - 14-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
