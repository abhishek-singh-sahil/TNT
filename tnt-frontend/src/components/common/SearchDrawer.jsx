import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { productApi } from '../../api/services'

const popular = ['Oversized T-Shirt', 'Hoodie', 'Cargo Pants', 'Graphic Tee', 'Cap']

export default function SearchDrawer({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await productApi.getProducts({ q: query, limit: 5 })
        if (res.success && res.products) {
          setSuggestions(res.products)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query])

  const runSearch = (q) => {
    if (!q.trim()) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    onClose()
    setQuery('')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 left-0 right-0 bg-paper z-50 border-b border-line"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <div className="container-tnt py-6">
              <div className="flex items-center gap-3 border-b border-ink pb-3 relative">
                <Search size={20} className="text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch(query)}
                  placeholder="Search products..."
                  className="flex-1 outline-none text-lg bg-transparent"
                />
                <button onClick={onClose} aria-label="Close search">
                  <X size={22} />
                </button>

                {/* Dynamic Suggestions List */}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-paper border border-line rounded-lg shadow-xl z-50 divide-y divide-line max-h-60 overflow-y-auto animate-fadeIn">
                    {suggestions.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.slug}`}
                        onClick={() => {
                          onClose();
                          setQuery('');
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-stone transition-colors"
                      >
                        <div className="w-8 h-10 bg-stone border border-line rounded overflow-hidden shrink-0">
                          <img
                            src={p.image || p.images?.[0]?.url || ''}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <span className="text-xs font-bold text-ink block truncate">{p.name}</span>
                          <span className="text-[9px] text-muted font-bold block uppercase tracking-wider">SKU: {p.sku}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-5">
                <p className="eyebrow mb-3">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {popular.map((p) => (
                    <button
                      key={p}
                      onClick={() => runSearch(p)}
                      className="text-xs border border-line rounded-full px-4 py-2 hover:border-ink transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
