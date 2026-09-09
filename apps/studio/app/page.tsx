'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Printer, 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  Truck, 
  AlertTriangle, 
  ExternalLink, 
  Search, 
  RefreshCw,
  Sparkles,
  Layers,
  Flame,
  FileText,
  X
} from 'lucide-react';
import type { PrintJob, PrintJobStatus } from '@dissafyt/database';
import { getActivePersona, StudioPersona } from '../lib/persona';

export default function FactoryQueuePage() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [persona, setPersona] = useState<StudioPersona | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Failed to fetch print jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    setPersona(getActivePersona());

    const handlePersonaChange = (e: any) => {
      if (e.detail) setPersona(e.detail);
    };
    window.addEventListener('studio_persona_changed', handlePersonaChange);
    return () => window.removeEventListener('studio_persona_changed', handlePersonaChange);
  }, []);

  const handleUpdateStatus = async (jobId: string, newStatus: PrintJobStatus) => {
    try {
      setUpdatingJobId(jobId);
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': 'operator@dissafyt.com',
          'x-admin-role': 'manager'
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
        if (selectedJob?.id === jobId) {
          setSelectedJob(updated);
        }
      }
    } catch (err) {
      console.error('Failed to update job status:', err);
    } finally {
      setUpdatingJobId(null);
    }
  };

  // Metrics
  const totalActive = jobs.filter((j) => j.status !== 'dispatched' && j.status !== 'cancelled').length;
  const inPress = jobs.filter((j) => j.status === 'printing').length;
  const qcReady = jobs.filter((j) => j.status === 'qc_passed').length;
  const readyToPack = jobs.filter((j) => j.status === 'ready_to_pack').length;
  const dispatched = jobs.filter((j) => j.status === 'dispatched').length;

  const filteredJobs = jobs.filter((job) => {
    if (filterStatus !== 'all' && job.status !== filterStatus) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTicket = job.ticket_number?.toLowerCase().includes(q);
      const matchOrder = job.order_id?.toLowerCase().includes(q);
      const matchProduct = job.product_name?.toLowerCase().includes(q);
      const matchBrand = job.brand_name?.toLowerCase().includes(q);
      return matchTicket || matchOrder || matchProduct || matchBrand;
    }
    return true;
  });

  const getStatusBadge = (status: PrintJobStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" /> Awaiting Heat Press
          </span>
        );
      case 'printing':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 animate-pulse">
            <Flame className="w-3 h-3 mr-1" /> DTF Pressing (160°C)
          </span>
        );
      case 'qc_passed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> QC Approved
          </span>
        );
      case 'ready_to_pack':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <PackageCheck className="w-3 h-3 mr-1" /> Folded & Tagged
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Truck className="w-3 h-3 mr-1" /> Dispatched (Courier Guy)
          </span>
        );
      case 'failed_qc':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" /> QC Defect / Reprint
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Studio Introduction */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-mono uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dissafyt Micro-Factory OS • Production Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Factory Print Queue & Heat Press Terminal
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Real-time shopfloor console. Incoming customer orders mirrored instantly from the storefront.
            Monitor direct-to-film (DTF) pressing, quality control, and garment finishing.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
          {persona?.role !== 'staff' && (
            <Link
              href="/creator"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Creator Studio</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4">
          <div className="text-zinc-500 text-xs font-mono uppercase">In Queue</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{totalActive}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Awaiting fulfillment</div>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4">
          <div className="text-zinc-500 text-xs font-mono uppercase">Heat Press Active</div>
          <div className="text-2xl font-black text-orange-400 mt-1">{inPress}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">160°C DTF transfer</div>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4">
          <div className="text-zinc-500 text-xs font-mono uppercase">QC Approved</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{qcReady}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Inspection passed</div>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4">
          <div className="text-zinc-500 text-xs font-mono uppercase">Packed & Tagged</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">{readyToPack}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Ready for dispatch</div>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="text-zinc-500 text-xs font-mono uppercase">Dispatched</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">{dispatched}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Courier Guy / Pickup</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Jobs' },
            { id: 'pending', label: 'Pending' },
            { id: 'printing', label: 'Heat Press' },
            { id: 'qc_passed', label: 'QC Passed' },
            { id: 'ready_to_pack', label: 'Ready to Pack' },
            { id: 'dispatched', label: 'Dispatched' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                filterStatus === tab.id
                  ? 'bg-zinc-200 text-black font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search ticket, order, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Job Cards Grid */}
      {loading ? (
        <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Syncing with factory queue...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
          <Printer className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No print jobs found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? 'No jobs match your current search query or status filter.'
              : 'New streetwear orders placed in the customer shop will automatically appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const isUpdating = updatingJobId === job.id;
            return (
              <div
                key={job.id}
                className="bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between transition group shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Top Bar: Ticket & Deal Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="font-mono text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                        <Printer className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{job.ticket_number}</span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        Order #{job.order_id?.slice(0, 8)}...
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>

                  {/* Brand & Product Details */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {job.brand_name || 'Kasi Kollekt'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                        {job.deal_type === 'stacked_returns' ? 'Stacked Returns' : 'Drip Income'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                      {job.product_name}
                    </h3>
                  </div>

                  {/* Garment Specifications Card */}
                  <div className="mt-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-zinc-400">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase">Garment / Size</span>
                        <span className="font-semibold text-zinc-200">
                          {job.garment_color} • <strong className="text-white">{job.garment_size}</strong>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase">Quantity</span>
                        <span className="font-semibold text-zinc-200">{job.quantity} unit(s)</span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800/60 pt-2 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Print Placement</span>
                      <span className="font-semibold text-amber-400 uppercase text-[11px]">
                        {(job.print_placement || 'front_chest').replace('_', ' ')}
                      </span>
                    </div>

                    {job.design_file_url && (
                      <div className="border-t border-zinc-800/60 pt-2 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Vector Artwork</span>
                        <a
                          href={job.design_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 text-[11px] font-medium"
                        >
                          <span>Inspect File</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center space-x-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Ticket</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {job.status === 'pending' && (
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(job.id, 'printing')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Start Press</span>
                      </button>
                    )}

                    {job.status === 'printing' && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(job.id, 'qc_passed')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pass QC</span>
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(job.id, 'failed_qc')}
                          className="px-2 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition"
                          title="Flag defect"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {job.status === 'qc_passed' && (
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(job.id, 'ready_to_pack')}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition flex items-center space-x-1"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Pack & Tag</span>
                      </button>
                    )}

                    {job.status === 'ready_to_pack' && (
                      <Link
                        href="/dispatch"
                        className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch Hub</span>
                      </Link>
                    )}

                    {job.status === 'dispatched' && (
                      <span className="text-[11px] font-mono text-zinc-500">
                        {job.courier_tracking_number || 'Dispatched'}
                      </span>
                    )}

                    {job.status === 'failed_qc' && (
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(job.id, 'pending')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition"
                      >
                        Reprint Job
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Print Ticket Modal Inspector */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Factory Job Ticket</h3>
                <p className="text-xs font-mono text-amber-400">{selectedJob.ticket_number}</p>
              </div>
            </div>

            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/80 space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Order Reference</span>
                <span className="font-mono text-zinc-200 font-bold">{selectedJob.order_id}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Brand Drop</span>
                <span className="text-zinc-200 font-semibold">{selectedJob.brand_name || 'Kasi Kollekt'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Deal Structure</span>
                <span className="text-amber-400 font-mono uppercase">
                  {selectedJob.deal_type === 'stacked_returns' ? 'Option A: Stacked Returns' : 'Option B: Drip Income'}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Garment Specification</span>
                <span className="text-zinc-200 font-semibold">
                  {selectedJob.garment_color} • Size {selectedJob.garment_size} ({selectedJob.quantity} unit)
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Print Placement</span>
                <span className="text-zinc-200 font-semibold uppercase">{selectedJob.print_placement || 'front_chest'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Heat Press Recipe</span>
                <span className="text-orange-400 font-mono font-bold">160°C • 15 Seconds • Cold Peel</span>
              </div>
            </div>

            {selectedJob.artwork_notes && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
                <strong>Creator Notes:</strong> {selectedJob.artwork_notes}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
