'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  PackageCheck, 
  Barcode, 
  Printer, 
  Search, 
  CheckCircle2, 
  FileText, 
  RefreshCw,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import type { PrintJob } from '@dissafyt/database';

export default function DispatchDeskPage() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ready' | 'dispatched'>('ready');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data: PrintJob[] = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Failed to fetch jobs for dispatch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDispatch = async (jobId: string) => {
    try {
      setDispatchingId(jobId);
      const generatedTracking = trackingInputs[jobId] || `CG-DISS-${Date.now().toString().slice(-6)}`;
      
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': 'dispatch@dissafyt.com',
          'x-admin-role': 'manager'
        },
        body: JSON.stringify({
          status: 'dispatched',
          tracking_number: generatedTracking,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
        if (selectedJob?.id === jobId) {
          setSelectedJob(updated);
        }
      }
    } catch (err) {
      console.error('Failed to dispatch job:', err);
    } finally {
      setDispatchingId(null);
    }
  };

  const readyJobs = jobs.filter((j) => j.status === 'ready_to_pack' || j.status === 'qc_passed');
  const dispatchedJobs = jobs.filter((j) => j.status === 'dispatched');

  const displayedJobs = (activeFilter === 'ready' ? readyJobs : dispatchedJobs).filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.ticket_number?.toLowerCase().includes(q) ||
      j.order_id?.toLowerCase().includes(q) ||
      j.product_name?.toLowerCase().includes(q) ||
      j.brand_name?.toLowerCase().includes(q) ||
      j.courier_tracking_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Kasi Kollekt Fulfillment Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Order Packing & Courier Guy Dispatch
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Packaging station and courier hand-off terminal. Generate printable waybills, pack custom streetwear garments,
            and log Courier Guy tracking numbers for customer updates.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Factory Queue</span>
          </Link>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveFilter('ready')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeFilter === 'ready'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Ready for Packing ({readyJobs.length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('dispatched')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeFilter === 'dispatched'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Dispatched Parcels ({dispatchedJobs.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search parcel, tracking, order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Dispatch Cards Grid */}
      {loading ? (
        <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Loading dispatch queue...</p>
        </div>
      ) : displayedJobs.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
          <PackageCheck className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">
            {activeFilter === 'ready' ? 'No parcels awaiting packaging' : 'No dispatched orders recorded'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            {activeFilter === 'ready'
              ? 'Garments approved through Factory QC will appear here for courier bag labeling and dispatch.'
              : 'Past dispatched orders will be logged here with their Courier Guy tracking IDs.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedJobs.map((job) => {
            const isDispatching = dispatchingId === job.id;
            return (
              <div
                key={job.id}
                className="bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between transition group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {job.ticket_number}
                      </span>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        Order #{job.order_id?.slice(0, 10)}...
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        job.status === 'dispatched'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {job.status === 'dispatched' ? (
                        <>
                          <Truck className="w-3 h-3 mr-1" /> Dispatched
                        </>
                      ) : (
                        <>
                          <PackageCheck className="w-3 h-3 mr-1" /> Ready to Pack
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {job.brand_name || 'Kasi Kollekt'}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {job.product_name}
                    </h3>
                  </div>

                  <div className="mt-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 text-xs space-y-2">
                    <div className="flex justify-between text-zinc-400">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Garment / Size</span>
                      <span className="font-semibold text-zinc-200">
                        {job.garment_color} • <strong className="text-white">{job.garment_size}</strong>
                      </span>
                    </div>

                    <div className="flex justify-between text-zinc-400">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Hub Origin</span>
                      <span className="text-zinc-300">Dissafyt Central Hub (JHB)</span>
                    </div>

                    {job.courier_tracking_number && (
                      <div className="border-t border-zinc-800/60 pt-2 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Tracking #</span>
                        <span className="font-mono text-amber-400 font-bold">
                          {job.courier_tracking_number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dispatch Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center space-x-1"
                  >
                    <Barcode className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Packing Slip</span>
                  </button>

                  {job.status !== 'dispatched' ? (
                    <button
                      disabled={isDispatching}
                      onClick={() => handleDispatch(job.id)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition flex items-center space-x-1 shadow-md"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{isDispatching ? 'Dispatching...' : 'Dispatch Parcel'}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-zinc-500 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fulfilled</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Packaging Slip & Courier Waybill Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Slip Header */}
            <div className="flex items-center justify-between border-b pb-4 border-zinc-200">
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-zinc-900">
                  DISSAFYT STUDIO • KASI KOLLEKT
                </span>
                <h3 className="text-xl font-black text-black">PARCEL PACKING SLIP</h3>
                <p className="text-xs font-mono text-zinc-500">Ticket: {selectedJob.ticket_number}</p>
              </div>
              <div className="text-right">
                <Barcode className="w-14 h-8 text-black inline-block" />
                <div className="text-[9px] font-mono text-zinc-600">
                  {selectedJob.courier_tracking_number || `CG-DISS-${selectedJob.id.slice(0, 6)}`}
                </div>
              </div>
            </div>

            {/* Sender & Recipient addresses */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div>
                <span className="font-bold text-zinc-500 uppercase text-[10px] block mb-1">
                  FROM (ORIGIN HUB):
                </span>
                <p className="font-bold text-zinc-900">Dissafyt Micro-Factory Hub</p>
                <p className="text-zinc-600">Kasi Kollekt Fulfillment Desk</p>
                <p className="text-zinc-600">Johannesburg, Gauteng, 2000</p>
                <p className="text-zinc-600">South Africa</p>
              </div>
              <div>
                <span className="font-bold text-zinc-500 uppercase text-[10px] block mb-1">
                  SHIP TO (CUSTOMER):
                </span>
                <p className="font-bold text-zinc-900">Recipient (Order #{selectedJob.order_id.slice(0, 8)})</p>
                <p className="text-zinc-600">National Delivery via Courier Guy</p>
                <p className="text-zinc-600">South Africa</p>
              </div>
            </div>

            {/* Item Manifest */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-zinc-500 uppercase text-[10px] block">
                PARCEL CONTENTS:
              </span>
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-100 text-zinc-700 text-[11px]">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Size / Color</th>
                      <th className="p-2">Placement</th>
                      <th className="p-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-800">
                    <tr>
                      <td className="p-2 font-semibold">
                        {selectedJob.product_name}
                        <div className="text-[10px] text-zinc-500 font-normal">
                          Brand: {selectedJob.brand_name || 'Kasi Kollekt'}
                        </div>
                      </td>
                      <td className="p-2">{selectedJob.garment_size} / {selectedJob.garment_color}</td>
                      <td className="p-2 uppercase text-[10px]">{selectedJob.print_placement || 'front_chest'}</td>
                      <td className="p-2 text-right font-bold">{selectedJob.quantity}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Garment Handling Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
              <span className="font-bold uppercase text-[10px] block text-amber-800">
                Garment Care Notice:
              </span>
              <p>• Wash garment inside-out in cold water (max 30°C).</p>
              <p>• Do NOT iron directly onto the DTF print transfer.</p>
              <p>• Hang dry in the shade to preserve garment fibers and vibrant ink pigment.</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-semibold transition"
              >
                Close Slip
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Waybill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
