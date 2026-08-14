import { useState, useEffect, useRef } from 'react';
import {
  adminApi,
  productApi
} from '../../api/services';
import {
  Star,
  MessageSquare,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  ThumbsUp,
  Clock,
  ThumbsDown,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  MoreVertical,
  CheckSquare,
  Square,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    totalChange: null,
    approved: 0,
    approvedChange: null,
    pending: 0,
    pendingChange: null,
    rejected: 0,
    rejectedChange: null
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState('all'); // 'all', 'PENDING', 'PUBLISHED', 'REJECTED'
  const [sort, setSort] = useState('newest');

  // Date Range state
  const [dateRangeOption, setDateRangeOption] = useState('this-month'); // today, yesterday, last-7, last-30, this-month, last-month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Selected review for details pane
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch initial metadata
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await productApi.getProducts({ limit: 100 });
        if (res.success && res.products) {
          setProductsList(res.products);
        }
      } catch (err) {
        console.error('Failed to load products list:', err);
      }
    };
    fetchMeta();
  }, []);

  // Compute actual date values based on option selected
  const getDateRangeParams = () => {
    const now = new Date();
    let start = null;
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dateRangeOption === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (dateRangeOption === 'yesterday') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (dateRangeOption === 'last-7') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRangeOption === 'last-30') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRangeOption === 'this-month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (dateRangeOption === 'last-month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateRangeOption === 'custom') {
      if (startDate) start = new Date(startDate);
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
    }

    return {
      startDate: start ? start.toISOString() : undefined,
      endDate: end ? end.toISOString() : undefined
    };
  };

  // Fetch reviews list from backend
  const fetchReviews = async (resetPage = false) => {
    try {
      setLoading(true);
      const activePage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const dateParams = getDateRangeParams();
      const params = {
        page: activePage,
        limit,
        search,
        productId: selectedProduct,
        rating: selectedRating,
        status: selectedStatusTab,
        sort,
        ...dateParams
      };

      const res = await adminApi.getReviews(params);
      if (res.success && res.reviews) {
        setReviews(res.reviews);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);

        // Auto select first review if none selected and on desktop
        if (res.reviews.length > 0 && !selectedReviewId) {
          setSelectedReviewId(res.reviews[0].id);
          setSelectedReview(res.reviews[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      toast.error('Failed to load reviews list');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const dateParams = getDateRangeParams();
      const res = await adminApi.getReviewStats(dateParams);
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to fetch review statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Reload data when filters/ranges change
  useEffect(() => {
    fetchReviews(true);
    fetchStats();
    setSelectedIds([]);
  }, [selectedProduct, selectedRating, selectedStatusTab, sort, dateRangeOption, startDate, endDate]);

  // Reload current page only when page number changes
  useEffect(() => {
    fetchReviews(false);
  }, [page]);

  // Keep selectedReview synchronized
  useEffect(() => {
    if (selectedReviewId && reviews.length > 0) {
      const match = reviews.find(r => r.id === selectedReviewId);
      if (match) {
        setSelectedReview(match);
      }
    }
  }, [selectedReviewId, reviews]);

  // Moderate Status Update Handler
  const handleUpdateStatus = async (reviewId, newStatus) => {
    const toastId = toast.loading('Updating review status...');
    try {
      const res = await adminApi.updateReviewStatus(reviewId, newStatus);
      if (res.success) {
        toast.success(`Review ${newStatus === 'PUBLISHED' ? 'Approved' : 'Rejected'} successfully`, { id: toastId });
        fetchReviews(false);
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update review status', { id: toastId });
    }
  };

  // Delete review handler
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review permanently from the database? This will update the product rating statistics.')) return;
    const toastId = toast.loading('Deleting review...');
    try {
      const res = await adminApi.deleteReview(reviewId);
      if (res.success) {
        toast.success('Review deleted successfully', { id: toastId });
        setSelectedReviewId(null);
        setSelectedReview(null);
        fetchReviews(true);
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete review', { id: toastId });
    }
  };

  // Bulk operation actions handler
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    const verb = action === 'APPROVE' ? 'approve' : action === 'REJECT' ? 'reject' : 'delete';
    if (!window.confirm(`Are you sure you want to bulk-${verb} ${selectedIds.length} selected review(s)?`)) return;

    const toastId = toast.loading(`Executing bulk ${verb}...`);
    try {
      const res = await adminApi.bulkReviewAction(action, selectedIds);
      if (res.success) {
        toast.success(`Successfully updated ${selectedIds.length} review(s)`, { id: toastId });
        setSelectedIds([]);
        fetchReviews(true);
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Bulk operation failed', { id: toastId });
    }
  };

  // Handle Export CSV
  const handleExportReviews = () => {
    const dateParams = getDateRangeParams();
    const params = {
      search,
      productId: selectedProduct,
      rating: selectedRating,
      status: selectedStatusTab,
      ...dateParams
    };
    const exportUrl = adminApi.exportReviewsUrl(params);
    window.open(exportUrl, '_blank');
    toast.success('CSV Export initiated successfully');
  };

  // Checkbox helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(reviews.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (e, id) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Formatting helper for date label
  const getDateLabel = () => {
    if (dateRangeOption === 'today') return 'Today';
    if (dateRangeOption === 'yesterday') return 'Yesterday';
    if (dateRangeOption === 'last-7') return 'Last 7 Days';
    if (dateRangeOption === 'last-30') return 'Last 30 Days';
    if (dateRangeOption === 'this-month') return 'This Month';
    if (dateRangeOption === 'last-month') return 'Last Month';
    if (dateRangeOption === 'custom') {
      if (startDate && endDate) return `${startDate} – ${endDate}`;
      return 'Custom Range';
    }
    return 'Select Period';
  };

  // Details open helper
  const openDetails = (r) => {
    setSelectedReviewId(r.id);
    setSelectedReview(r);
    setShowMobileDetails(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink uppercase flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-muted" />
            Reviews & Ratings
          </h1>
          <p className="text-xs text-muted mt-0.5">Manage customer feedback, ratings, and product quality controls.</p>
        </div>

        {/* Date Selector & Export Button */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Date Picker Select Dropdown */}
          <div className="relative flex items-center bg-paper border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink hover:bg-stone transition-colors select-none cursor-pointer gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted" />
            <select
              value={dateRangeOption}
              onChange={(e) => {
                const opt = e.target.value;
                setDateRangeOption(opt);
                if (opt === 'custom') {
                  setShowCustomDatePicker(true);
                } else {
                  setShowCustomDatePicker(false);
                }
              }}
              className="bg-transparent focus:outline-none appearance-none pr-5 cursor-pointer font-bold"
            >
              <option value="this-month">This Month</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last-7">Last 7 Days</option>
              <option value="last-30">Last 30 Days</option>
              <option value="last-month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▼</span>
          </div>

          {/* Custom Date Inputs Drawer/Popup */}
          {showCustomDatePicker && (
            <div className="flex items-center gap-2 bg-stone border border-line px-3 py-1.5 rounded-lg text-xs">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent border-none text-ink text-[11px] font-bold focus:outline-none"
              />
              <span className="text-muted">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent border-none text-ink text-[11px] font-bold focus:outline-none"
              />
              <button
                onClick={() => fetchReviews(true)}
                className="bg-ink text-paper text-[10px] font-bold px-2 py-1 rounded uppercase hover:bg-ink/80"
              >
                Go
              </button>
            </div>
          )}

          <button
            onClick={handleExportReviews}
            className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper rounded-lg text-xs font-bold uppercase hover:bg-ink/90 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Reviews
          </button>
        </div>
      </div>

      {/* ── Top Statistics Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews Card */}
        <div className="bg-paper border border-line rounded-xl p-5 flex gap-4 items-start shadow-xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-500 border border-amber-100">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted tracking-wider">Total Reviews</p>
            <p className="text-2xl font-black text-ink leading-tight mt-0.5">{statsLoading ? '...' : fmt(stats.total)}</p>
            {!statsLoading && stats.totalChange !== null ? (
              <p className={`text-[10px] font-bold flex items-center gap-1 mt-1.5 ${stats.totalChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.totalChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.totalChange)}% vs. previous
              </p>
            ) : (
              <p className="text-[10px] text-muted mt-1.5">— No previous data</p>
            )}
          </div>
        </div>

        {/* Approved Reviews Card */}
        <div className="bg-paper border border-line rounded-xl p-5 flex gap-4 items-start shadow-xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-50 text-green-600 border border-green-100">
            <ThumbsUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted tracking-wider">Approved</p>
            <p className="text-2xl font-black text-ink leading-tight mt-0.5">{statsLoading ? '...' : fmt(stats.approved)}</p>
            {!statsLoading && stats.approvedChange !== null ? (
              <p className={`text-[10px] font-bold flex items-center gap-1 mt-1.5 ${stats.approvedChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.approvedChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.approvedChange)}% vs. previous
              </p>
            ) : (
              <p className="text-[10px] text-muted mt-1.5">— No previous data</p>
            )}
          </div>
        </div>

        {/* Pending Reviews Card */}
        <div className="bg-paper border border-line rounded-xl p-5 flex gap-4 items-start shadow-xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-50 text-purple-600 border border-purple-100">
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted tracking-wider">Pending</p>
            <p className="text-2xl font-black text-ink leading-tight mt-0.5">{statsLoading ? '...' : fmt(stats.pending)}</p>
            {!statsLoading && stats.pendingChange !== null ? (
              <p className={`text-[10px] font-bold flex items-center gap-1 mt-1.5 ${stats.pendingChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.pendingChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.pendingChange)}% vs. previous
              </p>
            ) : (
              <p className="text-[10px] text-muted mt-1.5">— No previous data</p>
            )}
          </div>
        </div>

        {/* Rejected Reviews Card */}
        <div className="bg-paper border border-line rounded-xl p-5 flex gap-4 items-start shadow-xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 text-red-600 border border-red-100">
            <ThumbsDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted tracking-wider">Rejected</p>
            <p className="text-2xl font-black text-ink leading-tight mt-0.5">{statsLoading ? '...' : fmt(stats.rejected)}</p>
            {!statsLoading && stats.rejectedChange !== null ? (
              <p className={`text-[10px] font-bold flex items-center gap-1 mt-1.5 ${stats.rejectedChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.rejectedChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.rejectedChange)}% vs. previous
              </p>
            ) : (
              <p className="text-[10px] text-muted mt-1.5">— No previous data</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Filtering Toolbar ───────────────────────────────────────────────────── */}
      <div className="bg-paper border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search reviews (name, text, order)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReviews(true)}
            className="w-full bg-stone border border-line rounded-lg pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-ink/30 transition-colors"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
          {/* Products filter */}
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-stone border border-line rounded-lg px-2.5 py-2 text-xs text-ink focus:outline-none max-w-[140px] truncate"
          >
            <option value="all">All Products</option>
            {productsList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Ratings filter */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="bg-stone border border-line rounded-lg px-2.5 py-2 text-xs text-ink focus:outline-none"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Sort selection */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-stone border border-line rounded-lg px-2.5 py-2 text-xs text-ink focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* ── Main Two Column Layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* LEFT / CENTER: Reviews Table Card */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tabs Bar */}
          <div className="border-b border-line flex items-center justify-between pb-1 gap-4 overflow-x-auto">
            <div className="flex gap-4">
              {[
                { id: 'all', label: 'All Reviews' },
                { id: 'PENDING', label: 'Pending' },
                { id: 'PUBLISHED', label: 'Approved' },
                { id: 'REJECTED', label: 'Rejected' }
              ].map(tab => {
                const isActive = selectedStatusTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedStatusTab(tab.id)}
                    className={`pb-2.5 text-xs font-bold uppercase relative transition-colors ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider">
              {totalCount} items found
            </div>
          </div>

          {/* Table container */}
          <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs relative">
            {loading ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-muted mx-auto mb-3" />
                <p className="text-xs text-muted">Fetching reviews from database...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-24 text-center space-y-3">
                <MessageSquare className="w-10 h-10 mx-auto text-line animate-pulse" />
                <h3 className="font-extrabold text-xs uppercase text-ink">No Reviews Found</h3>
                <p className="text-[10px] text-muted max-w-xs mx-auto">Try refining your searches, filters, or selected date period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-semibold text-ink text-left border-collapse">
                  <thead className="bg-stone/50 border-b border-line text-[10px] text-muted uppercase">
                    <tr>
                      <th className="px-5 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={reviews.length > 0 && selectedIds.length === reviews.length}
                          onChange={handleSelectAll}
                          className="rounded text-ink focus:ring-ink"
                        />
                      </th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3 text-center">Rating</th>
                      <th className="px-5 py-3">Feedback</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {reviews.map((r) => {
                      const isChecked = selectedIds.includes(r.id);
                      const isSelected = selectedReviewId === r.id;
                      const hasAvatar = !!r.user?.avatar;

                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedReviewId(r.id)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-stone/30' : 'hover:bg-stone/10'}`}
                        >
                          {/* Checkbox cell */}
                          <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleSelectRow(e, r.id)}
                              className="rounded text-ink focus:ring-ink"
                            />
                          </td>

                          {/* Customer cell */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-stone flex items-center justify-center overflow-hidden flex-shrink-0 border border-line">
                                {hasAvatar ? (
                                  <img src={r.user.avatar} alt={r.user.firstName} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-extrabold text-[10px] text-muted uppercase">
                                    {(r.user?.firstName || 'A')[0]}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-ink truncate">{r.user?.firstName} {r.user?.lastName}</div>
                                {r.user?.location && (
                                  <div className="text-[10px] text-muted flex items-center gap-0.5 mt-0.5 truncate">
                                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> {r.user.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Product cell */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {r.product?.image ? (
                                <img src={r.product.image} alt={r.product.name} className="w-8 h-8 object-cover rounded-lg border border-line bg-stone" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-stone flex items-center justify-center border border-line font-black text-[9px] text-muted">
                                  TNT
                                </div>
                              )}
                              <div className="min-w-0 max-w-[130px]">
                                <div className="font-bold text-ink truncate leading-tight">{r.product?.name}</div>
                                {r.variantInfo && (
                                  <div className="text-[9px] text-muted truncate mt-0.5">{r.variantInfo}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Rating cell */}
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center text-amber-400 gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400' : 'text-line'}`} />
                              ))}
                            </div>
                          </td>

                          {/* Feedback text cell */}
                          <td className="px-5 py-4 max-w-[180px]">
                            <div className="font-extrabold text-ink truncate">{r.title}</div>
                            <p className="text-muted text-[10px] mt-0.5 truncate">{r.comment}</p>
                          </td>

                          {/* Date cell */}
                          <td className="px-5 py-4 text-muted whitespace-nowrap text-[10px]">
                            {new Date(r.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>

                          {/* Status cell */}
                          <td className="px-5 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              r.status === 'PUBLISHED'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : r.status === 'PENDING'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {r.status === 'PUBLISHED' ? 'Approved' : r.status === 'PENDING' ? 'Pending' : 'Rejected'}
                            </span>
                          </td>

                          {/* Actions cell */}
                          <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {r.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(r.id, 'PUBLISHED')}
                                    className="p-1 rounded bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors"
                                    title="Approve Review"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                                    className="p-1 rounded bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors"
                                    title="Reject Review"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {r.status === 'PUBLISHED' && (
                                <button
                                  onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                                  className="p-1 rounded bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors text-[9px] font-bold uppercase px-1.5"
                                  title="Reject"
                                >
                                  Reject
                                </button>
                              )}
                              {r.status === 'REJECTED' && (
                                <button
                                  onClick={() => handleUpdateStatus(r.id, 'PUBLISHED')}
                                  className="p-1 rounded bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors text-[9px] font-bold uppercase px-1.5"
                                  title="Approve"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => openDetails(r)}
                                className="p-1 border border-line rounded text-muted hover:text-ink hover:bg-stone transition-colors"
                                title="View Details"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Floating Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-paper border-2 border-ink rounded-xl p-4 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-ink" />
                <span className="text-xs font-bold text-ink">
                  {selectedIds.length} review{selectedIds.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('APPROVE')}
                  className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg transition-colors"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkAction('REJECT')}
                  className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg transition-colors"
                >
                  Reject Selected
                </button>
                <button
                  onClick={() => handleBulkAction('DELETE')}
                  className="bg-stone text-red-500 border border-red-200 hover:bg-red-50 text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && reviews.length > 0 && (
            <div className="flex items-center justify-between border-t border-line pt-4 text-xs font-semibold text-ink">
              <span className="text-muted">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {fmt(totalCount)} reviews
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-line rounded-lg hover:bg-stone disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${
                        page === pNum
                          ? 'bg-ink text-paper border-ink'
                          : 'border-line hover:bg-stone text-ink'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-line rounded-lg hover:bg-stone disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Review Details Sidebar (Desktop) */}
        <div className="hidden xl:block bg-paper border border-line rounded-2xl p-5 space-y-6 shadow-xs sticky top-4">
          <div className="flex justify-between items-center border-b border-line pb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted">Review Details</h2>
            {selectedReview && (
              <button
                onClick={() => handleDeleteReview(selectedReview.id)}
                className="text-red-400 hover:text-red-600 transition-colors p-1 border border-line rounded-md"
                title="Delete permanently"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!selectedReview ? (
            <div className="py-20 text-center text-muted space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-line animate-pulse" />
              <p className="text-[10px] uppercase font-bold">Select a review</p>
              <p className="text-[10px]">Click any review row in the table to display complete details panel.</p>
            </div>
          ) : (
            <div className="space-y-6 text-xs">
              {/* Product Info Section */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider block">Product Information</span>
                <div className="flex gap-3 bg-stone/30 border border-line p-3 rounded-xl">
                  {selectedReview.product?.image ? (
                    <img src={selectedReview.product.image} alt={selectedReview.product.name} className="w-12 h-12 object-cover rounded-lg border border-line bg-paper" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-paper border border-line flex items-center justify-center text-[10px] font-black text-muted">
                      TNT
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-ink truncate leading-tight">{selectedReview.product?.name}</h4>
                    <p className="text-[10px] text-muted mt-0.5 uppercase tracking-wider">{selectedReview.product?.sku}</p>
                    {selectedReview.variantInfo && (
                      <p className="text-[10px] text-muted mt-0.5">{selectedReview.variantInfo}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span className="font-extrabold text-ink text-[11px]">
                        {selectedReview.product?.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info Section */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider block">Customer Information</span>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-stone flex items-center justify-center overflow-hidden border border-line flex-shrink-0">
                    {selectedReview.user?.avatar ? (
                      <img src={selectedReview.user.avatar} alt={selectedReview.user.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-black text-xs text-muted uppercase">
                        {(selectedReview.user?.firstName || 'A')[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-ink leading-tight">{selectedReview.user?.firstName} {selectedReview.user?.lastName}</h4>
                    <div className="text-[10px] text-muted mt-0.5 flex flex-col gap-0.5 font-medium">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-muted flex-shrink-0" /> {selectedReview.user?.email}</span>
                      {selectedReview.user?.phone && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted flex-shrink-0" /> {selectedReview.user.phone}</span>
                      )}
                      {selectedReview.user?.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted flex-shrink-0" /> {selectedReview.user.location}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider block">Review Feedback</span>
                <div className="bg-stone/30 border border-line rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-ink leading-tight">{selectedReview.title}</span>
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < selectedReview.rating ? 'fill-amber-400' : 'text-line'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted text-[11px] leading-relaxed italic">"{selectedReview.comment}"</p>
                  {selectedReview.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-200 uppercase mt-1">
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>
              </div>

              {/* Order Info Section */}
              <div className="space-y-2.5 border-t border-line pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted block">Review Date</span>
                    <span className="font-semibold text-ink mt-0.5 block">
                      {new Date(selectedReview.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted block">Order ID</span>
                    {selectedReview.orderId ? (
                      <a
                        href={`/admin/orders?search=${selectedReview.orderNumber}`}
                        className="font-extrabold text-ink hover:underline flex items-center gap-1 mt-0.5 text-blue-600"
                        title="Click to track/manage order"
                      >
                        #{selectedReview.orderNumber}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted mt-0.5 block">Not available</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Management Selection */}
              <div className="space-y-2 border-t border-line pt-4">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider block">Status Management</span>
                <div className="relative">
                  <select
                    value={selectedReview.status}
                    onChange={(e) => handleUpdateStatus(selectedReview.id, e.target.value)}
                    className="w-full bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none font-bold appearance-none cursor-pointer"
                  >
                    <option value="PUBLISHED">Approved / Published</option>
                    <option value="PENDING">Pending Moderation</option>
                    <option value="REJECTED">Rejected / Hidden</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▼</span>
                </div>
              </div>

              {/* Approve / Reject primary controls */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleUpdateStatus(selectedReview.id, 'REJECTED')}
                  disabled={selectedReview.status === 'REJECTED'}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                    selectedReview.status === 'REJECTED'
                      ? 'border-line text-muted bg-stone/20 cursor-not-allowed'
                      : 'border-red-200 text-red-500 hover:bg-red-50'
                  }`}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReview.id, 'PUBLISHED')}
                  disabled={selectedReview.status === 'PUBLISHED'}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    selectedReview.status === 'PUBLISHED'
                      ? 'bg-stone text-muted cursor-not-allowed'
                      : 'bg-ink text-paper hover:bg-ink/90 shadow-xs'
                  }`}
                >
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile/Tablet Bottom Sheet details ──────────────────────────────────── */}
      {showMobileDetails && selectedReview && (
        <div className="fixed inset-0 z-50 xl:hidden bg-black/60 backdrop-blur-xs flex items-end justify-center p-0">
          <div className="bg-paper rounded-t-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Handle Bar */}
            <div className="w-12 h-1.5 bg-line rounded-full mx-auto my-3 flex-shrink-0" />

            {/* Header */}
            <div className="flex justify-between items-center px-5 pb-3 border-b border-line">
              <span className="text-xs font-extrabold uppercase text-muted tracking-wider">Review Details</span>
              <button
                onClick={() => setShowMobileDetails(false)}
                className="p-1 rounded-md border border-line text-muted hover:text-ink"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Mobile Sheet Body */}
            <div className="p-5 space-y-6 text-xs overflow-y-auto flex-1 pb-10">
              {/* Product Info */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider block">Product Information</span>
                <div className="flex gap-3 bg-stone/30 border border-line p-3 rounded-xl">
                  {selectedReview.product?.image ? (
                    <img src={selectedReview.product.image} alt={selectedReview.product.name} className="w-10 h-10 object-cover rounded-lg border border-line bg-paper" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-paper border border-line flex items-center justify-center text-[10px] font-black text-muted">
                      TNT
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-ink truncate">{selectedReview.product?.name}</h4>
                    <p className="text-[9px] text-muted uppercase mt-0.5 tracking-wider">{selectedReview.product?.sku}</p>
                    {selectedReview.variantInfo && (
                      <p className="text-[9px] text-muted mt-0.5">{selectedReview.variantInfo}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span className="font-extrabold text-ink text-[10px]">
                        {selectedReview.product?.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider block">Customer Information</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone flex items-center justify-center overflow-hidden border border-line flex-shrink-0">
                    {selectedReview.user?.avatar ? (
                      <img src={selectedReview.user.avatar} alt={selectedReview.user.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-black text-xs text-muted uppercase">
                        {(selectedReview.user?.firstName || 'A')[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-ink">{selectedReview.user?.firstName} {selectedReview.user?.lastName}</h4>
                    <div className="text-[9px] text-muted mt-0.5 flex flex-col gap-0.5">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-muted flex-shrink-0" /> {selectedReview.user?.email}</span>
                      {selectedReview.user?.phone && (
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-muted flex-shrink-0" /> {selectedReview.user.phone}</span>
                      )}
                      {selectedReview.user?.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-muted flex-shrink-0" /> {selectedReview.user.location}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Text block */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider block">Review Feedback</span>
                <div className="bg-stone/30 border border-line rounded-xl p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-ink">{selectedReview.title}</span>
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < selectedReview.rating ? 'fill-amber-400' : 'text-line'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted leading-relaxed italic">"{selectedReview.comment}"</p>
                  {selectedReview.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-200 uppercase mt-1">
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>
              </div>

              {/* Order Info & Date */}
              <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
                <div>
                  <span className="text-[9px] font-bold uppercase text-muted block">Review Date</span>
                  <span className="font-semibold text-ink mt-0.5 block">
                    {new Date(selectedReview.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-muted block">Order ID</span>
                  {selectedReview.orderId ? (
                    <a
                      href={`/admin/orders?search=${selectedReview.orderNumber}`}
                      className="font-extrabold text-ink hover:underline flex items-center gap-1 mt-0.5 text-blue-600"
                    >
                      #{selectedReview.orderNumber}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-muted mt-0.5 block">Not available</span>
                  )}
                </div>
              </div>

              {/* Status Select Box */}
              <div className="space-y-2 border-t border-line pt-4">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider block">Status Management</span>
                <div className="relative">
                  <select
                    value={selectedReview.status}
                    onChange={(e) => handleUpdateStatus(selectedReview.id, e.target.value)}
                    className="w-full bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none font-bold appearance-none cursor-pointer"
                  >
                    <option value="PUBLISHED">Approved / Published</option>
                    <option value="PENDING">Pending Moderation</option>
                    <option value="REJECTED">Rejected / Hidden</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▼</span>
                </div>
              </div>

              {/* Actions row controls */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedReview.id, 'REJECTED');
                    setShowMobileDetails(false);
                  }}
                  disabled={selectedReview.status === 'REJECTED'}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                    selectedReview.status === 'REJECTED'
                      ? 'border-line text-muted bg-stone/20 cursor-not-allowed'
                      : 'border-red-200 text-red-500 hover:bg-red-50'
                  }`}
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedReview.id, 'PUBLISHED');
                    setShowMobileDetails(false);
                  }}
                  disabled={selectedReview.status === 'PUBLISHED'}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    selectedReview.status === 'PUBLISHED'
                      ? 'bg-stone text-muted cursor-not-allowed'
                      : 'bg-ink text-paper hover:bg-ink/90'
                  }`}
                >
                  Approve
                </button>
              </div>

              {/* Danger Actions row */}
              <div className="border-t border-line pt-4">
                <button
                  onClick={() => {
                    handleDeleteReview(selectedReview.id);
                    setShowMobileDetails(false);
                  }}
                  className="w-full py-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
