// Daire sayfalarinin adres kurallari: /odalar/<tip-slug>/oda-<numara>

type RoomRef = { number: number; type: { slug: string } };

export function roomPath(room: RoomRef): string {
  return `/odalar/${room.type.slug}/${roomSlug(room.number)}`;
}

export function roomSlug(number: number): string {
  return `oda-${number}`;
}

/** Adresteki "oda-205" parcasindan oda numarasini cikarir; bicim uymuyorsa null. */
export function roomNumberFromSlug(slug: string): number | null {
  const match = /^oda-(\d+)$/.exec(slug);
  return match ? Number(match[1]) : null;
}
