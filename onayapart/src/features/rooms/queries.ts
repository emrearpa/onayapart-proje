import { cache } from "react";
import { prisma } from "@/shared/lib/db";
import { startOfDay } from "@/shared/lib/dates";

// Musaitlik yalnizca bugunu ve sonrasini ilgilendirir; gecmis kayitlari cekmeyiz.
function upcomingStays() {
  const today = startOfDay(new Date());
  return {
    reservations: { where: { checkOut: { gt: today } }, select: { checkIn: true, checkOut: true, status: true } },
    externalBookings: { where: { checkOut: { gt: today } }, select: { checkIn: true, checkOut: true } },
  };
}

export async function getAmenities() {
  return prisma.amenity.findMany({ orderBy: { sort: "asc" } });
}

export async function getRoomTypes() {
  return prisma.roomType.findMany({
    orderBy: { sort: "asc" },
    include: {
      rates: { orderBy: { sort: "asc" } },
      rooms: { where: { isPublished: true }, select: { condition: true, ...upcomingStays() } },
    },
  });
}

/** Menu/altbilgi gibi yerlerde oda tiplerinin yalnizca adi ve adresi gerekir. */
export const getRoomTypeLinks = cache(async () => {
  return prisma.roomType.findMany({ orderBy: { sort: "asc" }, select: { id: true, slug: true, code: true, name: true } });
});

export async function getRoomType(slug: string) {
  return prisma.roomType.findUnique({
    where: { slug },
    include: { rates: { orderBy: { sort: "asc" } } },
  });
}

export async function getRooms(typeSlug?: string) {
  return prisma.room.findMany({
    where: { isPublished: true, ...(typeSlug ? { type: { slug: typeSlug } } : {}) },
    orderBy: { number: "asc" },
    include: {
      type: true,
      photos: { orderBy: { sort: "asc" }, take: 1 },
      ...upcomingStays(),
    },
  });
}

export async function getRoom(number: number) {
  return prisma.room.findUnique({
    where: { number },
    include: {
      type: { include: { rates: { orderBy: { sort: "asc" } } } },
      photos: { orderBy: { sort: "asc" } },
      ...upcomingStays(),
    },
  });
}

/** Statik sayfa uretimi ve site haritasi icin yayindaki tip/daire adresleri. */
export async function getPublishedRoomPaths() {
  const [types, rooms] = await Promise.all([
    prisma.roomType.findMany({ select: { slug: true } }),
    prisma.room.findMany({ where: { isPublished: true }, select: { number: true, type: { select: { slug: true } } } }),
  ]);
  return { types, rooms };
}
