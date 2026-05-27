export interface WebhookPayload {
  username: string;
  timestamp: number;
  [key: string]: unknown;
}

export interface SaltResponse {
  saltHex: string;
}