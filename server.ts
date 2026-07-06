import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { serverDb, db } from './src/server_db.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Order, OrderStatus, PaymentStatus } from './src/types.js';
import { sendWhatsAppMessage, handleSendNotification, handleTestNotification } from './src/whatsapp_handler.js';

// Initialize Express
const app = express();
const PORT = 3000;

// Setup local uploads folder for audio and image files
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// GridFS-style chunked storage in Firestore to survive Cloud Run container restarts
async function backupToFirestore(filename: string, fileType: string, buffer: Buffer): Promise<void> {
  try {
    console.log(`[Backup] Starting backup for: ${filename} (Size: ${buffer.length} bytes)`);
    
    // Chunk size: 600KB (614,400 bytes)
    const CHUNK_SIZE = 600 * 1024;
    const totalSize = buffer.length;
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

    // 1. Create a master metadata document in 'files' collection
    const fileId = filename;
    const fileMetaRef = doc(db, 'files', fileId);
    await setDoc(fileMetaRef, {
      id: fileId,
      fileName: filename,
      fileType: fileType,
      totalChunks: totalChunks,
      totalSize: totalSize,
      createdAt: new Date().toISOString()
    });

    // 2. Write individual chunks to 'fileChunks' collection
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);
      const chunkSlice = buffer.subarray ? buffer.subarray(start, end) : buffer.slice(start, end);
      const base64Chunk = chunkSlice.toString('base64');

      const chunkRef = doc(db, 'fileChunks', `${fileId}_chunk_${i}`);
      await setDoc(chunkRef, {
        fileId: fileId,
        chunkIndex: i,
        data: base64Chunk,
        createdAt: new Date().toISOString()
      });
    }

    console.log(`[Backup] Completed backup of ${filename} to Firestore successfully in ${totalChunks} chunks.`);
  } catch (err) {
    console.error(`[Backup] Error backing up ${filename} to Firestore:`, err);
  }
}

async function restoreFromFirestore(filename: string): Promise<boolean> {
  try {
    console.log(`[Restore] Checking Firestore for backup of: ${filename}`);
    
    const fileMetaRef = doc(db, 'files', filename);
    const fileMetaDoc = await getDoc(fileMetaRef);
    
    if (!fileMetaDoc.exists()) {
      console.log(`[Restore] No backup found in Firestore for: ${filename}`);
      return false;
    }

    const meta = fileMetaDoc.data();
    const totalChunks = meta.totalChunks;
    console.log(`[Restore] Found backup for ${filename}. Restoring ${totalChunks} chunks...`);

    const chunkBuffers: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkRef = doc(db, 'fileChunks', `${filename}_chunk_${i}`);
      const chunkDoc = await getDoc(chunkRef);
      if (!chunkDoc.exists()) {
        console.error(`[Restore] Missing chunk ${i} for file ${filename}. Cannot restore.`);
        return false;
      }
      const chunkData = chunkDoc.data();
      const chunkBuffer = Buffer.from(chunkData?.data || '', 'base64');
      chunkBuffers.push(chunkBuffer);
    }

    const completeBuffer = Buffer.concat(chunkBuffers);
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, completeBuffer);
    console.log(`[Restore] Successfully restored ${filename} to local disk. Size: ${completeBuffer.length} bytes.`);
    return true;
  } catch (err) {
    console.error(`[Restore] Error restoring ${filename} from Firestore:`, err);
    return false;
  }
}

// Uploads fallback middleware for ephemeral cloud-run container file systems
app.get('/uploads/:filename', async (req, res, next) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    console.log(`[Uploads fallback] File not found: ${req.params.filename}. Checking Firestore backup...`);
    
    try {
      // Try to restore from Firestore
      const restored = await restoreFromFirestore(req.params.filename);
      if (restored && fs.existsSync(filePath)) {
        console.log(`[Uploads fallback] File successfully restored from Firestore. Serving ${req.params.filename}.`);
        return res.sendFile(filePath);
      }
    } catch (restoreErr) {
      console.error('[Uploads fallback] Failed to restore file:', restoreErr);
    }
    
    console.log(`[Uploads fallback] No Firestore backup for: ${req.params.filename}. Redirecting to default asset.`);
    
    // If it's an audio request, redirect to standard high-quality demonstration song
    if (req.params.filename.endsWith('.mp3') || req.params.filename.endsWith('.wav') || req.params.filename.endsWith('.webm') || req.params.filename.endsWith('.m4a')) {
      return res.redirect('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    }
    
    // If it's an image, redirect to beautiful Unsplash cover placeholder
    if (req.params.filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return res.redirect('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80');
    }
  }
  next();
});

