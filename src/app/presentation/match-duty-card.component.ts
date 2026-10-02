import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { MatchDuty } from '../application/match-duties.service';
import { I18nService } from '../application/i18n.service';

@Component({
  selector: 'app-match-duty-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-duty-card.component.html',
  styleUrl: './match-duty-card.component.scss',
})
export class MatchDutyCardComponent {
  @Input({ required: true }) duty!: MatchDuty;
  readonly i18n = inject(I18nService);
  verifying = false;
  verificationState: 'valid' | 'invalid' | '' = '';
  displayName(id: string, name: string) {
    return id === 'nasr-eddine-zabata' ? 'Nass' : name;
  }
  get eligibleNames() {
    return (
      this.duty.proof?.eligibleMembers
        ?.map((member) => this.displayName(member.memberId, member.memberName))
        .join(', ') ?? ''
    );
  }
  async verifyProof() {
    const proof = this.duty.proof;
    if (
      !proof?.seed ||
      !proof.hash ||
      !proof.eligibleMembers?.length ||
      !proof.kitsPool?.length ||
      !proof.drinksPool?.length
    ) {
      this.verificationState = 'invalid';
      return;
    }
    this.verifying = true;
    try {
      const eligibleIds = proof.eligibleMembers.map((member) => member.memberId);
      const payload = [
        proof.drawId,
        String(this.duty.round),
        this.duty.fixtureDate,
        eligibleIds.join(','),
        this.duty.kitsMemberId,
        this.duty.drinksMemberId,
        proof.seed,
      ].join('|');
      const [hash, kitsWinner, drinksWinner] = await Promise.all([
        this.sha256(payload),
        this.winner(proof.kitsPool, proof.seed, 'kits'),
        this.winner(proof.drinksPool, proof.seed, 'drinks'),
      ]);
      this.verificationState =
        hash === proof.hash &&
        kitsWinner === this.duty.kitsMemberId &&
        drinksWinner === this.duty.drinksMemberId
          ? 'valid'
          : 'invalid';
    } catch {
      this.verificationState = 'invalid';
    }
    this.verifying = false;
  }
  private async winner(pool: string[], seed: string, task: string) {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(seed),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const ranked = await Promise.all(
      pool.map(async (id) => ({
        id,
        hash: this.hex(
          await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${task}|${id}`)),
        ),
      })),
    );
    ranked.sort((a, b) => a.hash.localeCompare(b.hash));
    return ranked[0]?.id ?? '';
  }
  private async sha256(value: string) {
    return this.hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  }
  private hex(value: ArrayBuffer) {
    return [...new Uint8Array(value)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
