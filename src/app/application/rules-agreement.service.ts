import { computed, Injectable, signal } from '@angular/core';
import { ClubMember } from '../domain/club.models';
import { RULES_AGREEMENT_CONFIG } from '../rules-agreement.config';
import { ADMIN_PASSWORD, ADMIN_USERNAME } from './admin-auth.service';

export interface RulesAcceptance {
  memberId: string;
  memberName: string;
  acceptedAt: string;
  regulationVersion: string;
  synced?: boolean;
}

export interface AgreementRemovalResult {
  removed: boolean;
  error?: string;
}

const STORAGE_KEY = 'forestois-rules-acceptances-v1';

@Injectable({ providedIn: 'root' })
export class RulesAgreementService {
  readonly acceptances = signal<RulesAcceptance[]>(this.load());
  readonly currentAcceptances = computed(() => this.acceptances().filter((item) => item.regulationVersion === RULES_AGREEMENT_CONFIG.regulationVersion));
  readonly apiStatus = signal<'connecting' | 'online' | 'offline'>('connecting');

  constructor() {
    if (RULES_AGREEMENT_CONFIG.apiEnabled) void this.sync();
    else this.apiStatus.set('offline');
  }

  async accept(member: ClubMember): Promise<RulesAcceptance> {
    const existing = this.acceptances().find((item) => item.memberId === member.id && item.regulationVersion === RULES_AGREEMENT_CONFIG.regulationVersion);
    if (existing) return existing;
    const localAcceptance: RulesAcceptance = {
      memberId: member.id,
      memberName: member.name,
      acceptedAt: new Date().toISOString(),
      regulationVersion: RULES_AGREEMENT_CONFIG.regulationVersion,
      synced: false,
    };
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localAcceptance),
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const result = await response.json() as { acceptance: RulesAcceptance };
      const acceptance = { ...result.acceptance, synced: true };
      this.apiStatus.set('online');
      this.merge([acceptance]);
      return acceptance;
    } catch {
      this.apiStatus.set('offline');
      this.merge([localAcceptance]);
      return localAcceptance;
    }
  }

  hasAccepted(memberId: string): boolean {
    return this.acceptances().some((item) => item.memberId === memberId && item.regulationVersion === RULES_AGREEMENT_CONFIG.regulationVersion);
  }

  async remove(memberId: string): Promise<AgreementRemovalResult> {
    try {
      const deleteUrl = new URL(this.apiUrl);
      deleteUrl.searchParams.set('action', 'delete');
      const response = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          regulationVersion: RULES_AGREEMENT_CONFIG.regulationVersion,
          adminUsername: ADMIN_USERNAME,
          adminPassword: ADMIN_PASSWORD,
        }),
      });
      const result = await response.json().catch(() => ({})) as { deleted?: boolean; error?: string };
      if (!response.ok) return { removed: false, error: result.error ?? `Erreur serveur ${response.status}` };
      this.save(this.acceptances().filter((item) => !(item.memberId === memberId && item.regulationVersion === RULES_AGREEMENT_CONFIG.regulationVersion)));
      return { removed: true };
    } catch {
      return { removed: false, error: 'API inaccessible' };
    }
  }

  async exportJson(): Promise<void> {
    if (this.apiStatus() === 'online') await this.sync();
    const payload = {
      club: 'Forestois SC 1',
      regulationVersion: RULES_AGREEMENT_CONFIG.regulationVersion,
      exportedAt: new Date().toISOString(),
      acceptances: this.currentAcceptances(),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = RULES_AGREEMENT_CONFIG.exportFileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private load(): RulesAcceptance[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private get apiUrl(): string {
    return new URL(RULES_AGREEMENT_CONFIG.apiPath, document.baseURI).toString();
  }

  private async sync(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const result = await response.json() as { acceptances: RulesAcceptance[] };
      const serverAcceptances = result.acceptances.map((item) => ({ ...item, synced: true }));
      this.apiStatus.set('online');
      const pending = this.acceptances().filter((item) => !item.synced);
      this.save([...serverAcceptances, ...pending].sort((a, b) => a.acceptedAt.localeCompare(b.acceptedAt)));
      for (const item of pending) await this.pushPending(item);
    } catch {
      this.apiStatus.set('offline');
    }
  }

  private async pushPending(item: RulesAcceptance): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) return;
      const result = await response.json() as { acceptance: RulesAcceptance };
      const withoutPending = this.acceptances().filter((entry) => !(entry.memberId === item.memberId && entry.regulationVersion === item.regulationVersion));
      this.save([...withoutPending, { ...result.acceptance, synced: true }]);
    } catch { /* Conservé localement pour une synchronisation ultérieure. */ }
  }

  private merge(incoming: RulesAcceptance[]): void {
    const byKey = new Map<string, RulesAcceptance>();
    for (const item of [...this.acceptances(), ...incoming]) {
      const key = `${item.regulationVersion}:${item.memberId}`;
      const current = byKey.get(key);
      if (!current || item.synced || !current.synced) byKey.set(key, item);
    }
    this.save([...byKey.values()].sort((a, b) => a.acceptedAt.localeCompare(b.acceptedAt)));
  }

  private save(value: RulesAcceptance[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    this.acceptances.set(value);
  }
}
