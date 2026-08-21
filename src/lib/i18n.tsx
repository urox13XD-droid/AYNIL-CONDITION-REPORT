"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "fr" | "en";

const STORAGE_KEY = "aynil-condition:locale";

const dict = {
  fr: {
    "toolbar.reportsMenuTitle": "Rapports enregistrés",
    "toolbar.noSavedReports": "Aucun rapport enregistré.",
    "toolbar.delete": "Supprimer",
    "toolbar.open": "Ouvrir",
    "toolbar.importFile": "Importer un fichier (.json)…",
    "toolbar.new": "Nouveau",
    "toolbar.exportProject": "Export Project",
    "toolbar.print": "Imprimer",
    "toolbar.exportPdf": "Export PDF",
    "toolbar.save": "Sauvegarder",
    "toolbar.titlePlaceholder": "Nom du rapport…",

    "toast.saved": "Rapport sauvegardé",
    "toast.deleted": "Rapport supprimé",
    "toast.imported": "Rapport importé",
    "toast.importInvalid": "Fichier .json invalide ou illisible",

    "confirm.newReport": "Créer un nouveau rapport ? Les modifications non sauvegardées seront perdues.",
    "confirm.deleteReport": "Supprimer ce rapport enregistré ?",

    "session.offline": "Hors ligne",
    "session.connecting": "Synchronisation…",
    "session.synced": "Synchronisé",
    "session.error": "Erreur de synchro",
    "session.namePlaceholder": "Session partagée (ex. tournage-toto)",
    "session.codePlaceholder": "Code",
    "session.codeTitle": "Code à 3 chiffres reçu à la création de la session — laisser vide pour créer une nouvelle session",
    "session.joinCreate": "Rejoindre / Créer",
    "session.leave": "Quitter la session",

    "reportLabel.optical": "Optical Report",
    "reportLabel.filter": "Filter Report",
    "reportLabel.monitoring": "Monitoring Report",
    "reportLabel.camera": "Camera Report",

    "reportTitle.optical": "État des optiques",
    "reportTitle.filter": "État des filtres",
    "reportTitle.monitoring": "État des moniteurs",
    "reportTitle.camera": "État des caméras",

    "header.date": "Date",
    "header.prod": "Prod",
    "header.loueur": "Loueur",
    "header.film": "Film",
    "header.assistant": "Assistant·e / Tel.",
    "header.signature": "Signature",
    "header.disclaimer": "* Remettre une copie (papier ou PDF) au loueur avant le départ",
    "header.collapse": "Replier les infos",
    "header.expand": "Déplier les infos",

    "tool.pen": "Libre",
    "tool.penThin": "Libre fin (micro-rayures)",
    "tool.scratch": "Rayure",
    "tool.impact": "Pok / impact",
    "tool.smudge": "Tache",
    "tool.eraser": "Gomme",
    "tool.clearDiagram": "Vider ce schéma",

    "item.select": "Sélectionner",
    "item.remove": "Retirer cet appareil",

    "selection.selected": "sélectionné",
    "selection.selectedPlural": "sélectionnés",
    "selection.duplicate": "Dupliquer",
    "selection.duplicateTitle": "Dupliquer (Ctrl+D)",
    "selection.copy": "Copier",
    "selection.copyTitle": "Copier (Ctrl+C)",
    "selection.delete": "Supprimer",
    "selection.deleteTitle": "Supprimer la sélection",
    "selection.clearTitle": "Désélectionner",

    "undoRedo.undoTitle": "Annuler (Ctrl+Z)",
    "undoRedo.redoTitle": "Rétablir (Ctrl+Maj+Z)",

    "fields.notes": "Notes",

    "optical.addItem": "Ajouter une optique",
    "optical.opticLabel": "Optique",
    "optical.focalLabel": "Focale",
    "optical.opticPlaceholder": "Ex. Cooke S4 35mm",
    "optical.focalPlaceholder": "Ex. 35mm",
    "optical.serial": "N° série (#)",
    "optical.seriesBadge": "Série",
    "optical.seriesPlaceholder": "Ex. Cooke S4",
    "optical.seriesToggleOn": "Fait partie d'une série (ex. Cooke S4)",
    "optical.seriesToggleOff": "Retirer de la série",
    "optical.bodyToggleOn": "Ajouter l'état de la carrosserie",
    "optical.bodyToggleOff": "Masquer la carrosserie",
    "optical.front": "Av.",
    "optical.back": "Ar.",
    "optical.body": "Carrosserie",
    "optical.disclaimer":
      "NB : pour repérer l'orientation de l'optique, marquez un point sur la monture à droite pour la face avant, à gauche pour la face arrière. Le petit bouton en haut à droite de chaque optique permet de l'associer à une série (ex. Cooke S4) — le champ principal ne contient alors que la focale.",

    "filter.addItem": "Ajouter un filtre",
    "filter.category": "Catégorie",
    "filter.model": "Modèle",
    "filter.chooseOption": "— Choisir —",
    "filter.size": "Taille",
    "filter.modelPlaceholder": "Ex. Glimmer Glass",
    "filter.front": "Av.",
    "filter.back": "Ar.",
    "filter.disclaimer":
      "Choisissez un repère sur le bord du filtre (étiquette, encoche…) et dessinez-le afin de connaître son orientation.",

    "category.Filtre à effet": "Filtre à effet",
    "category.Neutre 4x4": "Neutre 4x4",
    "category.Neutre 4x5.6": "Neutre 4x5.6",
    "category.Neutre 5x5": "Neutre 5x5",
    "category.Neutre 6x6": "Neutre 6x6",
    "category.Dégradé Soft 5x5": "Dégradé Soft 5x5",
    "category.Dégradé Hard 5x5": "Dégradé Hard 5x5",
    "category.Dégradé Soft 6x6": "Dégradé Soft 6x6",
    "category.Dégradé Hard 6x6": "Dégradé Hard 6x6",
    "category.Dégradé Soft 4x5.6": "Dégradé Soft 4x5.6",
    "category.Dégradé Hard 4x5.6": "Dégradé Hard 4x5.6",
    "category.Polaframe 6x6": "Polaframe 6x6",
    "category.Polaframe 4x5.6": "Polaframe 4x5.6",
    "category.Pola Ø138mm": "Pola Ø138mm",
    "category.Pola Ø156mm": "Pola Ø156mm",
    "category.Dioptrie": "Dioptrie",
    "category.Dioptrie Split": "Dioptrie Split",
    "category.Autre": "Autre",

    "monitoring.addItem": "Ajouter un écran",
    "monitoring.screenLabel": "Écran",
    "monitoring.screenPlaceholder": "Ex. SmallHD Cine 7",
    "monitoring.protectionLabel": "Vitre de protection",
    "protection.none": "—",
    "protection.aucune": "Aucune",
    "protection.neuve": "Neuve",
    "protection.usagee": "Usagée",

    "camera.addItem": "Ajouter une caméra",
    "camera.cameraLabel": "Caméra",
    "camera.cameraPlaceholder": "Ex. Sony Venice 2",
    "camera.sensor": "Capteur",
    "camera.body": "Corps",

    "lang.label": "Langue",
  },
  en: {
    "toolbar.reportsMenuTitle": "Saved reports",
    "toolbar.noSavedReports": "No saved reports.",
    "toolbar.delete": "Delete",
    "toolbar.open": "Open",
    "toolbar.importFile": "Import a file (.json)…",
    "toolbar.new": "New",
    "toolbar.exportProject": "Export Project",
    "toolbar.print": "Print",
    "toolbar.exportPdf": "Export PDF",
    "toolbar.save": "Save",
    "toolbar.titlePlaceholder": "Report name…",

    "toast.saved": "Report saved",
    "toast.deleted": "Report deleted",
    "toast.imported": "Report imported",
    "toast.importInvalid": "Invalid or unreadable .json file",

    "confirm.newReport": "Create a new report? Unsaved changes will be lost.",
    "confirm.deleteReport": "Delete this saved report?",

    "session.offline": "Offline",
    "session.connecting": "Syncing…",
    "session.synced": "Synced",
    "session.error": "Sync error",
    "session.namePlaceholder": "Shared session (e.g. shoot-toto)",
    "session.codePlaceholder": "Code",
    "session.codeTitle": "3-digit code given when the session was created — leave blank to create a new session",
    "session.joinCreate": "Join / Create",
    "session.leave": "Leave session",

    "reportLabel.optical": "Optical Report",
    "reportLabel.filter": "Filter Report",
    "reportLabel.monitoring": "Monitoring Report",
    "reportLabel.camera": "Camera Report",

    "reportTitle.optical": "Optics Condition",
    "reportTitle.filter": "Filters Condition",
    "reportTitle.monitoring": "Monitors Condition",
    "reportTitle.camera": "Cameras Condition",

    "header.date": "Date",
    "header.prod": "Production",
    "header.loueur": "Rental house",
    "header.film": "Film",
    "header.assistant": "Assistant / Phone",
    "header.signature": "Signature",
    "header.disclaimer": "* Give a copy (paper or PDF) to the rental house before departure",
    "header.collapse": "Collapse info",
    "header.expand": "Expand info",

    "tool.pen": "Freehand",
    "tool.penThin": "Thin freehand (micro-scratches)",
    "tool.scratch": "Scratch",
    "tool.impact": "Impact / chip",
    "tool.smudge": "Smudge",
    "tool.eraser": "Eraser",
    "tool.clearDiagram": "Clear this diagram",

    "item.select": "Select",
    "item.remove": "Remove this device",

    "selection.selected": "selected",
    "selection.selectedPlural": "selected",
    "selection.duplicate": "Duplicate",
    "selection.duplicateTitle": "Duplicate (Ctrl+D)",
    "selection.copy": "Copy",
    "selection.copyTitle": "Copy (Ctrl+C)",
    "selection.delete": "Delete",
    "selection.deleteTitle": "Delete selection",
    "selection.clearTitle": "Deselect",

    "undoRedo.undoTitle": "Undo (Ctrl+Z)",
    "undoRedo.redoTitle": "Redo (Ctrl+Shift+Z)",

    "fields.notes": "Notes",

    "optical.addItem": "Add a lens",
    "optical.opticLabel": "Lens",
    "optical.focalLabel": "Focal length",
    "optical.opticPlaceholder": "E.g. Cooke S4 35mm",
    "optical.focalPlaceholder": "E.g. 35mm",
    "optical.serial": "Serial # ",
    "optical.seriesBadge": "Series",
    "optical.seriesPlaceholder": "E.g. Cooke S4",
    "optical.seriesToggleOn": "Part of a series (e.g. Cooke S4)",
    "optical.seriesToggleOff": "Remove from series",
    "optical.bodyToggleOn": "Add barrel condition",
    "optical.bodyToggleOff": "Hide barrel condition",
    "optical.front": "Front",
    "optical.back": "Back",
    "optical.body": "Barrel",
    "optical.disclaimer":
      "NB: to mark the lens's orientation, place a point on the mount to the right for the front face, to the left for the back face. The small button at the top-right of each lens links it to a series (e.g. Cooke S4) — the main field then only holds the focal length.",

    "filter.addItem": "Add a filter",
    "filter.category": "Category",
    "filter.model": "Model",
    "filter.chooseOption": "— Choose —",
    "filter.size": "Size",
    "filter.modelPlaceholder": "E.g. Glimmer Glass",
    "filter.front": "Front",
    "filter.back": "Back",
    "filter.disclaimer": "Pick a landmark on the filter's edge (label, notch…) and draw it so you know its orientation.",

    "category.Filtre à effet": "Effect filter",
    "category.Neutre 4x4": "Neutral 4x4",
    "category.Neutre 4x5.6": "Neutral 4x5.6",
    "category.Neutre 5x5": "Neutral 5x5",
    "category.Neutre 6x6": "Neutral 6x6",
    "category.Dégradé Soft 5x5": "Graduated Soft 5x5",
    "category.Dégradé Hard 5x5": "Graduated Hard 5x5",
    "category.Dégradé Soft 6x6": "Graduated Soft 6x6",
    "category.Dégradé Hard 6x6": "Graduated Hard 6x6",
    "category.Dégradé Soft 4x5.6": "Graduated Soft 4x5.6",
    "category.Dégradé Hard 4x5.6": "Graduated Hard 4x5.6",
    "category.Polaframe 6x6": "Polaframe 6x6",
    "category.Polaframe 4x5.6": "Polaframe 4x5.6",
    "category.Pola Ø138mm": "Polarizer Ø138mm",
    "category.Pola Ø156mm": "Polarizer Ø156mm",
    "category.Dioptrie": "Diopter",
    "category.Dioptrie Split": "Split Diopter",
    "category.Autre": "Other",

    "monitoring.addItem": "Add a monitor",
    "monitoring.screenLabel": "Monitor",
    "monitoring.screenPlaceholder": "E.g. SmallHD Cine 7",
    "monitoring.protectionLabel": "Protective glass",
    "protection.none": "—",
    "protection.aucune": "None",
    "protection.neuve": "New",
    "protection.usagee": "Used",

    "camera.addItem": "Add a camera",
    "camera.cameraLabel": "Camera",
    "camera.cameraPlaceholder": "E.g. Sony Venice 2",
    "camera.sensor": "Sensor",
    "camera.body": "Body",

    "lang.label": "Language",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type TranslationKey = keyof (typeof dict)["fr"];

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external store (localStorage) on mount
      if (stored === "fr" || stored === "en") setLocaleState(stored);
    } catch {
      // ignore — defaults to fr
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore — in-memory only for this session
    }
  }, []);

  const t = useCallback((key: TranslationKey) => dict[locale][key] ?? dict.fr[key] ?? key, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
