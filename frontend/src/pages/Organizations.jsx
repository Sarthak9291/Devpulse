import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiCall } from '../api';
import { Building2, Plus, PlusCircle, LogIn, ArrowRight, Clipboard, Check, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const Organizations = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    // Form inputs
    const [createName, setCreateName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);

    const fetchOrgs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiCall('/orgs/getorganizations');
            setOrgs(res.data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch organizations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Handle GitHub OAuth callback
        const githubSuccess = searchParams.get('github_success');
        const githubError = searchParams.get('github_error');
        const githubUsername = searchParams.get('username');

        if (githubSuccess) {
            setSuccess(`✓ ${githubSuccess}${githubUsername ? ` as @${githubUsername}` : ''}`);
            // Clear success message after 5 seconds
            const timer = setTimeout(() => setSuccess(''), 5000);
            // Clear URL params
            setSearchParams({});
            return () => clearTimeout(timer);
        }

        if (githubError) {
            setError(`GitHub Error: ${githubError}`);
            // Clear error after 5 seconds
            const timer = setTimeout(() => setError(''), 5000);
            // Clear URL params
            setSearchParams({});
            return () => clearTimeout(timer);
        }

        fetchOrgs();
    }, []);

    const handleCreateOrg = async (e) => {
        e.preventDefault();
        if (!createName.trim()) return;
        setCreateLoading(true);
        try {
            await apiCall('/orgs/create', {
                method: 'POST',
                body: JSON.stringify({ name: createName }),
            });
            setCreateName('');
            fetchOrgs();
        } catch (err) {
            setError(err.message || 'Failed to create organization.');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleJoinOrg = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        setJoinLoading(true);
        try {
            await apiCall('/orgs/join', {
                method: 'POST',
                body: JSON.stringify({ inviteCode: joinCode }),
            });
            setJoinCode('');
            fetchOrgs();
        } catch (err) {
            setError(err.message || 'Failed to join organization. Check invite code.');
        } finally {
            setJoinLoading(false);
        }
    };

    const copyToClipboard = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-white">Your Organizations</h1>
                <p className="text-gray-400 mt-1">Select an organization to manage repositories and analytics</p>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-8 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg mb-8 text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Orgs List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-400 mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Organizations Directory
                    </h2>

                    {loading ? (
                        <div className="glass-panel rounded-xl p-12 flex justify-center items-center">
                            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                        </div>
                    ) : orgs.length === 0 ? (
                        <div className="glass-panel rounded-xl p-12 text-center text-gray-400">
                            <Building2 className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                            <p className="font-medium text-white mb-1">No organizations found</p>
                            <p className="text-sm">Create a new organization or join an existing one using an invite code.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orgs.map((org) => (
                                <div key={org.id} className="glass-panel rounded-xl p-5 hover:border-indigo-500/50 transition duration-200 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">{org.name}</h3>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-xs bg-dark-border text-gray-400 px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5">
                                                Invite: {org.inviteCode}
                                                <button 
                                                    onClick={() => copyToClipboard(org.inviteCode, org.id)} 
                                                    className="hover:text-white transition"
                                                >
                                                    {copiedId === org.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Clipboard className="h-3 w-3" />}
                                                </button>
                                            </span>
                                        </div>
                                    </div>
                                    <Link 
                                        to={`/orgs/${org.id}`}
                                        className="mt-4 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 transition rounded-lg py-2 text-center text-sm font-semibold flex items-center justify-center gap-1.5"
                                    >
                                        Enter Workspace
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Operations column */}
                <div className="space-y-6">
                    {/* Create org */}
                    <div className="glass-panel rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-indigo-400" />
                            Create Organization
                        </h2>
                        <form onSubmit={handleCreateOrg} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Organization Name</label>
                                <input 
                                    type="text"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    placeholder="e.g. Acme Corporation"
                                    className="w-full bg-dark-bg/60 border border-dark-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={createLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-semibold transition flex justify-center items-center gap-1.5"
                            >
                                {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Create Org
                            </button>
                        </form>
                    </div>

                    {/* Join org */}
                    <div className="glass-panel rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <LogIn className="h-5 w-5 text-indigo-400" />
                            Join Organization
                        </h2>
                        <form onSubmit={handleJoinOrg} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invite Code</label>
                                <input 
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    placeholder="e.g. 8A2C9B"
                                    className="w-full bg-dark-bg/60 border border-dark-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition uppercase font-mono"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={joinLoading}
                                className="w-full bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 rounded-lg py-2.5 text-sm font-semibold transition flex justify-center items-center gap-1.5"
                            >
                                {joinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                                Join Org
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Organizations;
