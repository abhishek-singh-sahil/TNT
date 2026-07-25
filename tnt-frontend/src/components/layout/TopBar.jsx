import { Truck, RotateCcw, Banknote } from 'lucide-react'

const items = [
  { icon: Truck, label: 'FREE SHIPPING ON ORDERS ABOVE ₹1999' },
  { icon: RotateCcw, label: 'EASY 14-DAY RETURNS' },
  { icon: Banknote, label: 'COD AVAILABLE' },
]

export default function TopBar() {
  return (
    <div className="bg-ink text-paper text-[11px] tracking-wide">
      <div className="container-tnt flex items-center justify-center gap-6 py-2 overflow-x-auto no-scrollbar">
        {items.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-1.5 whitespace-nowrap">
            <Icon size={12} strokeWidth={2} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
