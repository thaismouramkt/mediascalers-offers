'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Sparkles, Loader2, AlertCircle, MapPin, DollarSign, X, ExternalLink } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getKeyword = (name: string) => {
  if(!name) return "";
  let kw = name.split('-')[0].split('|')[0];
  // Remove variações das tags comerciais
  kw = kw.replace(/\[?\bhot\b\]?/i, '')
         .replace(/\[?\bnew\b\]?/i, '')
         .replace(/\(\s*\)/g, '')
         .replace(/\[\s*\]/g, '')
         .trim();
         
  // Filtro final: Seleciona APENAS a primeira palavra conforme instrução restrita
  if (kw) {
    kw = kw.split(' ')[0].trim();
  }
  return kw;
};

function TrendsGraph({ keyword }: { keyword: string }) {
  const [data30, setData30] = useState<any[]>([]);
  const [data7, setData7] = useState<any[]>([]);
  const [topCountries, setTopCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'30' | '7'>('30');

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      try {
        const res = await axios.get(`/api/trends?keyword=${encodeURIComponent(keyword)}`);
        if (res.data.success) {
          setData30(res.data.data30 || []);
          setData7(res.data.data7 || []);
          setTopCountries(res.data.topCountries || []);
        } else {
          setError('Sem dados suficientes.');
        }
      } catch (err) {
        setError('Volume do Google muito baixo para essa palavra.');
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, [keyword]);

  if (loading) return (
    <div className="h-40 w-full flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/5">
      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mb-2" />
      <span className="text-xs text-white/40">Carregando métricas globais do Trends...</span>
    </div>
  );

  if (error || data30.length === 0) return (
    <div className="h-40 w-full flex flex-col items-center justify-center bg-red-500/5 rounded-xl border border-red-500/10">
      <AlertCircle className="w-5 h-5 text-red-400 mb-2" />
      <span className="text-xs text-red-400/80">{error || 'Produto sem buscas suficientes'}</span>
    </div>
  );

  const activeData = viewMode === '30' ? data30 : data7;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Gráfico */}
      <div className="p-4 rounded-xl bg-[#121214] border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-white/50 uppercase">Interesse de Busca</span>
          <div className="flex bg-white/5 p-1 rounded-lg">
             <button onClick={() => setViewMode('7')} className={cn("px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-colors", viewMode === '7' ? "bg-indigo-500 text-white" : "text-white/40 hover:text-white")}>7 Dias</button>
             <button onClick={() => setViewMode('30')} className={cn("px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-colors", viewMode === '30' ? "bg-indigo-500 text-white" : "text-white/40 hover:text-white")}>30 Dias</button>
          </div>
        </div>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
              <Area type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex justify-end">
           <span className="text-[9px] text-white/30 truncate max-w-full">
             Termo analisado pelo robô: <strong>"{keyword}"</strong>
           </span>
        </div>
      </div>

      {/* Países */}
      <div className="p-4 rounded-xl bg-[#121214] border border-white/5">
         <h4 className="text-xs font-semibold text-white/50 uppercase mb-3 flex items-center gap-2"><MapPin className="w-3 h-3 text-indigo-400" /> Top 5 Países Onde Mais Buscam</h4>
         {topCountries.length === 0 ? (
           <p className="text-xs text-white/30">Sem dados regionais para mapear.</p>
         ) : (
           <div className="flex flex-col gap-2">
              {topCountries.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0">
                   <span className="text-white/80 font-medium">{i+1}. {c.country}</span>
                   <span className="text-indigo-400 font-bold px-2 py-0.5 bg-indigo-500/10 rounded-md text-[10px]">{c.value}% Score</span>
                </div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
}

// Declaração de tipo global p/ o script do google
declare global {
  interface Window {
    trends: any;
  }
}

export default function Dashboard() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'HOT' | 'NEW'>('HOT');
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await axios.get(`/api/offers?_t=${Date.now()}`);
        setOffers(res.data.offers || []);
      } catch (err: any) {
        setError('Erro ao carregar ofertas da plataforma');
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, []);

  // "New Offers": São todas as ofertas decrescentes
  const newOffers = [...offers].sort((a,b) => parseInt(b.network_offer_id) - parseInt(a.network_offer_id)); 
  
  // "Hot Offers": O usuário informou que as ofertas HOT possuem "HOT" no nome original delas!
  const hotOffers = newOffers.filter(o => (o.name || '').toUpperCase().includes('HOT'));
  
  const displayList = activeTab === 'HOT' ? hotOffers : newOffers;

  return (
    <div className="min-h-screen bg-[#0A0B10] text-white selection:bg-indigo-500/30 font-sans pb-20">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0B10]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              MediaScalers
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-indigo-400 font-semibold mt-1">Offers</p>
          </div>
          
          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-xl border border-white/10">
             <button 
                onClick={() => setActiveTab('HOT')}
                className={cn("flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2", activeTab === 'HOT' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-white/50 hover:bg-white/5")}
             >
                <Flame className={cn("w-4 h-4", activeTab === 'HOT' ? "animate-pulse" : "")} /> HOT OFFERS
             </button>
             <button 
                onClick={() => setActiveTab('NEW')}
                className={cn("flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2", activeTab === 'NEW' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-white/50 hover:bg-white/5")}
             >
                <Sparkles className="w-4 h-4" /> NEW OFFERS
             </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
             <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
             <p className="text-white/50 text-sm">Carregando ofertas da Mediascalers...</p>
          </div>
        ) : error ? (
           <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-center gap-3">
             <AlertCircle className="w-5 h-5" /> {error}
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayList.slice(0, 500).map((offer, idx) => (
              <button
                key={offer.network_offer_id || idx}
                onClick={() => setSelectedOffer(offer)}
                className="text-left group relative p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold tracking-wider text-white/50">
                    ID: {offer.network_offer_id}
                  </div>
                  {activeTab === 'HOT' ? (
                     <div className="px-2 py-1 rounded-md bg-orange-500/10 text-[10px] font-bold text-orange-400 border border-orange-500/20 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> HOT
                     </div>
                  ) : (
                     <div className="px-2 py-1 rounded-md bg-indigo-500/10 text-[10px] font-bold text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> NEW
                     </div>
                  )}
                </div>

                <h3 className="text-base font-medium text-white/90 group-hover:text-white line-clamp-2 mb-4 flex-grow">
                  {offer.name}
                </h3>

                <div>
                   <span className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Status Interno</span>
                   <span className="flex items-center text-sm font-semibold text-emerald-400">
                     <AlertCircle className="w-3 h-3 mr-1" />
                     {offer.offer_status === 'active' ? 'Ativo' : 'Oculto'}
                   </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Modal Lateral Simples e Direto */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOffer(null)} />
          <div className="relative w-full max-w-md bg-[#0A0A0B] h-full border-l border-white/10 shadow-2xl overflow-y-auto p-6 md:p-8 animate-in slide-in-from-right-full duration-300">
            <button onClick={() => setSelectedOffer(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white z-10 transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <div className="pt-8">
              <div className="mb-6">
                 <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 rounded-md bg-white/10 text-[10px] font-bold text-white/60 uppercase">ID: {selectedOffer.network_offer_id}</span>
                    <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", selectedOffer.offer_status === 'active' ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40")}>
                       Status: {selectedOffer.offer_status}
                    </span>
                 </div>
                 <h2 className="text-xl font-bold leading-tight mb-2 text-white/90">{selectedOffer.name}</h2>
              </div>

              {/* Informações detalhadas exigidas (Voltando para Recharts Nativo) */}
              <div className="mb-4">
                 <h3 className="text-base font-bold text-white/90 mb-4 inline-flex items-center gap-2 border-b border-indigo-500/30 pb-2"><Sparkles className="w-4 h-4 text-indigo-400" /> Analisador do Módulo</h3>
                 <TrendsGraph keyword={getKeyword(selectedOffer.name)} />
              </div>

              {selectedOffer.preview_url && (
                <a href={selectedOffer.preview_url} target="_blank" rel="noreferrer" className="w-full mt-6 mb-10 flex items-center justify-center gap-2 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white font-bold transition-all text-sm shadow-xl shadow-indigo-600/20 hover:-translate-y-1">
                  ABRIR LINK ORIGINAL DA OFERTA <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
