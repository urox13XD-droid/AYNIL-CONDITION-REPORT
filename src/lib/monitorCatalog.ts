export interface MonitorCatalogEntry {
  id: string;
  name: string;
  /** traced reference art (public/devices/…), omitted for name-only entries */
  iconUrl?: string;
  /** width / height of iconUrl, so the diagram keeps the artwork's real proportions */
  iconAspect?: number;
}

// same "monitor" category devices as AYNIL Video Config, so a screen looks the
// same on both tools — plus CCM-1 ARRI, which has no traced art yet
export const MONITOR_CATALOG: MonitorCatalogEntry[] = [
  { id: "btlh-910", name: "BTLH 910", iconUrl: "/devices/device-btlh-910.png", iconAspect: 1.2279 },
  { id: "flanders-16in", name: 'Flanders 16"', iconUrl: "/devices/device-flanders-16in.png", iconAspect: 1.2755 },
  { id: "flanders-22in", name: 'Flanders 22"', iconUrl: "/devices/device-flanders-22in.png", iconAspect: 1.3014 },
  { id: "ipad", name: "iPad", iconUrl: "/devices/device-ipad.png", iconAspect: 0.7626 },
  { id: "shogun-7in", name: 'Shogun 7"', iconUrl: "/devices/device-shogun-7in.png", iconAspect: 1.2423 },
  { id: "smallhd-13in", name: 'SmallHD 13"', iconUrl: "/devices/device-smallhd-13in.png", iconAspect: 1.1059 },
  { id: "smallhd-24in", name: 'SmallHD 24"', iconUrl: "/devices/device-smallhd-24in.png", iconAspect: 1.312 },
  { id: "smallhd-503", name: "SmallHD 503", iconUrl: "/devices/device-smallhd-503.png", iconAspect: 1.848 },
  { id: "smallhd-703-bolt", name: "SmallHD 703 Bolt", iconUrl: "/devices/device-smallhd-703-bolt.png", iconAspect: 1.4314 },
  { id: "smallhd-703", name: "SmallHD 703", iconUrl: "/devices/device-smallhd-703.png", iconAspect: 1.4242 },
  { id: "smallhd-cine-7-bolt", name: "SmallHD Cine 7 Bolt", iconUrl: "/devices/device-smallhd-cine-7-bolt.png", iconAspect: 1.2386 },
  { id: "smallhd-cine-7", name: "SmallHD Cine 7", iconUrl: "/devices/device-smallhd-cine-7.png", iconAspect: 1.3965 },
  { id: "smallhd-ultra-5", name: "SmallHD Ultra 5", iconUrl: "/devices/device-smallhd-ultra-5.png", iconAspect: 1.2969 },
  { id: "sony-lmd-a240-24in", name: 'Sony LMD-A240 24"', iconUrl: "/devices/device-sony-lmd-a240-24in.png", iconAspect: 1.4194 },
  { id: "sony-pvm-17in", name: 'Sony PVM 17"', iconUrl: "/devices/device-sony-pvm-17in.png", iconAspect: 1.439 },
  { id: "starlite", name: "Starlite", iconUrl: "/devices/device-starlite.png", iconAspect: 1.7303 },
  { id: "tvlogic-075", name: "TVLogic 075", iconUrl: "/devices/device-tvlogic-075.png", iconAspect: 1.4607 },
  { id: "tvlogic-095", name: "TVLogic 095", iconUrl: "/devices/device-tvlogic-095.png", iconAspect: 1.3579 },
  { id: "tvlogic-17in", name: 'TVLogic 17"', iconUrl: "/devices/device-tvlogic-17in.png", iconAspect: 1.4276 },
  { id: "tvlogic-18in", name: 'TVLogic 18"', iconUrl: "/devices/device-tvlogic-18in.png", iconAspect: 1.4874 },
  { id: "tvlogic-f10-a", name: "TVLogic F10-A", iconUrl: "/devices/device-tvlogic-f10-a.png", iconAspect: 1.5343 },
  { id: "tvlogic-f7-hs", name: "TVLogic F7-HS", iconUrl: "/devices/device-tvlogic-f7-hs.png", iconAspect: 1.5503 },
  { id: "astro-wm-3014", name: "Astro WM-3014", iconUrl: "/devices/device-astro-wm-3014.png", iconAspect: 1.4593 },
  { id: "ccm-1-arri", name: "CCM-1 Arri" },
];

export function findMonitorByName(name: string): MonitorCatalogEntry | undefined {
  const q = name.trim().toLowerCase();
  return MONITOR_CATALOG.find((d) => d.name.toLowerCase() === q);
}

export function getMonitorById(id: string): MonitorCatalogEntry | undefined {
  return MONITOR_CATALOG.find((d) => d.id === id);
}
