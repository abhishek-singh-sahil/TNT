import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { authApi } from '../api/services';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight, Eye, EyeOff, CheckCircle, ShieldAlert, RefreshCw, ChevronLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Verification steps
  const [step, setStep] = useState('login'); // 'login' or 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [resending, setResending] = useState(false);

  // Google OAuth Initialization
  useEffect(() => {
    const initGoogleSignIn = () => {
      if (window.google) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '921102923743-pqu68muf0n7p07u0519igk331qbf9fmo.apps.googleusercontent.com';
        if (!window.googleInitDone) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
          });
          window.googleInitDone = true;
        }
        const btnContainer = document.getElementById('google-signin-btn');
        if (btnContainer) {
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: 'outline', size: 'large', width: 350 }
          );
        }
      }
    };

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      document.head.appendChild(script);
    } else {
      setTimeout(initGoogleSignIn, 300);
    }
  }, [step]);

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      const res = await authApi.googleLogin({ credential: response.credential });
      if (res.success) {
        dispatch(setCredentials({ user: res.user, accessToken: res.token }));
        toast.success(`Logged in as ${res.user.firstName}!`);
        if (res.user.role?.name === 'ADMIN' || res.user.role?.name === 'SUPER_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/account/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      if (res.requireVerification) {
        toast.success(res.message + " Please check your spam folder too.");
        setStep('otp');
      } else if (res.success) {
        dispatch(setCredentials({ user: res.user, accessToken: res.token }));
        toast.success(`Welcome back, ${res.user.firstName}!`);
        if (res.user.role?.name === 'ADMIN' || res.user.role?.name === 'SUPER_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/account/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code');
      return;
    }
    setLoading(true);

    try {
      const res = await authApi.verifyOtp({ email, code: otpCode });
      if (res.success) {
        dispatch(setCredentials({ user: res.user, accessToken: res.token }));
        toast.success('Account verified and logged in successfully!');
        if (res.user.role?.name === 'ADMIN' || res.user.role?.name === 'SUPER_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/account/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      const res = await authApi.resendOtp({ email });
      if (res.success) {
        toast.success('Verification OTP code resent successfully! Please check your spam folder too.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-paper min-h-screen py-16 flex items-center justify-center px-4">
      <div className="bg-stone border border-line rounded-xl p-8 max-w-md w-full shadow-lg">
        
        {step === 'login' ? (
          <>
            <div className="text-center mb-8">
              <Link to="/" className="text-3xl font-extrabold tracking-tighter text-ink inline-block mb-2">
                TNT
              </Link>
              <h1 className="text-xl font-bold uppercase text-ink">SIGN IN</h1>
              <p className="text-xs text-muted mt-1">Access your saved streetwear orders & reward points</p>
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
                    placeholder="name@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink font-semibold"
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted hover:text-ink focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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

            {/* Google Sign-in container */}
            <div className="mt-5 space-y-3">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-line"></div>
                <span className="flex-shrink mx-4 text-muted text-[10px] uppercase font-bold tracking-wider">or sign in with</span>
                <div className="flex-grow border-t border-line"></div>
              </div>
              <div id="google-signin-btn" className="w-full flex justify-center"></div>
            </div>

            <div className="mt-6 pt-6 border-t border-line text-center text-xs text-muted">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-ink hover:underline">
                CREATE AN ACCOUNT
              </Link>
            </div>
          </>
        ) : (
          /* OTP verification form view step */
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <ShieldAlert className="w-12 h-12 text-ink mx-auto mb-3" />
              <h1 className="text-xl font-bold uppercase text-ink">Verify OTP</h1>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                A 6-digit verification code has been dispatched to <span className="font-bold text-ink">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1.5 text-center">Enter Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full py-3 px-4 bg-paper border border-line rounded text-center text-lg font-black tracking-widest text-ink focus:outline-none focus:border-ink focus:ring-0"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'VERIFYING...' : 'VERIFY CODE'} <CheckCircle className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-line text-center text-xs">
              <button
                onClick={handleResendOTP}
                disabled={resending}
                className="text-muted hover:text-ink font-bold uppercase flex items-center justify-center gap-1.5 mx-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'RESENDING...' : 'RESEND OTP CODE'}
              </button>

              <button
                onClick={() => setStep('login')}
                className="text-muted hover:text-ink font-bold uppercase flex items-center justify-center gap-1 mx-auto"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Sign In
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
