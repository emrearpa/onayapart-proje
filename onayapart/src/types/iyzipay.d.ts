// iyzipay paketi kendi TypeScript tiplerini saglamiyor. Sadece kullandigimiz
// yuzeyi (checkoutFormInitialize / checkoutForm) minimal ve dogru sekilde
// tanimliyoruz - ucuncu parti @types paketine bagimli kalmadan.
declare module "iyzipay" {
  interface IyzipayOptions {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  interface IyzipayCallbackResult {
    status: string;
    errorMessage?: string;
    errorCode?: string;
    token?: string;
    checkoutFormContent?: string;
    paymentPageUrl?: string;
    paymentId?: string;
    paidPrice?: string;
    [key: string]: unknown;
  }

  type IyzipayCallback = (err: Error | null, result: IyzipayCallbackResult) => void;

  class Iyzipay {
    constructor(options: IyzipayOptions);
    static LOCALE: { TR: string; EN: string };
    static CURRENCY: { TRY: string; USD: string; EUR: string };
    static PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    checkoutFormInitialize: { create: (request: Record<string, unknown>, cb: IyzipayCallback) => void };
    checkoutForm: { retrieve: (request: Record<string, unknown>, cb: IyzipayCallback) => void };
  }

  export = Iyzipay;
}
