import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { Package, Order, GallerySong, ClientReview, MemoryPage, EventReminder, BroadcastList, BroadcastCampaign, DailyStat } from './types.js';

// Define the overall database schema shape
interface DatabaseSchema {
  packages: Package[];
  orders: Order[];
  gallerySongs: GallerySong[];
  reviews: ClientReview[];
  memoryPages: MemoryPage[];
  reminders: EventReminder[];
  adminPasswordHash: string;
  visitsCount: number;
  listensCount: number;
  dailyStats: DailyStat[];
  broadcastLists: BroadcastList[];
  broadcastCampaigns: BroadcastCampaign[];
}

// ----------------------------------------------------
// 1. Initial / Fallback Default Data (Seeding Source)
// ----------------------------------------------------
const initialPackages: Package[] = [
  {
    id: 'pack_simple',
    name: 'Chanson Simple',
    promise: 'Une magnifique chanson simple, sur mesure, écrite et chantée pour vous.',
    includes: [
      'Chanson personnalisée sur mesure (1-2 minutes)',
      'Format audio MP3 haute qualité',
      'Paroles poétiques et soignées incluses',
      '1 cycle de révision des paroles',
      'Idéal pour : Déclarations d\'amour, Clins d\'œil simples'
    ],
    price: '20 $',
    deliveryTime: '5 jours'
  },
  {
    id: 'pack_musique_video',
    name: 'Musique + Vidéo',
    promise: 'Une œuvre musicale complète accompagnée de votre montage vidéo personnalisé.',
    includes: [
      'Chanson personnalisée complète (2-3 minutes)',
      'Montage Vidéo personnalisé (Diaporama photos ou Vidéo lyrics)',
      'Formats audio WAV et MP3 de qualité studio',
      'Paroles poétiques rédigées avec soin',
      '2 cycles de révisions des paroles',
      'Page Souvenir Privée interactive avec QR code'
    ],
    price: '50 $',
    deliveryTime: '3 jours'
  },
  {
    id: 'pack_premium_vip',
    name: 'PREMIUM VIP',
    promise: 'L\'expérience ultime : Chanson, Carte VIP physique exclusive et abonnement d\'un an.',
    includes: [
      'Chanson premium longue de qualité supérieure (3-4 minutes)',
      'Carte VIP physique exclusive (Livrée ou expédiée)',
      'ABONNEMENT D\'UN AN : Chaque mois, vous avez droit à une chanson selon l\'événement !',
      'Montage vidéo de prestige avec vos photos',
      'Révisions de paroles illimitées avant production',
      'Page Souvenir premium personnalisée à vie',
      'Assistance WhatsApp VIP dédiée 24h/24'
    ],
    price: '100 $',
    deliveryTime: '24 heures'
  },
  {
    id: 'pack_presentiel',
    name: 'Prestation Présentielle',
    promise: 'Nos artistes ou notre équipe se déplacent en personne lors de votre événement.',
    includes: [
      'Prestation en live de l\'artiste pour chanter votre œuvre devant vos invités',
      'Présence physique de l\'équipe Voxmory à votre événement',
      'Chanson personnalisée de qualité studio incluse',
      'Carte VIP physique collector + Certificat d\'authenticité',
      'Enregistrement vidéo de la prestation live inclus',
      'Idéal pour : Grands mariages, Collations prestige, Soirées de gala'
    ],
    price: '1000 $',
    deliveryTime: 'Sur réservation'
  }
];

const initialGallerySongs: GallerySong[] = [];

