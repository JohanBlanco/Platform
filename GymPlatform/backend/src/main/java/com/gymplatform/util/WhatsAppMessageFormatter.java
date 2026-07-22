package com.gymplatform.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Prepara texto de difusión para WhatsApp:
 * emojis Unicode, negrita estilo WA, variables, markdown y URLs clicables (azul en WA).
 */
public final class WhatsAppMessageFormatter {

    private static final Pattern MARKDOWN_BOLD = Pattern.compile("\\*\\*(.+?)\\*\\*", Pattern.DOTALL);
    private static final Pattern MARKDOWN_IMAGE = Pattern.compile(
            "!\\[([^\\]]*)]\\((https?://[^)\\s]+)\\)", Pattern.CASE_INSENSITIVE);
    private static final Pattern MARKDOWN_LINK = Pattern.compile(
            "\\[([^\\]]+)]\\((https?://[^)\\s]+)\\)", Pattern.CASE_INSENSITIVE);
    private static final Pattern BARE_WWW = Pattern.compile(
            "(?i)(?<![\\w/])www\\.([\\w.-]+\\.[\\w./?#=&%+~\\-]+)");
    private static final Pattern MEDIA_EXT = Pattern.compile(
            "(?i)\\.(png|jpe?g|gif|webp|bmp|svg|pdf|docx?|xlsx?|pptx?|zip|rar|mp4|mov)(\\?.*)?$");
    private static final Pattern FORM_TOKEN = Pattern.compile(
            "\\{\\{form:([a-z0-9-]+)\\}\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern ANY_URL = Pattern.compile(
            "(https?://[^\\s<>\"']+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern BOLD_WRAPPED_URL = Pattern.compile(
            "\\*\\*?(https?://[^\\s*]+)\\*\\*?", Pattern.CASE_INSENSITIVE);
    private static final Pattern IMAGE_EXT = Pattern.compile(
            "(?i)\\.(png|jpe?g|gif|webp|bmp)(\\?.*)?$");

    public record FormattedWhatsAppMessage(String body, List<String> mediaUrls) {}

    private WhatsAppMessageFormatter() {}

    public static String formatForWhatsApp(String raw, String firstName, String gymName) {
        return formatFully(raw, firstName, gymName, null).body();
    }

    public static FormattedWhatsAppMessage formatFully(String raw, String firstName, String gymName) {
        return formatFully(raw, firstName, gymName, null);
    }

    /**
     * @param formUrlResolver recibe el slug del formulario y devuelve URL pública https (o null).
     */
    public static FormattedWhatsAppMessage formatFully(
            String raw,
            String firstName,
            String gymName,
            Function<String, String> formUrlResolver) {
        String text = raw == null ? "" : raw;
        String name = blankTo(firstName, "miembro");
        String gym = blankTo(gymName, "nuestro gimnasio");
        List<String> media = new ArrayList<>();

        text = text.replace("{{nombre}}", name);
        text = text.replace("{{gimnasio}}", gym);
        text = text.replace("[Nombre del Gym]", gym);

        if (formUrlResolver != null) {
            Matcher forms = FORM_TOKEN.matcher(text);
            StringBuffer formBuf = new StringBuffer();
            while (forms.find()) {
                String slug = forms.group(1);
                String url = formUrlResolver.apply(slug);
                String replacement = (url != null && !url.isBlank()) ? url.trim() : forms.group(0);
                forms.appendReplacement(formBuf, Matcher.quoteReplacement(replacement));
            }
            forms.appendTail(formBuf);
            text = formBuf.toString();
        }

        Matcher images = MARKDOWN_IMAGE.matcher(text);
        StringBuffer imgBuf = new StringBuffer();
        while (images.find()) {
            media.add(images.group(2).trim());
            images.appendReplacement(imgBuf, "");
        }
        images.appendTail(imgBuf);
        text = imgBuf.toString();

        Matcher links = MARKDOWN_LINK.matcher(text);
        StringBuffer linkBuf = new StringBuffer();
        while (links.find()) {
            String label = links.group(1).trim();
            String url = links.group(2).trim();
            if (looksLikeMediaUrl(url)) {
                media.add(url);
                links.appendReplacement(linkBuf, Matcher.quoteReplacement(label));
            } else {
                // Link normal: URL sola en su línea → WhatsApp la pinta azul
                String replacement = label.isBlank()
                        ? url
                        : label + "\n" + url;
                links.appendReplacement(linkBuf, Matcher.quoteReplacement(replacement));
            }
        }
        links.appendTail(linkBuf);
        text = linkBuf.toString();

        Matcher bold = MARKDOWN_BOLD.matcher(text);
        text = bold.replaceAll("*$1*");

        // URLs no deben quedar dentro de *negrita* (rompe el link azul en WA)
        text = BOLD_WRAPPED_URL.matcher(text).replaceAll("$1");

        Matcher www = BARE_WWW.matcher(text);
        text = www.replaceAll("https://www.$1");

        text = text.replace("\r\n", "\n").replace('\r', '\n');
        text = text.replaceAll("[ \\t]+\\n", "\n").replaceAll("\\n{3,}", "\n\n").trim();
        text = isolateUrlsForWhatsApp(text);

        return new FormattedWhatsAppMessage(text, distinct(media));
    }

