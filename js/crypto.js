/**
 * ATI SLIATE Unofficial Results Portal - Cryptography Module
 * Client-side SHA-256 hashing and AES-256-GCM decryption using the Web Crypto API.
 */

const PortalCrypto = (() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  /**
   * Helper: Convert ArrayBuffer or Uint8Array to lowercase hex string
   */
  function bytesToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  }

  /**
   * Helper: Convert hex string to Uint8Array
   */
  function hexToBytes(hexString) {
    if (!hexString || typeof hexString !== "string") {
      throw new Error("Invalid hex string supplied.");
    }
    const cleanHex = hexString.trim();
    if (cleanHex.length % 2 !== 0) {
      throw new Error("Invalid hex string length.");
    }
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Normalizes an index number string (trimmed, uppercase, single spaces/slashes)
   */
  function normalizeIndex(rawIndex) {
    if (!rawIndex || typeof rawIndex !== "string") return "";
    return rawIndex.trim().toUpperCase().replace(/\s+/g, "");
  }

  /**
   * Computes the SHA-256 hash used as the encrypted file's filename
   * Hash = SHA-256(SALT + ":" + NORMALIZED_INDEX)
   */
  async function computeIndexHash(indexNumber) {
    const normalized = normalizeIndex(indexNumber);
    if (!normalized) {
      throw new Error("Index number is required.");
    }
    const message = `${CONFIG.salt}:${normalized}`;
    const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(message));
    return bytesToHex(hashBuffer);
  }

  /**
   * Derives a 256-bit AES-GCM CryptoKey from the index number using PBKDF2
   */
  async function deriveAesKey(normalizedIndex) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(normalizedIndex),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const saltBytes = enc.encode(`${CONFIG.salt}_KEY`);

    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: 10000,
        hash: "SHA-256"
      },
      baseKey,
      {
        name: "AES-GCM",
        length: 256
      },
      false,
      ["decrypt"]
    );
  }

  /**
   * Decrypts an encrypted payload JSON object:
   * payload = { v: 1, iv: "hex...", tag: "hex...", data: "hex..." }
   */
  async function decryptStudentData(payload, indexNumber) {
    const normalized = normalizeIndex(indexNumber);
    if (!normalized) {
      throw new Error("Index number is required for decryption.");
    }

    if (!payload || !payload.iv || !payload.tag || !payload.data) {
      throw new Error("Encrypted record structure is invalid.");
    }

    const ivBytes = hexToBytes(payload.iv);
    const tagBytes = hexToBytes(payload.tag);
    const ciphertextBytes = hexToBytes(payload.data);

    // In Web Crypto API, AES-GCM expects the authentication tag appended to the ciphertext
    const combinedData = new Uint8Array(ciphertextBytes.length + tagBytes.length);
    combinedData.set(ciphertextBytes, 0);
    combinedData.set(tagBytes, ciphertextBytes.length);

    // Derive key from the user's input index number
    const aesKey = await deriveAesKey(normalized);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ivBytes,
          tagLength: 128
        },
        aesKey,
        combinedData
      );

      const jsonText = dec.decode(decryptedBuffer);
      return JSON.parse(jsonText);
    } catch (err) {
      console.error("Decryption failed:", err);
      throw new Error("Decryption failed. The provided index number may be incorrect or the record corrupted.");
    }
  }

  return {
    normalizeIndex,
    computeIndexHash,
    decryptStudentData,
    bytesToHex,
    hexToBytes
  };
})();
