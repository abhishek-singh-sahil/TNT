import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectSettings } from "../store/settingsSlice";
import TrustStrip from "../components/common/TrustStrip";
import { Mail, Phone, MessageSquare, MapPin, ShieldCheck, ChevronDown, Clock, ExternalLink, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function Contact() {
  const settings = useSelector(selectSettings);
  const [formData, setFormData] = useState({ name: "", email: "", orderNumber: "", message: "" });
  const [openFaq, setOpenFaq] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const faqs = [
    { id: 1, q: "What is your return & exchange policy?", a: "We offer easy 14-day returns and exchanges on all eligible products. Items must be unused, unwashed, and in original packaging with tags intact." },
    { id: 2, q: "How long does delivery take?", a: "Standard delivery takes 3-5 business days. Express shipping delivers in 1-2 business days." },
    { id: 3, q: "Do you offer Cash on Delivery?", a: "Yes! COD is available on orders up to ₹5,000 across India." },
    { id: 4, q: "How can I track my order?", a: "Once shipped, you will receive a tracking link via SMS & email. You can also track real-time status in your Account Dashboard." },
    { id: 5, q: "What payment methods do you accept?", a: "We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, Wallets, and COD." },
    { id: 6, q: "Do you ship internationally?", a: "Currently we ship across India. International shipping will be launched soon." },
    { id: 7, q: "How do I choose the right size?", a: "Refer to our detailed Size Guide on each product page. Our tees feature a relaxed boxy oversized fit." },
    { id: 8, q: "My order is damaged, what should I do?", a: "Please contact support within 48 hours of delivery with photos, and we will dispatch a replacement immediately." },
    { id: 9, q: "How can I contact customer support?", a: "You can reach us via email at hello@tntclothing.com, call us at +91 98765 43210, or use the contact form on this page." },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success("Thank you! Your message has been sent. We will reply within 12 hours.");
    setFormData({ name: "", email: "", orderNumber: "", message: "" });
    setSubmitting(false);
  };

  const contactCards = [
    {
      icon: Mail,
      label: "EMAIL US",
      primary: settings?.siteEmail || "hello@tntclothing.com",
      secondary: "We reply within 12 hours",
    },
    {
      icon: Phone,
      label: "CALL US",
      primary: settings?.sitePhone || "+91 98765 43210",
      secondary: "Mon – Sat (10AM – 7PM)",
    },
    {
      icon: MessageSquare,
      label: "LIVE CHAT",
      primary: "Chat with our support team",
      secondary: "Available on website",
    },
    {
      icon: MapPin,
      label: "VISIT US",
      primary: "TNT Clothing Pvt. Ltd.\n15, Industrial Area, Panki\nKanpur, Uttar Pradesh – 208020",
      secondary: "Mon – Sat (11AM – 6PM)",
    },
  ];

  return (
    <div className="bg-paper min-h-screen">

      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-4">
        <nav className="text-xs text-muted flex items-center gap-2 font-medium">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span className="text-muted/50">›</span>
          <span className="text-ink font-bold">Contact Us</span>
        </nav>
      </div>

      {/* ── Hero Banner (Text left, Image right) ─────────────────────── */}
      <div className="relative w-full overflow-hidden bg-stone/20" style={{ minHeight: 280 }}>
        {/* Background image fills right half */}
        <div
          className="absolute right-0 top-0 h-full w-1/2"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        {/* Gradient fade from left over the image */}
        <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/95 to-transparent" />

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 py-12 flex flex-col justify-center" style={{ minHeight: 280 }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/60 mb-3">CONTACT US</p>
          <h1 className="text-4xl sm:text-5xl font-black text-ink uppercase leading-[1.05] tracking-tight mb-4">
            WE'RE HERE<br />TO HELP
          </h1>
          <p className="text-sm text-muted max-w-xs leading-relaxed mb-6">
            Have a question, need help with an order,<br />or just want to say hello? We'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-line bg-paper flex items-center justify-center flex-shrink-0">
                <Clock className="w-3.5 h-3.5 text-ink" />
              </div>
              <div>
                <p className="text-[11px] font-black text-ink">Quick Response</p>
                <p className="text-[10px] text-muted">We reply within 12 hours</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 sm:ml-6">
              <div className="w-8 h-8 rounded-full border border-line bg-paper flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-ink" />
              </div>
              <div>
                <p className="text-[11px] font-black text-ink">Reliable Support</p>
                <p className="text-[10px] text-muted">Your satisfaction is our priority</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Contact Info Cards ─────────────────────────────────────── */}
      <div className="border-y border-line bg-paper">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line">
            {contactCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-6 lg:py-7">
                  <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-paper w-[18px] h-[18px]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink mb-1">{card.label}</p>
                    <p className="text-sm font-bold text-ink whitespace-pre-line leading-relaxed">{card.primary}</p>
                    <p className="text-[11px] text-muted mt-0.5">{card.secondary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Form + Map ───────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Contact Form */}
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-ink mb-1">SEND US A MESSAGE</h2>
            <p className="text-xs text-muted mb-6">Fill out the form below and we'll get back to you.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-paper border border-line rounded px-4 py-3 text-xs text-ink focus:outline-none focus:border-ink placeholder:text-muted"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-paper border border-line rounded px-4 py-3 text-xs text-ink focus:outline-none focus:border-ink placeholder:text-muted"
                />
              </div>
              <input
                type="text"
                placeholder="Order Number (Optional)"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                className="w-full bg-paper border border-line rounded px-4 py-3 text-xs text-ink focus:outline-none focus:border-ink placeholder:text-muted"
              />
              <textarea
                rows={5}
                placeholder="Message"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-paper border border-line rounded px-4 py-3 text-xs text-ink focus:outline-none focus:border-ink resize-none placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-ink text-paper text-xs font-black uppercase tracking-widest rounded hover:bg-ink/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? "SENDING..." : <>SEND MESSAGE <ArrowRight className="w-4 h-4" /></>}
              </button>
              <div className="text-[10px] text-muted text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Your information is safe with us. We never share your data.
              </div>
            </form>
          </div>

          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-line bg-stone/10 flex flex-col">
            {/* Google Map Embed */}
            <div className="flex-1 min-h-[300px] relative">
              <iframe
                title="TNT Clothing HQ"
                src="https://maps.google.com/maps?q=15+Industrial+Area+Panki+Kanpur+Uttar+Pradesh+208020&output=embed"
                className="w-full h-full absolute inset-0"
                style={{ border: 0, minHeight: 300 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            {/* HQ Card */}
            <div className="bg-paper border-t border-line p-5">
              <h3 className="font-black text-xs uppercase text-ink mb-1">TNT CLOTHING HQ</h3>
              <p className="text-xs text-muted mb-4">15, Industrial Area, Panki<br />Kanpur, Uttar Pradesh – 208020</p>
              <button
                onClick={() => window.open("https://maps.google.com/?q=15+Industrial+Area+Panki+Kanpur+Uttar+Pradesh+208020", "_blank")}
                className="flex items-center gap-2 text-xs font-black uppercase text-ink hover:opacity-70 transition-opacity"
              >
                GET DIRECTIONS <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ Section ──────────────────────────────────────────────── */}
      <div className="border-t border-line bg-stone/5 py-14">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2">FREQUENTLY ASKED QUESTIONS</p>
            <h2 className="text-2xl font-black uppercase text-ink">QUICK ANSWERS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-line rounded-xl overflow-hidden bg-paper">
            {faqs.map((faq, i) => (
              <div key={faq.id} className={`border-b border-line ${i % 3 !== 2 ? 'lg:border-r' : ''} ${i % 2 !== 1 ? 'md:border-r lg:border-r-0' : 'md:border-r-0'} ${i >= faqs.length - (faqs.length % 3 || 3) ? 'md:border-b-0' : ''}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-3 hover:bg-stone/30 transition-colors"
                >
                  <span className="text-xs font-bold text-ink leading-relaxed">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted flex-shrink-0 mt-0.5 transition-transform ${openFaq === faq.id ? "rotate-180" : ""}`} />
                </button>
                {openFaq === faq.id && (
                  <div className="px-5 pb-5 text-xs text-muted leading-relaxed border-t border-line/50 pt-3 bg-stone/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <TrustStrip />
    </div>
  );
}