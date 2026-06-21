import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiCall } from '../api';
import { Lock, Mail, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            login(res.accessToken, res.user);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="glass-panel w-full max-w-md rounded-xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-indigo-600/10 p-3 rounded-full mb-3 border border-indigo-500/20">
                        <Activity className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center">Welcome to DevPulse</h2>
                    <p className="text-gray-400 text-sm mt-1 text-center">Engineering intelligence dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2.5 mb-6 text-sm text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-dark-bg/60 border border-dark-border rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-dark-bg/60 border border-dark-border rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-3 font-semibold transition flex justify-center items-center gap-2 text-sm shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-gray-400 text-sm mt-6 text-center">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-indigo-400 hover:underline">Create account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
