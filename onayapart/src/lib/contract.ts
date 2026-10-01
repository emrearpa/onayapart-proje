import {
  createPdfDoc,
  ensureSpace,
  drawParagraph,
  drawHeading,
  drawRow,
  drawDivider,
  PDF_COLORS,
  PAGE_W,
  PAGE_H,
  MARGIN,
  CONTENT_W,
  type PdfCtx,
} from "@/lib/pdfKit";
import { fmtDate, fmtMoney } from "@/lib/dates";
import { fullAddress } from "@/lib/site";

export type ContractInput = {
  reservation: {
    code: string;
    checkIn: Date;
    checkOut: Date;
    stayType: string;
    totalAmount: number;
    deposit: number;
    createdAt: Date;
  };
  guest: {
    fullName: string;
    phone: string;
    email: string | null;
    idType: string;
    idNumber: string | null;
    birthDate: Date | null;
    nationality: string;
    address: string | null;
  };
  room: { number: number; floor: number; m2: number };
  roomType: { name: string; code: string };
  assets: { name: string; quantity: number }[];
  extraGuests: { fullName: string; idType: string; idNumber: string | null }[];
  settings: {
    phoneDisplay: string;
    addressStreet: string;
    addressDistrict: string;
    addressCity: string;
    addressPostalCode: string;
  };
};

const STAY_LABEL: Record<string, string> = {
  GUNLUK: "Günlük",
  HAFTALIK: "Haftalık",
  AYLIK: "Aylık",
  DONEMLIK: "Öğrenci dönemlik",
  YILLIK: "Yıllık",
  KURUMSAL: "Kurumsal",
};

const CLAUSES = [
  "1. Kiracı, işbu sözleşmede belirtilen daireyi yukarıda yazılı giriş ve çıkış tarihleri arasında, belirtilen bedel karşılığında konaklama amacıyla kullanacağını kabul eder.",
  "2. Konaklama bedeli, sözleşmenin imzalandığı tarihte veya taraflarca mutabık kalınan ödeme planına göre nakit, kredi kartı ya da havale yoluyla ödenir. Aylık ve dönemlik konaklamalarda ödeme, giriş tarihine denk gelen gün esas alınarak her ay tekrarlanır. Yıllık konaklamalarda toplam bedel eşit 12 taksite bölünerek, giriş tarihine denk gelen gün esas alınmak üzere her ay tahsil edilir.",
  "3. Alınan depozito, dairenin ve demirbaşların hasarsız teslim edilmesi koşuluyla çıkış tarihinde iade edilir. Tespit edilen hasar veya eksik demirbaş bedeli depozitodan mahsup edilir.",
  "4. Standart giriş saati 14:00, çıkış saati 12:00'dir. Bu saatler dışındaki taleplerde müsaitlik durumuna göre işletme onayı gerekir.",
  "5. Kiracı, daireyi ve içindeki demirbaşları özenle kullanmakla, oluşacak hasarlardan sorumlu olmakla yükümlüdür.",
  "6. Kiracı, dairede veya bina genelinde çevreye rahatsızlık verecek gürültü ve davranışlardan kaçınmayı, işletme kurallarına ve bina yönetim planına uymayı kabul eder.",
  "7. Belirlenen çıkış tarihinden önce ayrılma (erken çıkış) durumunda, ödenen bedelin iadesi işletmenin iptal politikasına tabidir.",
  "8. Kiracının kimlik bilgileri, ilgili mevzuat gereğince resmi kimlik bildirim sistemine (KBS) bildirilir.",
  "9. İşbu sözleşmeden doğacak uyuşmazlıklarda Erzurum Mahkemeleri ve İcra Daireleri yetkilidir.",
  "10. Taraflar, işbu sözleşmeyi ve yukarıdaki maddeleri okuyup anladıklarını, aşağıya atacakları imza ile kabul ettiklerini beyan ederler.",
];

