# Die Prüfung des SternenClans

Warrior-Cats-Schnitzeljagd zum 11. Geburtstag am **4. Dezember** – eine statische Web-App (PWA), die offline läuft. Kein Server, kein Login, keine Kosten.

## Ablauf (ca. 2 Stunden)

Sonnenuntergang am 4.12. ist gegen **16:15 Uhr** → gegen **14:00 Uhr** starten (ca. 2 Stunden inkl. Heimweg).

| Zeit | Station | Ort | Rätsel |
|---|---|---|---|
| 0:00 | 1 Das Lager | Zuhause, am Tisch | Einleitung, Rollenkarten, Clan-Quiz → Rätsel „kein Specht, kein Geschenk“ |
| 0:12 | 2 Der Lagerausgang | Haustür | Versteckte Pfotenschrift-Tafel suchen, Botschaft „ZAEHLT ALLE LATERNEN“ |
| 0:20 | 3 Am Donnerweg | Ende unserer Straße | Laternen unterwegs zählen |
| 0:30 | 4 Die Grenze | Feldrand | Ruf der Eule: Eulenrufe zählen |
| 0:40 | 5 Das Jagdgebiet | Weg am Feld, Höhe Baum im Feld | 5 versteckte Beutekarten → Wort „EICHE“ |
| 0:52 | 6 Die Wächter-Eiche | Waldrand an der Querstraße | Krallen-Code aus den Rollenkarten |
| 1:02 | 7 Der Heilerbau | hinter dem Bolzplatz | Kräuterkunde |
| 1:12 | 8 Die falsche Spur | Feldweg, Südost-Ecke | Welche Botschaft ist vom SchattenClan? |
| 1:20 | 9 Der Mondstein | Wäldchen an der Nordost-Ecke | Truhe finden, alle heben gemeinsam den Mondstein (alle Finger aufs Tablet) |
| 1:25 | Heimweg | denselben Weg zurück | ca. 1 km, Truhe wird mitgetragen, ggf. schon in der Dämmerung (Taschenlampen!) |
| 1:45 | 10 Heimkehr ins Lager | Zuhause | Zahlenschloss öffnen → Kriegerzeremonie, Kuchen |

Nach jeder Station zeigt die App den Hinweis zum nächsten Versteck und die **Territoriumskarte** (`js/territory.js`), deren Nebel sich mit jeder Station lichtet. Optional: **„Witterung aufnehmen“** (heiß/kalt per GPS), wenn für die nächste Station eine Position gespeichert ist.

Die Stationen 2, 4, 6 und 8 geben je ein **Krallenzeichen** (Ziffer). Zusammen ergeben sie den Code für das Zahlenschloss.

## Was ist was

- `privat/` – **nur lokal** (in `.gitignore`): Ablauf und Verstecke mit echten Orten. Hier gehört alles Private hin.

- `js/config.js` – **der gesamte Spielinhalt**. Namen, Texte, Rätsel, Tipps, Verstecke. Alles mit `ANPASSEN` vor Ort prüfen.
- `#/gm` – Spielleitung (PIN in `config.js`): **Clan einrichten** (wer ist dabei, Namen, Rollen, Geburtstagskind), Lösungen, Verstecke, Stationen überspringen, Spiel zurücksetzen.
- `print.html` – Druckvorlagen: Spielleitungs-Blatt, QR-Karten, Rollenkarten, Beutekarten, Urkunden.

## Lokal testen

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

## Kostenlos veröffentlichen (GitHub Pages)

1. Neues **öffentliches** Repo auf GitHub anlegen, diesen Ordner hochladen.
2. Repo → Settings → Pages → Branch `main`, Ordner `/ (root)`.
3. Nach ca. 1 Minute erreichbar unter `https://<name>.github.io/<repo>/`.

Hinweis: Bei einem öffentlichen Repo ist der Code (inkl. Lösungen) einsehbar. Für 11-Jährige egal, nur den Link vorher nicht herumschicken.

**Nach jeder Änderung** in `sw.js` die `VERSION` hochzählen, sonst zeigen Geräte die alte, zwischengespeicherte Version.

## Vorbereitung – Checkliste

- [ ] Spielleitung → „Clan einrichten“: wer ist dabei, Namen, Rollen, Geburtstagskind 🎂 – **am Gerät, von dem aus gedruckt wird**
- [ ] Spielleitung → „Auf das Spiel-Tablet übertragen“: QR mit dem Tablet scannen
- [ ] Strecke ablaufen: Versteck-Texte anpassen, **Laternen an der Kreuzung zählen** und eintragen
- [ ] `print.html` **von der veröffentlichten Adresse** drucken (Rollenkarten und Urkunden enthalten die eingerichteten Namen)
- [ ] QR-Karten und Beutekarten laminieren bzw. in Klarsichthüllen (Dezember = nass)
- [ ] Truhe + 4-stelliges Zahlenschloss kaufen, auf den Code einstellen (steht im Spielleitungs-Blatt)
- [ ] Urkunden + Überraschung in die Truhe
- [ ] **Strecke mit dem Spiel-Tablet ablaufen** (Standort an, Chrome Standort erlauben): in der Spielleitung an jedem Versteck auf „📍 Position“ tippen. Ungenauer als ±15 m? Kurz warten und nochmal tippen.
- [ ] Ca. 1 Stunde vorher: QR-Karten, Beutekarten und Truhe verstecken (zweiter Erwachsener?)
- [ ] Tablet: Seite **im WLAN zu Hause einmal komplett öffnen** (dann läuft sie offline), Lautstärke hoch, Akku voll
- [ ] Testlauf: einmal komplett durchspielen, dann in `#/gm` „Spiel zurücksetzen“
- [ ] Taschenlampen, Powerbank, Gefrierbeutel fürs Tablet bei Regen

## Gut zu wissen

- **Das Repo ist öffentlich.** Keine Straßennamen, Adressen oder echten Namen der Kinder in hochgeladene Dateien schreiben. Namen nur in der Spielleitung eintragen (bleiben auf dem Gerät), Orte nur in `privat/`.

- **Ein Tablet für alle** ist der Hauptmodus. Zusätzliche Handys (zu zweit) können parallel mitspielen – jedes Gerät hat seinen eigenen Spielstand.
- QR-Codes können mit dem **Scanner in der App** oder mit der **normalen Kamera-App** gescannt werden. Falls nichts geht: den Spurcode unter dem QR eintippen.
- **Android/Chrome:** Die Seite kann über Chrome-Menü → „Zum Startbildschirm hinzufügen“ / „App installieren“ wie eine App installiert werden (Vollbild). Spielstand bleibt derselbe wie in Chrome.
- Auf iPad/iPhone dagegen **nicht** zum Home-Bildschirm hinzufügen, sondern in Safari spielen – sonst öffnen QR-Links aus der Kamera-App einen anderen Spielstand.
- Tipps werden zeitverzögert freigeschaltet (nach 1, 3, 5 Minuten an einer Station).
- **GPS ohne Mobilfunk** braucht für den ersten Fix draußen evtl. 1–2 Minuten. Am besten kurz vor dem Losgehen draußen „Witterung aufnehmen“ einmal öffnen. Im Wald ist GPS ungenauer (10–20 m) – die Witterung bringt die Mädchen in die Nähe, den Rest erledigt der Hinweistext.
- Die Witterung zeigt nur heiß/kalt (Entfernung), keine Richtung – funktioniert also auch ohne Kompass-Sensor.
