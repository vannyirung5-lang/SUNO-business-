import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeft, ArrowRight, Check, MessageCircle, Mic, FileText, Upload, Calendar, Music, Coins, Smartphone, Loader2 } from 'lucide-react';
import { Package, Order } from '../types.js';

// Helper to strictly validate African and international phone numbers in a smart, self-healing way
function validateAfricanAndInternationalPhone(phone: string, countryHint: string): { isValid: boolean; error?: string; formatted?: string } {
  // Remove spaces, dashes, parentheses and other formatting characters, keeping digits and '+'
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (!cleaned) {
    return { isValid: false, error: "Le numéro de téléphone ne doit pas être vide." };
  }

  // Handle double zero '00' prefix as '+'
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  const countryLower = (countryHint || '').trim().toLowerCase();

  // Smart Auto-healing for national format: If it starts with 0 and does not have +
  if (!cleaned.startsWith('+') && cleaned.startsWith('0')) {
    let prefix = '243'; // Default to RDC
    if (countryLower.includes('rdc') || countryLower.includes('congo d') || countryLower.includes('kinshasa') || countryLower.includes('congolaise')) {
      prefix = '243';
    } else if (countryLower.includes('brav') || countryLower.includes('congo-b') || countryLower.includes('242')) {
      prefix = '242';
    } else if (countryLower.includes('ci') || countryLower.includes('ivoire') || countryLower.includes('abidjan') || countryLower.includes('225')) {
      prefix = '225';
    } else if (countryLower.includes('sn') || countryLower.includes('sénégal') || countryLower.includes('senegal') || countryLower.includes('221')) {
      prefix = '221';
    } else if (countryLower.includes('cm') || countryLower.includes('cameroun') || countryLower.includes('237')) {
      prefix = '237';
    } else if (countryLower.includes('ga') || countryLower.includes('gabon') || countryLower.includes('241')) {
      prefix = '241';
    } else if (countryLower.includes('fr') || countryLower.includes('france') || countryLower.includes('33')) {
      prefix = '33';
    } else if (countryLower.includes('be') || countryLower.includes('belgique') || countryLower.includes('32')) {
      prefix = '32';
    }
    cleaned = '+' + prefix + cleaned.slice(1);
  }

  // If there's no plus and it starts with a common prefix without '+'
  if (!cleaned.startsWith('+')) {
    const commonPrefixes = ['243', '242', '225', '221', '237', '241', '250', '257', '254', '255', '256', '33', '32', '1'];
    let autoPrefixed = false;
    for (const prefix of commonPrefixes) {
      if (cleaned.startsWith(prefix)) {
        cleaned = '+' + cleaned;
        autoPrefixed = true;
        break;
      }
    }
    if (!autoPrefixed) {
      if (cleaned.length === 9) {
        cleaned = '+243' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
  }

  const digits = cleaned.slice(1);

  if (digits.length < 7 || digits.length > 15) {
    return {
      isValid: false,
      error: "Un numéro de téléphone international doit comporter entre 7 et 15 chiffres après le signe '+'."
    };
  }

  // Self-healed and fully ready for WhatsApp
  return { isValid: true, formatted: cleaned };
}

// Simple helper to get country name and flag based on phone number prefix
function getCountryName(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('243')) return "RDC 🇨🇩";
  if (digits.startsWith('242')) return "Congo-Brazzaville 🇨🇬";
  if (digits.startsWith('225')) return "Côte d'Ivoire 🇨🇮";
  if (digits.startsWith('221')) return "Sénégal 🇸🇳";
  if (digits.startsWith('237')) return "Cameroun 🇨🇲";
  if (digits.startsWith('241')) return "Gabon 🇬🇦";
  if (digits.startsWith('250')) return "Rwanda 🇷🇼";
  if (digits.startsWith('257')) return "Burundi 🇧🇮";
  if (digits.startsWith('254')) return "Kenya 🇰🇪";
  if (digits.startsWith('255')) return "Tanzanie 🇹🇿";
  if (digits.startsWith('256')) return "Ouganda 🇺🇬";
  if (digits.startsWith('33')) return "France 🇫🇷";
  if (digits.startsWith('32')) return "Belgique 🇧🇪";
  return "International 🌐";
}

interface OrderFormProps {
  packages: Package[];
  initialParams?: any;
  onNavigate: (page: string) => void;
  onSubmitSuccess: (orderId: string) => void;
}

export default function OrderForm({ packages, initialParams, onNavigate, onSubmitSuccess }: OrderFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [whatsappSent, setWhatsappSent] = useState<boolean | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // Clear step errors on transitions
  useEffect(() => {
    setStepError(null);
  }, [currentStep]);

  // Form State
  const [formData, setFormData] = useState<Partial<Order>>({
    customerName: '',
    customerWhatsApp: '',
    customerCity: 'Kinshasa',
    customerCountry: 'RDC',
    customerEmail: '',
    
    recipientName: '',
    recipientRelationship: '',
    recipientAge: '',
    eventDate: '',
    
    storyOption: 'write',
    storyText: '',
    uploadedAudioFilename: '',
    importantWords: '',
    avoidWords: '',
    
    mood: 'Romantique',
    musicStyle: 'Rumba congolaise',
    packageId: 'pack_musique_video',
    vipCardSelected: false,
    
    desiredDeliveryDate: '',
    urgency: 'normal',
    specialInstructions: ''
  });

  // Handle prefilled params (e.g. if navigated from home category cards)
  useEffect(() => {
    if (initialParams) {
      const updated: any = {};
      if (initialParams.category) {
        updated.occasion = initialParams.category;
      }
      if (initialParams.style) {
        updated.musicStyle = initialParams.style;
      }
      if (initialParams.mood) {
        updated.mood = initialParams.mood;
      }
      if (initialParams.packageId) {
        updated.packageId = initialParams.packageId;
      }
      if (initialParams.vipCardSelected !== undefined) {
        updated.vipCardSelected = initialParams.vipCardSelected;
      }
      if (initialParams.step) {
        setCurrentStep(initialParams.step);
      }
      if (initialParams.option) {
        updated.storyOption = initialParams.option;
      }
      setFormData(prev => ({ ...prev, ...updated }));
    }
  }, [initialParams]);

  const [occasion, setOccasion] = useState(initialParams?.category || 'Anniversaire');
  const occasionsList = [
    'Anniversaire',
    'Mariage',
    'Hommage / Deuil',
    'Déclaration d’amour',
    'Surprise',
    'Collation / Diplôme',
    'Naissance',
    'Autre'
  ];

  const moodsList = [
    'Romantique',
    'Qui fait pleurer (Grandes larmes)',
    'Joyeux & Festif',
    'Mélancolique',
    'Gospel / Prière',
    'Drôle & Amusant',
    'Nostalgique',
    'Luxe & Élégant',
    'Inspirant & Épique'
  ];

  const stylesList = [
    'Rumba congolaise (Douce et lente)',
    'Afrobeat (Dansant et moderne)',
    'Gospel d’adoration',
    'Zouk chaleureux',
    'Amapiano doux',
    'Acoustique émotionnel (Guitare-Voix)',
    'Chanson de Mariage solennelle',
    'Chanson d’Hommage',
    'Autre'
  ];

  const handleTextChange = (field: keyof Order, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  // Real Voice Recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedFile, setRecordedFile] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        audioChunksRef.current = [];
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const filename = `vox_enregistrement_${Math.floor(Date.now() / 1000)}.webm`;
            setRecordedFile(filename);
            setFormData(prev => ({
              ...prev,
              uploadedAudioFilename: filename,
              uploadedAudioUrl: base64data
            }));
          };
          reader.readAsDataURL(audioBlob);
        };
        
        mediaRecorder.start();
        setRecordedFile(null);
        setIsRecording(true);
      } catch (err) {
        console.error('Mic access error:', err);
        alert('Impossible d\'accéder à votre microphone. Veuillez vérifier les permissions de votre navigateur ou importer directement un fichier audio avec le bouton ci-dessous.');
      }
    }
  };

  const handleAudioUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert("Ce fichier audio est trop lourd (Max 25Mo).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRecordedFile(file.name);
        setFormData(prev => ({
          ...prev,
          uploadedAudioFilename: file.name,
          uploadedAudioUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAudio = () => {
    setRecordedFile(null);
    setFormData(prev => {
      const copy = { ...prev };
      delete copy.uploadedAudioUrl;
      delete copy.uploadedAudioFilename;
      return copy;
    });
  };

  const handleStepNext = () => {
    setStepError(null);

    // Step 1: Occasion Selection
    if (currentStep === 1) {
      if (!occasion) {
        setStepError("Veuillez sélectionner une occasion pour la chanson.");
        return;
      }
    }

    // Step 2: Contact Details
    if (currentStep === 2) {
      if (!formData.customerName || !formData.customerName.trim()) {
        setStepError("Veuillez renseigner votre nom complet.");
        return;
      }
      if (!formData.customerWhatsApp || !formData.customerWhatsApp.trim()) {
        setStepError("Veuillez renseigner votre numéro de téléphone WhatsApp.");
        return;
      }
      
      const phoneValidation = validateAfricanAndInternationalPhone(
        formData.customerWhatsApp,
        formData.customerCountry || ''
      );
      
      if (!phoneValidation.isValid) {
        setStepError(phoneValidation.error || "Numéro de téléphone invalide.");
        return;
      }
      
      // Update the formData with the standardized clean international phone format (e.g. +243978508099)
      if (phoneValidation.formatted) {
        formData.customerWhatsApp = phoneValidation.formatted;
      }

      if (!formData.customerCity || !formData.customerCity.trim()) {
        setStepError("Veuillez indiquer votre ville de résidence.");
        return;
      }
      if (!formData.customerCountry || !formData.customerCountry.trim()) {
        setStepError("Veuillez indiquer votre pays.");
        return;
      }
      if (formData.customerEmail && formData.customerEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.customerEmail.trim())) {
          setStepError("L'adresse e-mail saisie est incorrecte.");
          return;
        }
      }
      if (!formData.acceptsWhatsApp) {
        setStepError("Veuillez cocher la case d'accord WhatsApp afin que nous puissions collaborer avec vous.");
        return;
      }
    }

    // Step 3: Recipient Details
    if (currentStep === 3) {
      if (!formData.recipientName || !formData.recipientName.trim()) {
        setStepError("Veuillez renseigner le nom du destinataire de la chanson.");
        return;
      }
      if (!formData.recipientRelationship || !formData.recipientRelationship.trim()) {
        setStepError("Veuillez renseigner votre relation avec le destinataire (ex: ma mère, mon époux).");
        return;
      }
    }

    // Step 4: Story narration validation
    if (currentStep === 4) {
      if (formData.storyOption === 'write') {
        if (!formData.storyText || formData.storyText.trim().length < 15) {
          setStepError("Veuillez écrire un texte d'au moins 15 caractères racontant l'histoire ou les anecdotes clés pour que nos musiciens s'en inspirent.");
          return;
        }
      } else if (formData.storyOption === 'audio') {
        if (!recordedFile && !formData.uploadedAudioUrl) {
          setStepError("Veuillez enregistrer un mémo vocal ou téléverser un fichier audio pour raconter l'histoire.");
          return;
        }
      }
    }

    // For all other steps (5, 6, 7), values are always prefilled or optional
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La taille du fichier ne doit pas dépasser 5 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          uploadedPhotoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => {
      const copy = { ...prev };
      delete copy.uploadedPhotoUrl;
      return copy;
    });
  };

  const handleSubmitOrder = async () => {
    setStepError(null);
    if (!formData.desiredDeliveryDate) {
      setStepError("Veuillez choisir une date de livraison désirée.");
      return;
    }
    
    // Verify that desiredDeliveryDate is today or in the future
    const pickedDate = new Date(formData.desiredDeliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickedDate < today) {
      setStepError("La date souhaitée de livraison ne peut pas être une date passée.");
      return;
    }

    setIsSubmitting(true);
    const completeOrder = {
      ...formData,
      occasion: occasion
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeOrder)
      });
      if (!response.ok) {
        throw new Error("Échec de la réponse du serveur.");
      }
      const data = await response.json();
      const generatedId = data?.id;
      if (!generatedId) {
        throw new Error("Aucun identifiant de commande généré.");
      }
      setSubmittedOrderId(generatedId);
      setWhatsappSent(data?.whatsappSent ?? false);
      setIsSubmitting(false);
      setCurrentStep(9); // Step 9 is Confirmation Page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting order', err);
      setIsSubmitting(false);
      setWhatsappSent(false);
      setStepError("Problème de connexion avec le studio. Veuillez réessayer ou commander directement via WhatsApp (+243 978 508 099). Votre commande n'a pas pu être enregistrée.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-[80vh] py-16 bg-[#040206] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Progress bar container (for active form steps) */}
        {currentStep <= totalSteps && (
          <div className="space-y-6 mb-12">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-yellow-400 uppercase tracking-widest">
                Étape {currentStep} sur {totalSteps}
              </span>
              <span className="text-sm font-sans font-semibold text-gray-300">
                {currentStep === 1 && "Quelle est l'occasion ?"}
                {currentStep === 2 && "Vos coordonnées"}
                {currentStep === 3 && "Qui est le destinataire ?"}
                {currentStep === 4 && "Racontez l'histoire"}
                {currentStep === 5 && "Choisissez l'émotion"}
                {currentStep === 6 && "Style musical"}
                {currentStep === 7 && "Formule de production"}
                {currentStep === 8 && "Date de livraison désirée"}
              </span>
            </div>

            {/* Simulated bar */}
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500 transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Global form-validation error display */}
        {stepError && currentStep <= totalSteps && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-200 text-xs sm:text-sm font-medium flex items-start gap-3 shadow-[0_4px_20px_rgba(239,68,68,0.1)]"
          >
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div className="flex-grow space-y-1">
              <h5 className="font-bold text-red-400 font-sans">Veuillez vérifier</h5>
              <p className="leading-relaxed text-red-300/90">{stepError}</p>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------
            STEP 1: CHOOSE OCCASION
            ------------------------------------ */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-white">Quelle est l'occasion de cette chanson ?</h2>
              <p className="text-sm text-gray-400">Sélectionnez la catégorie qui correspond le mieux à votre événement de vie.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {occasionsList.map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setOccasion(occ)}
                  className={`p-5 rounded-2xl border text-left font-sans font-bold transition-all flex items-center justify-between cursor-pointer ${
                    occasion === occ
                      ? 'border-yellow-400 bg-purple-950/20 text-yellow-400'
                      : 'border-white/5 bg-[#0e0e12] hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <span>{occ}</span>
                  {occasion === occ && <Check className="w-4 h-4 text-yellow-400" />}
                </button>
              ))}
            </div>

            <div className="pt-6 flex justify-end">
              <button
                onClick={handleStepNext}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-all"
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------
            STEP 2: CUSTOMER INFORMATION
            ------------------------------------ */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-white">Comment pouvons-nous vous recontacter ?</h2>
              <p className="text-sm text-gray-400">Ces informations nous permettent de lier la commande à votre fiche client et de vous envoyer des aperçus.</p>
            </div>

            <div className="space-y-5 bg-[#0e0e12] p-6 rounded-2xl border border-white/5">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Votre Nom Complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sarah Kimpembe"
                  value={formData.customerName}
                  onChange={(e) => handleTextChange('customerName', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Numéro WhatsApp (Avec indicatif pays) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold text-sm">💬</span>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: +243 978 508 099"
                    value={formData.customerWhatsApp}
                    onChange={(e) => handleTextChange('customerWhatsApp', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm"
                  />
                </div>
                {formData.customerWhatsApp && (
                  <div className="mt-1 text-[11px] flex items-start gap-1 p-2 rounded-lg bg-white/5 border border-white/5">
                    {(() => {
                      const check = validateAfricanAndInternationalPhone(formData.customerWhatsApp, formData.customerCountry || '');
                      if (check.isValid) {
                        return (
                          <span className="text-green-400 font-sans flex items-center gap-1.5 font-semibold">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Format valide détecté : {getCountryName(check.formatted || '')}
                          </span>
                        );
                      } else {
                        return (
                          <span className="text-amber-400 font-sans flex items-start gap-1">
                            <span className="mt-0.5 text-xs">💡</span>
                            <span className="leading-tight">{check.error}</span>
                          </span>
                        );
                      }
                    })()}
                  </div>
                )}
                <span className="block text-[10px] text-gray-500">Obligatoire pour les validations de paroles et l'envoi de la maquette.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Ville *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kinshasa"
                    value={formData.customerCity}
                    onChange={(e) => handleTextChange('customerCity', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Pays *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: RDC"
                    value={formData.customerCountry}
                    onChange={(e) => handleTextChange('customerCountry', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">E-mail (Optionnel)</label>
                <input
                  type="email"
                  placeholder="Ex: sarah.k@gmail.com"
                  value={formData.customerEmail}
                  onChange={(e) => handleTextChange('customerEmail', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    required
                    checked={formData.acceptsWhatsApp || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, acceptsWhatsApp: e.target.checked }))}
                    className="mt-1 accent-yellow-500 w-4.5 h-4.5 rounded border-white/10 bg-black text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-300 group-hover:text-white transition-colors leading-relaxed">
                    J’accepte de recevoir les informations de ma commande par WhatsApp. <span className="text-red-500 font-bold">*</span>
                  </span>
                </label>
              </div>

            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleStepBack}
                className="px-6 py-3.5 rounded-full border border-white/10 text-gray-300 font-sans font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer"
              >
                Retour
              </button>
              
              <button
                onClick={handleStepNext}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition-all"
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------
            STEP 3: RECIPIENT INFORMATION
            ------------------------------------ */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-white">Pour qui est destinée cette chanson ?</h2>
              <p className="text-sm text-gray-400">Racontez-nous brièvement le profil du bénéficiaire final.</p>
            </div>

            <div className="space-y-5 bg-[#0e0e12] p-6 rounded-2xl border border-white/5">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Nom du destinataire *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maman Georgette, Mon époux Caleb, etc."
                  value={formData.recipientName}
                  onChange={(e) => handleTextChange('recipientName', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Votre relation avec lui/elle *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: C'est ma maman, C'est mon grand frère, C'est mon fiancé"
                  value={formData.recipientRelationship}
                  onChange={(e) => handleTextChange('recipientRelationship', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Âge du destinataire (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: 60 ans, 30 ans"
                    value={formData.recipientAge}
                    onChange={(e) => handleTextChange('recipientAge', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Date de l'événement (Optionnel)</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleTextChange('eventDate', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm"
                  />
                </div>
              </div>

            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleStepBack}
                className="px-6 py-3.5 rounded-full border border-white/10 text-gray-300 font-sans font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer"
              >
                Retour
              </button>
              
              <button
                onClick={handleStepNext}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition-all"
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------
            STEP 4: TELL THE STORY
            ------------------------------------ */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-white">Racontez-nous son histoire, ses souvenirs...</h2>
              <p className="text-sm text-gray-400 leading-relaxed bg-yellow-400/5 border border-yellow-400/10 p-4 rounded-xl">
                📢 <strong className="text-yellow-400 font-semibold">Conseil :</strong> Parlez tout naturellement. Même si ce n'est pas bien organisé, nos paroliers vont comprendre l'émotion et structurer le texte de manière divine.
              </p>
            </div>

            {/* Input Selection tabs */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleTextChange('storyOption', 'write')}
                className={`py-3.5 rounded-xl border font-sans font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  formData.storyOption === 'write'
                    ? 'border-yellow-400 bg-purple-950/20 text-yellow-400'
                    : 'border-white/5 bg-[#0e0e12] text-gray-400'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Rédiger</span>
              </button>

              <button
                type="button"
                onClick={() => handleTextChange('storyOption', 'audio')}
                className={`py-3.5 rounded-xl border font-sans font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  formData.storyOption === 'audio'
                    ? 'border-yellow-400 bg-purple-950/20 text-yellow-400'
                    : 'border-white/5 bg-[#0e0e12] text-gray-400'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Note Vocale</span>
              </button>

              <button
                type="button"
                onClick={() => handleTextChange('storyOption', 'whatsapp')}
                className={`py-3.5 rounded-xl border font-sans font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  formData.storyOption === 'whatsapp'
                    ? 'border-yellow-400 bg-purple-950/20 text-yellow-400'
                    : 'border-white/5 bg-[#0e0e12] text-gray-400'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>

            {/* Conditionally show inputs */}
            <div className="bg-[#0e0e12] p-6 rounded-2xl border border-white/5 space-y-6">
              
              {formData.storyOption === 'write' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Écrivez ici l'histoire (anecdotes, passions, moments forts, etc.) *</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Ex: Maman Georgette a passé toute sa vie à Goma à élever seule ses 4 enfants. Elle a l'odeur du foufou de nos après-midi d'enfance, elle rit tout le temps, elle aime les bouquets de fleurs fraîches..."
                    value={formData.storyText}
                    onChange={(e) => handleTextChange('storyText', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm leading-relaxed"
                  />
                </div>
              )}

              {formData.storyOption === 'audio' && (
                <div className="space-y-4 text-center py-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Enregistrez votre voix ou importez un fichier audio pour raconter l'histoire
                  </label>
                  
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-2xl bg-black space-y-4">
                    {isRecording ? (
                      <div className="space-y-3">
                        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto animate-ping">
                          <Mic className="w-8 h-8 text-white" />
                        </div>
                        <span className="block font-mono text-xl text-red-500 font-semibold">Enregistrement en cours... {formatSeconds(recordSeconds)}</span>
                        <span className="block text-xs text-gray-400">Racontez votre rumba de vie, anecdotes de famille ou souvenirs marquants...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Mic className="w-12 h-12 text-yellow-400 mx-auto" />
                        <span className="block text-sm text-gray-300">Racontez votre histoire de vive voix</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 justify-center pt-2">
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`px-6 py-2.5 rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          isRecording 
                            ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
                            : 'bg-yellow-400 hover:bg-yellow-300 text-black'
                        }`}
                      >
                        {isRecording ? 'Arrêter et sauvegarder' : 'Démarrer l\'enregistrement'}
                      </button>

                      {!isRecording && (
                        <>
                          <input
                            type="file"
                            id="audio-upload-input"
                            accept="audio/*"
                            onChange={handleAudioUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('audio-upload-input')?.click()}
                            className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Sélectionner un fichier
                          </button>
                        </>
                      )}
                    </div>

                    {recordedFile && (
                      <div className="w-full max-w-md p-4 bg-green-950/20 rounded-2xl border border-green-500/20 space-y-3 mt-4 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-green-400 font-bold">
                            <Check className="w-4 h-4" />
                            <span>Fichier prêt : {recordedFile}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveAudio}
                            className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </div>
                        {formData.uploadedAudioUrl && (
                          <div className="pt-1">
                            <span className="block text-[10px] text-gray-400 mb-1">Aperçu de votre enregistrement :</span>
                            <audio
                              src={formData.uploadedAudioUrl}
                              controls
                              className="w-full h-8 rounded bg-black/60 accent-green-400"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Formats acceptés : MP3, M4A, OGG, WAV, WEBM (Max 25 Mo).
                  </div>
                </div>
              )}

              {formData.storyOption === 'whatsapp' && (
                <div className="space-y-4 text-center py-6 space-y-4">
                  <MessageCircle className="w-12 h-12 text-green-500 mx-auto fill-green-500/10" />
                  <div className="space-y-2 max-w-md mx-auto">
                    <h4 className="font-bold text-base text-white">Continuer sur WhatsApp</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Si vous préférez nous raconter toute votre histoire de vive voix ou par messages vocaux WhatsApp directement, aucun problème ! C'est le choix de 70% de nos clients.
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href="https://wa.me/243978508099?text=Bonjour%20VOXMORY%2C%20je%20souhaite%20raconter%20mon%20histoire%20sur%20WhatsApp%20pour%20ma%20commande."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:bg-green-500 text-white font-sans font-bold text-xs uppercase tracking-widest shadow-md"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      Raconter sur WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* Photo uploader (Optional but great visual) */}
              <div className="space-y-2 border-t border-white/5 pt-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Photo du destinataire (Optionnel - pour illustrer la chanson)</label>
                <input
                  type="file"
                  id="photo-upload-input"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="flex items-center gap-4 bg-black p-4 rounded-xl border border-white/10">
                  {formData.uploadedPhotoUrl ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-purple-500/30 flex-shrink-0">
                      <img
                        src={formData.uploadedPhotoUrl}
                        alt="Aperçu du visage"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 flex-shrink-0">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                  
                  <div className="flex-grow">
                    <span className="block text-xs text-gray-200 font-semibold">
                      {formData.uploadedPhotoUrl ? "Visage enregistré !" : "Ajouter un visage pour illustrer la chanson"}
                    </span>
                    <span className="block text-[10px] text-gray-500">
                      {formData.uploadedPhotoUrl ? "Cette photo sera intégrée à la page souvenir de la chanson." : "Formats acceptés : JPG, PNG (Max 5Mo)."}
                    </span>
                  </div>

                  {formData.uploadedPhotoUrl ? (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/30 text-red-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-red-500/20 uppercase tracking-wider"
                    >
                      Supprimer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => document.getElementById('photo-upload-input')?.click()}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Choisir
                    </button>
                  )}
                </div>
              </div>

              {/* Important words / topics to avoid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Mots / Noms indispensables</label>
                  <input
                    type="text"
                    placeholder="Ex: Goma, Tonton Sylvain, NZAMBE"
                    value={formData.importantWords}
                    onChange={(e) => handleTextChange('importantWords', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:outline-none transition-all text-xs"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Sujets sensibles à éviter</label>
                  <input
                    type="text"
                    placeholder="Ex: maladie, départ à l'étranger"
                    value={formData.avoidWords}
                    onChange={(e) => handleTextChange('avoidWords', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:outline-none transition-all text-xs"
                  />
                </div>
              </div>

            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleStepBack}
                className="px-6 py-3.5 rounded-full border border-white/10 text-gray-300 font-sans font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer"
              >
                Retour
              </button>
              
              <button
                onClick={handleStepNext}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition-all"
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------
            STEP 5: CHOOSE EMOTION
            ------------------------------------ */}
        {currentStep === 5 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-white">Quelle émotion souhaitez-vous véhiculer ?</h2>
              <p className="text-sm text-gray-400">Sélectionnez le ton de voix principal qui dictera l'écriture et l'arrangement.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {moodsList.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleTextChange('mood', m)}
                  className={`p-4 rounded-xl border text-left font-sans font-medium text-sm transition-all flex items-center justify-between cursor-pointer ${
                    formData.mood === m
                      ? 'border-yellow-400 bg-purple-950/20 text-yellow-400'
                      : 'border-white/5 bg-[#0e0e12] hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <span>{m}</span>
                  {formData.mood === m && <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleStepBack}
                className="px-6 py-3.5 rounded-full border border-white/10 text-gray-300 font-sans font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer"
              >
                Retour
              </button>
              
              <button
                onClick={handleStepNext}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition-all"
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------
            STEP 6: CHOOSE MUSIC STYLE
            ------------------------------------ */}
        {currentStep === 6 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-white">Quel est son style musical préféré ?</h2>
              <p className="text-sm text-gray-400">Sélectionnez le rythme qui bercera votre œuvre d'art.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stylesList.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleTextChange('musicStyle', st)}
                  className={`p-4 rounded-xl border text-left font-sans font-medium text-sm transition-all flex items-center justify-between cursor-pointer ${
                    formData.musicStyle === st
                      ? 'border-yellow-400 bg-purple-950/20 text-yellow-400'
                      : 'border-white/5 bg-[#0e0e12] hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <span>{st}</span>
                  {formData.musicStyle === st && <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleStepBack}
                className="px-6 py-3.5 rounded-full border border-white/10 text-gray-300 font-sans font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer"
              >
                Retour
              </button>
              
              <button
                onClick={handleStepNext}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition-all"
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------
            STEP 7: CHOOSE PACKAGE
            ------------------------------------ */}
        {currentStep === 7 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-white">Sélectionnez votre formule de production</h2>
              <p className="text-sm text-gray-400">Trouvez le pack de service parfait, du plus accessible au plus majestueux.</p>
            </div>

            <div className="space-y-4">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleTextChange('packageId', pkg.id)}
                  className={`w-full p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-4 ${
                    formData.packageId === pkg.id
                      ? 'border-yellow-400 bg-purple-950/20'
                      : 'border-white/5 bg-[#0e0e12] hover:border-white/10'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-lg text-white">{pkg.name}</span>
                      {formData.packageId === pkg.id && (
                        <span className="bg-yellow-400/10 text-yellow-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono border border-yellow-400/20">Sélectionné</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{pkg.promise}</p>
                    <span className="inline-block text-[10px] text-pink-400 font-medium">Livraison : {pkg.deliveryTime}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="block font-sans font-extrabold text-xl text-yellow-400">{pkg.price}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Options supplémentaires */}
            <div className="space-y-3 pt-6 border-t border-white/5">
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Option supplémentaire</h3>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, vipCardSelected: !prev.vipCardSelected }))}
                className={`w-full p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  formData.vipCardSelected
                    ? 'border-pink-500 bg-purple-950/10'
                    : 'border-white/5 bg-[#0e0e12] hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                      formData.vipCardSelected
                        ? 'bg-pink-600 border-pink-500 text-white'
                        : 'border-white/20 bg-black'
                    }`}>
                      {formData.vipCardSelected && (
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-base text-white">Carte VIP Souvenir</span>
                      <span className="bg-pink-500/10 text-pink-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono border border-pink-400/20">Add-on</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">Une carte souvenir officielle VOXMORY pour rendre votre commande plus spéciale.</p>
                    <ul className="text-[10px] text-purple-300 flex flex-wrap gap-x-3 gap-y-1 pt-1 list-disc list-inside font-mono">
                      <li>Carte VIP personnalisée</li>
                      <li>Nom du bénéficiaire</li>
                      <li>Code unique</li>
                      <li>Design premium</li>
                    </ul>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="block font-sans font-extrabold text-lg text-pink-400">+2 $</span>
                </div>
              </button>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleStepBack}
                className="px-6 py-3.5 rounded-full border border-white/10 text-gray-300 font-sans font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer"
              >
                Retour
              </button>
              
              <button
                onClick={handleStepNext}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition-all"
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------
            STEP 8: DELIVERY
            ------------------------------------ */}
        {currentStep === 8 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-white">Date de livraison &amp; Finalisation</h2>
              <p className="text-sm text-gray-400">Dernières instructions pour notre équipe de musiciens avant la mise en production.</p>
            </div>

            <div className="bg-[#0e0e12] p-6 rounded-2xl border border-white/5 space-y-6">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-yellow-400" />
                  <span>Date souhaitée pour recevoir la chanson finalisée *</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.desiredDeliveryDate}
                  onChange={(e) => handleTextChange('desiredDeliveryDate', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Niveau d'Urgence de production *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <button
                    type="button"
                    onClick={() => handleTextChange('urgency', 'normal')}
                    className={`p-3.5 rounded-xl border text-center font-sans font-bold text-xs uppercase tracking-wider cursor-pointer ${
                      formData.urgency === 'normal'
                        ? 'border-yellow-400 bg-purple-950/20 text-yellow-400'
                        : 'border-white/5 bg-black hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    Normal (Standard)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTextChange('urgency', 'express')}
                    className={`p-3.5 rounded-xl border text-center font-sans font-bold text-xs uppercase tracking-wider cursor-pointer ${
                      formData.urgency === 'express'
                        ? 'border-yellow-400 bg-purple-950/20 text-yellow-400 animate-pulse'
                        : 'border-white/5 bg-black hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    Express (72h)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTextChange('urgency', 'super_express')}
                    className={`p-3.5 rounded-xl border text-center font-sans font-bold text-xs uppercase tracking-wider cursor-pointer ${
                      formData.urgency === 'super_express'
                        ? 'border-yellow-400 bg-purple-950/20 text-yellow-400'
                        : 'border-white/5 bg-black hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    Super Express (24h)
                  </button>

                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Instructions spéciales ou remarques</label>
                <textarea
                  rows={3}
                  placeholder="Ex: C'est une surprise complète pour le bal de mariage, commencez doucement et finissez très rythmé..."
                  value={formData.specialInstructions}
                  onChange={(e) => handleTextChange('specialInstructions', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none transition-all text-sm leading-relaxed"
                />
              </div>

            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleStepBack}
                className="px-6 py-3.5 rounded-full border border-white/10 text-gray-300 font-sans font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer"
              >
                Retour
              </button>
              
              <button
                disabled={isSubmitting}
                onClick={handleSubmitOrder}
                className="px-10 py-4 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-black font-sans font-bold text-sm tracking-widest uppercase flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Mise en boîte...</span>
                  </>
                ) : (
                  <>
                    <span>Valider ma commande</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------
            STEP 9: ORDER CONFIRMED & PAYMENT PROCESS
            ------------------------------------ */}
        {currentStep === 9 && (
          <div className="space-y-8 animate-fade-in py-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="font-sans font-extrabold text-3xl text-white">Félicitations, commande reçue !</h2>
                <span className="inline-block bg-[#120b1e] px-4 py-2 rounded-full border border-purple-500/30 font-mono text-yellow-400 font-bold text-sm tracking-widest">
                  N° Commande : {submittedOrderId || 'VOX-2026-TEMP'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Votre demande de chanson personnalisée est officiellement enregistrée dans notre studio créatif. Voici comment finaliser et lancer la production immédiatement :
              </p>

              {whatsappSent === true ? (
                <div className="max-w-md mx-auto p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-left animate-pulse">
                  <span className="text-xl">✅</span>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Confirmation Envoyée !</h5>
                    <p className="text-[11px] text-gray-300">Un message de confirmation automatique a été envoyé sur votre compte WhatsApp.</p>
                  </div>
                </div>
              ) : whatsappSent === false ? (
                <div className="max-w-md mx-auto p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-left">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Validation manuelle en cours</h5>
                    <p className="text-[11px] text-gray-300">Votre commande a été reçue. La confirmation WhatsApp sera envoyée manuellement.</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* PROCESSUS DE PAIEMENT - VISUAL TIMELINE */}
            <div className="bg-[#0e0e12] border border-yellow-500/15 p-6 sm:p-8 rounded-3xl space-y-6">
              <h3 className="font-sans font-black text-xl text-white border-b border-white/5 pb-4 flex items-center gap-2.5">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span>Processus de Paiement Sécurisé</span>
              </h3>

              <div className="space-y-6 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-[2px] before:bg-white/5 pl-8 text-left">
                
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-8 top-1.5 w-6 h-6 rounded-full bg-yellow-400 text-black font-sans font-extrabold text-xs flex items-center justify-center shadow-lg">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-sans font-bold text-sm text-white uppercase tracking-wider text-yellow-400">
                      Choisissez votre moyen de paiement
                    </h4>
                    <p className="text-xs text-gray-400">
                      Nous acceptons les principaux services de Mobile Money en République Démocratique du Congo : <strong>Airtel Money, M-Pesa, et Orange Money</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-8 top-1.5 w-6 h-6 rounded-full bg-pink-500 text-white font-sans font-extrabold text-xs flex items-center justify-center shadow-lg">
                    2
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-white uppercase tracking-wider text-pink-400">
                        Effectuez le transfert de l'acompte (50% ou 100%)
                      </h4>
                      <p className="text-xs text-gray-400">
                        Veuillez envoyer votre paiement sur l'un de nos comptes officiels vérifiés ci-dessous :
                      </p>
                    </div>

                    {/* Highly stylized, giant bold numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Airtel Money Card */}
                      <div className="bg-black/60 p-4 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-600/20 text-red-400 border border-red-500/10 font-mono uppercase">
                            Airtel Money
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="block text-2xl font-mono font-black text-white tracking-wider">
                            +243 978 508 099
                          </span>
                          <span className="block text-[10px] text-gray-400 font-sans uppercase font-bold">
                            Bénéficiaire : <span className="text-yellow-400">VANNY irung</span>
                          </span>
                        </div>
                      </div>

                      {/* Orange Money Card */}
                      <div className="bg-black/60 p-4 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-600/20 text-orange-400 border border-orange-500/10 font-mono uppercase">
                            Orange Money
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="block text-2xl font-mono font-black text-white tracking-wider">
                            +243 891 170 023
                          </span>
                          <span className="block text-[10px] text-gray-400 font-sans uppercase font-bold">
                            Bénéficiaire : <span className="text-yellow-400">VANNY KAYEMB</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-8 top-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white font-sans font-extrabold text-xs flex items-center justify-center shadow-lg">
                    3
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-sans font-bold text-sm text-white uppercase tracking-wider text-emerald-400">
                        Confirmez et lancez la production sur WhatsApp
                      </h4>
                      <p className="text-xs text-gray-400">
                        Cliquez sur le bouton ci-dessous pour nous envoyer automatiquement votre numéro de commande <strong>{submittedOrderId || 'VOX-2026-TEMP'}</strong> ainsi que la capture d'écran de votre transfert Mobile Money. Nos musiciens s'activent instantanément !
                      </p>
                    </div>

                    {/* Instant WhatsApp link button */}
                    <div className="pt-2">
                      <a
                        href={`https://wa.me/243978508099?text=Bonjour%20VOXMORY%2C%20je%20viens%20de%20valider%20ma%20commande%20pour%20une%20chanson%20personnalis%C3%A9e.%20Mon%20num%C3%A9ro%20de%20commande%20est%20${submittedOrderId || 'VOX-2026-TEMP'}.%20Voici%20ma%20preuve%20de%20paiement.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-sans font-black text-xs sm:text-sm tracking-widest uppercase rounded-2xl shadow-xl shadow-green-950/20 hover:scale-[1.01] hover:brightness-110 active:scale-100 transition-all flex items-center justify-center gap-3 border border-green-400/20"
                      >
                        <MessageCircle className="w-5 h-5 fill-white" />
                        <span>Envoyer ma preuve de paiement sur WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

              </div>

              {/* Secure guarantee banner */}
              <div className="mt-8 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-gray-500 font-sans uppercase font-bold">
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Paiement 100% sécurisé &amp; traçable
                </span>
                <span>Support client disponible 24h/24 : +243 978 508 099</span>
              </div>
            </div>

            {/* Quick tracker link */}
            <div className="text-center pt-2">
              <button
                onClick={() => onNavigate('tracking')}
                className="text-xs text-gray-400 hover:text-white underline font-semibold transition-all cursor-pointer"
              >
                Suivre l'avancement de ma commande en temps réel
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
