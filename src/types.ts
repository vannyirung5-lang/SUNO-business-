export type OrderStatus =
  | 'Nouvelle'
  | 'En cours'
  | 'Terminée'
  | 'Livrée'
  | 'Annulée'
  | 'Commande reçue'
  | 'En attente de paiement'
  | 'Histoire reçue'
  | 'Paroles en préparation'
  | 'Chanson en production'
  | 'En révision'
  | 'Archivée';

export type PaymentStatus =
  | 'Unpaid'
  | 'Pending confirmation'
  | 'Paid'
  | 'Refunded';

export interface Package {
  id: string;
  name: string;
  promise: string;
  includes: string[];
  price: string; // e.g., "75 $" or "150 $"
  deliveryTime: string; // e.g., "48 heures"
}

export interface Order {
  id: string; // e.g., VOX-2026-001
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Customer info
  customerName: string;
  customerWhatsApp: string;
  customerCity: string;
  customerCountry: string;
  customerEmail?: string;
  acceptsWhatsApp?: boolean;
  
  // Recipient info
  recipientName: string;
  recipientRelationship: string;
  recipientAge?: string;
  eventDate?: string;
  
  // Story Details
  storyOption: 'write' | 'audio' | 'whatsapp';
  storyText?: string;
  uploadedAudioUrl?: string; // base64 or file path
  uploadedAudioFilename?: string;
  uploadedPhotoUrl?: string; // base64 or file path
  importantWords?: string;
  avoidWords?: string;
  occasion?: string;
  
  // Musical choices
  mood: string;
  musicStyle: string;
  packageId: string;
  vipCardSelected?: boolean;
  
  // Delivery
  desiredDeliveryDate: string;
  urgency: 'normal' | 'express' | 'super_express';
  specialInstructions?: string;
  
  // Admin Notes & Output
  adminNotes?: string;
  finalAudioUrl?: string;
  coverImageUrl?: string;
  memoryPageId?: string; // UUID of generated private memory page
  songTitle?: string;
  clientFirstName?: string;
  clientName?: string;
  finalLyrics?: string;
}

export interface GallerySong {
  id: string;
  title: string;
  occasion: string;
  style: string;
  language: string;
  mood: string;
  description: string;
  audioUrl: string;
  coverUrl: string;
  clientReaction?: string;
  visibility: 'Private' | 'Public with first name' | 'Public anonymous' | 'Demo only';
  clientFirstName?: string;
  createdAt: string;
  startTime?: number; // start trimming in seconds
  endTime?: number;   // end trimming in seconds
  memorySlug?: string; // custom/private memory page slug
  isFeatured?: boolean; // highlight song as a "Chanson vedette"
}

export interface PromotionSettings {
  text: string;
  isActive: boolean;
  bannerStyle: 'marquee' | 'pulse' | 'gold-gradient' | 'classic';
  linkText?: string;
  linkUrl?: string;
}

export interface ClientReview {
  id: string;
  rating: number; // 1-5 stars
  clientName: string;
  occasion: string;
  comment: string;
  screenshotUrl?: string;
  audioTestimonialUrl?: string;
  date: string;
  approved: boolean;
}

export interface MemoryPage {
  id: string; // shareable Slug/ID
  orderId: string;
  eventTitle: string;
  recipientName: string;
  recipientPhotoUrl?: string;
  personalMessage: string;
  audioUrl: string;
  coverUrl: string;
  createdAt: string;
  songTitle?: string;
  senderName?: string;
  occasion?: string;
  lyrics?: string;
  photoUrl?: string;
}

export interface EventReminder {
  id: string;
  customerName: string;
  customerWhatsApp: string;
  eventName: string;
  eventDate: string;
  relationship: string;
}

export interface DashboardStats {
  totalSongsDelivered: number;
  clientSatisfaction: number; // e.g., 98.7
  averageRating: number; // e.g., 4.9
  totalOrdersCount: number;
  visitsCount: number;
  listensCount: number;
}

export interface BroadcastContact {
  id: string;
  name: string;
  whatsApp: string;
  category: string; // e.g. "Client", "Prospect", "Rumba", "Mariage"
  addedAt: string;
}

export interface BroadcastList {
  id: string;
  name: string;
  description: string;
  contacts: BroadcastContact[];
  createdAt: string;
}

export interface BroadcastCampaign {
  id: string;
  title: string;
  messageTemplate: string;
  targetListId: string;
  targetListName: string;
  status: 'Brouillon' | 'En cours' | 'Envoyé';
  sentCount: number;
  totalCount: number;
  sentAt?: string;
  logs: { contactName: string; whatsApp: string; status: 'Succès' | 'Échoué'; time: string; messageText?: string; waUrl?: string }[];
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  visits: number;
  listens: number;
  orders: number;
}
