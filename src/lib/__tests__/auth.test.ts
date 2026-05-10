import { describe, it, expect } from 'vitest';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { verifyWalletSignature, createAuthMessage } from '@/lib/auth';

/** Helper: sign a message with a nacl keypair and return bs58-encoded values */
function signMessage(message: string, secretKey: Uint8Array) {
  const messageBytes = Uint8Array.from(Buffer.from(message, 'utf-8'));
  const sk = Uint8Array.from(secretKey);
  const signatureBytes = nacl.sign.detached(messageBytes, sk);
  return bs58.encode(signatureBytes);
}

describe('verifyWalletSignature', () => {
  it('verifies a valid ed25519 signature', () => {
    const keypair = nacl.sign.keyPair();

    // Ensure all arrays are proper Uint8Array
    const pk = Uint8Array.from(keypair.publicKey);
    const sk = Uint8Array.from(keypair.secretKey);

    const message = 'NEXUS Auth: test at 1234567890';
    const msgBytes = Uint8Array.from(Buffer.from(message, 'utf-8'));

    const sig = nacl.sign.detached(msgBytes, sk);

    // Direct nacl verify should work
    const directVerify = nacl.sign.detached.verify(msgBytes, sig, pk);
    expect(directVerify).toBe(true);

    // Now test through our auth function (which uses TextEncoder + bs58)
    const publicKeyB58 = bs58.encode(pk);
    const signatureB58 = bs58.encode(sig);

    // Our auth module uses TextEncoder — verify the bytes match
    const authMsgBytes = new TextEncoder().encode(message);
    const authVerify = nacl.sign.detached.verify(
      Uint8Array.from(authMsgBytes),
      Uint8Array.from(bs58.decode(signatureB58)),
      Uint8Array.from(bs58.decode(publicKeyB58))
    );
    expect(authVerify).toBe(true);

    // Finally test the actual verifyWalletSignature function
    expect(verifyWalletSignature(message, signatureB58, publicKeyB58)).toBe(true);
  });

  it('rejects a tampered message', () => {
    const keypair = nacl.sign.keyPair();
    const publicKey = bs58.encode(keypair.publicKey);
    const originalMessage = 'NEXUS Auth: test at 1234567890';
    const signature = signMessage(originalMessage, keypair.secretKey);

    expect(verifyWalletSignature('TAMPERED MESSAGE', signature, publicKey)).toBe(false);
  });

  it('rejects a wrong public key', () => {
    const keypair1 = nacl.sign.keyPair();
    const keypair2 = nacl.sign.keyPair();
    const message = 'NEXUS Auth: test';
    const signature = signMessage(message, keypair1.secretKey);
    const wrongPublicKey = bs58.encode(keypair2.publicKey);

    expect(verifyWalletSignature(message, signature, wrongPublicKey)).toBe(false);
  });

  it('handles invalid inputs gracefully', () => {
    expect(verifyWalletSignature('msg', 'invalid', 'invalid')).toBe(false);
    expect(verifyWalletSignature('', '', '')).toBe(false);
  });
});

describe('createAuthMessage', () => {
  it('creates a structured message', () => {
    const msg = createAuthMessage('mint', 'abc123');
    expect(msg).toContain('NEXUS Marketplace Auth');
    expect(msg).toContain('Action: mint');
    expect(msg).toContain('Nonce: abc123');
    expect(msg).toContain('Timestamp:');
  });
});