    /**
     * Deja cada URL https en su propia línea cuando va pegada a texto,
     * para que WhatsApp la detecte como link azul.
     */
    public static String isolateUrlsForWhatsApp(String text) {
        if (text == null || text.isBlank()) {
            return text == null ? "" : text;
        }
        Matcher m = ANY_URL.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String url = stripTrailingPunctuation(m.group(1));
            m.appendReplacement(sb, Matcher.quoteReplacement("\n" + url + "\n"));
        }
        m.appendTail(sb);
        return sb.toString()
                .replaceAll("\\n{3,}", "\n\n")
                .replaceAll("[ \\t]+\\n", "\n")
                .trim();
    }

    public static String appendMediaLinks(String body, Iterable<String> links) {
        StringBuilder sb = new StringBuilder(body == null ? "" : body.trim());
        if (links == null) {
            return sb.toString();
        }
        Set<String> seen = new LinkedHashSet<>();
        // Evitar duplicar URLs ya presentes en el cuerpo
        Matcher existing = ANY_URL.matcher(sb.toString());
        while (existing.find()) {
            seen.add(existing.group(1).toLowerCase());
        }
        for (String link : links) {
            if (link == null || link.isBlank()) {
                continue;
            }
            String url = link.trim();
            if (url.startsWith("www.")) {
                url = "https://" + url;
            }
            if (!seen.add(url.toLowerCase())) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append("\n\n");
            }
            sb.append(url);
        }
        return sb.toString().trim();
    }

    public static boolean isImageUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        try {
            java.net.URI uri = java.net.URI.create(url.trim());
            String path = uri.getPath() != null ? uri.getPath() : "";
            return IMAGE_EXT.matcher(path).find();
        } catch (Exception ex) {
            return IMAGE_EXT.matcher(url).find();
        }
    }

    public static boolean looksLikeMediaUrl(String url) {
        try {
            java.net.URI uri = java.net.URI.create(url);
            String path = uri.getPath() != null ? uri.getPath() : "";
            if (MEDIA_EXT.matcher(path).find()) {
                return true;
            }
            String host = uri.getHost() != null ? uri.getHost().toLowerCase() : "";
            return host.contains("drive.google.com")
                    || host.contains("dropbox.com")
                    || host.contains("docs.google.com")
                    || host.contains("onedrive.live.com")
                    || host.contains("imgur.com")
                    || host.contains("cloudinary.com");
        } catch (Exception ex) {
            return MEDIA_EXT.matcher(url).find();
        }
    }

    private static String stripTrailingPunctuation(String url) {
        return url.replaceAll("[),.;!?]+$", "");
    }

    private static List<String> distinct(List<String> urls) {
        Set<String> seen = new LinkedHashSet<>();
        List<String> out = new ArrayList<>();
        for (String url : urls) {
            if (url == null || url.isBlank()) {
                continue;
            }
            String trimmed = url.trim();
            if (seen.add(trimmed.toLowerCase())) {
                out.add(trimmed);
            }
        }
        return out;
    }

    private static String blankTo(String value, String fallback) {
        return value != null && !value.isBlank() ? value.trim() : fallback;
    }
}
