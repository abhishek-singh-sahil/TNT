import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import toast from 'react-hot-toast';
import { Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      id: `usr-${Date.now()}`,
      firstName,
      lastName,
      email,
      phone,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      rewardPoints: 100,
      rewardTier: 'Standard',
    };

    dispatch(setCredentials({ user: newUser, accessToken: 'demo_token_new' }));
    toast.success('Account created! Welcome to TNT Club.');
    navigate('/account/dashboard');
  };

  return (
    <div className="bg-paper min-h-screen py-16 flex items-center justify-center px-4">
      <div className="bg-stone border border-line rounded-xl p-8 max-w-md w-full shadow-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold tracking-tighter text-ink inline-block mb-2">
            TNT
          </Link>
          <h1 className="text-xl font-bold uppercase text-ink">CREATE ACCOUNT</h1>
          <p className="text-xs text-muted mt-1">Join TNT Club & get 100 bonus reward points</p>
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
                className="w-full px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink uppercase mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink"
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
              className="w-full px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wider rounded hover:bg-ink/90 transition-all flex items-center justify-center gap-2"
          >
            REGISTER <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-line text-center text-xs text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-ink hover:underline">
            SIGN IN
          </Link>
        </div>
      </div>
    </div>
  );
}
