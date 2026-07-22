package com.gymplatform.crypto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymplatform.exception.BusinessException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;

/**
 * Cifrado de secretos de WhatsApp Cloud API:
 * <ul>
 *   <li>Tránsito: híbrido RSA-OAEP-256 + AES-GCM (el front cifra con la clave pública).</li>
 *   <li>Reposo: AES-GCM con clave maestra del servidor ({@code app.secrets.encryption-key}).</li>
 * </ul>
 * Los secretos nunca se devuelven en claro al cliente.
 */
@Service
public class SecretsCryptoService {

    private static final String TRANSIT_ALG = "RSA-OAEP-256+AES-GCM";
    private static final String AT_REST_PREFIX = "enc:v1:";
    private static final int GCM_TAG_BITS = 128;
    private static final int GCM_IV_BYTES = 12;
    private static final int AES_KEY_BITS = 256;

    private final ObjectMapper objectMapper;
    private final String masterKeyMaterial;
    private final Path transitPrivateKeyPath;

    private SecretKey atRestKey;
    private KeyPair transitKeyPair;
    private String transitPublicKeyPem;
    private String transitKeyId;

    public SecretsCryptoService(
            ObjectMapper objectMapper,
            @Value("${app.secrets.encryption-key:}") String masterKeyMaterial,
            @Value("${app.secrets.transit-key-path:./data/whatsapp-transit-rsa.pkcs8}") String transitKeyPath
    ) {
        this.objectMapper = objectMapper;
        this.masterKeyMaterial = masterKeyMaterial;
        this.transitPrivateKeyPath = Path.of(transitKeyPath);
    }

    @PostConstruct
    void init() throws Exception {
        this.atRestKey = deriveAesKey(resolveMasterKeyMaterial());
        this.transitKeyPair = loadOrCreateTransitKeyPair();
        this.transitPublicKeyPem = toPem("PUBLIC KEY", transitKeyPair.getPublic().getEncoded());
        this.transitKeyId = shortFingerprint(transitKeyPair.getPublic().getEncoded());
    }

    public String getTransitPublicKeyPem() {
        return transitPublicKeyPem;
    }

    public String getTransitKeyId() {
        return transitKeyId;
    }

    public String getTransitAlg() {
        return TRANSIT_ALG;
    }

