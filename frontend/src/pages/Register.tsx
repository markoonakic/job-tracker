import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, login } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register({ email, password });
      await login({ email, password });
      await refreshUser();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-lg bg-secondary">
        <h1 className="text-2xl font-bold mb-6 text-[#8ec07c]">
          Create Account
        </h1>

        {error && (
          <div className="mb-4 p-3 rounded border border-[#fb4934] text-[#fb4934] bg-[#fb4934]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-semibold text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 bg-[#3c3836] border border-transparent rounded text-[#ebdbb2] placeholder-[#928374] focus:outline-none focus:border-[#8ec07c] transition-all duration-200"
              required
            />
          </div>

          <PasswordInput
            value={password}
            onChange={setPassword}
            label="Password"
            required
            autoComplete="new-password"
          />

          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            label="Confirm Password"
            required
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[#689d6a] text-[#282828] rounded font-medium hover:bg-[#8ec07c] disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

          <p className="mt-4 text-center text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-[#689d6a] hover:text-[#8ec07c] transition-colors duration-200">Sign in</Link>
          </p>
      </div>
    </div>
  );
}
