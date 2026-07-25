import { useState, useEffect } from 'react';
import { adminApi } from '../../api/services';
import { Star, MessageSquare, Trash2, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getReviews();
      if (res.success && res.reviews) {
        setReviews(res.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) return;

    try {
      const res = await adminApi.deleteReview(id);
      if (res.success) {
        toast.success('Review deleted from database successfully');
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-line pb-4">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink">REVIEWS & RATINGS</h1>
        <p className="text-xs text-muted">Moderate and review feedback submitted by buyers on product pages.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-paper border border-line rounded-xl p-16 text-center space-y-3">
          <MessageSquare className="w-10 h-10 mx-auto text-muted animate-pulse" />
          <span className="font-extrabold text-xs uppercase text-ink block">No Reviews Submitted</span>
          <p className="text-[10px] text-muted max-w-xs mx-auto">Once customers submit reviews on product details pages, they will appear here.</p>
        </div>
      ) : (
        <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone font-bold uppercase text-ink border-b border-line">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Product</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Feedback Title & Comment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-stone/40">
                  <td className="p-4 font-bold text-ink">
                    <div>{r.user?.firstName || 'Anonymous'}</div>
                    <div className="text-[10px] text-muted font-mono">{r.user?.email}</div>
                  </td>
                  <td className="p-4 font-semibold text-ink">{r.product?.name || 'Unknown Product'}</td>
                  <td className="p-4">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-yellow-400' : 'text-line'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 max-w-sm">
                    <div className="font-extrabold text-ink">{r.title}</div>
                    <p className="text-muted text-[11px] truncate">{r.comment}</p>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {r.status || 'PUBLISHED'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="p-1.5 text-muted hover:text-red-600 transition-colors"
                      title="Delete from database"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
