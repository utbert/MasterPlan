# MasterPlan Pro v25.3

Eine schlanke, browserbasierte Dispositions- und Zeiterfassungs-App für kleine Teams (z. B. 2–10 Mitarbeitende), inklusive Ressourcenplanung, Abwesenheiten und Admin-Übersichten.

## ✨ Features

- **Disposition (Jahresansicht)**
  - Einsätze per Drag & Drop anlegen, verschieben und in der Dauer ändern.
  - Such- und Statusfilter für schnelle Übersicht.
  - Feiertagsmarkierungen im Kalender.
- **Mitarbeiter & Teams**
  - Teams und Mitarbeitende verwalten.
  - Arbeitszeitmodell pro Mitarbeitendem (Von/Bis/Pause) hinterlegen.
- **Ressourcen & Gerätegruppen**
  - Geräte in Gruppen organisieren.
  - Ressourcen-Einsätze planen und verknüpfen.
- **Abwesenheiten**
  - Urlaub, Krank, Kindkrank, Fortbildung als eigene Typen.
- **Zeiterfassung**
  - Tagesgenaue Erfassung von Von/Bis/Pause.
  - Überstunden werden beim Speichern direkt im Eintrag persistiert.
  - Mitarbeiter- und Monatsfilter in der Zeiterfassungsübersicht.
  - CSV-Export der Zeitdaten.

## 🧱 Tech-Stack

- **Vanilla HTML/CSS/JavaScript**
- Keine Build-Pipeline, keine externen Runtime-Abhängigkeiten
- Speicherung lokal im Browser via **`localStorage`**

## 🚀 Schnellstart

### Variante 1: Direkt öffnen

`index.html` im Browser öffnen.

### Variante 2: Lokaler Webserver (empfohlen)

```bash
python3 -m http.server 4173 --directory /workspace/MasterPlan
```

Dann im Browser öffnen:

`http://localhost:4173`

## 🗂 Projektstruktur

```text
MasterPlan/
├── index.html         # Haupt-UI, Styling und Kernlogik (Disposition, State, Rendering)
├── js/
│   ├── adminViews.js  # Admin-Seiten (Mitarbeiter, Aufgaben, Zeiterfassung, Export/Import)
│   └── worktime.js    # Zeiterfassung, Presets, Kontextmenü, Tages-Chips
└── README.md
```

## 💾 Datenhaltung

Die App speichert den kompletten Zustand in `localStorage` unter dem Key:

- `masterPlanState`

Im State enthalten sind u. a.:

- `groups` (Teams + Mitarbeitende)
- `resourceGroups`, `resources`
- `einsaetze` (Dispositionseinträge)
- `workHours` (Zeiterfassung inkl. Überstunden)

> Hinweis: Für kleine Teams ist `localStorage` in der Regel völlig ausreichend.

## 🧭 Bedienhinweise

- **Doppelklick** auf Einträge oder Gruppen öffnet die Bearbeitung.
- **Rechtsklick** (oder Zeitmodus) in einer Mitarbeiterzeile öffnet die Zeiterfassung.
- **Ctrl + Drag** kann zum Klonen von Einsätzen genutzt werden.
- In der Zeiterfassung wird das geplante Projekt bei Bedarf als Notiz vorgefüllt.

## 📤 Import / Export

- In der Admin-Ansicht kann der aktuelle State als JSON eingesehen/angepasst werden.
- Zeitdaten lassen sich als CSV exportieren.

## ⚠️ Hinweis für produktiven Einsatz

Diese Version ist auf lokale Nutzung ausgelegt (Single-User im Browser). Für Mehrbenutzerbetrieb, Rechtekonzepte, zentrale Datensicherung und revisionssichere Historie sollte ein Backend (DB + API) ergänzt werden.

---

Viel Erfolg mit der Einsatzplanung! 🚧