app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', express.static(path.join(process.cwd(), 'public/audio')));
app.use('/uploads', express.static(path.join(process.cwd(), 'public/images')));
app.use('/audio', express.static(path.join(process.cwd(), 'public/audio')));
app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

// Increase payload limit for audio/image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy-initialize Gemini API to prevent crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// Helper to generate AI text
async function runAiPrompt(prompt: string, systemInstruction?: string): Promise<string> {
  const ai = getAi();
  if (!ai) {
    // Elegant descriptive placeholder so user can test the UI in sandbox instantly
    return `[Mode Simulation VOXMORY AI]\nLe service d'assistance AI s'est exécuté avec succès. (Pour activer de véritables réponses personnalisées complexes, configurez votre clé 'GEMINI_API_KEY' dans les Secrets d'AI Studio).\n\nVoici une proposition générée intelligemment :\n\n---\nPrompt traité: "${prompt.slice(0, 100)}..."\n\n${mockAiResponse(prompt, systemInstruction)}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text || "Désolé, aucune réponse générée.";
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return `Erreur lors de la communication avec l'IA : ${err.message || err}. (Veuillez vérifier vos quotas ou votre clé d'API).`;
  }
}

// Mock responses for elegant simulation when key is empty
function mockAiResponse(prompt: string, systemInstruction?: string): string {
  if (prompt.includes('transcribe')) {
    return `[Transcription audio simulée]\n"Bonjour l'équipe VOXMORY, je m'appelle Sarah. Je souhaite commander une chanson d'anniversaire pour ma maman Georgette. Elle fête ses 60 ans le mois prochain. Elle a passé toute sa vie à s'occuper de nous à Goma. Elle adore les fleurs, la rumba douce de Madilu System, et elle rit toujours quand elle nous prépare son fameux foufou. Je veux lui dire qu'on l'aime infiniment et qu'elle est notre reine."`;
  }
  if (prompt.includes('summarize')) {
    return `Résumé Émotionnel VOXMORY :\n- Client : Sarah (fille de Georgette)\n- Bénéficiaire : Georgette, fête ses 60 ans, figure maternelle aimante et dévouée.\n- Clés de l'histoire : Vie de sacrifice à Goma, amour des fleurs, rires communicatifs, passion pour le foufou, reine de la famille.\n- Ambiance recherchée : Chaleureuse, profondément reconnaissante, nostalgique mais joyeuse (Rumba douce).`;
  }
  if (prompt.includes('brief')) {
    return `Brief de Production Artistique VOXMORY :\n1. Thème central : "Georgette, la Reine de Goma" (Hommage filial pour 60 ans).\n2. Structure : Intro douce -> Couplet 1 (La vie à Goma, les sacrifices) -> Refrain (Notre reine de 60 ans, ton sourire est notre phare) -> Couplet 2 (L'odeur du foufou, tes éclats de rire) -> Outro (Amour éternel de tes enfants).\n3. Style musical : Rumba congolaise traditionnelle lente (cloche, guitare solo pincée fluide, voix harmonisée chaleureuse).\n4. Tempo : 95 BPM (Modéré, dansant doux).`;
  }
  if (prompt.includes('lyrics')) {
    return `[PROJET DE PAROLES - MAQUETTE VOXMORY]\n(Style : Rumba Congolaise)\n\nIntro:\n(Guitare rumba douce, nappes légères...)\nOh Maman Georgette... Notre reine de Goma...\nÉcoute la mélodie de nos cœurs...\n\nCouplet 1:\nDans les rues chaudes de notre enfance,\nTu marchais le cœur plein d'espérance.\nPour nous nourrir, maman, tu n'as jamais faibli,\nTes mains douces ont essuyé toutes nos mélancolies.\nÀ Goma, sous le regard du volcan,\nTu as été notre bouclier, notre plus doux océan...\n\nRefrain:\nGeorgette, maman chérie, tu as soixante ans aujourd'hui !\nNotre reine, notre lumière dans la nuit.\nTon rire résonne, plus doux que la plus belle des rumbas,\nNous chantons ton nom, maman, on ne t'oubliera pas !\n\nCouplet 2:\nQuand l'odeur du foufou chaud embaume la maison,\nNous voyons tes yeux briller, chantant tes chansons.\nTu aimes les fleurs et la grâce de la vie,\nPour chaque moment partagé, maman, merci !\n\nOutro:\nSoixante ans d'amour, de sourires partagés...\nTes enfants te célèbrent, pour l'éternité...\nOh maman... nzambe apambola yo (Que Dieu te bénisse).`;
  }
  if (prompt.includes('suno')) {
    return `Suno API Prompt Suggestion :\n\nPrompt Style :\n"gentle traditional congolese rumba, sweet acoustic guitar solo, rich male and female vocal harmonies, melodic, emotional, warm, Goma style, congas percussion, brass accents, 95bpm"`;
  }
  if (prompt.includes('cover')) {
    return `DALL-E / Imagen Prompt Suggestion :\n\n"A cinematic oil painting with golden light accents showing an elegant mature African mother smiling warmly, surrounded by beautiful tropical flowers, in the background a soft abstract soundwave in purple and gold, premium, emotional luxury, 8k"`;
  }
  if (prompt.includes('video')) {
    return `Veo Video Prompt Suggestion :\n\n"Slow-motion cinematic tracking shot of an elegant African mother looking lovingly, glowing warm lighting, soft golden particles floating around her, luxurious dark backdrop with subtle purple and pink studio lighting, emotionally powerful, highly detailed"`;
  }
  if (prompt.includes('whatsapp')) {
    return `Message WhatsApp de Livraison VOXMORY :\n\n"Bonjour Sarah ! ✨\n\nC'est l'équipe VOXMORY. Votre chef-d'œuvre personnalisé pour les 60 ans de Maman Georgette est enfin prêt ! 🎵👑\n\nNous avons mis tout notre cœur pour transformer votre magnifique histoire en une rumba congolaise magique.\n\nRetrouvez votre chanson exclusive ainsi que vos paroles écrites sur votre page souvenir privée éternelle :\n👉 https://voxmory.com/memory/georgette-60\n\nQue cette chanson illumine son cœur et crée des larmes de bonheur ! Nous restons à votre entière disposition sur ce numéro pour toute question.\n\nMerci d'avoir fait confiance à VOXMORY pour sceller ce moment de vie. 💜✨"`;
  }
  if (prompt.includes('testimonial')) {
    return `Message WhatsApp de Demande d'Avis VOXMORY :\n\n"Bonjour Sarah ! Nous espérons que Maman Georgette a passé un anniversaire inoubliable avec sa chanson personnalisée. 🥰🎵\n\nPourriez-vous prendre 1 minute pour nous partager votre avis ou sa réaction ? Votre retour compte énormément pour nous aider à faire résonner plus d'histoires d'amour en Afrique. \n\nVous pouvez déposer votre témoignage en 2 clics ici :\n👉 https://voxmory.com/avis\n\nUn grand merci d'avance ! 🙏✨"`;
  }
  return `Message de Suivi d'Événement VOXMORY :\n\n"Bonjour Sarah ! C'est VOXMORY. 😊\nNous nous souvenons que le mariage de votre frère Marc approche bientôt (en août) ! 🎉\n\nSouhaitez-vous lui préparer également une surprise inoubliable en chanson pour immortaliser leur amour ? Nos compositeurs rumba et afrobeat sont prêts à vous écouter !\n\nProfitez d'une réduction de 15% sur votre deuxième commande avec le code SOUVENIR15.\nDiscutons-en directement ici ! 💜"`;
}

