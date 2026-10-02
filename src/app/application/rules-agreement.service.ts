import { computed, inject, Injectable, signal } from '@angular/core';
import { ClubMember } from '../domain/club.models';
import { RULES_AGREEMENT_CONFIG } from '../rules-agreement.config';
import { AdminAuthService } from './admin-auth.service';

export interface RulesAcceptance {
  memberId: string;
  memberName: string;
  acceptedAt: string;
  regulationVersion: string;
  synced?: boolean;
}

export interface AgreementRemovalResult {
  removed: boolean;
  localOnly?: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class RulesAgreementService {
  private readonly auth = inject(AdminAuthService);
  readonly acceptances = signal<RulesAcceptance[]>([]);
  readonly currentAcceptances = computed(() =>
    this.acceptances().filter(
      (item) => item.regulationVersion === RULES_AGREEMENT_CONFIG.regulationVersion,
    ),
  );
  readonly apiStatus = signal<'connecting' | 'online' | 'offline'>('connecting');

  constructor() {
    if (!RULES_AGREEMENT_CONFIG.apiEnabled) this.apiStatus.set('offline');
  }

  async accept(member: ClubMember): Promise<RulesAcceptance | null> {
    const existing = this.acceptances().find(
      (item) =>
        item.memberId === member.id &&
        item.regulationVersion === RULES_AGREEMENT_CONFIG.regulationVersion,
    );
    if (existing) return existing;
    const request: RulesAcceptance = {
      memberId: member.id,
      memberName: member.name,
      acceptedAt: new Date().toISOString(),
      regulationVersion: RULES_AGREEMENT_CONFIG.regulationVersion,
    };
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const result = (await response.json()) as { acceptance: RulesAcceptance };
      const acceptance = { ...result.acceptance, synced: true };
      this.apiStatus.set('online');
      this.acceptances.update((items) =>
        [
          ...items.filter(
            (item) =>
              !(
                item.memberId === acceptance.memberId &&
                item.regulationVersion === acceptance.regulationVersion
              ),
          ),
          acceptance,
        ].sort((a, b) => a.acceptedAt.localeCompare(b.acceptedAt)),
      );
      return acceptance;
    } catch {
      this.apiStatus.set('offline');
      return null;
    }
  }

  hasAccepted(memberId: string): boolean {
    return this.acceptances().some(
      (item) =>
        item.memberId === memberId &&
        item.regulationVersion === RULES_AGREEMENT_CONFIG.regulationVersion,
    );
  }

  async refresh(): Promise<boolean> {
    if (!RULES_AGREEMENT_CONFIG.apiEnabled) {
      this.apiStatus.set('offline');
      return false;
    }
    try {
      const response = await fetch(this.apiUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const result = (await response.json()) as { acceptances: RulesAcceptance[] };
      this.acceptances.set(
        (Array.isArray(result.acceptances) ? result.acceptances : []).map((item) => ({
          ...item,
          synced: true,
        })),
      );
      this.apiStatus.set('online');
      return true;
    } catch {
      this.apiStatus.set('offline');
      return false;
    }
  }

  async remove(memberId: string): Promise<AgreementRemovalResult> {
    try {
      const deleteUrl = new URL(this.apiUrl);
      deleteUrl.searchParams.set('action', 'delete');
      const response = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.auth.csrfToken(),
        },
        body: JSON.stringify({
          memberId,
          regulationVersion: RULES_AGREEMENT_CONFIG.regulationVersion,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        deleted?: boolean;
        error?: string;
      };
      if (!response.ok)
        return { removed: false, error: result.error ?? `Erreur serveur ${response.status}` };
      this.acceptances.update((items) =>
        items.filter(
          (item) =>
            !(
              item.memberId === memberId &&
              item.regulationVersion === RULES_AGREEMENT_CONFIG.regulationVersion
            ),
        ),
      );
      return { removed: true };
    } catch {
      return { removed: false, error: 'Serveur central indisponible.' };
    }
  }

  async exportJson(): Promise<void> {
    if (this.apiStatus() === 'online') await this.refresh();
    const payload = {
      club: 'Forestois SC 1',
      regulationVersion: RULES_AGREEMENT_CONFIG.regulationVersion,
      exportedAt: new Date().toISOString(),
      acceptances: this.currentAcceptances(),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = RULES_AGREEMENT_CONFIG.exportFileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private get apiUrl(): string {
    return new URL(RULES_AGREEMENT_CONFIG.apiPath, document.baseURI).toString();
  }
}
