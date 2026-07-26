import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist, selectIsWishlisted } from '../../store/wishlistSlice';
import { selectCurrencySymbol } from '../../store/settingsSlice';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const isWishlisted = useSelector(selectIsWishlisted(product.id));
  const currencySymbol = useSelector(selectCurrencySymbol);

  // Extract unique colors from variants dynamically
  const uniqueColors = product.variants
    ? Array.from(
        new Map(
          product.variants
            .map((v) => [v.color?.id, v.color])
            .filter(([id, c]) => c)
        ).values()
      )
    : [];

  const [selectedColor, setSelectedColor] = useState(uniqueColors[0] || null);

  const handleWishlist = (e) => {
    e.preventDefault();
    dispatch(toggleWishlist({ productId: product.id, ...product }));
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  // Find variant matching the selected color to show its price
  const activeVariant = product.variants?.find(
    (v) => v.color?.id === selectedColor?.id
  );

  const basePriceVal = activeVariant ? activeVariant.price : (product.price ?? product.basePrice ?? 0);
  const hasSale = product.discountPercentage > 0;
  const price = hasSale ? Math.round(basePriceVal * (1 - product.discountPercentage / 100)) : basePriceVal;
  const oldPrice = hasSale ? basePriceVal : (product.oldPrice ?? product.discountPrice ?? null);
  const imageSrc = product.image || product.images?.[0]?.url || product.images?.find(i => i.isPrimary)?.url || '';

  const saleBadge = hasSale ? (product.saleCampaign?.badgeText || `-${product.discountPercentage}%`) : null;
  const badge = saleBadge || product.badge || (product.isNewArrival ? 'New' : product.isBestSeller ? 'Best Seller' : product.isTrending ? 'Trending' : null);

  const targetPath = `/product/${product.slug || product.id}${
    selectedColor ? `?color=${encodeURIComponent(selectedColor.name)}` : ''
  }`;

  return (
    <Link to={targetPath} className="group block">
      <div className="relative aspect-[3/4] bg-stone overflow-hidden rounded-card border border-line/40">
        {badge && (
          <span
            className="absolute top-2.5 left-2.5 z-10 text-paper text-[10px] font-bold uppercase px-2 py-1 tracking-wide"
            style={{ backgroundColor: hasSale ? (product.saleCampaign?.badgeColor || '#ff0000') : '#111111' }}
          >
            {badge}
          </span>
        )}
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className="absolute top-2.5 right-2.5 z-10 bg-paper/90 rounded-full p-1.5 hover:bg-paper transition-colors"
        >
          <Heart size={15} fill={isWishlisted ? '#111111' : 'none'} />
        </button>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs bg-stone font-bold uppercase">
            {product.name}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-sm font-medium truncate text-ink">{product.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink">{currencySymbol}{price.toLocaleString('en-IN')}</p>
          {oldPrice && (
            <p className="text-xs text-muted line-through">
              {currencySymbol}{oldPrice.toLocaleString('en-IN')}
            </p>
          )}
        </div>
        {product.rating && (
          <div className="flex items-center gap-1 text-[11px] text-muted">
            <Star size={11} fill="#111111" stroke="none" />
            {product.rating} ({product.reviewCount || 0})
          </div>
        )}
        
        {/* Colors Swatches Option with OnClick selector */}
        {uniqueColors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            {uniqueColors.slice(0, 5).map((c) => (
              <button
                key={c.id}
                title={c.name}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColor(c);
                }}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  selectedColor?.id === c.id ? 'border-ink scale-110 ring-1 ring-ink/20' : 'border-line/80'
                }`}
                style={{ backgroundColor: c.hexCode || '#ccc' }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
