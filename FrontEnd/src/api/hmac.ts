import CryptoJS from 'crypto-js';

const HMAC_SECRET = import.meta.env.VITE_HMAC_SECRET || 'appresso-secret-key-32-bytes-secure';

/**
 * Genera los encabezados criptográficos x-signature y x-timestamp
 * requeridos por los endpoints seguros del backend de APPRESSO.
 * 
 * Protocolo de firma:
 * canonicalString = `${timestamp}.${rawJsonBody}`
 * signature = HMAC-SHA256(canonicalString, secret)
 */
export function getHMACHeaders(body: any, secret: string = HMAC_SECRET): { 'x-signature': string; 'x-timestamp': string } {
  const timestamp = Date.now().toString();
  const rawPayload = typeof body === 'string' ? body : JSON.stringify(body ?? {});
  const dataToVerify = `${timestamp}.${rawPayload}`;
  
  const signature = CryptoJS.HmacSHA256(dataToVerify, secret).toString(CryptoJS.enc.Hex);

  return {
    'x-signature': signature,
    'x-timestamp': timestamp,
  };
}