const initialReviews: ClientReview[] = [
  {
    id: 'rev_brigitte_1',
    rating: 5,
    clientName: 'Brigitte M.',
    occasion: 'Mariage de sa fille',
    comment: 'Une chanson absolument magnifique pour le mariage de ma fille. Tout le monde a pleuré d\'émotion quand les guitares de la rumba ont retenti. Merci infiniment à l\'équipe de VOXMORY !',
    screenshotUrl: '',
    audioTestimonialUrl: '',
    date: '2026-06-29',
    approved: false
  },
  {
    id: 'rev_1',
    rating: 5,
    clientName: 'Sarah K.',
    occasion: 'Anniversaire',
    comment: 'J\'ai commandé une chanson pour les 50 ans de mon père. En racontant nos anecdotes en vrac par audio WhatsApp, l\'équipe a su recréer l\'émotion parfaite. Papa a fondu en larmes. Magnifique service !',
    screenshotUrl: '',
    audioTestimonialUrl: '',
    date: '2026-06-15',
    approved: true
  },
  {
    id: 'rev_2',
    rating: 5,
    clientName: 'Christian L.',
    occasion: 'Mariage',
    comment: 'Pour notre entrée de mariage, nous voulions notre propre chanson en rumba congolaise. VOXMORY nous a livré un chef-d\'œuvre. Nos invités étaient éblouis. Le paiement en Mobile Money s\'est fait en 2 minutes.',
    screenshotUrl: '',
    audioTestimonialUrl: '',
    date: '2026-06-22',
    approved: true
  },
  {
    id: 'rev_3',
    rating: 5,
    clientName: 'Inès B.',
    occasion: 'Naissance',
    comment: 'Une douce berceuse personnalisée pour ma fille née en mai. Doux, mélodieux et tellement personnel. Je l\'écoute tous les soirs avec elle. Merci infiniment !',
    screenshotUrl: '',
    audioTestimonialUrl: '',
    date: '2026-06-25',
    approved: true
  }
];

const initialMemoryPages: MemoryPage[] = [
  {
    id: 'mem_gilles_chimene',
    orderId: 'VOX-2026-001',
    eventTitle: 'Le Mariage de Gilles & Chimène',
    recipientName: 'Gilles & Chimène',
    recipientPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    personalMessage: 'À l\'amour de ma vie. Que cette rumba congolaise scelle notre promesse d\'éternité devant Dieu et nos familles.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date().toISOString()
  }
];

const initialDailyStats: DailyStat[] = [
  { date: '2026-06-23', visits: 120, listens: 45, orders: 3 },
  { date: '2026-06-24', visits: 145, listens: 52, orders: 4 },
  { date: '2026-06-25', visits: 180, listens: 80, orders: 5 },
  { date: '2026-06-26', visits: 155, listens: 68, orders: 3 },
  { date: '2026-06-27', visits: 210, listens: 95, orders: 7 },
  { date: '2026-06-28', visits: 240, listens: 110, orders: 8 },
  { date: '2026-06-29', visits: 285, listens: 130, orders: 12 }
];

const initialBroadcastLists: BroadcastList[] = [
  {
    id: 'list_clients_vip',
    name: 'Clients VIP - RDC',
    description: 'Nos clients réguliers les plus prestigieux résidant à Kinshasa et Lubumbashi.',
    contacts: [
      { id: 'contact_vanny', name: 'Vanny Irung', whatsApp: '+243978508099', category: 'Client', addedAt: '2026-06-20T12:00:00Z' },
      { id: 'contact_gilles', name: 'Gilles Alidor', whatsApp: '+243812345678', category: 'Client', addedAt: '2026-06-21T15:30:00Z' },
      { id: 'contact_chimene', name: 'Chimène Lona', whatsApp: '+243899999999', category: 'Client', addedAt: '2026-06-22T09:15:00Z' }
    ],
    createdAt: '2026-06-20T10:00:00Z'
  },
  {
    id: 'list_prospects_mariages',
    name: 'Prospects Mariages 2026',
    description: 'Futurs mariés ayant demandé des devis pour des rumbas personnalisées.',
    contacts: [
      { id: 'contact_christian', name: 'Christian Kabenge', whatsApp: '+243822222222', category: 'Prospect', addedAt: '2026-06-25T14:20:00Z' },
      { id: 'contact_julie', name: 'Julie Masengo', whatsApp: '+243855555555', category: 'Prospect', addedAt: '2026-06-26T11:45:00Z' }
    ],
    createdAt: '2026-06-25T14:00:00Z'
  }
];

