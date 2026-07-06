import { useState, useEffect } from 'react';
import { Music, MessageCircle, Mic, Gift, Flame, Sparkles, Heart, Star, Award, ChevronRight, ChevronLeft, GraduationCap, ShieldCheck, ThumbsUp, Users, RefreshCw, Check, Shield } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer.js';
import { Package, GallerySong, ClientReview } from '../types.js';
import { useLanguage } from '../context/LanguageContext.js';

function AnimatedCounter({ end, duration = 1500, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span className="font-sans font-extrabold text-5xl text-yellow-400">{count}{suffix}</span>;
}

interface HomeProps {
  packages: Package[];
  featuredSongs: GallerySong[];
  featuredReviews: ClientReview[];
  onNavigate: (page: string, params?: any) => void;
}

export default function Home({ packages, featuredSongs, featuredReviews, onNavigate }: HomeProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const { language, t } = useLanguage();
  
  const categories = [
    { 
      id: 'anniversaire', 
      name: language === 'fr' ? 'Anniversaire' : language === 'sw' ? 'Kumbukumbu ya Kuzaliwa' : 'Birthday', 
      icon: Sparkles, 
      desc: language === 'fr' 
        ? 'Une surprise qui raconte les souvenirs, les blagues, les épreuves et les victoires d’une personne qu’on aime.' 
        : language === 'sw'
        ? 'Zawadi ya kushtukiza inayosimulia kumbukumbu, utani, majaribu na ushindi wa mtu unayempenda.'
        : 'A surprise that narrates the memories, inside jokes, struggles, and victories of someone you love.', 
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=500&q=80', 
      gradient: 'from-purple-900/40 to-black' 
    },
    { 
      id: 'mariage', 
      name: language === 'fr' ? 'Mariage' : language === 'sw' ? 'Arusi' : 'Wedding', 
      icon: Heart, 
      desc: language === 'fr' 
        ? 'Une chanson d’entrée, d’ouverture de bal ou de déclaration qui porte votre histoire d’amour avec force et élégance.' 
        : language === 'sw'
        ? 'Wimbo wa kuingia, kufungua densi au tamko la upendo linalobeba hadithi yenu ya mapenzi kwa nguvu na uzuri.'
        : 'An entrance song, first dance opener, or declaration that carries your love story with strength and elegance.', 
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=500&q=80', 
      gradient: 'from-pink-900/40 to-black' 
    },
    { 
      id: 'deuil', 
      name: language === 'fr' ? 'Hommage / Deuil' : language === 'sw' ? 'Kumbukumbu ya Msiba' : 'Funeral Tribute', 
      icon: Award, 
      desc: language === 'fr' 
        ? 'Un hommage digne, tendre et profondément humain pour honorer la mémoire d’un être cher.' 
        : language === 'sw'
        ? 'Kumbukumbu yenye heshima kubwa na ya kiubinadamu ili kuheshimu maisha ya mpendwa wako.'
        : 'A dignified, tender, and deeply human tribute to honor the memory of a loved one.', 
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80', 
      gradient: 'from-gray-900/60 to-black' 
    },
    { 
      id: 'amour', 
      name: language === 'fr' ? 'Amour / Demande' : language === 'sw' ? 'Mapenzi / Kuposa' : 'Love / Proposal', 
      icon: Flame, 
      desc: language === 'fr' 
        ? 'Une déclaration inoubliable, bien plus forte qu’un cadeau classique.' 
        : language === 'sw'
        ? 'Tamko lisiloweza kusahaulika la upendo, lenye nguvu kubwa kuliko zawadi yoyote ya kawaida.'
        : 'An unforgettable declaration of love, far more powerful than a conventional gift.', 
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=500&q=80', 
      gradient: 'from-rose-950/40 to-black' 
    },
  ];

  const testimonials = [
    {
      name: "Christian M.",
      event: language === 'fr' ? "Mariage à Kinshasa" : language === 'sw' ? "Arusi huko Kinshasa" : "Wedding in Kinshasa",
      rating: 5,
      comment: language === 'fr' 
        ? "Quand on a entendu nos prénoms dans la chanson, toute la salle s’est levée. Les gens avaient les larmes aux yeux, c'était d'une puissance rare." 
        : language === 'sw'
        ? "Wakati tuliposikia majina yetu kwenye wimbo, ukumbi mzima ulisimama. Watu walikuwa na machozi ya furaha, ilikuwa nguvu ya kipekee."
        : "When we heard our names in the song, the entire room stood up. People had tears in their eyes, it was an incredibly powerful moment."
    },
    {
      name: "Sarah K.",
      event: language === 'fr' ? "Anniversaire 60 ans" : language === 'sw' ? "Kumbukumbu ya Miaka 60" : "60th Birthday",
      rating: 5,
      comment: language === 'fr'
        ? "Mon père a fondu en larmes en écoutant les paroles sur son parcours. Il ne montre jamais ses émotions d'habitude. C’est le plus beau cadeau de sa vie."
        : language === 'sw'
        ? "Baba yangu alilia kwa furaha aliposikiliza maneno ya wimbo kuhusu maisha yake. Huwa haonyeshi hisia zake kwa kawaida. Hii ndio zawadi nzuri zaidi maishani mwake."
        : "My father melted into tears listening to the lyrics about his life journey. He never shows his emotions usually. This is the most beautiful gift of his life."
    },
    {
      name: "Inès B.",
      event: language === 'fr' ? "Naissance & Berceuse" : language === 'sw' ? "Kuzaliwa na Wimbo wa Mtoto" : "Baby Birth & Lullaby",
      rating: 5,
      comment: language === 'fr'
        ? "Je l’écoute tous les soirs avec ma fille pour l'endormir. C'est une berceuse magnifique qui raconte notre complicité, merci au studio !"
        : language === 'sw'
        ? "Ninaisikiliza kila usiku na binti yangu kumlaza. Ni wimbo mzuri wa kubembeleza unaosimulia uhusiano wetu, asante kwa studio!"
        : "I listen to it every night to put my daughter to sleep. It is a beautiful lullaby that tells the story of our close bond, thank you to the studio!"
    },
    {
      name: "Jean-Pierre T.",
      event: language === 'fr' ? "Hommage de deuil" : language === 'sw' ? "Kumbukumbu ya Msiba" : "Funeral Tribute",
      rating: 5,
      comment: language === 'fr'
        ? "Un hommage d'une dignité incroyable. Toute la famille a été profondément touchée par la justesse des mots et la beauté de la mélodie."
        : language === 'sw'
        ? "Kumbukumbu yenye heshima kubwa sana. Familia nzima iliguswa sana na usahihi wa maneno na uzuri wa sauti."
        : "An incredibly dignified tribute. The entire family was deeply touched by the precision of the words and the beauty of the melody."
    },
    {
      name: "Amani L.",
      event: language === 'fr' ? "Demande en Mariage" : language === 'sw' ? "Kuposa Uchumba" : "Marriage Proposal",
      rating: 5,
      comment: language === 'fr'
        ? "Elle a dit Oui en pleurant de joie ! La chanson racontait notre rencontre au bord du lac, c'était absolument magique."
        : language === 'sw'
        ? "Alisema Ndiyo akilia kwa furaha! Wimbo huo ulisimulia jinsi tulivyokutana kando ya ziwa, ulikuwa wa kichawi kabisa."
        : "She said Yes while crying with joy! The song narrated our meeting by the lake, it was absolutely magical."
    }
  ];

  const [testiIndex, setTestiIndex] = useState(0);

  const nextTesti = () => {
    setTestiIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTesti = () => {
    setTestiIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const timer = setInterval(nextTesti, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="voxmory-homepage" className="relative pb-20 sm:pb-0 bg-black text-white">
      
      {/* ------------------------------------
          1. HERO SECTION (Redessinée)
          ------------------------------------ */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-28 pb-20 overflow-hidden bg-gradient-to-b from-[#060408] via-[#040206] to-black">
        
        {/* Background glowing lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(168,85,247,0.12)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(234,179,8,0.06)_0%,_transparent_70%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-mono text-xs tracking-wider uppercase animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>{t('tagline', 'hero')}</span>
            </div>

            <h1 className="font-sans font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
              {t('title_part1', 'hero')}{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                {t('title_grad', 'hero')}
              </span>{' '}
              {t('title_part2', 'hero')}
            </h1>

            <p className="text-gray-300 text-sm sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t('desc', 'hero')}
            </p>

            {/* Preuves immédiates */}
            <div className="py-3 px-4 rounded-2xl bg-white/5 border border-white/10 inline-flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 text-xs text-gray-300 font-sans">
              <span className="flex items-center gap-1.5">
                {t('badge_speed', 'hero')}
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                {t('badge_human', 'hero')}
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                {t('badge_momo', 'hero')}
              </span>
            </div>

            {/* CTAs Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => onNavigate('order')}
                className="w-full sm:w-auto px-10 py-4.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-sans font-bold text-sm tracking-widest uppercase hover:scale-[1.03] transition-all duration-300 shadow-xl shadow-yellow-500/15 cursor-pointer"
              >
                {t('btn_order', 'hero')}
              </button>

              <button
                onClick={() => onNavigate('gallery')}
                className="w-full sm:w-auto px-10 py-4.5 rounded-full bg-white/5 hover:bg-white/10 text-white font-sans font-semibold text-sm tracking-widest uppercase border border-white/10 hover:border-yellow-500/20 transition-all duration-300 cursor-pointer"
              >
                {t('btn_examples', 'hero')}
              </button>
            </div>

            {/* Microcopie de réassurance */}
            <p className="text-xs text-gray-400 italic">
              {t('microcopy', 'hero')}
            </p>

            {/* Direct WhatsApp Call to Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 text-sm">
              <span className="text-gray-500 text-xs">{t('or_whatsapp', 'hero')}</span>
              <a
                href="https://wa.me/243978508099"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-all font-semibold text-xs"
              >
                <MessageCircle className="w-5 h-5 flex-shrink-0 fill-green-400/20 text-green-400 animate-pulse" />
                <span>{t('whatsapp_cta', 'nav')} : <strong className="whitespace-nowrap font-mono text-sm">+243 978 508 099</strong></span>
              </a>
            </div>

          </div>

          {/* Hero Right Visual Column (Emotional player card) */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden p-[1px] bg-gradient-to-b from-purple-500/40 via-pink-500/20 to-yellow-500/30 shadow-2xl shadow-purple-950/50">
              <div className="w-full h-full rounded-3xl bg-black overflow-hidden relative group">
                <img
                  src="https://images.unsplash.com/photo-1516575150278-77136aed6920?auto=format&fit=crop&w=800&q=80"
                  alt="Une femme émue en écoutant sa chanson personnalisée VOXMORY"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-700"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

                <div className="absolute top-4 left-4 bg-purple-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-purple-500/30 text-[10px] text-pink-300 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span>Rendu Studio Haute Définition</span>
                </div>

                {/* Floating absolute mini demo */}
                <div className="absolute bottom-6 left-6 right-6 bg-[#09090d]/95 backdrop-blur-md p-4 rounded-2xl border border-yellow-500/15 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center flex-shrink-0 border border-yellow-400/20">
                      <Music className="w-5 h-5 text-yellow-400 animate-spin" />
                    </div>
                    <div className="flex-grow">
                      <span className="block text-[8px] text-gray-500 uppercase tracking-widest font-mono">
                        {featuredSongs && featuredSongs.length > 0 ? "Chanson de la galerie" : "Démo à l'écoute"}
                      </span>
                      <span className="block text-xs font-bold text-white">
                        {featuredSongs && featuredSongs.length > 0 ? `« ${featuredSongs[0].title} »` : "« Mon Héros du Quotidien »"}
                      </span>
                      <span className="block text-[9px] text-yellow-400">
                        {featuredSongs && featuredSongs.length > 0 ? `${featuredSongs[0].style} • ${featuredSongs[0].occasion}` : "Rumba congolaise intense (Extrait 30s)"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Embedded demo player */}
                  <AudioPlayer
                    audioUrl={featuredSongs && featuredSongs.length > 0 ? featuredSongs[0].audioUrl : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"}
                    title={featuredSongs && featuredSongs.length > 0 ? featuredSongs[0].title : "Mon Héros du Quotidien"}
                    subtitle={featuredSongs && featuredSongs.length > 0 ? `${featuredSongs[0].style} • ${featuredSongs[0].occasion}` : "Extrait • Rumba"}
                    startTime={0}
                    endTime={30}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------
          2. BANDEAU DE RÉASSURANCE
          ------------------------------------ */}
      <section className="py-10 bg-[#07070b] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h4 className="font-sans font-extrabold text-sm uppercase tracking-widest text-yellow-400">
              Pourquoi les familles nous choisissent
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="p-4 space-y-2">
              <span className="text-yellow-400 font-bold text-lg">💡</span>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                Vous n’avez pas besoin de savoir écrire.
              </p>
            </div>
            <div className="p-4 space-y-2">
              <span className="text-yellow-400 font-bold text-lg">✨</span>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                Nous transformons vos souvenirs en paroles fortes.
              </p>
            </div>
            <div className="p-4 space-y-2">
              <span className="text-yellow-400 font-bold text-lg">❤️</span>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                Chaque chanson est pensée pour une personne réelle et un moment vrai.
              </p>
            </div>
            <div className="p-4 space-y-2">
              <span className="text-yellow-400 font-bold text-lg">🎁</span>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                Vous recevez un souvenir unique, intime et impossible à remplacer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------
          3. SECTION RECONNAISSANCE IMMÉDIATE (Cas d'usage)
          ------------------------------------ */}
      <section className="py-20 bg-[#030304]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto space-y-3 mb-12 text-center">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              Pour quel moment de vie souhaitez-vous créer une chanson ?
            </h2>
            <p className="font-sans font-extrabold text-3xl text-white">
              Sélectionnez votre occasion et commencez
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() => onNavigate('order', { category: cat.name })}
                  className="relative group rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-square cursor-pointer border border-yellow-500/10 hover:border-yellow-400/40 transition-all duration-500 shadow-lg hover:scale-[1.02]"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                  <div className={`absolute inset-0 bg-gradient-to-tr ${cat.gradient} opacity-80 mix-blend-multiply z-10`} />

                  <div className="absolute inset-0 p-6 flex flex-col justify-end z-20 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 group-hover:bg-gradient-to-tr group-hover:from-purple-600 group-hover:to-pink-500 group-hover:text-white transition-all">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-sans font-bold text-lg text-white group-hover:text-yellow-400 transition-colors flex items-center gap-1">
                        <span>{cat.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </h3>
                      <p className="text-[11px] text-gray-300 line-clamp-3 leading-relaxed mt-1">{cat.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => onNavigate('order')}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
            >
              Je choisis mon occasion
            </button>
          </div>

        </div>
      </section>

      {/* ------------------------------------
          4. SECTION ÉCOUTE (Audio Portfolio)
          ------------------------------------ */}
      <section className="py-20 bg-[#050507]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3">
              <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
                Écoutez ce que peut devenir une simple histoire
              </h2>
              <p className="font-sans font-extrabold text-3xl sm:text-4xl text-white">
                Quelques phrases, un souvenir… et cela devient une chanson de studio
              </p>
              <p className="text-gray-400 max-w-xl text-xs sm:text-sm">
                Chaque extrait audio a été entièrement conçu à partir d'une histoire vraie confiée par un client.
              </p>
            </div>
            
            <button
              onClick={() => onNavigate('gallery')}
              className="text-yellow-400 hover:text-white font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer border-b border-yellow-400/20 pb-1"
            >
              <span>Écouter plus d'exemples</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredSongs.slice(0, 3).map((song) => (
              <div
                key={song.id}
                className="bg-[#0c0c10] border border-yellow-500/10 rounded-3xl p-6 space-y-6 hover:border-purple-500/25 transition-all duration-300 flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-purple-950 text-pink-400 font-sans font-semibold text-[10px] uppercase tracking-wider">
                      {song.occasion}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{song.style}</span>
                  </div>

                  <AudioPlayer
                    audioUrl={song.audioUrl}
                    title={song.title}
                    subtitle={`${song.language} • ${song.mood}`}
                    coverUrl={song.coverUrl}
                    startTime={song.startTime}
                    endTime={song.endTime}
                  />

                  <p className="text-xs text-gray-400 italic leading-relaxed">
                    "{song.description}"
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => onNavigate('order', { songTemplate: song.title, category: song.occasion, style: song.style, mood: song.mood })}
                    className="w-full py-3 bg-white/5 hover:bg-gradient-to-tr hover:from-purple-600 hover:to-pink-500 hover:text-white text-white font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                  >
                    Commander une chanson similaire
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ------------------------------------
          5. COMMENT ÇA MARCHE (Éléments du process)
          ------------------------------------ */}
      <section className="py-20 bg-[#030304]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              Processus Ultra Simple
            </h2>
            <p className="font-sans font-extrabold text-3xl text-white">
              Comment ça marche ?
            </p>
            <p className="text-gray-400 text-sm">
              Aucune compétence technique nécessaire. Nous gérons absolument tout de A à Z.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-[#0e0e12] border border-yellow-500/5 p-8 rounded-3xl space-y-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="font-sans font-bold text-lg text-white">1. Vous nous racontez votre histoire</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Par texte, audio ou WhatsApp. Même quelques phrases simples ou une note vocale rapide suffisent largement pour nous donner le contexte.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#0e0e12] border border-yellow-500/5 p-8 rounded-3xl space-y-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Music className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-sans font-bold text-lg text-white">2. Nous écrivons et composons</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Nos auteurs et créatifs transforment vos mots et anecdotes en paroles soignées, rimes émouvantes et mélodies de haute qualité studio.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#0e0e12] border border-yellow-500/5 p-8 rounded-3xl space-y-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-sans font-bold text-lg text-white">3. Vous validez, puis nous livrons</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Vous recevez votre chanson dans le format prévu, prête à offrir, à partager ou à faire jouer lors de votre événement ou célébration familiale.
              </p>
            </div>

          </div>

          <div className="mt-12 inline-block px-6 py-3 rounded-full bg-white/5 border border-white/10 text-xs text-yellow-400 font-sans font-semibold">
            Simple • Rapide • Humain • Sans compétence technique
          </div>

        </div>
      </section>

      {/* ------------------------------------
          6. SECTION BÉNÉFICES (Ce que vous offrez vraiment)
          ------------------------------------ */}
      <section className="py-20 bg-gradient-to-b from-[#030304] to-[#0a0a0f] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          
          <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
            Ce que vous offrez vraiment
          </h2>
          
          <p className="font-sans font-extrabold text-3xl sm:text-4xl text-white leading-tight">
            Vous n’offrez pas juste une musique.<br />
            <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
              Vous offrez un souvenir vivant, une preuve d’amour, un hommage qu’on n’oublie pas.
            </span>
          </p>

          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3">
              <span className="text-xl text-yellow-400">🔥</span>
              <p className="text-xs text-gray-300 leading-relaxed">Un moment magique qui bouleverse toute une salle d'invités.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3">
              <span className="text-xl text-yellow-400">🎵</span>
              <p className="text-xs text-gray-300 leading-relaxed">Une trace intemporelle que la personne pourra réécouter toute sa vie.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3">
              <span className="text-xl text-yellow-400">💖</span>
              <p className="text-xs text-gray-300 leading-relaxed">Un niveau d'attention émotionnelle mille fois supérieur à un cadeau classique.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3">
              <span className="text-xl text-yellow-400">🌟</span>
              <p className="text-xs text-gray-300 leading-relaxed">Une création artisanale valorisant la culture et la sincérité.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------
          7. SECTION OFFRES (Tarifs clairs)
          ------------------------------------ */}
      <section className="py-20 bg-[#030304]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto space-y-3 mb-16 text-center">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              Choisissez la formule qui correspond à votre émotion
            </h2>
            <p className="font-sans font-extrabold text-3xl sm:text-4xl text-white">
              Des tarifs transparents pour immortaliser vos vœux
            </p>
            <p className="text-gray-400 text-sm">
              Sélectionnez l'ampleur de votre surprise ci-dessous. Paiements sécurisés simplifiés.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-[#0e0e12] border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                  pkg.id === 'pack_musique_video'
                    ? 'border-yellow-400 ring-1 ring-yellow-400/30 relative scale-[1.03] shadow-lg shadow-yellow-950/15'
                    : 'border-yellow-500/10 hover:border-purple-500/20'
                }`}
              >
                {pkg.id === 'pack_musique_video' && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                    La Plus Populaire
                  </span>
                )}

                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-lg text-white">{pkg.name}</h3>
                    <p className="text-xs text-gray-400 min-h-[32px]">{pkg.promise}</p>
                  </div>

                  <div className="border-y border-white/5 py-4 space-y-1">
                    <span className="block font-sans text-xs text-gray-400">À partir de :</span>
                    <span className="block font-sans font-extrabold text-3xl text-yellow-400">{pkg.price}</span>
                    <span className="block text-xs text-pink-400 font-medium">Livraison : {pkg.deliveryTime}</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-gray-300">
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

        </div>
      </section>

      {/* ------------------------------------
          8. SECTION DIFFÉRENCIATION (Pourquoi nous)
          ------------------------------------ */}
      <section className="py-20 bg-[#050507]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-16">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              Pourquoi VOXMORY est différent
            </h2>
            <p className="font-sans font-extrabold text-3xl text-white">
              Une exigence artistique, un coeur humain
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
              <h4 className="font-sans font-bold text-white text-base">We partons de votre vraie histoire</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Pas d’émotion générique ou de phrases pré-écrites industrielles. Chaque couplet, chaque rime est lié directement aux prénoms, anecdotes et mémoires confiés par vos soins.
              </p>
            </div>

            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
              <h4 className="font-sans font-bold text-white text-base">Il y a une validation et une relecture humaine</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Les mots comptent. Nos paroliers relisent, ajustent, corrigent la prosodie et s'assurent que la diction artistique respecte parfaitement les conventions d'expression.
              </p>
            </div>

            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
              <h4 className="font-sans font-bold text-white text-base">Vous pouvez commander sans savoir écrire</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Pas besoin d'avoir fait de grandes études littéraires ou musicales. Une simple note vocale ou quelques lignes spontanées nous suffisent pour en faire un bijou d'émotions.
              </p>
            </div>

            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
              <h4 className="font-sans font-bold text-white text-base">Le rendu est 100% prêt à offrir</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                L'audio est produit en qualité studio, et selon votre pack, nous fournissons la vidéo personnalisée et une page souvenir privée interactive accessible via un QR code imprimable.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------
          9. SECTION PREUVE SOCIALE (Témoignages forts - Premium Carousel)
          ------------------------------------ */}
      <section className="py-20 bg-[#030304]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto space-y-3 mb-16 text-center">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              {t('sub', 'testimonials')}
            </h2>
            <p className="font-sans font-extrabold text-2xl sm:text-3xl text-white">
              {t('title', 'testimonials')}
            </p>
          </div>

          <div className="relative max-w-2xl mx-auto px-4 sm:px-0">
            {/* Ambient background glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl opacity-70 -z-10" />
            
            <div className="relative bg-gradient-to-b from-[#0f0f15]/95 to-[#07070b]/98 border border-yellow-500/10 hover:border-yellow-400/30 p-8 sm:p-12 rounded-3xl space-y-6 shadow-2xl transition-all duration-300">
              {/* Gold Stars */}
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                ))}
              </div>
              
              {/* Quotation mark */}
              <span className="block text-center text-4xl text-purple-400/40 font-serif font-extrabold leading-none">“</span>
              
              {/* Review Text */}
              <p className="text-center text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed italic font-medium min-h-[90px] flex items-center justify-center">
                {testimonials[testiIndex].comment}
              </p>
              
              {/* Client detail */}
              <div className="text-center pt-4 border-t border-white/5">
                <span className="block font-bold text-white text-xs sm:text-sm uppercase tracking-wider font-sans">
                  {testimonials[testiIndex].name}
                </span>
                <span className="text-[10px] sm:text-xs text-pink-400">
                  {testimonials[testiIndex].event}
                </span>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-3 sm:-left-16 z-10">
              <button
                onClick={prevTesti}
                className="w-10 h-10 rounded-full bg-[#121216]/90 hover:bg-[#181820] border border-white/10 hover:border-yellow-400/30 flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-16 z-10">
              <button
                onClick={nextTesti}
                className="w-10 h-10 rounded-full bg-[#121216]/90 hover:bg-[#181820] border border-white/10 hover:border-yellow-400/30 flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 pt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestiIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${testiIndex === idx ? 'bg-yellow-400 w-6' : 'bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => onNavigate('reviews')}
              className="px-6 py-3 bg-white/5 border border-white/10 hover:border-yellow-500/20 rounded-full font-sans font-bold text-xs uppercase tracking-widest text-white transition-all cursor-pointer"
            >
              {t('btn_more', 'testimonials')}
            </button>
          </div>

        </div>
      </section>

      {/* ------------------------------------
          10. SECTION RÉASSURANCE (Tranquillité)
          ------------------------------------ */}
      <section className="py-16 bg-[#060609] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h3 className="font-sans font-bold text-xl text-white">{t('title', 'tranquility')}</h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl mx-auto">
            {t('desc', 'tranquility')}
          </p>
          <div className="p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-2xl max-w-xl mx-auto inline-flex items-center gap-2 text-yellow-400 font-sans text-xs">
            <span className="text-lg">🛡️</span>
            <span>{t('guarantee', 'tranquility')}</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------
          11. FAQ CONVERSION (Accordéon des objections)
          ------------------------------------ */}
      <section className="py-20 bg-[#030304]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-16">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              {t('sub', 'faq')}
            </h2>
            <p className="font-sans font-extrabold text-3xl text-white">
              {t('title', 'faq')}
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: t('objection_price_q', 'faq'),
                a: t('objection_price_a', 'faq')
              },
              {
                q: t('objection_delivery_q', 'faq'),
                a: t('objection_delivery_a', 'faq')
              },
              {
                q: t('objection_momo_q', 'faq'),
                a: t('objection_momo_a', 'faq')
              },
              {
                q: t('objection_audio_q', 'faq'),
                a: t('objection_audio_a', 'faq')
              },
              {
                q: t('objection_edit_q', 'faq'),
                a: t('objection_edit_a', 'faq')
              },
              {
                q: t('objection_whatsapp_q', 'faq'),
                a: t('objection_whatsapp_a', 'faq')
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-[#0e0e12] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-yellow-500/20"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-6 flex justify-between items-center text-white font-sans font-bold text-sm sm:text-base cursor-pointer focus:outline-none"
                >
                  <span className="pr-4">{idx + 1}. {faq.q}</span>
                  <span className={`text-yellow-400 text-xl transition-transform duration-300 ${activeFaq === idx ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    activeFaq === idx ? 'max-h-96 border-t border-white/5' : 'max-h-0'
                  }`}
                >
                  <p className="p-6 text-xs sm:text-sm text-gray-300 leading-relaxed bg-[#0b0a0f]">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ------------------------------------
          12. FINAL CTA SECTION (Closing)
          ------------------------------------ */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-t from-[#060408] to-black">
        
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(147,51,234,0.14)_0%,_transparent_70%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 space-y-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
            <Music className="w-6 h-6" />
          </div>

          <div className="space-y-4">
            <h2 className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Ne laissez pas vos souvenirs rester dans votre tête.<br />
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                Transformez-les en chanson.
              </span>
            </h2>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Racontez votre histoire aujourd’hui, et offrez à quelqu’un un moment d’émotion pure qu’il n’oubliera jamais.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('order')}
              className="w-full sm:w-auto px-10 py-4.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-sans font-bold text-sm tracking-widest uppercase hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-yellow-500/10"
            >
              Commander ma chanson maintenant
            </button>
            
            <a
              href="https://wa.me/243978508099"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4.5 rounded-full bg-[#121216] border border-white/10 hover:border-green-500/30 text-green-400 font-sans font-bold text-sm tracking-widest uppercase transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-green-400/10" />
              Parler à VOXMORY sur WhatsApp
            </a>
          </div>

          <div className="text-[11px] text-gray-500 font-mono">
            Réponse rapide • Paiement simple • Accompagnement humain
          </div>
        </div>
      </section>

      {/* ------------------------------------
          STICKY CTA MOBILE FLOTTANT
          ------------------------------------ */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xs">
        <button
          onClick={() => onNavigate('order')}
          className="w-full py-4 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 border border-yellow-300"
        >
          <Sparkles className="w-4 h-4 fill-black text-black" />
          <span>Commander ma chanson</span>
        </button>
      </div>

    </div>
  );
}
