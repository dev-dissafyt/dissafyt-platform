'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Layers, 
  UploadCloud, 
  DollarSign, 
  Check, 
  ArrowRight, 
  Palette, 
  Eye, 
  Shirt, 
  TrendingUp, 
  ShieldCheck, 
  Info,
  ExternalLink,
  Store,
  Tag
} from 'lucide-react';
import type { Brand, DealType } from '@dissafyt/database';

const GARMENT_PRESETS = [
  { id: 'tee_boxy_240', name: '240gsm Heavyweight Boxy Tee', type: 'tee', baseCost: 180, defaultRetail: 450 },
  { id: 'tee_drop_200', name: '200gsm Streetwear Drop-Shoulder', type: 'tee', baseCost: 150, defaultRetail: 380 },
  { id: 'hoodie_fleece_380', name: '380gsm Heavyweight Fleece Hoodie', type: 'hoodie', baseCost: 360, defaultRetail: 750 },
];

const COLOR_OPTIONS = [
  { id: 'onyx', name: 'Onyx Black', hex: '#141416', contrast: 'white' },
  { id: 'bone', name: 'Bone / Off-White', hex: '#ece9df', contrast: 'black' },
  { id: 'olive', name: 'Washed Olive', hex: '#3b4334', contrast: 'white' },
  { id: 'charcoal', name: 'Vintage Charcoal', hex: '#26282b', contrast: 'white' },
];

const SAMPLE_PRINTS = [
  {
    name: 'Kasi Kollekt Typographic Stamp',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    description: 'Minimal typographic front chest print'
  },
  {
    name: 'Johannesburg Skyline Vector',
    url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=600&auto=format&fit=crop&q=80',
    description: 'High-contrast urban landscape for oversized back'
  },
  {
    name: 'Geometric Afro-Streetwear Shield',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    description: 'Bold center graphic for streetwear drops'
  }
];

