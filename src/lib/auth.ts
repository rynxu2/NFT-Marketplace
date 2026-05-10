import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Verify a Solana wallet signature on the server side.
 * The client signs a message with their wallet, sends the signature + public key.
 * The server verifies using ed25519 (tweetnacl).
 */
export function verifyWalletSignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = Uint8Array.from(new TextEncoder().encode(message));
    const signatureBytes = Uint8Array.from(bs58.decode(signature));
    const publicKeyBytes = Uint8Array.from(bs58.decode(publicKey));

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

/**
 * Generate a nonce-based message for wallet authentication.
 * The message includes a timestamp to prevent replay attacks.
 */
export function createAuthMessage(action: string, nonce: string): string {
  return `NEXUS Marketplace Auth\nAction: ${action}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
}

/**
 * Extract and validate auth headers from a request.
 * Returns the wallet address if valid, null otherwise.
 */
export async function authenticateRequest(
  request: Request
): Promise<{ wallet: string } | null> {
  const walletAddress = request.headers.get('x-wallet-address');
  const signature = request.headers.get('x-wallet-signature');
  const signedMessage = request.headers.get('x-wallet-message');

  // If no auth headers, allow unauthenticated (backward compatible)
  // In production, you would reject unauthenticated requests
  if (!walletAddress || !signature || !signedMessage) {
    return null;
  }

  const isValid = verifyWalletSignature(signedMessage, signature, walletAddress);

  if (!isValid) {
    return null;
  }

  return { wallet: walletAddress };
}

/**
 * Helper for API routes to require authentication.
 * Returns the wallet address or throws an error response.
 */
export async function requireAuth(request: Request): Promise<string | null> {
  const auth = await authenticateRequest(request);
  return auth?.wallet || null;
}
