import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { authApi } from '../api/services';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('akhtar@example.com');
  const [password, setPassword] = useState('user123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      if (res.success) {
        dispatch(setCredentials({ user: res.user, accessToken: res.token }));
        toast.success(`Welcome back, ${res.user.firstName}!`);
        if (res.user.role?.name === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/account/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please check your credentials and server status.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-paper min-h-screen py-16 flex items-center justify-center px-4">
      <div className="bg-stone border border-line rounded-xl p-8 max-w-md w-full shadow-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold tracking-tighter text-ink inline-block mb-2">
            TNT
          </Link>
          <h1 className="text-xl font-bold uppercase text-ink">CUSTOMER & ADMIN LOGIN</h1>
          <p className="text-xs text-muted mt-1">Access your saved orders, wishlist and role permissions</p>
        </div>

        {/* Quick Account Switcher Buttons for Demo */}
        <div className="mb-6 p-3 bg-paper border border-line rounded-lg text-xs space-y-2">
          <div className="font-bold text-ink uppercase text-[10px]">Quick Demo Sign-In Accounts:</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('akhtar@example.com');
                setPassword('user123');
              }}
              className="flex-1 py-1.5 px-2 bg-stone border border-line rounded font-semibold text-ink text-[11px] hover:bg-line"
            >
              👤 Akhtar (Customer)
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@tntclothing.com');
                setPassword('admin123');
              }}
              className="flex-1 py-1.5 px-2 bg-ink text-paper rounded font-semibold text-[11px] hover:bg-ink/90"
            >
              👑 Super Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-ink uppercase">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-muted hover:text-ink">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'AUTHENTICATING...' : 'SIGN IN'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-line text-center text-xs text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-ink hover:underline">
            CREATE AN ACCOUNT
          </Link>
        </div>
      </div>
    </div>
  );
}
