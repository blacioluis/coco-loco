import { Injectable, signal } from '@angular/core';

export interface MatchDuty {
  round: number;
  fixtureDate: string;
  kitsMemberId: string;
  kitsMemberName: string;
  drinksMemberId: string;
  drinksMemberName: string;
  updatedAt: string;
  proof?: DutyProof;
}

export interface DutyProofMember {
  memberId: string;
  memberName: string;
}

export interface DutyProof {
  type: 'draw' | 'manual';
  drawId: string;
  performedAt: string;
  algorithm: string;
  seed?: string;
  hash?: string;
  eligibleMembers?: DutyProofMember[];
  kitsPool?: string[];
  drinksPool?: string[];
}

export interface DutyDraw {
  round: number;
  fixtureDate: string;
  kitsMemberId: string;
  kitsMemberName: string;
  drinksMemberId: string;
  drinksMemberName: string;
  proof: DutyProof;
}

interface DutyMutationResult {
  duty?: MatchDuty;
  draw?: DutyDraw;
  attemptsForFixture?: number;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class MatchDutiesService {
  readonly duties = signal<MatchDuty[]>([]);
  readonly draws = signal<DutyDraw[]>([]);

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const result = (await response.json()) as { duties?: MatchDuty[]; draws?: DutyDraw[] };
      this.duties.set(Array.isArray(result.duties) ? result.duties : []);
      this.draws.set(Array.isArray(result.draws) ? result.draws : []);
    } catch {
      try {
        const fallback = await fetch(new URL('data/match-duties.json', document.baseURI), {
          cache: 'no-store',
        });
        const duties = (await fallback.json()) as MatchDuty[];
        if (Array.isArray(duties)) this.duties.set(duties);
      } catch {
        /* La carte reste masquée si aucune donnée n'est disponible. */
      }
    }
  }

  forFixture(round: number, fixtureDate: string): MatchDuty | undefined {
    return this.duties().find((duty) => duty.round === round && duty.fixtureDate === fixtureDate);
  }

  async save(
    round: number,
    fixtureDate: string,
    kitsMemberId: string,
    drinksMemberId: string,
    csrfToken: string,
  ): Promise<{ ok: boolean; error?: string; duty?: MatchDuty; draw?: DutyDraw }> {
    return this.mutate(
      { action: 'upsert', round, fixtureDate, kitsMemberId, drinksMemberId },
      csrfToken,
    );
  }

  async draw(
    round: number,
    fixtureDate: string,
    eligibleMemberIds: string[],
    csrfToken: string,
  ): Promise<{
    ok: boolean;
    error?: string;
    duty?: MatchDuty;
    draw?: DutyDraw;
    attemptsForFixture?: number;
  }> {
    return this.mutate({ action: 'draw', round, fixtureDate, eligibleMemberIds }, csrfToken);
  }

  private async mutate(
    payload: Record<string, unknown>,
    csrfToken: string,
  ): Promise<{
    ok: boolean;
    error?: string;
    duty?: MatchDuty;
    draw?: DutyDraw;
    attemptsForFixture?: number;
  }> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as DutyMutationResult;
      if (!response.ok || !result.duty)
        return { ok: false, error: result.error ?? `Erreur serveur ${response.status}` };
      const current = this.duties();
      const index = current.findIndex(
        (duty) =>
          duty.round === result.duty!.round && duty.fixtureDate === result.duty!.fixtureDate,
      );
      this.duties.set(
        index < 0
          ? [...current, result.duty]
          : current.map((duty, dutyIndex) => (dutyIndex === index ? result.duty! : duty)),
      );
      if (result.draw) this.draws.update((draws) => [result.draw!, ...draws].slice(0, 50));
      return {
        ok: true,
        duty: result.duty,
        draw: result.draw,
        attemptsForFixture: result.attemptsForFixture,
      };
    } catch {
      return { ok: false, error: 'Serveur de rotation indisponible.' };
    }
  }

  private get apiUrl(): string {
    return new URL('api/match-duties.php', document.baseURI).toString();
  }
}
