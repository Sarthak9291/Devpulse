import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiCall, getAuthHeaders, getBaseUrl } from '../api';
import { Building2, Plus, GitBranch, Users, ArrowRight, Sparkles, AlertTriangle, CheckCircle, BarChart3, Loader2 } from 'lucide-react';

const Github = ({ className = "h-4 w-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.867 8.17 6.84 9.5.5.08.66-.22.66-.48 0-.25-.01-1-.01-1.83-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.35-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.29.1-2.67 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.42.1 2.67.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.16.57.67.48C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
    </svg>
);

const OrganizationDetails = () => {
    const { orgId } = useParams();
    const [org, setOrg] = useState(null);
    const [members, setMembers] = useState([]);
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // GitHub Link state
    const [githubUser, setGithubUser] = useState(null);
    const [githubRepos, setGithubRepos] = useState([]);
    const [linkTargetRepo, setLinkTargetRepo] = useState('');
    const [linkTargetGithubId, setLinkTargetGithubId] = useState('');

    // Organization Analytics
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // AI summary
    const [aiSummary, setAiSummary] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // Create repo form
    const [newRepoName, setNewRepoName] = useState('');
    const [createRepoLoading, setCreateRepoLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const orgData = await apiCall(`/orgs/${orgId}`);
            setOrg(orgData.data);

            const membersData = await apiCall(`/orgs/${orgId}/members`);
            setMembers(membersData.data || []);

            const reposData = await apiCall(`/repos/organizations/${orgId}/repositories`);
            setRepos(reposData.data || []);

            // Check if GitHub is connected for logged-in user
            try {
                const statusRes = await apiCall('/github/status');
                if (statusRes.connected && statusRes.username) {
                    setGithubUser(statusRes.username);
                    try {
                        const ghRepos = await apiCall('/github/repos');
                        setGithubRepos(ghRepos.data || []);
                    } catch (e) {
                        console.log('Failed to fetch github repos', e);
                    }
                } else {
                    setGithubUser(null);
                    setGithubRepos([]);
                }
            } catch (e) {
                console.log('Failed to fetch github status', e);
            }

            // Fetch Org Analytics
            fetchAnalytics();
        } catch (err) {
            setError(err.message || 'Failed to fetch organization details.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const analyticsData = await apiCall(`/orgs/${orgId}/analytics`);
            setAnalytics(analyticsData.data);
        } catch (err) {
            console.error('Failed to fetch org analytics', err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [orgId]);

    const handleCreateRepo = async (e) => {
        e.preventDefault();
        if (!newRepoName.trim()) return;
        setCreateRepoLoading(true);
        try {
            await apiCall(`/repos/organizations/${orgId}/repositories`, {
                method: 'POST',
                body: JSON.stringify({ name: newRepoName }),
            });
            setNewRepoName('');
            fetchData();
        } catch (err) {
            setError(err.message || 'Failed to create repository.');
        } finally {
            setCreateRepoLoading(false);
        }
    };

    const handleConnectGithub = async () => {
        try {
            const headers = getAuthHeaders();
            const res = await apiCall('/github/login', {
                headers
            });
            if (res.url) {
                window.location.href = res.url;
            }
        } catch (err) {
            setError(err.message || 'Failed to trigger GitHub connection.');
        }
    };

    const handleLinkRepo = async (e) => {
        e.preventDefault();
        if (!linkTargetRepo || !linkTargetGithubId) return;

        const selectedGhRepo = githubRepos.find(r => String(r.id) === String(linkTargetGithubId));
        if (!selectedGhRepo) return;

        try {
            await apiCall(`/github/link/${linkTargetRepo}`, {
                method: 'POST',
                body: JSON.stringify({
                    githubRepoId: String(selectedGhRepo.id),
                    githubRepoName: selectedGhRepo.name,
                    githubRepoUrl: selectedGhRepo.html_url
                }),
            });
            setLinkTargetRepo('');
            setLinkTargetGithubId('');
            fetchData();
        } catch (err) {
            setError(err.message || 'Failed to link repository.');
        }
    };

    const handleGetAiSummary = async () => {
        setAiLoading(true);
        setAiSummary('');
        try {
            const res = await apiCall(`/ai/organization/${orgId}`);
            setAiSummary(res.data.summary);
        } catch (err) {
            setError(err.message || 'Failed to generate AI weekly summary.');
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (!org) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-400">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white">Organization Not Found</h2>
                <Link to="/" className="text-indigo-400 hover:underline mt-2 inline-block">Go back home</Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-dark-border pb-6 mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-indigo-400" />
                        <h1 className="text-3xl font-bold text-white">{org.name}</h1>
                    </div>
                    <p className="text-gray-400 mt-1 text-sm font-mono uppercase tracking-wider">Invite Code: {org.inviteCode}</p>
                </div>

                <div className="flex items-center gap-3">
                    {!githubUser ? (
                        <div className="flex items-center gap-2">
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1">
                                Status: Not Connected
                            </span>
                            <button 
                                onClick={handleConnectGithub}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-zinc-700 transition"
                            >
                                <Github className="h-4 w-4" />
                                Connect GitHub
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                Status: Connected
                            </span>
                            <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                GitHub: @{githubUser}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={handleGetAiSummary}
                        disabled={aiLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition"
                    >
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        {aiLoading ? 'Generating...' : 'AI Weekly Summary'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-8 text-sm">
                    {error}
                </div>
            )}

            {/* AI Summary Panel */}
            {aiSummary && (
                <div className="glass-panel rounded-xl p-6 mb-8 border-l-4 border-indigo-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                        AI Executive Weekly Digest
                    </h3>
                    <div className="prose prose-invert max-w-none text-gray-300 text-sm whitespace-pre-line bg-dark-bg/40 p-4 rounded-lg border border-dark-border">
                        {aiSummary}
                    </div>
                </div>
            )}

            {/* Analytics Overview */}
            {analytics && (
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-400" />
                        Organization Analytics
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass-panel rounded-xl p-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Health Score</p>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-3xl font-bold ${analytics.organizationHealthScore >= 80 ? 'text-emerald-400' : analytics.organizationHealthScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {analytics.organizationHealthScore}
                                </span>
                                <span className="text-xs text-gray-500">/ 100</span>
                            </div>
                        </div>

                        <div className="glass-panel rounded-xl p-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Repos</p>
                            <span className="text-3xl font-bold text-white">{analytics.totalRepositories}</span>
                        </div>

                        <div className="glass-panel rounded-xl p-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Weekly Builds</p>
                            <span className="text-3xl font-bold text-white">{analytics.totalBuilds}</span>
                        </div>

                        <div className="glass-panel rounded-xl p-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Deployments</p>
                            <span className="text-3xl font-bold text-white">{analytics.totalDeployments}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {analytics.mostActiveRepository && (
                            <div className="glass-panel rounded-xl p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Most Active Repo</p>
                                    <h4 className="text-base font-bold text-white">{analytics.mostActiveRepository.name}</h4>
                                </div>
                                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2.5 py-1 rounded-full font-mono">
                                    {analytics.mostActiveRepository.activityVolume} events
                                </span>
                            </div>
                        )}

                        {analytics.mostActiveContributor && (
                            <div className="glass-panel rounded-xl p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Top Contributor</p>
                                    <h4 className="text-base font-bold text-white">@{analytics.mostActiveContributor.username}</h4>
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-mono">
                                    {analytics.mostActiveContributor.eventCount} actions
                                </span>
                            </div>
                        )}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Repositories and Link */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-indigo-400" />
                            Repositories
                        </h2>
                        
                        {repos.length === 0 ? (
                            <div className="glass-panel rounded-xl p-8 text-center text-gray-400">
                                <p className="font-semibold text-white mb-1">No repositories added yet</p>
                                <p className="text-sm">Add repositories to start linking GitHub activities.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {repos.map(repo => (
                                    <div key={repo.id} className="glass-panel rounded-xl p-5 flex flex-col justify-between border hover:border-indigo-500/30 transition">
                                        <div>
                                            <h4 className="text-base font-bold text-white mb-1">{repo.name}</h4>
                                            {repo.githubRepoName ? (
                                                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-4">
                                                    <Github className="h-3.5 w-3.5" />
                                                    {repo.githubRepoName}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-yellow-500 font-medium mb-4 flex items-center gap-1">
                                                    ⚠️ Unlinked
                                                </div>
                                            )}
                                        </div>
                                        <Link 
                                            to={`/repos/${repo.id}`}
                                            className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 transition rounded-lg py-2 text-center text-xs font-semibold flex items-center justify-center gap-1.5"
                                        >
                                            Dashboard
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Link GitHub Repository Dropdown if connected */}
                    {githubUser && repos.some(r => !r.githubRepoId) && (
                        <div className="glass-panel rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Github className="h-5 w-5 text-indigo-400" />
                                Link GitHub Repository
                            </h3>
                            <form onSubmit={handleLinkRepo} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Target App Repo</label>
                                    <select 
                                        value={linkTargetRepo} 
                                        onChange={(e) => setLinkTargetRepo(e.target.value)}
                                        className="w-full bg-dark-bg/60 border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                                        required
                                    >
                                        <option value="">Select App Repo</option>
                                        {repos.filter(r => !r.githubRepoId).map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">GitHub Repository</label>
                                    <select 
                                        value={linkTargetGithubId} 
                                        onChange={(e) => setLinkTargetGithubId(e.target.value)}
                                        className="w-full bg-dark-bg/60 border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                                        required
                                    >
                                        <option value="">Select GitHub Repo</option>
                                        {githubRepos.map(r => (
                                            <option key={r.id} value={r.id}>{r.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-semibold transition"
                                    >
                                        Link Repositories
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Add Repository */}
                    <div className="glass-panel rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-indigo-400" />
                            Add Repository
                        </h3>
                        <form onSubmit={handleCreateRepo} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Repository Name</label>
                                <input 
                                    type="text"
                                    value={newRepoName}
                                    onChange={(e) => setNewRepoName(e.target.value)}
                                    placeholder="e.g. core-api"
                                    className="w-full bg-dark-bg/60 border border-dark-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={createRepoLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-semibold transition flex justify-center items-center gap-1.5"
                            >
                                {createRepoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Add Repository
                            </button>
                        </form>
                    </div>

                    {/* Members List */}
                    <div className="glass-panel rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-400" />
                            Team Members ({members.length})
                        </h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center gap-3 p-2 bg-dark-bg/30 border border-dark-border/40 rounded-lg">
                                    <div className="bg-indigo-500/10 text-indigo-400 rounded-full h-8 w-8 flex items-center justify-center font-bold text-xs uppercase">
                                        {member.email.charAt(0)}
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-semibold text-white truncate">{member.email}</p>
                                        <p className="text-[10px] text-gray-500">Joined {new Date(member.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationDetails;
