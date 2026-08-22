import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import { ShieldCheck, Plus, Check, Edit2, QrCode, Lock, ShoppingBag, ArrowRight, Loader } from 'lucide-react';
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
  const [selectedPayment, setSelectedPayment] = useState('card');

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
  const [appliedCoupon, setAppliedCoupon] = useState(null);
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

  // Load Razorpay script
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
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  // Dynamic shipping calculation
  const calculateShippingFee = () => {
    // 1. Check free shipping rule
    if (settings?.freeShippingEnabled && subtotal >= (settings?.freeShippingMin || 1999)) {
      return 0;
    }

    if (selectedShipping === 'express') return 149;
    if (selectedShipping === 'sameday') return 249;

    const activeAddress = addresses.find(a => a.id === selectedAddressId);
    if (!activeAddress) return 0;

    const cityStr = (activeAddress.city || '').toLowerCase().trim();
    const stateStr = (activeAddress.state || '').toLowerCase().trim();

    // Match state/city
    const matchedZone = shippingZones.find(zone => {
      const regionsList = zone.regions.split(',').map(r => r.trim().toLowerCase());
      return regionsList.some(reg => cityStr.includes(reg) || stateStr.includes(reg));
    });

    if (matchedZone && matchedZone.rates && matchedZone.rates.length > 0) {
      const totalWeight = displayItems.reduce((sum, item) => sum + (item.qty * 0.4), 0);
      const sortedRates = [...matchedZone.rates].sort((a, b) => a.weightUpper - b.weightUpper);
      const fittingRate = sortedRates.find(r => totalWeight <= r.weightUpper) || sortedRates[sortedRates.length - 1];
      return fittingRate ? fittingRate.charge : 0;
    }

    return 0;
  };

  const shippingFee = calculateShippingFee();
  const codFee = (selectedPayment === 'cod' && (settings?.codEnabled ?? true)) ? (settings?.codCharge ?? 50) : 0;
  const total = subtotal - discount + shippingFee + codFee;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
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
          addressId: selectedAddressId,
          items: checkoutItems,
          paymentMethod: 'COD',
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          shippingFee,
        });
        toast.dismiss();
        if (res.success) {
          toast.success('Order placed successfully!');
          dispatch(clearCart());
          navigate(`/account/orders/${res.order.orderNumber}/track`);
        } else {
          toast.error(res.message || 'Failed to place order');
        }
        setIsPlacingOrder(false);
      } else {
        // Online Payment via Razorpay
        toast.loading('Initializing payment gateway...');
        const orderRes = await paymentApi.createRazorpayOrder({
          amount: total,
          currency: settings?.currency || 'INR',
          receipt: `rcpt_${Date.now()}`
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
                addressId: selectedAddressId,
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
                navigate(`/account/orders/${res.order.orderNumber}/track`);
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
            name: `${user?.firstName || ''} ${user?.lastName || ''}`,
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

        if (selectedPayment === 'upi') {
          options.prefill.method = 'upi';
        } else if (selectedPayment === 'card') {
          options.prefill.method = 'card';
        } else if (selectedPayment === 'netbanking') {
          options.prefill.method = 'netbanking';
        }

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
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAddressId === addr.id ? 'border-ink bg-stone/50' : 'border-line hover:border-ink/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-ink' : 'border-line'}`}>
                          {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-ink" />}
                        </div>
                        <span className="font-extrabold text-xs text-ink uppercase">{addr.type}</span>
                        {addr.isDefault && (
                          <span className="bg-ink/10 text-ink text-[10px] font-bold px-2 py-0.5 rounded uppercase">DEFAULT</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-ink space-y-0.5">
                      <p className="font-bold">{addr.fullName}</p>
                      <p>{addr.street}</p>
                      {addr.locality && <p>{addr.locality}</p>}
                      <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
                      <p>{addr.country}</p>
                      <p className="text-muted pt-1">{addr.phone}</p>
                    </div>
                  </div>
                ))}
                {addresses.length === 0 && (
                  <p className="text-xs text-muted col-span-2 py-4">No shipping addresses saved yet. Please add one below.</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1 hover:underline"
              >
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
                  <span className="font-extrabold text-xs text-ink">{currencySymbol}149</span>
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
                  <span className="font-extrabold text-xs text-ink">{currencySymbol}249</span>
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
                {(settings?.upiEnabled ?? true) && (
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
                  </div>
                )}

                {/* Credit / Debit Card */}
                {(settings?.cardEnabled ?? true) && (
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
                )}

                {/* Net Banking */}
                {(settings?.netBankingEnabled ?? true) && (
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
                )}

                {/* Cash on Delivery */}
                {(settings?.codEnabled ?? true) && (
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
                )}
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
                      {currencySymbol}{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code Input Box */}
              <div className="pt-4 border-t border-line space-y-2">
                <label className="block text-[10px] font-extrabold uppercase text-ink tracking-wider">Promo Code</label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span className="font-bold uppercase font-mono">{appliedCoupon.code}</span>
                      <span className="text-[10px] text-emerald-700">({currencySymbol}{appliedCoupon.discountAmount} Off)</span>
                    </div>
                    <button 
                      onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponError(''); }}
                      className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-widest"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={couponLoading}
                        className="bg-stone border border-line rounded text-xs px-3 py-2 text-ink tracking-wider font-semibold focus:outline-none focus:border-ink uppercase flex-1"
                      />
                      <button
                        onClick={async () => {
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
                            if (res.success) {
                              setAppliedCoupon(res.coupon);
                              toast.success(`Coupon applied successfully!`);
                            } else {
                              setCouponError(res.message || 'Invalid coupon code');
                            }
                          } catch (err) {
                            setCouponError(err.message || 'Validation failed');
                          } finally {
                            setCouponLoading(false);
                          }
                        }}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90 disabled:opacity-50 tracking-wider flex items-center justify-center min-w-[70px]"
                      >
                        {couponLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-wide">{couponError}</p>}
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2.5 text-xs pt-4 border-t border-line">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="font-bold text-ink">{currencySymbol}{subtotal.toLocaleString()}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span className="font-bold">- {currencySymbol}{discount}</span>
                  </div>
                )}
                 <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="font-bold text-emerald-700">
                    {shippingFee === 0 ? 'FREE' : `${currencySymbol}${shippingFee}`}
                  </span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>COD Surcharge</span>
                    <span className="font-bold text-ink">{currencySymbol}{codFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-ink pt-3 border-t border-line">
                  <span>Total <span className="text-[10px] font-normal text-muted block">(Inclusive of all taxes)</span></span>
                  <span className="text-lg">{currencySymbol}{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Green Savings Callout */}
              {discount > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-center text-xs font-bold text-emerald-800">
                  🟢 You are saving {currencySymbol}{discount.toLocaleString()} on this order!
                </div>
              )}

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

      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-paper border border-line rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="font-extrabold text-ink text-sm uppercase tracking-wider">ADD NEW ADDRESS</h3>
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
