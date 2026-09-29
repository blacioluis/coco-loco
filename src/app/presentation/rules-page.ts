import { Component, inject, signal } from '@angular/core';
import { ClubFacade } from '../application/club.facade';
import { I18nService } from '../application/i18n.service';
import { RulesAgreementService } from '../application/rules-agreement.service';
import { RULES_AGREEMENT_CONFIG } from '../rules-agreement.config';

interface LocalizedText { fr: string; es: string; }
interface RuleSection {
  number: number;
  title: LocalizedText;
  paragraphs: LocalizedText[];
  bullets?: LocalizedText[];
  closing?: LocalizedText[];
  sanction?: LocalizedText;
}

@Component({
  selector: 'app-rules-page',
  standalone: true,
  template: `
    <main class="rules-page">
      <header class="rules-hero">
        <img src="assets/football-detail.png" alt="" class="rules-hero-image">
        <div class="rules-hero-shade"></div>
        <div class="rules-hero-copy"><p class="eyebrow">FORESTOIS SC 1 · D4C</p><h1>{{ t('Règlement', 'Reglamento') }} <em>{{ t('de l’équipe.', 'del equipo.') }}</em></h1><p>{{ t('Un cadre clair pour avancer ensemble, avec respect, discipline et esprit d’équipe.', 'Un marco claro para avanzar juntos, con respeto, disciplina y espíritu de equipo.') }}</p></div>
        <div class="rules-hero-badge"><img src="assets/club-coco.png" alt="Blason Forestois SC"><span><b>{{ rules.length }}</b>{{ t('règles', 'reglas') }}</span></div>
      </header>

      <section class="rules-intro">
        <div><p class="eyebrow">{{ t('NOTRE ENGAGEMENT', 'NUESTRO COMPROMISO') }}</p><h2>{{ t('Le collectif avant tout.', 'El equipo ante todo.') }}</h2></div>
        <p>{{ t('Ce règlement fixe un cadre commun pour tous les joueurs. Il vise à éviter les malentendus et à garantir le respect, l’organisation, la discipline et la cohésion au sein de l’équipe. Chaque membre du groupe est tenu de le respecter.', 'Este reglamento establece un marco común para todos los jugadores. Su objetivo es evitar malentendidos y garantizar el respeto, la organización, la disciplina y la cohesión dentro del equipo. Cada miembro del grupo debe respetarlo.') }}</p>
      </section>

      <section class="rules-key-dates" aria-label="{{ t('Échéances importantes', 'Plazos importantes') }}">
        <article><span>01</span><div><small>{{ t('CONVOCATION', 'CONVOCATORIA') }}</small><b>{{ t('Mercredi avant 20 h', 'Miércoles antes de las 20 h') }}</b><p>{{ t('Communication de la sélection pour le match.', 'Comunicación de la selección para el partido.') }}</p></div></article>
        <article><span>02</span><div><small>{{ t('RÉPONSE', 'RESPUESTA') }}</small><b>{{ t('Jeudi avant 19 h', 'Jueves antes de las 19 h') }}</b><p>{{ t('Confirmation obligatoire de présence ou d’absence.', 'Confirmación obligatoria de presencia o ausencia.') }}</p></div></article>
        <article><span>03</span><div><small>{{ t('DISCUSSION SPORTIVE', 'CONVERSACIÓN DEPORTIVA') }}</small><b>{{ t('Mardi avant l’entraînement', 'Martes antes del entrenamiento') }}</b><p>{{ t('Les décisions se discutent à froid, jamais après le match.', 'Las decisiones se hablan con calma, nunca después del partido.') }}</p></div></article>
      </section>

      <div class="rules-layout">
        <aside class="rules-toc"><p>{{ t('DANS CE RÈGLEMENT', 'EN ESTE REGLAMENTO') }}</p><nav>@for (rule of rules; track rule.number) { <a [href]="'#regle-' + rule.number"><span>{{ twoDigits(rule.number) }}</span>{{ text(rule.title) }}</a> }</nav></aside>
        <section class="rules-content">
          @for (rule of rules; track rule.number) {
            <article class="rule-article" [id]="'regle-' + rule.number">
              <header><span>{{ twoDigits(rule.number) }}</span><div><small>FORESTOIS SC 1</small><h2>{{ text(rule.title) }}</h2></div></header>
              <div class="rule-body">
                @for (paragraph of rule.paragraphs; track $index) { <p>{{ text(paragraph) }}</p> }
                @if (rule.bullets?.length) { <ul>@for (bullet of rule.bullets; track $index) { <li>{{ text(bullet) }}</li> }</ul> }
                @for (paragraph of rule.closing ?? []; track $index) { <p>{{ text(paragraph) }}</p> }
                @if (rule.sanction) { <div class="rule-sanction"><span>!</span><div><small>{{ t('SANCTION', 'SANCIÓN') }}</small><b>{{ text(rule.sanction) }}</b></div></div> }
              </div>
            </article>
          }
        </section>
      </div>

      @if (agreementConfig.enabled) {
        <section class="rules-agreement" id="accord-reglement">
          <header class="agreement-head">
            <div><p class="eyebrow">{{ t('ACCORD DU JOUEUR', 'ACUERDO DEL JUGADOR') }}</p><h2>{{ t('Je reconnais avoir lu le règlement.', 'Confirmo haber leído el reglamento.') }}</h2><p>{{ t('Choisis ton profil puis confirme ton accord. L’acceptation est enregistrée avec la date et l’heure.', 'Selecciona tu perfil y confirma tu acuerdo. La aceptación se registra con la fecha y la hora.') }}</p></div>
            <div class="agreement-count"><b>{{ agreement.currentAcceptances().length }}</b><span>{{ t('accords enregistrés', 'acuerdos registrados') }}</span></div>
          </header>
          <div class="agreement-warning"><span>!</span><div><b>{{ t('Condition de convocation', 'Condición de convocatoria') }}</b><p>{{ t('Un joueur qui n’a pas accepté le règlement avant la date limite ne pourra pas être convoqué pour un match.', 'Un jugador que no haya aceptado el reglamento antes de la fecha límite no podrá ser convocado para un partido.') }}</p><small>{{ agreementConfig.deadline ? t('Date limite : ', 'Fecha límite: ') + deadlineDate(agreementConfig.deadline) : t('La date limite sera communiquée par les responsables.', 'La fecha límite será comunicada por los responsables.') }}</small></div></div>
          @if (agreement.apiStatus() === 'online') { <div class="agreement-sync-status online"><i></i><b>{{ t('Serveur connecté', 'Servidor conectado') }}</b><span>{{ t('Les accords de tous les appareils sont regroupés dans le registre central.', 'Los acuerdos de todos los dispositivos se agrupan en el registro central.') }}</span></div> }
          @else if (agreement.apiStatus() === 'connecting') { <div class="agreement-sync-status"><i></i><b>{{ t('Connexion au registre…', 'Conexión al registro…') }}</b></div> }
          @else { <div class="agreement-sync-status offline"><i></i><b>{{ t('Mode hors ligne', 'Modo sin conexión') }}</b><span>{{ t('L’accord restera sur cet appareil et sera synchronisé dès que le serveur répondra.', 'El acuerdo permanecerá en este dispositivo y se sincronizará cuando el servidor responda.') }}</span></div> }
          <div class="agreement-progress"><div><span>{{ t('Progression des accords', 'Progreso de los acuerdos') }}</span><b>{{ agreement.currentAcceptances().length }} / {{ players.length }}</b></div><div class="agreement-progress-track"><span [style.width.%]="agreementProgress"></span></div><small>{{ pendingPlayers.length }} {{ t('joueur(s) encore en attente', 'jugador(es) todavía pendientes') }}</small></div>

          <div class="agreement-picker">
            <div class="agreement-picker-head"><div><p class="eyebrow">{{ t('EN ATTENTE', 'PENDIENTES') }}</p><h3>{{ t('Choisis ton nom pour accepter.', 'Selecciona tu nombre para aceptar.') }}</h3></div><span>{{ pendingPlayers.length }}</span></div>
            @if (pendingPlayers.length) { <div class="agreement-player-grid">@for (player of pendingPlayers; track player.id) {
              <button type="button" (click)="selectedMemberId.set(player.id)" [class.selected]="selectedMemberId() === player.id">
                @if (player.photoDataUrl) { <img [src]="player.photoDataUrl" [alt]="player.name"> } @else { <span class="agreement-avatar">{{ initials(player.name) }}</span> }
                <span class="agreement-player-name"><b>{{ player.name }}</b><small>{{ player.position ? i18n.position(player.position) : t('Joueur', 'Jugador') }}</small></span>
                <i>{{ selectedMemberId() === player.id ? '●' : '○' }}</i>
              </button>
            }</div> } @else { <div class="all-accepted"><span>✓</span><div><b>{{ t('Tout le groupe a accepté le règlement.', 'Todo el grupo ha aceptado el reglamento.') }}</b><small>{{ t('Le registre est complet pour cette version.', 'El registro está completo para esta versión.') }}</small></div></div> }
          </div>
          <div class="agreement-action">
            <div>@if (selectedPlayer; as player) { <span>{{ t('Profil sélectionné', 'Perfil seleccionado') }}</span><b>{{ player.name }}</b> } @else { <span>{{ t('Aucun joueur sélectionné', 'Ningún jugador seleccionado') }}</span> }</div>
            <button type="button" class="button" [disabled]="!selectedPlayer || selectedPlayerAccepted" (click)="confirmAgreement()">{{ selectedPlayerAccepted ? t('Accord déjà enregistré ✓', 'Acuerdo ya registrado ✓') : t('J’ai lu et j’accepte le règlement', 'He leído y acepto el reglamento') }}</button>
          </div>
          @if (confirmation()) { <div class="agreement-success">✓ {{ confirmation() }}</div> }
          <footer class="agreement-export"><div><b>{{ t('Registre des accords', 'Registro de acuerdos') }}</b><span>{{ t('Télécharge un fichier de sauvegarde après chaque nouvelle acceptation.', 'Descarga un archivo de respaldo después de cada nueva aceptación.') }}</span></div><button type="button" class="secondary-button button" (click)="agreement.exportJson()" [disabled]="!agreement.currentAcceptances().length">{{ t('Exporter le fichier JSON', 'Exportar archivo JSON') }} ↓</button></footer>

          <section class="accepted-section">
            <header><div><p class="eyebrow">{{ t('ACCORDS ENREGISTRÉS', 'ACUERDOS REGISTRADOS') }}</p><h3>{{ t('Ils ont déjà accepté.', 'Ya han aceptado.') }}</h3></div><span>{{ acceptedPlayers.length }}</span></header>
            @if (acceptedPlayers.length) { <div class="accepted-player-grid">@for (item of acceptedPlayers; track item.acceptance.memberId) {
              <article>
                @if (item.player?.photoDataUrl) { <img [src]="item.player?.photoDataUrl" [alt]="item.acceptance.memberName"> } @else { <span class="agreement-avatar accepted-avatar">{{ initials(item.acceptance.memberName) }}</span> }
                <div><b>{{ item.acceptance.memberName }}</b><small>{{ t('Accepté le', 'Aceptado el') }} {{ acceptanceDate(item.acceptance.acceptedAt) }}</small></div>
                <span class="accepted-check">✓</span>
              </article>
            }</div> } @else { <div class="accepted-empty"><span>✓</span><p>{{ t('Aucun accord enregistré pour le moment.', 'Todavía no hay acuerdos registrados.') }}</p></div> }
          </section>
        </section>
      }

      <footer class="rules-pledge"><img src="assets/club-coco.png" alt=""><div><p class="eyebrow">{{ t('UNE ÉQUIPE · UNE DIRECTION', 'UN EQUIPO · UNA DIRECCIÓN') }}</p><h2>{{ t('Chacun fait sa part.', 'Cada uno hace su parte.') }}</h2><p>{{ t('Le plus important reste que chacun contribue pour permettre à l’équipe d’avancer dans la même direction.', 'Lo más importante es que cada uno contribuya para que el equipo avance en la misma dirección.') }}</p></div></footer>
    </main>
  `,
})
export class RulesPage {
  readonly i18n = inject(I18nService);
  readonly club = inject(ClubFacade);
  readonly agreement = inject(RulesAgreementService);
  readonly agreementConfig = RULES_AGREEMENT_CONFIG;
  readonly rules: RuleSection[] = RULES;
  readonly selectedMemberId = signal<string | null>(null);
  readonly confirmation = signal('');
  get players() { return [...this.club.players()].sort((a, b) => a.name.localeCompare(b.name, 'fr')); }
  get pendingPlayers() { return this.players.filter((player) => !this.agreement.hasAccepted(player.id)); }
  get acceptedPlayers() {
    return [...this.agreement.currentAcceptances()]
      .sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt))
      .map((acceptance) => ({ acceptance, player: this.players.find((player) => player.id === acceptance.memberId) }));
  }
  get agreementProgress() { return this.players.length ? Math.round(this.agreement.currentAcceptances().length / this.players.length * 100) : 0; }
  get selectedPlayer() { return this.players.find((player) => player.id === this.selectedMemberId()); }
  get selectedPlayerAccepted() { return this.selectedPlayer ? this.agreement.hasAccepted(this.selectedPlayer.id) : false; }
  t(fr: string, es: string) { return this.i18n.t(fr, es); }
  text(value: LocalizedText) { return this.i18n.language() === 'es' ? value.es : value.fr; }
  twoDigits(value: number) { return String(value).padStart(2, '0'); }
  initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
  deadlineDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString(this.i18n.language() === 'es' ? 'es-BE' : 'fr-BE', { day: 'numeric', month: 'long', year: 'numeric' }); }
  acceptanceDate(value: string) { return new Date(value).toLocaleString(this.i18n.language() === 'es' ? 'es-BE' : 'fr-BE', { dateStyle: 'medium', timeStyle: 'short' }); }
  async confirmAgreement() {
    const player = this.selectedPlayer;
    if (!player || this.agreement.hasAccepted(player.id)) return;
    const accepted = await this.agreement.accept(player);
    this.confirmation.set(this.t(`Accord de ${accepted.memberName} enregistré le ${new Date(accepted.acceptedAt).toLocaleString('fr-BE')}.`, `Acuerdo de ${accepted.memberName} registrado el ${new Date(accepted.acceptedAt).toLocaleString('es-BE')}.`));
    this.selectedMemberId.set(null);
  }
}