// ==========================================
// API ENDPOINTS
// ==========================================

// Get all packages
app.get('/api/packages', async (req, res) => {
  await serverDb.ensureSynced();
  res.json(serverDb.getPackages());
});

// Update package details (Admin)
app.put('/api/packages/:id', (req, res) => {
  const { id } = req.params;
  const { price, deliveryTime } = req.body;
  const updated = serverDb.updatePackage(id, { price, deliveryTime });
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Package non trouvé.' });
  }
});

// Create a new order
app.post('/api/orders', async (req, res) => {
  const orderData = req.body;
  
  // Generate random order number e.g., VOX-2026-X839
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const orderId = `VOX-2026-${randomNum}`;
  
  const newOrder: Order = {
    ...orderData,
    id: orderId,
    createdAt: new Date().toISOString(),
    status: 'Nouvelle',
    paymentStatus: 'Unpaid',
    adminNotes: ''
  };
  
  const saved = serverDb.createOrder(newOrder);
  serverDb.incrementOrderStat(); // Increment dashboard stats dynamically in real-time

  // Send automated WhatsApp messages
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '243978508099';
  
  // Get package name
  const packageName = 
    newOrder.packageId === 'pack_simple' ? 'Chanson Simple' :
    newOrder.packageId === 'pack_musique_video' ? 'Musique + Vidéo' :
    newOrder.packageId === 'pack_premium_vip' ? 'PREMIUM VIP' :
    newOrder.packageId === 'pack_presentiel' ? 'Prestation Présentielle' :
    newOrder.packageId || 'Service sur mesure';

  const detailsText = `Occasion: ${newOrder.occasion || 'Non spécifiée'}\nStyle: ${newOrder.musicStyle || 'Non spécifié'}\nAmbiance: ${newOrder.mood || 'Non spécifiée'}\nDestinataire: ${newOrder.recipientName || 'Non spécifié'} (${newOrder.recipientRelationship || ''})`;

  const adminMsg = `Nouvelle commande reçue.

Nom : ${newOrder.customerName}
Téléphone : ${newOrder.customerWhatsApp}
Service : ${packageName}
Détails : ${detailsText}

Merci de contacter le client rapidement.`;

  const clientMsg = `Bonjour ${newOrder.customerName},
Votre commande a bien été reçue.
Notre équipe va vous contacter sur WhatsApp pour finaliser les détails.
Merci pour votre confiance.`;

  console.log(`[Orders API] Commande ${orderId} créée avec succès. Envoi des notifications WhatsApp...`);
  
  let adminNotifySuccess = false;
  let clientNotifySuccess = false;

  try {
    adminNotifySuccess = await sendWhatsAppMessage(adminPhone, adminMsg);
  } catch (err) {
    console.error(`[Orders API] Échec de la notification WhatsApp de l'administrateur pour la commande ${orderId}:`, err);
  }

  try {
    if (newOrder.customerWhatsApp) {
      clientNotifySuccess = await sendWhatsAppMessage(newOrder.customerWhatsApp, clientMsg);
    }
  } catch (err) {
    console.error(`[Orders API] Échec de la notification WhatsApp du client pour la commande ${orderId}:`, err);
  }

  res.json({
    ...saved,
    whatsappSent: adminNotifySuccess && clientNotifySuccess
  });
});

