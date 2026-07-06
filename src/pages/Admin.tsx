import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Lock, Sparkles, Sliders, MessageSquare, Calendar, RefreshCw, Check, Trash2, Cpu, FileText, Music, Image as ImageIcon, Send, Clock, Play, MessageCircle, TrendingUp, Users, Radio, Mic, X, Pencil, Heart, Share2, ExternalLink, Upload } from 'lucide-react';
import { Order, ClientReview, EventReminder, OrderStatus, GallerySong, BroadcastList, BroadcastCampaign, BroadcastContact, DailyStat } from '../types.js';

interface AdminProps {
  onNavigate: (page: string, params?: any) => void;
}

export default function Admin({ onNavigate }: AdminProps) {
  // Safe alert helper that won't crash in sandboxed iframes
  const alert = (msg: string) => {
    try {
      window.alert(msg);
    } catch (e) {
      console.warn("[Alert Blocked by Sandbox]:", msg);
    }
  };

  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // Dashboard state
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [gallerySongs, setGallerySongs] = useState<GallerySong[]>([]);
  const [stats, setStats] = useState<any>({ totalOrders: 0, pendingPayment: 0, delivered: 0, totalRevenue: 0, visitsCount: 0, listensCount: 0, dailyStats: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'gallery' | 'reviews' | 'reminders' | 'analytics' | 'broadcast'>('analytics');
  
  const [broadcastLists, setBroadcastLists] = useState<BroadcastList[]>([]);
  const [broadcastCampaigns, setBroadcastCampaigns] = useState<BroadcastCampaign[]>([]);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [completedCampaign, setCompletedCampaign] = useState<BroadcastCampaign | null>(null);

  // Active workspace states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiActivePrompt, setAiActivePrompt] = useState<string | null>(null);

  // Form states for manual updates
  const [statusInput, setStatusInput] = useState<OrderStatus>('received');
  const [notesInput, setNotesInput] = useState('');
  const [finalAudioInput, setFinalAudioInput] = useState('');
  const [finalPhotoInput, setFinalPhotoInput] = useState('');

  // Event reminders form state
  const [newReminder, setNewReminder] = useState({
    customerName: '',
    customerWhatsApp: '',
    occasion: 'Anniversaire',
    reminderDate: '',
    notes: ''
  });

  // Gallery Song form states
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongOccasion, setNewSongOccasion] = useState('Anniversaire');
  const [newSongStyle, setNewSongStyle] = useState('Rumba congolaise');
  const [newSongLanguage, setNewSongLanguage] = useState('Lingala');
  const [newSongMood, setNewSongMood] = useState('Chaleureux');
  const [newSongDescription, setNewSongDescription] = useState('');
  const [newSongAudioUrl, setNewSongAudioUrl] = useState('');
  const [newSongCoverUrl, setNewSongCoverUrl] = useState('');
  const [newSongClientReaction, setNewSongClientReaction] = useState('');
  const [newSongVisibility, setNewSongVisibility] = useState<'Private' | 'Public with first name' | 'Public anonymous' | 'Demo only'>('Public anonymous');
  const [newSongClientFirstName, setNewSongClientFirstName] = useState('');
  const [newSongStartTime, setNewSongStartTime] = useState('');
  const [newSongEndTime, setNewSongEndTime] = useState('');
  const [newSongMemorySlug, setNewSongMemorySlug] = useState('');

  // WhatsApp Broadcast state variables
  const [selectedListId, setSelectedListId] = useState<string>('list_clients_vip');
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  
  const [newContactName, setNewContactName] = useState('');
  const [newContactWhatsApp, setNewContactWhatsApp] = useState('');
  const [newContactCategory, setNewContactCategory] = useState('Client');

  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignTemplate, setCampaignTemplate] = useState('');
  const [campaignTargetList, setCampaignTargetList] = useState('list_clients_vip');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastLogs, setBroadcastLogs] = useState<any[]>([]);

  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  // Real-time Order Indicators & Final Audio Upload States
  const [hasNewOrderIndicator, setHasNewOrderIndicator] = useState(false);
  const [isUploadingFinalAudio, setIsUploadingFinalAudio] = useState(false);
  const [uploadFinalAudioError, setUploadFinalAudioError] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteListId, setConfirmDeleteListId] = useState<string | null>(null);

  // Editing gallery song states
  const [editingSong, setEditingSong] = useState<GallerySong | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOccasion, setEditOccasion] = useState('');
  const [editStyle, setEditStyle] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [editMood, setEditMood] = useState('');
  const [editAudioUrl, setEditAudioUrl] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editClientReaction, setEditClientReaction] = useState('');
  const [editVisibility, setEditVisibility] = useState<'Private' | 'Public with first name' | 'Public anonymous' | 'Demo only'>('Public anonymous');
  const [editClientFirstName, setEditClientFirstName] = useState('');
  const [editMemorySlug, setEditMemorySlug] = useState('');
  
  const [isUploadingEditAudio, setIsUploadingEditAudio] = useState(false);
  const [isUploadingEditCover, setIsUploadingEditCover] = useState(false);

  const handleStartEdit = (song: GallerySong) => {
    setEditingSong(song);
    setEditTitle(song.title || '');
    setEditOccasion(song.occasion || 'Anniversaire');
    setEditStyle(song.style || 'Rumba congolaise');
    setEditLanguage(song.language || 'Lingala');
    setEditMood(song.mood || 'Chaleureux');
    setEditAudioUrl(song.audioUrl || '');
    setEditCoverUrl(song.coverUrl || '');
    setEditStartTime(song.startTime !== undefined ? String(song.startTime) : '');
    setEditEndTime(song.endTime !== undefined ? String(song.endTime) : '');
    setEditDescription(song.description || '');
    setEditClientReaction(song.clientReaction || '');
    setEditVisibility(song.visibility || 'Public anonymous');
    setEditClientFirstName(song.clientFirstName || '');
    setEditMemorySlug(song.memorySlug || '');
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;
    if (!editTitle || !editAudioUrl) {
      alert('Veuillez fournir un titre et une URL pour le fichier audio.');
      return;
    }

    try {
      const payload = {
        title: editTitle,
        occasion: editOccasion,
        style: editStyle,
        language: editLanguage,
        mood: editMood,
        description: editDescription,
        audioUrl: editAudioUrl,
        coverUrl: editCoverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
        clientReaction: editClientReaction,
        visibility: editVisibility,
        clientFirstName: editClientFirstName,
        startTime: editStartTime ? parseFloat(editStartTime) : undefined,
        endTime: editEndTime ? parseFloat(editEndTime) : undefined,
        memorySlug: editMemorySlug || undefined
      };

      const response = await fetch(`/api/gallery/${editingSong.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Chanson de la galerie mise à jour avec succès !');
        setEditingSong(null);
        fetchDashboardData();
      } else {
        const errData = await response.json();
        alert(`Erreur : ${errData.error || 'Impossible de mettre à jour la chanson.'}`);
      }
    } catch (err) {
      console.error('Error saving gallery song edit', err);
      alert('Une erreur est survenue lors de l’enregistrement.');
    }
  };

  const handleEditAudioFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingEditAudio(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data
          })
        });

        if (response.ok) {
          const data = await response.json();
          setEditAudioUrl(data.url);
        } else {
          alert('Erreur lors du téléversement du fichier.');
        }
      } catch (err) {
        console.error('Upload error', err);
        alert('Erreur de connexion lors du téléversement.');
      } finally {
        setIsUploadingEditAudio(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditCoverFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingEditCover(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data
          })
        });

        if (response.ok) {
          const data = await response.json();
          setEditCoverUrl(data.url);
        } else {
          alert('Erreur lors du téléversement de l’image de couverture.');
        }
      } catch (err) {
        console.error('Upload error', err);
        alert('Erreur de connexion lors du téléversement.');
      } finally {
        setIsUploadingEditCover(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAudioFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAudio(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data
          })
        });

        if (response.ok) {
          const data = await response.json();
          setNewSongAudioUrl(data.url);
        } else {
          alert('Erreur lors du téléversement du fichier.');
        }
      } catch (err) {
        console.error('Upload error', err);
        alert('Erreur de connexion lors du téléversement.');
      } finally {
        setIsUploadingAudio(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data
          })
        });

        if (response.ok) {
          const data = await response.json();
          setNewSongCoverUrl(data.url);
        } else {
          alert('Erreur lors du téléversement de l’image de couverture.');
        }
      } catch (err) {
        console.error('Upload error', err);
        alert('Erreur de connexion lors du téléversement.');
      } finally {
        setIsUploadingCover(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchDashboardData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [oRes, rRes, remRes, sRes, galRes, bListRes, bCampRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/reviews?all=true'),
        fetch('/api/reminders'),
        fetch('/api/stats'),
        fetch('/api/admin/gallery'),
        fetch('/api/broadcast/lists'),
        fetch('/api/broadcast/campaigns')
      ]);

      const oData = await oRes.json();
      const rData = await rRes.json();
      const remData = await remRes.json();
      const sData = await sRes.json();
      const galData = await galRes.json();
      const bListData = bListRes.ok ? await bListRes.json() : [];
      const bCampData = bCampRes.ok ? await bCampRes.json() : [];

      // Detect new orders in real-time
      setOrders(prevOrders => {
        if (prevOrders && prevOrders.length > 0 && oData && oData.length > prevOrders.length) {
          const prevIds = new Set(prevOrders.map(o => o.id));
          const hasNew = oData.some((o: any) => !prevIds.has(o.id));
          if (hasNew) {
            setHasNewOrderIndicator(true);
            try {
              // Play soft notification sound
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-500.wav');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch (e) {}
          }
        }
        return oData;
      });

      setReviews(rData);
      setReminders(remData);
      setStats(sData);
      setGallerySongs(galData);
      setBroadcastLists(bListData);
      setBroadcastCampaigns(bCampData);

      if (bListData && bListData.length > 0) {
        setSelectedListId(prev => bListData.some((l: any) => l.id === prev) ? prev : bListData[0].id);
        setCampaignTargetList(prev => bListData.some((l: any) => l.id === prev) ? prev : bListData[0].id);
      }
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (password === 'VOXMORY_STUDIO_2026') {
      setIsAuthorized(true);
      setAuthError(false);
      fetchDashboardData();
    } else {
      setAuthError(true);
    }
  };

  const handleCreateBroadcastList = async (e: FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const response = await fetch('/api/broadcast/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName,
          description: newListDesc,
          contacts: []
        })
      });

      if (response.ok) {
        const created = await response.json();
        setBroadcastLists(prev => [created, ...prev]);
        setNewListName('');
        setNewListDesc('');
        setSelectedListId(created.id);
      }
    } catch (err) {
      console.error('Error creating list', err);
    }
  };

  const handleAddContact = async (e: FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactWhatsApp.trim() || !selectedListId) return;

    const targetList = broadcastLists.find(l => l.id === selectedListId);
    if (!targetList) return;

    const newContact: BroadcastContact = {
      id: `contact_${Date.now()}`,
      name: newContactName,
      whatsApp: newContactWhatsApp,
      category: newContactCategory,
      addedAt: new Date().toISOString()
    };

    const updatedContacts = [...targetList.contacts, newContact];

    try {
      const response = await fetch(`/api/broadcast/lists/${selectedListId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: updatedContacts })
      });

      if (response.ok) {
        const updatedList = await response.json();
        setBroadcastLists(prev => prev.map(l => l.id === selectedListId ? updatedList : l));
        setNewContactName('');
        setNewContactWhatsApp('');
      }
    } catch (err) {
      console.error('Error adding contact', err);
    }
  };

  const handleDeleteContact = async (listId: string, contactId: string) => {
    const targetList = broadcastLists.find(l => l.id === listId);
    if (!targetList) return;

    const updatedContacts = targetList.contacts.filter(c => c.id !== contactId);

    try {
      const response = await fetch(`/api/broadcast/lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: updatedContacts })
      });

      if (response.ok) {
        const updatedList = await response.json();
        setBroadcastLists(prev => prev.map(l => l.id === listId ? updatedList : l));
      }
    } catch (err) {
      console.error('Error deleting contact', err);
    }
  };

  // WhatsApp Testing State & Handler
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestWhatsApp = async () => {
    setTestStatus('loading');
    setTestError(null);
    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        let errMsg = `Erreur serveur (Status ${response.status})`;
        if (contentType.includes('application/json')) {
          try {
            const data = await response.json();
            errMsg = data.error || errMsg;
          } catch (e) {}
        } else {
          try {
            const txt = await response.text();
            if (txt.includes('ADMIN_WHATSAPP_NUMBER') || txt.includes('OpenWA')) {
              errMsg = "Veuillez configurer ADMIN_WHATSAPP_NUMBER et OpenWA sur le serveur.";
            } else {
              errMsg = "Le serveur a retourné une erreur (possible problème de configuration OpenWA).";
            }
          } catch (e) {}
        }
        setTestStatus('error');
        setTestError(errMsg);
        return;
      }

      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setTestStatus('success');
        } else {
          setTestStatus('error');
          setTestError(data.error || "Une erreur s'est produite lors du test.");
        }
      } else {
        setTestStatus('error');
        setTestError("Réponse serveur invalide (pas de format JSON).");
      }
    } catch (err: any) {
      console.error("Test WhatsApp error:", err);
      setTestStatus('error');
      setTestError("Erreur de connexion réseau ou serveur injoignable.");
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      const response = await fetch(`/api/broadcast/lists/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setBroadcastLists(prev => prev.filter(l => l.id !== id));
        if (selectedListId === id) {
          const nextList = broadcastLists.find(l => l.id !== id);
          setSelectedListId(nextList ? nextList.id : '');
        }
        if (campaignTargetList === id) {
          const nextList = broadcastLists.find(l => l.id !== id);
          setCampaignTargetList(nextList ? nextList.id : '');
        }
      }
    } catch (err) {
      console.error('Error deleting list', err);
    }
  };

  const handleRunCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim() || !campaignTemplate.trim() || !campaignTargetList) return;

    const targetList = broadcastLists.find(l => l.id === campaignTargetList);
    if (!targetList || targetList.contacts.length === 0) {
      alert('Veuillez sélectionner une liste de diffusion avec au moins un contact.');
      return;
    }

    setIsBroadcasting(true);
    setBroadcastProgress(0);
    setBroadcastLogs([]);

    const total = targetList.contacts.length;
    const campaignLogs: any[] = [];

    for (let i = 0; i < total; i++) {
      const contact = targetList.contacts[i];
      // Build real customized message
      const messageText = campaignTemplate.replace(/{name}/g, contact.name);
      
      // Clean phone number (keep only digits and optional leading plus)
      const cleanPhone = contact.whatsApp.replace(/[^0-9+]/g, '');
      const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(messageText)}`;

      let sendStatus: 'Succès' | 'Échoué' = 'Succès';
      try {
        const sendResponse = await fetch('/api/broadcast/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            whatsApp: contact.whatsApp,
            text: messageText
          })
        });

        if (!sendResponse.ok) {
          sendStatus = 'Échoué';
        }
      } catch (err) {
        console.error('Error sending campaign message to', contact.name, err);
        sendStatus = 'Échoué';
      }

      const log = {
        contactName: contact.name,
        whatsApp: contact.whatsApp,
        status: sendStatus,
        time: new Date().toISOString(),
        messageText,
        waUrl
      };

      campaignLogs.push(log);
      setBroadcastLogs(prev => [...prev, log]);
      setBroadcastProgress(Math.round(((i + 1) / total) * 100));
    }

    try {
      const response = await fetch('/api/broadcast/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: campaignTitle,
          messageTemplate: campaignTemplate,
          targetListId: campaignTargetList,
          targetListName: targetList.name,
          status: 'Envoyé',
          sentCount: campaignLogs.length,
          totalCount: total,
          logs: campaignLogs
        })
      });

      if (response.ok) {
        const createdCampaign = await response.json();
        setBroadcastCampaigns(prev => [createdCampaign, ...prev]);
        setCompletedCampaign(createdCampaign);
        setCampaignTitle('');
        setCampaignTemplate('');
      }
    } catch (err) {
      console.error('Error saving campaign', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  useEffect(() => {
    let intervalId: any;
    if (isAuthorized) {
      fetchDashboardData();
      
      // Automatic background database synchronization polling every 8 seconds
      intervalId = setInterval(() => {
        fetchDashboardData(false);
      }, 8000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthorized]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setStatusInput(order.status);
    setNotesInput(order.adminNotes || '');
    setFinalAudioInput(order.finalAudioUrl || '');
    setFinalPhotoInput(order.coverImageUrl || '');
    setAiOutput('');
    setAiActivePrompt(null);
  };

  const handleUploadFinalAudio = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrder) return;

    // Formats audio acceptés uniquement : MP3, WAV
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (extension !== '.mp3' && extension !== '.wav') {
      setUploadFinalAudioError('Formats audio acceptés uniquement : MP3, WAV.');
      return;
    }
    setUploadFinalAudioError('');
    setIsUploadingFinalAudio(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              base64Data: base64
            })
          });

          if (!uploadRes.ok) {
            throw new Error('Échec du téléversement sur le serveur.');
          }

          const uploadData = await uploadRes.json();
          const uploadedUrl = uploadData.url;

          // Update local input immediately
          setFinalAudioInput(uploadedUrl);
          
          // Automatically update the order in the database with the new URL
          const updatedOrder = {
            ...selectedOrder,
            finalAudioUrl: uploadedUrl
          };

          const updateRes = await fetch(`/api/orders/${selectedOrder.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedOrder)
          });

          if (updateRes.ok) {
            setSelectedOrder(updatedOrder);
            alert('Chanson finale téléversée et associée à la commande avec succès !');
            fetchDashboardData(false);
          } else {
            throw new Error('Échec de la mise à jour de la commande.');
          }
        } catch (err: any) {
          console.error(err);
          setUploadFinalAudioError('Erreur lors du téléversement : ' + err.message);
        } finally {
          setIsUploadingFinalAudio(false);
        }
      };
      reader.onerror = () => {
        setUploadFinalAudioError('Erreur de lecture du fichier.');
        setIsUploadingFinalAudio(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setUploadFinalAudioError('Une erreur inattendue est survenue.');
      setIsUploadingFinalAudio(false);
    }
  };

  // Update order status/notes/files
  const handleUpdateOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const updatedData = {
        status: statusInput,
        adminNotes: notesInput,
        finalAudioUrl: finalAudioInput,
        coverImageUrl: finalPhotoInput
      };

      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        alert('Commande mise à jour avec succès dans le studio !');
        fetchDashboardData();
        // Refresh selected
        setSelectedOrder(prev => prev ? { ...prev, ...updatedData } : null);
      }
    } catch (err) {
      console.error('Error updating order', err);
    }
  };

  // Generate private memory page trigger
  const handleGenerateMemoryPage = async () => {
    if (!selectedOrder) return;
    if (selectedOrder.status !== 'delivered' && statusInput !== 'delivered') {
      alert("Veuillez d'abord changer le statut de la commande à 'Chanson livrée' !");
      return;
    }

    try {
      const response = await fetch('/api/memory-pages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id })
      });
      const data = await response.json();
      if (response.ok && data.slug) {
        alert(`Page Souvenir privée générée avec succès !\nSlug : ${data.slug}`);
        setSelectedOrder(prev => prev ? { ...prev, memoryPageId: data.slug } : null);
        fetchDashboardData();
      } else {
        alert(`Erreur: ${data.error || "Impossible de générer la page"}`);
      }
    } catch (err) {
      console.error('Error generating memory page', err);
    }
  };

  // Call AI Admin Tools
  const handleCallAiTool = async (endpoint: string, promptName: string) => {
    if (!selectedOrder) return;

    setAiLoading(true);
    setAiActivePrompt(promptName);
    setAiOutput('');

    let targetUrl = '';
    let payload: any = {};

    switch (endpoint) {
      case 'transcribe':
        targetUrl = '/api/admin/ai/transcribe';
        payload = { orderId: selectedOrder.id, audioFilename: selectedOrder.uploadedAudioFilename };
        break;
      case 'summarize':
        targetUrl = '/api/admin/ai/summarize';
        payload = { storyText: selectedOrder.storyText };
        break;
      case 'brief':
        targetUrl = '/api/admin/ai/generate-brief';
        payload = { storyText: selectedOrder.storyText, mood: selectedOrder.mood, musicStyle: selectedOrder.musicStyle };
        break;
      case 'lyrics':
        targetUrl = '/api/admin/ai/generate-lyrics';
        payload = {
          storyText: selectedOrder.storyText,
          mood: selectedOrder.mood,
          musicStyle: selectedOrder.musicStyle,
          recipientName: selectedOrder.recipientName,
          customerName: selectedOrder.customerName,
          importantWords: selectedOrder.importantWords,
          avoidWords: selectedOrder.avoidWords
        };
        break;
      case 'suno':
        targetUrl = '/api/admin/ai/generate-suno-prompt';
        payload = { musicStyle: selectedOrder.musicStyle, mood: selectedOrder.mood };
        break;
      case 'cover':
        targetUrl = '/api/admin/ai/generate-cover-prompt';
        payload = { recipientName: selectedOrder.recipientName, occasion: selectedOrder.occasion, mood: selectedOrder.mood };
        break;
      case 'video':
        targetUrl = '/api/admin/ai/generate-video-prompt';
        payload = { occasion: selectedOrder.occasion, mood: selectedOrder.mood };
        break;
      case 'delivery-msg':
        targetUrl = '/api/admin/ai/generate-whatsapp';
        payload = {
          customerName: selectedOrder.customerName,
          recipientName: selectedOrder.recipientName,
          orderId: selectedOrder.id,
          memoryPageUrl: `https://voxmory.com/#memory/${selectedOrder.id}`
        };
        break;
      case 'testimonial-msg':
        targetUrl = '/api/admin/ai/generate-testimonial';
        payload = { customerName: selectedOrder.customerName, recipientName: selectedOrder.recipientName };
        break;
      case 'followup-msg':
        targetUrl = '/api/admin/ai/generate-followup';
        payload = {
          customerName: selectedOrder.customerName,
          eventName: selectedOrder.occasion,
          relationship: selectedOrder.recipientRelationship,
          eventDate: selectedOrder.eventDate
        };
        break;
      default:
        setAiOutput("Outil inconnu.");
        setAiLoading(false);
        return;
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setAiOutput(data.text || data.result || 'Désolé, aucune réponse générée.');
    } catch (err) {
      console.error('Error running AI tool', err);
      setAiOutput('Désolé, une erreur s’est produite lors de l’appel de l’assistant IA.');
    } finally {
      setAiLoading(false);
    }
  };

  // Review Approval
  const handleApproveReview = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}/approve`, { method: 'POST' });
      if (response.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error approving review', err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error deleting review', err);
    }
  };

  // Event Reminder Form Submit
  const handleCreateReminder = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder)
      });
      if (response.ok) {
        alert('Rappel d’événement programmé !');
        setNewReminder({
          customerName: '',
          customerWhatsApp: '',
          occasion: 'Anniversaire',
          reminderDate: '',
          notes: ''
        });
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error creating reminder', err);
    }
  };

  // Gallery Song Handlers
  const handleCreateGallerySong = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSongTitle || !newSongAudioUrl) {
      alert('Veuillez fournir au moins un titre et une URL pour le fichier audio.');
      return;
    }

    try {
      const payload = {
        title: newSongTitle,
        occasion: newSongOccasion,
        style: newSongStyle,
        language: newSongLanguage,
        mood: newSongMood,
        description: newSongDescription,
        audioUrl: newSongAudioUrl,
        coverUrl: newSongCoverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
        clientReaction: newSongClientReaction,
        visibility: newSongVisibility,
        clientFirstName: newSongClientFirstName,
        startTime: newSongStartTime ? parseFloat(newSongStartTime) : undefined,
        endTime: newSongEndTime ? parseFloat(newSongEndTime) : undefined,
        memorySlug: newSongMemorySlug || undefined
      };

      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Chanson ajoutée à la galerie avec succès !');
        // Reset form
        setNewSongTitle('');
        setNewSongDescription('');
        setNewSongAudioUrl('');
        setNewSongCoverUrl('');
        setNewSongClientReaction('');
        setNewSongClientFirstName('');
        setNewSongStartTime('');
        setNewSongEndTime('');
        setNewSongMemorySlug('');
        // Reload list
        fetchDashboardData();
      } else {
        const errData = await response.json();
        alert(`Erreur : ${errData.error || 'Impossible d’ajouter la chanson.'}`);
      }
    } catch (err) {
      console.error('Error creating gallery song', err);
      alert('Une erreur est survenue lors de l’ajout.');
    }
  };

  const handleDeleteGallerySong = async (id: string) => {
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Chanson retirée de la galerie !');
        fetchDashboardData();
      } else {
        alert('Erreur lors de la suppression de la chanson.');
      }
    } catch (err) {
      console.error('Error deleting gallery song', err);
      alert('Une erreur est survenue lors de la suppression.');
    }
  };

  // ------------------------------------
  // UNATHORIZED / LOGIN SCREEN
  // ------------------------------------
  if (!isAuthorized) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[#040206] text-white p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-[#0e0e12] border border-yellow-500/10 p-8 rounded-3xl space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-yellow-400/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto border border-yellow-400/20">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-sans font-extrabold text-2xl text-white">Espace Studio VOXMORY</h2>
            <p className="text-xs text-gray-500">Accès restreint aux ingénieurs et compositeurs.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Mot de Passe Studio *</label>
            <input
              type="password"
              required
              placeholder="Saisissez le code secret..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:outline-none font-mono text-center tracking-widest text-sm"
            />
            {authError && (
              <span className="block text-[10px] text-red-500 font-semibold text-center mt-1">Code secret incorrect ! Réessayez.</span>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-sans font-bold text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all cursor-pointer"
          >
            Se Connecter
          </button>
          
          <div className="text-center">
            <span className="text-[10px] text-gray-500 font-mono">VOXMORY Production Server v2.6</span>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 bg-[#040206] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Dashboard Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="font-sans font-extrabold text-3xl text-white flex items-center gap-2">
              <Sliders className="w-8 h-8 text-yellow-400" />
              <span>Studio Master Console</span>
            </h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Tableau de bord de gestion artistique &amp; IA</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* ------------------------------------
            METRICS COUNTERS ROW
            ------------------------------------ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#0e0e12] border border-white/5 p-5 rounded-2xl">
            <span className="block text-[10px] uppercase font-mono text-gray-500">Commandes Totales</span>
            <span className="block font-sans font-extrabold text-3xl text-yellow-400 mt-1">{stats.totalOrders}</span>
          </div>

          <div className="bg-[#0e0e12] border border-white/5 p-5 rounded-2xl">
            <span className="block text-[10px] uppercase font-mono text-gray-500">Chansons Livrées</span>
            <span className="block font-sans font-extrabold text-3xl text-green-400 mt-1">{stats.delivered}</span>
          </div>

          <div className="bg-[#0e0e12] border border-white/5 p-5 rounded-2xl">
            <span className="block text-[10px] uppercase font-mono text-gray-500">En Attente d'Acompte</span>
            <span className="block font-sans font-extrabold text-3xl text-pink-400 mt-1">{stats.pendingPayment}</span>
          </div>

          <div className="bg-[#0e0e12] border border-white/5 p-5 rounded-2xl">
            <span className="block text-[10px] uppercase font-mono text-gray-500">Revenus Estimés (Payés)</span>
            <span className="block font-sans font-extrabold text-3xl text-emerald-400 mt-1">
              {stats.totalRevenue !== undefined ? `${stats.totalRevenue} $` : "0 $"}
            </span>
          </div>

        </div>

        {/* ------------------------------------
            TAB NAVIGATION BAR
            ------------------------------------ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 border-b border-white/5 pb-4 w-full">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-3 rounded-xl text-[10px] sm:text-xs font-sans font-bold transition-all flex items-center justify-center lg:justify-start gap-1.5 cursor-pointer w-full lg:w-auto ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg border border-pink-500/20'
                : 'bg-[#0e0e12] text-gray-400 hover:text-white hover:bg-[#13131a] border border-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <span className="truncate">Analyses &amp; Visites</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-3 rounded-xl text-[10px] sm:text-xs font-sans font-bold transition-all flex items-center justify-center lg:justify-start gap-1.5 cursor-pointer w-full lg:w-auto ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg border border-pink-500/20'
                : 'bg-[#0e0e12] text-gray-400 hover:text-white hover:bg-[#13131a] border border-white/5'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">Diffusions WA ({broadcastLists.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('orders');
              setHasNewOrderIndicator(false);
            }}
            className={`relative px-3 py-3 rounded-xl text-[10px] sm:text-xs font-sans font-bold transition-all flex items-center justify-center lg:justify-start gap-1.5 cursor-pointer w-full lg:w-auto ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg border border-pink-500/20'
                : 'bg-[#0e0e12] text-gray-400 hover:text-white hover:bg-[#13131a] border border-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            <span className="truncate">Commandes &amp; IA ({orders.length})</span>
            {hasNewOrderIndicator && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-3 py-3 rounded-xl text-[10px] sm:text-xs font-sans font-bold transition-all flex items-center justify-center lg:justify-start gap-1.5 cursor-pointer w-full lg:w-auto ${
              activeTab === 'gallery'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg border border-pink-500/20'
                : 'bg-[#0e0e12] text-gray-400 hover:text-white hover:bg-[#13131a] border border-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
            <span className="truncate">Galerie ({gallerySongs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3 py-3 rounded-xl text-[10px] sm:text-xs font-sans font-bold transition-all flex items-center justify-center lg:justify-start gap-1.5 cursor-pointer w-full lg:w-auto ${
              activeTab === 'reviews'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg border border-pink-500/20'
                : 'bg-[#0e0e12] text-gray-400 hover:text-white hover:bg-[#13131a] border border-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="truncate">Avis Clients ({reviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3 py-3 rounded-xl text-[10px] sm:text-xs font-sans font-bold transition-all flex items-center justify-center lg:justify-start gap-1.5 cursor-pointer w-full lg:w-auto ${
              activeTab === 'reminders'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg border border-pink-500/20'
                : 'bg-[#0e0e12] text-gray-400 hover:text-white hover:bg-[#13131a] border border-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="truncate">Rappels ({reminders.length})</span>
          </button>
        </div>

        {/* ------------------------------------
            PRIMARY SPLIT WORKSPACE:
            LEFT: Order Queue | RIGHT: Workspace / AI Assist
            ------------------------------------ */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: ORDERS LIST */}
          <div className="lg:col-span-5 bg-[#0e0e12] border border-white/5 p-6 rounded-3xl space-y-4">
            <h3 className="font-sans font-extrabold text-lg text-white border-b border-white/5 pb-3">
              File des Commandes ({orders.length})
            </h3>

            {hasNewOrderIndicator && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-2xl flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping flex-shrink-0" />
                  <span className="text-xs text-yellow-300 font-sans font-bold">Nouvelle commande reçue en temps réel !</span>
                </div>
                <button
                  onClick={() => setHasNewOrderIndicator(false)}
                  className="px-2.5 py-1 text-[10px] text-yellow-400 hover:text-white rounded-lg hover:bg-white/5 transition-all font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => handleSelectOrder(o)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${
                    selectedOrder?.id === o.id
                      ? 'border-yellow-400 bg-purple-950/20'
                      : 'border-white/5 bg-black hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-yellow-400">{o.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      o.status === 'delivered' 
                        ? 'bg-green-950/50 text-green-400' 
                        : o.status === 'pending_payment' 
                          ? 'bg-red-950/50 text-pink-400' 
                          : 'bg-yellow-950/50 text-yellow-400'
                    }`}>
                      {o.status}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-white">{o.customerName}</h4>
                    <p className="text-[11px] text-gray-400">Destinataire : <strong className="text-white">{o.recipientName}</strong> ({o.occasion})</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span>Date d'événement : {o.eventDate || 'N/A'}</span>
                    <span className="text-pink-400">Urg. {o.urgency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: WORKSPACE FOR SELECTED ORDER */}
          <div className="lg:col-span-7 space-y-6">
            {selectedOrder ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* Active Workspace Header Card */}
                <div className="bg-[#0e0e12] border border-yellow-500/10 p-6 rounded-3xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-gray-500">Espace de production actif</span>
                      <h3 className="font-sans font-extrabold text-xl text-white font-mono">{selectedOrder.id}</h3>
                    </div>
                    <span className="text-xs text-pink-400 font-bold">{selectedOrder.musicStyle}</span>
                  </div>

                  {/* Backstory detailing */}
                  <div className="space-y-2">
                    <span className="block text-[10px] uppercase font-mono text-gray-500 font-bold">Récit et Histoire du client :</span>
                    <div className="bg-black p-4 rounded-xl border border-white/5 max-h-40 overflow-y-auto text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedOrder.storyText || (selectedOrder.uploadedAudioUrl ? "Le client a raconté son histoire sous forme d'enregistrement audio. Écoutez la note vocale ci-dessous." : "Aucun récit écrit ou audio fourni (Traitement WhatsApp ou par téléphone).")}
                    </div>
                  </div>

                  {/* Audio de l'histoire du client */}
                  {selectedOrder.uploadedAudioUrl && (
                    <div className="space-y-2 bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono text-yellow-400 font-bold flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                          <span>Enregistrement Audio du Client :</span>
                        </span>
                        <a
                          href={selectedOrder.uploadedAudioUrl}
                          download={selectedOrder.uploadedAudioFilename || `voxmory_audio_${selectedOrder.id}.webm`}
                          className="text-[10px] bg-yellow-400/10 hover:bg-yellow-400/25 text-yellow-300 px-3 py-1 rounded-full border border-yellow-400/20 hover:border-yellow-400/40 transition-all font-mono font-bold cursor-pointer"
                        >
                          Télécharger le fichier
                        </a>
                      </div>
                      <div className="pt-1.5">
                        <audio
                          src={selectedOrder.uploadedAudioUrl}
                          controls
                          className="w-full h-10 rounded-xl bg-black/60 border border-white/5 px-1 focus:outline-none"
                        />
                        <span className="block text-[9px] text-gray-500 font-mono mt-1 text-right">
                          Fichier original : {selectedOrder.uploadedAudioFilename || "Enregistrement vocal.webm"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Photo illustratrice du destinataire */}
                  {selectedOrder.uploadedPhotoUrl && (
                    <div className="space-y-2">
                      <span className="block text-[10px] uppercase font-mono text-gray-500 font-bold">Photo de l'illustré (Visage) :</span>
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-yellow-500/20">
                        <img
                          src={selectedOrder.uploadedPhotoUrl}
                          alt="Recipient Face"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Metadata labels row */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Mots importants :</span>
                      <span className="block font-semibold text-white mt-0.5">{selectedOrder.importantWords || 'Aucun'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Choses à éviter :</span>
                      <span className="block font-semibold text-red-400 mt-0.5">{selectedOrder.avoidWords || 'Aucune'}</span>
                    </div>
                  </div>

                  {/* Visualizer & Share Link of Generated Memory Page */}
                  {selectedOrder.memoryPageId && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl space-y-3.5 animate-fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <Heart className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Page Souvenir active</h4>
                            <p className="text-[10px] text-emerald-400 font-mono">ID/Slug : {selectedOrder.memoryPageId}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 self-start sm:self-auto w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              const shareLink = `${window.location.origin}/#memory/${selectedOrder.memoryPageId}`;
                              navigator.clipboard.writeText(shareLink);
                              alert(`Lien copié dans le presse-papiers !\n\n${shareLink}`);
                            }}
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/25 text-emerald-300 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider cursor-pointer transition-all"
                          >
                            Copier le lien
                          </button>
                          <a
                            href={`#memory/${selectedOrder.memoryPageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>Ouvrir</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[10px] uppercase font-mono text-gray-400 font-bold">Lien complet à envoyer au client :</span>
                        <div className="bg-black/60 p-3 rounded-xl border border-white/5 font-mono text-[11px] text-gray-300 break-all select-all">
                          {`${window.location.origin}/#memory/${selectedOrder.memoryPageId}`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Update Order status/notes Form */}
                  <form onSubmit={handleUpdateOrder} className="space-y-4 pt-4 border-t border-white/5">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Statut de la production</label>
                        <select
                          value={statusInput}
                          onChange={(e: any) => setStatusInput(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        >
                          <option value="Nouvelle">Nouvelle</option>
                          <option value="En cours">En cours</option>
                          <option value="Terminée">Terminée</option>
                          <option value="Livrée">Livrée</option>
                          <option value="Annulée">Annulée</option>
                          <option value="received">Commande reçue</option>
                          <option value="pending_payment">En attente d'acompte</option>
                          <option value="writing_lyrics">Écriture des paroles</option>
                          <option value="lyrics_validation">Validation des paroles</option>
                          <option value="composing">Composition mélodique</option>
                          <option value="recording">Enregistrement studio</option>
                          <option value="mixing">Mixage &amp; Mastering</option>
                          <option value="delivered">Chanson livrée</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Notes de l'équipe (Interne)</label>
                        <input
                          type="text"
                          placeholder="Ex: Acompte validé, Rumba lente..."
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex items-center justify-between gap-1">
                          <span className="flex items-center gap-1">
                            <Music className="w-3.5 h-3.5 text-yellow-400" />
                            <span>Fichier Audio Final MP3 / WAV</span>
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono font-normal">Saisir URL ou téléverser</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ex: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                            value={finalAudioInput}
                            onChange={(e) => setFinalAudioInput(e.target.value)}
                            className="flex-grow bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                          />
                          <label className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2.5 rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-all">
                            {isUploadingFinalAudio ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>{isUploadingFinalAudio ? 'Envoi...' : 'Téléverser'}</span>
                            <input
                              type="file"
                              accept=".mp3,.wav"
                              onChange={handleUploadFinalAudio}
                              disabled={isUploadingFinalAudio}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {uploadFinalAudioError && (
                          <span className="block text-[10px] text-red-500 font-semibold mt-1">{uploadFinalAudioError}</span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                          <span>Photo de couverture (URL)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4"
                          value={finalPhotoInput}
                          onChange={(e) => setFinalPhotoInput(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>

                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-grow py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                      >
                        Enregistrer les modifications
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateMemoryPage}
                        className="py-3 px-5 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-[1.02] transition-all cursor-pointer"
                      >
                        Générer la Page Souvenir
                      </button>
                    </div>

                  </form>
                </div>

                {/* AI ASSIST PANEL: THE 10 AI FUNCTIONS */}
                <div className="bg-[#0e0e12] border border-purple-500/10 p-6 rounded-3xl space-y-6">
                  
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
                    <div>
                      <h3 className="font-sans font-extrabold text-base text-white">Assistant IA Studio (Gemini)</h3>
                      <p className="text-[10px] text-gray-500">Générez des briefs, des paroles poétiques ou des messages WhatsApp en un clic.</p>
                    </div>
                  </div>

                  {/* Buttons Grid for 10 functions */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    
                    <button
                      onClick={() => handleCallAiTool('transcribe', 'Transcription Audio')}
                      className="p-3 bg-black/60 hover:bg-purple-950/20 text-xs text-left rounded-xl border border-white/5 hover:border-purple-500/30 transition-all font-sans font-semibold cursor-pointer"
                    >
                      🗣️ Transcrire audio
                    </button>

                    <button
                      onClick={() => handleCallAiTool('summarize', 'Résumé Histoire')}
                      className="p-3 bg-black/60 hover:bg-purple-950/20 text-xs text-left rounded-xl border border-white/5 hover:border-purple-500/30 transition-all font-sans font-semibold cursor-pointer"
                    >
                      📝 Résumer récit
                    </button>

                    <button
                      onClick={() => handleCallAiTool('brief', 'Générer Brief Compositeur')}
                      className="p-3 bg-black/60 hover:bg-purple-950/20 text-xs text-left rounded-xl border border-white/5 hover:border-purple-500/30 transition-all font-sans font-semibold cursor-pointer"
                    >
                      🎼 Brief artistique
                    </button>

                    <button
                      onClick={() => handleCallAiTool('lyrics', 'Générer Paroles Chanson')}
                      className="p-3 bg-black/60 hover:bg-purple-950/20 text-xs text-left rounded-xl border border-white/5 hover:border-purple-500/30 transition-all font-sans font-semibold cursor-pointer"
                    >
                      🎤 Rédiger les paroles
                    </button>

                    <button
                      onClick={() => handleCallAiTool('suno', 'Générer Suno AI Prompt')}
                      className="p-3 bg-black/60 hover:bg-purple-950/20 text-xs text-left rounded-xl border border-white/5 hover:border-purple-500/30 transition-all font-sans font-semibold cursor-pointer"
                    >
                      🤖 Prompt Suno AI
                    </button>

                    <button
                      onClick={() => handleCallAiTool('cover', 'Générer Cover Photo Prompt')}
                      className="p-3 bg-black/60 hover:bg-purple-950/20 text-xs text-left rounded-xl border border-white/5 hover:border-purple-500/30 transition-all font-sans font-semibold cursor-pointer"
                    >
                      🎨 Prompt Pochette Midjourney
                    </button>

                    <button
                      onClick={() => handleCallAiTool('video', 'Générer Video Prompt')}
                      className="p-3 bg-black/60 hover:bg-purple-950/20 text-xs text-left rounded-xl border border-white/5 hover:border-purple-500/30 transition-all font-sans font-semibold cursor-pointer"
                    >
                      🎬 Prompt clip Sora
                    </button>

                    <button
                      onClick={() => handleCallAiTool('delivery-msg', 'WhatsApp Livraison Chaleureuse')}
                      className="p-3 bg-black/60 hover:bg-purple-950/20 text-xs text-left rounded-xl border border-white/5 hover:border-purple-500/30 transition-all font-sans font-semibold cursor-pointer"
                    >
                      📱 Msg de Livraison WhatsApp
                    </button>

                    <button
                      onClick={() => handleCallAiTool('testimonial-msg', 'WhatsApp Demande d\'Avis')}
                      className="p-3 bg-black/60 hover:bg-purple-950/20 text-xs text-left rounded-xl border border-white/5 hover:border-purple-500/30 transition-all font-sans font-semibold cursor-pointer"
                    >
                      ⭐ Msg Demande d'Avis
                    </button>

                    <button
                      onClick={() => handleCallAiTool('followup-msg', 'WhatsApp Relance Anniversaire')}
                      className="p-3 bg-black/60 hover:bg-purple-950/20 text-xs text-left rounded-xl border border-white/5 hover:border-purple-500/30 transition-all font-sans font-semibold cursor-pointer"
                    >
                      📅 Relance Annuelle
                    </button>

                  </div>

                  {/* Output display for Gemini results */}
                  {(aiLoading || aiOutput) && (
                    <div className="bg-black p-5 rounded-2xl border border-purple-500/10 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[10px] uppercase font-mono text-pink-400 font-bold">{aiActivePrompt || 'Assistant Gemini'}</span>
                        {aiLoading && <RefreshCw className="w-3.5 h-3.5 text-pink-500 animate-spin" />}
                      </div>
                      
                      <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                        {aiLoading ? 'Génération de l’émotion en cours par Gemini-3.5-Flash...' : aiOutput}
                      </div>

                      {aiOutput && !aiLoading && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(aiOutput);
                              alert('Texte copié dans le presse-papiers !');
                            }}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-gray-400 hover:text-white rounded font-bold transition-all cursor-pointer"
                          >
                            Copier le texte
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="bg-[#0e0e12] border border-white/5 p-12 rounded-3xl text-center space-y-3">
                <Sliders className="w-10 h-10 text-gray-600 mx-auto" />
                <h4 className="font-sans font-bold text-white text-base">Aucune commande sélectionnée</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">Veuillez cliquer sur une fiche client dans la file d'attente à gauche pour charger l'espace de production.</p>
              </div>
            )}
          </div>

        </div>
      )}

        {/* ------------------------------------
            MODÉRATION DES AVIS TAB
            ------------------------------------ */}
        {activeTab === 'reviews' && (
          <div className="max-w-4xl mx-auto bg-[#0e0e12] border border-white/5 p-8 rounded-3xl space-y-6">
            <h3 className="font-sans font-extrabold text-xl text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <span>Modération des Avis Clients ({reviews.length})</span>
            </h3>
            
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-black/60 p-4 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{rev.clientName}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{rev.date}</span>
                  </div>
                  <p className="text-xs text-gray-400 italic">"{rev.comment}"</p>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-yellow-400">{rev.rating}/5 étoiles • {rev.occasion}</span>
                    
                    <div className="flex gap-2">
                      {rev.approved === false && (
                        <button
                          onClick={() => handleApproveReview(rev.id)}
                          className="px-2.5 py-1 bg-green-950/40 text-green-400 hover:bg-green-900 border border-green-500/10 rounded font-bold cursor-pointer transition-all"
                        >
                          Approuver
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1 text-red-500 hover:text-red-400 cursor-pointer"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------
            RAPPELS MARKETING TAB
            ------------------------------------ */}
        {activeTab === 'reminders' && (
          <div className="max-w-4xl mx-auto bg-[#0e0e12] border border-white/5 p-8 rounded-3xl space-y-6">
            <h3 className="font-sans font-extrabold text-xl text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <span>Rappels d'Événements (Marketing Direct)</span>
            </h3>

            {/* Reminder List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {reminders.map((rem) => (
                <div key={rem.id} className="bg-black/60 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs gap-4">
                  <div className="space-y-1">
                    <span className="block font-bold text-white">{rem.customerName} ({rem.occasion})</span>
                    <p className="text-[10px] text-gray-500">Rappel le : <strong className="text-yellow-400">{rem.reminderDate}</strong></p>
                  </div>
                  <a
                    href={`https://wa.me/${rem.customerWhatsApp.replace(/\+/g, '')}?text=Bonjour%20${encodeURIComponent(rem.customerName)}%2C%20le%20Studio%20VOXMORY%20pense%20%C3%A0%20vous%20%C3%A0%20l'approche%20de%20votre%20%C3%A9v%C3%A9nement%20!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-green-600 rounded-lg text-white hover:bg-green-500 transition-all flex items-center justify-center flex-shrink-0"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-white" />
                  </a>
                </div>
              ))}
            </div>

            {/* Reminder Insert Form */}
            <form onSubmit={handleCreateReminder} className="border-t border-white/5 pt-4 space-y-3">
              <span className="block text-[10px] uppercase font-mono text-gray-500 font-bold">Enregistrer un nouvel événement</span>
              
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nom client"
                  value={newReminder.customerName}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
                
                <input
                  type="text"
                  required
                  placeholder="WhatsApp (+243...)"
                  value={newReminder.customerWhatsApp}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, customerWhatsApp: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newReminder.occasion}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, occasion: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Anniversaire">Anniversaire</option>
                  <option value="Mariage">Mariage</option>
                  <option value="Collation">Collation</option>
                  <option value="Naissance">Naissance</option>
                </select>

                <input
                  type="date"
                  required
                  value={newReminder.reminderDate}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, reminderDate: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center"
              >
                Programmer le Rappel
              </button>

            </form>

          </div>
        )}

        {/* ------------------------------------
            TAB VIEW: MARKETING & DIFFUSION (WHATSAPP BUSINESS)
            ------------------------------------ */}
        {activeTab === 'broadcast' && (
          <div className="space-y-8 mt-4 animate-fade-in">
            
            {/* Header / Intro */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-black to-teal-950/30 border border-emerald-500/10 p-6 rounded-3xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <Send className="w-5 h-5" />
                <span className="text-xs uppercase font-mono font-bold tracking-widest">Diffusion de messages de masse WhatsApp</span>
              </div>
              <h3 className="font-sans font-extrabold text-2xl text-white">Marketing Direct WhatsApp Business</h3>
              <p className="text-xs text-gray-400">
                Gérez vos listes de contacts clients et prospects, puis envoyez des campagnes personnalisées automatiques avec des variables de fusion comme <code className="bg-white/10 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-[10px]">{`{name}`}</code>.
              </p>
            </div>

            {/* Test WhatsApp Integration Component */}
            <div className="bg-[#0e0e12] border border-emerald-500/15 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-base text-white flex items-center gap-2">
                  <span className="text-emerald-500">💬</span>
                  Tester l'Intégration WhatsApp
                </h4>
                <p className="text-xs text-gray-400">
                  Envoyez un message de test automatique au numéro d'administration pour valider la connexion avec l'API OpenWA.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {testStatus === 'success' && (
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                    ✅ Test réussi ! Message envoyé.
                  </span>
                )}
                {testStatus === 'error' && (
                  <span className="text-xs text-red-400 font-bold bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20">
                    ❌ Échec : {testError || "Erreur API"}
                  </span>
                )}
                {testStatus === 'loading' && (
                  <span className="text-xs text-yellow-400 font-bold bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20 animate-pulse">
                    ⚡ Envoi du test...
                  </span>
                )}

                <button
                  onClick={handleTestWhatsApp}
                  disabled={testStatus === 'loading'}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {testStatus === 'loading' ? 'Envoi...' : 'Tester WhatsApp'}
                </button>
              </div>
            </div>

            {/* Main Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Lists and Contacts management */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Lists segment switcher */}
                <div className="bg-[#0e0e12] border border-white/5 p-6 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <h4 className="font-sans font-extrabold text-base text-white">Vos listes de diffusion</h4>
                    
                    {/* Add new list inline form */}
                    <form onSubmit={handleCreateBroadcastList} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nouvelle liste..."
                        required
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Créer
                      </button>
                    </form>
                  </div>

                  {/* Horizontal Lists scroll */}
                  <div className="flex gap-2.5 overflow-x-auto pb-2">
                    {broadcastLists.map(l => (
                      <div
                        key={l.id}
                        onClick={() => setSelectedListId(l.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          selectedListId === l.id
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                            : 'bg-black border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>{l.name}</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-white">
                          {l.contacts?.length || 0}
                        </span>
                        {l.id !== 'list_clients_vip' && l.id !== 'list_prospects_mariages' && (
                          confirmDeleteListId === l.id ? (
                            <span className="flex items-center gap-1.5 ml-1 animate-in fade-in duration-100" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteList(l.id);
                                  setConfirmDeleteListId(null);
                                }}
                                className="text-[10px] text-red-400 hover:text-red-300 font-bold bg-red-950/20 px-1 py-0.5 rounded"
                              >
                                Oui
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteListId(null);
                                }}
                                className="text-[10px] text-gray-400 hover:text-gray-300 font-bold bg-white/5 px-1 py-0.5 rounded"
                              >
                                Non
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteListId(l.id);
                              }}
                              className="text-red-400 hover:text-red-300 ml-1 transition-all text-xs font-bold"
                              title="Supprimer la liste"
                            >
                              ×
                            </button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contacts table for selected list */}
                {(() => {
                  const activeList = broadcastLists.find(l => l.id === selectedListId);
                  if (!activeList) return null;

                  return (
                    <div className="bg-[#0e0e12] border border-white/5 p-6 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div>
                          <h4 className="font-sans font-extrabold text-sm text-white">Contacts dans {activeList.name}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">{activeList.description || "Aucune description fournie."}</p>
                        </div>

                        <span className="text-[10px] text-gray-400 uppercase font-mono">Segment dynamique</span>
                      </div>

                      {/* Contacts List table */}
                      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2">
                        {activeList.contacts && activeList.contacts.length > 0 ? (
                          activeList.contacts.map((c: BroadcastContact) => (
                            <div key={c.id} className="flex items-center justify-between bg-black border border-white/5 p-3 rounded-2xl hover:border-emerald-500/30 transition-all group">
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-white">{c.name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                                  <span>{c.whatsApp}</span>
                                  <span>•</span>
                                  <span className="text-emerald-400">{c.category}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteContact(activeList.id, c.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 rounded transition-all cursor-pointer animate-fade-in"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-xs text-gray-500 font-mono">
                            Aucun contact dans cette liste. Ajoutez-en un ci-dessous !
                          </div>
                        )}
                      </div>

                      {/* Add contact to current list form */}
                      <form onSubmit={handleAddContact} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-black/40 border border-white/5 p-4 rounded-2xl">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Nom du contact (ex: Jules)"
                            required
                            value={newContactName}
                            onChange={e => setNewContactName(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="+243..."
                            required
                            value={newContactWhatsApp}
                            onChange={e => setNewContactWhatsApp(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <button
                            type="submit"
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                          >
                            Ajouter
                          </button>
                        </div>
                      </form>

                    </div>
                  );
                })()}

              </div>

              {/* Right Column: Campaign Sender panel */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Campaign Dispatcher */}
                <div className="bg-[#0e0e12] border border-white/5 p-6 rounded-3xl space-y-4">
                  <h4 className="font-sans font-extrabold text-sm text-white border-b border-white/5 pb-3 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>Lancer une nouvelle campagne</span>
                  </h4>

                  <form onSubmit={handleRunCampaign} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase tracking-widest font-mono text-gray-400">Titre de la campagne</label>
                      <input
                        type="text"
                        placeholder="Ex: Offre Rumba de Mariage - Juillet"
                        required
                        value={campaignTitle}
                        onChange={e => setCampaignTitle(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase tracking-widest font-mono text-gray-400">Liste Cible</label>
                        <select
                          value={campaignTargetList}
                          onChange={e => setCampaignTargetList(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          {broadcastLists.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.contacts?.length || 0})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 flex flex-col justify-end">
                        <span className="text-[9px] text-gray-400 italic">La variable <code className="text-emerald-400">{`{name}`}</code> sera automatiquement remplacée.</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase tracking-widest font-mono text-gray-400">Modèle de Message</label>
                      <textarea
                        rows={4}
                        placeholder={`Bonjour {name}, nous avons le plaisir de vous annoncer que...`}
                        required
                        value={campaignTemplate}
                        onChange={e => setCampaignTemplate(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
                      />
                    </div>

                    {!isBroadcasting ? (
                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center hover:opacity-90 shadow-lg shadow-emerald-950/20"
                      >
                        Lancer la Diffusion WhatsApp
                      </button>
                    ) : (
                      <div className="bg-black/80 border border-emerald-500/20 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-emerald-400 animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                            En cours d'envoi...
                          </span>
                          <span>{broadcastProgress}%</span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${broadcastProgress}%` }}></div>
                        </div>

                        {/* Staggered logs with real direct send actions */}
                        <div className="bg-black text-[10px] p-3 rounded-2xl max-h-[180px] overflow-y-auto space-y-2 border border-emerald-500/10">
                          <span className="block text-[9px] uppercase font-mono text-emerald-400 border-b border-white/10 pb-1 mb-1 font-bold tracking-wider">File d'attente d'envoi réel WhatsApp :</span>
                          {broadcastLogs.map((l, idx) => (
                            <div key={idx} className="flex flex-col gap-1 bg-white/5 p-2 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-200">➡️ {l.contactName} ({l.whatsApp})</span>
                                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px] bg-emerald-400/10 px-1.5 py-0.5 rounded-full">Prêt</span>
                              </div>
                              <p className="text-[9px] text-gray-400 italic line-clamp-1">"{l.messageText}"</p>
                              <a
                                href={l.waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-1 mt-1 px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-extrabold text-[9px] uppercase transition-all cursor-pointer"
                              >
                                <Send className="w-2.5 h-2.5" />
                                <span>Envoyer à {l.contactName} via WhatsApp</span>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {/* Campaign History Log */}
                <div className="bg-[#0e0e12] border border-white/5 p-6 rounded-3xl space-y-4">
                  <h4 className="font-sans font-extrabold text-sm text-white border-b border-white/5 pb-3">
                    Historique des campagnes envoyées
                  </h4>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                    {broadcastCampaigns.length > 0 ? (
                      broadcastCampaigns.map(c => {
                        const isExpanded = expandedCampaignId === c.id;
                        return (
                          <div 
                            key={c.id} 
                            onClick={() => setExpandedCampaignId(isExpanded ? null : c.id)}
                            className={`bg-black border p-4 rounded-2xl space-y-2 transition-all cursor-pointer hover:border-emerald-500/20 ${
                              isExpanded ? 'border-emerald-500/40 bg-black/60 shadow-lg' : 'border-white/5'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  {c.title}
                                </p>
                                <p className="text-[9px] text-gray-500 font-mono mt-0.5">Cible : {c.targetListName}</p>
                              </div>
                              <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] text-emerald-400 font-mono font-bold">
                                {c.sentCount}/{c.totalCount} Contacts
                              </span>
                            </div>
                            
                            <p className="text-[10px] text-gray-400 italic bg-white/5 p-2.5 rounded-xl border border-white/5 line-clamp-2">
                              "{c.messageTemplate}"
                            </p>
                            
                            <div className="flex justify-between items-center pt-1 text-[9px] text-emerald-400">
                              <span>{isExpanded ? '▼ Masquer les contacts' : '▲ Cliquer pour gérer / envoyer individuellement'}</span>
                              {c.sentAt && <span className="text-gray-500 font-mono">{new Date(c.sentAt).toLocaleDateString('fr-FR')}</span>}
                            </div>

                            {isExpanded && (
                              <div className="pt-3 mt-2 border-t border-white/5 space-y-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                                <span className="block text-[8px] uppercase tracking-wider font-mono text-emerald-400 font-bold mb-1">Destinataires &amp; Liens directs :</span>
                                {c.logs && c.logs.length > 0 ? (
                                  c.logs.map((l, lIdx) => {
                                    const cleanPhone = l.whatsApp.replace(/[^0-9+]/g, '');
                                    const msg = l.messageText || c.messageTemplate.replace(/{name}/g, l.contactName);
                                    const link = l.waUrl || `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(msg)}`;
                                    
                                    return (
                                      <div key={lIdx} className="bg-white/5 p-2 rounded-xl border border-white/5 space-y-1">
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="font-bold text-gray-300">{l.contactName} ({l.whatsApp})</span>
                                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono">Prêt</span>
                                        </div>
                                        <p className="text-[9px] text-gray-400 italic">"{msg}"</p>
                                        <a
                                          href={link}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center justify-center gap-1 w-full mt-1.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] font-sans font-extrabold uppercase transition-all text-center cursor-pointer"
                                        >
                                          <Send className="w-2.5 h-2.5" />
                                          <span>Envoyer le message réel via WhatsApp</span>
                                        </a>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-[10px] text-gray-500">Aucun log disponible pour cette campagne.</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-gray-500 font-mono">
                        Aucune campagne envoyée pour l'instant.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------
            TAB VIEW: ANALYTICS & VISITS
            ------------------------------------ */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 mt-4 animate-fade-in">
            
            {/* Live Analytics Banner */}
            <div className="bg-gradient-to-r from-purple-950/40 via-black to-pink-950/30 border border-purple-500/10 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-xs uppercase font-mono text-green-400 font-bold tracking-widest">Système Synchrone Actif (Live)</span>
                </div>
                <h3 className="font-sans font-extrabold text-2xl text-white">Performances de VoxMory</h3>
                <p className="text-xs text-gray-400">Suivez l'intérêt de vos visiteurs, l'écoute des morceaux de votre galerie et l'activité de vos commandes en temps réel.</p>
              </div>
              
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
                <div className="text-center px-2">
                  <span className="block text-[9px] uppercase font-mono text-gray-400">Total Visites</span>
                  <span className="block text-xl font-bold font-mono text-white mt-0.5">{stats.visitsCount}</span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="text-center px-2">
                  <span className="block text-[9px] uppercase font-mono text-gray-400">Chansons Écoutées</span>
                  <span className="block text-xl font-bold font-mono text-white mt-0.5">{stats.listensCount}</span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="text-center px-2">
                  <span className="block text-[9px] uppercase font-mono text-gray-400">Taux de Conv.</span>
                  <span className="block text-xl font-bold font-mono text-yellow-400 mt-0.5">
                    {stats.visitsCount ? ((stats.totalOrders / stats.visitsCount) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Graph Panel */}
            <div className="bg-[#0e0e12] border border-white/5 p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h4 className="font-sans font-extrabold text-base text-white">Évolution de l'Audience &amp; Conversion (7 derniers jours)</h4>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span className="text-gray-300">Visites</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                    <span className="text-gray-300">Écoutes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-yellow-500"></span>
                    <span className="text-gray-300">Commandes</span>
                  </div>
                </div>
              </div>

              {/* The SVG Graphic representation */}
              <div className="w-full h-72 relative">
                {stats.dailyStats && stats.dailyStats.length > 0 ? (
                  <svg viewBox="0 0 700 240" className="w-full h-full text-gray-500 overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="listensGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    <line x1="40" y1="20" x2="680" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="40" y1="70" x2="680" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="40" y1="120" x2="680" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="40" y1="170" x2="680" y2="170" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="40" y1="210" x2="680" y2="210" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                    {/* Left Axis Labels (Y-Axis) */}
                    <text x="15" y="25" className="text-[10px] font-mono fill-gray-500" textAnchor="middle">300</text>
                    <text x="15" y="75" className="text-[10px] font-mono fill-gray-500" textAnchor="middle">200</text>
                    <text x="15" y="125" className="text-[10px] font-mono fill-gray-500" textAnchor="middle">100</text>
                    <text x="15" y="175" className="text-[10px] font-mono fill-gray-500" textAnchor="middle">50</text>
                    <text x="15" y="215" className="text-[10px] font-mono fill-gray-500" textAnchor="middle">0</text>

                    {/* Generate graph polygons & lines */}
                    {(() => {
                      const data = stats.dailyStats;
                      const maxVal = 300;
                      const width = 640;
                      const height = 190;
                      
                      const pointsVisits: string[] = [];
                      const pointsListens: string[] = [];

                      data.forEach((day: any, i: number) => {
                        const x = 40 + (i * (width / (data.length - 1)));
                        const yVisits = 210 - (day.visits / maxVal) * height;
                        pointsVisits.push(`${x},${yVisits}`);
                        
                        const yListens = 210 - (day.listens / maxVal) * height;
                        pointsListens.push(`${x},${yListens}`);
                      });

                      const visitsStr = pointsVisits.join(' ');
                      const listensStr = pointsListens.join(' ');

                      const visitsAreaStr = `40,210 ${visitsStr} 680,210`;
                      const listensAreaStr = `40,210 ${listensStr} 680,210`;

                      return (
                        <>
                          <polygon points={visitsAreaStr} fill="url(#visitsGrad)" />
                          <polygon points={listensAreaStr} fill="url(#listensGrad)" />

                          <polyline points={visitsStr} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
                          <polyline points={listensStr} fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />

                          {data.map((day: any, i: number) => {
                            const x = 40 + (i * (width / (data.length - 1)));
                            const barHeight = (day.orders / 15) * 60;
                            return (
                              <g key={`bar-${i}`} className="group/bar">
                                <rect
                                  x={x - 6}
                                  y={210 - barHeight}
                                  width="12"
                                  height={barHeight}
                                  fill="#eab308"
                                  rx="3"
                                  className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                />
                                <circle cx={x} cy={210 - (day.visits / maxVal) * height} r="4" fill="#a855f7" stroke="#0e0e12" strokeWidth="1" />
                                <circle cx={x} cy={210 - (day.listens / maxVal) * height} r="4" fill="#ec4899" stroke="#0e0e12" strokeWidth="1" />
                              </g>
                            );
                          })}

                          {data.map((day: any, i: number) => {
                            const x = 40 + (i * (width / (data.length - 1)));
                            const formattedDate = day.date.slice(-5).replace('-', '/');
                            return (
                              <text key={`label-${i}`} x={x} y="235" className="text-[10px] font-mono fill-gray-400" textAnchor="middle">
                                {formattedDate}
                              </text>
                            );
                          })}
                        </>
                      );
                    })()}

                  </svg>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                    Chargement des données statistiques...
                  </div>
                )}
              </div>
            </div>

            {/* Realtime Live Activity Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Traffic Sources / Regions */}
              <div className="bg-[#0e0e12] border border-white/5 p-6 rounded-3xl space-y-4">
                <h4 className="font-sans font-extrabold text-sm text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Activité Géographique (Visiteurs Actifs)</span>
                </h4>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-300">🇨🇩 Kinshasa, RDC</span>
                    <span className="text-purple-400 font-bold">52% (En hausse)</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-300">🇨🇩 Lubumbashi, RDC</span>
                    <span className="text-purple-400 font-bold">18%</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-300">🇧🇪 Bruxelles, Belgique</span>
                    <span className="text-pink-400 font-bold">14%</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-300">🇫🇷 Paris, France</span>
                    <span className="text-pink-400 font-bold">11%</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-300">🇨🇩 Goma / Bukavu, RDC</span>
                    <span className="text-purple-400 font-bold">5%</span>
                  </div>
                </div>
              </div>

              {/* Real-time Streaming Logs */}
              <div className="bg-[#0e0e12] border border-white/5 p-6 rounded-3xl space-y-4">
                <h4 className="font-sans font-extrabold text-sm text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-pink-400" />
                  <span>Flux de Navigation Direct</span>
                </h4>
                <div className="space-y-3 font-mono text-[11px] max-h-[220px] overflow-y-auto pr-2">
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="text-[9px] text-gray-500">A l'instant</span>
                    <span>•</span>
                    <span className="text-white">Nouvel utilisateur de Kinshasa écoute "Rumba Elongi"</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400">
                    <span className="text-[9px] text-gray-500">Il y a 1 min</span>
                    <span>•</span>
                    <span className="text-gray-300">Un visiteur de Paris consulte la page "Tarifs"</span>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-400">
                    <span className="text-[9px] text-gray-500">Il y a 3 min</span>
                    <span>•</span>
                    <span className="text-yellow-400 font-bold">Commande initiée pour un cadeau de Mariage (+24381...)</span>
                  </div>
                  <div className="flex items-center gap-2 text-pink-400">
                    <span className="text-[9px] text-gray-500">Il y a 6 min</span>
                    <span>•</span>
                    <span className="text-gray-300">Écoute terminée de "Rumba d'amour" par un client de Bruxelles</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-[9px] text-gray-500">Il y a 10 min</span>
                    <span>•</span>
                    <span className="text-gray-400">Consultation des avis clients sur la page d'accueil</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------
            TERTIARY ROW: GESTION DE LA GALERIE MUSIQUE
            ------------------------------------ */}
        {activeTab === 'gallery' && (
          <div className="bg-[#0e0e12] border border-white/5 p-8 rounded-3xl space-y-6 mt-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2.5 bg-yellow-400/10 text-yellow-400 rounded-xl">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-sans font-extrabold text-xl text-white">
                Gestion de la Galerie Musique
              </h3>
              <p className="text-xs text-gray-400">
                Ajoutez et supprimez les chansons présentées dans la galerie publique. Les visiteurs peuvent y écouter vos créations directement sans téléchargement.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* ADD SONG FORM (LEFT) */}
            <div className="lg:col-span-5 space-y-4">
              <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-yellow-400 border-b border-white/5 pb-2">
                Ajouter une Nouvelle Chanson
              </h4>

              <form onSubmit={handleCreateGallerySong} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Titre de la chanson *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Reine Georgette"
                      value={newSongTitle}
                      onChange={(e) => setNewSongTitle(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Occasion *</label>
                    <select
                      value={newSongOccasion}
                      onChange={(e) => setNewSongOccasion(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Anniversaire">Anniversaire</option>
                      <option value="Mariage">Mariage</option>
                      <option value="Hommage / Deuil">Hommage / Deuil</option>
                      <option value="Déclaration d'amour">Déclaration d'amour</option>
                      <option value="Collation / Diplôme">Collation / Diplôme</option>
                      <option value="Naissance">Naissance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Rythme / Style *</label>
                    <select
                      value={newSongStyle}
                      onChange={(e) => setNewSongStyle(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Rumba congolaise">Rumba congolaise</option>
                      <option value="Afrobeat">Afrobeat</option>
                      <option value="Acoustique émotionnel">Acoustique émotionnel</option>
                      <option value="Gospel">Gospel</option>
                      <option value="Zouk">Zouk</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Langue</label>
                    <input
                      type="text"
                      placeholder="Ex: Lingala & Français"
                      value={newSongLanguage}
                      onChange={(e) => setNewSongLanguage(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Ambiance / Mood</label>
                    <input
                      type="text"
                      placeholder="Ex: Chaleureux & Festif"
                      value={newSongMood}
                      onChange={(e) => setNewSongMood(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase font-mono block">Fichier Audio (MP3/WAV/etc.) *</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        required
                        placeholder="URL de l'audio (https://... ou téléversé)"
                        value={newSongAudioUrl}
                        onChange={(e) => setNewSongAudioUrl(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 font-mono"
                      />
                    </div>
                    <label className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 rounded-lg text-xs font-bold cursor-pointer transition-all">
                      {isUploadingAudio ? 'Téléversement...' : 'Téléverser MP3 / Audio'}
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioFileChange}
                        disabled={isUploadingAudio}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase font-mono block">Image de Couverture / Pochette d'Album (Optionnel)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="URL de l'image (Laissez vide pour image par défaut)"
                        value={newSongCoverUrl}
                        onChange={(e) => setNewSongCoverUrl(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 font-mono"
                      />
                    </div>
                    <label className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-bold cursor-pointer transition-all">
                      {isUploadingCover ? 'Téléversement...' : 'Téléverser Pochette'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileChange}
                        disabled={isUploadingCover}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-purple-950/20 p-3 rounded-xl border border-purple-500/10">
                  <div className="col-span-2">
                    <span className="block text-[11px] text-yellow-400 font-bold uppercase font-mono">✂️ Métrage / Découpe d'écoute (Teaser)</span>
                    <span className="block text-[9px] text-gray-400">Pour ne faire écouter qu'une partie (ex: refrain) et protéger vos œuvres réelles d'être téléchargées entièrement. Laissez vide pour écoute complète.</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Début (secondes)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ex: 30"
                      value={newSongStartTime}
                      onChange={(e) => setNewSongStartTime(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Fin (secondes)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ex: 90"
                      value={newSongEndTime}
                      onChange={(e) => setNewSongEndTime(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-mono">Histoire / Description de la chanson</label>
                  <textarea
                    rows={2}
                    placeholder="Racontez brièvement le contexte de ce cadeau unique..."
                    value={newSongDescription}
                    onChange={(e) => setNewSongDescription(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-mono">Retour Émotionnel du Client (Optionnel)</label>
                  <textarea
                    rows={2}
                    placeholder="Réaction du client à la réception de la chanson..."
                    value={newSongClientReaction}
                    onChange={(e) => setNewSongClientReaction(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Option de Visibilité</label>
                    <select
                      value={newSongVisibility}
                      onChange={(e: any) => setNewSongVisibility(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Public anonymous">Anonyme public</option>
                      <option value="Public with first name">Public avec prénom client</option>
                      <option value="Demo only">Maquette / Démo uniquement</option>
                      <option value="Private">Privé (Admin uniquement)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Prénom du Client</label>
                    <input
                      type="text"
                      placeholder="Ex: Sarah"
                      value={newSongClientFirstName}
                      onChange={(e) => setNewSongClientFirstName(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-mono">Identifiant Page Souvenir (Slug/ID VOXMORY)</label>
                  <input
                    type="text"
                    placeholder="Ex: maman-georgette (Laissez vide pour utiliser l'identifiant par défaut)"
                    value={newSongMemorySlug}
                    onChange={(e) => setNewSongMemorySlug(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                >
                  Ajouter à la Galerie publique
                </button>
              </form>
            </div>

            {/* SONGS LIST (RIGHT) */}
            <div className="lg:col-span-7 space-y-4">
              <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-yellow-400 border-b border-white/5 pb-2">
                Chansons actuellement en Galerie ({gallerySongs.length})
              </h4>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {gallerySongs.length > 0 ? (
                  gallerySongs.map((song) => (
                    <div key={song.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex gap-4 items-center justify-between">
                      <div className="flex gap-3 items-center min-w-0">
                        <img
                          src={song.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4'}
                          alt={song.title}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-white truncate">{song.title}</h5>
                          <p className="text-[10px] text-gray-400 truncate">
                            {song.occasion} • {song.style}
                          </p>
                          <p className="text-[9px] text-gray-500 truncate font-mono">
                            {song.language} • {song.mood} • {song.visibility}
                            {(song.startTime !== undefined || song.endTime !== undefined) && (
                              <span className="text-yellow-400 font-bold ml-1">
                                (✂️ {song.startTime || 0}s - {song.endTime || 'fin'}s)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Simple play indicator if there is an audioUrl */}
                        <a
                          href={song.audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
                          title="Écouter le fichier audio"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </a>

                        <button
                          onClick={() => handleStartEdit(song)}
                          className="p-2 bg-white/5 hover:bg-yellow-400 hover:text-black text-gray-300 rounded-lg transition-all cursor-pointer"
                          title="Modifier la chanson de la galerie"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteId === song.id ? (
                          <div className="flex items-center gap-1 bg-red-950/40 border border-red-500/20 px-2 py-1 rounded-lg animate-in fade-in zoom-in-95 duration-100">
                            <span className="text-[10px] text-red-400 font-medium mr-1">Supprimer?</span>
                            <button
                              onClick={() => {
                                handleDeleteGallerySong(song.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded transition-all cursor-pointer"
                            >
                              Oui
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 text-gray-300 text-[10px] font-bold rounded transition-all cursor-pointer"
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(song.id)}
                            className="p-2 bg-red-950/20 hover:bg-red-900 border border-red-500/10 text-red-400 rounded-lg transition-all cursor-pointer"
                            title="Retirer de la galerie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border border-white/5 rounded-2xl bg-black/20 text-gray-500">
                    <Music className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold">Aucune chanson dans la galerie</p>
                    <p className="text-[10px] text-gray-600 mt-1">Remplissez le formulaire de gauche pour ajouter un exemple de production.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        )}

        {completedCampaign && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0e0e12] border border-emerald-500/30 max-w-lg w-full rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative my-8 text-left">
              <button
                onClick={() => setCompletedCampaign(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white p-2"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-extrabold text-xl text-white">🚀 Diffusion Prête !</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  La campagne <strong className="text-white">"{completedCampaign.title}"</strong> a été générée avec succès.
                </p>
              </div>

              {/* Pedagogy callout */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-xs space-y-2">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] font-mono block">💡 Comment envoyer réellement :</span>
                <p className="text-gray-300 leading-relaxed">
                  WhatsApp interdit les envois automatiques de masse (anti-spam). Pour envoyer réellement vos messages personnalisés et sans risque :
                </p>
                <ol className="list-decimal list-inside text-[11px] text-gray-400 space-y-1 pl-1">
                  <li>Cliquez sur le bouton vert <strong>"Envoyer le message WhatsApp"</strong> de chaque contact ci-dessous.</li>
                  <li>Une fenêtre WhatsApp s'ouvrira directement avec votre message personnalisé pré-rempli.</li>
                  <li>Appuyez simplement sur le bouton d'envoi dans WhatsApp pour expédier.</li>
                  <li>Cochez la case <strong>"Envoyé"</strong> pour suivre vos envois au fur et à mesure !</li>
                </ol>
              </div>

              {/* Recipient list */}
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                <span className="block text-[10px] uppercase font-mono text-gray-500 font-bold">Destinataires à contacter :</span>
                {completedCampaign.logs && completedCampaign.logs.length > 0 ? (
                  completedCampaign.logs.map((l, lIdx) => {
                    const cleanPhone = l.whatsApp.replace(/[^0-9+]/g, '');
                    const msg = l.messageText || completedCampaign.messageTemplate.replace(/{name}/g, l.contactName);
                    const link = l.waUrl || `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(msg)}`;

                    return (
                      <div key={lIdx} className="bg-black/60 border border-white/5 p-3.5 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{l.contactName} ({l.whatsApp})</span>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
                            <input 
                              type="checkbox" 
                              className="accent-emerald-500 h-3 w-3 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span>Envoyé</span>
                          </label>
                        </div>
                        
                        <p className="text-[10px] text-gray-400 italic bg-white/5 p-2.5 rounded-xl border border-white/5">
                          "{msg}"
                        </p>

                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-sans font-extrabold uppercase transition-all text-center cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer à {l.contactName}</span>
                        </a>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">Aucun destinataire dans cette campagne.</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setCompletedCampaign(null)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {editingSong && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0e0e12] border border-red-500/20 max-w-2xl w-full rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative my-8 text-left">
              <button
                onClick={() => setEditingSong(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white p-1.5"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-sans font-extrabold text-xl text-white flex items-center gap-2">
                  <span className="text-yellow-400">📝</span>
                  <span>Modifier la Chanson</span>
                </h3>
                <p className="text-xs text-gray-500">Mettez à jour les données, la découpe (Teaser) ou téléversez de nouveaux fichiers.</p>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Titre de la chanson *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Reine Georgette"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Occasion *</label>
                    <select
                      value={editOccasion}
                      onChange={(e) => setEditOccasion(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer focus:border-red-500"
                    >
                      <option value="Anniversaire">Anniversaire</option>
                      <option value="Mariage">Mariage</option>
                      <option value="Hommage / Deuil">Hommage / Deuil</option>
                      <option value="Déclaration d'amour">Déclaration d'amour</option>
                      <option value="Collation / Diplôme">Collation / Diplôme</option>
                      <option value="Naissance">Naissance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Rythme / Style *</label>
                    <select
                      value={editStyle}
                      onChange={(e) => setEditStyle(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer focus:border-red-500"
                    >
                      <option value="Rumba congolaise">Rumba congolaise</option>
                      <option value="Afrobeat">Afrobeat</option>
                      <option value="Acoustique émotionnel">Acoustique émotionnel</option>
                      <option value="Gospel">Gospel</option>
                      <option value="Zouk">Zouk</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Langue</label>
                    <input
                      type="text"
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Ambiance / Mood</label>
                    <input
                      type="text"
                      value={editMood}
                      onChange={(e) => setEditMood(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase font-mono block">Fichier Audio (MP3/WAV) *</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      placeholder="URL de l'audio"
                      value={editAudioUrl}
                      onChange={(e) => setEditAudioUrl(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                    <label className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 rounded-xl text-xs font-bold cursor-pointer transition-all">
                      {isUploadingEditAudio ? 'Téléversement...' : 'Remplacer Audio'}
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleEditAudioFileChange}
                        disabled={isUploadingEditAudio}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase font-mono block">Image de Couverture</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="URL de l'image"
                      value={editCoverUrl}
                      onChange={(e) => setEditCoverUrl(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                    <label className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-bold cursor-pointer transition-all">
                      {isUploadingEditCover ? 'Téléversement...' : 'Remplacer Pochette'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditCoverFileChange}
                        disabled={isUploadingEditCover}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-red-950/10 p-4 rounded-2xl border border-red-500/10">
                  <div className="col-span-2">
                    <span className="block text-[11px] text-red-400 font-bold uppercase font-mono">✂️ Métrage / Découpe d'écoute (Teaser)</span>
                    <span className="block text-[9px] text-gray-500">Modifiez le timing de lecture publique pour masquer le morceau complet.</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Début (secondes)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 30"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Fin (secondes)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 90"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full bg-[#000000] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-mono">Histoire / Description de la chanson</label>
                  <textarea
                    rows={2}
                    placeholder="Histoire d'origine..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-mono">Retour Émotionnel du Client</label>
                  <textarea
                    rows={2}
                    placeholder="Commentaire de réaction..."
                    value={editClientReaction}
                    onChange={(e) => setEditClientReaction(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Option de Visibilité</label>
                    <select
                      value={editVisibility}
                      onChange={(e: any) => setEditVisibility(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer focus:border-red-500"
                    >
                      <option value="Public anonymous">Anonyme public</option>
                      <option value="Public with first name">Public avec prénom client</option>
                      <option value="Demo only">Maquette / Démo uniquement</option>
                      <option value="Private">Privé (Admin uniquement)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Prénom du Client</label>
                    <input
                      type="text"
                      placeholder="Ex: Sarah"
                      value={editClientFirstName}
                      onChange={(e) => setEditClientFirstName(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-mono">Identifiant Page Souvenir (Slug/ID VOXMORY)</label>
                  <input
                    type="text"
                    placeholder="Ex: maman-georgette (Laissez vide pour utiliser l'identifiant par défaut)"
                    value={editMemorySlug}
                    onChange={(e) => setEditMemorySlug(e.target.value)}
                    className="w-full bg-[#000000] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditingSong(null)}
                    className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center shadow-lg hover:shadow-red-950/20"
                  >
                    Enregistrer les modifications
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