const initialBroadcastCampaigns: BroadcastCampaign[] = [
  {
    id: 'campaign_promo_juin',
    title: 'Offre Rumba de Vacances - Juin 2026',
    messageTemplate: 'Bonjour {name}, profitez de -15% sur toutes nos compositions personnalisées ce mois-ci chez VOXMORY ! Entrez le code PROMO-VACANCES-2026 lors de votre prise de contact.',
    targetListId: 'list_prospects_mariages',
    targetListName: 'Prospects Mariages 2026',
    status: 'Envoyé',
    sentCount: 2,
    totalCount: 2,
    sentAt: '2026-06-28T16:00:00Z',
    logs: [
      { contactName: 'Christian Kabenge', whatsApp: '+243822222222', status: 'Succès', time: '2026-06-28T16:00:05Z' },
      { contactName: 'Julie Masengo', whatsApp: '+243855555555', status: 'Succès', time: '2026-06-28T16:00:10Z' }
    ]
  }
];

// ----------------------------------------------------
// 2. Firebase SDK Initialization & Database Setup
// ----------------------------------------------------
let firebaseConfig: any = {
  projectId: 'spry-pipe-472900-p0',
  firestoreDatabaseId: 'ai-studio-voxmory-7a0a9388-1be7-4232-8d6a-d8cf7ba66449'
};

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    console.error('[Firestore] Warning: Could not parse firebase-applet-config.json:', err);
  }
}

console.log(`[Firestore] Initializing client connection. Project: "${firebaseConfig.projectId}", Database: "${firebaseConfig.firestoreDatabaseId}"`);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// ----------------------------------------------------
// 3. Synchronous Cache & Memory State
// ----------------------------------------------------
const cache: DatabaseSchema = {
  packages: [...initialPackages],
  orders: [],
  gallerySongs: [...initialGallerySongs],
  reviews: [...initialReviews],
  memoryPages: [...initialMemoryPages],
  reminders: [],
  adminPasswordHash: 'voxmory2026',
  visitsCount: 1345,
  listensCount: 580,
  dailyStats: [...initialDailyStats],
  broadcastLists: [...initialBroadcastLists],
  broadcastCampaigns: [...initialBroadcastCampaigns],
};

let isFullySynchronized = false;