// Get all orders (Admin)
app.get('/api/orders', (req, res) => {
  res.json(serverDb.getOrders());
});

// Get order by precise ID
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const found = serverDb.getOrderById(id);
  if (found) {
    res.json(found);
  } else {
    res.status(404).json({ error: 'Commande introuvable.' });
  }
});

// Get order by ID or WhatsApp
app.get('/api/orders/track', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Veuillez fournir un numéro de commande ou de WhatsApp.' });
  }

  const cleanQuery = String(query).trim().toLowerCase();
  const allOrders = serverDb.getOrders();
  
  // Find by precise ID or WhatsApp match
  const found = allOrders.find(o => 
    o.id.toLowerCase() === cleanQuery || 
    o.customerWhatsApp.replace(/[\s+]/g, '').includes(cleanQuery.replace(/[\s+]/g, ''))
  );

  if (found) {
    res.json(found);
  } else {
    res.status(404).json({ error: 'Aucune commande correspondante trouvée.' });
  }
});

// Update order details (Admin)
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const updatedOrder = serverDb.updateOrder(id, req.body);
  if (updatedOrder) {
    res.json(updatedOrder);
  } else {
    res.status(404).json({ error: 'Commande non trouvée.' });
  }
});

// Delete order (Admin)
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const success = serverDb.deleteOrder(id);
  res.json({ success });
});

// Get gallery songs
app.get('/api/gallery', async (req, res) => {
  await serverDb.ensureSynced();
  const songs = serverDb.getGallerySongs();
  // Filter for public view (only public with first name or public anonymous or demo)
  res.json(songs.filter(s => s.visibility !== 'Private'));
});

// Get all gallery songs including private (Admin)
app.get('/api/admin/gallery', async (req, res) => {
  await serverDb.ensureSynced();
  res.json(serverDb.getGallerySongs());
});

// Create gallery song (Admin)
app.post('/api/gallery', (req, res) => {
  const songData = req.body;
  const id = `gal_${Date.now()}`;
  const newSong = serverDb.createGallerySong({
    ...songData,
    id,
    createdAt: new Date().toISOString()
  });
  res.json(newSong);
});

// Update gallery song (Admin)
app.put('/api/gallery/:id', (req, res) => {
  const { id } = req.params;
  const updated = serverDb.updateGallerySong(id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Chanson de galerie non trouvée.' });
  }
});

// Delete gallery song (Admin)
app.delete('/api/gallery/:id', (req, res) => {
  const { id } = req.params;
  const success = serverDb.deleteGallerySong(id);
  res.json({ success });
});

// Get all reviews (approved for public, all for admin)
app.get('/api/reviews', async (req, res) => {
  await serverDb.ensureSynced();
  const { all } = req.query;
  const reviews = serverDb.getReviews();
  if (all === 'true') {
    res.json(reviews);
  } else {
    res.json(reviews.filter(r => r.approved));
  }
});

// Create client review
app.post('/api/reviews', (req, res) => {
  const reviewData = req.body;
  const id = `rev_${Date.now()}`;
  const newReview = serverDb.createReview({
    ...reviewData,
    id,
    date: new Date().toISOString().split('T')[0],
    approved: false // Must be approved by admin
  });
  res.json(newReview);
});

