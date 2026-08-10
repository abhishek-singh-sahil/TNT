import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react'
import { selectCartCount } from '../../store/cartSlice'
import { selectWishlistCount } from '../../store/wishlistSlice'
import SearchDrawer from '../common/SearchDrawer'
import MobileDrawer from '../common/MobileDrawer'
import { productApi, adminApi } from '../../api/services'

const navLinks = [
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'Collections', to: '/collections', hasMenu: true },
  { label: 'Men', to: '/men', hasMenu: true },
  { label: 'Women', to: '/women', hasMenu: true },
  { label: 'Accessories', to: '/accessories' },
  { label: 'Sale', to: '/sale' },
]

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const cartCount = useSelector(selectCartCount)
  const wishlistCount = useSelector(selectWishlistCount)

  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    async function loadHeaderNavData() {
      try {
        const [catRes, collRes] = await Promise.all([
          productApi.getCategories(),
          productApi.getCollections()
        ]);
        if (catRes.success && catRes.categories) {
          setCategories(catRes.categories);
        }
        if (collRes.success && collRes.collections) {
          setCollections(collRes.collections);
        }
      } catch (err) {
        console.error('Failed to fetch header nav data:', err);
      }
    }
    loadHeaderNavData();
  }, []);

  const menCategories = categories.filter(c => c.products?.some(p => p.genderMen));
  const womenCategories = categories.filter(c => c.products?.some(p => p.genderWomen));

  return (
    <header className="sticky top-0 z-40 bg-paper border-b border-line">
      <div className="container-tnt flex items-center justify-between h-[68px] xl:h-20">
        <button
          className="xl:hidden p-2 -ml-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <Link to="/" className="font-display font-extrabold text-2xl tracking-tight">
          TNT
        </Link>

        <nav className="hidden xl:flex items-center gap-8 text-[13px] font-semibold uppercase tracking-wide">
          {/* 1. New Arrivals */}
          <NavLink to="/new-arrivals" className="py-2 hover:text-ink/70 transition-colors">
            New Arrivals
          </NavLink>

          {/* 2. Collections (Dropdown) */}
          <div className="relative group py-2 cursor-pointer">
            <span className="flex items-center gap-1 hover:text-ink/70 transition-colors">
              Collections <ChevronDown size={13} />
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block bg-paper border border-line rounded-lg shadow-xl py-2 w-48 animate-in fade-in slide-in-from-top-1 duration-200">
              {collections.length === 0 ? (
                <span className="block px-4 py-2 text-xs text-muted">No collections drop yet</span>
              ) : (
                collections.map((coll) => (
                  <Link key={coll.id} to={`/collections/${coll.slug}`} className="block px-4 py-2 hover:bg-stone text-xs text-ink">{coll.name}</Link>
                ))
              )}
            </div>
          </div>

          {/* 3. Men (Dropdown) */}
          <div className="relative group py-2 cursor-pointer">
            <span className="flex items-center gap-1 hover:text-ink/70 transition-colors">
              Men <ChevronDown size={13} />
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block bg-paper border border-line rounded-lg shadow-xl py-2 w-48 animate-in fade-in slide-in-from-top-1 duration-200">
              {menCategories.length === 0 ? (
                <span className="block px-4 py-2 text-xs text-muted">No Men categories found</span>
              ) : (
                menCategories.map((cat) => (
                  <Link key={cat.id} to={`/men?category=${cat.slug}`} className="block px-4 py-2 hover:bg-stone text-xs text-ink">{cat.name}</Link>
                ))
              )}
            </div>
          </div>

          {/* 4. Women (Dropdown) */}
          <div className="relative group py-2 cursor-pointer">
            <span className="flex items-center gap-1 hover:text-ink/70 transition-colors">
              Women <ChevronDown size={13} />
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block bg-paper border border-line rounded-lg shadow-xl py-2 w-48 animate-in fade-in slide-in-from-top-1 duration-200">
              {womenCategories.length === 0 ? (
                <span className="block px-4 py-2 text-xs text-muted">No Women categories found</span>
              ) : (
                womenCategories.map((cat) => (
                  <Link key={cat.id} to={`/women?category=${cat.slug}`} className="block px-4 py-2 hover:bg-stone text-xs text-ink">{cat.name}</Link>
                ))
              )}
            </div>
          </div>

          {/* 5. Accessories */}
          <NavLink to="/accessories" className="py-2 hover:text-ink/70 transition-colors">
            Accessories
          </NavLink>

          {/* 6. Sale */}
          <NavLink to="/sale" className="py-2 hover:text-ink/70 transition-colors">
            Sale
          </NavLink>
        </nav>

        <div className="flex items-center gap-1 msm:gap-2">
          <button
            className="hidden msm:flex items-center gap-2 border border-line rounded-card px-3 py-2 text-sm text-muted hover:border-ink transition-colors w-44 xl:w-56"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={16} />
            <span className="truncate">Search products...</span>
          </button>
          <button className="msm:hidden p-2" onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search size={20} />
          </button>

          <Link to="/account" className="p-2 hidden msm:inline-flex" aria-label="Account">
            <User size={20} />
          </Link>

          <Link to="/wishlist" className="p-2 relative" aria-label="Wishlist">
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 bg-ink text-paper text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link to="/cart" className="p-2 relative" aria-label="Cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-ink text-paper text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} links={navLinks} />
    </header>
  )
}
