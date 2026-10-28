// ============================================================================
//  SPIELINHALT – diese Datei ist die einzige, die du für die Party anpassen musst.
//
//  • players:  Namen der Mädchen, Schülerinnen- und Kriegernamen, Rollen
//  • stations: Reihenfolge, Texte, Rätsel, Tipps, Verstecke
//  • gm.*:     Notizen nur für die Spielleitung (sieht man nur unter #/gm)
//
//  Alles mit "ANPASSEN" in gm.prep sollte vor dem 4.12. einmal vor Ort geprüft werden.
// ============================================================================

export const GAME = {
  title: 'Die Prüfung des SternenClans',
  clan: 'MondClan',
  gmPin: '1204',
  // Wird beim Speichern im Browser genutzt – ändern setzt alle Spielstände zurück.
  storageKey: 'sternenclan-v1',

  // Die Anführerin/der Anführer wird von einem Erwachsenen gespielt.
  leader: { name: 'Lichtstern', title: 'Anführerin' },

  // Rollen: Jedes Mädchen bekommt eine ausgedruckte Rollenkarte (print.html).
  // Die Ziffer steht NUR auf der Karte – gebraucht am Waldrand.
  roles: {
    heilerin:   { title: 'Heilerin',       symbol: '🌿', digit: 3, text: 'Du kennst die Kräuter des Waldes.' },
    jaegerin:   { title: 'Jägerin',        symbol: '🐭', digit: 8, text: 'Du hast die schärfsten Augen und die leisesten Pfoten.' },
    kaempferin: { title: 'Kämpferin',      symbol: '🔥', digit: 1, text: 'Du beschützt deinen Clan mit Mut.' },
    faehrte:    { title: 'Fährtenleserin', symbol: '🐾', digit: 6, text: 'Du findest jede Spur, auch die kleinste.' },
    waechterin: { title: 'Wächterin',      symbol: '🌙', digit: 5, text: 'Du hältst Wache, wenn alle anderen schlafen.' },
    seherin:    { title: 'Sternenseherin', symbol: '⭐', digit: 9, text: 'Du verstehst die Zeichen des SternenClans.' },
  },

  // Standard-Clan. Lässt sich vor dem Spiel in der Spielleitung (#/gm → „Clan einrichten“) ändern.
  // apprentice = Schülerinnenname (…pfote), warrior = Kriegername für die Zeremonie am Ende.
  players: [
    { name: 'Geburtstagskind', apprentice: 'Funkenpfote', warrior: 'Funkenherz', role: 'seherin', birthday: true },
    { name: 'Freundin 2', apprentice: 'Blattpfote',  warrior: 'Blattsturm',  role: 'heilerin' },
    { name: 'Freundin 3', apprentice: 'Mauspfote',   warrior: 'Mausflug',    role: 'jaegerin' },
    { name: 'Freundin 4', apprentice: 'Glutpfote',   warrior: 'Glutkralle',  role: 'kaempferin' },
    { name: 'Freundin 5', apprentice: 'Spurpfote',   warrior: 'Spurenfell',  role: 'faehrte' },
    { name: 'Freundin 6', apprentice: 'Nachtpfote',  warrior: 'Nachtwind',   role: 'waechterin' },
  ],

  prophecy: 'Wenn der Mond über dem Wald erwacht, wird nur ein Clan, der wie eine einzige Pfote läuft, den Mondstein finden.',

  intro: [
    'Lange Zeit hat der SternenClan geschwiegen. Doch letzte Nacht sandte er unserer Anführerin Lichtstern einen Traum.',
    'Die Schülerinnen des MondClans sollen eine Prüfung bestehen. Nur wenn sie zusammenhalten, dürfen sie heute Kriegerinnen werden.',
    'Aber Vorsicht: Ein Spion des SchattenClans hat falsche Spuren gelegt. Vertraut einander – und dem Gesetz der Krieger.',
  ],

  // Reihenfolge = Spielablauf. token = steckt in der QR-Code-URL (nicht erratbar).
  // map = Position auf der Territoriumskarte (js/territory.js), via = Wegpunkte dorthin.
  // GPS-Positionen speichert die Spielleitung.
  // digit = Krallenzeichen für das Zahlenschloss der Truhe (Reihenfolge = Code).
  stations: [
    {
      id: 'lager', token: 'lg4m', title: 'Das Lager', place: 'Zuhause',
      map: { x: 275, y: 80 },
      gm: { hide: 'Kein QR nötig – Start direkt in der App.', prep: 'Rollenkarten verteilen.' },
      story: 'Bevor ihr das Lager verlasst, prüft der SternenClan, ob ihr wisst, wie Clankatzen leben.',
      puzzle: {
        type: 'quiz',
        questions: [
          { q: 'Wie nennen Clankatzen die Menschen?', options: ['Zweibeiner', 'Langbeine', 'Riesen'], answer: 0 },
          { q: 'Wie nennen Clankatzen die Autos?', options: ['Brummer', 'Monster', 'Stinker'], answer: 1 },
          { q: 'Wo leben die verstorbenen Krieger aller Clans?', options: ['Im SchattenClan', 'Beim Mondsee', 'Im SternenClan'], answer: 2 },
          { q: 'Wie endet der Name einer Schülerin?', options: ['…pfote', '…stern', '…junges'], answer: 0 },
        ],
      },
      hints: ['Ihr dürft so oft raten, wie ihr wollt.', 'Schülerinnen heißen zum Beispiel Feuerpfote oder Rabenpfote.'],
      digit: 4,
      next: 'Der SternenClan schickt euch ein Rätsel: „Man klopft an mich, doch ich bin kein Specht. Man öffnet mich, doch ich bin kein Geschenk. Jede Katze muss durch mich hindurch, wenn sie das Lager verlässt.“ Dort wartet die nächste Spur!',
    },
    {
      id: 'ausgang', token: 'q7xr', title: 'Der Lagerausgang', place: 'Haustür',
      map: { x: 306, y: 80 },
      gm: {
        hide: 'ANPASSEN: QR-Karte außen an die Haustür.',
        prep: 'Pfotenschrift-Tafel (print.html) in der Nähe der Haustür verstecken – z. B. unter der Fußmatte, im Briefkasten oder hinter einem Blumentopf.',
      },
      story: 'Am Lagerausgang hat jemand eine Botschaft in Pfotenschrift hinterlassen. Doch um sie zu lesen, braucht ihr die Pfotenschrift-Tafel – und die ist hier irgendwo versteckt!',
      puzzle: {
        type: 'cipher',
        message: 'ZAEHLT ALLE LATERNEN',
        printed: true, // Tafel liegt ausgedruckt versteckt bei der Station (print.html)
        question: 'Findet die Tafel und entschlüsselt die Botschaft: Schreibt unter jedes Zeichen den passenden Buchstaben.',
      },
      hints: [
        'Die Tafel ist ganz in der Nähe der Tür versteckt. Schaut unter, hinter und in Dinge!',
        'Das erste Wort heißt ZAEHLT.',
        'Die Botschaft lautet: ZAEHLT ALLE LATERNEN.',
      ],
      next: 'Folgt dem Donnerweg in Richtung Sonnenaufgang bis zu seinem Ende – und tut dabei, was die Pfotenschrift euch befohlen hat! Bleibt zusammen und überquert Donnerwege nur mit einer erwachsenen Kriegerin.',
    },
    {
      id: 'donnerweg', token: 'm3kd', title: 'Am Donnerweg', place: 'Ende der Straße',
      map: { x: 404, y: 176, via: [[306, 151]] },
      gm: {
        hide: 'ANPASSEN: QR-Karte an Laternenpfahl / Schild, wo unsere Straße endet (Details: privat/ROUTE.md).',
        prep: 'ANPASSEN: Laternen vom Haus bis hier selbst zählen und unten bei answer eintragen!',
      },
      story: 'Hier brüllen die Monster der Zweibeiner vorbei. Eine Kriegerin muss genau beobachten, bevor sie den Donnerweg überquert.',
      puzzle: {
        type: 'number',
        question: 'Wie viele Laternen der Zweibeiner habt ihr auf dem Weg vom Lager bis hierher gezählt?',
        answer: null, // ANPASSEN, z. B. 7
        tolerance: 1,
      },
      hints: ['Wenn ihr nicht mitgezählt habt: Schaut den Weg zurück und zählt noch einmal.', 'Zählt auch die Laterne, an der ihr gerade steht.'],
      next: 'Biegt ab in Richtung Mittagssonne (Süden). Zu eurer Linken beginnt das offene Land. Sucht am Rand des Feldes nach der nächsten Spur.',
    },
    {
      id: 'grenze', token: 'w8tn', title: 'Die Grenze', place: 'Feldrand',
      map: { x: 396, y: 245 },
      gm: { hide: 'ANPASSEN: QR-Karte am ersten Pfosten / Baum am Feldrand, gleich hinter den letzten Häusern.', prep: 'Tablet-Lautstärke voll aufdrehen.' },
      story: 'Hier beginnt das offene Land. Die Eule ist die Wächterin der Grenze – sie verrät euch, ob ihr weitergehen dürft. Seid ganz still und hört genau hin.',
      puzzle: {
        type: 'owl',
        calls: 7,
        question: 'Wie oft hat die Eule gerufen?',
      },
      hints: ['Ihr dürft so oft lauschen, wie ihr wollt. Zählt mit den Fingern mit!', 'Es sind mehr als fünf und weniger als zehn Rufe.'],
      digit: 9,
      next: 'Folgt dem Weg weiter nach Süden, am offenen Land entlang. Haltet Ausschau nach dem einsamen Baum mitten im Feld – auf seiner Höhe hat der Clan früher gejagt. Die Beute ist noch da!',
    },
    {
      id: 'feld', token: 'j2pz', title: 'Das Jagdgebiet', place: 'Am Feld, auf Höhe des einsamen Baums',
      map: { x: 364, y: 492, via: [[392, 285], [378, 384]] },
      gm: {
        hide: 'ANPASSEN: QR-Karte an einen Pfosten / Baum am Wegrand, auf Höhe des Baums im Feld. Nicht ins Feld selbst (Acker)!',
        prep: 'Die 5 Beutekarten (print.html) im Umkreis von ca. 20 m am Wegrand verstecken. ANPASSEN: Steht am Waldrand keine Eiche, Buchstaben auf einen anderen Baum ändern (z. B. BIRKE, BUCHE).',
      },
      story: 'Jagdtraining! Fünf Beutetiere haben sich hier versteckt. Jedes trägt einen Buchstaben. Fangt sie alle!',
      puzzle: {
        type: 'prey',
        prey: [
          { symbol: '🐭', name: 'Maus', letter: 'E' },
          { symbol: '🐦', name: 'Amsel', letter: 'I' },
          { symbol: '🐇', name: 'Kaninchen', letter: 'C' },
          { symbol: '🐿️', name: 'Eichhörnchen', letter: 'H' },
          { symbol: '🐸', name: 'Frosch', letter: 'E' },
        ],
        question: 'Tragt die Buchstaben der gefangenen Beute in dieser Reihenfolge ein.',
      },
      hints: ['Die Beutekarten sind in der Nähe – sucht an Pfosten, Steinen und im Gras.', 'Es ist ein Baum.'],
      next: 'Dort, wo ein weiterer Donnerweg von rechts kommt, beginnt der Wald. Am Waldrand wacht eine Eiche. Bei ihr findet ihr die nächste Spur.',
    },
    {
      id: 'waldrand', token: 'r5vb', title: 'Die Wächter-Eiche', place: 'Waldrand',
      map: { x: 355, y: 556, via: [[356, 551]] },
      gm: { hide: 'ANPASSEN: QR-Karte an einer Eiche (oder dem markantesten Baum) am Waldrand, Ecke Querstraße.', prep: '' },
      story: 'Das Tor zum Wald ist mit einem Krallen-Code verschlossen. Nur wenn jede Schülerin ihr Wissen teilt, öffnet es sich.',
      puzzle: {
        type: 'roles',
        order: ['seherin', 'heilerin', 'waechterin', 'faehrte'],
        question: 'Jede von euch hat auf ihrer Rollenkarte eine geheime Zahl. Welchen Code ergeben diese Zeichen?',
      },
      hints: ['Holt eure Rollenkarten heraus! Jede hat ein Zeichen und eine Zahl.', 'Sucht die Karten mit genau diesen Zeichen und lest die Zahlen der Reihe nach.'],
      digit: 2,
      next: 'Folgt dem Donnerweg weiter nach Süden, am Wald entlang. Hinter der Wiese, auf der Zweibeiner-Junge einem Ball hinterherjagen, rücken die Bäume wieder an den Weg. Dort liegt der Heilerbau.',
    },
    {
      id: 'heilerbau', token: 'h6cs', title: 'Der Heilerbau', place: 'Hinter dem Bolzplatz',
      map: { x: 328, y: 758, via: [[347, 645]] },
      gm: { hide: 'ANPASSEN: QR-Karte an einem Baum am Weg zwischen Bolzplatz und Wegende (dort stehen Bäume auf beiden Seiten).', prep: 'Pergament „Vorrat der Heilerin“ (print.html) in Klarsichthülle zur QR-Karte legen.' },
      story: 'Die alte Heilerin des MondClans hat euch ihr Wissen hinterlassen. Vier Clankatzen brauchen Hilfe. Welches Kraut hilft wem?',
      puzzle: {
        type: 'match',
        printed: true, // Vorrat der Heilerin liegt ausgedruckt bei der Station (print.html)
        info: [
          ['Spinnweben', 'stoppen Blutungen'],
          ['Katzenminze', 'hilft gegen Husten'],
          ['Mohnsamen', 'lindern Schmerzen und helfen beim Einschlafen'],
          ['Ringelblume', 'heilt entzündete Wunden'],
          ['Brombeerblätter', 'kühlen Bienenstiche'],
        ],
        pairs: [
          ['Ein Krieger hat sich an einem Dorn die Pfote aufgerissen. Sie blutet stark.', 'Spinnweben'],
          ['Ein Junges hustet die ganze Nacht.', 'Katzenminze'],
          ['Die Wunde einer Ältesten ist rot, heiß und geschwollen.', 'Ringelblume'],
          ['Eine Königin hat Schmerzen und kann nicht schlafen.', 'Mohnsamen'],
        ],
      },
      hints: ['Lest die Kräuterliste ganz genau.', 'Jedes Kraut passt nur zu einer Katze – eins bleibt übrig.'],
      next: 'Am Ende des Weges biegt ihr in Richtung Sonnenaufgang ab, am Feld entlang. An der nächsten Ecke liegen drei Botschaften – angeblich alle vom SternenClan.',
    },
    {
      id: 'verraeter', token: 'x9fa', title: 'Die falsche Spur', place: 'Ecke am Feldweg (Südosten)',
      map: { x: 452, y: 832, via: [[322, 792]] },
      gm: { hide: 'ANPASSEN: QR-Karte an der Ecke, wo der Feldweg nach Norden abbiegt (Pfosten / Baum).', prep: 'Die echten Botschaften beschreiben das Versteck der Truhe (Station 9).' },
      story: 'Drei Botschaften. Aber eine davon stammt vom Spion des SchattenClans! Welche ist falsch?',
      puzzle: {
        type: 'traitor',
        messages: [
          'Folgt dem Weg in Richtung Norden, am Obstgarten der Zweibeiner vorbei.',
          'Trennt euch! Jede sucht allein, und vertraut niemandem aus eurem Clan.',
          'Wo der Weg in Richtung Sonnenuntergang abbiegt, ruht der Mondstein im Schutz der Bäume.',
        ],
        fake: 1,
        reason: 'Richtig! Das Gesetz der Krieger sagt: Ein Clan hält zusammen. Diese Botschaft war vom SchattenClan.',
      },
      hints: ['Denkt an das Gesetz der Krieger.', 'Würde der SternenClan wollen, dass ein Clan auseinandergeht?'],
      digit: 7,
      next: 'Geht nach Norden, am Obstgarten entlang. Wo der Weg in Richtung Sonnenuntergang abbiegt, sucht im Schutz der Bäume den Mondstein!',
    },
    {
      id: 'mondstein', token: 'z1mo', title: 'Der Mondstein', place: 'Wäldchen an der Nordost-Ecke',
      map: { x: 460, y: 694, via: [[455, 833], [487, 706]] },
      gm: { hide: 'ANPASSEN: Truhe mit Zahlenschloss im Wäldchen an der Ecke, wo der Weg nach Westen abbiegt (+ QR-Karte darauf).', prep: 'Truhe vorher verstecken, Urkunden + Überraschung hinein, Zahlenschloss zu!' },
      story: 'Im Schutz der Bäume liegt der Mondstein! Doch er ist versiegelt. Nur im Lager, im Kreis des ganzen Clans, lässt er sich öffnen.',
      puzzle: {
        type: 'touch',
        question: 'Der Mondstein ist schwer. Nur wenn alle Schülerinnen gleichzeitig eine Pfote auf ihn legen, könnt ihr ihn heben. Legt alle einen Finger auf den Stein und haltet ihn fest!',
      },
      hints: ['Wirklich alle müssen gleichzeitig einen Finger auf den leuchtenden Stein legen – und kurz festhalten.'],
      next: 'Tragt den Mondstein gemeinsam ins Lager! Geht am Wäldchen vorbei in Richtung Sonnenuntergang, dann den Donnerweg nach Norden und am Ende wieder zurück ins Lager. Bleibt zusammen – eine Kriegerin lässt niemanden zurück!',
    },
    {
      id: 'heimkehr', token: 'v4lt', title: 'Heimkehr ins Lager', place: 'Zuhause',
      map: { x: 275, y: 80, via: [[347, 645], [356, 551], [378, 384], [392, 285], [404, 174], [306, 151], [306, 80]] },
      gm: { hide: 'QR-Karte an die Haustür oder auf den Tisch, an dem die Truhe geöffnet wird.', prep: 'Kuchen bereitstellen 🎂' },
      story: 'Ihr seid zurück im Lager! Lichtstern erwartet euch schon. Jetzt zeigt sich, ob ihr unterwegs gut aufgepasst habt: Unterwegs habt ihr Krallenzeichen gesammelt …',
      puzzle: { type: 'lock' },
      hints: ['Die Krallenzeichen stehen oben – in der Reihenfolge, in der ihr sie gefunden habt.'],
      next: null,
    },
  ],
};

export const lockCode = () => GAME.stations.filter(s => s.digit != null).map(s => s.digit).join('');