// Update/Approve client review (Admin)
app.put('/api/reviews/:id', (req, res) => {
  const { id } = req.params;
  const updated = serverDb.updateReview(id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Avis non trouvé.' });
  }
});

// Approve client review (Admin)
app.post('/api/reviews/:id/approve', (req, res) => {
  const { id } = req.params;
  const updated = serverDb.updateReview(id, { approved: true });
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Avis non trouvé.' });
  }
});

// Delete client review (Admin)
app.delete('/api/reviews/:id', (req, res) => {
  const { id } = req.params;
  const success = serverDb.deleteReview(id);
  res.json({ success });
});

// Get memory page by ID (Slug)
app.get('/api/memory-pages/:id', (req, res) => {
  const { id } = req.params;
  const page = serverDb.getMemoryPageById(id);
  if (page) {
    res.json(page);
  } else {
    res.status(404).json({ error: 'Page souvenir privée introuvable.' });
  }
});

// Generate private memory page from an order (Admin)
app.post('/api/memory-pages/generate', (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "L'identifiant de la commande est requis." });
  }

  const order = serverDb.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: "Commande introuvable." });
  }

  // Use recipient name and order ID to construct a clean, unique slug
  const cleanRecipientName = order.recipientName
    ? order.recipientName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')
    : 'destinataire';
  const cleanOrderId = order.id.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  const slug = `mem_${cleanRecipientName}_${cleanOrderId}`;

  // Check if a memory page already exists for this order/slug
  let existingPage = serverDb.getMemoryPageById(slug);
  if (existingPage) {
    return res.json({ success: true, slug: existingPage.id });
  }

  // Create the memory page using values from the order
  const newPage = serverDb.createMemoryPage({
    id: slug,
    orderId: order.id,
    eventTitle: `Le Souvenir en Musique pour ${order.recipientName || 'votre proche'}`,
    recipientName: order.recipientName || 'Proche',
    recipientPhotoUrl: order.uploadedPhotoUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    personalMessage: order.storyText || `Une magnifique chanson personnalisée créée spécialement avec amour pour célébrer ce moment inoubliable.`,
    audioUrl: order.finalAudioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: order.coverImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date().toISOString()
  });

  // Update order with the memoryPageId
  serverDb.updateOrder(order.id, { memoryPageId: slug });

  res.json({ success: true, slug: slug });
});

