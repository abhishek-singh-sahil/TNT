import { Link } from 'react-router-dom';
import AccountSidebar from '../components/layout/AccountSidebar';
import TrustStrip from '../components/common/TrustStrip';
import { Search, ShoppingBag, Heart, ClipboardList, MapPin, Tag, MessageSquare, BookOpen, Bell } from 'lucide-react';

export default function EmptyStates() {
  const cards = [
    {
      id: '1',
      title: 'No results found',
      subtitle: "We couldn't find anything matching your search.",
      btnText: 'VIEW ALL PRODUCTS',
      btnLink: '/products',
      icon: Search,
    },
    {
      id: '2',
      title: 'Your cart is empty',
      subtitle: "Looks like you haven't added anything to your cart yet.",
      btnText: 'CONTINUE SHOPPING',
      btnLink: '/products',
      icon: ShoppingBag,
    },
    {
      id: '3',
      title: 'Your wishlist is empty',
      subtitle: 'Save items you love to your wishlist.',
      btnText: 'EXPLORE PRODUCTS',
      btnLink: '/products',
      icon: Heart,
    },
    {
      id: '4',
      title: 'No orders yet',
      subtitle: "You haven't placed any orders.",
      btnText: 'START SHOPPING',
      btnLink: '/products',
      icon: ClipboardList,
    },
    {
      id: '5',
      title: 'No addresses added',
      subtitle: 'Add a delivery address to place your order.',
      btnText: 'ADD ADDRESS',
      btnLink: '/account/addresses',
      icon: MapPin,
    },
    {
      id: '6',
      title: 'No coupons available',
      subtitle: 'There are no coupons available for you right now.',
      btnText: 'BROWSE DEALS',
      btnLink: '/products',
      icon: Tag,
    },
    {
      id: '7',
      title: 'No reviews yet',
      subtitle: "You haven't written any reviews.",
      btnText: 'WRITE A REVIEW',
      btnLink: '/account/orders',
      icon: MessageSquare,
    },
    {
      id: '8',
      title: 'No looks saved',
      subtitle: 'Save your favorite looks to view later.',
      btnText: 'EXPLORE LOOKBOOK',
      btnLink: '/lookbook',
      icon: BookOpen,
    },
    {
      id: '9',
      title: 'No notifications',
      subtitle: "You're all caught up. No new notifications.",
      btnText: 'CONTINUE SHOPPING',
      btnLink: '/products',
      icon: Bell,
    },
  ];

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <AccountSidebar />

          <main className="flex-1">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink uppercase tracking-tight mb-1">
                EMPTY STATES
              </h1>
              <p className="text-xs text-muted">Looks like there's nothing here yet.</p>
            </div>

            {/* 9 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {cards.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.id}
                    className="bg-paper border border-line rounded-lg p-8 flex flex-col items-center justify-center text-center shadow-xs hover:border-ink/40 transition-all space-y-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-stone border border-line flex items-center justify-center text-ink mb-1">
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-extrabold text-ink text-sm uppercase">{c.title}</h3>
                    <p className="text-xs text-muted leading-relaxed max-w-xs">{c.subtitle}</p>
                    <Link
                      to={c.btnLink}
                      className="px-5 py-2.5 bg-ink text-paper text-[11px] font-bold uppercase tracking-wider rounded hover:bg-ink/90 inline-block mt-2"
                    >
                      {c.btnText}
                    </Link>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