// Async function to synchronize all Firestore documents into local Cache,
// and auto-seed if they are empty.
async function syncDatabase() {
  try {
    console.log('[Firestore] Initiating background synchronisation...');

    // 1. Sync packages
    const packagesSnap = await getDocs(collection(db, 'packages'));
    if (packagesSnap.empty) {
      console.log('[Firestore] Seeding initial packages to cloud...');
      for (const p of initialPackages) {
        await setDoc(doc(db, 'packages', p.id), p);
      }
    } else {
      cache.packages = packagesSnap.docs.map(doc => doc.data() as Package);
    }

    // 2. Sync orders
    const ordersSnap = await getDocs(collection(db, 'orders'));
    cache.orders = ordersSnap.docs.map(doc => doc.data() as Order);
    cache.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 3. Sync gallerySongs
    const songsSnap = await getDocs(collection(db, 'gallerySongs'));
    if (songsSnap.empty) {
      console.log('[Firestore] Seeding initial gallery songs to cloud...');
      for (const s of initialGallerySongs) {
        await setDoc(doc(db, 'gallerySongs', s.id), s);
      }
    } else {
      cache.gallerySongs = songsSnap.docs.map(doc => doc.data() as GallerySong);
    }
    // Clean legacy mock gallery entries if any
    cache.gallerySongs = cache.gallerySongs.filter(s => s.id !== 'gal_1' && s.id !== 'gal_2' && s.id !== 'gal_3');
    // Ensure standard showcase songs exist
    for (const defSong of initialGallerySongs) {
      if (!cache.gallerySongs.some(s => s.id === defSong.id)) {
        cache.gallerySongs.push(defSong);
        await setDoc(doc(db, 'gallerySongs', defSong.id), defSong);
      }
    }
    cache.gallerySongs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 4. Sync reviews
    const reviewsSnap = await getDocs(collection(db, 'reviews'));
    if (reviewsSnap.empty) {
      console.log('[Firestore] Seeding initial client reviews to cloud...');
      for (const r of initialReviews) {
        await setDoc(doc(db, 'reviews', r.id), r);
      }
    } else {
      cache.reviews = reviewsSnap.docs.map(doc => doc.data() as ClientReview);
    }
    cache.reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 5. Sync memoryPages
    const pagesSnap = await getDocs(collection(db, 'memoryPages'));
    if (pagesSnap.empty) {
      console.log('[Firestore] Seeding initial memory pages to cloud...');
      for (const m of initialMemoryPages) {
        await setDoc(doc(db, 'memoryPages', m.id), m);
      }
    } else {
      cache.memoryPages = pagesSnap.docs.map(doc => doc.data() as MemoryPage);
    }

    // 6. Sync reminders
    const remindersSnap = await getDocs(collection(db, 'reminders'));
    cache.reminders = remindersSnap.docs.map(doc => doc.data() as EventReminder);

    // 7. Sync broadcastLists
    const listsSnap = await getDocs(collection(db, 'broadcastLists'));
    if (listsSnap.empty) {
      console.log('[Firestore] Seeding initial broadcast lists to cloud...');
      for (const l of initialBroadcastLists) {
        await setDoc(doc(db, 'broadcastLists', l.id), l);
      }
    } else {
      cache.broadcastLists = listsSnap.docs.map(doc => doc.data() as BroadcastList);
    }

    // 8. Sync broadcastCampaigns
    const campaignsSnap = await getDocs(collection(db, 'broadcastCampaigns'));
    if (campaignsSnap.empty) {
      console.log('[Firestore] Seeding initial broadcast campaigns to cloud...');
      for (const c of initialBroadcastCampaigns) {
        await setDoc(doc(db, 'broadcastCampaigns', c.id), c);
      }
    } else {
      cache.broadcastCampaigns = campaignsSnap.docs.map(doc => doc.data() as BroadcastCampaign);
    }

    // 9. Sync dailyStats
    const statsSnap = await getDocs(collection(db, 'dailyStats'));
    if (statsSnap.empty) {
      console.log('[Firestore] Seeding initial daily stats to cloud...');
      for (const s of initialDailyStats) {
        await setDoc(doc(db, 'dailyStats', s.date), s);
      }
    } else {
      cache.dailyStats = statsSnap.docs.map(doc => doc.data() as DailyStat);
    }
    cache.dailyStats.sort((a, b) => a.date.localeCompare(b.date));

    // 10. Sync meta global
    const metaDoc = await getDoc(doc(db, 'meta', 'global'));
    if (!metaDoc.exists()) {
      console.log('[Firestore] Seeding global metadata to cloud...');
      const initMeta = {
        adminPasswordHash: 'voxmory2026',
        visitsCount: 1345,
        listensCount: 580
      };
      await setDoc(doc(db, 'meta', 'global'), initMeta);
    } else {
      const metaData = metaDoc.data();
      cache.adminPasswordHash = metaData?.adminPasswordHash || 'voxmory2026';
      cache.visitsCount = metaData?.visitsCount || 1345;
      cache.listensCount = metaData?.listensCount || 580;
    }

    isFullySynchronized = true;
    console.log('[Firestore] Database fully loaded, cache synchronized successfully with Firebase!');
  } catch (error) {
    console.error('[Firestore] Warning: connection issues. Fallback active.', error);
  }
}

// Fire background sync instantly on boot
const syncPromise = syncDatabase();

// ----------------------------------------------------
// 4. Background Persistence Helpers (Non-blocking Writes)
// ----------------------------------------------------
async function persistSet(collectionName: string, docId: string, data: any) {
  try {
    await setDoc(doc(db, collectionName, docId), data, { merge: true });
  } catch (err) {
    console.error(`[Firestore] Persistence Error setting ${collectionName}/${docId}:`, err);
  }
}