export async function generateContractPdf(input: ContractInput): Promise<Uint8Array> {
  const { reservation, guest, room, roomType, assets, extraGuests, settings } = input;

  const { doc, font, bold } = await createPdfDoc();
  const ctx: PdfCtx = { doc, page: doc.addPage([PAGE_W, PAGE_H]), font, bold, y: PAGE_H - MARGIN };

  ctx.page.drawText("KONAKLAMA SÖZLEŞMESİ", { x: MARGIN, y: ctx.y - 20, size: 18, font: bold, color: PDF_COLORS.brand });
  ctx.y -= 32;
  drawParagraph(ctx, `Sözleşme No: ${reservation.code}   ·   Düzenlenme Tarihi: ${fmtDate(reservation.createdAt)}`, {
    size: 9.5,
    color: PDF_COLORS.soft,
  });
  drawDivider(ctx);

  drawHeading(ctx, "A. KİRALAYAN (İŞLETME)");
  drawRow(ctx, "Unvan", "Onay Apart Rezidans");
  drawRow(ctx, "Adres", fullAddress(settings));
  drawRow(ctx, "Telefon", settings.phoneDisplay);

  drawHeading(ctx, "B. KİRACI (MİSAFİR)");
  drawRow(ctx, "Ad Soyad", guest.fullName);
  drawRow(ctx, guest.idType === "PASAPORT" ? "Pasaport No" : "T.C. Kimlik No", guest.idNumber || "—");
  drawRow(ctx, "Doğum Tarihi", guest.birthDate ? fmtDate(guest.birthDate) : "—");
  drawRow(ctx, "Uyruk", guest.nationality || "—");
  drawRow(ctx, "Telefon", guest.phone);
  drawRow(ctx, "E-posta", guest.email || "—");
  drawRow(ctx, "İkamet Adresi", guest.address || "—");

  drawHeading(ctx, "C. KONAKLAMA BİLGİLERİ");
  drawRow(ctx, "Daire No / Tipi", `${room.number} — ${roomType.name}`);
  drawRow(ctx, "Giriş Tarihi", fmtDate(reservation.checkIn));
  drawRow(ctx, "Çıkış Tarihi", fmtDate(reservation.checkOut));
  drawRow(ctx, "Konaklama Türü", STAY_LABEL[reservation.stayType] ?? reservation.stayType);
  drawRow(ctx, "Toplam Bedel", fmtMoney(reservation.totalAmount));
  drawRow(ctx, "Alınan Depozito", fmtMoney(reservation.deposit));

  drawHeading(ctx, "D. ODADA BULUNAN DEMİRBAŞLAR");
  if (assets.length > 0) {
    for (const a of assets) {
      drawParagraph(ctx, `• ${a.name} — ${a.quantity} adet`, { size: 9.5, lineGap: 14 });
    }
    drawParagraph(ctx, "Kiracı, yukarıda listelenen demirbaşları eksiksiz ve çalışır durumda teslim aldığını kabul eder.", {
      size: 9,
      color: PDF_COLORS.soft,
      lineGap: 13,
    });
  } else {
    drawParagraph(ctx, "Bu daire için demirbaş listesi girilmemiştir.", { size: 9.5, color: PDF_COLORS.soft });
  }

  if (extraGuests.length > 0) {
    drawHeading(ctx, "E. BİRLİKTE KALAN EK MİSAFİRLER");
    for (const eg of extraGuests) {
      const idLabel = eg.idType === "PASAPORT" ? "Pasaport" : "T.C. Kimlik No";
      drawParagraph(ctx, `• ${eg.fullName} — ${idLabel}: ${eg.idNumber || "belirtilmedi"}`, { size: 9.5, lineGap: 14 });
    }
  }

  drawHeading(ctx, extraGuests.length > 0 ? "F. GENEL ŞARTLAR" : "E. GENEL ŞARTLAR");
  for (const c of CLAUSES) {
    drawParagraph(ctx, c, { size: 9.3, lineGap: 13.5 });
    ctx.y -= 5;
  }

  ensureSpace(ctx, 90);
  ctx.y -= 22;
  const colW = CONTENT_W / 2 - 20;
  ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: MARGIN + colW, y: ctx.y }, thickness: 0.75, color: PDF_COLORS.line });
  ctx.page.drawLine({
    start: { x: PAGE_W - MARGIN - colW, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.75,
    color: PDF_COLORS.line,
  });
  ctx.y -= 14;
  ctx.page.drawText("Kiralayan (İşletme)", { x: MARGIN, y: ctx.y, size: 9.5, font: bold, color: PDF_COLORS.ink });
  ctx.page.drawText("Onay Apart Rezidans", { x: MARGIN, y: ctx.y - 13, size: 9, font, color: PDF_COLORS.soft });
  ctx.page.drawText("Kiracı (Misafir)", { x: PAGE_W - MARGIN - colW, y: ctx.y, size: 9.5, font: bold, color: PDF_COLORS.ink });
  ctx.page.drawText(guest.fullName, { x: PAGE_W - MARGIN - colW, y: ctx.y - 13, size: 9, font, color: PDF_COLORS.soft });

  return doc.save();
}
