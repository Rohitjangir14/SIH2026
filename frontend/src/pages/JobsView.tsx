import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  FileCode,
  X,
  Layers,
} from 'lucide-react';
import { fetchJobs, fetchJobDetail } from '../services/api';
import { ProcessingJob } from '../types';

export const JobsView: React.FC = () => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetail, setJobDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await fetchJobs();
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleSelectJob = async (id: string) => {
    setSelectedJobId(id);
    try {
      setDetailLoading(true);
      const data = await fetchJobDetail(id);
      setJobDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="h-6 w-6 text-cyan-400" />
            Processing Jobs Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor batch throughput, parser telemetry, and inspection audits
          </p>
        </div>

        <button
          onClick={loadJobs}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-surface-100 hover:bg-surface-200 text-xs font-semibold text-slate-200 transition active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Jobs
        </button>
      </div>

      {/* Jobs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#0b101c]/80 text-slate-400 font-semibold">
                <th className="py-3.5 px-4">Job ID</th>
                <th className="py-3.5 px-4">Source System</th>
                <th className="py-3.5 px-4">Detected Format</th>
                <th className="py-3.5 px-4">Parser Assigned</th>
                <th className="py-3.5 px-4">Records (Total / Ok / Failed)</th>
                <th className="py-3.5 px-4">Success Rate</th>
                <th className="py-3.5 px-4">Execution Latency</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading jobs...
                  </td>
                </tr>
              ) : jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => handleSelectJob(job.id)}
                    className="hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold">
                      {job.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      <div>{job.source}</div>
                      <div className="text-[10px] text-slate-400">{job.file_name || 'raw_input'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {job.detected_format || 'auto'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {job.parser_used || 'Generic Regex'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {job.total_records} / <span className="text-emerald-400">{job.processed_records}</span> /{' '}
                      <span className={job.failed_records > 0 ? 'text-rose-400' : 'text-slate-500'}>
                        {job.failed_records}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {job.success_rate}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {job.duration_ms} ms
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : job.status === 'PARTIAL'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                        Audit &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No processing jobs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Detail Audit Drawer / Modal */}
      {selectedJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col max-h-[85vh] bg-[#0c121e]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-cyan-400" />
                  Job Execution Audit: {selectedJobId.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Telemetric breakdown and validation error logs
                </p>
              </div>
              <button
                onClick={() => setSelectedJobId(null)}
                className="p-2 rounded-xl bg-surface-200 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading || !jobDetail ? (
              <div className="py-12 text-center text-slate-400">Loading audit details...</div>
            ) : (
              <div className="py-4 space-y-4 overflow-y-auto flex-1">
                {/* Job Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-surface-100 border border-white/5">
                    <div className="text-xs text-slate-400">Total Input</div>
                    <div className="text-lg font-bold text-white mt-1">{jobDetail.job.total_records}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-100 border border-white/5">
                    <div className="text-xs text-slate-400">Processed</div>
                    <div className="text-lg font-bold text-emerald-400 mt-1">
                      {jobDetail.job.processed_records}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-100 border border-white/5">
                    <div className="text-xs text-slate-400">Failed</div>
                    <div className="text-lg font-bold text-rose-400 mt-1">
                      {jobDetail.job.failed_records}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-100 border border-white/5">
                    <div className="text-xs text-slate-400">Latency</div>
                    <div className="text-lg font-bold text-cyan-400 mt-1">
                      {jobDetail.job.duration_ms} ms
                    </div>
                  </div>
                </div>

                {/* Validation Errors Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Validation / Parse Errors ({jobDetail.validation_errors.length})
                    </span>
                    <span className="text-[11px] text-slate-500">Separated for reprocessing</span>
                  </div>

                  {jobDetail.validation_errors.length > 0 ? (
                    <div className="space-y-2">
                      {jobDetail.validation_errors.map((err: any) => (
                        <div
                          key={err.id}
                          className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs font-mono space-y-1"
                        >
                          <div className="text-rose-400 font-bold">{err.error_type}</div>
                          <div className="text-slate-300 bg-black/30 p-2 rounded truncate">
                            {err.raw_content}
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            {JSON.stringify(err.error_details)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Zero validation errors. All records parsed and conformed to Universal Schema!
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedJobId(null)}
                className="px-4 py-2 rounded-xl bg-surface-200 hover:bg-surface-300 text-slate-200 text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