async function persistDelete(collectionName: string, docId: string) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (err) {
    console.error(`[Firestore] Persistence Error deleting ${collectionName}/${docId}:`, err);
  }
}

// ----------------------------------------------------
// 5. Expose Secure Synchronous Database Service
// ----------------------------------------------------
export const serverDb = {
  ensureSynced: async () => {
    await syncPromise;
  },
  // Packages
  getPackages: () => cache.packages,
  updatePackage: (id: string, updated: Partial<Package>) => {
    cache.packages = cache.packages.map(p => p.id === id ? { ...p, ...updated } : p);
    const item = cache.packages.find(p => p.id === id);
    if (item) persistSet('packages', id, item);
    return item;
  },

  // Orders
  getOrders: () => cache.orders,
  getOrderById: (id: string) => cache.orders.find(o => o.id === id),
  createOrder: (order: Order) => {
    cache.orders.unshift(order);
    persistSet('orders', order.id, order);
    return order;
  },
  updateOrder: (id: string, updated: Partial<Order>) => {
    cache.orders = cache.orders.map(o => o.id === id ? { ...o, ...updated } : o);
    const item = cache.orders.find(o => o.id === id);
    if (item) persistSet('orders', id, item);
    return item;
  },
  deleteOrder: (id: string) => {
    cache.orders = cache.orders.filter(o => o.id !== id);
    persistDelete('orders', id);
    return true;
  },

  // Gallery Showcase
  getGallerySongs: () => cache.gallerySongs,
  createGallerySong: (song: GallerySong) => {
    cache.gallerySongs.unshift(song);
    persistSet('gallerySongs', song.id, song);
    return song;
  },
  updateGallerySong: (id: string, updated: Partial<GallerySong>) => {
    cache.gallerySongs = cache.gallerySongs.map(s => s.id === id ? { ...s, ...updated } : s);
    const item = cache.gallerySongs.find(s => s.id === id);
    if (item) persistSet('gallerySongs', id, item);
    return item;
  },
  deleteGallerySong: (id: string) => {
    cache.gallerySongs = cache.gallerySongs.filter(s => s.id !== id);
    persistDelete('gallerySongs', id);
    return true;
  },

  // Client Reviews
  getReviews: () => cache.reviews,
  createReview: (review: ClientReview) => {
    cache.reviews.unshift(review);
    persistSet('reviews', review.id, review);
    return review;
  },
  updateReview: (id: string, updated: Partial<ClientReview>) => {
    cache.reviews = cache.reviews.map(r => r.id === id ? { ...r, ...updated } : r);
    const item = cache.reviews.find(r => r.id === id);
    if (item) persistSet('reviews', id, item);
    return item;
  },
  deleteReview: (id: string) => {
    cache.reviews = cache.reviews.filter(r => r.id !== id);
    persistDelete('reviews', id);
    return true;
  },

  // Private Memory Pages (QR code souvenirs)
  getMemoryPages: () => cache.memoryPages,
  getMemoryPageById: (id: string) => cache.memoryPages.find(m => m.id === id),
  createMemoryPage: (page: MemoryPage) => {
    cache.memoryPages.unshift(page);
    persistSet('memoryPages', page.id, page);
    return page;
  },
  updateMemoryPage: (id: string, updated: Partial<MemoryPage>) => {
    cache.memoryPages = cache.memoryPages.map(m => m.id === id ? { ...m, ...updated } : m);
    const item = cache.memoryPages.find(m => m.id === id);
    if (item) persistSet('memoryPages', id, item);
    return item;
  },

  // Event Reminders
  getReminders: () => cache.reminders,
  createReminder: (reminder: EventReminder) => {
    cache.reminders.unshift(reminder);
    persistSet('reminders', reminder.id, reminder);
    return reminder;
  },
  deleteReminder: (id: string) => {
    cache.reminders = cache.reminders.filter(r => r.id !== id);
    persistDelete('reminders', id);
    return true;
  },

  // Analytics, Stats & Visits
  getStats: () => {
    const approvedReviews = (cache.reviews || []).filter(r => r.approved);
    const totalSongsDelivered = cache.orders.filter(o => o.status === 'Livrée').length;
    
    const clientSatisfaction = approvedReviews.length > 0
      ? parseFloat(((approvedReviews.filter(r => r.rating >= 4).length / approvedReviews.length) * 100).toFixed(1))
      : 100.0;
      
    const averageRating = approvedReviews.length > 0
      ? parseFloat((approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length).toFixed(1))
      : 5.0;
      
    const totalOrdersCount = cache.orders.length;

    return {
      totalSongsDelivered,
      clientSatisfaction,
      averageRating,
      totalOrdersCount,
      visitsCount: cache.visitsCount,
      listensCount: cache.listensCount,
      dailyStats: cache.dailyStats || []
    };
  },
  incrementVisit: () => {
    cache.visitsCount += 1;
    
    const todayStr = new Date().toISOString().split('T')[0];
    let stat = cache.dailyStats.find(s => s.date === todayStr);
    if (!stat) {
      stat = { date: todayStr, visits: 0, listens: 0, orders: 0 };
      cache.dailyStats.push(stat);
    }
    stat.visits += 1;
    
    persistSet('meta', 'global', { visitsCount: cache.visitsCount });
    persistSet('dailyStats', todayStr, stat);
    
    return cache.visitsCount;
  },
  incrementListen: () => {
    cache.listensCount += 1;
    
    const todayStr = new Date().toISOString().split('T')[0];
    let stat = cache.dailyStats.find(s => s.date === todayStr);
    if (!stat) {
      stat = { date: todayStr, visits: 0, listens: 0, orders: 0 };
      cache.dailyStats.push(stat);
    }
    stat.listens += 1;
    
    persistSet('meta', 'global', { listensCount: cache.listensCount });
    persistSet('dailyStats', todayStr, stat);
    
    return cache.listensCount;
  },
  incrementOrderStat: () => {
    const todayStr = new Date().toISOString().split('T')[0];
    let stat = cache.dailyStats.find(s => s.date === todayStr);
    if (!stat) {
      stat = { date: todayStr, visits: 0, listens: 0, orders: 0 };
      cache.dailyStats.push(stat);
    }
    stat.orders += 1;
    
    persistSet('dailyStats', todayStr, stat);
  },

  // Broadcast List System (WhatsApp Lists)
  getBroadcastLists: () => cache.broadcastLists,
  createBroadcastList: (list: BroadcastList) => {
    cache.broadcastLists.unshift(list);
    persistSet('broadcastLists', list.id, list);
    return list;
  },
  updateBroadcastList: (id: string, updated: Partial<BroadcastList>) => {
    cache.broadcastLists = cache.broadcastLists.map(l => l.id === id ? { ...l, ...updated } : l);
    const item = cache.broadcastLists.find(l => l.id === id);
    if (item) persistSet('broadcastLists', id, item);
    return item;
  },
  deleteBroadcastList: (id: string) => {
    cache.broadcastLists = cache.broadcastLists.filter(l => l.id !== id);
    persistDelete('broadcastLists', id);
    return true;
  },

  // Broadcast Campaigns
  getBroadcastCampaigns: () => cache.broadcastCampaigns,
  createBroadcastCampaign: (campaign: BroadcastCampaign) => {
    cache.broadcastCampaigns.unshift(campaign);
    persistSet('broadcastCampaigns', campaign.id, campaign);
    return campaign;
  },
  updateBroadcastCampaign: (id: string, updated: Partial<BroadcastCampaign>) => {
    cache.broadcastCampaigns = cache.broadcastCampaigns.map(c => c.id === id ? { ...c, ...updated } : c);
    const item = cache.broadcastCampaigns.find(c => c.id === id);
    if (item) persistSet('broadcastCampaigns', id, item);
    return item;
  }
};
