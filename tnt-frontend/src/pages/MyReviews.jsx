import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AccountSidebar from '../components/layout/AccountSidebar';
import TrustStrip from '../components/common/TrustStrip';
import { reviewApi } from '../api/services';
import { Star, CheckCircle2, Clock, Tag, MessageSquare, ThumbsUp, ThumbsDown, MoreVertical } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

export default function MyReviews() {
  const { user } = useSelector((state) => state.auth);
  const [reviewsData, setReviewsData] = useState({
    stats: { total: 12, published: 11, pending: 1, rejected: 0 },
    reviews: [
      {
        id: 'rev-1',
        productName: 'Oversized Minimal Tee',
        variant: 'Jet Black | M',
        rating: 5,
        title: 'Excellent quality and perfect fit!',
        comment: 'The fabric is super soft and breathable. The oversized fit is just how I like it. Definitely ordering more colors!',
        date: '20 May 2024',
        status: 'PUBLISHED',
        helpfulCount: 12,
        unhelpfulCount: 0,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80',
      },
      {
        id: 'rev-2',
        productName: 'Essential Beige Hoodie',
        variant: 'Beige | L',
        rating: 4,
        title: 'Great hoodie overall',
        comment: 'Very comfortable and warm. Love the color and material. The fit is slightly oversized which I like.',
        date: '15 May 2024',
        status: 'PUBLISHED',
        helpfulCount: 8,
        unhelpfulCount: 0,
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&auto=format&fit=crop&q=80',
      },
      {
        id: 'rev-3',
        productName: 'TNT Classic Cap',
        variant: 'Jet Black | One Size',
        rating: 3,
        title: 'Good cap but size adjustment could be better',
        comment: 'The quality is good and it looks premium. The strap could be improved for a better fit.',
        date: '10 May 2024',
        status: 'PENDING',
        helpfulCount: 0,
        unhelpfulCount: 0,
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&auto=format&fit=crop&q=80',
      },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!user) return;
    async function fetchReviews() {
      try {
        setLoading(true);
        const res = await reviewApi.getMyReviews();
        if (res.success && res.reviews && res.reviews.length > 0) {
          setReviewsData({
            stats: res.stats || { total: res.reviews.length, published: res.reviews.filter(r => r.status === 'APPROVED' || r.status === 'PUBLISHED').length, pending: res.reviews.filter(r => r.status === 'PENDING').length, rejected: res.reviews.filter(r => r.status === 'REJECTED').length },
            reviews: res.reviews.map(r => ({
              id: r.id,
              productName: r.product?.name || 'Streetwear Item',
              variant: 'Standard',
              rating: r.rating || 5,
              title: r.title || 'Great product!',
              comment: r.comment || '',
              date: new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              status: (r.status === 'APPROVED' ? 'PUBLISHED' : r.status) || 'PUBLISHED',
              helpfulCount: r.helpfulCount || 0,
              unhelpfulCount: 0,
              image: r.product?.images?.[0]?.url || r.product?.coverImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300'
            })),
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

  const filteredReviews = reviews.filter(r => {
    if (activeTab === 'PUBLISHED') return r.status === 'PUBLISHED' || r.status === 'APPROVED';
    if (activeTab === 'PENDING') return r.status === 'PENDING';
    if (activeTab === 'REJECTED') return r.status === 'REJECTED';
    return true;
  });

  return (
    <div className="bg-paper min-h-screen pt-4 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2 font-medium">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span>&gt;</span>
          <Link to="/account/dashboard" className="hover:text-ink transition-colors">My Account</Link>
          <span>&gt;</span>
          <span className="text-ink font-bold">Reviews</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AccountSidebar />

          <main className="flex-1 w-full space-y-6">
            
            {/* Header Title + Stats Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-ink uppercase tracking-tight">
                  MY REVIEWS
                </h1>
                <p className="text-xs text-muted mt-0.5">See all the products you've reviewed and manage your feedback.</p>
              </div>

              {/* 4 Summary Stats Cards */}
              <div className="flex items-center gap-4 border border-line rounded-xl p-3 bg-paper">
                <div className="flex items-center gap-2.5 px-3 border-r border-line">
                  <Star className="w-4 h-4 text-ink" />
                  <div>
                    <span className="text-sm font-black text-ink block leading-none">{stats.total}</span>
                    <span className="text-[9px] font-bold text-muted uppercase">Total Reviews</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-3 border-r border-line">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div>
                    <span className="text-sm font-black text-ink block leading-none">{stats.published}</span>
                    <span className="text-[9px] font-bold text-muted uppercase">Published</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-3 border-r border-line">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-sm font-black text-ink block leading-none">{stats.pending}</span>
                    <span className="text-[9px] font-bold text-muted uppercase">Pending</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-3">
                  <Tag className="w-4 h-4 text-muted" />
                  <div>
                    <span className="text-sm font-black text-ink block leading-none">{stats.rejected}</span>
                    <span className="text-[9px] font-bold text-muted uppercase">Rejected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-line pb-3 gap-3">
              <div className="flex gap-6 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={'pb-3 relative transition-all uppercase tracking-wider ' + (activeTab === 'ALL' ? 'text-ink font-black border-b-2 border-ink' : 'text-muted hover:text-ink')}
                >
                  All Reviews ({stats.total})
                </button>
                <button
                  onClick={() => setActiveTab('PUBLISHED')}
                  className={'pb-3 relative transition-all uppercase tracking-wider ' + (activeTab === 'PUBLISHED' ? 'text-ink font-black border-b-2 border-ink' : 'text-muted hover:text-ink')}
                >
                  Published ({stats.published})
                </button>
                <button
                  onClick={() => setActiveTab('PENDING')}
                  className={'pb-3 relative transition-all uppercase tracking-wider ' + (activeTab === 'PENDING' ? 'text-ink font-black border-b-2 border-ink' : 'text-muted hover:text-ink')}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  onClick={() => setActiveTab('REJECTED')}
                  className={'pb-3 relative transition-all uppercase tracking-wider ' + (activeTab === 'REJECTED' ? 'text-ink font-black border-b-2 border-ink' : 'text-muted hover:text-ink')}
                >
                  Rejected ({stats.rejected})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted uppercase">Sort by :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-paper border border-line text-xs font-semibold text-ink rounded px-3 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Most Recent</option>
                  <option value="rating-high">Highest Rating</option>
                  <option value="rating-low">Lowest Rating</option>
                </select>
              </div>
            </div>

            {/* Review Cards List */}
            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="border border-line rounded-xl p-12 text-center space-y-3 bg-paper">
                  <MessageSquare className="w-8 h-8 text-muted/40 mx-auto" />
                  <p className="text-xs font-bold text-ink uppercase">No reviews in this status</p>
                  <p className="text-[11px] text-muted max-w-sm mx-auto">Submit product reviews after receiving your orders to see them here.</p>
                </div>
              ) : (
                filteredReviews.map((rev) => (
                  <div key={rev.id} className="border border-line rounded-xl p-5 bg-paper space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      {/* Left Product & Review Info */}
                      <div className="flex items-start gap-4">
                        <img
                          src={rev.image}
                          alt={rev.productName}
                          className="w-16 h-20 object-cover rounded-lg bg-stone border border-line flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-xs text-ink">{rev.productName}</h3>
                          <p className="text-[10px] text-muted font-medium">{rev.variant}</p>
                          
                          {/* Rating & Title */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex text-ink">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={'w-3.5 h-3.5 ' + (i < rev.rating ? 'fill-ink text-ink' : 'text-line')}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-black text-ink">{rev.rating}/5</span>
                            <span className="text-xs font-black text-ink ml-1">{rev.title}</span>
                          </div>

                          <p className="text-xs text-muted leading-relaxed pt-1">{rev.comment}</p>
                        </div>
                      </div>

                      {/* Right Date, Status, Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0">
                        <span className="text-[10px] text-muted font-semibold">{rev.date}</span>
                        
                        {rev.status === 'PUBLISHED' || rev.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                            ✓ Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                            ⏰ Pending
                          </span>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                          <span className="text-[10px] text-muted font-semibold">Helpful?</span>
                          <button className="flex items-center gap-1 text-[10px] font-bold text-ink hover:opacity-70">
                            <ThumbsUp className="w-3 h-3" /> {rev.helpfulCount}
                          </button>
                          <button className="flex items-center gap-1 text-[10px] font-bold text-ink hover:opacity-70">
                            <ThumbsDown className="w-3 h-3" /> {rev.unhelpfulCount}
                          </button>

                          {rev.status === 'PUBLISHED' ? (
                            <button
                              onClick={() => toast.success('Edit review modal opened')}
                              className="px-3 py-1 border border-line rounded text-[10px] font-bold text-ink hover:bg-stone transition-colors"
                            >
                              Edit Review
                            </button>
                          ) : (
                            <button
                              onClick={() => toast.success('Review request cancelled')}
                              className="px-3 py-1 border border-line rounded text-[10px] font-bold text-ink hover:bg-stone transition-colors"
                            >
                              Cancel Review
                            </button>
                          )}
                          <button className="text-muted hover:text-ink">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              )}
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
