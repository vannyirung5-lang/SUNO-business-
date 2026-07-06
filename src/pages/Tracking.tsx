import { useState, useEffect, FormEvent } from 'react';
import { Search, Sparkles, MessageCircle, AlertCircle, RefreshCw, FileText, CheckCircle2, Music, Download } from 'lucide-react';
import { Order, OrderStatus } from '../types.js';

interface TrackingProps {
  initialOrderId?: string;
  onNavigate: (page: string, params?: any) => void;
}

export default function Tracking({ initialOrderId, onNavigate }: TrackingProps) {
  const [searchId, setSearchId] = useState(initialOrderId || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (initialOrderId) {
      setSearchId(initialOrderId);
      const fetchOrder = async () => {
        setLoading(true);
        setErrorMsg(null);
        setOrder(null);
        try {
          const response = await fetch(`/api/orders/${initialOrderId}`);
          if (!response.ok) {
            throw new Error('Commande introuvable.');
          }
          const data = await response.json();
          setOrder(data);
        } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || 'Erreur lors du chargement de la commande.');
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [initialOrderId]);

  const pipelineStages: { status: OrderStatus; label: string; desc: string }[] = [
    { status: 'Commande reçue', label: 'Commande reçue', desc: 'Votre demande est enregistrée par le studio.' },
    { status: 'En attente de paiement', label: 'En attente d\'acompte', desc: 'Validation après versement Airtel Money/M-Pesa/Orange.' },
    { status: 'Histoire reçue', label: 'Histoire reçue', desc: 'Nous avons bien reçu vos souvenirs et votre backstory.' },
    { status: 'Paroles en préparation', label: 'Écriture des paroles', desc: 'Nos paroliers professionnels rédigent vos rimes avec émotion.' },
    { status: 'Chanson en production', label: 'En production studio', desc: 'Nos musiciens composent et arrangent l\'instrumental.' },
    { status: 'En révision', label: 'Révisions intermédiaires', desc: 'Validation de l\'audio et mixage final.' },
    { status: 'Livrée', label: 'Chanson livrée !', desc: 'Votre chanson et page souvenir privée interactive sont prêtes.' }
  ];

  const handleTrackSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setOrder(null);

    try {
      const response = await fetch(`/api/orders/${searchId.trim()}`);
      if (!response.ok) {
        throw new Error('Commande introuvable. Veuillez vérifier l\'identifiant.');
      }
      const data = await response.json();
      setOrder(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erreur lors du suivi de la commande.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (currentStatus: string) => {
    const statusLower = String(currentStatus || '').toLowerCase();
    if (statusLower.includes('nouvelle') || statusLower.includes('reçue') || statusLower.includes('received')) return 0;
    if (statusLower.includes('paiement') || statusLower.includes('acompte') || statusLower.includes('pending_payment')) return 1;
    if (statusLower.includes('histoire')) return 2;
    if (statusLower.includes('paroles') || statusLower.includes('writing')) return 3;
    if (statusLower.includes('chanson') || statusLower.includes('production') || statusLower.includes('composing') || statusLower.includes('cours')) return 4;
    if (statusLower.includes('révision') || statusLower.includes('validation') || statusLower.includes('mixing') || statusLower.includes('terminée')) return 5;
    if (statusLower.includes('livrée') || statusLower.includes('delivered')) return 6;
    return 0; // Default
  };

  return (
    <div className="min-h-[85vh] py-16 bg-[#040206] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/20 text-yellow-400 font-mono text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Suivi de Création</span>
          </div>
          <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-white">
            Suivez l'avancement de votre chanson
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Saisissez votre numéro de commande (ex: VOX-2026-XXXX) pour voir à quelle étape se trouvent nos musiciens en temps réel.
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleTrackSearch} className="max-w-md mx-auto relative">
          <input
            type="text"
            placeholder="Numéro de commande (ex: VOX-2026-XXXX)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white focus:border-yellow-500 focus:outline-none text-sm font-mono tracking-wider"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-tr from-yellow-400 to-amber-500 text-black rounded-lg hover:scale-105 transition-all cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </form>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="max-w-md mx-auto p-4 bg-red-950/20 border border-red-500/10 rounded-2xl flex items-start gap-3 text-xs text-red-400 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <div className="space-y-1">
              <span className="font-bold block text-white">Recherche sans succès</span>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Display Order State Info */}
        {order && (
          <div className="bg-[#0e0e12] border border-yellow-500/10 p-6 sm:p-8 rounded-3xl space-y-8 animate-fade-in">
            
            {/* Quick Metadata top card */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-5">
              <div>
                <span className="text-[10px] uppercase font-mono text-gray-500 block">Identité Commande</span>
                <h3 className="font-sans font-bold text-lg text-white font-mono">{order.id}</h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-mono text-gray-500 block">Destinataire final</span>
                <span className="text-sm font-semibold text-pink-400">{order.recipientName} ({order.occasion})</span>
              </div>
            </div>

            {/* Visual Steps Pipeline */}
            <div className="relative pl-6 sm:pl-8 space-y-8 border-l border-white/10">
              
              {pipelineStages.map((stage, idx) => {
                const currentStatusIdx = getStatusIndex(order.status);
                const isCompleted = idx < currentStatusIdx;
                const isActive = idx === currentStatusIdx;
                
                return (
                  <div key={idx} className="relative">
                    
                    {/* Circle Indicator on the line */}
                    <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-400 text-white' 
                        : isActive 
                          ? 'bg-yellow-400 border-yellow-400 animate-pulse text-black' 
                          : 'bg-black border-zinc-700 text-gray-600'
                    }`}>
                      {isCompleted && <span className="text-[8px] font-bold">✓</span>}
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>

                    {/* Stage descriptions */}
                    <div className="space-y-1">
                      <h4 className={`font-sans font-bold text-sm sm:text-base ${
                        isCompleted ? 'text-gray-400' : isActive ? 'text-yellow-400' : 'text-gray-600'
                      }`}>
                        {stage.label}
                      </h4>
                      <p className={`text-xs ${
                        isCompleted ? 'text-gray-500' : isActive ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {stage.desc}
                      </p>
                    </div>

                  </div>
                );
              })}

            </div>

            {/* Audio player for final delivered song */}
            {order.finalAudioUrl && (
              <div className="p-6 bg-gradient-to-r from-yellow-500/15 to-amber-500/10 rounded-2xl border border-yellow-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[9px] uppercase tracking-widest font-mono text-yellow-400 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                      <Music className="w-3.5 h-3.5 animate-pulse" />
                      <span>Votre Chanson Spéciale est Prête !</span>
                    </span>
                    <h4 className="font-bold text-base text-white">Écoutez votre chef-d'œuvre musical</h4>
                  </div>
                  <a
                    href={order.finalAudioUrl}
                    download={`VOXMORY_${order.id}.mp3`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-sans font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger la Chanson</span>
                  </a>
                </div>
                <div className="pt-2">
                  <audio
                    src={order.finalAudioUrl}
                    controls
                    className="w-full h-11 rounded-xl bg-black border border-white/5 px-1 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Special Instructions & Next Actions */}
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-4">
              <h4 className="font-bold text-xs text-pink-400 uppercase tracking-widest font-mono">Détails d'Accélération</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Une fois l'acompte validé, nos équipes s'activent pour livrer la chanson avant votre date souhaitée (<strong className="text-white">{order.desiredDeliveryDate || 'N/A'}</strong>).
              </p>
              
              {/* WhatsApp direct help */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={`https://wa.me/243978508099?text=Bonjour%20VOXMORY%2C%20je%20souhaite%20suivre%20directement%20ma%20commande%20${order.id}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-sans font-bold text-xs uppercase tracking-widest transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Discuter avec l'ingénieur sur WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Private memory page shortcut (If Delivered) */}
            {order.status === 'delivered' && (
              <div className="p-5 bg-gradient-to-r from-purple-950/40 to-pink-950/40 rounded-2xl border border-yellow-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[9px] uppercase tracking-widest font-mono text-yellow-400 font-bold">Chanson Livrée !</span>
                  <h4 className="font-bold text-sm text-white">Votre Page Souvenir Sacrée est disponible</h4>
                </div>
                <button
                  onClick={() => onNavigate('memory', { slug: order.recipientName.toLowerCase().replace(/\s+/g, '-') })}
                  className="px-5 py-2.5 bg-yellow-400 text-black hover:bg-yellow-300 font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Ouvrir ma page souvenir
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
