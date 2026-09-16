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
  ArrowRight,
  Database,
  Terminal,
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
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="h-5 w-5 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Processing Jobs Engine
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Batch Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor batch throughput &bull; Parser assignments &bull; Error segregation audits
          </p>
        </div>

        <button
          onClick={loadJobs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 transition active:scale-[0.98] shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
          <span>Refresh Executions</span>
        </button>
      </div>

      {/* Jobs Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#090d15] text-slate-400 font-semibold">
                <th className="py-2.5 px-3.5">Job ID</th>
                <th className="py-2.5 px-3.5">Source System</th>
                <th className="py-2.5 px-3.5">Detected Format</th>
                <th className="py-2.5 px-3.5">Parser Assigned</th>
                <th className="py-2.5 px-3.5">Records (Total / Ok / Failed)</th>
                <th className="py-2.5 px-3.5">Success Rate</th>
                <th className="py-2.5 px-3.5">Duration</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                    Loading jobs telemetry...
                  </td>
                </tr>
              ) : jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => handleSelectJob(job.id)}
                    className="hover:bg-slate-800/30 cursor-pointer transition group"
                  >
                    <td className="py-2.5 px-3.5 text-blue-400 font-semibold">
                      {job.id.slice(0, 8)}
                    </td>
                    <td className="py-2.5 px-3.5 font-sans font-medium text-slate-200">
                      <div>{job.source}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{job.file_name || 'raw_stream'}</div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {job.detected_format || 'auto'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-sans text-slate-300 font-medium">
                      {job.parser_used || 'Generic Regex'}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {job.total_records} / <span className="text-emerald-400">{job.processed_records}</span> /{' '}
                      <span className={job.failed_records > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                        {job.failed_records}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-400">
                      {job.success_rate}%
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-400">
                      {job.duration_ms} ms
                    </td>
                    <td className="py-2.5 px-3.5 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                            : job.status === 'PARTIAL'
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-end font-sans">
                        <span>Audit</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-3xl rounded-xl p-5 border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] bg-[#0e131f]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-400" />
                  Job Execution Audit: {selectedJobId.slice(0, 8)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Telemetric breakdown and error segregation audits
                </p>
              </div>
              <button
                onClick={() => setSelectedJobId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading || !jobDetail ? (
              <div className="py-12 text-center text-slate-400">Loading audit details...</div>
            ) : (
              <div className="py-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
                {/* Job Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-lg bg-[#090d15] border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Input</div>
                    <div className="text-lg font-bold text-white mt-1 font-mono">{jobDetail.job.total_records}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090d15] border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Processed</div>
                    <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                      {jobDetail.job.processed_records}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090d15] border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Validation Errors</div>
                    <div className="text-lg font-bold text-rose-400 mt-1 font-mono">
                      {jobDetail.job.failed_records}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090d15] border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Execution Latency</div>
                    <div className="text-lg font-bold text-blue-400 mt-1 font-mono">
                      {jobDetail.job.duration_ms} ms
                    </div>
                  </div>
                </div>

                {/* Validation Errors Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Validation & Parse Errors ({jobDetail.validation_errors.length})
                    </span>
                    <span className="text-[10px] text-slate-500">Segregated for audit reprocessing</span>
                  </div>

                  {jobDetail.validation_errors.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {jobDetail.validation_errors.map((err: any) => (
                        <div
                          key={err.id}
                          className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/30 text-xs font-mono space-y-1"
                        >
                          <div className="text-rose-400 font-bold">{err.error_type}</div>
                          <div className="text-slate-300 bg-black/40 p-2 rounded truncate border border-slate-800">
                            {err.raw_content}
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            {JSON.stringify(err.error_details)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Zero validation errors. All records successfully normalized into Universal Schema!
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedJobId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                Close Audit Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
