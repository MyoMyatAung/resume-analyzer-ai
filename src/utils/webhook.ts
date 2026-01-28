import axios from 'axios';
import { config } from '../config';

export interface WebhookPayload {
  jobId: string;
  status: 'success' | 'failed';
  result?: unknown;
  error?: string;
}

/**
 * Sends a webhook notification to the backend API
 * to inform about job completion status.
 */
export async function sendWebhook(payload: WebhookPayload): Promise<void> {
  const url = `${config.webhook.baseUrl}/api/analysis/webhook`;

  try {
    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    console.log(`[Webhook] Successfully notified backend for job ${payload.jobId}`);
  } catch (error) {
    console.error(`[Webhook] Failed to notify backend for job ${payload.jobId}:`, error);
    // Don't throw - webhook failure shouldn't crash the worker
  }
}
