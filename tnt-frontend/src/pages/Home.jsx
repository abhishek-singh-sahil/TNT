import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { cmsApi, productApi } from '../api/services';
import { ArrowRight, Star, Instagram, Heart, ArrowLeft } from 'lucide-react';
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
  const [arrivalsIndex, setArrivalsIndex] = useState(0);
  const [bestSellers, setBestSellers] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);

  useEffect(() => {
    async function fetchHomeCMS() {
      try {
        const [res, productsRes] = await Promise.all([
          cmsApi.getHomepageData(),
          productApi.getProducts({ limit: 100 })
        ]);
        
        if (res.success && res.data) {
          setCmsData(res.data);
        }
        if (productsRes.success && productsRes.products) {
          setBestSellers(productsRes.products.filter(p => p.isBestSeller).slice(0, 4));
          setTrendingProducts(productsRes.products.filter(p => p.isTrending).slice(0, 4));
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

  return (
    <div className="bg-paper min-h-screen pb-16">
      
      {/* 1. Dynamic Premium Hero Banner Slider */}
      {heroSlides && heroSlides.length > 0 && (
        <section className="relative w-full border-b border-line">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            className="h-[380px] sm:h-[450px] lg:h-[500px] w-full"
          >
            {heroSlides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="relative w-full h-full bg-stone overflow-hidden flex items-center">
                  {/* Background Image of Models */}
                  <img
                    src={slide.image || "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600"}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover object-center animate-in fade-in zoom-in duration-1000"
                  />
                  
                  {/* Premium Gradient Overlay for readability on mobile */}
                  <div className="absolute inset-0 bg-gradient-to-r from-paper/90 via-paper/20 to-transparent sm:from-paper/60 sm:via-transparent pointer-events-none" />

                  {/* Left Floating Content Panel */}
                  <div className="container-tnt relative z-10 w-full px-4 sm:px-12 lg:px-20">
                    <div className="max-w-md sm:max-w-xl text-ink space-y-3.5 sm:space-y-5">
                      {slide.subtitle && (
                        <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-ink/75 block">
                          {slide.subtitle}
                        </span>
                      )}
                      
                      <h1 className="text-2xl sm:text-6xl font-extrabold uppercase tracking-tight leading-none text-ink font-display">
                        {slide.title.split('\n').map((line, index) => (
                          <span key={index} className="block">{line}</span>
                        ))}
                      </h1>
                      
                      <p className="text-[10px] sm:text-sm font-semibold text-muted leading-relaxed max-w-[170px] sm:max-w-sm">
                        Premium fabrics. Timeless designs. Made for the bold.
                      </p>
                      
                      {/* Happy Customer rating strip */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 pt-0.5">
                        <div className="flex text-ink">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-ink text-ink" />
                          ))}
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-ink/80">12,000+ Happy Customers</span>
                      </div>

                      {/* Buttons (Stacked on mobile, side-by-side on desktop) */}
                      <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-4 max-w-[170px] sm:max-w-none">
                        <Link
                          to={slide.link || '/products'}
                          className="px-4 py-2 sm:px-6 sm:py-3.5 bg-ink text-paper text-[9px] sm:text-xs font-extrabold uppercase tracking-widest hover:bg-black transition-colors rounded shadow-xs text-center"
                        >
                          {slide.buttonText || 'SHOP COLLECTION'}
                        </Link>
                        <Link
                          to="/collections"
                          className="px-4 py-2 sm:px-6 sm:py-3.5 border border-ink text-ink text-[9px] sm:text-xs font-extrabold uppercase tracking-widest hover:bg-stone transition-colors rounded text-center"
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

      {/* Spacing reduced from pt-12 space-y-20 to pt-6 space-y-8 */}
      <div className="container-tnt pt-6 space-y-8">
        
        {/* 2. Trust Features strip (2x2 grid on mobile, last full-width) */}
        {trustFeatures && trustFeatures.length > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 border-b border-line pb-8 items-center text-center">
            {trustFeatures.map((feat, i) => (
              <div
                key={feat.id}
                className={`space-y-1 flex flex-col items-center relative ${
                  i === 4 ? 'col-span-2 md:col-span-1 pt-2 md:pt-0 border-t border-line/40 md:border-none' : ''
                }`}
              >
                {/* Thin vertical separator for desktop */}
                {i > 0 && i < 4 && <div className="hidden md:block absolute left-0 top-1/4 bottom-1/4 w-[1px] bg-line" />}
                <DynamicIcon name={feat.icon} className="w-5 h-5 text-ink mb-0.5" />
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-ink block">{feat.title}</span>
                <p className="text-[9px] sm:text-[10px] text-muted max-w-[150px] font-semibold leading-tight">{feat.subtitle}</p>
              </div>
            ))}
          </section>
        )}

        {/* 3. Shop by Category (Horizontal Scroll on Mobile) */}
        {categories && categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between border-b border-line pb-3 mb-6">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest">CATEGORIES</span>
                <h2 className="text-lg sm:text-2xl font-extrabold uppercase tracking-tight text-ink mt-0.5">
                  SHOP BY CATEGORY
                </h2>
              </div>
              <Link to="/products" className="text-[10px] sm:text-xs font-bold text-ink uppercase tracking-wider hover:underline flex items-center gap-1">
                VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Horizontal scroll container bleeding to edges on all devices */}
            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/collections/${cat.slug}`}
                  className="group relative w-[160px] sm:w-[220px] md:w-[260px] shrink-0 aspect-[3/4] rounded-lg overflow-hidden border border-line bg-stone block shadow-xs"
                >
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4 text-paper space-y-1">
                    <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider">{cat.name}</span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-paper/80 uppercase tracking-widest group-hover:underline flex items-center gap-1">
                      Shop Now <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. New Arrivals (3-per-row grid on Mobile, paginated slider on Desktop) */}
        {newArrivals && newArrivals.length > 0 && (() => {
          const totalArrivalsPages = Math.ceil(Math.min(newArrivals.length, 24) / 6);
          const handleNextArrivals = () => {
            setArrivalsIndex((prev) => (prev + 1) % totalArrivalsPages);
          };
          const handlePrevArrivals = () => {
            setArrivalsIndex((prev) => (prev - 1 + totalArrivalsPages) % totalArrivalsPages);
          };
          return (
            <section>
              <div className="flex items-center justify-between border-b border-line pb-3 mb-6">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest">LATEST DROPS</span>
                  <h2 className="text-lg sm:text-2xl font-extrabold uppercase tracking-tight text-ink mt-0.5">
                    NEW ARRIVALS
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  {/* Arrow controls for desktop pagination */}
                  <div className="hidden md:flex items-center gap-1.5">
                    <button
                      onClick={handlePrevArrivals}
                      disabled={totalArrivalsPages <= 1}
                      className="p-1.5 border border-line rounded hover:bg-stone text-ink transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleNextArrivals}
                      disabled={totalArrivalsPages <= 1}
                      className="p-1.5 border border-line rounded hover:bg-stone text-ink transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Link to="/products" className="text-[10px] sm:text-xs font-bold text-ink uppercase tracking-wider hover:underline flex items-center gap-1">
                    VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Mobile View (Grid of 2 rows, 3 items per row for total 6 products) */}
              <div className="grid grid-cols-3 gap-2.5 md:hidden">
                {newArrivals.slice(0, 6).map((p) => (
                  <div key={p.id} className="min-w-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {/* Desktop View (Shows 6 at a time with fade-in slide animation) */}
              <div className="hidden md:grid md:grid-cols-6 gap-6 transition-all duration-300">
                {newArrivals.slice(arrivalsIndex * 6, (arrivalsIndex * 6) + 6).map((p) => (
                  <div key={p.id} className="animate-in fade-in slide-in-from-right-3 duration-300">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Best Sellers Section */}
        {bestSellers.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest">STREETWEAR HIGHLIGHTS</span>
                <h2 className="text-lg sm:text-2xl font-extrabold uppercase tracking-tight text-ink mt-0.5">
                  BEST SELLERS
                </h2>
              </div>
              <Link to="/products" className="text-[10px] sm:text-xs font-bold text-ink uppercase tracking-wider hover:underline flex items-center gap-1">
                VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Promotional Cards (2 Columns side-by-side, 3rd wide on Mobile) */}
        {promotions && promotions.length > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {promotions.map((promo, idx) => (
              <div
                key={promo.id}
                style={{ backgroundColor: idx === 0 ? '#111111' : idx === 1 ? '#F4EFEB' : '#EAECEE' }}
                className={`border border-line rounded-lg p-5 relative overflow-hidden flex flex-col justify-between h-64 md:h-72 group shadow-xs ${
                  idx === 0 ? 'text-paper' : 'text-ink'
                } ${
                  idx === 2 ? 'col-span-2 md:col-span-1' : 'col-span-1'
                }`}
              >
                {/* Image overlay shifted right */}
                {promo.imageUrl && (
                  <img
                    src={promo.imageUrl}
                    alt=""
                    className="absolute right-0 bottom-0 h-40 w-36 md:h-48 md:w-44 object-cover object-top opacity-85 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                  />
                )}

                <div className="space-y-1.5 relative z-10 max-w-[120px] sm:max-w-[170px]">
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest block ${idx === 0 ? 'text-yellow-400' : 'text-muted'}`}>
                    {promo.subtitle}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-lg uppercase tracking-tight leading-snug">
                    {promo.title}
                  </h3>
                  <p className={`text-[9px] leading-snug font-semibold ${idx === 0 ? 'text-paper/85' : 'text-muted'}`}>
                    {promo.description || 'Lightweight. Breathable.'}
                  </p>
                </div>

                <div className="relative z-10 space-y-2 pt-2">
                  {promo.couponCode && (
                    <div className="text-[9px] font-bold text-ink bg-paper border border-line rounded px-2 py-0.5 w-fit">
                      Code: <span className="font-mono font-extrabold">{promo.couponCode}</span>
                    </div>
                  )}
                  <Link
                    to={promo.buttonUrl || '/products'}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:underline ${
                      idx === 0 ? 'text-paper' : 'text-ink'
                    }`}
                  >
                    {promo.buttonText || 'SHOP NOW'} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 6. Brand Story Section */}
        {brandStory && (
          <section className="bg-stone border border-line rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6 items-center shadow-xs">
            <div className="p-6 sm:p-12 space-y-4">
              <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest block">OUR STORY</span>
              <h2 className="text-2xl font-extrabold uppercase text-ink tracking-tight font-display">
                {brandStory.heading}
              </h2>
              <p className="text-xs text-muted leading-relaxed font-semibold">
                {brandStory.description}
              </p>
              {brandStory.buttonText && (
                <Link
                  to={brandStory.buttonUrl || '/about'}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-ink text-paper text-[10px] font-bold uppercase tracking-widest rounded hover:bg-black transition-colors"
                >
                  {brandStory.buttonText}
                </Link>
              )}
            </div>
            <div className="h-64 md:h-[400px] w-full">
              <img src={brandStory.imageUrl} alt="Brand Story" className="w-full h-full object-cover" />
            </div>
          </section>
        )}

        {/* Trending Products Section */}
        {trendingProducts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest">ON THE RISE</span>
                <h2 className="text-lg sm:text-2xl font-extrabold uppercase tracking-tight text-ink mt-0.5">
                  TRENDING NOW
                </h2>
              </div>
              <Link to="/products" className="text-[10px] sm:text-xs font-bold text-ink uppercase tracking-wider hover:underline flex items-center gap-1">
                VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trendingProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* 7. Customer Reviews / Testimonials */}
        {reviews && reviews.length > 0 && (
          <section className="border-t border-line pt-8">
            <div className="text-center mb-6">
              <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest block mb-0.5">REVIEWS</span>
              <h2 className="text-lg font-extrabold text-ink uppercase tracking-wider">WHAT OUR CUSTOMERS SAY</h2>
            </div>

            {/* Horizontal scroll on mobile reviews */}
            <div className="flex overflow-x-auto no-scrollbar gap-4 md:grid md:grid-cols-4 md:gap-6 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              {reviews.map((t) => (
                <div key={t.id} className="w-[240px] shrink-0 md:w-auto md:shrink bg-stone border border-line rounded-lg p-5 space-y-3 shadow-xs">
                  <div className="flex text-yellow-500">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-xs text-ink/90 leading-relaxed font-semibold">"{t.content}"</p>
                  <div className="pt-2 border-t border-line/60 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-ink text-paper text-[10px] font-bold flex items-center justify-center">
                      {t.name[0]}
                    </div>
                    <span className="font-bold text-ink text-xs">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Instagram Gallery (3 columns on mobile!) */}
        {instagramPics && instagramPics.length > 0 && (
          <section className="space-y-4">
            <div className="text-center">
              <span className="text-[9px] font-extrabold uppercase text-muted tracking-widest block mb-0.5">SOCIAL FEED</span>
              <h2 className="text-lg font-extrabold text-ink uppercase tracking-wider">FOLLOW US @TNT.CLOTHING</h2>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
              {instagramPics.slice(0, 5).map((pic) => (
                <a
                  key={pic.id}
                  href={pic.link || 'https://instagram.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded overflow-hidden border border-line bg-stone block shadow-xs"
                >
                  <img src={pic.imageUrl} alt={pic.caption || ""} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-paper">
                    <Instagram className="w-5 h-5" />
                  </div>
                </a>
              ))}
              
              {/* Instagram Action Button Card */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-ink rounded aspect-square flex flex-col items-center justify-center text-center p-2 hover:bg-black transition-colors text-paper space-y-1 border border-line"
              >
                <Instagram className="w-5 h-5 text-paper" />
                <span className="text-[8px] font-extrabold uppercase tracking-widest block">VIEW ON INSTAGRAM</span>
              </a>
            </div>
          </section>
        )}

        {/* 9. Why Choose Us */}
        {whyChooseUs && whyChooseUs.length > 0 && (
          <section className="border-t border-line pt-8 space-y-6 text-center">
            <h2 className="text-xs font-extrabold uppercase text-ink tracking-widest">WHY CHOOSE TNT?</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 items-start">
              {whyChooseUs.map((item, i) => (
                <div key={item.id} className={`space-y-2 flex flex-col items-center ${
                  i === 4 ? 'col-span-2 md:col-span-1 pt-2 md:pt-0' : ''
                }`}>
                  <div className="w-10 h-10 bg-stone border border-line rounded-full flex items-center justify-center mb-0.5 shadow-xs text-ink">
                    <DynamicIcon name={item.icon} className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-ink block leading-snug">{item.title}</span>
                  <p className="text-[8px] text-muted max-w-[130px] font-semibold leading-tight">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
