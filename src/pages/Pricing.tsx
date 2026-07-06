import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle, Sparkles, Coins, Smartphone, Check, ShieldCheck } from 'lucide-react';
import { Package } from '../types.js';

interface PricingProps {
  packages: Package[];
  onNavigate: (page: string, params?: any) => void;
}

export default function Pricing({ packages, onNavigate }: PricingProps) {
  
  // FAQ Collapsible State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Combien de temps prend la production d'une chanson ?",
      a: "Notre délai de production standard est de 5 à 7 jours. Si vous êtes pressé par le temps pour un anniversaire ou une célébration de dernière minute, vous pouvez sélectionner l'option Express (72h) ou Super Express (24h) lors de la commande pour une mise en priorité immédiate de nos équipes."
    },
    {
      q: "Qui écrit les paroles et de quoi ai-je besoin ?",
      a: "Nos paroliers professionnels rédigent l'intégralité du texte. Vous n'avez pas besoin d'écrire de poèmes ni d'être inspiré : il vous suffit de nous donner des mots-clés, des anecdotes drôles, des noms indispensables, ou de nous parler naturellement par note vocale audio. Nous nous occupons d'y ajouter l'élégance poétique."
    },
    {
      q: "Est-ce que je peux écouter la chanson avant la livraison finale ?",
      a: "Oui, absolument ! Selon votre formule (notamment les packs Souvenir, Héritage, Cérémonie), nous vous envoyons d'abord une première ébauche ou maquette audio par WhatsApp. Vous pouvez la valider ou nous demander des corrections sur le texte ou le rythme avant que nous n'enregistrions la voix finale en studio."
    },
    {
      q: "Dans quelles langues nos musiciens chantent-ils ?",
      a: "Nous composons et chantons dans les langues les plus expressives de notre patrimoine : Français, Lingala, Swahili, Tshiluba, Kikongo, ou en mixant plusieurs d'entre elles selon vos préférences (ex: couplet en Français et refrain en Lingala chaleureux)."
    },
    {
      q: "Comment s'effectuent les paiements Mobile Money ?",
      a: "La sécurité et la simplicité sont nos priorités. Vous pouvez verser un acompte de 50% ou l'intégralité des frais de production par Airtel Money, M-Pesa, ou Orange Money. Envoyez ensuite simplement la preuve d'envoi sur WhatsApp pour que le studio de création commence le travail."
    },
    {
      q: "Comment vais-je recevoir ma chanson personnalisée ?",
      a: "À la finalisation, vous recevrez un fichier audio haute définition (MP3/WAV) directement sur votre WhatsApp ou e-mail. De plus, nous vous générons une Page Souvenir interactive privée (votre lien unique VOXMORY), contenant la chanson, les paroles écrites, la photo du destinataire, et un mot d'amour virtuel, idéale pour le partage familial."
    }
  ];

  return (
    <div className="min-h-[85vh] py-16 bg-[#040206] text-white relative">
      
      {/* Glows */}
      <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-[radial-gradient(circle,_rgba(147,51,234,0.15)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 space-y-16">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/20 text-yellow-400 font-mono text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tarifs Clairs &amp; Transparents</span>
          </div>
          <h1 className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white">
            Un investissement émotionnel inestimable
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Offrez plus qu'un simple cadeau matériel. Créez un patrimoine sonore et un souvenir immortel à chanter en famille pendant des générations.
          </p>
        </div>

        {/* Comparison grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-[#0e0e12] border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                pkg.id === 'pack_musique_video'
                  ? 'border-yellow-400 ring-1 ring-yellow-400/30 lg:scale-[1.03] shadow-xl shadow-yellow-950/15'
                  : 'border-yellow-500/10 hover:border-purple-500/20'
              }`}
            >
              {pkg.id === 'pack_musique_video' && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                  Le Choix Idéal
                </span>
              )}

              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-xl text-white">{pkg.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed min-h-[36px]">{pkg.promise}</p>
                </div>

                <div className="border-y border-white/5 py-4 space-y-1.5">
                  <span className="block font-sans font-extrabold text-3xl text-yellow-400">{pkg.price}</span>
                  <span className="block text-xs text-pink-400 font-medium">Temps de livraison : {pkg.deliveryTime}</span>
                </div>

                <ul className="space-y-3 text-xs text-gray-300">
                  {pkg.includes.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-400 font-bold">✓</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => onNavigate('order', { packageId: pkg.id })}
                  className={`w-full py-3.5 rounded-xl font-sans font-bold text-xs uppercase tracking-widest transition-all cursor-pointer text-center ${
                    pkg.id === 'pack_musique_video'
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:scale-[1.02]'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Choisir cette formule
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Mobile Money payment guide board */}
        <div className="max-w-4xl mx-auto bg-[#09090d] border border-yellow-500/15 p-6 sm:p-10 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-xl">
          
          <div className="md:col-span-7 space-y-5">
            <span className="inline-flex items-center gap-1.5 text-xs text-pink-400 font-bold uppercase tracking-widest font-mono">
              <Coins className="w-4 h-4" />
              <span>Paiement Sécurisé RDC</span>
            </span>
            <h3 className="font-sans font-extrabold text-2xl text-white leading-snug">
              Comment payer ma commande par Mobile Money ?
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Pour initier la composition musicale, un versement d'acompte (50%) ou le règlement total de la formule choisie est requis. Nous prenons en charge l'ensemble des réseaux opérant en RDC.
            </p>
            <div className="flex items-center gap-2 text-xs text-green-400 font-semibold">
              <ShieldCheck className="w-5 h-5" />
              <span>Garantie de remboursement intégral si non satisfait des paroles.</span>
            </div>
          </div>

          {/* Money Info details box */}
          <div className="md:col-span-5 bg-black p-6 rounded-2xl border border-white/5 space-y-4">
            <h4 className="font-sans font-bold text-xs text-yellow-400 tracking-wider flex items-center gap-1.5 uppercase">
              <Smartphone className="w-4 h-4" />
              <span>Numéros de Transfert</span>
            </h4>
            
            <div className="space-y-3 font-mono text-xs text-left">
              <div className="border-b border-white/5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Airtel Money :</span>
                  <span className="font-bold text-white text-sm">+243 978 508 099</span>
                </div>
                <div className="text-[10px] text-yellow-500/80 mt-1 uppercase">Bénéficiaire : VANNY irung</div>
              </div>
              <div className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Orange Money :</span>
                  <span className="font-bold text-white text-sm">+243 891 170 023</span>
                </div>
                <div className="text-[10px] text-yellow-500/80 mt-1 uppercase">Bénéficiaire : VANNY KAYEMB</div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 text-[10px] text-gray-400 leading-normal text-left">
              Après le transfert, envoyez simplement une copie/capture d'écran de l'opération sur WhatsApp pour valider la commande :
            </div>

            <a
              href="https://wa.me/243978508099?text=Bonjour%20VOXMORY%2C%20je%20souhaite%20valider%20le%20paiement%20de%20ma%20chanson."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Confirmer sur WhatsApp</span>
            </a>
          </div>

        </div>

        {/* FAQs */}
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-yellow-400" />
              <span>Foire aux Questions</span>
            </h2>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Toutes les réponses à vos interrogations</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-[#0e0e12] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left font-sans font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 hover:bg-white/5 focus:outline-none cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-yellow-400" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>

                {openFaq === i && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/5 animate-fade-in bg-black/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