// Create memory page (Admin)
app.post('/api/memory-pages', (req, res) => {
  const pageData = req.body;
  // Use recipient name and order number as slug
  const slug = pageData.id || `mem_${pageData.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
  
  const newPage = serverDb.createMemoryPage({
    ...pageData,
    id: slug,
    createdAt: new Date().toISOString()
  });
  res.json(newPage);
});

// Get all reminders
app.get('/api/reminders', (req, res) => {
  res.json(serverDb.getReminders());
});

// Create reminder
app.post('/api/reminders', (req, res) => {
  const id = `rem_${Date.now()}`;
  const newReminder = serverDb.createReminder({
    ...req.body,
    id
  });
  res.json(newReminder);
});

// Delete reminder
app.delete('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  const success = serverDb.deleteReminder(id);
  res.json({ success });
});

// Dashboard stats endpoint
app.get('/api/stats', (req, res) => {
  const dbStats = serverDb.getStats();
  const reviews = serverDb.getReviews();
  const approvedReviews = reviews.filter(r => r.approved);
  const orders = serverDb.getOrders();
  const packages = serverDb.getPackages();

  // Calculate real average rating and satisfaction strictly from real data
  const averageRating = approvedReviews.length > 0 
    ? parseFloat((approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length).toFixed(1))
    : 5.0;

  const clientSatisfaction = approvedReviews.length > 0
    ? parseFloat(((approvedReviews.filter(r => r.rating >= 4).length / approvedReviews.length) * 100).toFixed(1))
    : 100.0;

  // Calculate real metrics expected by frontend (totalOrders, delivered, pendingPayment)
  const totalOrders = orders.length;
  const delivered = orders.filter(o => o.status === 'Livrée').length;
  const pendingPayment = orders.filter(o => o.status === 'En attente de paiement' || o.paymentStatus !== 'Paid').length;

  // Calculate real revenue from paid orders
  let totalRevenue = 0;
  orders.forEach(o => {
    if (o.paymentStatus === 'Paid') {
      const pkg = packages.find(p => p.id === o.packageId);
      if (pkg) {
        const priceNum = parseInt(pkg.price.replace(/[^0-9]/g, '')) || 0;
        totalRevenue += priceNum;
      }
    }
  });

  res.json({
    totalOrders,
    delivered,
    pendingPayment,
    totalRevenue,
    totalSongsDelivered: delivered,
    clientSatisfaction,
    averageRating,
    totalOrdersCount: totalOrders,
    visitsCount: dbStats.visitsCount,
    listensCount: dbStats.listensCount,
    dailyStats: dbStats.dailyStats
  });
});

// Increment visit tracking (called when user hits home or song pages)
app.post('/api/stats/visit', (req, res) => {
  const count = serverDb.incrementVisit();
  res.json({ success: true, visitsCount: count });
});

// Increment song listen tracking (called when user plays a song)
app.post('/api/stats/listen', (req, res) => {
  const count = serverDb.incrementListen();
  res.json({ success: true, listensCount: count });
});

// Broadcast Lists API (WhatsApp Business style)
app.get('/api/broadcast/lists', (req, res) => {
  res.json(serverDb.getBroadcastLists());
});

app.post('/api/broadcast/lists', (req, res) => {
  const id = `list_${Date.now()}`;
  const newList = serverDb.createBroadcastList({
    ...req.body,
    id,
    createdAt: new Date().toISOString()
  });
  res.json(newList);
});

app.put('/api/broadcast/lists/:id', (req, res) => {
  const { id } = req.params;
  const updated = serverDb.updateBroadcastList(id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Liste de diffusion introuvable.' });
  }
});

app.delete('/api/broadcast/lists/:id', (req, res) => {
  const { id } = req.params;
  const success = serverDb.deleteBroadcastList(id);
  res.json({ success });
});

// Broadcast Campaigns API
app.get('/api/broadcast/campaigns', (req, res) => {
  res.json(serverDb.getBroadcastCampaigns());
});

app.post('/api/broadcast/campaigns', (req, res) => {
  const id = `campaign_${Date.now()}`;
  const newCampaign = serverDb.createBroadcastCampaign({
    ...req.body,
    id,
    sentAt: new Date().toISOString()
  });
  res.json(newCampaign);
});

// Secure WhatsApp notification handlers from dedicated module
app.post('/api/whatsapp/send', handleSendNotification);
app.post('/api/whatsapp/secure-send', handleSendNotification);

// Admin Button Test Endpoint
app.post('/api/whatsapp/test', handleTestNotification);
app.post('/api/whatsapp/secure-test', handleTestNotification);

// Send real WhatsApp message via OpenWA Local API (Broadcast Lists)
app.post('/api/broadcast/send-whatsapp', async (req, res) => {
  try {
    const { whatsApp, text } = req.body;
    if (!whatsApp || !text) {
      return res.status(400).json({ error: "whatsApp et text sont requis." });
    }

    const success = await sendWhatsAppMessage(whatsApp, text);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: "Échec de l'envoi via le helper." });
    }
  } catch (err: any) {
    console.error("Erreur lors de l'envoi WhatsApp", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ADMIN AI ASSIST ENDPOINTS
// ==========================================

// 1. Transcribe audio story
app.post('/api/admin/ai/transcribe', async (req, res) => {
  const { orderId, audioFilename } = req.body;
  const systemInstruction = "Tu es un assistant expert VOXMORY chargé d'écouter ou de retranscrire l'audio d'un client de manière fidèle et humaine, en capturant l'émotion.";
  const prompt = `Transcribe audio file '${audioFilename || "audio_note.ogg"}' from order ${orderId || "unknown"}. Convert the user's spoken voice note recounting their personal life story, memories, anecdotes, and feelings into clean, beautifully structured French text while preserving the raw emotional phrasing and local flavor (RDC/Afrique context).`;
  
  const result = await runAiPrompt(prompt, systemInstruction);
  res.json({ text: result });
});

// 2. Summarize emotional story
app.post('/api/admin/ai/summarize', async (req, res) => {
  const { storyText } = req.body;
  const systemInstruction = "Tu es un directeur de création artistique pour VOXMORY. Ton travail est d'extraire l'essence émotionnelle, les faits clés, les anecdotes et le ton d'une histoire brute racontée par un client.";
  const prompt = `Analyse l'histoire suivante et prépare un résumé émotionnel structuré avec : 
- Les personnages principaux et leurs relations
- L'événement célébré (mariage, deuil, anniversaire...)
- Les moments clés, anecdotes fortes ou détails drôles/émouvants
- Le ton émotionnel idéal de la future chanson

Histoire client :
"${storyText || "Aucune histoire textuelle fournie."}"`;

  const result = await runAiPrompt(prompt, systemInstruction);
  res.json({ text: result });
});

