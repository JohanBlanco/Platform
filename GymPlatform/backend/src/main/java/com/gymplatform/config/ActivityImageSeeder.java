package com.gymplatform.config;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Descarga (si hace falta) imágenes de demostración 1600×900 para actividades.
 */
@Component
public class ActivityImageSeeder {

    private static final Logger log = LoggerFactory.getLogger(ActivityImageSeeder.class);

    private static final Map<String, String> SOURCES = new LinkedHashMap<>();

    static {
        SOURCES.put("promo-boxeo.jpg",
                "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&h=900&q=80");
        SOURCES.put("promo-zumba.jpg",
                "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&h=900&q=80");
        SOURCES.put("promo-funcional.jpg",
                "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1600&h=900&q=80");
        SOURCES.put("promo-spinning.jpg",
                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&h=900&q=80");
        SOURCES.put("promo-yoga.jpg",
                "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1600&h=900&q=80");
        SOURCES.put("promo-hiit.jpg",
                "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&h=900&q=80");
        SOURCES.put("promo-pilates.jpg",
                "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&h=900&q=70");
        SOURCES.put("promo-crossfit.jpg",
                "https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=1600&h=900&q=80");
    }

    @Value("${app.uploads.dir:./data/uploads}")
    private String uploadsDir;

    public void ensureDemoImages() {
        Path dir = Paths.get(uploadsDir, "marketing").toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
        } catch (Exception ex) {
            log.warn("No se pudo crear carpeta de imágenes de actividades: {}", ex.getMessage());
            return;
        }

        // Reutilizar descargas previas en tmp/ si existen
        Path tmp = dir.resolve("tmp");
        copyIfPresent(tmp.resolve("boxeo.jpg"), dir.resolve("promo-boxeo.jpg"));
        copyIfPresent(tmp.resolve("zumba.jpg"), dir.resolve("promo-zumba.jpg"));
        copyIfPresent(tmp.resolve("funcional.jpg"), dir.resolve("promo-funcional.jpg"));

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
        for (Map.Entry<String, String> entry : SOURCES.entrySet()) {
            Path target = dir.resolve(entry.getKey());
            if (Files.isRegularFile(target) && fileSizeOk(target)) {
                continue;
            }
            try {
                HttpRequest request = HttpRequest.newBuilder(URI.create(entry.getValue()))
                        .timeout(Duration.ofSeconds(20))
                        .header("User-Agent", "GymPlatform/1.0")
                        .GET()
                        .build();
                HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    try (InputStream in = response.body()) {
                        Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                    }
                    log.info("Imagen de actividad lista: {}", target.getFileName());
                } else {
                    log.warn("No se pudo descargar {}: HTTP {}", entry.getKey(), response.statusCode());
                }
            } catch (Exception ex) {
                log.warn("No se pudo descargar {}: {}", entry.getKey(), ex.getMessage());
            }
        }
    }

    public String urlFor(String filename) {
        return "/uploads/marketing/" + filename;
    }

    private static void copyIfPresent(Path from, Path to) {
        try {
            if (Files.isRegularFile(from) && (!Files.isRegularFile(to) || !fileSizeOk(to))) {
                Files.copy(from, to, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception ignored) {
            // best-effort
        }
    }

    private static boolean fileSizeOk(Path path) {
        try {
            return Files.size(path) > 10_000;
        } catch (Exception ex) {
            return false;
        }
    }
}