    /** Cifra texto plano para guardar en BD. */
    public String encryptAtRest(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            return null;
        }
        try {
            byte[] iv = new byte[GCM_IV_BYTES];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, atRestKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] cipherBytes = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + cipherBytes.length);
            buffer.put(iv);
            buffer.put(cipherBytes);
            return AT_REST_PREFIX + Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new BusinessException("No se pudo cifrar el secreto para almacenamiento");
        }
    }

    /** Descifra valor de BD (soporta legado en claro sin prefijo). */
    public String decryptAtRest(String stored) {
        if (stored == null || stored.isBlank()) {
            return null;
        }
        if (!stored.startsWith(AT_REST_PREFIX)) {
            return stored;
        }
        try {
            byte[] raw = Base64.getDecoder().decode(stored.substring(AT_REST_PREFIX.length()));
            ByteBuffer buffer = ByteBuffer.wrap(raw);
            byte[] iv = new byte[GCM_IV_BYTES];
            buffer.get(iv);
            byte[] cipherBytes = new byte[buffer.remaining()];
            buffer.get(cipherBytes);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, atRestKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new BusinessException("No se pudo descifrar un secreto almacenado. Revisa app.secrets.encryption-key");
        }
    }

    /**
     * Descifra el sobre híbrido enviado por el front.
     * Contenido esperado: JSON {@code { "accessToken"?, "appSecret"?, "verifyToken"? }}.
     */
    public Map<String, String> decryptTransitSecrets(EncryptedSecretPayload payload) {
        if (payload == null) {
            return Map.of();
        }
        if (payload.alg() != null && !payload.alg().isBlank() && !TRANSIT_ALG.equals(payload.alg())) {
            throw new BusinessException("Algoritmo de cifrado no soportado: " + payload.alg());
        }
        if (payload.keyId() != null && !payload.keyId().isBlank() && !transitKeyId.equals(payload.keyId())) {
            throw new BusinessException("La clave pública de cifrado expiró. Recarga la página e inténtalo de nuevo");
        }
        try {
            byte[] aesKeyBytes = rsaDecrypt(Base64.getDecoder().decode(payload.encryptedKey()));
            SecretKey aesKey = new SecretKeySpec(aesKeyBytes, "AES");
            byte[] iv = Base64.getDecoder().decode(payload.iv());
            byte[] cipherBytes = Base64.getDecoder().decode(payload.ciphertext());
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            String json = new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
            Map<String, String> map = objectMapper.readValue(json, new TypeReference<>() {});
            return map != null ? map : Map.of();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("No se pudieron descifrar las credenciales enviadas");
        }
    }

    private byte[] rsaDecrypt(byte[] encryptedKey) throws Exception {
        Cipher rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        OAEPParameterSpec oaep = new OAEPParameterSpec(
                "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
        rsa.init(Cipher.DECRYPT_MODE, transitKeyPair.getPrivate(), oaep);
        return rsa.doFinal(encryptedKey);
    }

    private String resolveMasterKeyMaterial() {
        if (masterKeyMaterial != null && !masterKeyMaterial.isBlank()) {
            return masterKeyMaterial.trim();
        }
        // Fallback de desarrollo: derivar de JWT secret (cambiar en producción).
        return "GymPlatformWhatsAppSecretsDevKey-ChangeMe!!";
    }

    private static SecretKey deriveAesKey(String material) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(material.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(hash, "AES");
    }

    private KeyPair loadOrCreateTransitKeyPair() throws Exception {
        if (Files.exists(transitPrivateKeyPath)) {
            byte[] pkcs8 = Files.readAllBytes(transitPrivateKeyPath);
            PrivateKey privateKey = KeyFactory.getInstance("RSA")
                    .generatePrivate(new PKCS8EncodedKeySpec(pkcs8));
            // Recover public from private is not trivial for RSA without CRT params in all cases;
            // store both: if only private exists, regenerate pair.
            Path publicPath = publicKeySibling(transitPrivateKeyPath);
            if (Files.exists(publicPath)) {
                byte[] x509 = Files.readAllBytes(publicPath);
                PublicKey publicKey = KeyFactory.getInstance("RSA")
                        .generatePublic(new X509EncodedKeySpec(x509));
                return new KeyPair(publicKey, privateKey);
            }
        }
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        KeyPair pair = gen.generateKeyPair();
        Files.createDirectories(transitPrivateKeyPath.getParent());
        Files.write(transitPrivateKeyPath, pair.getPrivate().getEncoded());
        Files.write(publicKeySibling(transitPrivateKeyPath), pair.getPublic().getEncoded());
        return pair;
    }

    private static Path publicKeySibling(Path privatePath) {
        String name = privatePath.getFileName().toString();
        String pubName = name.endsWith(".pkcs8")
                ? name.replace(".pkcs8", ".x509")
                : name + ".x509";
        return privatePath.resolveSibling(pubName);
    }

    private static String toPem(String type, byte[] der) {
        String b64 = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.US_ASCII)).encodeToString(der);
        return "-----BEGIN " + type + "-----\n" + b64 + "\n-----END " + type + "-----";
    }

    private static String shortFingerprint(byte[] der) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(der);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hash).substring(0, 16);
    }

    /** Utilidad de test/local: cifra un secreto en tránsito (solo backend). */
    public EncryptedSecretPayload encryptTransitForTests(Map<String, String> secrets) {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance("AES");
            keyGen.init(AES_KEY_BITS);
            SecretKey aesKey = keyGen.generateKey();
            byte[] iv = new byte[GCM_IV_BYTES];
            new SecureRandom().nextBytes(iv);
            Cipher aes = Cipher.getInstance("AES/GCM/NoPadding");
            aes.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] cipherBytes = aes.doFinal(objectMapper.writeValueAsBytes(secrets));

            Cipher rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            OAEPParameterSpec oaep = new OAEPParameterSpec(
                    "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
            rsa.init(Cipher.ENCRYPT_MODE, transitKeyPair.getPublic(), oaep);
            byte[] encryptedKey = rsa.doFinal(aesKey.getEncoded());

            return new EncryptedSecretPayload(
                    TRANSIT_ALG,
                    transitKeyId,
                    Base64.getEncoder().encodeToString(encryptedKey),
                    Base64.getEncoder().encodeToString(iv),
                    Base64.getEncoder().encodeToString(cipherBytes)
            );
        } catch (Exception e) {
            throw new BusinessException("No se pudo cifrar el sobre de prueba");
        }
    }
}
