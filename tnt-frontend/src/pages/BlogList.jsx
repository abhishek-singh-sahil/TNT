import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../api/services';
import TrustStrip from '../components/common/TrustStrip';
import { Loader2, Calendar, User, BookOpen } from 'lucide-react';

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlogs() {
      try {
        const res = await blogApi.getBlogs();
        if (res.success && res.blogs) {
          setBlogs(res.blogs);
        }
      } catch (err) {
        console.error('Failed to load blog posts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  return (
    <div className="bg-paper min-h-screen pb-16">
      {/* Editorial Banner */}
      <section className="bg-stone border-b border-line py-16 text-center">
        <div className="max-w-2xl mx-auto px-4 space-y-3">
          <span className="text-[10px] font-extrabold tracking-widest2 text-ink uppercase block">TNT EDITORIAL & STYLE TIPS</span>
          <h1 className="text-3xl font-black uppercase text-ink tracking-tight sm:text-4xl">INSPIRATION & DROPS</h1>
          <p className="text-xs text-muted leading-relaxed font-semibold">
            Discover streetwear guidelines, product sizing guides, layering lookbooks, and care tips curated by the TNT design team.
          </p>
        </div>
      </section>

      {/* Articles Feed */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-ink" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-stone/40 border border-line rounded-xl space-y-4">
            <BookOpen className="w-10 h-10 mx-auto text-muted animate-bounce" />
            <h3 className="font-extrabold text-xs uppercase text-ink">No Editorials Published</h3>
            <p className="text-[10px] text-muted max-w-xs mx-auto">TNT style guides and editorial content will appear here soon.</p>
            <Link to="/" className="px-5 py-2.5 bg-ink text-paper text-[10px] font-bold uppercase tracking-wider rounded inline-block">
              BACK TO HOMEPAGE
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((b) => (
              <article key={b.id} className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <Link to={`/blog/${b.slug}`} className="block h-52 w-full bg-stone overflow-hidden border-b border-line">
                  <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </Link>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[10px] text-muted font-bold uppercase">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {b.author}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(b.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <Link to={`/blog/${b.slug}`} className="block">
                      <h2 className="text-base font-extrabold uppercase text-ink tracking-tight line-clamp-2 hover:underline">
                        {b.title}
                      </h2>
                    </Link>
                    <p className="text-xs text-muted leading-relaxed font-semibold line-clamp-3">
                      {b.excerpt}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-line">
                    <Link to={`/blog/${b.slug}`} className="text-xs font-bold text-ink uppercase hover:underline inline-flex items-center gap-1">
                      Read Article <span className="text-[10px]">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </article>
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
