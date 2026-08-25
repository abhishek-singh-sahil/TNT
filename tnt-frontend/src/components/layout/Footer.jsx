import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectSettings } from '../../store/settingsSlice';
import { cmsApi } from '../../api/services';
import toast from 'react-hot-toast';

const shop = [
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'Men', to: '/men' },
  { label: 'Women', to: '/women' },
  { label: 'Accessories', to: '/accessories' },
  { label: 'Sale', to: '/sale' },
];
const help = [
  { label: 'Track Your Order', to: '/track-order' },
  { label: 'Returns & Exchanges', to: '/account/returns' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'FAQs', to: '/faqs' },
  { label: 'Size Guide', to: '/size-guide' },
];
const about = [
  { label: 'Our Story', to: '/about' },
  { label: 'Sustainability', to: '/sustainability' },
  { label: 'Careers', to: '/careers' },
  { label: 'Store Locator', to: '/store-locator' },
  { label: 'Bulk Orders', to: '/bulk-orders' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const settings = useSelector(selectSettings);

  const handleNewsletterSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      const res = await cmsApi.subscribeNewsletter(email);
      if (res.success) {
        toast.success(res.message || 'Subscribed successfully!');
        setEmail('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to subscribe');
    }
  };

  return (
    <footer className="bg-ink text-paper">
      <div className="container-tnt py-12 grid grid-cols-2 md:grid-cols-5 gap-8 msm:gap-6">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display font-extrabold text-2xl mb-3">TNT</p>
          <p className="text-sm text-paper/60 leading-relaxed max-w-[220px]">
            Timeless designs. Premium quality. Made for the bold. Worn by you.
          </p>
          <div className="flex items-center gap-4 mt-5 text-paper/80">
            <Instagram size={18} />
            <Facebook size={18} />
            <Youtube size={18} />
            <Twitter size={18} />
          </div>
        </div>

        <FooterCol title="Shop" links={shop} />
        <FooterCol title="Help" links={help} />
        <FooterCol title="About" links={about} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest2 mb-4">Contact</p>
          <ul className="space-y-2.5 text-sm text-paper/70">
            <li>{settings?.siteEmail}</li>
            <li>{settings?.sitePhone}</li>
            <li>Mon - Sat (10AM - 7PM)</li>
          </ul>

          <div className="mt-5 space-y-2">
            <span className="text-[10px] font-bold uppercase text-paper/50 block">NEWSLETTER</span>
            <form onSubmit={handleNewsletterSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Enter email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-paper/10 border border-paper/20 rounded px-2.5 py-1.5 text-xs text-paper placeholder-paper/40 focus:outline-none w-full"
              />
              <button type="submit" className="px-3 bg-paper text-ink font-bold text-xs uppercase rounded hover:bg-paper/90 transition-colors">
                OK
              </button>
            </form>
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest2 mt-6 mb-3">We Accept</p>
          <div className="flex flex-wrap gap-2 text-[10px] text-paper/60">
            <span className="border border-paper/20 rounded px-2 py-1">VISA</span>
            <span className="border border-paper/20 rounded px-2 py-1">Mastercard</span>
            <span className="border border-paper/20 rounded px-2 py-1">RuPay</span>
            <span className="border border-paper/20 rounded px-2 py-1">UPI</span>
          </div>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="container-tnt py-5 flex flex-col msm:flex-row items-center justify-between gap-3 text-xs text-paper/50">
          <div className="space-y-1">
            <p>© {new Date().getFullYear()} TNT Clothing. All Rights Reserved.</p>
            <p>
              The website is built and managed by{' '}
              <a
                href="https://wa.me/9117261314"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-paper underline"
              >
                Abhishek Singh Sahil
              </a>{' '}
              phone no 6204635073
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/privacy-policy" className="hover:text-paper">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-paper">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest2 mb-4">{title}</p>
      <ul className="space-y-2.5 text-sm text-paper/70">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="hover:text-paper transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
