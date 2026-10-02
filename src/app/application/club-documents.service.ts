import { Injectable, signal } from '@angular/core';

export interface ClubDocument {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ClubDocumentsService {
  readonly documents = signal<ClubDocument[]>([]);

  async refresh(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const result = (await response.json()) as { documents?: ClubDocument[] };
      this.documents.set(Array.isArray(result.documents) ? result.documents : []);
    } catch {
      /* Les documents restent simplement indisponibles hors serveur PHP. */
    }
  }

  async upload(
    file: File,
    title: string,
    csrfToken: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const body = new FormData();
    body.set('action', 'upload');
    body.set('title', title);
    body.set('document', file);
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body,
      });
      const result = (await response.json().catch(() => ({}))) as {
        document?: ClubDocument;
        error?: string;
      };
      if (!response.ok || !result.document)
        return { ok: false, error: result.error ?? `Erreur serveur ${response.status}` };
      await this.refresh();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Serveur de documents indisponible.' };
    }
  }

  async remove(id: string, csrfToken: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok)
        return { ok: false, error: result.error ?? `Erreur serveur ${response.status}` };
      await this.refresh();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Serveur de documents indisponible.' };
    }
  }

  downloadUrl(id: string): string {
    const url = new URL(this.apiUrl);
    url.searchParams.set('download', id);
    return url.toString();
  }

  private get apiUrl(): string {
    return new URL('api/documents.php', document.baseURI).toString();
  }
}
