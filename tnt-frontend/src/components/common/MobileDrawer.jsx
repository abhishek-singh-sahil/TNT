import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X, User, Heart, ShoppingBag } from 'lucide-react'

export default function MobileDrawer({ open, onClose, links }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed top-0 left-0 h-full w-[82%] max-w-xs bg-paper z-50 xl:hidden flex flex-col"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-line">
              <span className="font-display font-extrabold text-xl">TNT</span>
              <button onClick={onClose} aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-1 text-sm font-semibold uppercase tracking-wide">
                {links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      onClick={onClose}
                      className="block py-3 border-b border-line/70"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-line px-5 py-4 flex items-center gap-6 text-xs font-semibold uppercase">
              <Link to="/account" onClick={onClose} className="flex items-center gap-2">
                <User size={16} /> Account
              </Link>
              <Link to="/wishlist" onClick={onClose} className="flex items-center gap-2">
                <Heart size={16} /> Wishlist
              </Link>
              <Link to="/cart" onClick={onClose} className="flex items-center gap-2">
                <ShoppingBag size={16} /> Cart
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
