import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import { ShieldCheck, Plus, Check, Edit2, Lock, ShoppingBag, ArrowRight, Loader, Truck, RotateCcw, Headset } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../store/cartSlice';
import { selectSettings, selectCurrencySymbol } from '../store/settingsSlice';
import { addressApi, paymentApi, orderApi, marketingApi, adminApi } from '../api/services';

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const settings = useSelector(selectSettings);
  const currencySymbol = useSelector(selectCurrencySymbol);

  const { user } = useSelector((state) => state.auth);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('upi');

  const [upiIdInput, setUpiIdInput] = useState('');

  useEffect(() => {
    if (settings) {
      if (selectedPayment === 'card' && settings.cardEnabled === false) {
        if (settings.upiEnabled ?? true) setSelectedPayment('upi');
        else if (settings.netBankingEnabled ?? true) setSelectedPayment('netbanking');
        else if (settings.codEnabled ?? true) setSelectedPayment('cod');
      }
    }
  }, [settings, selectedPayment]);

  const [shippingZones, setShippingZones] = useState([]);

  useEffect(() => {
    async function loadShippingZones() {
      try {
        const res = await adminApi.getShippingZonesPublic();
        if (res.success && res.zones) {
          setShippingZones(res.zones);
        }
      } catch (err) {
        console.error('Failed to load shipping zones:', err);
      }
    }
    loadShippingZones();
  }, []);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // Default null - no preapplied coupon
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    type: 'Home',
    fullName: '',
    phone: '',
    street: '',
    locality: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await addressApi.getAddresses();
      if (res.success) {
        setAddresses(res.addresses);
        const defAddr = res.addresses.find((a) => a.isDefault) || res.addresses[0];
        if (defAddr) {
          setSelectedAddressId(defAddr.id);
        }
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const displayAddresses = addresses.length > 0 ? addresses : [
    {
      id: 'addr1',
      type: 'Home',
      isDefault: true,
      fullName: user ? (user.firstName + ' ' + (user.lastName || '')).trim() : 'Akhtar Raza',
      street: '23, Park Street, Civil Lines',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208001',
      country: 'India',
      phone: user?.phone || '+91 98765 43210'
    },
    {
      id: 'addr2',
      type: 'Office',
      isDefault: false,
      fullName: user ? (user.firstName + ' ' + (user.lastName || '')).trim() : 'Akhtar Raza',
      street: 'TNT Clothing Pvt. Ltd., 15, Industrial Area, Panki',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208020',
      country: 'India',
      phone: user?.phone || '+91 98765 43210'
    }
  ];

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await addressApi.createAddress({
        ...newAddressForm,
        isDefault: addresses.length === 0
      });
      if (res.success) {
        toast.success('Address added successfully!');
        setShowAddressModal(false);
        setNewAddressForm({
          type: 'Home',
          fullName: '',
          phone: '',
          street: '',
          locality: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India'
        });
        fetchAddresses();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add address');
    }
  };

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
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  const calculateShippingFee = () => {
    if (settings?.freeShippingEnabled && subtotal >= (settings?.freeShippingMin || 1999)) {
      return 0;
    }
    if (selectedShipping === 'express') return 149;
    if (selectedShipping === 'sameday') return 249;
    return 0;
  };

  const shippingFee = calculateShippingFee();
  const codFee = (selectedPayment === 'cod' && (settings?.codEnabled ?? true)) ? (settings?.codCharge ?? 50) : 0;
  const total = subtotal - discount + shippingFee + codFee;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await marketingApi.validateCoupon({
        code: couponCode.trim(),
        cartAmount: subtotal,
        cartItems: displayItems.map(i => ({ productId: i.productId })),
        userId: user?.id
      });
      if (res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        toast.success('Coupon applied successfully!');
      } else {
        setCouponError(res.message || 'Invalid coupon code');
      }
    } catch (err) {
      setCouponError(err.message || 'Validation failed');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    const activeAddress = displayAddresses.find(a => a.id === selectedAddressId) || displayAddresses[0];
    if (!activeAddress) {
      toast.error('Please add and select a shipping address first');
      return;
    }

    if (isPlacingOrder) return;
    setIsPlacingOrder(true);

    try {
      const checkoutItems = displayItems.map((i) => ({
        productVariantId: i.variantId || i.productVariantId || i.id,
        quantity: i.qty || 1,
        productName: i.name,
      }));

      if (selectedPayment === 'cod') {
        toast.loading('Placing your order...');
        const res = await orderApi.createOrder({
          addressId: activeAddress.id,
          items: checkoutItems,
          paymentMethod: 'COD',
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          shippingFee,
        });
        toast.dismiss();
        if (res.success) {
          toast.success('Order placed successfully!');
          dispatch(clearCart());
          navigate('/account/orders/' + res.order.orderNumber + '/track');
        } else {
          toast.error(res.message || 'Failed to place order');
        }
        setIsPlacingOrder(false);
      } else {
        toast.loading('Initializing payment gateway...');
        const orderRes = await paymentApi.createRazorpayOrder({
          amount: total,
          currency: settings?.currency || 'INR',
          receipt: 'rcpt_' + Date.now()
        });
        toast.dismiss();

        if (!orderRes.success) {
          toast.error('Payment gateway initialization failed');
          setIsPlacingOrder(false);
          return;
        }

        const options = {
          key: orderRes.key || settings?.razorpayKeyId,
          amount: orderRes.order.amount,
          currency: orderRes.order.currency,
          name: settings?.siteName || 'TNT Luxury Streetwear',
          description: 'Secure Checkout Payment',
          order_id: orderRes.order.id,
          handler: async function (response) {
            toast.loading('Processing payment verification...');
            try {
              const res = await orderApi.createOrder({
                addressId: activeAddress.id,
                items: checkoutItems,
                paymentMethod: selectedPayment.toUpperCase(),
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                shippingFee,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });
              toast.dismiss();
              if (res.success) {
                toast.success('Payment verified & order placed!');
                dispatch(clearCart());
                navigate('/account/orders/' + res.order.orderNumber + '/track');
              } else {
                toast.error(res.message || 'Payment verification failed');
              }
            } catch (err) {
              toast.dismiss();
              toast.error(err.message || 'Failed to verify online order');
            } finally {
              setIsPlacingOrder(false);
            }
          },
          prefill: {
            name: ((user?.firstName || '') + ' ' + (user?.lastName || '')).trim(),
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: {
            color: '#111111',
          },
          modal: {
            ondismiss: function () {
              setIsPlacingOrder(false);
              toast.error('Payment cancelled by user');
            }
          }
        };

        if (selectedPayment === 'upi') options.prefill.method = 'upi';
        else if (selectedPayment === 'card') options.prefill.method = 'card';
        else if (selectedPayment === 'netbanking') options.prefill.method = 'netbanking';

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'An error occurred during checkout');
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2 font-medium">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>&gt;</span>
          <Link to="/cart" className="hover:text-ink transition-colors">Cart</Link>
          <span>&gt;</span>
          <span className="text-ink font-bold">Checkout</span>
        </nav>

        {/* Header Title + Stepper */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-ink uppercase tracking-tight">CHECKOUT</h1>
            <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4" /> 100% Secure Checkout
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center gap-6 sm:gap-10 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-ink text-paper font-black text-xs flex items-center justify-center">1</div>
              <span className="font-extrabold text-ink">Address</span>
            </div>
            <div className="w-8 h-0.5 bg-line hidden sm:block" />
            <div className="flex items-center gap-2 text-muted">
              <div className="w-7 h-7 rounded-full border border-line bg-paper text-muted font-bold text-xs flex items-center justify-center">2</div>
              <span>Shipping</span>
            </div>
            <div className="w-8 h-0.5 bg-line hidden sm:block" />
            <div className="flex items-center gap-2 text-muted">
              <div className="w-7 h-7 rounded-full border border-line bg-paper text-muted font-bold text-xs flex items-center justify-center">3</div>
              <span>Payment</span>
            </div>
            <div className="w-8 h-0.5 bg-line hidden sm:block" />
            <div className="flex items-center gap-2 text-muted">
              <div className="w-7 h-7 rounded-full border border-line bg-paper text-muted font-bold text-xs flex items-center justify-center">4</div>
              <span>Review</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Form Left (2/3) + Summary Right (1/3) */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Main Left Column */}
          <div className="flex-1 space-y-8">
            
            {/* Section 1: Delivery Address */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-ink mb-1">DELIVERY ADDRESS</h2>
              <p className="text-xs text-muted mb-4">Add a new address or select from your saved addresses</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                {displayAddresses.map((addr) => {
                  const isSelected = (selectedAddressId || displayAddresses[0].id) === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={'p-4 border rounded-xl cursor-pointer transition-all relative ' + (isSelected ? 'border-ink bg-paper shadow-sm' : 'border-line hover:border-ink/50 bg-paper')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={'w-4 h-4 rounded-full border flex items-center justify-center ' + (isSelected ? 'border-ink bg-ink' : 'border-line')}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-paper" />}
                          </div>
                          <span className="font-extrabold text-xs text-ink">{addr.type}</span>
                          {addr.isDefault && (
                            <span className="bg-stone text-muted text-[9px] font-black px-1.5 py-0.5 rounded uppercase">DEFAULT</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted space-y-0.5 leading-relaxed">
                        <p className="font-extrabold text-ink">{addr.fullName}</p>
                        <p>{addr.street}</p>
                        <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
                        <p>{addr.country}</p>
                        <p className="text-[10px] pt-1">Phone: {addr.phone}</p>
                      </div>
                      <button className="absolute bottom-3 right-3 text-[10px] font-bold text-muted hover:text-ink flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> EDIT
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 hover:underline pt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </button>
            </div>

            {/* Section 2: Shipping Method */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-ink mb-4">SHIPPING METHOD</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                {/* Standard */}
                <div
                  onClick={() => setSelectedShipping('standard')}
                  className={'p-4 border rounded-xl cursor-pointer transition-all ' + (selectedShipping === 'standard' ? 'border-ink bg-paper shadow-sm' : 'border-line bg-paper')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={'w-3.5 h-3.5 rounded-full border flex items-center justify-center ' + (selectedShipping === 'standard' ? 'border-ink bg-ink' : 'border-line')}>
                      {selectedShipping === 'standard' && <div className="w-1 h-1 rounded-full bg-paper" />}
                    </div>
                    <span className="font-extrabold text-xs text-ink">Standard Shipping</span>
                  </div>
                  <p className="text-[10px] text-muted pl-5">Delivery in 3-5 business days</p>
                  <p className="text-xs font-black text-green-600 pl-5 mt-2">FREE</p>
                </div>

                {/* Express */}
                <div
                  onClick={() => setSelectedShipping('express')}
                  className={'p-4 border rounded-xl cursor-pointer transition-all ' + (selectedShipping === 'express' ? 'border-ink bg-paper shadow-sm' : 'border-line bg-paper')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={'w-3.5 h-3.5 rounded-full border flex items-center justify-center ' + (selectedShipping === 'express' ? 'border-ink bg-ink' : 'border-line')}>
                      {selectedShipping === 'express' && <div className="w-1 h-1 rounded-full bg-paper" />}
                    </div>
                    <span className="font-extrabold text-xs text-ink">Express Shipping</span>
                  </div>
                  <p className="text-[10px] text-muted pl-5">Delivery in 1-2 business days</p>
                  <p className="text-xs font-black text-ink pl-5 mt-2">₹149</p>
                </div>

                {/* Same Day */}
                <div
                  onClick={() => setSelectedShipping('sameday')}
                  className={'p-4 border rounded-xl cursor-pointer transition-all ' + (selectedShipping === 'sameday' ? 'border-ink bg-paper shadow-sm' : 'border-line bg-paper')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={'w-3.5 h-3.5 rounded-full border flex items-center justify-center ' + (selectedShipping === 'sameday' ? 'border-ink bg-ink' : 'border-line')}>
                      {selectedShipping === 'sameday' && <div className="w-1 h-1 rounded-full bg-paper" />}
                    </div>
                    <span className="font-extrabold text-xs text-ink">Same Day Delivery</span>
                  </div>
                  <p className="text-[10px] text-muted pl-5">Delivery within 24 hours</p>
                  <p className="text-xs font-black text-ink pl-5 mt-2">₹249</p>
                </div>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" /> Yay! You are eligible for <span className="underline">FREE Standard Shipping</span>.
              </div>
            </div>

            {/* Section 3: Payment Method */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-ink mb-1">PAYMENT METHOD</h2>
              <p className="text-xs text-muted mb-4">All transactions are secure and encrypted</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-line rounded-xl p-5 bg-paper">
                {/* Options List */}
                <div className="space-y-3">
                  {[
                    { id: 'upi', label: 'UPI', desc: 'Pay using any UPI app' },
                    { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay & more' },
                    { id: 'netbanking', label: 'Net Banking', desc: 'All major banks supported' },
                    { id: 'wallets', label: 'Wallets', desc: 'Paytm, PhonePe, Amazon Pay & more' },
                    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive' },
                  ].map((method) => {
                    const isSelected = selectedPayment === method.id;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={'p-3.5 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ' + (isSelected ? 'border-ink bg-stone/20' : 'border-line hover:border-ink/40')}
                      >
                        <div className={'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ' + (isSelected ? 'border-ink bg-ink' : 'border-line')}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-paper" />}
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-ink">{method.label}</p>
                          <p className="text-[10px] text-muted">{method.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Clean Payment Info Panel (No QR Code) */}
                <div className="border border-line rounded-xl p-6 bg-stone/10 flex flex-col items-center justify-center text-center space-y-4">
                  {selectedPayment === 'upi' ? (
                    <>
                      <div className="font-black text-xl text-purple-700 font-mono tracking-wider">UPI</div>
                      <p className="text-[11px] text-muted font-medium max-w-xs">Pay instantly using any UPI app (GPay, PhonePe, Paytm, BHIM) via Razorpay secure gateway.</p>

                      <div className="w-full pt-2">
                        <label className="block text-[10px] font-bold text-muted uppercase mb-1">Enter UPI ID (Optional)</label>
                        <input
                          type="text"
                          placeholder="name@upi"
                          value={upiIdInput}
                          onChange={(e) => setUpiIdInput(e.target.value)}
                          className="w-full bg-paper border border-line rounded px-3 py-2 text-xs text-ink text-center focus:outline-none placeholder:text-muted"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="py-8 space-y-2">
                      <Lock className="w-8 h-8 text-muted mx-auto" />
                      <p className="text-xs font-bold text-ink uppercase">Secure Razorpay Gateway</p>
                      <p className="text-[10px] text-muted max-w-xs">You will be redirected to complete payment securely after clicking place order.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 p-3 bg-stone/30 border border-line rounded-lg text-xs text-muted font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Your payment information is 100% secure with us.</span>
              </div>
            </div>

            {/* We Accept Strip */}
            <div className="border-t border-line pt-6 flex flex-wrap items-center justify-between gap-4 text-xs font-extrabold text-muted">
              <span className="uppercase text-[10px] tracking-wider">WE ACCEPT</span>
              <div className="flex flex-wrap gap-4 items-center text-ink">
                <span className="font-black italic">VISA</span>
                <span className="font-black">mastercard</span>
                <span className="font-black">RuPay</span>
                <span className="font-black text-purple-700">UPI</span>
                <span className="font-black">G Pay</span>
                <span className="font-black">Pay</span>
                <span className="font-black text-blue-500">Paytm</span>
                <span className="font-black text-purple-600">PhonePe</span>
                <span className="font-black text-amber-600">amazon pay</span>
              </div>
            </div>

          </div>

          {/* Right Sticky Order Summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="border border-line rounded-xl p-5 bg-paper sticky top-24 space-y-5">
              
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-black text-xs uppercase text-ink tracking-wider">
                  ORDER SUMMARY ({displayItems.length} Items)
                </h3>
                <Link to="/cart" className="text-[10px] font-bold text-muted hover:text-ink underline">
                  Edit Cart
                </Link>
              </div>

              {/* Items List */}
              <div className="space-y-3.5 max-h-64 overflow-y-auto no-scrollbar pr-1">
                {displayItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-14 object-cover rounded bg-stone border border-line flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-extrabold text-ink truncate max-w-[120px]">{item.name}</p>
                        <p className="text-[10px] text-muted">{item.variant}</p>
                        <p className="text-[10px] text-muted">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <span className="font-black text-ink flex-shrink-0">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code Box */}
              <div className="pt-3 border-t border-line space-y-2">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-stone/50 border border-line rounded px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink focus:outline-none placeholder:text-muted placeholder:font-normal"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-3.5 py-2 bg-ink text-paper text-xs font-black uppercase rounded hover:bg-ink/90 disabled:opacity-50"
                  >
                    {couponLoading ? '...' : 'APPLY'}
                  </button>
                </form>
                {couponError && <p className="text-[10px] font-bold text-red-600 uppercase">{couponError}</p>}
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-1.5 rounded text-xs text-green-800 font-bold">
                    <span>Coupon ({appliedCoupon.code}) Applied!</span>
                    <button type="button" onClick={() => setAppliedCoupon(null)} className="text-red-600 text-[10px] underline">Remove</button>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2 text-xs border-t border-line pt-4">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="font-bold text-ink">₹{subtotal.toLocaleString()}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>- ₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="font-extrabold text-green-600">
                    {shippingFee === 0 ? 'FREE' : ('₹' + shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-ink pt-3 border-t border-line">
                  <div>
                    <span>Total</span>
                    <span className="text-[9px] text-muted block font-normal">(Inclusive of all taxes)</span>
                  </div>
                  <span className="text-base font-black">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Green Savings Banner (Only rendered if discount > 0) */}
              {discount > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center text-xs font-bold text-green-800">
                   You are saving ₹{discount.toLocaleString()} on this order!
                </div>
              )}

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full py-3.5 bg-ink text-paper text-xs font-black uppercase tracking-widest rounded-lg hover:bg-ink/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-md"
              >
                {isPlacingOrder ? <Loader className="w-4 h-4 animate-spin" /> : <>🔒 PLACE ORDER</>}
              </button>

              <p className="text-[10px] text-muted text-center leading-relaxed">
                By placing this order, you agree to our{' '}
                <Link to="/terms" className="underline font-bold text-ink">Terms & Conditions</Link> and{' '}
                <Link to="/privacy-policy" className="underline font-bold text-ink">Privacy Policy</Link>.
              </p>

              {/* 2x2 Trust Badges Grid */}
              <div className="border-t border-line pt-4 grid grid-cols-2 gap-3 text-[10px] text-muted font-semibold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-ink flex-shrink-0" />
                  <div>
                    <p className="font-bold text-ink">Secure Payments</p>
                    <p className="text-[9px] text-muted">100% safe & secure</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-ink flex-shrink-0" />
                  <div>
                    <p className="font-bold text-ink">Easy Returns</p>
                    <p className="text-[9px] text-muted">14-day return policy</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-ink flex-shrink-0" />
                  <div>
                    <p className="font-bold text-ink">Free Shipping</p>
                    <p className="text-[9px] text-muted">On orders above ₹1999.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Headset className="w-4 h-4 text-ink flex-shrink-0" />
                  <div>
                    <p className="font-bold text-ink">Customer Support</p>
                    <p className="text-[9px] text-muted">We're here to help.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper border border-line rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="font-extrabold text-ink text-xs uppercase tracking-wider">ADD NEW ADDRESS</h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="text-xs text-muted hover:text-ink font-bold"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">Address Label</label>
                  <select
                    value={newAddressForm.type}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, type: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.fullName}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newAddressForm.phone}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                  className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                  placeholder="+91 99999 88888"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink uppercase mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newAddressForm.street}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, street: e.target.value })}
                  className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                  placeholder="Flat No, Building, Street Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.city}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                    placeholder="Kanpur"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.state}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                    placeholder="Uttar Pradesh"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.postalCode}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, postalCode: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                    placeholder="208001"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-ink uppercase mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.country}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, country: e.target.value })}
                    className="w-full border border-line bg-stone px-3 py-2 rounded text-xs text-ink focus:border-ink focus:ring-0"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-line flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border border-line rounded text-xs font-bold text-ink hover:bg-stone"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink text-paper rounded text-xs font-bold hover:bg-ink/90"
                >
                  SAVE ADDRESS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
