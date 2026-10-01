import { prisma } from "@/shared/lib/db";

/**
 * TGA Tesis Aylik Rapor API (v6.0.0) - resmi, herkese acik dokumantasyona sahip
 * gercek bir REST API. https://tesis-entegrasyon.tga.gov.tr/docs
 * 2026/1 sayili Bakanlik Genelgesi ile tum konaklama tesisleri icin zorunlu.
 */

const NATIONALITY_TO_ISO3: Record<string, string> = {
  TR: "TUR",
  TC: "TUR",
  "T.C.": "TUR",
  TÜRKİYE: "TUR",
  TURKIYE: "TUR",
  TURKEY: "TUR",
  TÜRK: "TUR",
};

function toIso3(nationality: string): string {
  const key = nationality.trim().toUpperCase();
  return NATIONALITY_TO_ISO3[key] ?? "OTHER";
}

/** Bir tarihin TGA tanimina gore hafta ici (Paz-Prs) mi hafta sonu (Cum-Cmt) mi oldugunu doner. */
function isWeekend(d: Date): boolean {
  const day = d.getDay(); // 0=Pazar ... 6=Cumartesi
  return day === 5 || day === 6; // Cuma, Cumartesi
}

export type TgaMonthlyData = {
  monthStart: Date;
  monthEnd: Date;
  daysInMonth: number;
  byNationality: Record<
    string,
    {
      haftaici_toplam_giris_yapan_misafir: number;
      haftasonu_toplam_giris_yapan_misafir: number;
      haftaici_toplam_geceleme: number;
      haftasonu_toplam_geceleme: number;
      haftaici_toplam_satilan_oda_gece: number;
      haftasonu_toplam_satilan_oda_gece: number;
    }
  >;
  totalRevenue: number;
  totalRoomNights: number;
};

/** Secilen ay icin TGA'ya gonderilecek metrikleri kendi verilerimizden hesaplar. */
export async function computeMonthlyStats(year: number, month: number): Promise<TgaMonthlyData> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const daysInMonth = Math.round((monthEnd.getTime() - monthStart.getTime()) / 86400000);

  // Ay ile kesisen, iptal edilmemis tum rezervasyonlar (ve varsa ek misafirleri).
  const reservations = await prisma.reservation.findMany({
    where: {
      status: { not: "IPTAL" },
      checkIn: { lt: monthEnd },
      checkOut: { gt: monthStart },
    },
    include: { guest: true, extraGuests: true },
  });

  const byNationality: TgaMonthlyData["byNationality"] = {};
  let totalRevenue = 0;
  let totalRoomNights = 0;

  function bucket(iso3: string) {
    if (!byNationality[iso3]) {
      byNationality[iso3] = {
        haftaici_toplam_giris_yapan_misafir: 0,
        haftasonu_toplam_giris_yapan_misafir: 0,
        haftaici_toplam_geceleme: 0,
        haftasonu_toplam_geceleme: 0,
        haftaici_toplam_satilan_oda_gece: 0,
        haftasonu_toplam_satilan_oda_gece: 0,
      };
    }
    return byNationality[iso3];
  }

  for (const r of reservations) {
    totalRevenue += r.totalAmount;

    // Bu rezervasyonun ayla kesisen gece araligi (ay sinirlarina kirpilmis).
    const stayStart = r.checkIn < monthStart ? monthStart : r.checkIn;
    const stayEnd = r.checkOut > monthEnd ? monthEnd : r.checkOut;

    // Giris: sadece gercek giris tarihi bu ayin icindeyse sayilir.
    if (r.checkIn >= monthStart && r.checkIn < monthEnd) {
      const guestIso3 = toIso3(r.guest.nationality || "TR");
      const b = bucket(guestIso3);
      if (isWeekend(r.checkIn)) b.haftasonu_toplam_giris_yapan_misafir += 1;
      else b.haftaici_toplam_giris_yapan_misafir += 1;

      for (const eg of r.extraGuests) {
        const egIso3 = toIso3(eg.nationality || "TR");
        const egBucket = bucket(egIso3);
        if (isWeekend(r.checkIn)) egBucket.haftasonu_toplam_giris_yapan_misafir += 1;
        else egBucket.haftaici_toplam_giris_yapan_misafir += 1;
      }
    }

    // Geceleme + oda-gece: aydaki her gece icin tek tek say.
    const occupantIso3s = [toIso3(r.guest.nationality || "TR"), ...r.extraGuests.map((eg) => toIso3(eg.nationality || "TR"))];

    for (let d = new Date(stayStart); d < stayEnd; d.setDate(d.getDate() + 1)) {
      const weekend = isWeekend(d);
      totalRoomNights += 1;

      // Oda-gece: bu geceyi paylasan misafirlerin uyruklarindan sadece ilkine (ana kiraci) yazilir -
      // bir oda-gece'nin birden fazla uyruga bolunmesi TGA semasinda tanimli degil.
      const roomIso3 = occupantIso3s[0];
      const rb = bucket(roomIso3);
      if (weekend) rb.haftasonu_toplam_satilan_oda_gece += 1;
      else rb.haftaici_toplam_satilan_oda_gece += 1;

      // Geceleme: odadaki HER misafir icin, kendi uyruguna ayri ayri yazilir.
      for (const iso3 of occupantIso3s) {
        const gb = bucket(iso3);
        if (weekend) gb.haftasonu_toplam_geceleme += 1;
        else gb.haftaici_toplam_geceleme += 1;
      }
    }
  }

  return { monthStart, monthEnd, daysInMonth, byNationality, totalRevenue, totalRoomNights };
}