// 3. Generate song brief
app.post('/api/admin/ai/generate-brief', async (req, res) => {
  const { storyText, mood, musicStyle } = req.body;
  const systemInstruction = "Tu es arrangeur et directeur de production musicale pour VOXMORY, studio de composition haut de gamme en Afrique.";
  const prompt = `Crée un brief technique et artistique complet destiné au compositeur de la chanson. Intègre le style demandé : "${musicStyle || "Rumba congolaise"}" et l'ambiance : "${mood || "Romantique"}".
Précise la structure suggérée de la chanson (Intro, Couplets, Refrain, Solo, Outro), le tempo (BPM), la direction vocale (voix homme/femme, choeurs) et les instruments phares (guitare rumba, clavier, percussions traditionnelles...).

Histoire source :
"${storyText || "Histoire en cours d'élaboration"}"`;

  const result = await runAiPrompt(prompt, systemInstruction);
  res.json({ text: result });
});

// 4. Generate lyrics draft
app.post('/api/admin/ai/generate-lyrics', async (req, res) => {
  const { storyText, mood, musicStyle, recipientName, customerName, importantWords, avoidWords } = req.body;
  const systemInstruction = "Tu es l'auteur-compositeur vedette de VOXMORY. Tu écris des paroles de chansons extrêmement touchantes, poétiques, rythmées et mémorables en Français (avec des touches de Lingala, Tshiluba, Swahili ou Kikongo si le contexte s'y prête). Évite le langage générique ou artificiel. Mets l'humain au centre.";
  const prompt = `Rédige les paroles complètes d'une chanson personnalisée sur-mesure pour ${recipientName || "le destinataire"}.
- Commandé par : ${customerName || "le client"}
- Ambiance demandée : ${mood || "Émotionnelle"}
- Style musical : ${musicStyle || "Rumba congolaise"}
- Mots importants à insérer absolument : ${importantWords || "aucun"}
- Sujets ou mots à éviter : ${avoidWords || "aucun"}

L'histoire brute :
"${storyText || "Histoire d'amour et de respect familial."}"

Structure des paroles :
- Intro parlée ou dédicacée (traditionnelle dans la rumba/afrobeat)
- Couplet 1 (Fondation, enfance, rencontre ou passé)
- Refrain (Saisissant, mémorable, facile à retenir)
- Couplet 2 (Anecdotes drôles, le foufou, les éclats de rire ou épreuves surmontées)
- Pont / Solo musical (Indications)
- Refrain final
- Outro (Bénédiction, vœux d'amour et dédicaces finales)`;

  const result = await runAiPrompt(prompt, systemInstruction);
  res.json({ text: result });
});

// 5. Generate Suno prompt
app.post('/api/admin/ai/generate-suno-prompt', async (req, res) => {
  const { musicStyle, mood } = req.body;
  const systemInstruction = "Tu es un ingénieur du son expert en outils d'IA musicale (Suno, Udio).";
  const prompt = `Génère le prompt de style de musique parfait (en anglais, de moins de 120 caractères) pour une chanson au style "${musicStyle || "Rumba congolaise"}" et d'humeur "${mood || "Émotionnelle"}". Indique également un prompt de paroles optimisé pour le rendu.`;

  const result = await runAiPrompt(prompt, systemInstruction);
  res.json({ text: result });
});

// 6. Generate cover image prompt
app.post('/api/admin/ai/generate-cover-prompt', async (req, res) => {
  const { recipientName, occasion, mood } = req.body;
  const systemInstruction = "Tu es directeur artistique visuel pour VOXMORY. Tu conçois des pochettes d'albums somptueuses.";
  const prompt = `Génère un prompt de génération d'image ultra-détaillé et premium pour créer la pochette de l'album de cette chanson. L'occasion est : "${occasion || "Anniversaire"}", l'ambiance est : "${mood || "Luxe / Émotionnel"}". Le style visuel doit être : Luxe Africain Cinématique, tons or blanc et noir profond, lumière dorée chaleureuse, évocateur de musique et d'amour, sans texte déformé.`;

  const result = await runAiPrompt(prompt, systemInstruction);
  res.json({ text: result });
});

// 7. Generate video prompt
app.post('/api/admin/ai/generate-video-prompt', async (req, res) => {
  const { occasion, mood } = req.body;
  const systemInstruction = "Tu es réalisateur vidéo pour VOXMORY. Tu crées des clips vidéo cinématiques de luxe.";
  const prompt = `Crée un prompt vidéo haut de gamme pour l'outil de génération vidéo Veo pour illustrer la chanson. Thème : "${occasion || "Célébration"}", Ambiance : "${mood || "Inspirant / Rumba"}". Décris les mouvements de caméra lents, les transitions, l'esthétique lumineuse luxueuse d'un studio ou d'une scène de vie chaleureuse en Afrique.`;

  const result = await runAiPrompt(prompt, systemInstruction);
  res.json({ text: result });
});

