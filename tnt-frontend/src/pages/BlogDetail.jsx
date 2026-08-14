import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { blogApi } from '../api/services';
import TrustStrip from '../components/common/TrustStrip';
import { ArrowLeft, Loader2, Calendar, User, Clock } from 'lucide-react';

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlogDetail() {
      try {
        setLoading(true);
        const res = await blogApi.getBlogBySlug(slug);
        if (res.success && res.blog) {
          setBlog(res.blog);
        }
      } catch (err) {
        console.error('Failed to load blog article details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBlogDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ink" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-bold uppercase text-ink">Editorial Not Found</h2>
        <p className="text-xs text-muted max-w-sm">No style tip or news article matches the requested URL key.</p>
        <Link to="/blog" className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase rounded">
          BACK TO EDITORIALS
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-screen pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Back Button */}
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink font-bold uppercase mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Editorials
        </Link>

        {/* Article Metadata */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted font-bold uppercase">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {blog.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(blog.publishedAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 3 Min Read</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-ink leading-tight">
            {blog.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted font-semibold leading-relaxed border-l-2 border-ink pl-4">
            {blog.excerpt}
          </p>
        </header>

        {/* Cover Image */}
        <div className="h-64 sm:h-[420px] w-full rounded-xl overflow-hidden border border-line bg-stone my-8">
          <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
        </div>

        {/* Article Body Content */}
        <article className="prose max-w-none text-ink text-sm sm:text-base leading-relaxed space-y-6 font-medium font-sans">
          {blog.content.split('\n').map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            // Simple header matching for Markdown alignment
            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={index} className="text-base font-extrabold uppercase text-ink tracking-wide pt-4 mb-2">
                  {trimmed.replace('### ', '')}
                </h3>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={index} className="text-lg font-black uppercase text-ink tracking-tight pt-6 mb-3">
                  {trimmed.replace('## ', '')}
                </h2>
              );
            }
            if (trimmed.startsWith('# ')) {
              return (
                <h1 key={index} className="text-xl font-black uppercase text-ink tracking-tight pt-8 mb-4 border-b border-line pb-2">
                  {trimmed.replace('# ', '')}
                </h1>
              );
            }

            return (
              <p key={index} className="text-xs sm:text-sm text-muted leading-relaxed font-semibold">
                {trimmed}
              </p>
            );
          })}
        </article>
      </div>

      <div className="mt-20">
        <TrustStrip />
      </div>
    </div>
  );
}
