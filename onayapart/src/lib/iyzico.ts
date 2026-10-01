import Iyzipay from "iyzipay";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/whatsapp";

export async function getIntegrationSettings() {
  const existing = await prisma.integrationSetting.findUnique({ where: { id: "main" } });
  if (existing) return existing;
  return prisma.integrationSetting.create({ data: { id: "main" } });
}

function client(settings: { iyzicoApiKey: string; iyzicoSecretKey: string; iyzicoSandbox: boolean }) {
  return new Iyzipay({
    apiKey: settings.iyzicoApiKey,
    secretKey: settings.iyzicoSecretKey,
    uri: settings.iyzicoSandbox ? "https://sandbox-api.iyzipay.com" : "https://api.iyzipay.com",
  });
}

export type StartCheckoutInput = {
  conversationId: string;
  amount: number;
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    identityNumber: string;
    email: string;
    gsmNumber: string;
    address: string;
    city: string;
  };
  basketId: string;
  basketDescription: string;
};

export type StartCheckoutResult =
  | { ok: true; token: string; paymentPageUrl: string }
  | { ok: false; error: string };

/** Odeme baslatir; iyzico'nun kendi guvenli (PCI uyumlu) sayfasina yonlendirme adresini dondurur.
 *  Kart bilgileri hicbir zaman bizim sunucumuza gelmez. */
export async function startCheckoutForm(
  settings: { iyzicoApiKey: string; iyzicoSecretKey: string; iyzicoSandbox: boolean },
  input: StartCheckoutInput
): Promise<StartCheckoutResult> {
  const iyzipay = client(settings);
  const price = input.amount.toFixed(2);

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: input.conversationId,
    price,
    paidPrice: price,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: input.basketId,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: input.callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: input.buyer.id,
      name: input.buyer.name,
      surname: input.buyer.surname || input.buyer.name,
      identityNumber: input.buyer.identityNumber,
      email: input.buyer.email,
      gsmNumber: input.buyer.gsmNumber,
      registrationAddress: input.buyer.address,
      city: input.buyer.city || "Erzurum",
      country: "Turkey",
      ip: "85.34.78.112",
    },
    shippingAddress: {
      contactName: `${input.buyer.name} ${input.buyer.surname}`,
      city: input.buyer.city || "Erzurum",
      country: "Turkey",
      address: input.buyer.address,
    },
    billingAddress: {
      contactName: `${input.buyer.name} ${input.buyer.surname}`,
      city: input.buyer.city || "Erzurum",
      country: "Turkey",
      address: input.buyer.address,
    },
    basketItems: [
      {
        id: input.basketId,
        name: input.basketDescription,
        category1: "Konaklama",
        itemType: "VIRTUAL",
        price,
      },
    ],
  };

  return new Promise((resolve) => {
    iyzipay.checkoutFormInitialize.create(request, (err, result) => {
      if (err) return resolve({ ok: false, error: err.message });
      if (result.status !== "success" || !result.token || !result.paymentPageUrl) {
        resolve({ ok: false, error: result.errorMessage || "Ödeme başlatılamadı." });
        return;
      }
      resolve({ ok: true, token: result.token, paymentPageUrl: result.paymentPageUrl });
    });
  });
}

export type RetrieveResult =
  | { ok: true; paid: boolean; paymentId?: string; paidPrice?: string }
  | { ok: false; error: string };

/** Odeme sonucunu iyzico'dan dogrudan sorgulayip dogrular - yonlendirmeye asla guvenilmez. */
export async function retrieveCheckoutForm(
  settings: { iyzicoApiKey: string; iyzicoSecretKey: string; iyzicoSandbox: boolean },
  token: string,
  conversationId: string
): Promise<RetrieveResult> {
  const iyzipay = client(settings);

  return new Promise((resolve) => {
    iyzipay.checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, conversationId, token }, (err, result) => {
      if (err) return resolve({ ok: false, error: err.message });
      if (result.status !== "success") {
        resolve({ ok: false, error: result.errorMessage || "Ödeme doğrulanamadı." });
        return;
      }
      const paid = String((result as { paymentStatus?: string }).paymentStatus ?? "").toUpperCase() === "SUCCESS";
      resolve({ ok: true, paid, paymentId: result.paymentId, paidPrice: result.paidPrice });
    });
  });
}

/** Guest kaydindan iyzico'nun zorunlu alici bilgilerini hazirlar; eksikse null doner. */
export function buildBuyerFromGuest(guest: {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  idNumber: string | null;
  address: string | null;
}): StartCheckoutInput["buyer"] | null {
  if (!guest.email || !guest.idNumber) return null;
  const [name, ...rest] = guest.fullName.trim().split(/\s+/);
  const gsm = normalizePhone(guest.phone);
  return {
    id: guest.id,
    name: name || guest.fullName,
    surname: rest.join(" ") || name || guest.fullName,
    identityNumber: guest.idNumber,
    email: guest.email,
    gsmNumber: gsm ? `+${gsm}` : "+905000000000",
    address: guest.address || "Adres belirtilmedi",
    city: "Erzurum",
  };
}