const RULES: RuleSection[] = [
  {
    number: 1,
    title: { fr: 'Respect et comportement', es: 'Respeto y comportamiento' },
    paragraphs: [{ fr: 'Chaque joueur doit adopter un comportement respectueux envers toutes les personnes impliquées dans la vie du club :', es: 'Cada jugador debe mantener un comportamiento respetuoso hacia todas las personas implicadas en la vida del club:' }],
    bullets: [
      { fr: 'les autres joueurs et le staff ;', es: 'los demás jugadores y el cuerpo técnico;' },
      { fr: 'les responsables de l’équipe et la direction ;', es: 'los responsables del equipo y la dirección;' },
      { fr: 'les adversaires et les arbitres ;', es: 'los adversarios y los árbitros;' },
      { fr: 'toutes les personnes impliquées dans la vie du club.', es: 'todas las personas implicadas en la vida del club.' },
    ],
    closing: [
      { fr: 'Les conseils, remarques et critiques constructives doivent être écoutés et respectés. Un joueur peut ne pas être d’accord avec une remarque ou une décision, mais toute discussion doit se faire dans le calme et avec respect.', es: 'Los consejos, observaciones y críticas constructivas deben escucharse y respetarse. Un jugador puede no estar de acuerdo con una observación o decisión, pero toda conversación debe desarrollarse con calma y respeto.' },
      { fr: 'Les insultes, provocations, comportements agressifs ou manques de respect ne seront pas acceptés.', es: 'No se aceptarán insultos, provocaciones, comportamientos agresivos ni faltas de respeto.' },
    ],
  },
  {
    number: 2,
    title: { fr: 'Décisions sportives et changements', es: 'Decisiones deportivas y cambios' },
    paragraphs: [
      { fr: 'Une personne présente sur le banc, faisant partie de la direction ou désignée par celle-ci, sera chargée d’observer le match et de communiquer les changements qu’elle estime nécessaires.', es: 'Una persona presente en el banquillo, miembro de la dirección o designada por ella, observará el partido y comunicará los cambios que considere necesarios.' },
      { fr: 'Les changements seront discutés et décidés par les responsables de l’équipe. Une fois la décision prise, elle devra être respectée et ne sera plus modifiée.', es: 'Los cambios serán debatidos y decididos por los responsables del equipo. Una vez tomada la decisión, deberá respetarse y no se modificará.' },
      { fr: 'Si un joueur n’est pas d’accord, il pourra en discuter avec les responsables le mardi avant l’entraînement, notamment concernant :', es: 'Si un jugador no está de acuerdo, podrá hablarlo con los responsables el martes antes del entrenamiento, especialmente sobre:' },
    ],
    bullets: [
      { fr: 'son remplacement ou son temps de jeu ;', es: 'su sustitución o tiempo de juego;' },
      { fr: 'sa titularisation ou son positionnement ;', es: 'su titularidad o posición;' },
      { fr: 'toute autre décision sportive.', es: 'cualquier otra decisión deportiva.' },
    ],
    closing: [{ fr: 'Aucune discussion de ce type ne sera faite directement après le match. L’objectif est d’éviter les échanges à chaud et de discuter dans de meilleures conditions.', es: 'Este tipo de conversación no tendrá lugar inmediatamente después del partido. El objetivo es evitar discusiones en caliente y hablar en mejores condiciones.' }],
    sanction: { fr: 'En cas de manque de respect envers une décision ou les responsables : non retenu pour 1 match.', es: 'En caso de falta de respeto hacia una decisión o los responsables: no convocado para 1 partido.' },
  },
  {
    number: 3,
    title: { fr: 'Convocation pour les matchs', es: 'Convocatoria para los partidos' },
    paragraphs: [
      { fr: 'La convocation pour le match sera communiquée chaque mercredi avant 20 h.', es: 'La convocatoria para el partido se comunicará cada miércoles antes de las 20 h.' },
      { fr: 'Chaque joueur est responsable de prendre connaissance de la convocation et d’y répondre dans les délais prévus.', es: 'Cada jugador es responsable de consultar la convocatoria y responder dentro del plazo previsto.' },
    ],
  },
  {
    number: 4,
    title: { fr: 'Réponse pour les matchs', es: 'Respuesta para los partidos' },
    paragraphs: [
      { fr: 'Chaque joueur doit confirmer sa présence ou son absence avant le jeudi à 19 h.', es: 'Cada jugador debe confirmar su presencia o ausencia antes del jueves a las 19 h.' },
      { fr: 'Après ce délai, un joueur qui n’a pas répondu pourra ne pas être retenu pour le match.', es: 'Después de este plazo, un jugador que no haya respondido podrá quedar fuera de la convocatoria.' },
      { fr: 'Une exception pourra être faite si le joueur a prévenu à l’avance d’une situation particulière, sans que les responsables doivent le relancer. Chaque joueur est responsable de sa propre organisation.', es: 'Podrá hacerse una excepción si el jugador avisó con antelación de una situación particular, sin que los responsables tengan que recordárselo. Cada jugador es responsable de su propia organización.' },
    ],
  },
  {
    number: 5,
    title: { fr: 'Boissons et affaires personnelles pour les matchs', es: 'Bebidas y objetos personales para los partidos' },
    paragraphs: [
      { fr: 'Pour chaque match, les joueurs désignés pour apporter les boissons doivent respecter les consignes données concernant le type de boissons demandé.', es: 'Para cada partido, los jugadores designados para traer las bebidas deben respetar las instrucciones sobre el tipo de bebidas solicitado.' },
      { fr: 'Les boissons doivent être apportées froides. Si nécessaire, la personne désignée peut prévoir des glaçons ou demander le frigobox de l’équipe afin de garder les boissons au frais.', es: 'Las bebidas deben traerse frías. Si es necesario, la persona designada puede llevar hielo o solicitar la nevera portátil del equipo para mantenerlas frescas.' },
      { fr: 'De l’eau pourra également être apportée avec les boissons, mais celle-ci reste complémentaire et n’est pas prévue pour couvrir les besoins de toute l’équipe.', es: 'También se puede traer agua con las bebidas, pero será complementaria y no está destinada a cubrir las necesidades de todo el equipo.' },
      { fr: 'Chaque joueur doit donc penser à prendre personnellement :', es: 'Por tanto, cada jugador debe acordarse de llevar personalmente:' },
    ],
    bullets: [
      { fr: 'sa bouteille d’eau ;', es: 'su botella de agua;' },
      { fr: 'sa carte d’identité.', es: 'su documento de identidad.' },
    ],
    closing: [{ fr: 'Cela permet également de respecter les boissons prévues pour les autres joueurs.', es: 'Esto permite también respetar las bebidas previstas para los demás jugadores.' }],
    sanction: { fr: 'Si les boissons ne sont pas apportées correctement ou ne respectent pas les critères demandés, la personne désignée devra recommencer la semaine suivante.', es: 'Si las bebidas no se traen correctamente o no cumplen los criterios solicitados, la persona designada deberá repetir la tarea la semana siguiente.' },
  },
  {
    number: 6,
    title: { fr: 'Retards aux matchs', es: 'Retrasos en los partidos' },
    paragraphs: [
      { fr: 'Les joueurs doivent respecter l’heure de rendez-vous communiquée pour chaque match. Si un joueur arrive en retard et devait commencer comme titulaire, il débutera sur le banc.', es: 'Los jugadores deben respetar la hora de encuentro comunicada para cada partido. Si un jugador llega tarde y debía ser titular, comenzará en el banquillo.' },
      { fr: 'Prévenir d’un retard reste important, mais cela ne doit pas devenir une habitude.', es: 'Avisar de un retraso sigue siendo importante, pero no debe convertirse en una costumbre.' },
    ],
    sanction: { fr: '3 € par retard non signalé ou répété. À partir de 3 retards aux matchs : non retenu pour 1 match.', es: '3 € por retraso no avisado o repetido. A partir de 3 retrasos en partidos: no convocado para 1 partido.' },
  },
  {
    number: 7,
    title: { fr: 'Retards aux entraînements', es: 'Retrasos en los entrenamientos' },
    paragraphs: [
      { fr: 'Les joueurs doivent arriver à l’heure aux entraînements. Prévenir d’un retard ne doit pas devenir une habitude.', es: 'Los jugadores deben llegar puntuales a los entrenamientos. Avisar de un retraso no debe convertirse en una costumbre.' },
    ],
    sanction: { fr: '2 € par retard non signalé ou répété. À partir de 3 retards, si les sanctions dues ne sont pas payées : non retenu pour le match suivant.', es: '2 € por retraso no avisado o repetido. A partir de 3 retrasos, si las sanciones pendientes no están pagadas: no convocado para el siguiente partido.' },
  },
  {
    number: 8,
    title: { fr: 'Cohésion d’équipe', es: 'Cohesión del equipo' },
    paragraphs: [
      { fr: 'Dans la mesure du possible, les joueurs sont encouragés à rester un moment après les matchs afin de partager un moment ensemble et de renforcer la cohésion du groupe.', es: 'En la medida de lo posible, se anima a los jugadores a quedarse un momento después de los partidos para compartir juntos y reforzar la cohesión del grupo.' },
      { fr: 'Il ne s’agit pas d’une obligation lorsqu’un joueur a un impératif personnel, familial ou professionnel. L’objectif est de créer une vraie vie de groupe et d’éviter que chacun parte systématiquement de son côté directement après le match.', es: 'No es una obligación cuando un jugador tiene un compromiso personal, familiar o profesional. El objetivo es crear una verdadera vida de grupo y evitar que cada uno se marche siempre por su lado justo después del partido.' },
      { fr: 'Des activités de team building pourront également être organisées durant la saison afin de renforcer la cohésion et l’esprit d’équipe.', es: 'También podrán organizarse actividades de team building durante la temporada para reforzar la cohesión y el espíritu de equipo.' },
    ],
  },
  {
    number: 9,
    title: { fr: 'Rangement du matériel', es: 'Recogida del material' },
    paragraphs: [
      { fr: 'À la fin des entraînements ou des matchs, une ou deux personnes pourront être désignées pour aider au rangement du matériel.', es: 'Al final de los entrenamientos o partidos, se podrá designar a una o dos personas para ayudar a recoger el material.' },
      { fr: 'Les joueurs seront désignés par une personne responsable de l’équipe ou par le président. Lorsqu’un joueur est désigné, il doit participer au rangement avant de quitter les installations.', es: 'Los jugadores serán designados por un responsable del equipo o por el presidente. Cuando un jugador sea designado, deberá ayudar a recoger antes de abandonar las instalaciones.' },
      { fr: 'Le matériel appartient à toute l’équipe et chacun doit participer à son entretien.', es: 'El material pertenece a todo el equipo y todos deben participar en su mantenimiento.' },
    ],
  },
  {
    number: 10,
    title: { fr: 'Lavage et gestion des équipements', es: 'Lavado y gestión de las equipaciones' },
    paragraphs: [
      { fr: 'Chaque joueur est responsable de préparer correctement son équipement avant de le remettre à la personne chargée du lavage. Les t-shirts et shorts doivent être remis dans le bon sens.', es: 'Cada jugador es responsable de preparar correctamente su equipación antes de entregarla a la persona encargada del lavado. Las camisetas y pantalones deben entregarse del derecho.' },
      { fr: 'Seuls les éléments suivants doivent être remis :', es: 'Solo deben entregarse los siguientes elementos:' },
    ],
    bullets: [
      { fr: 'le t-shirt ;', es: 'la camiseta;' },
      { fr: 'le short.', es: 'el pantalón.' },
    ],
    closing: [
      { fr: 'Les chaussettes, sous-vêtements ou autres vêtements personnels ne sont pas acceptés dans le sac de lavage.', es: 'Los calcetines, ropa interior u otras prendas personales no se aceptan en la bolsa de lavado.' },
      { fr: 'Après le lavage, les équipements doivent être classés par numéro, avec le t-shirt et le short correspondants. La personne chargée du lavage doit effectuer un inventaire et communiquer les numéros manquants aux responsables.', es: 'Después del lavado, las equipaciones deben ordenarse por número, con la camiseta y el pantalón correspondientes. La persona encargada debe hacer inventario y comunicar los números que falten.' },
    ],
    sanction: { fr: 'Tout joueur qui repart avec un équipement sans autorisation sera responsable du lavage pendant les 2 semaines suivantes.', es: 'Todo jugador que se lleve una equipación sin autorización será responsable del lavado durante las 2 semanas siguientes.' },
  },
  {
    number: 11,
    title: { fr: 'Utilisation des sanctions financières', es: 'Uso de las sanciones económicas' },
    paragraphs: [{ fr: 'L’argent récolté grâce aux sanctions financières sera utilisé uniquement au bénéfice de l’équipe. Il pourra notamment servir à :', es: 'El dinero recaudado mediante las sanciones económicas se utilizará únicamente en beneficio del equipo. Podrá servir, entre otras cosas, para:' }],
    bullets: [
      { fr: 'acheter ou remplacer du matériel perdu ou endommagé ;', es: 'comprar o sustituir material perdido o dañado;' },
      { fr: 'financer certains besoins de l’équipe ;', es: 'financiar determinadas necesidades del equipo;' },
      { fr: 'participer à un team building ou une activité collective ;', es: 'contribuir a un team building o una actividad colectiva;' },
      { fr: 'couvrir toute autre dépense utile au groupe.', es: 'cubrir cualquier otro gasto útil para el grupo.' },
    ],
    closing: [{ fr: 'L’objectif n’est pas de gagner de l’argent, mais de responsabiliser les joueurs et de réutiliser les montants récoltés pour l’équipe.', es: 'El objetivo no es ganar dinero, sino responsabilizar a los jugadores y reutilizar las cantidades recaudadas para el equipo.' }],
  },
  {
    number: 12,
    title: { fr: 'Respect général du règlement', es: 'Respeto general del reglamento' },
    paragraphs: [
      { fr: 'Les règles s’appliquent à tous les joueurs de la même manière. Faire partie du SC Forestois 1 implique notamment de respecter :', es: 'Las reglas se aplican de la misma manera a todos los jugadores. Formar parte del SC Forestois 1 implica respetar especialmente:' },
    ],
    bullets: [
      { fr: 'les horaires et les convocations ;', es: 'los horarios y las convocatorias;' },
      { fr: 'les responsables et les décisions sportives ;', es: 'los responsables y las decisiones deportivas;' },
      { fr: 'les autres joueurs et le matériel ;', es: 'los demás jugadores y el material;' },
      { fr: 'les engagements pris envers l’équipe.', es: 'los compromisos adquiridos con el equipo.' },
    ],
    closing: [
      { fr: 'Les sanctions prévues ont pour objectif de maintenir un cadre clair, une bonne organisation et une bonne ambiance au sein du groupe.', es: 'Las sanciones previstas tienen como objetivo mantener un marco claro, una buena organización y un buen ambiente en el grupo.' },
      { fr: 'Le plus important reste que chacun fasse sa part pour permettre à l’équipe d’avancer dans la même direction.', es: 'Lo más importante es que cada uno haga su parte para que el equipo avance en la misma dirección.' },
    ],
  },
];