export type TgaSettings = {
  tgaApiKey: string;
  tgaSandbox: boolean;
  tgaFacilityId: string;
  tgaIlKodu: string;
  tgaIlceKodu: string;
  tgaOdaSayisi: number;
  tgaYatakSayisi: number;
};

const TGA_URL = { sandbox: "https://test-tesis-entegrasyon.tga.gov.tr", live: "https://tesis-entegrasyon.tga.gov.tr" };

export type TgaSendResult ={ ok: boolean; requestId?: string; error?: string };

/** Hesaplanan aylik veriyi TGA API'sine gonderir. */
export async function sendTgaReport(
  settings: TgaSettings,
  reportMonth: string, // "YYYY-MM"
  stats: TgaMonthlyData,
  aylikOrtalamaFiyat: number | null
): Promise<TgaSendResult> {
  try {
    const res = await fetch(`${settings.tgaSandbox ? TGA_URL.sandbox : TGA_URL.live}/tesis-aylik-rapor/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": settings.tgaApiKey },
      body: JSON.stringify(buildTgaPayload(settings, reportMonth, stats, aylikOrtalamaFiyat)),
      signal: AbortSignal.timeout(20_000),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.status !== "success") {
      const errDetail = json?.data?.errors?.[0]?.mesaj || json?.message || `HTTP ${res.status}`;
      return { ok: false, error: errDetail };
    }

    return { ok: true, requestId: json?.data?.request_id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}

/** TGA'ya gidecek istek govdesi. Panel onizlemesi de ayni fonksiyonu kullanir; gosterilen ile gonderilen birebir aynidir. */
export function buildTgaPayload(
  settings: Omit<TgaSettings, "tgaApiKey" | "tgaSandbox">,
  reportMonth: string, // "YYYY-MM"
  stats: TgaMonthlyData,
  aylikOrtalamaFiyat: number | null
) {
  return {
    id: settings.tgaFacilityId,
    rapor_tarihi: reportMonth,
    il_kodu: settings.tgaIlKodu,
    ilce_kodu: settings.tgaIlceKodu,
    oda_sayisi: settings.tgaOdaSayisi,
    yatak_sayisi: settings.tgaYatakSayisi,
    tesisin_aylik_acik_oldugu_gun_sayisi: stats.daysInMonth,
    ...(aylikOrtalamaFiyat != null ? { aylik_ortalama_fiyat: aylikOrtalamaFiyat } : {}),
    data: Object.entries(stats.byNationality).map(([iso_kodu, m]) => ({ iso_kodu, ...m })),
  };
}