export default function CreatorStudioPage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'mockup'>('mockup');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  // Brand Onboarding Form State
  const [brandName, setBrandName] = useState('');
  const [brandBio, setBrandBio] = useState('');
  const [dealType, setDealType] = useState<DealType>('drip_income');
  const [brandSuccess, setBrandSuccess] = useState(false);

  // Mockup & Product Publisher State
  const [selectedGarment, setSelectedGarment] = useState(GARMENT_PRESETS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [placement, setPlacement] = useState<'front' | 'back' | 'chest_pocket' | 'oversized_back'>('oversized_back');
  const [printUrl, setPrintUrl] = useState(SAMPLE_PRINTS[1].url);
  const [productTitle, setProductTitle] = useState('Skhanda Heavyweight Graphic Tee');
  const [productDesc, setProductDesc] = useState('Premium 240gsm South African combed cotton cut & sew silhouette. Hand-finished in the Dissafyt Micro-Factory.');
  const [retailPrice, setRetailPrice] = useState(450);
  const [publishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      if (res.ok) {
        const data = await res.json();
        setBrands(data);
        if (data.length > 0 && !selectedBrandId) {
          setSelectedBrandId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandName,
          bio: brandBio,
          deal_type: dealType,
          commission_rate: dealType === 'drip_income' ? 0.35 : 0.20,
        }),
      });

      if (res.ok) {
        const newBrand = await res.json();
        setBrands((prev) => [newBrand, ...prev]);
        setSelectedBrandId(newBrand.id);
        setBrandSuccess(true);
        setTimeout(() => {
          setBrandSuccess(false);
          setActiveTab('mockup');
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to create brand:', err);
    }
  };

  const handlePublishProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim() || !printUrl.trim()) return;

    try {
      setPublishing(true);
      const res = await fetch('/api/products/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productTitle,
          description: productDesc,
          price: retailPrice,
          brand_id: selectedBrandId || undefined,
          design_file_url: printUrl,
          mockup_url: printUrl,
          print_placement: placement,
          category: 'clothing',
          tags: ['streetwear', 'kasi_kollekt', selectedGarment.type, selectedColor.name.toLowerCase()],
        }),
      });

      if (res.ok) {
        const product = await res.json();
        setPublishedSlug(product.slug || product.id);
      }
    } catch (err) {
      console.error('Failed to publish custom drop:', err);
    } finally {
      setPublishing(false);
    }
  };

  // Financial simulation
  const platformCost = selectedGarment.baseCost;
  const creatorPayout = Math.max(0, retailPrice - platformCost);
  const profitMarginPercent = retailPrice > 0 ? Math.round((creatorPayout / retailPrice) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-mono uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kasi Kollekt Creator Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Design, Price & Launch Streetwear Drops
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Turn your artwork, township phrases, and brand concepts into live products. 
              The Dissafyt Micro-Factory handles on-demand DTF heat pressing, QC, and nationwide fulfillment.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-950/80 p-1.5 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('mockup')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'mockup'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Garment Lab & Mockup</span>
            </button>
            <button
              onClick={() => setActiveTab('brand')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'brand'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Brand & Deals</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: BRAND ONBOARDING & COMMERCIAL DEALS */}
      {activeTab === 'brand' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white tracking-tight mb-1">
                Register Your Creator Brand
              </h2>
              <p className="text-xs text-zinc-400 mb-6">
                Define your brand identity and select your commercial agreement with the Dissafyt Micro-Factory.
              </p>

              <form onSubmit={handleCreateBrand} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400">Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skhanda Original, Soweto Threads, Vibe Cult"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400">Brand Bio & Origin Story</label>
                  <textarea
                    rows={3}
                    placeholder="Tell buyers what inspired your aesthetic and township roots..."
                    value={brandBio}
                    onChange={(e) => setBrandBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Deal Structure Options */}
                <div className="space-y-3">
                  <label className="text-xs font-mono uppercase text-zinc-400 block">
                    Choose Your Commercial Model
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option A: Stacked Returns */}
                    <div
                      onClick={() => setDealType('stacked_returns')}
                      className={`cursor-pointer rounded-xl p-4 border transition ${
                        dealType === 'stacked_returns'
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold uppercase text-amber-400">
                          Option A
                        </span>
                        {dealType === 'stacked_returns' && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">Stacked Returns</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Invest stacks upfront to produce bulk batches. We print physical racks for the barbershop studio + online catalogue.
                      </p>
                      <div className="mt-3 text-[11px] font-mono text-zinc-300 bg-zinc-900/80 p-2 rounded-lg">
                        ⚡ Maximum unit margins & physical shop presence
                      </div>
                    </div>

                    {/* Option B: Drip Income */}
                    <div
                      onClick={() => setDealType('drip_income')}
                      className={`cursor-pointer rounded-xl p-4 border transition ${
                        dealType === 'drip_income'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold uppercase text-emerald-400">
                          Option B (Popular)
                        </span>
                        {dealType === 'drip_income' && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">Drip Income</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Zero upfront cost. Direct-to-Film print-on-demand whenever a customer orders. Pure royalty profit per piece sold.
                      </p>
                      <div className="mt-3 text-[11px] font-mono text-zinc-300 bg-zinc-900/80 p-2 rounded-lg">
                        💧 Zero financial risk & instant launch
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm tracking-wide transition flex items-center justify-center space-x-2"
                >
                  {brandSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Brand Registered Successfully!</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Activate Brand</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Active Brands Sidebar */}
          <div className="space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white tracking-tight mb-3">
                Your Registered Brands
              </h3>
              {brands.length === 0 ? (
                <p className="text-xs text-zinc-500">No brands registered yet. Create your first brand on the left.</p>
              ) : (
                <div className="space-y-2.5">
                  {brands.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBrandId(b.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition ${
                        selectedBrandId === b.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{b.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                          {b.deal_type === 'stacked_returns' ? 'Stacked' : 'Drip'}
                        </span>
                      </div>
                      {b.bio && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{b.bio}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GARMENT LAB & 2D MOCKUP DESIGNER */}
      {activeTab === 'mockup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: 2D Interactive Mockup Canvas (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>2D Factory Mockup Canvas</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  {selectedColor.name} • {selectedGarment.type.toUpperCase()}
                </span>
              </div>

              {/* Garment Silhouette Simulation Frame */}
              <div 
                className="relative aspect-square w-full rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-800 shadow-inner transition-colors duration-300"
                style={{ backgroundColor: selectedColor.hex }}
              >
                {/* SVG Silhouette of garment */}
                <svg
                  viewBox="0 0 400 400"
                  className="w-4/5 h-4/5 opacity-80 drop-shadow-2xl"
                  fill="currentColor"
                  style={{ color: selectedColor.hex === '#141416' ? '#1f2024' : selectedColor.hex }}
                >
                  <path
                    d="M 120 40 Q 200 80 280 40 L 360 110 L 310 160 L 270 130 L 270 370 L 130 370 L 130 130 L 90 160 L 40 110 Z"
                    stroke={selectedColor.hex === '#141416' ? '#333' : '#a09d94'}
                    strokeWidth="3"
                  />
                  {/* Collar line */}
                  <path
                    d="M 160 40 Q 200 70 240 40"
                    fill="none"
                    stroke={selectedColor.hex === '#141416' ? '#444' : '#a09d94'}
                    strokeWidth="2.5"
                  />
                </svg>

                {/* Print Placement Artwork Overlay */}
                <div
                  className={`absolute pointer-events-none transition-all duration-300 flex items-center justify-center ${
                    placement === 'oversized_back'
                      ? 'w-44 h-48 top-28'
                      : placement === 'front'
                      ? 'w-36 h-40 top-28'
                      : 'w-16 h-16 top-24 right-32'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={printUrl}
                    alt="Custom Print Artwork"
                    className="max-w-full max-h-full object-contain rounded drop-shadow-lg filter contrast-125"
                  />
                </div>

                {/* Badge Overlay */}
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-300 border border-zinc-700/50">
                  Direct-to-Film (DTF) • 160°C Heat Press
                </div>
              </div>

              {/* Placement Pills */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80">
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-2">
                  Print Placement Hit
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'oversized_back', label: 'Oversized Back' },
                    { id: 'front', label: 'Front Chest A3' },
                    { id: 'chest_pocket', label: 'Pocket Minimal' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlacement(p.id as any)}
                      className={`px-2 py-1.5 rounded-lg text-center font-medium transition ${
                        placement === p.id
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customization Controls & Margin Simulator (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handlePublishProduct} className="space-y-6">
              {/* Product Information */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Garment & Catalogue Setup</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-zinc-400">Associated Brand Drop</label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.deal_type === 'stacked_returns' ? 'Stacked' : 'Drip Income'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-zinc-400">Product Drop Name</label>
                    <input
                      type="text"
                      required
                      value={productTitle}
                      onChange={(e) => setProductTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Garment Base Blank Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-zinc-400">Base Garment Blank</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {GARMENT_PRESETS.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => {
                          setSelectedGarment(g);
                          setRetailPrice(g.defaultRetail);
                        }}
                        className={`cursor-pointer p-3 rounded-xl border text-left transition ${
                          selectedGarment.id === g.id
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{g.name}</div>
                        <div className="text-[10px] text-zinc-400 mt-1">Base Cost: R{g.baseCost}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Garment Color Swatches */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-zinc-400">Garment Colorway</label>
                  <div className="flex items-center space-x-3">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition ${
                          selectedColor.id === c.id
                            ? 'border-amber-500 bg-zinc-800'
                            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-zinc-700"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs text-zinc-200">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Artwork Link / Sample Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-zinc-400">
                    Vector Artwork / Print Graphic URL
                  </label>
                  <input
                    type="url"
                    required
                    value={printUrl}
                    onChange={(e) => setPrintUrl(e.target.value)}
                    placeholder="https://... High-res PNG with transparent background"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <div className="flex items-center space-x-2 pt-1 overflow-x-auto">
                    <span className="text-[10px] text-zinc-500 font-mono">Sample Prints:</span>
                    {SAMPLE_PRINTS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPrintUrl(s.url)}
                        className="text-[11px] text-amber-400 hover:underline whitespace-nowrap"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Profit Margin & Drip Income Simulator */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Drip Income & Margin Calculator</span>
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {profitMarginPercent}% Creator Profit
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Retail Selling Price</span>
                    <span className="font-mono text-amber-400 font-bold text-sm">R{retailPrice}</span>
                  </div>
                  <input
                    type="range"
                    min={platformCost + 50}
                    max={1200}
                    step={10}
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Min: R{platformCost + 50}</span>
                    <span>Sweet Spot: R450 - R650</span>
                    <span>Max: R1200</span>
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Blank Garment + DTF Print & Press</span>
                    <span className="font-mono text-zinc-300">R{platformCost}.00</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Quality Control & Kasi Kollekt Fulfillment Desk</span>
                    <span className="font-mono text-zinc-300">Included</span>
                  </div>
                  <div className="border-t border-zinc-800 pt-2 flex justify-between font-bold">
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <span>Your Net Payout ("Drip Income")</span>
                    </span>
                    <span className="font-mono text-emerald-400 text-sm">R{creatorPayout}.00 / piece</span>
                  </div>
                </div>
              </div>

              {/* Publish Action Button */}
              <div>
                {publishedSlug ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <Check className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-white">Drop Published Live!</h4>
                    <p className="text-xs text-zinc-300">
                      This custom piece is now active in the store catalogue. Orders will mirror straight to the Factory Heat Press queue.
                    </p>
                    <div className="flex items-center justify-center space-x-3 pt-2">
                      <a
                        href="http://localhost:3000/shop"
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center space-x-1.5"
                      >
                        <span>View in Storefront</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setPublishedSlug(null)}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
                      >
                        Publish Another Drop
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={publishing}
                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
                  >
                    {publishing ? (
                      <span>Syncing with Catalogue & Factory...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Launch Drop to Kasi Kollekt (Port 3000 Storefront)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
