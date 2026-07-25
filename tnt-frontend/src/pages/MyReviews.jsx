import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AccountSidebar from '../components/layout/AccountSidebar';
import TrustStrip from '../components/common/TrustStrip';
import { reviewApi } from '../api/services';
import { Star, CheckCircle, Clock, Tag, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function MyReviews() {
  const { user } = useSelector((state) => state.auth);
  const [reviewsData, setReviewsData] = useState({
    stats: { total: 0, published: 0, pending: 0, rejected: 0 },
    reviews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchReviews() {
      try {
        const res = await reviewApi.getMyReviews();
        if (res.success) {
          setReviewsData({
            stats: res.stats || { total: 0, published: 0, pending: 0, rejected: 0 },
            reviews: res.reviews || [],
          });
        }
      } catch (err) {
        console.error('Failed to load customer reviews:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [user]);

  if (!user) {
    return (
      <div className="bg-paper min-h-screen pt-8 pb-16">
        <div className="max-w-container mx-auto px-4 text-center py-16 bg-stone border border-line rounded-xl max-w-md">
          <h2 className="text-xl font-bold text-ink uppercase mb-2">PLEASE SIGN IN</h2>
          <p className="text-xs text-muted mb-6">You must be logged in to view your product reviews.</p>
          <Link to="/login" className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase rounded">
            SIGN IN NOW
          </Link>
        </div>
      </div>
    );
  }

  const { stats, reviews } = reviewsData;

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <Link to="/account/dashboard" className="hover:text-ink">My Account</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">Reviews</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          <AccountSidebar />

          <main className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink uppercase tracking-tight mb-1">
                MY REVIEWS
              </h1>
              <p className="text-xs text-muted">See all the products you've reviewed and manage your feedback.</p>
            </div>

            {/* Metric Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-stone border border-line rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center text-ink border border-line shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-ink">{stats.total}</div>
                  <div className="text-xs text-muted font-medium">Total Reviews</div>
                </div>
              </div>

              <div className="bg-stone border border-line rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-ink">{stats.published}</div>
                  <div className="text-xs text-muted font-medium">Published</div>
                </div>
              </div>

              <div className="bg-stone border border-line rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-ink">{stats.pending}</div>
                  <div className="text-xs text-muted font-medium">Pending</div>
                </div>
              </div>

              <div className="bg-stone border border-line rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-ink">{stats.rejected}</div>
                  <div className="text-xs text-muted font-medium">Rejected</div>
                </div>
              </div>
            </div>

            {/* Zero State or Reviews List */}
            {reviews.length === 0 ? (
              <div className="bg-paper border border-line rounded-lg p-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone border border-line flex items-center justify-center text-ink mx-auto mb-2">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-ink text-base uppercase">NO REVIEWS YET</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  You haven't written any product reviews yet. Reviews can be submitted after completing an order.
                </p>
                <Link
                  to="/account/orders"
                  className="px-6 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded inline-block mt-2"
                >
                  VIEW YOUR ORDERS
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-paper border border-line rounded-lg p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-ink text-sm">{rev.product?.name || 'Reviewed Product'}</h3>
                      <span className="text-xs text-muted">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex text-yellow-500 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-yellow-400' : 'text-line'}`} />
                      ))}
                    </div>
                    <h4 className="font-bold text-ink text-xs mb-1">{rev.title}</h4>
                    <p className="text-xs text-ink/80">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <div className="mt-16">
        <TrustStrip />
      </div>
    </div>
  );
}
