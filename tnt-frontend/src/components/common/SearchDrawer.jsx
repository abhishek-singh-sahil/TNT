import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'

const popular = ['Oversized T-Shirt', 'Hoodie', 'Cargo Pants', 'Graphic Tee', 'Cap']

export default function SearchDrawer({ open, onClose }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

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
              <div className="flex items-center gap-3 border-b border-ink pb-3">
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
