import { Request, Response } from 'express';

/**
 * Helper to clean and format phone numbers for OpenWA.
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone.endsWith('@c.us')) {
    cleanPhone = `${cleanPhone}@c.us`;
  }
  return cleanPhone;
}

/**
 * Safely sends a WhatsApp message using the server-side environment variables via the OpenWA self-hosted API.
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  try {
    const apiURL = process.env.OPENWA_URL;
    const apiKey = process.env.OPENWA_API_KEY;
    const sessionId = process.env.OPENWA_SESSION_ID;
    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;

    // Guard to ensure environment variables are present and check if they are defaults
    if (!apiURL || !apiKey || !sessionId || !adminPhone) {
      console.error(
        "[WhatsApp OpenWA] Configuration error: Missing environment variables (OPENWA_URL, OPENWA_API_KEY, OPENWA_SESSION_ID, or ADMIN_WHATSAPP_NUMBER)."
      );
      return false;
    }

    if (!phone || !message) {
      console.warn("[WhatsApp OpenWA] Warning: Phone number or message content is empty.");
      return false;
    }

    const cleanPhone = formatPhoneNumber(phone);
    if (cleanPhone.length < 9) { // Needs at least country code + numbers + @c.us (e.g. 243000000@c.us)
      console.error(`[WhatsApp OpenWA] Invalid clean phone format for: "${phone}"`);
      return false;
    }

    const endpoint = `${apiURL}/sessions/${sessionId}/messages/send-text`;
    console.log(`[WhatsApp OpenWA] Sending notification securely to ${cleanPhone}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        chatId: cleanPhone,
        text: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[WhatsApp OpenWA] OpenWA API Error (HTTP ${response.status}): ${errorText}`
      );
      return false;
    }

    const responseData = await response.json();
    console.log(`[WhatsApp OpenWA] Message successfully sent to ${cleanPhone}`, responseData);
    return true;
  } catch (error) {
    console.error("[WhatsApp OpenWA] Critical connection error while sending message:", error);
    return false;
  }
}

/**
 * API Route Handler to securely send a notification message.
 * URL: POST /api/whatsapp/secure-send
 */
export async function handleSendNotification(req: Request, res: Response) {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: "Paramètres requis manquants : 'phone' et 'message' doivent être fournis."
      });
    }

    const apiURL = process.env.OPENWA_URL;
    const apiKey = process.env.OPENWA_API_KEY;
    const sessionId = process.env.OPENWA_SESSION_ID;

    const isPlaceholder = 
      !apiURL || !apiKey || !sessionId ||
      apiURL.includes("MON-DOMAINE-OPENWA") || 
      apiKey.includes("MA_CLE_API") || 
      sessionId.includes("MA_SESSION");

    if (isPlaceholder) {
      return res.status(400).json({
        success: false,
        error: "Veuillez configurer de vraies informations de connexion OpenWA (OPENWA_URL, OPENWA_API_KEY, OPENWA_SESSION_ID) dans les variables d'environnement de votre serveur."
      });
    }

    const success = await sendWhatsAppMessage(phone, message);

    if (success) {
      return res.status(200).json({
        success: true,
        message: "Notification WhatsApp envoyée avec succès."
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Échec de l'envoi de la notification. Veuillez vérifier votre connexion et configuration OpenWA."
      });
    }
  } catch (error: any) {
    console.error("[WhatsApp Handler] Error processing secure-send route:", error);
    return res.status(500).json({
      success: false,
      error: "Une erreur interne est survenue lors de l'envoi de la notification."
    });
  }
}

/**
 * API Route Handler to send a quick test message to the configured Admin number.
 * URL: POST /api/whatsapp/secure-test
 */
export async function handleTestNotification(req: Request, res: Response) {
  try {
    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
    
    if (!adminPhone) {
      return res.status(400).json({
        success: false,
        error: "Le numéro d'administrateur (ADMIN_WHATSAPP_NUMBER) n'est pas configuré sur le serveur."
      });
    }

    const apiURL = process.env.OPENWA_URL;
    const apiKey = process.env.OPENWA_API_KEY;
    const sessionId = process.env.OPENWA_SESSION_ID;

    const isPlaceholder = 
      !apiURL || !apiKey || !sessionId ||
      apiURL.includes("MON-DOMAINE-OPENWA") || 
      apiKey.includes("MA_CLE_API") || 
      sessionId.includes("MA_SESSION");

    if (isPlaceholder) {
      return res.status(400).json({
        success: false,
        error: "Veuillez configurer vos paramètres d'intégration de l'API OpenWA (OPENWA_URL, OPENWA_API_KEY, OPENWA_SESSION_ID) dans les Secrets d'AI Studio."
      });
    }

    const testMessage = `[VOXMORY SECURE TEST] L'intégration de l'API OpenWA fonctionne parfaitement en toute sécurité. Heure locale: ${new Date().toLocaleString()}`;
    const success = await sendWhatsAppMessage(adminPhone, testMessage);

    if (success) {
      return res.status(200).json({
        success: true,
        message: `Message de test envoyé avec succès à l'administrateur (${adminPhone}).`
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Échec de l'envoi du message de test. Vérifiez que votre serveur OpenWA est en ligne, accessible et actif."
      });
    }
  } catch (error: any) {
    console.error("[WhatsApp Handler] Error processing secure-test route:", error);
    return res.status(500).json({
      success: false,
      error: "Une erreur interne s'est produite lors du test d'intégration."
    });
  }
}
