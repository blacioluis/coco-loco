import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ClubFacade } from '../application/club.facade';
import { I18nService } from '../application/i18n.service';
import { RulesAgreementService } from '../application/rules-agreement.service';
import { ClubMember } from '../domain/club.models';
import { RULES_AGREEMENT_CONFIG } from '../rules-agreement.config';

interface LocalizedText {
  fr: string;
  es: string;
}
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
  templateUrl: './rules-page.html',
  styleUrl: './rules-page.scss',
})
export class RulesPage {
  readonly i18n = inject(I18nService);
  readonly club = inject(ClubFacade);
  readonly agreement = inject(RulesAgreementService);
  readonly agreementConfig = RULES_AGREEMENT_CONFIG;
  readonly rules: RuleSection[] = RULES;
  readonly selectedMemberId = signal<string | null>(null);
  readonly confirmation = signal('');
  readonly refreshingAgreements = signal(false);
  readonly refreshCooldown = signal(0);
  readonly refreshNotice = signal('');
  private readonly destroyRef = inject(DestroyRef);
  private refreshTimer?: ReturnType<typeof setInterval>;
  constructor() {
    this.destroyRef.onDestroy(() => this.stopRefreshTimer());
    void this.refreshAgreements(false);
  }
  get players() {
    return [...this.club.players()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
  get pendingPlayers() {
    return this.players.filter((player) => !this.agreement.hasAccepted(player.id));
  }
  get activeAcceptances() {
    const activeIds = new Set(this.players.map((player) => player.id));
    return this.agreement
      .currentAcceptances()
      .filter((acceptance) => activeIds.has(acceptance.memberId));
  }
  get acceptedPlayers() {
    return [...this.activeAcceptances]
      .sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt))
      .map((acceptance) => ({
        acceptance,
        player: this.players.find((player) => player.id === acceptance.memberId),
      }));
  }
  get agreementProgress() {
    return this.players.length
      ? Math.round((this.activeAcceptances.length / this.players.length) * 100)
      : 0;
  }
  get selectedPlayer() {
    return this.players.find((player) => player.id === this.selectedMemberId());
  }
  get selectedPlayerAccepted() {
    return this.selectedPlayer ? this.agreement.hasAccepted(this.selectedPlayer.id) : false;
  }
  t(fr: string, es: string) {
    return this.i18n.t(fr, es);
  }
  text(value: LocalizedText) {
    return this.i18n.language() === 'es' ? value.es : value.fr;
  }
  twoDigits(value: number) {
    return String(value).padStart(2, '0');
  }
  scrollToRule(ruleNumber: number) {
    document
      .getElementById(`regle-${ruleNumber}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  initials(name: string) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  positionsLabel(member: ClubMember) {
    const positions = member.positions?.length
      ? member.positions
      : member.position
        ? [member.position]
        : [];
    return positions.length
      ? positions.map((position) => this.i18n.position(position)).join(' · ')
      : this.t('Joueur', 'Jugador');
  }
  deadlineDate(value: string) {
    return new Date(`${value}T12:00:00`).toLocaleDateString(
      this.i18n.language() === 'es' ? 'es-BE' : 'fr-BE',
      { day: 'numeric', month: 'long', year: 'numeric' },
    );
  }
  acceptanceDate(value: string) {
    return new Date(value).toLocaleString(this.i18n.language() === 'es' ? 'es-BE' : 'fr-BE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  async refreshAgreements(userTriggered = true) {
    if (this.refreshingAgreements() || (userTriggered && this.refreshCooldown() > 0)) return;
    this.refreshingAgreements.set(true);
    const serverAvailable = await this.agreement.refresh();
    this.refreshingAgreements.set(false);
    if (!userTriggered) return;
    this.refreshNotice.set(
      serverAvailable
        ? this.t(
            'La liste a été synchronisée avec le registre central.',
            'La lista se ha sincronizado con el registro central.',
          )
        : this.t(
            'Le serveur central est indisponible. Aucune donnée locale n’est utilisée.',
            'El servidor central no está disponible. No se utilizan datos locales.',
          ),
    );
    this.startRefreshTimer();
  }
  private startRefreshTimer() {
    this.stopRefreshTimer();
    this.refreshCooldown.set(60);
    this.refreshTimer = setInterval(() => {
      const next = this.refreshCooldown() - 1;
      this.refreshCooldown.set(Math.max(0, next));
      if (next <= 0) this.stopRefreshTimer();
    }, 1000);
  }
  private stopRefreshTimer() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = undefined;
  }
  async confirmAgreement() {
    const player = this.selectedPlayer;
    if (!player || this.agreement.hasAccepted(player.id)) return;
    const accepted = await this.agreement.accept(player);
    if (!accepted) {
      this.confirmation.set(
        this.t(
          'Accord non enregistré : le serveur est indisponible. Réessaie dans quelques instants.',
          'Acuerdo no registrado: el servidor no está disponible. Inténtalo de nuevo en unos instantes.',
        ),
      );
      return;
    }
    this.confirmation.set(
      this.t(
        `Accord de ${accepted.memberName} enregistré le ${new Date(accepted.acceptedAt).toLocaleString('fr-BE')}.`,
        `Acuerdo de ${accepted.memberName} registrado el ${new Date(accepted.acceptedAt).toLocaleString('es-BE')}.`,
      ),
    );
    this.selectedMemberId.set(null);
  }
}

const RULES: RuleSection[] = [
  {
    number: 1,
    title: { fr: 'Respect et comportement', es: 'Respeto y comportamiento' },
    paragraphs: [
      {
        fr: 'Chaque joueur doit adopter un comportement respectueux envers toutes les personnes impliquées dans la vie du club :',
        es: 'Cada jugador debe mantener un comportamiento respetuoso hacia todas las personas implicadas en la vida del club:',
      },
    ],
    bullets: [
      { fr: 'les autres joueurs et le staff ;', es: 'los demás jugadores y el cuerpo técnico;' },
      {
        fr: 'les responsables de l’équipe et la direction ;',
        es: 'los responsables del equipo y la dirección;',
      },
      { fr: 'les adversaires et les arbitres ;', es: 'los adversarios y los árbitros;' },
      {
        fr: 'toutes les personnes impliquées dans la vie du club.',
        es: 'todas las personas implicadas en la vida del club.',
      },
    ],
    closing: [
      {
        fr: 'Les conseils, remarques et critiques constructives doivent être écoutés et respectés. Un joueur peut ne pas être d’accord avec une remarque ou une décision, mais toute discussion doit se faire dans le calme et avec respect.',
        es: 'Los consejos, observaciones y críticas constructivas deben escucharse y respetarse. Un jugador puede no estar de acuerdo con una observación o decisión, pero toda conversación debe desarrollarse con calma y respeto.',
      },
      {
        fr: 'Les insultes, provocations, comportements agressifs ou manques de respect ne seront pas acceptés.',
        es: 'No se aceptarán insultos, provocaciones, comportamientos agresivos ni faltas de respeto.',
      },
    ],
  },
  {
    number: 2,
    title: { fr: 'Décisions sportives et changements', es: 'Decisiones deportivas y cambios' },
    paragraphs: [
      {
        fr: 'Une personne présente sur le banc, faisant partie de la direction ou désignée par celle-ci, sera chargée d’observer le match et de communiquer les changements qu’elle estime nécessaires.',
        es: 'Una persona presente en el banquillo, miembro de la dirección o designada por ella, observará el partido y comunicará los cambios que considere necesarios.',
      },
      {
        fr: 'Les changements seront discutés et décidés par les responsables de l’équipe. Une fois la décision prise, elle devra être respectée et ne sera plus modifiée.',
        es: 'Los cambios serán debatidos y decididos por los responsables del equipo. Una vez tomada la decisión, deberá respetarse y no se modificará.',
      },
      {
        fr: 'Si un joueur n’est pas d’accord, il pourra en discuter avec les responsables le mardi avant l’entraînement, notamment concernant :',
        es: 'Si un jugador no está de acuerdo, podrá hablarlo con los responsables el martes antes del entrenamiento, especialmente sobre:',
      },
    ],
    bullets: [
      { fr: 'son remplacement ou son temps de jeu ;', es: 'su sustitución o tiempo de juego;' },
      { fr: 'sa titularisation ou son positionnement ;', es: 'su titularidad o posición;' },
      { fr: 'toute autre décision sportive.', es: 'cualquier otra decisión deportiva.' },
    ],
    closing: [
      {
        fr: 'Aucune discussion de ce type ne sera faite directement après le match. L’objectif est d’éviter les échanges à chaud et de discuter dans de meilleures conditions.',
        es: 'Este tipo de conversación no tendrá lugar inmediatamente después del partido. El objetivo es evitar discusiones en caliente y hablar en mejores condiciones.',
      },
    ],
    sanction: {
      fr: 'En cas de manque de respect envers une décision ou les responsables : non retenu pour 1 match.',
      es: 'En caso de falta de respeto hacia una decisión o los responsables: no convocado para 1 partido.',
    },
  },
  {
    number: 3,
    title: { fr: 'Convocation pour les matchs', es: 'Convocatoria para los partidos' },
    paragraphs: [
      {
        fr: 'La convocation pour le match sera communiquée chaque mercredi avant 20 h.',
        es: 'La convocatoria para el partido se comunicará cada miércoles antes de las 20 h.',
      },
      {
        fr: 'Chaque joueur est responsable de prendre connaissance de la convocation et d’y répondre dans les délais prévus.',
        es: 'Cada jugador es responsable de consultar la convocatoria y responder dentro del plazo previsto.',
      },
    ],
  },
  {
    number: 4,
    title: { fr: 'Réponse pour les matchs', es: 'Respuesta para los partidos' },
    paragraphs: [
      {
        fr: 'Chaque joueur doit confirmer sa présence ou son absence avant le jeudi à 19 h.',
        es: 'Cada jugador debe confirmar su presencia o ausencia antes del jueves a las 19 h.',
      },
      {
        fr: 'Après ce délai, un joueur qui n’a pas répondu pourra ne pas être retenu pour le match.',
        es: 'Después de este plazo, un jugador que no haya respondido podrá quedar fuera de la convocatoria.',
      },
      {
        fr: 'Une exception pourra être faite si le joueur a prévenu à l’avance d’une situation particulière, sans que les responsables doivent le relancer. Chaque joueur est responsable de sa propre organisation.',
        es: 'Podrá hacerse una excepción si el jugador avisó con antelación de una situación particular, sin que los responsables tengan que recordárselo. Cada jugador es responsable de su propia organización.',
      },
    ],
  },
  {
    number: 5,
    title: {
      fr: 'Boissons et affaires personnelles pour les matchs',
      es: 'Bebidas y objetos personales para los partidos',
    },
    paragraphs: [
      {
        fr: 'Pour chaque match, les joueurs désignés pour apporter les boissons doivent respecter les consignes données concernant le type de boissons demandé.',
        es: 'Para cada partido, los jugadores designados para traer las bebidas deben respetar las instrucciones sobre el tipo de bebidas solicitado.',
      },
      {
        fr: 'Les boissons doivent être apportées froides. Si nécessaire, la personne désignée peut prévoir des glaçons ou demander le frigobox de l’équipe afin de garder les boissons au frais.',
        es: 'Las bebidas deben traerse frías. Si es necesario, la persona designada puede llevar hielo o solicitar la nevera portátil del equipo para mantenerlas frescas.',
      },
      {
        fr: 'De l’eau pourra également être apportée avec les boissons, mais celle-ci reste complémentaire et n’est pas prévue pour couvrir les besoins de toute l’équipe.',
        es: 'También se puede traer agua con las bebidas, pero será complementaria y no está destinada a cubrir las necesidades de todo el equipo.',
      },
      {
        fr: 'Chaque joueur doit donc penser à prendre personnellement :',
        es: 'Por tanto, cada jugador debe acordarse de llevar personalmente:',
      },
    ],
    bullets: [
      { fr: 'sa bouteille d’eau ;', es: 'su botella de agua;' },
      { fr: 'sa carte d’identité.', es: 'su documento de identidad.' },
    ],
    closing: [
      {
        fr: 'Cela permet également de respecter les boissons prévues pour les autres joueurs.',
        es: 'Esto permite también respetar las bebidas previstas para los demás jugadores.',
      },
    ],
    sanction: {
      fr: 'Si les boissons ne sont pas apportées correctement ou ne respectent pas les critères demandés, la personne désignée devra recommencer la semaine suivante.',
      es: 'Si las bebidas no se traen correctamente o no cumplen los criterios solicitados, la persona designada deberá repetir la tarea la semana siguiente.',
    },
  },
  {
    number: 6,
    title: { fr: 'Retards aux matchs', es: 'Retrasos en los partidos' },
    paragraphs: [
      {
        fr: 'Les joueurs doivent respecter l’heure de rendez-vous communiquée pour chaque match. Si un joueur arrive en retard et devait commencer comme titulaire, il débutera sur le banc.',
        es: 'Los jugadores deben respetar la hora de encuentro comunicada para cada partido. Si un jugador llega tarde y debía ser titular, comenzará en el banquillo.',
      },
      {
        fr: 'Prévenir d’un retard reste important, mais cela ne doit pas devenir une habitude.',
        es: 'Avisar de un retraso sigue siendo importante, pero no debe convertirse en una costumbre.',
      },
    ],
    sanction: {
      fr: '3 € par retard non signalé ou répété. À partir de 3 retards aux matchs : non retenu pour 1 match.',
      es: '3 € por retraso no avisado o repetido. A partir de 3 retrasos en partidos: no convocado para 1 partido.',
    },
  },
  {
    number: 7,
    title: { fr: 'Retards aux entraînements', es: 'Retrasos en los entrenamientos' },
    paragraphs: [
      {
        fr: 'Les joueurs doivent arriver à l’heure aux entraînements. Prévenir d’un retard ne doit pas devenir une habitude.',
        es: 'Los jugadores deben llegar puntuales a los entrenamientos. Avisar de un retraso no debe convertirse en una costumbre.',
      },
    ],
    sanction: {
      fr: '2 € par retard non signalé ou répété. À partir de 3 retards, si les sanctions dues ne sont pas payées : non retenu pour le match suivant.',
      es: '2 € por retraso no avisado o repetido. A partir de 3 retrasos, si las sanciones pendientes no están pagadas: no convocado para el siguiente partido.',
    },
  },
  {
    number: 8,
    title: { fr: 'Cohésion d’équipe', es: 'Cohesión del equipo' },
    paragraphs: [
      {
        fr: 'Dans la mesure du possible, les joueurs sont encouragés à rester un moment après les matchs afin de partager un moment ensemble et de renforcer la cohésion du groupe.',
        es: 'En la medida de lo posible, se anima a los jugadores a quedarse un momento después de los partidos para compartir juntos y reforzar la cohesión del grupo.',
      },
      {
        fr: 'Il ne s’agit pas d’une obligation lorsqu’un joueur a un impératif personnel, familial ou professionnel. L’objectif est de créer une vraie vie de groupe et d’éviter que chacun parte systématiquement de son côté directement après le match.',
        es: 'No es una obligación cuando un jugador tiene un compromiso personal, familiar o profesional. El objetivo es crear una verdadera vida de grupo y evitar que cada uno se marche siempre por su lado justo después del partido.',
      },
      {
        fr: 'Des activités de team building pourront également être organisées durant la saison afin de renforcer la cohésion et l’esprit d’équipe.',
        es: 'También podrán organizarse actividades de team building durante la temporada para reforzar la cohesión y el espíritu de equipo.',
      },
    ],
  },
  {
    number: 9,
    title: { fr: 'Rangement du matériel', es: 'Recogida del material' },
    paragraphs: [
      {
        fr: 'À la fin des entraînements ou des matchs, une ou deux personnes pourront être désignées pour aider au rangement du matériel.',
        es: 'Al final de los entrenamientos o partidos, se podrá designar a una o dos personas para ayudar a recoger el material.',
      },
      {
        fr: 'Les joueurs seront désignés par une personne responsable de l’équipe ou par le président. Lorsqu’un joueur est désigné, il doit participer au rangement avant de quitter les installations.',
        es: 'Los jugadores serán designados por un responsable del equipo o por el presidente. Cuando un jugador sea designado, deberá ayudar a recoger antes de abandonar las instalaciones.',
      },
      {
        fr: 'Le matériel appartient à toute l’équipe et chacun doit participer à son entretien.',
        es: 'El material pertenece a todo el equipo y todos deben participar en su mantenimiento.',
      },
    ],
  },
  {
    number: 10,
    title: { fr: 'Lavage et gestion des équipements', es: 'Lavado y gestión de las equipaciones' },
    paragraphs: [
      {
        fr: 'Chaque joueur est responsable de préparer correctement son équipement avant de le remettre à la personne chargée du lavage. Les t-shirts et shorts doivent être remis dans le bon sens.',
        es: 'Cada jugador es responsable de preparar correctamente su equipación antes de entregarla a la persona encargada del lavado. Las camisetas y pantalones deben entregarse del derecho.',
      },
      {
        fr: 'Seuls les éléments suivants doivent être remis :',
        es: 'Solo deben entregarse los siguientes elementos:',
      },
    ],
    bullets: [
      { fr: 'le t-shirt ;', es: 'la camiseta;' },
      { fr: 'le short.', es: 'el pantalón.' },
    ],
    closing: [
      {
        fr: 'Les chaussettes, sous-vêtements ou autres vêtements personnels ne sont pas acceptés dans le sac de lavage.',
        es: 'Los calcetines, ropa interior u otras prendas personales no se aceptan en la bolsa de lavado.',
      },
      {
        fr: 'Après le lavage, les équipements doivent être classés par numéro, avec le t-shirt et le short correspondants. La personne chargée du lavage doit effectuer un inventaire et communiquer les numéros manquants aux responsables.',
        es: 'Después del lavado, las equipaciones deben ordenarse por número, con la camiseta y el pantalón correspondientes. La persona encargada debe hacer inventario y comunicar los números que falten.',
      },
    ],
    sanction: {
      fr: 'Tout joueur qui repart avec un équipement sans autorisation sera responsable du lavage pendant les 2 semaines suivantes.',
      es: 'Todo jugador que se lleve una equipación sin autorización será responsable del lavado durante las 2 semanas siguientes.',
    },
  },
  {
    number: 11,
    title: { fr: 'Utilisation des sanctions financières', es: 'Uso de las sanciones económicas' },
    paragraphs: [
      {
        fr: 'L’argent récolté grâce aux sanctions financières sera utilisé uniquement au bénéfice de l’équipe. Il pourra notamment servir à :',
        es: 'El dinero recaudado mediante las sanciones económicas se utilizará únicamente en beneficio del equipo. Podrá servir, entre otras cosas, para:',
      },
    ],
    bullets: [
      {
        fr: 'acheter ou remplacer du matériel perdu ou endommagé ;',
        es: 'comprar o sustituir material perdido o dañado;',
      },
      {
        fr: 'financer certains besoins de l’équipe ;',
        es: 'financiar determinadas necesidades del equipo;',
      },
      {
        fr: 'participer à un team building ou une activité collective ;',
        es: 'contribuir a un team building o una actividad colectiva;',
      },
      {
        fr: 'couvrir toute autre dépense utile au groupe.',
        es: 'cubrir cualquier otro gasto útil para el grupo.',
      },
    ],
    closing: [
      {
        fr: 'L’objectif n’est pas de gagner de l’argent, mais de responsabiliser les joueurs et de réutiliser les montants récoltés pour l’équipe.',
        es: 'El objetivo no es ganar dinero, sino responsabilizar a los jugadores y reutilizar las cantidades recaudadas para el equipo.',
      },
    ],
  },
  {
    number: 12,
    title: { fr: 'Arrivée de nouveaux joueurs', es: 'Llegada de nuevos jugadores' },
    paragraphs: [
      {
        fr: 'Tout joueur qui souhaite inviter ou amener une personne supplémentaire à un entraînement ou à une activité de l’équipe doit prévenir les responsables au préalable.',
        es: 'Todo jugador que quiera invitar o traer a una persona adicional a un entrenamiento o a una actividad del equipo debe avisar previamente a los responsables.',
      },
      {
        fr: 'La personne pourra rejoindre le groupe uniquement après avoir reçu l’accord explicite d’un responsable. Sans cet accord, elle ne devra pas se présenter.',
        es: 'La persona solo podrá incorporarse al grupo después de recibir la autorización expresa de un responsable. Sin esta autorización, no deberá presentarse.',
      },
    ],
    closing: [
      {
        fr: 'Nous sommes déjà nombreux : cette règle permet de bien gérer l’effectif, de préserver la qualité des entraînements et de maintenir un bon niveau sportif. Merci pour votre compréhension.',
        es: 'Ya somos un grupo numeroso: esta regla permite gestionar bien la plantilla, preservar la calidad de los entrenamientos y mantener un buen nivel deportivo. Gracias por vuestra comprensión.',
      },
    ],
  },
  {
    number: 13,
    title: { fr: 'Paiement de la cotisation', es: 'Pago de la cuota' },
    paragraphs: [
      {
        fr: 'Chaque joueur doit payer la cotisation demandée pour la saison.',
        es: 'Cada jugador debe pagar la cuota solicitada para la temporada.',
      },
      {
        fr: 'Le montant de la cotisation ainsi que la date limite de paiement sont communiqués par le président de l’équipe. La totalité du montant indiqué doit être payée avant cette date.',
        es: 'El importe de la cuota y la fecha límite de pago serán comunicados por el presidente del equipo. El importe total indicado deberá pagarse antes de esa fecha.',
      },
    ],
    closing: [
      {
        fr: 'En cas de difficulté, le joueur doit prévenir les responsables avant la date limite afin d’en discuter.',
        es: 'En caso de dificultad, el jugador deberá avisar a los responsables antes de la fecha límite para poder hablar de la situación.',
      },
    ],
  },
  {
    number: 14,
    title: { fr: 'Critères de convocation', es: 'Criterios de convocatoria' },
    paragraphs: [
      {
        fr: 'La présence à l’entraînement est le premier critère de convocation. Les joueurs qui ont participé à l’entraînement sont prioritaires pour le match à venir.',
        es: 'La asistencia al entrenamiento es el primer criterio de convocatoria. Los jugadores que hayan participado en el entrenamiento tienen prioridad para el próximo partido.',
      },
      {
        fr: 'Un joueur absent à l’entraînement n’est normalement pas convocable. Une exception peut uniquement être envisagée si, après avoir convoqué les joueurs présents, l’effectif n’est toujours pas complet ou si certains postes restent à pourvoir.',
        es: 'Un jugador ausente del entrenamiento normalmente no podrá ser convocado. Solo podrá contemplarse una excepción si, después de convocar a los jugadores presentes, la plantilla sigue incompleta o quedan puestos por cubrir.',
      },
      {
        fr: 'Si un joueur convoqué ne répond pas avant le jeudi à 19 h, sa place pourra être proposée à un autre joueur correspondant aux besoins du groupe.',
        es: 'Si un jugador convocado no responde antes del jueves a las 19 h, su plaza podrá ofrecerse a otro jugador que responda a las necesidades del grupo.',
      },
      {
        fr: 'Lorsque le nombre de joueurs présents à l’entraînement dépasse le nombre de places disponibles, la présence ne garantit pas automatiquement une convocation. Les responsables effectueront alors leurs choix selon les postes, l’équilibre de l’équipe, les besoins du match et la stratégie sportive afin de viser les objectifs de la saison.',
        es: 'Cuando el número de jugadores presentes en el entrenamiento supere las plazas disponibles, la asistencia no garantizará automáticamente una convocatoria. Los responsables elegirán entonces según las posiciones, el equilibrio del equipo, las necesidades del partido y la estrategia deportiva para alcanzar los objetivos de la temporada.',
      },
    ],
    closing: [
      {
        fr: 'Ces choix sont pris dans l’intérêt collectif de l’équipe et doivent être respectés.',
        es: 'Estas decisiones se toman en beneficio del equipo y deben ser respetadas.',
      },
    ],
  },
  {
    number: 15,
    title: { fr: 'Respect général du règlement', es: 'Respeto general del reglamento' },
    paragraphs: [
      {
        fr: 'Les règles s’appliquent à tous les joueurs de la même manière. Faire partie du SC Forestois 1 implique notamment de respecter :',
        es: 'Las reglas se aplican de la misma manera a todos los jugadores. Formar parte del SC Forestois 1 implica respetar especialmente:',
      },
    ],
    bullets: [
      { fr: 'les horaires et les convocations ;', es: 'los horarios y las convocatorias;' },
      {
        fr: 'les responsables et les décisions sportives ;',
        es: 'los responsables y las decisiones deportivas;',
      },
      { fr: 'les autres joueurs et le matériel ;', es: 'los demás jugadores y el material;' },
      {
        fr: 'les engagements pris envers l’équipe.',
        es: 'los compromisos adquiridos con el equipo.',
      },
    ],
    closing: [
      {
        fr: 'Les sanctions prévues ont pour objectif de maintenir un cadre clair, une bonne organisation et une bonne ambiance au sein du groupe.',
        es: 'Las sanciones previstas tienen como objetivo mantener un marco claro, una buena organización y un buen ambiente en el grupo.',
      },
      {
        fr: 'Le plus important reste que chacun fasse sa part pour permettre à l’équipe d’avancer dans la même direction.',
        es: 'Lo más importante es que cada uno haga su parte para que el equipo avance en la misma dirección.',
      },
    ],
  },
];
