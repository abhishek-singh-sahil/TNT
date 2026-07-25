import { ShieldCheck, RotateCcw, Lock, Truck, Headphones } from 'lucide-react'

const items = [
  { icon: ShieldCheck, title: 'Premium Quality', subtitle: 'Built to last, made to feel good.' },
  { icon: RotateCcw, title: 'Easy Returns', subtitle: '14-day hassle-free returns.' },
  { icon: Lock, title: 'Secure Payments', subtitle: '100% safe & secure payments.' },
  { icon: Truck, title: 'Free Shipping', subtitle: 'On orders above ₹1999.' },
  { icon: Headphones, title: 'Customer Support', subtitle: "We're here to help." },
]

export default function TrustStrip() {
  return (
    <div className="bg-stone border-y border-line">
      <div className="container-tnt py-6 grid grid-cols-2 msm:grid-cols-3 xl:grid-cols-5 gap-6">
        {items.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon size={22} className="shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
              <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
