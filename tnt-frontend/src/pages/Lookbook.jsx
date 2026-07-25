import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TrustStrip from '../components/common/TrustStrip';
import { lookbookApi } from '../api/services';
import { ArrowRight, Bookmark, BookOpen } from 'lucide-react';

export default function Lookbook() {
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLookbooks() {
      try {
        const res = await lookbookApi.getLookbooks();
        if (res.success && res.lookbooks) {
          setLookbooks(res.lookbooks);
        } else {
          setLookbooks([]);
        }
      } catch (err) {
        console.error('Failed to load lookbooks:', err);
        setLookbooks([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLookbooks();
  }, []);

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Lookbook</span>
        </nav>

        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-ink uppercase tracking-tight mb-3">
            LOOKBOOK
          </h1>
          <p className="text-base text-muted max-w-2xl leading-relaxed">
            Your daily dose of style inspiration. Explore curated looks and new ways to wear your favorites.
          </p>
        </div>

        {lookbooks.length === 0 ? (
          <div className="bg-stone border border-line rounded-xl p-16 text-center space-y-4 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-paper border border-line flex items-center justify-center text-ink mx-auto mb-2">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-ink uppercase">NO LOOKBOOK ENTRIES YET</h3>
            <p className="text-xs text-muted leading-relaxed">
              Curated editorial lookbooks have not been published yet. Admin can create lookbooks from the Admin Panel.
            </p>
            <Link
              to="/admin"
              className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded inline-block mt-2"
            >
              CREATE LOOKBOOK IN ADMIN
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lookbooks.map((lb) => (
              <div key={lb.id} className="group bg-paper border border-line rounded-lg overflow-hidden flex flex-col relative shadow-sm">
                <div className="h-80 overflow-hidden bg-stone">
                  <img src={lb.coverImage || lb.image} alt={lb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="font-extrabold text-ink text-base uppercase">{lb.title}</h3>
                  <p className="text-xs text-muted mb-4">{lb.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
