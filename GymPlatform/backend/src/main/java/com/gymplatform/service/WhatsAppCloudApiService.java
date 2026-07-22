package com.gymplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymplatform.exception.BusinessException;
import com.gymplatform.service.BroadcastSettingsService.WhatsAppCloudCredentials;
import com.gymplatform.util.WhatsAppPhoneHelper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Cliente Meta WhatsApp Cloud API alineado al collection de Postman:
 * {@code POST /{{Version}}/{{Phone-Number-ID}}/messages} y {@code /media}.
 */
@Service
public class WhatsAppCloudApiService {

    private final BroadcastSettingsService broadcastSettingsService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public WhatsAppCloudApiService(
            BroadcastSettingsService broadcastSettingsService,
            ObjectMapper objectMapper) {
        this.broadcastSettingsService = broadcastSettingsService;
        this.objectMapper = objectMapper;
    }

    public String sendText(Long organizationId, String recipientPhone, String body) {
        return sendText(organizationId, recipientPhone, body, true);
    }

    public String sendText(Long organizationId, String recipientPhone, String body, boolean previewUrl) {
        WhatsAppCloudCredentials creds = requireCredentials(organizationId);
        Map<String, Object> text = new LinkedHashMap<>();
        text.put("preview_url", previewUrl);
        text.put("body", body);
        Map<String, Object> payload = basePayload(recipientPhone, "text");
        payload.put("text", text);
        return postMessage(creds, payload);
    }

    public String sendImageByLink(
            Long organizationId,
            String recipientPhone,
            String imageUrl,
            String caption) {
        WhatsAppCloudCredentials creds = requireCredentials(organizationId);
        Map<String, Object> image = new LinkedHashMap<>();
        image.put("link", imageUrl);
        if (caption != null && !caption.isBlank()) {
            image.put("caption", caption);
        }
        Map<String, Object> payload = basePayload(recipientPhone, "image");
        payload.put("image", image);
        return postMessage(creds, payload);
    }

    public String sendDocumentByLink(
            Long organizationId,
            String recipientPhone,
            String documentUrl,
            String filename,
            String caption) {
        WhatsAppCloudCredentials creds = requireCredentials(organizationId);
        Map<String, Object> document = new LinkedHashMap<>();
        document.put("link", documentUrl);
        if (filename != null && !filename.isBlank()) {
            document.put("filename", filename);
        }
        if (caption != null && !caption.isBlank()) {
            document.put("caption", caption);
        }
        Map<String, Object> payload = basePayload(recipientPhone, "document");
        payload.put("document", document);
        return postMessage(creds, payload);
    }

    /**
     * Sube el archivo a {@code /PHONE_NUMBER_ID/media} y lo envía como documento por media ID.
     * @return messageId
     */
    public SendMediaResult sendDocumentUpload(
            Long organizationId,
            String recipientPhone,
            byte[] fileBytes,
            String filename,
            String mimeType,
            String caption) {
        WhatsAppCloudCredentials creds = requireCredentials(organizationId);
        String mediaId = uploadMedia(creds, fileBytes, filename, mimeType);
        Map<String, Object> document = new LinkedHashMap<>();
        document.put("id", mediaId);
        if (filename != null && !filename.isBlank()) {
            document.put("filename", filename);
        }
        if (caption != null && !caption.isBlank()) {
            document.put("caption", caption);
        }
        Map<String, Object> payload = basePayload(recipientPhone, "document");
        payload.put("document", document);
        String messageId = postMessage(creds, payload);
        return new SendMediaResult(messageId, mediaId);
    }

    public record SendMediaResult(String messageId, String mediaId) {}

    public String uploadMedia(
            WhatsAppCloudCredentials creds,
            byte[] fileBytes,
            String filename,
            String mimeType) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new BusinessException("El archivo está vacío");
        }
        String name = filename != null && !filename.isBlank() ? filename : "archivo.bin";
        String type = mimeType != null && !mimeType.isBlank() ? mimeType : "application/octet-stream";

        String url = "https://graph.facebook.com/"
                + creds.graphVersion()
                + "/"
                + creds.phoneNumberId()
                + "/media";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(creds.accessToken());
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("messaging_product", "whatsapp");
        form.add("type", type);
        ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return name;
            }
        };
        form.add("file", fileResource);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    url, new HttpEntity<>(form, headers), String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            String id = root.path("id").asText(null);
            if (id == null || id.isBlank()) {
                throw new BusinessException("Cloud API no devolvió media id al subir el archivo");
            }
            return id;
        } catch (BusinessException e) {
            throw e;
        } catch (HttpStatusCodeException e) {
            throw new BusinessException(parseGraphError(e.getResponseBodyAsString()));
        } catch (Exception e) {
            throw new BusinessException("Error al subir media a WhatsApp: " + e.getMessage());
        }
    }

    public byte[] decodeBase64File(String fileBase64) {
        if (fileBase64 == null || fileBase64.isBlank()) {
            throw new BusinessException("Falta el archivo en base64");
        }
        String raw = fileBase64.trim();
        int comma = raw.indexOf(',');
        if (raw.startsWith("data:") && comma > 0) {
            raw = raw.substring(comma + 1);
        }
        try {
            return Base64.getDecoder().decode(raw);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Archivo base64 inválido");
        }
    }

    private Map<String, Object> basePayload(String recipientPhone, String type) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("messaging_product", "whatsapp");
        payload.put("recipient_type", "individual");
        payload.put("to", normalizeRecipient(recipientPhone));
        payload.put("type", type);
        return payload;
    }

    private String postMessage(WhatsAppCloudCredentials creds, Map<String, Object> payload) {
        String url = "https://graph.facebook.com/"
                + creds.graphVersion()
                + "/"
                + creds.phoneNumberId()
                + "/messages";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(creds.accessToken());
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    url, new HttpEntity<>(payload, headers), String.class);
            return extractMessageId(response.getBody());
        } catch (HttpStatusCodeException e) {
            throw new BusinessException(parseGraphError(e.getResponseBodyAsString()));
        } catch (Exception e) {
            throw new BusinessException("Error al llamar a WhatsApp Cloud API: " + e.getMessage());
        }
    }

    private WhatsAppCloudCredentials requireCredentials(Long organizationId) {
        return broadcastSettingsService.resolveCloudCredentials(organizationId)
                .orElseThrow(() -> new BusinessException(
                        "WhatsApp Cloud API no está configurada. Ve a Configuración → WhatsApp Cloud"));
    }

    private static String normalizeRecipient(String phone) {
        String digits = WhatsAppPhoneHelper.toDigitsOnly(phone);
        if (digits == null || digits.length() < 8) {
            throw new BusinessException("Número de WhatsApp del destinatario inválido");
        }
        return digits;
    }

    private String extractMessageId(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode messages = root.path("messages");
            if (messages.isArray() && !messages.isEmpty()) {
                return messages.get(0).path("id").asText(null);
            }
        } catch (Exception ignored) {
            // fall through
        }
        return null;
    }

    private String parseGraphError(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode error = root.path("error");
            if (error.isObject()) {
                String message = error.path("message").asText(null);
                if (message != null && !message.isBlank()) {
                    return "WhatsApp API: " + message;
                }
            }
        } catch (Exception ignored) {
            // fall through
        }
        return "WhatsApp Cloud API rechazó la solicitud";
    }
}
