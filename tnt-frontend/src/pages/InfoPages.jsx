import { useParams } from 'react-router-dom';
import { HelpCircle, Shield, Truck, FileText, Briefcase, Info, Ruler } from 'lucide-react';

export default function InfoPages() {
  const { pageKey } = useParams();

  // Match the page content depending on route param
  const getPageContent = () => {
    switch (pageKey) {
      case 'about':
        return {
          title: 'Our Story & Brand Identity',
          subtitle: 'Timeless designs. Premium quality. Made for the bold.',
          icon: <Info className="w-8 h-8 text-ink" />,
          body: (
            <div className="space-y-6">
              <p>
                TNT (Thread & Tones) was founded in 2024 with a clear purpose: to bridge the gap between luxury construction and modern streetwear culture. We design for individuals who appreciate precision, quality, and bold aesthetics.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div className="p-5 bg-stone border border-line rounded-xl space-y-2">
                  <h4 className="font-extrabold text-ink uppercase text-xs tracking-wider">Uncompromising Quality</h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Every piece is crafted using heavy-weight, custom-milled cottons and premium trims, ensuring it withstands the test of time.
                  </p>
                </div>
                <div className="p-5 bg-stone border border-line rounded-xl space-y-2">
                  <h4 className="font-extrabold text-ink uppercase text-xs tracking-wider">Ethical Manufacturing</h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    We partner with certified mills and ethical facilities in India to prioritize sustainable, low-waste clothing operations.
                  </p>
                </div>
              </div>
              <p>
                We believe that streetwear is a medium of expression. TNT focuses on minimal silhouettes, oversized cuts, and meticulously balanced design details. Thank you for walking this journey with us.
              </p>
            </div>
          ),
        };
      case 'shipping-policy':
        return {
          title: 'Shipping & Delivery Guidelines',
          subtitle: 'How we get premium streetwear to your doorstep.',
          icon: <Truck className="w-8 h-8 text-ink" />,
          body: (
            <div className="space-y-6">
              <p>
                We dispatch orders from our central warehouse in Mumbai, India. Orders are processed Monday through Saturday, excluding public holidays.
              </p>
              <h3 className="text-sm font-extrabold text-ink uppercase tracking-wider border-b border-line pb-2 mt-4">Shipping Rates & Speed</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-ink">
                  <span>Standard Shipping (Orders over ₹1,999)</span>
                  <span className="text-emerald-700">FREE (3-5 Business Days)</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-ink">
                  <span>Standard Shipping (Orders below ₹1,999)</span>
                  <span>₹99 (3-5 Business Days)</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-ink">
                  <span>Express Dispatch</span>
                  <span>₹199 (1-2 Business Days)</span>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed mt-4">
                * Note: Delivery timelines are estimates provided by shipping partners (Delhivery, BlueDart, Xpressbees). Remote pincodes may require 1-2 additional business days. Tracking details are emailed instantly upon shipping.
              </p>
            </div>
          ),
        };
      case 'return-policy':
        return {
          title: 'Return & Exchange Policy',
          subtitle: 'Hassle-free 14-day replacement coverage.',
          icon: <Truck className="w-8 h-8 text-ink" />,
          body: (
            <div className="space-y-6">
              <p>
                Not fully satisfied with your fit? We offer standard returns and size exchanges within 14 days of delivery.
              </p>
              <h3 className="text-sm font-extrabold text-ink uppercase tracking-wider border-b border-line pb-2 mt-4">Conditions for Returns</h3>
              <ul className="list-disc list-inside text-xs space-y-2 text-muted leading-relaxed">
                <li>Items must be unworn, unwashed, and undamaged.</li>
                <li>Original price tags, badges, and packaging must remain completely intact.</li>
                <li>Innerwear and special limited accessories are final-sale and ineligible for return.</li>
              </ul>
              <h3 className="text-sm font-extrabold text-ink uppercase tracking-wider border-b border-line pb-2 mt-4">How to Request a Return</h3>
              <p className="text-xs">
                Log into your customer dashboard at <code className="bg-stone border border-line rounded px-1 py-0.5">My Account &gt; Orders</code>, locate the order, and click "Raise Return Request". Alternatively, contact support at <span className="font-semibold">threadntones25@gmail.com</span>.
              </p>
            </div>
          ),
        };
      case 'privacy-policy':
        return {
          title: 'Privacy Policy',
          subtitle: 'Your data security and safety is our top concern.',
          icon: <Shield className="w-8 h-8 text-ink" />,
          body: (
            <div className="space-y-4">
              <p>
                At TNT Clothing, we respect your privacy and protect your personal information. This document details how we collect, store, and utilize details provided during catalog browsing or checkout.
              </p>
              <h3 className="text-sm font-extrabold text-ink uppercase tracking-wider mt-4">Information We Collect</h3>
              <p className="text-xs text-muted leading-relaxed">
                We collect your email, phone, name, delivery addresses, and payment details processed via Razorpay secured transactions. We do not store credit/debit card numbers directly on our backend servers.
              </p>
              <h3 className="text-sm font-extrabold text-ink uppercase tracking-wider mt-4">Cookies & Analytics</h3>
              <p className="text-xs text-muted leading-relaxed">
                We use cookies to maintain your shopping cart selections, remember styling compare list configurations, and monitor page load logs.
              </p>
            </div>
          ),
        };
      case 'terms':
        return {
          title: 'Terms & Conditions',
          subtitle: 'Legal regulations for using the TNT store.',
          icon: <FileText className="w-8 h-8 text-ink" />,
          body: (
            <div className="space-y-4">
              <p>
                By using our website, placing an order, or registering an account, you agree to comply with the terms and conditions outlined below.
              </p>
              <h3 className="text-sm font-extrabold text-ink uppercase tracking-wider mt-4">Product Availability & Price</h3>
              <p className="text-xs text-muted leading-relaxed">
                We reserve the right to cancel or amend orders in the event of stock count discrepancies or payment transaction timeouts. All listed product prices are inclusive of local GST tax allocations.
              </p>
            </div>
          ),
        };
      case 'careers':
        return {
          title: 'Join the TNT Crew',
          subtitle: 'Build the future of streetwear with us.',
          icon: <Briefcase className="w-8 h-8 text-ink" />,
          body: (
            <div className="space-y-4">
              <p>
                We are always seeking passionate creatives, developers, warehouse ops staff, and content marketers to expand the TNT ecosystem.
              </p>
              <div className="p-5 bg-stone border border-line rounded-lg mt-4 space-y-2">
                <p className="text-xs font-bold text-ink uppercase">Open Roles (Mumbai Headquarters):</p>
                <ul className="text-xs text-muted space-y-1 list-disc list-inside">
                  <li>Junior Fashion Designer (Streetwear focus)</li>
                  <li>Operations Executive (Warehouse & Fulfillment)</li>
                  <li>Customer Relations Specialist</li>
                </ul>
              </div>
              <p className="text-xs text-muted mt-2">
                Send your resume and portfolio to <span className="font-semibold text-ink">threadntones25@gmail.com</span>.
              </p>
            </div>
          ),
        };
      case 'size-guide':
        return {
          title: 'Official Fit & Size Guide',
          subtitle: 'Choose your perfect fit for TNT streetwear drops.',
          icon: <Ruler className="w-8 h-8 text-ink" />,
          body: (
            <div className="space-y-6">
              <p>
                TNT garments are designed with custom silhouettes. Most of our pieces use a relaxed, dropped-shoulder oversized streetwear fit. If you prefer a regular fit, consider sizing down.
              </p>
              
              <h3 className="text-sm font-extrabold text-ink uppercase tracking-wider border-b border-line pb-2 mt-4">Size Table (Inches)</h3>
              <table className="w-full text-xs text-center border-collapse border border-line">
                <thead>
                  <tr className="bg-stone uppercase text-[10px] font-bold">
                    <th className="border border-line p-3">Size</th>
                    <th className="border border-line p-3">Chest (Width)</th>
                    <th className="border border-line p-3">Length</th>
                    <th className="border border-line p-3">Shoulder</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-muted">
                  <tr className="border-b border-line">
                    <td className="border border-line p-3 text-ink font-bold">S</td>
                    <td className="border border-line p-3">44"</td>
                    <td className="border border-line p-3">27.5"</td>
                    <td className="border border-line p-3">20.5"</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="border border-line p-3 text-ink font-bold">M</td>
                    <td className="border border-line p-3">46"</td>
                    <td className="border border-line p-3">28.5"</td>
                    <td className="border border-line p-3">21.5"</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="border border-line p-3 text-ink font-bold">L</td>
                    <td className="border border-line p-3">48"</td>
                    <td className="border border-line p-3">29.5"</td>
                    <td className="border border-line p-3">22.5"</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="border border-line p-3 text-ink font-bold">XL</td>
                    <td className="border border-line p-3">50"</td>
                    <td className="border border-line p-3">30.5"</td>
                    <td className="border border-line p-3">23.5"</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="border border-line p-3 text-ink font-bold">XXL</td>
                    <td className="border border-line p-3">52"</td>
                    <td className="border border-line p-3">31.5"</td>
                    <td className="border border-line p-3">24.5"</td>
                  </tr>
                </tbody>
              </table>

              <div className="p-4 bg-stone border border-line rounded-lg text-xs leading-relaxed text-muted mt-4">
                💡 <span className="font-bold text-ink">Measuring Tip:</span> For chest measurements, lay your favorite t-shirt flat and measure across from armpit to armpit, then double the number.
              </div>
            </div>
          ),
        };
      case 'faqs':
      default:
        return {
          title: 'Frequently Asked Questions (FAQs)',
          subtitle: 'Quick answers to common inquiries.',
          icon: <HelpCircle className="w-8 h-8 text-ink" />,
          body: (
            <div className="space-y-5">
              <div className="border border-line rounded-lg overflow-hidden divide-y divide-line">
                <FAQItem
                  q="How do I choose the correct size?"
                  a="Our fits are generally oversized streetwear cuts. We recommend ordering your standard size for an oversized look, or sizing down once for a more tailored fit. Check the detailed Size Guide modal on any product page."
                />
                <FAQItem
                  q="Can I cancel or edit my order?"
                  a="Yes, you can cancel your order directly from your account page if the status is PENDING. Once the order changes to CONFIRMED or PACKED, cancellations are no longer possible."
                />
                <FAQItem
                  q="How long does refund processing take?"
                  a="Once a return is received and inspected in our warehouse, refunds are dispatched to the original payment source or UPI handle within 3 business days."
                />
                <FAQItem
                  q="Do you ship internationally?"
                  a="Currently, TNT ships to pincodes across India only. International delivery options will be introduced soon."
                />
              </div>
            </div>
          ),
        };
    }
  };

  const { title, subtitle, icon, body } = getPageContent();

  return (
    <div className="bg-paper min-h-[70vh] py-16">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header Block */}
        <div className="text-center space-y-3 mb-10 pb-8 border-b border-line">
          <div className="mx-auto w-14 h-14 bg-stone border border-line rounded-full flex items-center justify-center mb-1">
            {icon}
          </div>
          <span className="text-[10px] font-extrabold uppercase text-muted tracking-widest block">TNT REFERENCE DESK</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-ink tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-muted font-medium">{subtitle}</p>
        </div>

        {/* Content Body Block */}
        <div className="text-xs sm:text-sm text-ink leading-relaxed font-medium space-y-4">
          {body}
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }) {
  return (
    <div className="p-4 bg-stone/30 hover:bg-stone/55 transition-colors space-y-1.5">
      <span className="text-xs font-bold uppercase text-ink block">Q: {q}</span>
      <p className="text-xs text-muted leading-relaxed font-semibold">{a}</p>
    </div>
  );
}
