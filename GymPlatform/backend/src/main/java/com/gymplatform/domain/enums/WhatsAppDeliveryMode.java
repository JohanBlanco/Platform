package com.gymplatform.domain.enums;

/**
 * Cómo se entregan los mensajes de WhatsApp del gimnasio.
 * <ul>
 *   <li>{@link #WA_ME} — abre wa.me en el navegador (sesión WhatsApp Web).</li>
 *   <li>{@link #CLOUD_API} — envío server-side con Meta Cloud API.</li>
 * </ul>
 */
public enum WhatsAppDeliveryMode {
    WA_ME,
    CLOUD_API
}
