import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit3, Loader2, X, FileText, Check } from 'lucide-react';
import { blogApi } from '../../api/services';
import toast from 'react-hot-toast';

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    author: 'TNT Editorial'
  });

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const res = await blogApi.getBlogs();
      if (res.success && res.blogs) {
        setBlogs(res.blogs);
      }
    } catch (err) {
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
      author: 'TNT Editorial'
    });
    setModalOpen(true);
  };

  const handleRowClick = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      coverImage: blog.coverImage || '',
      author: blog.author || 'TNT Editorial'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt || !formData.content || !formData.coverImage) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    try {
      setSaving(true);
      if (editingBlog) {
        const res = await blogApi.updateBlog(editingBlog.id, formData);
        if (res.success) {
          toast.success('Blog article updated successfully!');
          setModalOpen(false);
          loadBlogs();
        }
      } else {
        const res = await blogApi.createBlog(formData);
        if (res.success) {
          toast.success('Blog article published successfully!');
          setModalOpen(false);
          loadBlogs();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blog) => {
    if (!window.confirm(`Are you sure you want to delete the article: "${blog.title}"?`)) return;
    try {
      const res = await blogApi.deleteBlog(blog.id);
      if (res.success) {
        toast.success('Article deleted successfully');
        setModalOpen(false);
        loadBlogs();
      }
    } catch (err) {
      toast.error('Failed to delete blog article');
    }
  };

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.excerpt && b.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink">STYLE GUIDES & EDITORIALS (BLOG)</h1>
          <p className="text-xs text-muted">Draft and manage editorial articles, product styling collections, and drop news.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> WRITE NEW ARTICLE
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-paper p-4 border border-line rounded-xl">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone border border-line rounded-lg text-xs font-semibold text-ink focus:outline-none"
          />
        </div>
        <span className="text-xs text-muted font-bold">Total Articles: {filteredBlogs.length}</span>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bg-paper border border-line rounded-xl p-16 text-center space-y-3">
          <FileText className="w-10 h-10 mx-auto text-muted" />
          <span className="font-extrabold text-xs uppercase text-ink block">No Articles Found</span>
          <p className="text-[10px] text-muted">Create a style tip editorial above to populate the feed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredBlogs.map((b) => (
            <div 
              key={b.id} 
              onClick={() => handleRowClick(b)}
              className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col"
            >
              <div className="h-44 w-full bg-stone overflow-hidden border-b border-line">
                <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase">
                    <span>{b.author}</span>
                    <span>{new Date(b.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-ink uppercase tracking-tight line-clamp-1">{b.title}</h3>
                  <p className="text-[11px] text-muted leading-relaxed line-clamp-2">{b.excerpt}</p>
                </div>
                <div className="pt-3 border-t border-line text-right">
                  <span className="text-[9px] font-bold text-ink uppercase hover:underline">Edit Article &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write/Edit Article Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="font-extrabold text-xs uppercase text-ink tracking-wider">
                {editingBlog ? 'Modify Style Guide / Article' : 'Draft New Style Editorial'}
              </span>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-ink mb-1">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Oversized Layering Guide"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-ink mb-1">Author Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Cover Image URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Short Excerpt * (For previews)</label>
                <input
                  type="text"
                  required
                  placeholder="A brief summary sentence of the style tip drop..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-ink mb-1">Full Article Content * (Markdown/Text)</label>
                <textarea
                  required
                  rows={10}
                  placeholder="Write the full style tips, fabric guidelines, and clothing guides here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-stone border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-line">
                {editingBlog && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingBlog)}
                    className="px-4 py-3 border border-red-200 text-red-600 rounded text-xs font-bold uppercase hover:bg-red-50 flex items-center gap-1.5"
                  >
                    Delete Article
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingBlog ? 'SAVE ARTICLE CHANGES' : 'PUBLISH BLOG ARTICLE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
