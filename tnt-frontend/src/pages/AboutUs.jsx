import { useState } from 'react';
import { Link } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import { ShieldCheck, Award, Heart, Leaf, Users, ArrowRight, Instagram, Linkedin, Mail, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AboutUs() {
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast.success('Thank you for joining the TNT community!');
    setNewsletterEmail('');
  };

  return (
    <div className="bg-paper min-h-screen">
      
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-4">
        <nav className="text-xs text-muted flex items-center gap-2 font-medium">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-bold">About Us</span>
        </nav>
      </div>

      {/* 1. Hero Section (Text Left, Image Right) */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">ABOUT TNT</span>
            <h1 className="text-4xl sm:text-5xl font-black text-ink uppercase leading-[1.05] tracking-tight">
              BUILT DIFFERENT.<br />MADE FOR EVERYONE.
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-md">
              TNT is more than a brand. It's a mindset. We create timeless clothing with premium fabrics and modern fits that empower you to be your best, every day.
            </p>
            <div className="pt-2">
              <Link
                to="/collections"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-paper text-xs font-black uppercase tracking-widest rounded hover:bg-ink/90 transition-all shadow-xs"
              >
                EXPLORE OUR COLLECTION
              </Link>
            </div>
          </div>

          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone border border-line shadow-sm relative">
            <img
              src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80"
              alt="TNT Streetwear Culture"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </div>

      {/* 2. Value Pillars Row (5 Icons Strip) */}
      <div className="border-y border-line bg-paper py-8">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
            
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-stone border border-line flex items-center justify-center text-ink">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black uppercase text-ink">PREMIUM QUALITY</h4>
              <p className="text-[10px] text-muted leading-relaxed max-w-[160px]">Carefully selected fabrics that offer lasting comfort and style.</p>
            </div>

            <div className="space-y-2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-stone border border-line flex items-center justify-center text-ink">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black uppercase text-ink">TIMELESS DESIGNS</h4>
              <p className="text-[10px] text-muted leading-relaxed max-w-[160px]">Minimal, modern and versatile pieces for every wardrobe.</p>
            </div>

            <div className="space-y-2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-stone border border-line flex items-center justify-center text-ink">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black uppercase text-ink">MADE FOR EVERYDAY</h4>
              <p className="text-[10px] text-muted leading-relaxed max-w-[160px]">Thoughtfully crafted for real life, every single day.</p>
            </div>

            <div className="space-y-2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-stone border border-line flex items-center justify-center text-ink">
                <Leaf className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black uppercase text-ink">SUSTAINABLE MINDSET</h4>
              <p className="text-[10px] text-muted leading-relaxed max-w-[160px]">Responsible production and better choices for a better future.</p>
            </div>

            <div className="space-y-2 flex flex-col items-center col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-full bg-stone border border-line flex items-center justify-center text-ink">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black uppercase text-ink">COMMUNITY FIRST</h4>
              <p className="text-[10px] text-muted leading-relaxed max-w-[160px]">Built on a community that inspires and supports.</p>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Our Story Section */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">OUR STORY</span>
            <h2 className="text-3xl font-black text-ink uppercase tracking-tight">HOW TNT BEGAN</h2>
            <div className="space-y-3 text-xs text-muted leading-relaxed">
              <p>
                TNT was born in 2021 with a simple idea – to make premium quality clothing accessible to everyone.
              </p>
              <p>
                We noticed a gap between quality and affordability in everyday fashion. That's when we decided to build a brand that delivers both.
              </p>
              <p>
                From a small start to a growing community of 50,000+ customers, our journey is just getting started.
              </p>
            </div>
            
            {/* Founder Signature Block */}
            <div className="pt-4 flex items-center gap-3">
              <div className="space-y-0.5">
                <p className="font-serif italic text-lg font-bold text-ink">Akhtar Raza</p>
                <p className="text-[10px] font-bold text-muted uppercase">Founder, TNT Clothing</p>
              </div>
            </div>
          </div>

          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone border border-line shadow-sm relative">
            <img
              src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=80"
              alt="TNT Established 2021 Tee"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-8 text-paper">
              <span className="text-xl font-black uppercase tracking-widest">BUILT DIFFERENT. MADE FOR EVERYONE.</span>
              <span className="text-xs font-bold tracking-widest mt-1 opacity-80">TNT EST. 2021</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Stats Counter Bar (Black Background) */}
      <div className="bg-ink text-paper py-10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-paper/10">
            <div className="space-y-1 py-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight">50,000+</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-paper/70">Happy Customers</p>
            </div>
            <div className="space-y-1 py-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight">150+</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-paper/70">Products</p>
            </div>
            <div className="space-y-1 py-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight">25+</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-paper/70">Cities Delivering</p>
            </div>
            <div className="space-y-1 py-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight">4.7/5</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-paper/70">Average Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Our Journey Timeline */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-1">OUR JOURNEY</p>
          <h2 className="text-2xl font-black uppercase text-ink">GROWING STEP BY STEP</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center relative">
          {[
            { year: '2021', title: 'The Beginning', desc: 'TNT was founded with a vision to redefine everyday fashion.' },
            { year: '2022', title: 'First Collection', desc: 'Launched our first collection of premium basics.' },
            { year: '2023', title: 'TNT Community', desc: 'Reached 10,000+ customers across India.' },
            { year: '2024', title: 'Expanding Horizons', desc: 'New categories, new cities, bigger dreams.' },
            { year: '2025+', title: 'The Future', desc: 'Building more. Inspiring more. Growing together.' },
          ].map((item, i) => (
            <div key={i} className="space-y-2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-stone border border-line flex items-center justify-center font-extrabold text-xs text-ink shadow-xs">
                {item.year}
              </div>
              <h4 className="text-xs font-black uppercase text-ink pt-1">{item.title}</h4>
              <p className="text-[10px] text-muted leading-relaxed max-w-[160px]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Quality in Every Thread Grid */}
      <div className="bg-stone/20 border-y border-line py-16">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">CRAFTED WITH CARE</span>
            <h2 className="text-3xl font-black text-ink uppercase tracking-tight mt-1">QUALITY IN EVERY THREAD</h2>
            <p className="text-xs text-muted max-w-md mt-1">
              We don't compromise on quality. From the fabric we source to the final stitch, every step is done with precision and care to ensure you get the best.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'PREMIUM FABRICS', desc: 'Carefully sourced for comfort & durability', img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500' },
              { title: 'EXPERT CRAFTSMANSHIP', desc: 'Precision stitching for a perfect finish', img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500' },
              { title: 'QUALITY CHECKS', desc: 'Rigorous testing for every product', img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500' },
              { title: 'PERFECT FIT', desc: 'Designed to look good on every body type', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500' },
            ].map((card, i) => (
              <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-line group">
                <img src={card.img} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 text-paper">
                  <h4 className="text-xs font-black uppercase tracking-wider">{card.title}</h4>
                  <p className="text-[10px] text-paper/80 leading-relaxed mt-0.5">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Founder & Join Community Grid */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Founder Bio Card */}
          <div className="border border-line rounded-xl p-6 bg-paper flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="w-24 h-28 rounded-lg bg-stone overflow-hidden border border-line flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"
                alt="Akhtar Raza"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted">FOUNDER</span>
              <h3 className="text-xl font-black text-ink uppercase">AKHTAR RAZA</h3>
              <p className="text-xs text-muted leading-relaxed">
                A dreamer, a problem solver, and a believer in doing things differently.<br />
                TNT is my way of creating something meaningful and lasting.
              </p>
              <div className="flex gap-3 justify-center sm:justify-start pt-2 text-ink">
                <button className="p-1.5 border border-line rounded hover:bg-stone"><Instagram className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 border border-line rounded hover:bg-stone"><Linkedin className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 border border-line rounded hover:bg-stone"><Mail className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>

          {/* Join Community Newsletter Card */}
          <div className="border border-line rounded-xl p-6 bg-stone/30 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-black text-ink uppercase tracking-wider">JOIN OUR COMMUNITY</h3>
              <p className="text-xs text-muted mt-1">Be the first to know about new drops, exclusive offers and more.</p>
            </div>
            
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 bg-paper border border-line rounded px-4 py-2.5 text-xs text-ink focus:outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-ink text-paper text-xs font-bold uppercase rounded hover:bg-ink/90"
              >
                →
              </button>
            </form>

            <div className="flex items-center gap-4 text-ink text-xs font-bold">
              <Instagram className="w-4 h-4 cursor-pointer hover:opacity-70" />
              <Mail className="w-4 h-4 cursor-pointer hover:opacity-70" />
            </div>
          </div>

        </div>
      </div>

      {/* Trust Strip */}
      <TrustStrip />
    </div>
  );
}
