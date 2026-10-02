import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminAuthService } from '../application/admin-auth.service';
import { ClubDocument, ClubDocumentsService } from '../application/club-documents.service';
import { ClubEventsService } from '../application/club-events.service';
import { ClubFacade, TEAM_ROLES } from '../application/club.facade';
import { EmailNotificationService } from '../application/email-notification.service';
import { I18nService } from '../application/i18n.service';
import { MatchDutiesService } from '../application/match-duties.service';
import { PlayerPhotoService } from '../application/player-photo.service';
import { RulesAcceptance, RulesAgreementService } from '../application/rules-agreement.service';
import { ClubEventType, ClubMember, TeamRole } from '../domain/club.models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage {
  readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
  readonly auth = inject(AdminAuthService);
  readonly events = inject(ClubEventsService);
  readonly agreements = inject(RulesAgreementService);
  readonly emailNotifications = inject(EmailNotificationService);
  readonly documents = inject(ClubDocumentsService);
  readonly duties = inject(MatchDutiesService);
  private readonly playerPhoto = inject(PlayerPhotoService);
  readonly roles = TEAM_ROLES;
  readonly eventTypes: ClubEventType[] = [
    'Entraînement',
    'Match amical',
    'Réunion',
    'Activité club',
  ];
  username = '';
  password = '';
  loginError = false;
  loggingIn = false;
  name = '';
  role: TeamRole = 'Gardien';
  number: number | null = null;
  email = '';
  positions = '';
  newPhoto = '';
  photoError = '';
  updatingMemberId = '';
  memberStatusMessage = '';
  memberStatusError = '';
  savingMember = false;
  positionInputs: Record<string, string> = {};
  editingMemberId = '';
  editName = '';
  editRole: TeamRole = 'Joueur';
  editNumber: number | null = null;
  editEmail = '';
  selectedEmailIds = new Set<string>();
  emailSubject = '';
  emailMessage = '';
  sendingEmail = false;
  emailActionMessage = '';
  emailActionError = '';
  documentTitle = '';
  selectedDocument: File | null = null;
  uploadingDocument = false;
  documentActionMessage = '';
  documentActionError = '';
  eventTitle = '';
  eventType: ClubEventType = 'Entraînement';
  eventDate = '';
  eventTime = '';
  eventLocation = 'Complexe Sportif du Bempt';
  eventDescription = '';
  savingEvent = false;
  eventActionMessage = '';
  eventActionError = '';
  deletingAgreementId = '';
  agreementDeleteError = '';
  agreementActionMessage = '';
  dutyKitsMemberId = 'luis-blacio';
  dutyDrinksMemberId = 'nasr-eddine-zabata';
  savingDuty = false;
  readonly drawingDuty = signal(false);
  readonly rouletteName = signal('');
  readonly selectedDutyCandidateIds = new Set<string>();
  dutyActionMessage = '';
  dutyActionError = '';
  private dutySelectionKey = '';
  constructor() {
    effect(() => {
      if (!this.auth.authenticated()) return;
      void this.club.refreshMembers();
      void this.emailNotifications.refresh();
      void this.documents.refresh();
      void this.duties.refresh();
      void this.events.refresh();
    });
    effect(() => {
      const next = this.club.nextFixture();
      if (!next) return;
      const duty = this.duties.forFixture(next.round, next.date);
      const key = `${next.round}-${next.date}-${duty?.updatedAt ?? 'empty'}`;
      if (this.dutySelectionKey === key) return;
      this.dutyKitsMemberId = duty?.kitsMemberId ?? 'luis-blacio';
      this.dutyDrinksMemberId = duty?.drinksMemberId ?? 'nasr-eddine-zabata';
      this.dutySelectionKey = key;
    });
  }
  async login() {
    this.loggingIn = true;
    this.loginError = !(await this.auth.login(this.username.trim(), this.password));
    this.password = '';
    this.loggingIn = false;
  }
  async logout() {
    await this.auth.logout();
    await this.club.refreshMembers();
    this.selectedEmailIds.clear();
  }
  get dutyCandidates() {
    return [...this.club.players()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
  get allDutyCandidatesSelected() {
    return (
      this.dutyCandidates.length > 0 &&
      this.dutyCandidates.every((member) => this.selectedDutyCandidateIds.has(member.id))
    );
  }
  dutyName(id: string, name: string) {
    return id === 'nasr-eddine-zabata' ? 'Nass' : name;
  }
  toggleDutyCandidate(id: string) {
    this.selectedDutyCandidateIds.has(id)
      ? this.selectedDutyCandidateIds.delete(id)
      : this.selectedDutyCandidateIds.add(id);
  }
  toggleAllDutyCandidates() {
    if (this.allDutyCandidatesSelected) this.selectedDutyCandidateIds.clear();
    else for (const member of this.dutyCandidates) this.selectedDutyCandidateIds.add(member.id);
  }
  async drawNextDuty() {
    const next = this.club.nextFixture();
    const selected = this.dutyCandidates.filter((member) =>
      this.selectedDutyCandidateIds.has(member.id),
    );
    if (!next || selected.length < 2 || this.drawingDuty()) return;
    const previousAttempts = this.duties
      .draws()
      .filter((draw) => draw.round === next.round && draw.fixtureDate === next.date).length;
    if (
      previousAttempts &&
      !window.confirm(
        this.i18n.t(
          `Un tirage existe déjà pour ce match. Relancer créera une tentative n°${previousAttempts + 1} visible dans l’historique. Continuer ?`,
          `Ya existe un sorteo para este partido. Repetirlo creará el intento n.º ${previousAttempts + 1} visible en el historial. ¿Continuar?`,
        ),
      )
    )
      return;
    this.drawingDuty.set(true);
    this.dutyActionMessage = '';
    this.dutyActionError = '';
    let index = 0;
    this.rouletteName.set(selected[0].name);
    const roulette = window.setInterval(() => {
      index = (index + 1) % selected.length;
      this.rouletteName.set(selected[index].name);
    }, 75);
    const minimumAnimation = new Promise<void>((resolve) => window.setTimeout(resolve, 1800));
    const [result] = await Promise.all([
      this.duties.draw(
        next.round,
        next.date,
        selected.map((member) => member.id),
        this.auth.csrfToken(),
      ),
      minimumAnimation,
    ]);
    window.clearInterval(roulette);
    this.drawingDuty.set(false);
    if (result.ok && result.duty) {
      this.dutyKitsMemberId = result.duty.kitsMemberId;
      this.dutyDrinksMemberId = result.duty.drinksMemberId;
      this.rouletteName.set(
        `♟ ${this.dutyName(result.duty.kitsMemberId, result.duty.kitsMemberName)}  ·  ✦ ${this.dutyName(result.duty.drinksMemberId, result.duty.drinksMemberName)}`,
      );
      const proofId = result.draw?.proof.drawId ?? result.duty.proof?.drawId ?? '';
      const attempts = result.attemptsForFixture ?? 1;
      this.dutyActionMessage = this.i18n.t(
        `Tirage #${proofId} publié. Tentative n°${attempts} conservée.`,
        `Sorteo #${proofId} publicado. Intento n.º ${attempts} conservado.`,
      );
    } else {
      this.rouletteName.set('');
      this.dutyActionError =
        result.error ?? this.i18n.t('Tirage impossible.', 'No se pudo realizar el sorteo.');
    }
  }
  closeRoulette() {
    this.rouletteName.set('');
  }
  async saveNextDuty() {
    const next = this.club.nextFixture();
    if (!next || !this.dutyKitsMemberId || !this.dutyDrinksMemberId) return;
    this.savingDuty = true;
    this.dutyActionMessage = '';
    this.dutyActionError = '';
    const result = await this.duties.save(
      next.round,
      next.date,
      this.dutyKitsMemberId,
      this.dutyDrinksMemberId,
      this.auth.csrfToken(),
    );
    if (result.ok)
      this.dutyActionMessage = this.i18n.t(
        'La rotation est publiée et ajoutée à l’historique.',
        'La rotación se publicó y se añadió al historial.',
      );
    else
      this.dutyActionError =
        result.error ?? this.i18n.t('Enregistrement impossible.', 'No se pudo guardar.');
    this.savingDuty = false;
  }
  async add() {
    if (!this.name.trim()) return;
    this.savingMember = true;
    this.clearMemberMessages();
    const saved = await this.club.addMember(
      this.name,
      this.role,
      this.parsePositions(this.positions),
      this.auth.csrfToken(),
      this.number ?? undefined,
      this.email,
      this.newPhoto || undefined,
    );
    if (saved) {
      this.memberStatusMessage = this.i18n.t(
        'Le membre a été ajouté au registre central.',
        'El miembro se añadió al registro central.',
      );
      this.name = '';
      this.number = null;
      this.email = '';
      this.positions = '';
      this.newPhoto = '';
    } else this.memberStatusError = this.serverError();
    this.savingMember = false;
  }
  async remove(member: ClubMember) {
    if (
      !window.confirm(
        this.i18n.t(
          `Supprimer définitivement ${member.name} ?`,
          `¿Eliminar definitivamente a ${member.name}?`,
        ),
      )
    )
      return;
    this.clearMemberMessages();
    const saved = await this.club.removeMember(member.id, this.auth.csrfToken());
    if (saved)
      this.memberStatusMessage = this.i18n.t(
        `${member.name} a été supprimé.`,
        `${member.name} ha sido eliminado.`,
      );
    else this.memberStatusError = this.serverError();
  }
  editMember(member: ClubMember) {
    this.editingMemberId = member.id;
    this.editName = member.name;
    this.editRole = member.role;
    this.editNumber = member.number ?? null;
    this.editEmail = member.email ?? '';
  }
  async saveMemberDetails(member: ClubMember) {
    this.clearMemberMessages();
    const saved = await this.club.updateMemberDetails(
      member.id,
      {
        name: this.editName,
        role: this.editRole,
        number: this.editNumber ?? undefined,
        email: this.editEmail,
      },
      this.auth.csrfToken(),
    );
    if (saved) {
      this.memberStatusMessage = this.i18n.t(
        'Le profil a été mis à jour.',
        'El perfil se actualizó.',
      );
      this.editingMemberId = '';
    } else this.memberStatusError = this.serverError();
  }
  async toggleMemberStatus(member: ClubMember) {
    this.updatingMemberId = member.id;
    this.memberStatusMessage = '';
    this.memberStatusError = '';
    const active = member.active === false;
    const saved = await this.club.setMemberActive(member.id, active, this.auth.csrfToken());
    if (saved)
      this.memberStatusMessage = this.i18n.t(
        `${member.name} est maintenant ${active ? 'actif' : 'inactif'}.`,
        `${member.name} ahora está ${active ? 'activo' : 'inactivo'}.`,
      );
    else
      this.memberStatusError = this.i18n.t(
        'Le serveur n’a pas pu enregistrer ce changement.',
        'El servidor no pudo guardar este cambio.',
      );
    this.updatingMemberId = '';
  }
  async selectNewPhoto(event: Event) {
    this.newPhoto = await this.readPhoto(event);
  }
  async replacePhoto(id: string, event: Event) {
    const photo = await this.readPhoto(event);
    if (!photo) return;
    this.clearMemberMessages();
    const saved = await this.club.updateMemberPhoto(id, photo, this.auth.csrfToken());
    if (!saved) this.memberStatusError = this.serverError();
  }
  async removePhoto(id: string) {
    this.clearMemberMessages();
    const saved = await this.club.updateMemberPhoto(id, null, this.auth.csrfToken());
    if (!saved) this.memberStatusError = this.serverError();
  }
  memberPositions(member: ClubMember) {
    return member.positions?.length ? member.positions : member.position ? [member.position] : [];
  }
  async addPosition(member: ClubMember) {
    const position = (this.positionInputs[member.id] ?? '').trim();
    if (!position) return;
    await this.savePositions(member, [...this.memberPositions(member), position]);
    this.positionInputs[member.id] = '';
  }
  async removePosition(member: ClubMember, position: string) {
    await this.savePositions(
      member,
      this.memberPositions(member).filter((item) => item !== position),
    );
  }
  private async savePositions(member: ClubMember, positions: string[]) {
    this.updatingMemberId = member.id;
    this.clearMemberMessages();
    const saved = await this.club.updateMemberPositions(
      member.id,
      positions,
      this.auth.csrfToken(),
    );
    if (!saved) this.memberStatusError = this.serverError();
    this.updatingMemberId = '';
  }
  private parsePositions(value: string) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  private clearMemberMessages() {
    this.memberStatusMessage = '';
    this.memberStatusError = '';
  }
  private serverError() {
    return this.i18n.t(
      'Le serveur n’a pas pu enregistrer ce changement. Vérifie ta session.',
      'El servidor no pudo guardar este cambio. Comprueba tu sesión.',
    );
  }
  get emailableMembers() {
    return this.club
      .activeMembers()
      .filter((member) => !!member.email)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
  get allEmailRecipientsSelected() {
    return (
      this.emailableMembers.length > 0 &&
      this.emailableMembers.every((member) => this.selectedEmailIds.has(member.id))
    );
  }
  initials(name: string) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  toggleEmailRecipient(id: string) {
    this.selectedEmailIds.has(id)
      ? this.selectedEmailIds.delete(id)
      : this.selectedEmailIds.add(id);
  }
  toggleAllEmailRecipients() {
    if (this.allEmailRecipientsSelected) this.selectedEmailIds.clear();
    else for (const member of this.emailableMembers) this.selectedEmailIds.add(member.id);
  }
  async sendEmail() {
    if (!this.emailSubject.trim() || !this.emailMessage.trim() || !this.selectedEmailIds.size)
      return;
    const confirmed = window.confirm(
      this.i18n.t(
        `Envoyer cet e-mail à ${this.selectedEmailIds.size} destinataire(s) ?`,
        `¿Enviar este correo a ${this.selectedEmailIds.size} destinatario(s)?`,
      ),
    );
    if (!confirmed) return;
    this.sendingEmail = true;
    this.emailActionMessage = '';
    this.emailActionError = '';
    const result = await this.emailNotifications.send(
      [...this.selectedEmailIds],
      this.emailSubject.trim(),
      this.emailMessage.trim(),
      this.auth.csrfToken(),
    );
    if (result.ok) {
      this.emailActionMessage = this.i18n.t(
        `${result.sent} e-mail(s) remis au serveur${result.failed ? `, ${result.failed} échec(s)` : ''}.`,
        `${result.sent} correo(s) entregado(s) al servidor${result.failed ? `, ${result.failed} fallo(s)` : ''}.`,
      );
      this.emailSubject = '';
      this.emailMessage = '';
      this.selectedEmailIds.clear();
    } else
      this.emailActionError =
        result.error ?? this.i18n.t('Envoi impossible.', 'No se pudo enviar.');
    this.sendingEmail = false;
  }
  selectDocument(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedDocument = input.files?.[0] ?? null;
    this.documentActionError = '';
  }
  async uploadDocument() {
    if (!this.selectedDocument) return;
    this.uploadingDocument = true;
    this.documentActionMessage = '';
    this.documentActionError = '';
    const result = await this.documents.upload(
      this.selectedDocument,
      this.documentTitle.trim(),
      this.auth.csrfToken(),
    );
    if (result.ok) {
      this.documentActionMessage = this.i18n.t(
        'Document ajouté au coffre privé.',
        'Documento añadido al archivo privado.',
      );
      this.documentTitle = '';
      this.selectedDocument = null;
    } else
      this.documentActionError =
        result.error ?? this.i18n.t('Envoi impossible.', 'No se pudo subir.');
    this.uploadingDocument = false;
  }
  async removeDocument(document: ClubDocument) {
    if (
      !window.confirm(
        this.i18n.t(`Supprimer « ${document.title} » ?`, `¿Eliminar « ${document.title} »?`),
      )
    )
      return;
    this.documentActionMessage = '';
    this.documentActionError = '';
    const result = await this.documents.remove(document.id, this.auth.csrfToken());
    if (result.ok)
      this.documentActionMessage = this.i18n.t('Document supprimé.', 'Documento eliminado.');
    else
      this.documentActionError =
        result.error ?? this.i18n.t('Suppression impossible.', 'No se pudo eliminar.');
  }
  documentExtension(document: ClubDocument) {
    return (document.originalName.split('.').pop() || 'DOC').slice(0, 4).toUpperCase();
  }
  formatBytes(value: number) {
    return value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)} Mo`
      : `${Math.max(1, Math.round(value / 1000))} Ko`;
  }
  private async readPhoto(event: Event): Promise<string> {
    this.photoError = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return '';
    try {
      return await this.playerPhoto.compress(file);
    } catch {
      this.photoError = this.i18n.t(
        'Photo invalide ou trop lourde (10 Mo maximum).',
        'Foto no válida o demasiado grande (máximo 10 MB).',
      );
      return '';
    } finally {
      input.value = '';
    }
  }
  async addEvent() {
    if (!this.eventTitle.trim() || !this.eventDate || !this.eventTime || !this.eventLocation.trim())
      return;
    this.savingEvent = true;
    this.eventActionMessage = '';
    this.eventActionError = '';
    const saved = await this.events.add({
      title: this.eventTitle.trim(),
      type: this.eventType,
      date: this.eventDate,
      time: this.eventTime,
      location: this.eventLocation.trim(),
      ...(this.eventDescription.trim() ? { description: this.eventDescription.trim() } : {}),
    });
    if (saved) {
      this.eventTitle = '';
      this.eventDescription = '';
      this.eventActionMessage = this.i18n.t(
        'Événement enregistré sur le serveur.',
        'Evento guardado en el servidor.',
      );
    } else
      this.eventActionError = this.i18n.t(
        'Le serveur n’a pas pu enregistrer l’événement.',
        'El servidor no pudo guardar el evento.',
      );
    this.savingEvent = false;
  }
  async removeEvent(id: string) {
    if (!(await this.events.remove(id)))
      this.eventActionError = this.i18n.t(
        'Suppression impossible sur le serveur.',
        'No se pudo eliminar del servidor.',
      );
  }
  eventTypeLabel(type: ClubEventType) {
    const labels: Record<ClubEventType, string> = {
      Entraînement: 'Entrenamiento',
      'Match amical': 'Partido amistoso',
      Réunion: 'Reunión',
      'Activité club': 'Actividad del club',
    };
    return this.i18n.language() === 'es' ? labels[type] : type;
  }
  async removeAgreement(acceptance: RulesAcceptance) {
    const confirmed = window.confirm(
      this.i18n.t(
        `Supprimer l’accord de ${acceptance.memberName} ?`,
        `¿Eliminar el acuerdo de ${acceptance.memberName}?`,
      ),
    );
    if (!confirmed) return;
    this.deletingAgreementId = acceptance.memberId;
    this.agreementDeleteError = '';
    this.agreementActionMessage = '';
    const result = await this.agreements.remove(acceptance.memberId);
    if (!result.removed)
      this.agreementDeleteError = `${this.i18n.t('Suppression impossible', 'No se pudo eliminar')}${result.error ? ` : ${result.error}` : '.'}`;
    else if (result.localOnly)
      this.agreementActionMessage = this.i18n.t(
        'Accord supprimé de ce navigateur. La formule LWS actuelle ne permet pas encore la synchronisation serveur PHP.',
        'Acuerdo eliminado de este navegador. El plan LWS actual todavía no permite la sincronización PHP.',
      );
    else
      this.agreementActionMessage = this.i18n.t(
        'Accord supprimé du registre central.',
        'Acuerdo eliminado del registro central.',
      );
    this.deletingAgreementId = '';
  }
}
