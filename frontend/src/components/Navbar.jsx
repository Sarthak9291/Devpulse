import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, GitCompare, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass-panel sticky top-0 z-50 border-b border-dark-border px-6 py-4 flex items-center justify-between mb-8">
            <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-wider text-white">
                    <Activity className="h-6 w-6 text-indigo-400 animate-pulse" />
                    <span>DEV<span className="text-indigo-400">PULSE</span></span>
                </Link>
                
                {user && (
                    <div className="flex items-center gap-6">
                        <Link to="/" className="text-gray-300 hover:text-white transition flex items-center gap-2 text-sm font-medium">
                            <LayoutDashboard className="h-4 w-4" />
                            Organizations
                        </Link>
                        <Link to="/compare" className="text-gray-300 hover:text-white transition flex items-center gap-2 text-sm font-medium">
                            <GitCompare className="h-4 w-4" />
                            Compare Repos
                        </Link>
                        <Link to="/queues" className="text-gray-300 hover:text-white transition flex items-center gap-2 text-sm font-medium">
                            <ShieldAlert className="h-4 w-4" />
                            Queue Health
                        </Link>
                    </div>
                )}
            </div>

            {user ? (
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{user.email}</span>
                    <button 
                        onClick={handleLogout}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium">Sign In</Link>
                    <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-4 py-2 text-sm font-semibold transition">Sign Up</Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
