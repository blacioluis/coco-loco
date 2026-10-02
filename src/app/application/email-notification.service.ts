import { Injectable, signal } from '@angular/core';

export interface EmailHistoryItem {
  id: string;
  subject: string;
  createdAt: string;
  recipients: string[];
  sent: number;
  failed: number;
}

export interface EmailSendResult {
  ok: boolean;
  sent: number;
  failed: number;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class EmailNotificationService {
  readonly history = signal<EmailHistoryItem[]>([]);

  async refresh(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const result = (await response.json()) as { history?: EmailHistoryItem[] };
      this.history.set(Array.isArray(result.history) ? result.history : []);
    } catch {
      /* Le dashboard reste utilisable si l’historique est indisponible. */
    }
  }

  async send(
    memberIds: string[],
    subject: string,
    message: string,
    csrfToken: string,
  ): Promise<EmailSendResult> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ memberIds, subject, message }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        sent?: number;
        failed?: number;
        error?: string;
      };
      if (!response.ok)
        return {
          ok: false,
          sent: 0,
          failed: 0,
          error: result.error ?? `Erreur serveur ${response.status}`,
        };
      await this.refresh();
      return { ok: true, sent: result.sent ?? 0, failed: result.failed ?? 0 };
    } catch {
      return { ok: false, sent: 0, failed: 0, error: 'Serveur d’envoi indisponible.' };
    }
  }

  private get apiUrl(): string {
    return new URL('api/notifications.php', document.baseURI).toString();
  }
}
