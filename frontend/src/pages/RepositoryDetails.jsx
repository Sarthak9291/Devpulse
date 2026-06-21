import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiCall, getBaseUrl } from '../api';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { 
    Activity as ActivityIcon, 
    ArrowLeft, 
    Sparkles, 
    Shield, 
    Cpu, 
    Rocket, 
    Clock, 
    GitPullRequest, 
    AlertCircle, 
    Heart, 
    CheckCircle2, 
    XCircle,
    Loader2
} from 'lucide-react';

const RepositoryDetails = () => {
    const { repoId } = useParams();
    const [dashboard, setDashboard] = useState(null);
    const [dora, setDora] = useState(null);
    const [bottlenecks, setBottlenecks] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activities, setActivities] = useState([]);

    // AI summary
    const [aiSummary, setAiSummary] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // Socket connection
    const socketRef = useRef(null);

    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            // Parallel fetch of dashboard details, DORA metrics, and PR bottlenecks
            const [dashboardRes, doraRes, bottlenecksRes] = await Promise.all([
                apiCall(`/dashboard/repository/${repoId}`),
                apiCall(`/dora/${repoId}`),
                apiCall(`/pr/${repoId}/bottlenecks`)
            ]);

            setDashboard(dashboardRes.data);
            setActivities(dashboardRes.data.recentActivities || []);
            setDora(doraRes.data);
            setBottlenecks(bottlenecksRes.data);
        } catch (err) {
            setError(err.message || 'Failed to fetch repository analytics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();

        // Socket.io integration for real-time updates
        const socketUrl = getBaseUrl();
        const socket = io(socketUrl, {
            transports: ['websocket'],
            upgrade: false
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to real-time updates socket');
        });

        socket.on('activity-created', (newActivity) => {
            if (Number(newActivity.repositoryId) === Number(repoId)) {
                setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
            }
        });

        socket.on('metrics-updated', ({ repositoryId: updatedRepoId, metrics }) => {
            if (Number(updatedRepoId) === Number(repoId)) {
                setDashboard(prev => prev ? {
                    ...prev,
                    metrics
                } : null);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [repoId]);

    const handleGetAiSummary = async () => {
        setAiLoading(true);
        setAiSummary('');
        try {
            const res = await apiCall(`/ai/repository/${repoId}`);
            setAiSummary(res.data.summary);
        } catch (err) {
            setError(err.message || 'Failed to generate AI summary.');
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

    if (error || !dashboard) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-400">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white">Error Loading Repository</h2>
                <p className="text-sm mt-1">{error || 'Could not fetch repository analytics.'}</p>
                <Link to="/" className="text-indigo-400 hover:underline mt-4 inline-block">Go back home</Link>
            </div>
        );
    }

    const { repository, metrics, health } = dashboard;

    // Compile chart data from metrics
    const buildChartData = [
        { name: 'Successful', value: metrics.successfulBuilds, fill: '#10B981' },
        { name: 'Failed', value: metrics.failedBuilds, fill: '#EF4444' }
    ];

    const deployChartData = [
        { name: 'Successful', value: metrics.successfulDeployments, fill: '#10B981' },
        { name: 'Failed', value: metrics.failedDeployments, fill: '#EF4444' }
    ];

    // Compile trend charts data from activities list
    const getTrendData = () => {
        const trendMap = {};
        // Fill last 7 days with zero
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            trendMap[dateStr] = { date: dateStr, activities: 0, builds: 0, deploys: 0 };
        }

        activities.forEach(activity => {
            const dateStr = new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            if (trendMap[dateStr]) {
                trendMap[dateStr].activities += 1;
                if (activity.eventType === 'workflow_run') {
                    trendMap[dateStr].builds += 1;
                } else if (activity.eventType === 'deployment' || activity.eventType === 'deployment_status') {
                    trendMap[dateStr].deploys += 1;
                }
            }
        });

        return Object.values(trendMap);
    };

    const trendData = getTrendData();

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-dark-border gap-4">
                <div className="flex items-center gap-4">
                    <Link to={`/orgs/${repository.organizationId}`} className="p-2 bg-dark-card hover:bg-dark-hover border border-dark-border rounded-lg text-gray-400 hover:text-white transition">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            {repository.name}
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">Linked: {repository.githubRepoName || 'Unlinked'}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleGetAiSummary}
                        disabled={aiLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition"
                    >
                        <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                        {aiLoading ? 'Analyzing...' : 'Get AI Digest'}
                    </button>
                </div>
            </div>

            {/* AI Summary View */}
            {aiSummary && (
                <div className="glass-panel rounded-xl p-6 mb-8 border-l-4 border-indigo-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                        AI Weekly Summary & Insights
                    </h3>
                    <div className="prose prose-invert max-w-none text-gray-300 text-sm whitespace-pre-line bg-dark-bg/40 p-4 rounded-lg border border-dark-border font-mono">
                        {aiSummary}
                    </div>
                </div>
            )}

            {/* Grid 1: Health, DORA, and PR Bottlenecks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Health Section */}
                <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Heart className={`h-5 w-5 ${health.status === 'Healthy' ? 'text-emerald-400' : health.status === 'Warning' ? 'text-yellow-400' : 'text-red-400'}`} />
                            Repository Health
                        </h3>
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-5xl font-black text-white">{health.score}</span>
                            <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    health.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                    health.status === 'Warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                                    'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                    {health.status}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Score calculated from builds, deploys, and commit counts</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2 border-t border-dark-border/40 pt-4">
                        <div className="flex justify-between text-xs font-medium text-gray-400">
                            <span>Build Health</span>
                            <span className="text-white">{health.buildScore}%</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-gray-400">
                            <span>Deployment Health</span>
                            <span className="text-white">{health.deploymentScore}%</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-gray-400">
                            <span>Activity Score</span>
                            <span className="text-white">{health.activityScore}%</span>
                        </div>
                        {health.reasons && health.reasons.length > 0 && (
                            <div className="mt-4 border-t border-dark-border/40 pt-3">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Health Factors</h4>
                                <ul className="space-y-1.5">
                                    {health.reasons.map((reason, idx) => (
                                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-1.5">
                                            <span className="text-indigo-400 mt-0.5">•</span>
                                            <span>{reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* DORA Metrics */}
                {dora && (
                    <div className="glass-panel rounded-xl p-6 lg:col-span-2">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-indigo-400" />
                            DORA Metrics (Executive View)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-dark-bg/40 border border-dark-border/50 rounded-xl p-4 flex flex-col justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Deploys (30d)</p>
                                    <span className="text-2xl font-extrabold text-white">{dora.deploymentFrequency}</span>
                                </div>
                                <span className="text-[10px] text-indigo-400 font-semibold mt-2">Rating: {dora.deploymentFrequencyRating}</span>
                            </div>

                            <div className="bg-dark-bg/40 border border-dark-border/50 rounded-xl p-4 flex flex-col justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Change Failure</p>
                                    <span className="text-2xl font-extrabold text-white">{dora.changeFailureRate}%</span>
                                </div>
                                <span className="text-[10px] text-gray-500 mt-2">Target: &lt; 15%</span>
                            </div>

                            <div className="bg-dark-bg/40 border border-dark-border/50 rounded-xl p-4 flex flex-col justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lead Time</p>
                                    <span className="text-2xl font-extrabold text-white">{dora.leadTime}h</span>
                                </div>
                                <span className="text-[10px] text-gray-500 mt-2">PR merge to deploy</span>
                            </div>

                            <div className="bg-dark-bg/40 border border-dark-border/50 rounded-xl p-4 flex flex-col justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">MTTR</p>
                                    <span className="text-2xl font-extrabold text-white">{dora.mttr}h</span>
                                </div>
                                <span className="text-[10px] text-gray-500 mt-2">Time to recover</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Grid 2: Metrics Counters & PR Bottlenecks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* PR Bottlenecks panel */}
                {bottlenecks && (
                    <div className="glass-panel rounded-xl p-6 lg:col-span-2">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-400" />
                            PR Bottleneck Ingestion
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="flex items-center gap-4 bg-dark-bg/30 border border-dark-border/50 rounded-xl p-4">
                                <div className="bg-indigo-500/10 p-3 rounded-lg text-indigo-400">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Avg. Merge Time</p>
                                    <span className="text-2xl font-black text-white">{bottlenecks.averageMergeTime} hours</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-dark-bg/30 border border-dark-border/50 rounded-xl p-4">
                                <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400">
                                    <GitPullRequest className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Avg. Review Time</p>
                                    <span className="text-2xl font-black text-white">{bottlenecks.averageReviewTime} hours</span>
                                </div>
                            </div>
                        </div>

                        {/* Stale and Longest open PRs lists */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    Stale PRs ({bottlenecks.stalePRCount})
                                </h4>
                                {bottlenecks.stalePRs.length === 0 ? (
                                    <p className="text-xs text-gray-500 p-3 bg-dark-bg/20 rounded border border-dark-border/30">No stale PRs found.</p>
                                ) : (
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                        {bottlenecks.stalePRs.map(pr => (
                                            <div key={pr.id} className="text-xs p-2.5 bg-dark-bg/40 border border-dark-border/50 rounded flex justify-between">
                                                <span className="font-semibold text-gray-300">PR #{pr.githubPrId.slice(-4)}</span>
                                                <span className="text-yellow-500 font-semibold">{pr.daysOpen} days open</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-indigo-400" />
                                    Longest Open PRs
                                </h4>
                                {bottlenecks.longestOpenPRs.length === 0 ? (
                                    <p className="text-xs text-gray-500 p-3 bg-dark-bg/20 rounded border border-dark-border/30">No open PRs.</p>
                                ) : (
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                        {bottlenecks.longestOpenPRs.map(pr => (
                                            <div key={pr.id} className="text-xs p-2.5 bg-dark-bg/40 border border-dark-border/50 rounded flex justify-between">
                                                <span className="font-semibold text-gray-300">PR #{pr.githubPrId.slice(-4)}</span>
                                                <span className="text-indigo-400 font-semibold">{pr.daysOpen} days open</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Metrics counts panel */}
                <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Webhook Aggregates</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-dark-bg/40 border border-dark-border/40 rounded-lg">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pushes</p>
                                <span className="text-xl font-bold text-white">{metrics.pushCount}</span>
                            </div>
                            <div className="p-3 bg-dark-bg/40 border border-dark-border/40 rounded-lg">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">PRs Merged</p>
                                <span className="text-xl font-bold text-white">{metrics.prMergedCount}</span>
                            </div>
                            <div className="p-3 bg-dark-bg/40 border border-dark-border/40 rounded-lg">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Issues Opened</p>
                                <span className="text-xl font-bold text-white">{metrics.issueOpenedCount}</span>
                            </div>
                            <div className="p-3 bg-dark-bg/40 border border-dark-border/40 rounded-lg">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Issues Closed</p>
                                <span className="text-xl font-bold text-white">{metrics.issueClosedCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid 3: Trends & Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Build Trends */}
                <div className="glass-panel rounded-xl p-6">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-1.5">
                        <Cpu className="h-4 w-4 text-indigo-400" />
                        Build Success Trend ({dora?.buildSuccessRate}%)
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={buildChartData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F2E47" />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                                <YAxis stroke="#9CA3AF" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: '#161F30', borderColor: '#1F2E47' }} labelStyle={{ color: '#fff' }} />
                                <Bar dataKey="value" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Deployment Trends */}
                <div className="glass-panel rounded-xl p-6">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-1.5">
                        <Rocket className="h-4 w-4 text-indigo-400" />
                        Deploy Success Trend ({dora?.deploymentSuccessRate}%)
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deployChartData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F2E47" />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                                <YAxis stroke="#9CA3AF" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: '#161F30', borderColor: '#1F2E47' }} labelStyle={{ color: '#fff' }} />
                                <Bar dataKey="value" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Trend Line Chart */}
                <div className="glass-panel rounded-xl p-6">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-1.5">
                        <ActivityIcon className="h-4 w-4 text-indigo-400 animate-pulse" />
                        Activity Trend (Last 7 Days)
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F2E47" />
                                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
                                <YAxis stroke="#9CA3AF" fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: '#161F30', borderColor: '#1F2E47' }} labelStyle={{ color: '#fff' }} />
                                <Area type="monotone" dataKey="activities" stroke="#4F46E5" fillOpacity={1} fill="url(#colorAct)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Grid 4: Real-time activities feed */}
            <div className="glass-panel rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5 text-indigo-400 animate-pulse" />
                    Real-time Activity Feed (Live Stream)
                </h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                    {activities.length === 0 ? (
                        <p className="text-xs text-gray-500 py-6 text-center">No recent activity detected.</p>
                    ) : (
                        activities.map(act => (
                            <div key={act.id} className="p-3 bg-dark-bg/30 border border-dark-border/40 hover:border-dark-border rounded-lg transition flex items-start justify-between text-xs">
                                <div>
                                    <h4 className="font-bold text-white mb-0.5">{act.title}</h4>
                                    <p className="text-gray-400">{act.description}</p>
                                </div>
                                <span className="text-[10px] text-gray-500 font-semibold">{new Date(act.createdAt).toLocaleTimeString()}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default RepositoryDetails;
