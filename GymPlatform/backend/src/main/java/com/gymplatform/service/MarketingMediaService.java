package com.gymplatform.service;

import com.gymplatform.dto.MediaUploadResponse;
import com.gymplatform.exception.BusinessException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MarketingMediaService {

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final long MAX_BYTES = 4L * 1024 * 1024;

    @Value("${app.uploads.dir:./data/uploads}")
    private String uploadsDir;

    public MediaUploadResponse store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Selecciona una imagen");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException("La imagen no puede superar 4 MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED.contains(contentType)) {
            throw new BusinessException("Solo se permiten imágenes JPG, PNG, WEBP o GIF");
        }

        String ext = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };

        try {
            Path dir = Paths.get(uploadsDir, "marketing").toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String filename = UUID.randomUUID().toString().replace("-", "") + ext;
            Path target = dir.resolve(filename);
            file.transferTo(target);
            return new MediaUploadResponse("/uploads/marketing/" + filename);
        } catch (IOException ex) {
            throw new BusinessException("No se pudo guardar la imagen");
        }
    }
}
