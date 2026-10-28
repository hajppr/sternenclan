// Gezeichnete Karte des Clan-Territoriums (nach Satellitenbild der echten Strecke, stilisiert).
// Koordinatensystem: viewBox 0 0 600 752. Stationspositionen stehen in config.js (station.map).

export const TERRITORY = {
  width: 600,
  height: 880,
  // Wo der Nebel schon zu Beginn gelichtet ist (das Lager)
  start: { x: 275, y: 85 },
  svg: `
    <defs>
      <pattern id="t-houses" width="18" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <rect x="2" y="3" width="8" height="6" fill="#c9b48a"/>
        <path d="M1 3 L6 0 L11 3 Z" fill="#b59c6c"/>
        <rect x="11" y="10" width="5" height="4" fill="#d1be97"/>
      </pattern>
      <pattern id="t-field" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <rect width="10" height="10" fill="#dcc795"/>
        <line x1="0" y1="5" x2="10" y2="5" stroke="#c7ae74" stroke-width="2"/>
      </pattern>
      <pattern id="t-forest" width="22" height="20" patternUnits="userSpaceOnUse">
        <rect width="22" height="20" fill="#7f9a6a"/>
        <path d="M6 15 L10 4 L14 15 Z" fill="#4f6b42"/>
        <path d="M15 19 L18 11 L21 19 Z" fill="#5c7a4c"/>
        <path d="M0 9 L3 2 L6 9 Z" fill="#5c7a4c"/>
      </pattern>
      <pattern id="t-orchard" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#b9c78f"/>
        <circle cx="8" cy="8" r="3.5" fill="#7d955a"/>
      </pattern>
      <filter id="t-rough"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>
    </defs>

    <!-- Grund: Pergament -->
    <rect width="600" height="880" fill="#e8d6ae"/>

    <!-- Zweibeinerort -->
    <path d="M0 0 H330 L410 130 L392 285 L378 384 L359 548 L126 482 L60 466 L0 450 Z" fill="url(#t-houses)" opacity="0.75" filter="url(#t-rough)"/>
    <path d="M330 0 H600 V200 Z" fill="url(#t-houses)" opacity="0.55" filter="url(#t-rough)"/>

    <!-- Offenes Land (Feld) -->
    <path d="M419 134 L600 300 V641 L526 630 L416 592 L408 482 L392 285 Z" fill="url(#t-field)" filter="url(#t-rough)"/>
    <!-- Feld im Südwesten -->
    <path d="M60 470 L126 482 L191 581 L339 699 L322 792 L316 880 H20 L20 640 Z" fill="url(#t-field)" opacity="0.8" filter="url(#t-rough)"/>
    <path d="M316 880 L322 792 L455 833 L600 872 V880 Z" fill="url(#t-field)" opacity="0.8" filter="url(#t-rough)"/>
    <path d="M513 623 L600 641 V740 L513 702 Z" fill="url(#t-field)" opacity="0.8" filter="url(#t-rough)"/>
    <!-- Wiese am Weg -->
    <path d="M408 482 L416 592 L384 647 L351 647 L362 548 Z" fill="#cfd29b" filter="url(#t-rough)"/>

    <!-- Wald -->
    <path d="M126 482 L356 551 L347 642 L339 699 L191 581 Z" fill="url(#t-forest)" filter="url(#t-rough)"/>
    <path d="M399 594 L510 623 L513 702 L487 705 L399 660 Z" fill="url(#t-forest)" filter="url(#t-rough)"/>
    <path d="M489 711 L600 740 V872 L470 831 Z" fill="url(#t-forest)" opacity="0.8" filter="url(#t-rough)"/>
    <path d="M403 665 L484 707 L464 813 L427 785 L402 737 Z" fill="url(#t-orchard)" filter="url(#t-rough)"/>
    <path d="M325 728 L351 737 L419 774 L447 806 L419 822 L323 786 Z" fill="url(#t-forest)" filter="url(#t-rough)"/>
    <!-- Bolzplatz -->
    <path d="M349 656 L401 672 L398 730 L344 722 Z" fill="#c4d39a" stroke="#f3ead2" stroke-width="1.5"/>
    <circle cx="372" cy="694" r="7" fill="none" stroke="#f3ead2" stroke-width="1.2"/>

    <!-- Einsamer Baum im Feld -->
    <g transform="translate(485 496)">
      <circle r="13" fill="#5c7a4c"/><circle r="7" cx="-6" cy="-5" fill="#6f8c58"/><circle r="6" cx="6" cy="-3" fill="#4f6b42"/>
    </g>

    <!-- Wege -->
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Großer Donnerweg (Hauptstraße + Bahn im Nordosten) -->
      <path d="M300 0 L600 215" stroke="#8a6d45" stroke-width="7"/>
      <path d="M300 0 L600 215" stroke="#e8d6ae" stroke-width="2" stroke-dasharray="6 6"/>
      <!-- Straßen im Zweibeinerort (dünn) -->
      <g stroke="#b39a6e" stroke-width="3">
        <path d="M99 0 L88 164 L60 466 L22 658 L5 752"/>
        <path d="M104 211 L395 271"/>
        <path d="M164 378 L373 422"/>
        <path d="M203 82 L189 219"/>
        <path d="M225 241 L118 455"/>
        <path d="M230 11 L307 55 L411 129"/>
      </g>
      <!-- Donnerwege der Route -->
      <g stroke="#7a5c34" stroke-width="5">
        <path d="M200 134 L274 144 L405 174"/>
        <path d="M412 132 L404 174 L392 285 L378 384 L356 551 L347 645 L322 792 L316 880"/>
        <path d="M74 458 L219 504 L356 551"/>
      </g>
      <path d="M275 82 L274 144" stroke="#7a5c34" stroke-width="2.5" stroke-dasharray="3 4"/>
      <!-- Feldwege der Runde -->
      <path d="M347 645 L487 706 L455 833 L322 792" stroke="#8a6d45" stroke-width="3.5"/>
      <path d="M191 580 L338 699" stroke="#b39a6e" stroke-width="2.5"/>
      <path d="M455 833 L530 872" stroke="#b39a6e" stroke-width="2.5"/>
    </g>

    <!-- Lager -->
    <g transform="translate(275 80)">
      <circle r="13" fill="#e8d6ae" stroke="#5a3d1b" stroke-width="2.5"/>
      <path d="M-7 5 L0 -7 L7 5 Z" fill="#5a3d1b"/>
    </g>

    <!-- Beschriftung -->
    <g font-family="Palatino Linotype, Palatino, Georgia, serif" fill="#4a3417" text-anchor="middle">
      <text x="275" y="56" font-size="17" font-weight="bold">Lager</text>
      <text x="200" y="330" font-size="20" font-style="italic" opacity="0.8">Zweibeinerort</text>
      <text x="320" y="164" font-size="12" font-style="italic" transform="rotate(9 320 164)">Donnerweg</text>
      <text x="393" y="345" font-size="12" font-style="italic" transform="rotate(-84 393 345)">Donnerweg</text>
      <text x="500" y="390" font-size="22" font-style="italic">Offenes</text>
      <text x="500" y="416" font-size="22" font-style="italic">Land</text>
      <text x="485" y="528" font-size="12" font-style="italic">Einsamer Baum</text>
      <text x="262" y="590" font-size="20" font-weight="bold" fill="#2f4526" transform="rotate(38 262 590)">Wald</text>
      <text x="440" y="755" font-size="12" font-style="italic">Obstwiese</text>
      <text x="373" y="676" font-size="9" font-style="italic">Ballwiese</text>
      <text x="445" y="620" font-size="12" font-weight="bold" fill="#2f4526">Wäldchen</text>
      <text x="230" y="840" font-size="18" font-style="italic" opacity="0.8">Feld</text>
      <text x="470" y="150" font-size="11" font-style="italic" transform="rotate(35 470 150)">Großer Donnerweg</text>
    </g>

    <!-- Windrose -->
    <g transform="translate(560 40)" font-family="Georgia, serif" font-size="11" fill="#4a3417" text-anchor="middle">
      <path d="M0 -22 L5 0 L0 22 L-5 0 Z" fill="#7a5c34"/>
      <path d="M-22 0 L0 5 L22 0 L0 -5 Z" fill="#b39a6e"/>
      <text y="-26">N</text>
    </g>

    <!-- Rand -->
    <rect x="4" y="4" width="592" height="872" fill="none" stroke="#7a5c34" stroke-width="3" rx="6"/>
  `,
};
