import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { cmsApi, productApi } from '../api/services';
import { ArrowRight, Star, Instagram, Heart, ArrowLeft, Truck, Award, RotateCcw, Lock, Headset, Shirt } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const DynamicIcon = ({ name, className }) => {
  const IconComponent = Icons[name] || Icons.HelpCircle;
  return <IconComponent className={className} />;
};

const CATEGORY_FALLBACK_IMAGES = {
  'Men': 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600&auto=format&fit=crop&q=80',
  'Women': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
  'Accessories': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
  'Acid washed': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80',
  'Oversized': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
  'T-Shirts': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80',
  'Hoodies': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
};

export default function Home() {
  const [cmsData, setCmsData] = useState({
    heroSlides: [],
    announcement: '',
    trustFeatures: [],
    promotions: [],
    brandStory: null,
    reviews: [],
    instagramPics: [],
    whyChooseUs: [],
    categories: [],
    newArrivals: [],
  });
  const [loading, setLoading] = useState(true);
  const [bestSellers, setBestSellers] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    async function fetchHomeCMS() {
      try {
        const [res, productsRes, catRes] = await Promise.all([
          cmsApi.getHomepageData(),
          productApi.getProducts({ limit: 100 }),
          productApi.getCategories()
        ]);
        
        if (res.success && res.data) {
          setCmsData(res.data);
        }
        if (productsRes.success && productsRes.products) {
          setBestSellers(productsRes.products.filter(p => p.isBestSeller).slice(0, 6));
          setTrendingProducts(productsRes.products.filter(p => p.isTrending).slice(0, 6));
        }
        if (catRes.success && catRes.categories) {
          setDbCategories(catRes.categories);
        }
      } catch (err) {
        console.error('Failed to load dynamic homepage CMS:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomeCMS();
  }, []);

  const {
    heroSlides,
    trustFeatures,
    categories,
    newArrivals,
    promotions,
    brandStory,
    reviews,
    instagramPics,
    whyChooseUs,
  } = cmsData;

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCategories = dbCategories.length > 0 ? dbCategories : [
    { id: '1', name: 'OVERSIZED', slug: 'oversized-t-shirts' },
    { id: '2', name: 'HOODIES', slug: 'hoodies' },
    { id: '3', name: 'T-SHIRTS', slug: 't-shirts' },
    { id: '4', name: 'GRAPHIC TEES', slug: 'graphic-tees' },
    { id: '5', name: 'ACCESSORIES', slug: 'accessories' },
  ];

  return (
    <div className="bg-paper min-h-screen pb-16">
      
      {/* 1. Hero Banner Slider (Mobile Optimized Framing & Clean Typography) */}
      {heroSlides && heroSlides.length > 0 && (
        <section className="relative w-full border-b border-line">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            className="h-[460px] sm:h-[500px] lg:h-[540px] w-full"
          >
            {heroSlides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="relative w-full h-full bg-stone overflow-hidden flex items-end sm:items-center pb-8 sm:pb-0">
                  <img
                    src={slide.image || "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600"}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover object-[75%_20%] sm:object-center"
                  />
                  {/* Clean text backdrop gradient: bottom-up on phone, left-to-right on desktop */}
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-paper/95 via-paper/70 to-transparent pointer-events-none" />

                  <div className="max-w-[1400px] mx-auto px-4 sm:px-12 relative z-10 w-full">
                    <div className="max-w-[310px] sm:max-w-xl text-ink space-y-2.5 sm:space-y-4">
                      {slide.subtitle && (
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted block">
                          {slide.subtitle}
                        </span>
                      )}
                      
                      <h1 className="text-2xl sm:text-5xl font-black uppercase tracking-tight leading-tight text-ink font-display">
                        {slide.title.split('\n').map((line, index) => (
                          <span key={index} className="block">{line}</span>
                        ))}
                      </h1>
                      
                      <p className="text-[11px] sm:text-sm font-semibold text-muted leading-relaxed max-w-[280px] sm:max-w-sm">
                        Premium fabrics. Timeless designs. Made for the bold.
                      </p>
                      
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="flex text-ink">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-ink text-ink" />
                          ))}
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-ink">12,000+ Happy Customers</span>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        <Link
                          to={slide.link || '/products'}
                          className="px-5 py-3 sm:py-3.5 bg-ink text-paper text-[11px] sm:text-xs font-black uppercase tracking-widest hover:bg-black transition-colors rounded-xl shadow-xs text-center"
                        >
                          {slide.buttonText || 'SHOP COLLECTION'}
                        </Link>
                        <Link
                          to="/collections"
                          className="px-5 py-3 sm:py-3.5 border border-ink text-ink text-[11px] sm:text-xs font-black uppercase tracking-widest hover:bg-stone transition-colors rounded-xl text-center bg-paper/60 backdrop-blur-xs sm:bg-transparent"
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
      )}

      {/* 2. Trust Strip Features */}
      {trustFeatures && trustFeatures.length > 0 && (
        <section className="border-b border-line bg-paper py-5">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-line">
              {trustFeatures.map((feat, i) => (
                <div key={feat.id} className={'flex items-center gap-3 p-2 ' + (i > 0 ? 'pl-4' : '')}>
                  <DynamicIcon name={feat.icon} className="w-5 h-5 text-ink flex-shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold uppercase text-ink">{feat.title}</p>
                    <p className="text-[10px] text-muted">{feat.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Shop By Category (Resolves Real DB Images) */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-14">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-ink">SHOP BY CATEGORY</h2>
          <Link to="/collections" className="text-xs font-black uppercase text-ink hover:opacity-70 flex items-center gap-1">
            VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {activeCategories.slice(0, 5).map((cat) => {
            const catImage = cat.homepageImage || cat.cardImage || cat.image || cat.bannerImage || CATEGORY_FALLBACK_IMAGES[cat.name] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600';
            return (
              <Link key={cat.id} to={'/collections/' + (cat.slug || cat.name.toLowerCase())} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-line shadow-xs">
                <img src={catImage} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-paper">
                  <h3 className="font-black text-sm uppercase tracking-wider">{cat.name}</h3>
                  <span className="text-[10px] font-bold tracking-wider mt-1 flex items-center gap-1 opacity-90 group-hover:underline">
                    Shop Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. New Arrivals Section */}
      {newArrivals && newArrivals.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 border-t border-line">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-ink">NEW ARRIVALS</h2>
            <Link to="/new-arrivals" className="text-xs font-black uppercase text-ink hover:opacity-70 flex items-center gap-1">
              VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {newArrivals.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* 5. Promotions Banners Grid (Clean & Sharp - No Foggy Blur) */}
      {promotions && promotions.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {promotions.map((promo, idx) => (
              <div
                key={promo.id}
                className="relative h-64 rounded-xl overflow-hidden p-6 flex flex-col justify-between shadow-sm border border-line"
                style={{ backgroundColor: promo.bgColor || (idx === 0 ? '#111111' : '#f8f8f8') }}
              >
                {promo.imageUrl && (
                  <img src={promo.imageUrl} alt={promo.title} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className={'relative z-10 space-y-1 ' + (promo.imageUrl || idx === 0 ? 'text-paper' : 'text-ink')}>
                  <h3 className="text-lg font-black uppercase">{promo.title}</h3>
                  <p className="text-[10px] opacity-90 leading-relaxed">{promo.subtitle}</p>
                </div>
                <div className="relative z-10 space-y-2">
                  {promo.couponCode && (
                    <div className="text-[9px] font-bold text-ink bg-paper rounded px-2 py-0.5 w-fit border border-line">
                      Code: <span className="font-mono font-extrabold">{promo.couponCode}</span>
                    </div>
                  )}
                  <Link
                    to={promo.buttonUrl || '/products'}
                    className={'text-xs font-black uppercase tracking-wider flex items-center gap-1 hover:underline ' + (promo.imageUrl || idx === 0 ? 'text-paper' : 'text-ink')}
                  >
                    {promo.buttonText || 'SHOP NOW'} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Brand Story Section */}
      {brandStory && (
        <div className="bg-stone/20 border-y border-line py-16">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">OUR STORY</span>
                <h2 className="text-3xl sm:text-4xl font-black text-ink uppercase leading-tight">
                  {brandStory.heading}
                </h2>
                <p className="text-xs text-muted leading-relaxed max-w-md">
                  {brandStory.description}
                </p>
                {brandStory.buttonText && (
                  <div className="pt-2">
                    <Link to={brandStory.buttonUrl || '/about'} className="px-6 py-3 bg-ink text-paper text-xs font-black uppercase tracking-widest rounded hover:bg-ink/90 transition-colors inline-block">
                      {brandStory.buttonText}
                    </Link>
                  </div>
                )}
              </div>

              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-line bg-stone shadow-sm">
                <img
                  src={brandStory.imageUrl || 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200'}
                  alt="TNT Story Models"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Customer Reviews / Testimonials */}
      {reviews && reviews.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-black uppercase tracking-wider text-ink">WHAT OUR CUSTOMERS SAY</h2>
            <Link to="/account/reviews" className="text-xs font-black uppercase text-ink hover:opacity-70 flex items-center gap-1">
              VIEW ALL REVIEWS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="border border-line rounded-xl p-5 bg-paper space-y-3 shadow-xs">
                <div className="flex text-amber-400">
                  {[...Array(rev.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-ink/80 leading-relaxed italic">"{rev.content}"</p>
                <div className="flex items-center gap-2.5 pt-2 border-t border-line/50">
                  <div className="w-7 h-7 rounded-full bg-ink text-paper text-[10px] font-bold flex items-center justify-center">
                    {rev.name?.[0] || 'C'}
                  </div>
                  <span className="text-xs font-extrabold text-ink">{rev.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Instagram Gallery */}
      {instagramPics && instagramPics.length > 0 && (
        <div className="border-t border-line bg-paper py-14">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <h2 className="text-sm font-black uppercase tracking-wider text-ink mb-6 text-center">FOLLOW US @TNT.CLOTHING</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {instagramPics.slice(0, 5).map((pic) => (
                <a
                  key={pic.id}
                  href={pic.link || 'https://instagram.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-lg overflow-hidden border border-line group relative block"
                >
                  <img src={pic.imageUrl} alt={pic.caption || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-paper">
                    <Instagram className="w-5 h-5" />
                  </div>
                </a>
              ))}
              
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg bg-ink text-paper flex flex-col items-center justify-center p-4 text-center hover:bg-black transition-colors border border-line"
              >
                <Instagram className="w-6 h-6 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-wider">VIEW ON INSTAGRAM</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 9. Why Choose TNT? */}
      {whyChooseUs && whyChooseUs.length > 0 && (
        <div className="border-t border-line bg-stone/20 py-12">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-ink text-center mb-8">WHY CHOOSE TNT?</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
              {whyChooseUs.map((item, i) => (
                <div key={item.id} className={'space-y-1 flex flex-col items-center ' + (i === 4 ? 'col-span-2 sm:col-span-1' : '')}>
                  <div className="w-10 h-10 bg-paper border border-line rounded-full flex items-center justify-center mb-1 text-ink shadow-xs">
                    <DynamicIcon name={item.icon} className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-ink uppercase">{item.title}</h4>
                  <p className="text-[10px] text-muted">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
