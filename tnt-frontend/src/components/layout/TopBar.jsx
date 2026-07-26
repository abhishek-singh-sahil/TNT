import { Truck, RotateCcw, Banknote } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrencySymbol, selectSettings } from '../../store/settingsSlice';

export default function TopBar() {
  const currencySymbol = useSelector(selectCurrencySymbol);
  const settings = useSelector(selectSettings);
  const freeShippingMin = settings?.freeShippingMin || 1999;

  const items = [
    { icon: Truck, label: `FREE SHIPPING ON ORDERS ABOVE ${currencySymbol}${freeShippingMin}` },
    { icon: RotateCcw, label: 'EASY 14-DAY RETURNS' },
    { icon: Banknote, label: 'COD AVAILABLE' },
  ];

  // Replicate content to ensure seamless loop
  const marqueeItems = [...items, ...items, ...items, ...items];

  return (
    <div className="bg-ink text-paper text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase overflow-hidden py-2.5 border-b border-line/10">
      <div className="animate-marquee flex items-center gap-12">
        {marqueeItems.map(({ icon: Icon, label }, idx) => (
          <span key={idx} className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <Icon size={13} strokeWidth={2.5} />
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
