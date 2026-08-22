import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { adminApi } from './api/services';
import { setSettings } from './store/settingsSlice';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Lookbook from './pages/Lookbook';
import AccountDashboard from './pages/AccountDashboard';
import OrderTracking from './pages/OrderTracking';
import MyReviews from './pages/MyReviews';
import Checkout from './pages/Checkout';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Compare from './pages/Compare';
import Search from './pages/Search';
import Contact from './pages/Contact';
import EmptyStates from './pages/EmptyStates';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Enterprise Suite
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHomepageCMS from './pages/admin/AdminHomepageCMS';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminRoles from './pages/admin/AdminRoles';
import AdminSettings from './pages/admin/AdminSettings';
import AdminMediaLibrary from './pages/admin/AdminMediaLibrary';
import AdminMarketing from './pages/admin/AdminMarketing';
import AdminStaff from './pages/admin/AdminStaff';
import AdminBlogs from './pages/admin/AdminBlogs';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import GuestTrackOrder from './pages/GuestTrackOrder';
import AdminReports from './pages/admin/AdminReports';
import ComingSoon from './pages/ComingSoon';
import InfoPages from './pages/InfoPages';


export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await adminApi.getSettingsPublic();
        if (res.success && res.settings) {
          dispatch(setSettings(res.settings));

          // Dynamically update favicon
          if (res.settings.favicon) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = res.settings.favicon;
          }

          // Dynamically update title
          if (res.settings.siteName) {
            document.title = res.settings.tagline 
              ? `${res.settings.siteName} — ${res.settings.tagline}`
              : res.settings.siteName;
          }
        }
      } catch (err) {
        console.error('Failed to load system settings on storefront:', err);
      }
    }
    loadSettings();
  }, [dispatch]);

  return (
    <Routes>
      {/* Storefront Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/lookbook" element={<Lookbook />} />
        <Route path="/search" element={<Search />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/track-order" element={<GuestTrackOrder />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/empty-states" element={<EmptyStates />} />

        {/* Catalog Sub-routes */}
        <Route path="/new-arrivals" element={<ProductList />} />
        <Route path="/collections" element={<Lookbook />} />
        <Route path="/collections/:slug" element={<ProductList />} />
        <Route path="/men" element={<ProductList />} />
        <Route path="/women" element={<ProductList />} />
        <Route path="/accessories" element={<ProductList />} />
        <Route path="/sale" element={<ProductList />} />

        {/* Cart & Checkout */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />

        {/* Customer Account Routes */}
        <Route path="/account" element={<Navigate to="/account/dashboard" replace />} />
        <Route path="/account/dashboard" element={<AccountDashboard />} />
        <Route path="/account/orders" element={<AccountDashboard />} />
        <Route path="/account/orders/:id/track" element={<OrderTracking />} />
        <Route path="/account/reviews" element={<MyReviews />} />
        <Route path="/account/addresses" element={<AccountDashboard />} />
        <Route path="/account/returns" element={<OrderTracking />} />
        <Route path="/account/rewards" element={<AccountDashboard />} />
        <Route path="/account/coupons" element={<AccountDashboard />} />
        <Route path="/account/details" element={<AccountDashboard />} />
        <Route path="/account/notifications" element={<AccountDashboard />} />
        <Route path="/account/customercare" element={<AccountDashboard />} />
        <Route path="/account/tntverse" element={<AccountDashboard />} />
        <Route path="/account/savedcards" element={<AccountDashboard />} />
        <Route path="/account/howtoreturn" element={<AccountDashboard />} />
        <Route path="/account/terms" element={<AccountDashboard />} />
        <Route path="/account/promotions" element={<AccountDashboard />} />
        <Route path="/account/returns-policy" element={<AccountDashboard />} />
        <Route path="/account/privacy" element={<AccountDashboard />} />
        <Route path="/account/fees" element={<AccountDashboard />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<Login />} />

        {/* Informational Pages */}
        <Route path="/info/:pageKey" element={<InfoPages />} />
        <Route path="/about" element={<Navigate to="/info/about" replace />} />
        <Route path="/size-guide" element={<Navigate to="/info/size-guide" replace />} />
        <Route path="/faqs" element={<Navigate to="/info/faqs" replace />} />
        <Route path="/terms" element={<Navigate to="/info/terms" replace />} />
        <Route path="/privacy-policy" element={<Navigate to="/info/privacy-policy" replace />} />
        <Route path="/shipping-policy" element={<Navigate to="/info/shipping-policy" replace />} />
        <Route path="/return-policy" element={<Navigate to="/info/return-policy" replace />} />
        <Route path="/careers" element={<Navigate to="/info/careers" replace />} />
        <Route path="*" element={<ComingSoon title="404 — Page Not Found" />} />
      </Route>

      {/* Enterprise Admin Suite */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="cms" element={<AdminHomepageCMS />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="coupons" element={<AdminMarketing />} />
        <Route path="media" element={<AdminMediaLibrary />} />
        <Route path="blogs" element={<AdminBlogs />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="roles" element={<AdminRoles />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="settings/:tab" element={<AdminSettings />} />
        <Route path="staff" element={<AdminStaff />} />
      </Route>

    </Routes>
  );
}
