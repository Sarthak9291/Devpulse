import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { GitCompare, Heart, Rocket, Cpu, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const RepositoryCompare = () => {
    const [allRepos, setAllRepos] = useState([]);
    const [repoAId, setRepoAId] = useState('');
    const [repoBId, setRepoBId] = useState('');
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reposLoading, setReposLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrgsAndRepos = async () => {
            setReposLoading(true);
            try {
                // Fetch user's organizations first
                const orgsRes = await apiCall('/orgs/getorganizations');
                const orgs = orgsRes.data || [];

                // Gather all repositories across all organizations
                const allFetchedRepos = [];
                for (const org of orgs) {
                    const reposRes = await apiCall(`/repos/organizations/${org.id}/repositories`);
                    const repos = reposRes.data || [];
                    repos.forEach(r => {
                        allFetchedRepos.push({
                            ...r,
                            orgName: org.name
                        });
                    });
                }
                setAllRepos(allFetchedRepos);
            } catch (err) {
                setError('Failed to fetch repositories list for comparison.');
                console.error(err);
            } finally {
                setReposLoading(false);
            }
        };

        fetchOrgsAndRepos();
    }, []);

    const handleCompare = async (e) => {
        e.preventDefault();
        if (!repoAId || !repoBId) return;
        if (repoAId === repoBId) {
            setError('Please select two different repositories to compare.');
            return;
        }

        setLoading(true);
        setError('');
        setComparison(null);

        try {
            const res = await apiCall(`/repos/compare?repoA=${repoAId}&repoB=${repoBId}`);
            setComparison(res.data);
        } catch (err) {
            setError(err.message || 'Failed to compare repositories.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
                    <GitCompare className="h-8 w-8 text-indigo-400" />
                    Repository Side-by-Side Comparison
                </h1>
                <p className="text-gray-400 mt-2">Compare repository health, DORA metrics, velocity, and resolution rates</p>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-8 text-sm max-w-xl mx-auto text-center">
                    {error}
                </div>
            )}

            {/* Selection Form */}
            <div className="glass-panel rounded-xl p-6 max-w-3xl mx-auto mb-10">
                {reposLoading ? (
                    <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleCompare} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Repository A</label>
                            <select 
                                value={repoAId} 
                                onChange={(e) => setRepoAId(e.target.value)}
                                className="w-full bg-dark-bg/60 border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                                required
                            >
                                <option value="">Select Repository A</option>
                                {allRepos.map(r => (
                                    <option key={r.id} value={r.id}>[{r.orgName}] {r.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Repository B</label>
                            <select 
                                value={repoBId} 
                                onChange={(e) => setRepoBId(e.target.value)}
                                className="w-full bg-dark-bg/60 border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                                required
                            >
                                <option value="">Select Repository B</option>
                                {allRepos.map(r => (
                                    <option key={r.id} value={r.id}>[{r.orgName}] {r.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-semibold transition flex justify-center items-center gap-1.5"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
                                Run Comparison
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Comparison Results */}
            {comparison && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Repository A Details */}
                    <div className="glass-panel rounded-xl p-6 border hover:border-indigo-500/20 transition">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-dark-border pb-3 text-center text-indigo-400">
                            {comparison.repoA.name}
                        </h2>
                        
                        <div className="space-y-6">
                            {/* Health */}
                            <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg">
                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <Heart className="h-4 w-4 text-rose-500" />
                                    Health Score
                                </span>
                                <span className="text-2xl font-bold text-white">{comparison.repoA.healthScore} / 100</span>
                            </div>

                            {/* Deploy Frequency */}
                            <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg">
                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <Rocket className="h-4 w-4 text-indigo-400" />
                                    Deploys (30d)
                                </span>
                                <span className="text-2xl font-bold text-white">{comparison.repoA.deploymentFrequency}</span>
                            </div>

                            {/* Build Success Rate */}
                            <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg">
                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <Cpu className="h-4 w-4 text-emerald-400" />
                                    Build Success
                                </span>
                                <span className="text-2xl font-bold text-white">{comparison.repoA.buildSuccessRate}%</span>
                            </div>

                            {/* PR Velocity */}
                            <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg">
                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <Clock className="h-4 w-4 text-indigo-400" />
                                    PR Velocity
                                </span>
                                <span className="text-2xl font-bold text-white">{comparison.repoA.prVelocity}h</span>
                            </div>

                            {/* Issue Resolution */}
                            <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg">
                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Issue Resolution
                                </span>
                                <span className="text-2xl font-bold text-white">{comparison.repoA.issueResolutionRate}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Repository B Details */}
                    <div className="glass-panel rounded-xl p-6 border hover:border-emerald-500/20 transition">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-dark-border pb-3 text-center text-emerald-400">
                            {comparison.repoB.name}
                        </h2>
                        
                        <div className="space-y-6">
                            {/* Health */}
                            <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg">
                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <Heart className="h-4 w-4 text-rose-500" />
                                    Health Score
                                </span>
                                <span className="text-2xl font-bold text-white">{comparison.repoB.healthScore} / 100</span>
                            </div>

                            {/* Deploy Frequency */}
                            <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg">
                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <Rocket className="h-4 w-4 text-indigo-400" />
                                    Deploys (30d)
                                </span>
                                <span className="text-2xl font-bold text-white">{comparison.repoB.deploymentFrequency}</span>
                            </div>

                            {/* Build Success Rate */}
                            <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg">
                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <Cpu className="h-4 w-4 text-emerald-400" />
                                    Build Success
                                </span>
                                <span className="text-2xl font-bold text-white">{comparison.repoB.buildSuccessRate}%</span>
                            </div>

                            {/* PR Velocity */}
                            <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg">
                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <Clock className="h-4 w-4 text-indigo-400" />
                                    PR Velocity
                                </span>
                                <span className="text-2xl font-bold text-white">{comparison.repoB.prVelocity}h</span>
                            </div>

                            {/* Issue Resolution */}
                            <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg">
                                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Issue Resolution
                                </span>
                                <span className="text-2xl font-bold text-white">{comparison.repoB.issueResolutionRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepositoryCompare;
