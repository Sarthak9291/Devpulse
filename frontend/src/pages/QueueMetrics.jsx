import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { ShieldAlert, AlertTriangle, CheckCircle, RefreshCw, Clock, Loader2 } from 'lucide-react';

const QueueMetrics = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchQueueMetrics = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);
        setError('');

        try {
            const res = await apiCall('/queues/metrics');
            setMetrics(res.data);
        } catch (err) {
            setError(err.message || 'Failed to fetch queue metrics.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchQueueMetrics();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
                        <ShieldAlert className="h-8 w-8 text-indigo-400" />
                        Queue Observability Dashboard
                    </h1>
                    <p className="text-gray-400 mt-1">Monitor BullMQ job state counts, retry metrics, and dead letter queue logs</p>
                </div>
                
                <button 
                    onClick={() => fetchQueueMetrics(true)}
                    disabled={refreshing}
                    className="bg-dark-card hover:bg-dark-hover border border-dark-border rounded-lg p-2.5 text-gray-400 hover:text-white transition flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-8 text-sm max-w-xl mx-auto text-center">
                    {error}
                </div>
            )}

            {metrics && (
                <div className="space-y-8">
                    {/* Job Counts Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="glass-panel rounded-xl p-5 border-t-2 border-indigo-500">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active</p>
                            <span className="text-3xl font-black text-white">{metrics.counts.active}</span>
                        </div>
                        <div className="glass-panel rounded-xl p-5 border-t-2 border-emerald-500">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Completed</p>
                            <span className="text-3xl font-black text-white">{metrics.counts.completed}</span>
                        </div>
                        <div className="glass-panel rounded-xl p-5 border-t-2 border-red-500">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Failed (DLQ)</p>
                            <span className="text-3xl font-black text-white">{metrics.counts.failed}</span>
                        </div>
                        <div className="glass-panel rounded-xl p-5 border-t-2 border-yellow-500">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Delayed</p>
                            <span className="text-3xl font-black text-white">{metrics.counts.delayed}</span>
                        </div>
                        <div className="glass-panel rounded-xl p-5 border-t-2 border-blue-500">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Waiting</p>
                            <span className="text-3xl font-black text-white">{metrics.counts.waiting}</span>
                        </div>
                    </div>

                    {/* Reliability Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-panel rounded-xl p-6 flex items-center gap-4">
                            <div className="bg-indigo-500/10 p-3 rounded-lg text-indigo-400">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Average Queue Lag</p>
                                <span className="text-2xl font-black text-white">{metrics.averageQueueLagMs} ms</span>
                                <p className="text-[10px] text-gray-500 mt-1">Average time spent in queue before job processing begins</p>
                            </div>
                        </div>

                        <div className="glass-panel rounded-xl p-6 flex items-center gap-4">
                            <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Retry Indicator</p>
                                <span className="text-2xl font-black text-white">{metrics.retryMetrics.retriedJobsCount} / {metrics.retryMetrics.totalChecked} jobs</span>
                                <p className="text-[10px] text-gray-500 mt-1">Count of processed jobs that required retry attempts to complete</p>
                            </div>
                        </div>
                    </div>

                    {/* Dead Letter Queue (Failed Jobs List) */}
                    <div className="glass-panel rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-dark-border pb-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                            Dead Letter Queue (Failed Job Audits)
                        </h3>

                        {metrics.deadLetterQueue.length === 0 ? (
                            <p className="text-sm text-gray-500 py-6 text-center">No failed jobs in the dead letter queue. Excellent reliability!</p>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {metrics.deadLetterQueue.map(job => (
                                    <div key={job.id} className="p-4 bg-dark-bg/30 border border-dark-border/40 hover:border-red-500/20 rounded-lg transition text-xs">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                                            <div>
                                                <h4 className="font-bold text-white">Job ID: {job.id} - {job.name}</h4>
                                                <p className="text-gray-400 mt-0.5">Repo ID: {job.data.repositoryId} | Event: {job.data.eventType} {job.data.action ? `(${job.data.action})` : ''}</p>
                                            </div>
                                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded font-mono text-[10px]">
                                                Attempts: {job.attemptsMade}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-red-950/20 border border-red-900/30 rounded text-red-300 font-mono text-[11px] break-words">
                                            <strong>Failed Reason:</strong> {job.failedReason}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueueMetrics;
