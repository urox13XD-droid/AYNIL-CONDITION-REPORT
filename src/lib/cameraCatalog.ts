export interface CameraCatalogEntry {
  id: string;
  name: string;
  /** traced reference art (public/devices/…), omitted for name-only entries */
  iconUrl?: string;
  /** width / height of iconUrl, so the diagram keeps the artwork's real proportions */
  iconAspect?: number;
}

// same "camera" category devices as AYNIL Video Config, so a body looks the
// same on both tools
export const CAMERA_CATALOG: CameraCatalogEntry[] = [
  { id: "dji-ronin-4d", name: "DJI Ronin 4D", iconUrl: "/devices/device-dji-ronin-4d.png", iconAspect: 1.0727 },
  { id: "alexa-35", name: "Arri Alexa 35", iconUrl: "/devices/device-alexa-35.png", iconAspect: 1.8525 },
  { id: "alexa-mini-lf", name: "Arri Alexa Mini LF", iconUrl: "/devices/device-alexa-mini-lf.png", iconAspect: 1.9532 },
  { id: "alexa-mini", name: "Arri Alexa Mini", iconUrl: "/devices/device-alexa-mini.png", iconAspect: 1.7704 },
  { id: "arri-alexa-sxt", name: "Arri Alexa SXT", iconUrl: "/devices/device-arri-alexa-sxt.png", iconAspect: 2.2693 },
  { id: "red-komodo", name: "RED Komodo", iconUrl: "/devices/device-red-komodo.png", iconAspect: 1.849 },
  { id: "red-raptor-xl", name: "RED Raptor XL", iconUrl: "/devices/device-red-raptor-xl.png", iconAspect: 1.3408 },
  { id: "red-raptor", name: "RED Raptor", iconUrl: "/devices/device-red-raptor.png", iconAspect: 2.0345 },
  { id: "red-weapon-helium", name: "RED Weapon Helium", iconUrl: "/devices/device-red-weapon-helium.png", iconAspect: 1.1377 },
  { id: "sony-burano", name: "Sony Burano", iconUrl: "/devices/device-sony-burano.png", iconAspect: 1.7101 },
  { id: "sony-fx6", name: "Sony FX6", iconUrl: "/devices/device-sony-fx6.png", iconAspect: 1.4303 },
  { id: "sony-fx9", name: "Sony FX9", iconUrl: "/devices/device-sony-fx9.png", iconAspect: 1.5927 },
  { id: "sony-venice-1", name: "Sony Venice 1", iconUrl: "/devices/device-sony-venice-1.png", iconAspect: 1.5879 },
  { id: "sony-venice-2", name: "Sony Venice 2", iconUrl: "/devices/device-sony-venice-2.png", iconAspect: 1.5517 },
];

export function findCameraByName(name: string): CameraCatalogEntry | undefined {
  const q = name.trim().toLowerCase();
  return CAMERA_CATALOG.find((d) => d.name.toLowerCase() === q);
}

export function getCameraById(id: string): CameraCatalogEntry | undefined {
  return CAMERA_CATALOG.find((d) => d.id === id);
}
