import { useState } from 'react';
import { Link } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import { Mail, Phone, MessageSquare, MapPin, Send, ExternalLink, ShieldCheck, ChevronDown, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderNumber: '',
    message: '',
  });

  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { id: 1, q: 'What is your return & exchange policy?', a: 'We offer easy 14-day returns and exchanges on all eligible products. Items must be unused, unwashed, and in original packaging with tags intact.' },
    { id: 2, q: 'How long does delivery take?', a: 'Standard delivery takes 3-5 business days. Express shipping delivers in 1-2 business days.' },
    { id: 3, q: 'Do you offer Cash on Delivery?', a: 'Yes! COD is available on orders up to ₹5,000 across India.' },
    { id: 4, q: 'How can I track my order?', a: 'Once shipped, you will receive a tracking link via SMS & email. You can also track real-time status in your Account Dashboard.' },
    { id: 5, q: 'What payment methods do you accept?', a: 'We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, Wallets, and COD.' },
    { id: 6, q: 'Do you ship internationally?', a: 'Currently we ship across India. International shipping will be launched soon.' },
    { id: 7, q: 'How do I choose the right size?', a: 'Refer to our detailed Size Guide on each product page. Our tees feature a relaxed boxy oversized fit.' },
    { id: 8, q: 'My order is damaged, what should I do?', a: 'Please contact support within 48 hours of delivery with photos, and we will dispatch a replacement immediately.' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Thank you! Your message has been sent. We will reply within 12 hours.');
    setFormData({ name: '', email: '', orderNumber: '', message: '' });
  };

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Contact Us</span>
        </nav>

        {/* Header Section */}
        <div className="mb-12">
          <span className="text-xs font-extrabold uppercase text-muted tracking-widest block mb-1">CONTACT US</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-ink uppercase tracking-tight mb-3">
            WE'RE HERE TO HELP
          </h1>
          <p className="text-sm text-muted max-w-2xl leading-relaxed mb-6">
            Have a question, need help with an order, or just want to say hello? We'd love to hear from you.
          </p>

          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-stone border border-line rounded-full">
              <Clock className="w-4 h-4 text-ink" />
              <span>Quick Response - We reply within 12 hours</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-stone border border-line rounded-full">
              <ShieldCheck className="w-4 h-4 text-ink" />
              <span>Reliable Support - Your satisfaction is our priority</span>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative h-64 sm:h-96 w-full rounded-xl overflow-hidden shadow-soft border border-line mb-12">
          <img
            src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1600&auto=format&fit=crop&q=80"
            alt="TNT Support Team"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 4 Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-stone border border-line rounded-lg p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-ink mb-4">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase">EMAIL US</span>
              <div className="font-extrabold text-sm text-ink my-1">hello@tntclothing.com</div>
              <p className="text-xs text-muted">We reply within 12 hours</p>
            </div>
          </div>

          <div className="bg-stone border border-line rounded-lg p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-ink mb-4">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase">CALL US</span>
              <div className="font-extrabold text-sm text-ink my-1">+91 98765 43210</div>
              <p className="text-xs text-muted">Mon - Sat (10AM - 7PM)</p>
            </div>
          </div>

          <div className="bg-stone border border-line rounded-lg p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-ink mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase">LIVE CHAT</span>
              <div className="font-extrabold text-sm text-ink my-1">Chat with our support team</div>
              <p className="text-xs text-muted">Available on website</p>
            </div>
          </div>

          <div className="bg-stone border border-line rounded-lg p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-ink mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase">VISIT US</span>
              <div className="font-bold text-xs text-ink my-1">TNT Clothing Pvt. Ltd., 15 Industrial Area, Panki, Kanpur</div>
              <p className="text-xs text-muted">Mon - Sat (11AM - 6PM)</p>
            </div>
          </div>
        </div>

        {/* Two-Column Form & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Form */}
          <div className="bg-paper border border-line rounded-lg p-6 sm:p-8">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink mb-1">
              SEND US A MESSAGE
            </h2>
            <p className="text-xs text-muted mb-6">Fill out the form below and we'll get back to you.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-stone border border-line rounded px-4 py-3 text-xs text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-stone border border-line rounded px-4 py-3 text-xs text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Order Number (Optional)"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  className="w-full bg-stone border border-line rounded px-4 py-3 text-xs text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <textarea
                  rows={5}
                  placeholder="Message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-stone border border-line rounded px-4 py-3 text-xs text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-all flex items-center justify-center gap-2"
              >
                SEND MESSAGE <Send className="w-4 h-4" />
              </button>

              <div className="text-[10px] text-muted text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Your information is safe with us. We never share your data.
              </div>
            </form>
          </div>

          {/* Map Card */}
          <div className="bg-stone border border-line rounded-lg overflow-hidden relative flex flex-col justify-between p-6">
            <div className="h-64 sm:h-80 w-full bg-mist rounded border border-line mb-6 relative overflow-hidden flex items-center justify-center">
              {/* Map Illustration Box */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-ink text-paper flex items-center justify-center mx-auto mb-2 shadow-md">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="font-extrabold text-xs text-ink uppercase tracking-wider">TNT CLOTHING HQ</span>
                <p className="text-[11px] text-muted">Kanpur, Uttar Pradesh - 208020</p>
              </div>
            </div>

            <div className="bg-paper border border-line rounded-lg p-5">
              <h3 className="font-extrabold text-xs uppercase text-ink mb-1">TNT CLOTHING HQ</h3>
              <p className="text-xs text-muted mb-4">15, Industrial Area, Panki, Kanpur, Uttar Pradesh - 208020</p>
              <button
                onClick={() => window.open('https://maps.google.com', '_blank')}
                className="w-full py-2.5 border border-line text-xs font-bold uppercase text-ink rounded hover:bg-stone transition-all flex items-center justify-center gap-2"
              >
                GET DIRECTIONS <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="border-t border-line pt-12">
          <div className="text-center mb-8">
            <span className="text-[10px] font-extrabold uppercase text-muted tracking-widest block mb-1">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="text-2xl font-extrabold text-ink uppercase">QUICK ANSWERS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-paper border border-line rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full p-4 text-left font-bold text-xs text-ink flex items-center justify-between hover:bg-stone transition-all"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === faq.id && (
                  <div className="p-4 pt-0 text-xs text-muted border-t border-line/50 leading-relaxed bg-stone/30">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