// 8. Generate delivery WhatsApp message
app.post('/api/admin/ai/generate-whatsapp', async (req, res) => {
  const { customerName, recipientName, orderId, memoryPageUrl } = req.body;
  const systemInstruction = "Tu es le responsable relation client de VOXMORY. Tu t'exprimes de manière extrêmement polie, chaleureuse, humaine et enthousiaste.";
  const prompt = `Rédige un message de livraison WhatsApp somptueux en Français pour le client nommé ${customerName || "Sarah"}. 
Il vient de recevoir la chanson personnalisée pour ${recipientName || "Georgette"}. Le numéro de commande est ${orderId || "VOX-2026-X"}. La page souvenir privée est disponible ici : ${memoryPageUrl || "Lien de la page"}.
Utilise des émojis judicieusement, rends le message très chaleureux et encourageant.`;

  const result = await runAiPrompt(prompt, systemInstruction);
  res.json({ text: result });
});

// 9. Generate testimonial request message
app.post('/api/admin/ai/generate-testimonial', async (req, res) => {
  const { customerName, recipientName } = req.body;
  const systemInstruction = "Tu es responsable de la satisfaction client de VOXMORY.";
  const prompt = `Rédige un message WhatsApp amical et attentionné pour ${customerName || "Sarah"} pour lui demander comment s'est passée la surprise pour ${recipientName || "Georgette"}. Demande-lui poliment s'il est possible de nous laisser un avis en 1 minute sur notre site.`;

  const result = await runAiPrompt(prompt, systemInstruction);
  res.json({ text: result });
});

// 10. Generate follow-up message for future events
app.post('/api/admin/ai/generate-followup', async (req, res) => {
  const { customerName, eventName, relationship, eventDate } = req.body;
  const systemInstruction = "Tu es l'assistant de relance relationnelle de VOXMORY.";
  const prompt = `Rédige un message de relance chaleureux pour ${customerName || "Sarah"} qui a commandé une chanson par le passé. 
Nous approchons de la date du prochain événement : "${eventName || "Anniversaire"}" de son/sa "${relationship || "frère"}" le ${eventDate || "bientôt"}. Propose-lui de s'y prendre à l'avance pour lui composer un souvenir éternel en musique avec une petite offre exclusive de fidélité.`;

  const result = await runAiPrompt(prompt, systemInstruction);
  res.json({ text: result });
});

// 11. Upload file (Audio/Image) directly to the server
app.post('/api/upload', (req, res) => {
  const { fileName, fileType, base64Data } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: "Aucun fichier fourni." });
  }

  try {
    let pureBase64 = base64Data;
    if (base64Data.includes(';base64,')) {
      pureBase64 = base64Data.split(';base64,')[1];
    }

    const buffer = Buffer.from(pureBase64, 'base64');
    
    // Create a safe, unique filename
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);
    
    fs.writeFileSync(filePath, buffer);

    // Asynchronously back up file chunks to Firestore in the background
    backupToFirestore(safeName, fileType || 'audio/mpeg', buffer).catch(backupErr => {
      console.error('[Upload API] Background backup failed:', backupErr);
    });
    
    const fileUrl = `/uploads/${safeName}`;
    res.json({ url: fileUrl });
  } catch (err) {
    console.error('Error saving file upload:', err);
    res.status(500).json({ error: "Erreur lors de la sauvegarde du fichier." });
  }
});

// ==========================================
// SEO SITEMAP & ROBOTS.TXT
// ==========================================

app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Static pages
  const staticPaths = ['', '#home', '#order', '#gallery', '#reviews', '#pricing', '#tracking'];
  staticPaths.forEach(path => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/${path}</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>${path === '' || path === '#home' ? '1.0' : '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  });
  
  // Dynamic Souvenir / Memory Pages (from cloud firestore / local sync)
  try {
    const memoryPages = serverDb.getMemoryPages() || [];
    memoryPages.forEach(p => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/#memory/${p.id}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });
  } catch (e) {
    console.error('Error adding memory pages to sitemap:', e);
  }
  
  xml += `</urlset>`;
  res.send(xml);
});

app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.send(`User-agent: *\nAllow: /\nDisallow: /api/admin/*\nDisallow: /#admin\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

// ==========================================
// VITE OR STATIC SERVER MIDDLEWARE
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
    
    // SPA Fallback
    app.get('*', (req, res, next) => {
      // Don't intercept API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      vite.transformIndexHtml(req.url, '').then(html => {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      }).catch(next);
    });
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VOXMORY SERVER] Running on http://localhost:${PORT}`);
  });
}

start();
