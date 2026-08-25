import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * ActionMenu — a portal-based dropdown menu that escapes overflow:auto table containers.
 * 
 * Usage:
 *   <ActionMenu
 *     trigger={<button>...</button>}
 *     items={[
 *       { label: 'Edit', icon: <Edit />, onClick: () => ... },
 *       { label: 'Delete', icon: <Trash />, onClick: () => ..., danger: true },
 *       { divider: true },
 *       { label: 'View', icon: <Eye />, onClick: () => ... },
 *     ]}
 *   />
 */
export default function ActionMenu({ trigger, items = [], align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 176; // w-44 = 11rem = 176px
    const estimatedMenuHeight = items.length * 34 + 16; // rough estimate
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Vertical: open up if not enough space below
    const spaceBelow = viewportHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedMenuHeight + 8 && rect.top > estimatedMenuHeight;
    const top = openUpward
      ? rect.top + window.scrollY - estimatedMenuHeight - 4
      : rect.bottom + window.scrollY + 4;

    // Horizontal: prefer right-aligned, clamp to viewport
    let left;
    if (align === 'right') {
      left = rect.right + window.scrollX - menuWidth;
    } else {
      left = rect.left + window.scrollX;
    }
    // Clamp so it doesn't go off-screen
    left = Math.max(8, Math.min(left, viewportWidth + window.scrollX - menuWidth - 8));

    setMenuStyle({
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      zIndex: 9999,
    });
  }, [items.length, align]);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    if (!open) {
      calculatePosition();
    }
    setOpen(prev => !prev);
  }, [open, calculatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleEsc);
    // Recalculate on scroll/resize
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [open, calculatePosition]);

  return (
    <>
      {/* Trigger element — clone with ref attached */}
      <span ref={triggerRef} onClick={handleToggle} className="inline-block">
        {trigger}
      </span>

      {/* Menu portal — renders into document.body, outside all overflow containers */}
      {open && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="bg-paper border border-line rounded-xl shadow-xl py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={idx} className="border-t border-line my-1" />;
            }
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick?.();
                }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-ink hover:bg-stone'
                }`}
              >
                {item.icon && (
                  <span className={`w-3.5 h-3.5 flex-shrink-0 ${item.danger ? 'text-red-500' : 'text-muted'}`}>
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
