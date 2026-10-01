import Iyzipay from "iyzipay";
import { normalizePhone } from "@/shared/lib/phone";

const IYZICO_URL = { sandbox: "https://sandbox-api.iyzipay.com", live: "https://api.iyzipay.com" };
const INSTALLMENT_OPTIONS = [1, 2, 3, 6, 9];
const COUNTRY = "Turkey";

export type IyzicoCredentials = { iyzicoApiKey: string; iyzicoSecretKey: string; iyzicoSandbox: boolean };

/** Online odeme acik ve anahtarlari girilmis mi? */
export function isIyzicoReady(s: IyzicoCredentials & { iyzicoEnabled: boolean }): boolean {
  return s.iyzicoEnabled && Boolean(s.iyzicoApiKey) && Boolean(s.iyzicoSecretKey);
}

function client(settings: IyzicoCredentials) {
  return new Iyzipay({
    apiKey: settings.iyzicoApiKey,
    secretKey: settings.iyzicoSecretKey,
    uri: settings.iyzicoSandbox ? IYZICO_URL.sandbox : IYZICO_URL.live,
  });
}

export type Buyer = {
  id: string;
  name: string;
  surname: string;
  identityNumber: string;
  email: string;
  gsmNumber: string;
  address: string;
  city: string;
  ip: string;
};

export type StartCheckoutInput = {
  conversationId: string;
  amount: number;
  callbackUrl: string;
  buyer: Buyer;
  basketId: string;
  basketDescription: string;
};

export type StartCheckoutResult = { ok: true; token: string; paymentPageUrl: string } | { ok: false; error: string };

/** Odeme baslatir; iyzico'nun kendi guvenli (PCI uyumlu) sayfasina yonlendirme adresini dondurur.
 *  Kart bilgileri hicbir zaman bizim sunucumuza gelmez. */
export async function startCheckoutForm(settings: IyzicoCredentials, input: StartCheckoutInput): Promise<StartCheckoutResult> {
  const price = input.amount.toFixed(2);
  const { buyer } = input;
  const address = { contactName: `${buyer.name} ${buyer.surname}`, city: buyer.city, country: COUNTRY, address: buyer.address };

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: input.conversationId,
    price,
    paidPrice: price,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: input.basketId,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: input.callbackUrl,
    enabledInstallments: INSTALLMENT_OPTIONS,
    buyer: {
      id: buyer.id,
      name: buyer.name,
      surname: buyer.surname,
      identityNumber: buyer.identityNumber,
      email: buyer.email,
      gsmNumber: buyer.gsmNumber,
      registrationAddress: buyer.address,
      city: buyer.city,
      country: COUNTRY,
      ip: buyer.ip,
    },
    shippingAddress: address,
    billingAddress: address,
    basketItems: [{ id: input.basketId, name: input.basketDescription, category1: "Konaklama", itemType: "VIRTUAL", price }],
  };

  return new Promise((resolve) => {
    client(settings).checkoutFormInitialize.create(request, (err, result) => {
      if (err) return resolve({ ok: false, error: err.message });
      if (result.status !== "success" || !result.token || !result.paymentPageUrl) {
        return resolve({ ok: false, error: result.errorMessage || "Ödeme başlatılamadı." });
      }
      resolve({ ok: true, token: result.token, paymentPageUrl: result.paymentPageUrl });
    });
  });
}

export type RetrieveResult = { ok: true; paid: boolean; paymentId?: string; paidPrice?: string } | { ok: false; error: string };

/** Odeme sonucunu iyzico'dan dogrudan sorgulayip dogrular - yonlendirmeye asla guvenilmez. */
export async function retrieveCheckoutForm(settings: IyzicoCredentials, token: string, conversationId: string): Promise<RetrieveResult> {
  return new Promise((resolve) => {
    client(settings).checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, conversationId, token }, (err, result) => {
      if (err) return resolve({ ok: false, error: err.message });
      if (result.status !== "success") return resolve({ ok: false, error: result.errorMessage || "Ödeme doğrulanamadı." });
      const paid = String((result as { paymentStatus?: string }).paymentStatus ?? "").toUpperCase() === "SUCCESS";
      resolve({ ok: true, paid, paymentId: result.paymentId, paidPrice: result.paidPrice });
    });
  });
}

/** Guest kaydindan iyzico'nun zorunlu alici bilgilerini hazirlar; e-posta, kimlik no ya da telefon eksikse null doner. */
export function buildBuyerFromGuest(
  guest: { id: string; fullName: string; phone: string; email: string | null; idNumber: string | null; address: string | null },
  context: { ip: string; city: string }
): Buyer | null {
  const gsm = normalizePhone(guest.phone);
  if (!guest.email || !guest.idNumber || !gsm) return null;

  const [name, ...rest] = guest.fullName.trim().split(/\s+/);
  return {
    id: guest.id,
    name,
    surname: rest.join(" ") || name,
    identityNumber: guest.idNumber,
    email: guest.email,
    gsmNumber: `+${gsm}`,
    address: guest.address || "Adres belirtilmedi",
    city: context.city,
    ip: context.ip,
  };
}
