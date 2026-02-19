import axios from 'axios';
import { config } from '../config';

export interface AnalysisWebhookPayload {
  jobId: string;
  status: 'success' | 'failed';
  result?: unknown;
  error?: string;
}

export interface AIContentWebhookPayload {
  jobId: string;
  resumeId?: string;
  userId: string;
  contentType: string;
  status: 'success' | 'failed';
  result?: unknown;
  error?: string;
}

// For backwards compatibility
export type WebhookPayload = AnalysisWebhookPayload;

/**
 * Sends a webhook notification to the backend API
 * to inform about job completion status.
 */
export async function sendWebhook(payload: AnalysisWebhookPayload): Promise<void> {
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

/**
 * Sends a webhook notification for AI content generation
 */
export async function sendAIContentWebhook(payload: AIContentWebhookPayload): Promise<void> {
  const url = `${config.webhook.baseUrl}/api/webhooks/ai-content`;

  try {
    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    console.log(`[Webhook] Successfully notified backend for AI content job ${payload.jobId}`);
  } catch (error) {
    console.error(`[Webhook] Failed to notify backend for AI content job ${payload.jobId}:`, error);
    // Don't throw - webhook failure shouldn't crash the worker
  }
}
