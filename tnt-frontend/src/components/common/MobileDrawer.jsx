import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, User, Heart, ShoppingBag, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';

export default function MobileDrawer({ open, onClose, links }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

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
            className="fixed top-0 left-0 h-full w-[82%] max-w-xs bg-paper z-50 xl:hidden flex flex-col justify-between"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <div>
              {/* Header Bar */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-line">
                <span className="font-display font-extrabold text-xl tracking-tighter text-ink">TNT</span>
                <button onClick={onClose} aria-label="Close menu" className="text-ink">
                  <X size={22} />
                </button>
              </div>

              {/* Navigation list */}
              <nav className="overflow-y-auto px-5 py-4">
                <ul className="space-y-1 text-xs font-bold uppercase tracking-wider">
                  {/* Always render My Account at the top of the list */}
                  <li>
                    <Link
                      to="/account/dashboard"
                      onClick={onClose}
                      className="flex items-center gap-2 py-3 border-b border-line text-ink hover:underline font-extrabold"
                    >
                      <User size={14} className="text-muted" /> My Account
                    </Link>
                  </li>
                  {links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        onClick={onClose}
                        className="block py-3 border-b border-line/70 text-ink"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Smart Animating Footer Authentication Buttons */}
            <div className="border-t border-line px-5 py-6 bg-stone/30">
              {user ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    dispatch(logout());
                    onClose();
                  }}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-paper text-xs font-bold uppercase rounded flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <LogOut size={14} /> Sign Out
                </motion.button>
              ) : (
                <div className="flex flex-col gap-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to="/login"
                      onClick={onClose}
                      className="w-full py-3 bg-ink hover:bg-black text-paper text-xs font-bold uppercase rounded flex items-center justify-center gap-2 shadow-sm text-center block transition-all"
                    >
                      <LogIn size={14} /> Sign In
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to="/register"
                      onClick={onClose}
                      className="w-full py-3 border border-ink hover:bg-stone text-ink text-xs font-bold uppercase rounded flex items-center justify-center gap-2 text-center block transition-all font-semibold"
                    >
                      <UserPlus size={14} /> Sign Up
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
