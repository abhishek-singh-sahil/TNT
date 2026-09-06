import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { cmsApi, productApi } from '../api/services';
import { ArrowRight, Star, Instagram, ChevronLeft, ChevronRight, ShieldCheck, Truck, RotateCcw, Lock, Headset, Award, Shirt, Heart } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function Home() {
  const [cmsData, setCmsData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cmsRes, productsRes] = await Promise.all([
          cmsApi.getHomepageData(),
          productApi.getProducts({ limit: 20 })
        ]);
        if (cmsRes.success && cmsRes.data) {
          setCmsData(cmsRes.data);
        }
        if (productsRes.success && productsRes.products) {
          setProducts(productsRes.products);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const heroSlides = cmsData?.heroSlides?.length > 0 ? cmsData.heroSlides : [
    {
      id: 1,
      subtitle: 'NEW COLLECTION',
      title: 'DEFINE YOUR EDGE.',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1600&auto=format&fit=crop&q=80',
      link: '/collections',
      buttonText: 'SHOP COLLECTION'
    }
  ];

  const categoryCards = [
    { name: 'OVERSIZED', link: '/collections/oversized', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600' },
    { name: 'HOODIES', link: '/collections/hoodies', img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600' },
    { name: 'T-SHIRTS', link: '/collections/t-shirts', img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600' },
    { name: 'GRAPHIC TEES', link: '/collections/graphic-tees', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600' },
    { name: 'ACCESSORIES', link: '/accessories', img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600' },
  ];

  const sampleProducts = products.length > 0 ? products.slice(0, 6) : [
    { id: '1', name: 'Oversized Minimal Tee', price: 1499, isNewArrival: true, images: [{ url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500' }] },
    { id: '2', name: 'Essential Beige Hoodie', price: 2199, isNewArrival: true, images: [{ url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500' }] },
    { id: '3', name: 'Signature Back Print Tee', price: 1649, isNewArrival: true, images: [{ url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500' }] },
    { id: '4', name: 'Classic White Tee', price: 1299, isNewArrival: true, images: [{ url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500' }] },
    { id: '5', name: 'Washed Grey Tee', price: 1299, isNewArrival: true, images: [{ url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500' }] },
    { id: '6', name: 'Minimal Black Tee', price: 1299, isNewArrival: true, images: [{ url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500' }] },
  ];

  const testimonials = cmsData?.reviews?.length > 0 ? cmsData.reviews : [
    { id: 1, name: 'Rahul Sharma', text: '"The quality is insane! The fabric, the fit everything is perfect. TNT is my new favorite."', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
    { id: 2, name: 'Aayush Mehta', text: '"Super comfortable and stylish. The oversized fit is on point! Highly recommended!"', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100' },
    { id: 3, name: 'Sneha Verma', text: '"Fast delivery, great packaging and premium quality. 10/10 shopping experience."', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { id: 4, name: 'Arjun Malhotra', text: '"The best oversized tees I have ever owned. Worth every penny."', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
  ];

  return (
    <div className="bg-paper min-h-screen pb-16">
      
      {/* 1. Hero Banner Slider */}
      <section className="relative w-full overflow-hidden border-b border-line bg-stone/20" style={{ minHeight: 460 }}>
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          className="w-full h-full"
          style={{ minHeight: 460 }}
        >
          {heroSlides.map((slide, idx) => (
            <SwiperSlide key={idx}>
              <div className="relative w-full h-[460px] md:h-[540px] flex items-center overflow-hidden">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute right-0 top-0 h-full w-full lg:w-3/5 object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/90 to-transparent lg:via-paper/70" />

                <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full relative z-10">
                  <div className="max-w-xl space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted block">
                      {slide.subtitle || 'NEW COLLECTION'}
                    </span>
                    <h1 className="text-4xl sm:text-6xl font-black text-ink uppercase leading-[1.02] tracking-tight">
                      {slide.title || 'DEFINE YOUR EDGE.'}
                    </h1>
                    <p className="text-xs sm:text-sm text-muted max-w-sm leading-relaxed font-medium">
                      Premium fabrics. Timeless designs. Made for the bold.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex text-ink">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-ink text-ink" />
                        ))}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-ink">12,000+ Happy Customers</span>
                    </div>

                    <div className="pt-3 flex items-center gap-3">
                      <Link
                        to={slide.link || '/collections'}
                        className="px-6 py-3.5 bg-ink text-paper text-xs font-black uppercase tracking-widest rounded hover:bg-ink/90 transition-all shadow-xs"
                      >
                        {slide.buttonText || 'SHOP COLLECTION'}
                      </Link>
                      <Link
                        to="/products"
                        className="px-6 py-3.5 border border-line text-ink text-xs font-black uppercase tracking-widest rounded hover:bg-stone transition-all"
                      >
                        EXPLORE NOW
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* 2. Trust Strip (5 items) */}
      <div className="border-b border-line bg-paper py-5">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-line">
            <div className="flex items-center gap-3 p-2">
              <Truck className="w-5 h-5 text-ink flex-shrink-0" />
              <div>
                <p className="text-xs font-extrabold uppercase text-ink">FREE SHIPPING</p>
                <p className="text-[10px] text-muted">On orders above ₹1999</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 pl-4">
              <Award className="w-5 h-5 text-ink flex-shrink-0" />
              <div>
                <p className="text-xs font-extrabold uppercase text-ink">PREMIUM QUALITY</p>
                <p className="text-[10px] text-muted">Heavyweight. Durable. Built to last</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 pl-4">
              <RotateCcw className="w-5 h-5 text-ink flex-shrink-0" />
              <div>
                <p className="text-xs font-extrabold uppercase text-ink">EASY RETURNS</p>
                <p className="text-[10px] text-muted">14-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 pl-4">
              <Lock className="w-5 h-5 text-ink flex-shrink-0" />
              <div>
                <p className="text-xs font-extrabold uppercase text-ink">SECURE PAYMENTS</p>
                <p className="text-[10px] text-muted">100% safe & secure</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 pl-4">
              <Headset className="w-5 h-5 text-ink flex-shrink-0" />
              <div>
                <p className="text-xs font-extrabold uppercase text-ink">CUSTOMER SUPPORT</p>
                <p className="text-[10px] text-muted">We're here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Shop by Category */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-14">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-ink">SHOP BY CATEGORY</h2>
          <Link to="/collections" className="text-xs font-black uppercase text-ink hover:opacity-70 flex items-center gap-1">
            VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categoryCards.map((cat, idx) => (
            <Link key={idx} to={cat.link} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-line shadow-xs">
              <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-paper">
                <h3 className="font-black text-sm uppercase tracking-wider">{cat.name}</h3>
                <span className="text-[10px] font-bold tracking-wider mt-1 flex items-center gap-1 opacity-90 group-hover:underline">
                  Shop Now <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. New Arrivals Section */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 border-t border-line">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-ink">NEW ARRIVALS</h2>
          <Link to="/new-arrivals" className="text-xs font-black uppercase text-ink hover:opacity-70 flex items-center gap-1">
            VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {sampleProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* 5. Three Banner Grid */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Summer '24 */}
          <div className="relative h-64 rounded-xl overflow-hidden bg-ink text-paper p-6 flex flex-col justify-between shadow-sm">
            <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600" alt="Summer 24" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            <div className="relative z-10 space-y-1">
              <h3 className="text-lg font-black uppercase">SUMMER '24 COLLECTION</h3>
              <p className="text-[10px] text-paper/80 leading-relaxed">Lightweight. Breathable. Made for the heat.</p>
            </div>
            <Link to="/collections" className="relative z-10 text-xs font-black uppercase tracking-wider text-paper flex items-center gap-1 hover:underline">
              SHOP NOW <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: 10% Off First Order */}
          <div className="relative h-64 rounded-xl overflow-hidden bg-stone/60 border border-line p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase text-ink">GET 10% OFF ON YOUR FIRST ORDER</h3>
              <p className="text-xs text-muted font-semibold pt-1">Use Code: <span className="font-mono font-black text-ink">WELCOME10</span></p>
            </div>
            <Link to="/products" className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1 hover:underline">
              SHOP NOW <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Bundle & Save */}
          <div className="relative h-64 rounded-xl overflow-hidden bg-stone/40 border border-line p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase text-ink">BUNDLE & SAVE</h3>
              <p className="text-[11px] text-muted font-bold pt-1">BUY 2 GET 15% OFF<br />BUY 3 GET 20% OFF</p>
            </div>
            <Link to="/collections" className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1 hover:underline">
              SHOP COLLECTION <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>

      {/* 6. Our Story Feature Section */}
      <div className="bg-stone/20 border-y border-line py-16">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">OUR STORY</span>
              <h2 className="text-3xl sm:text-4xl font-black text-ink uppercase leading-tight">
                BUILT DIFFERENT.<br />MADE FOR EVERYONE.
              </h2>
              <p className="text-xs text-muted leading-relaxed max-w-md">
                TNT was born from a simple idea – create clothing that speaks confidence, comfort, and individuality. From premium fabrics to minimal designs, every detail is crafted to be your everyday edge.
              </p>
              <div className="pt-2">
                <Link to="/about" className="px-6 py-3 bg-ink text-paper text-xs font-black uppercase tracking-widest rounded hover:bg-ink/90 transition-colors inline-block">
                  LEARN MORE ABOUT US
                </Link>
              </div>
            </div>

            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-line bg-stone shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200"
                alt="TNT Story Models"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 7. What Our Customers Say */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-sm font-black uppercase tracking-wider text-ink">WHAT OUR CUSTOMERS SAY</h2>
          <Link to="/account/reviews" className="text-xs font-black uppercase text-ink hover:opacity-70 flex items-center gap-1">
            VIEW ALL REVIEWS <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((rev) => (
            <div key={rev.id} className="border border-line rounded-xl p-5 bg-paper space-y-3 shadow-xs">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-ink/80 leading-relaxed italic">{rev.text}</p>
              <div className="flex items-center gap-2.5 pt-2 border-t border-line/50">
                <img src={rev.avatar} alt={rev.name} className="w-7 h-7 rounded-full object-cover border border-line" />
                <span className="text-xs font-extrabold text-ink">{rev.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Follow Us @TNT.Clothing */}
      <div className="border-t border-line bg-paper py-14">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <h2 className="text-sm font-black uppercase tracking-wider text-ink mb-6 text-center">FOLLOW US @TNT.CLOTHING</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
              'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400',
              'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400',
              'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400',
              'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400',
            ].map((img, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-line group relative">
                <img src={img} alt="TNT Insta" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="aspect-square rounded-lg bg-ink text-paper flex flex-col items-center justify-center p-4 text-center hover:bg-ink/90 transition-colors"
            >
              <Instagram className="w-6 h-6 mb-2" />
              <span className="text-[10px] font-black uppercase tracking-wider">VIEW ON INSTAGRAM</span>
            </a>
          </div>
        </div>
      </div>

      {/* 9. Why Choose TNT? (5 items) */}
      <div className="border-t border-line bg-stone/20 py-12">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-ink text-center mb-8">WHY CHOOSE TNT?</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
            <div className="space-y-1 flex flex-col items-center">
              <Shirt className="w-5 h-5 text-ink mb-1" />
              <h4 className="text-xs font-black text-ink uppercase">240 GSM PREMIUM COTTON</h4>
              <p className="text-[10px] text-muted">Soft, breathable & durable</p>
            </div>
            <div className="space-y-1 flex flex-col items-center">
              <Award className="w-5 h-5 text-ink mb-1" />
              <h4 className="text-xs font-black text-ink uppercase">OVERSIZED PERFECT FIT</h4>
              <p className="text-[10px] text-muted">Designed for comfort & style</p>
            </div>
            <div className="space-y-1 flex flex-col items-center">
              <RotateCcw className="w-5 h-5 text-ink mb-1" />
              <h4 className="text-xs font-black text-ink uppercase">FADE & SHRINK RESISTANT</h4>
              <p className="text-[10px] text-muted">Built to last, wash after wash</p>
            </div>
            <div className="space-y-1 flex flex-col items-center">
              <Star className="w-5 h-5 text-ink mb-1" />
              <h4 className="text-xs font-black text-ink uppercase">MADE IN INDIA</h4>
              <p className="text-[10px] text-muted">Proudly designed & made</p>
            </div>
            <div className="space-y-1 flex flex-col items-center col-span-2 sm:col-span-1">
              <Award className="w-5 h-5 text-ink mb-1" />
              <h4 className="text-xs font-black text-ink uppercase">TRUSTED BY 12,000+</h4>
              <p className="text-[10px] text-muted">Happy customers across India</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
