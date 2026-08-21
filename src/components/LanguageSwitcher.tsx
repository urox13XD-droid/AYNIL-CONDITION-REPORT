"use client";

import { Locale, useLocale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <label className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
      <span className="sr-only">{t("lang.label")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        title={t("lang.label")}
        className="rounded-lg border-[2.5px] border-black bg-white px-2 py-1.5 text-xs font-bold uppercase tracking-wide shadow-comic-sm outline-none"
      >
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
