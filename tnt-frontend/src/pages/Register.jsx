import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { authApi } from '../api/services';
import toast from 'react-hot-toast';
import { Lock, Mail, User, Phone, ArrowRight, Eye, EyeOff, CheckCircle, ShieldAlert, RefreshCw, ChevronLeft } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Verification steps
  const [step, setStep] = useState('register'); // 'register' or 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [resending, setResending] = useState(false);

  // Google OAuth Initialization
  useEffect(() => {
    const initGoogleSignUp = () => {
      if (window.google) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '921102923743-pqu68muf0n7p07u0519igk331qbf9fmo.apps.googleusercontent.com';
        if (!window.googleInitDone) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
          });
          window.googleInitDone = true;
        }
        const btnContainer = document.getElementById('google-signup-btn');
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
      script.onload = initGoogleSignUp;
      document.head.appendChild(script);
    } else {
      setTimeout(initGoogleSignUp, 300);
    }
  }, [step]);

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      const res = await authApi.googleLogin({ credential: response.credential });
      if (res.success) {
        dispatch(setCredentials({ user: res.user, accessToken: res.token }));
        toast.success(`Registered & logged in as ${res.user.firstName}!`);
        if (res.user.role?.name !== 'CUSTOMER') {
          navigate('/admin');
        } else {
          navigate('/account/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Google signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);

    try {
      const res = await authApi.register({
        firstName,
        lastName,
        email,
        phone,
        password
      });

      if (res.requireVerification) {
        toast.success(res.message + " Please check your spam folder too.");
        setStep('otp');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please check credentials.');
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
        toast.success('Account verified and registered successfully! Welcome to TNT Club.');
        if (res.user.role?.name !== 'CUSTOMER') {
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
        
        {step === 'register' ? (
          <>
            <div className="text-center mb-8">
              <Link to="/" className="text-3xl font-extrabold tracking-tighter text-ink inline-block mb-2">
                TNT
              </Link>
              <h1 className="text-xl font-bold uppercase text-ink font-sans">CREATE ACCOUNT</h1>
              <p className="text-xs text-muted mt-1">Join TNT Club & accumulate bonus reward points</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink uppercase mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink uppercase mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99999 88888"
                  className="w-full px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink"
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

              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted hover:text-ink focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'CREATING ACCOUNT...' : 'REGISTER'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Google Signup Container */}
            <div className="mt-5 space-y-3">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-line"></div>
                <span className="flex-shrink mx-4 text-muted text-[10px] uppercase font-bold tracking-wider">or join with</span>
                <div className="flex-grow border-t border-line"></div>
              </div>
              <div id="google-signup-btn" className="w-full flex justify-center animate-fadeIn"></div>
            </div>

            <div className="mt-6 pt-6 border-t border-line text-center text-xs text-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-ink hover:underline">
                SIGN IN
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
                onClick={() => setStep('register')}
                className="text-muted hover:text-ink font-bold uppercase flex items-center justify-center gap-1 mx-auto"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Signup
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
