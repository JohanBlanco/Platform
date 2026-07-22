package com.gymplatform.crypto;

/**
 * Sobre cifrado híbrido (RSA-OAEP-256 + AES-GCM) enviado por el front.
 */
public record EncryptedSecretPayload(
        String alg,
        String keyId,
        String encryptedKey,
        String iv,
        String ciphertext
) {}
