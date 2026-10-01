import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { hashPassword, verifyPassword } from "@/features/auth/password";
import { parsePermissions, pathForPermission, permissionForPath } from "@/features/auth/permissions";
import { createSessionToken, isAdminPassword, safeEqual, verifySessionToken } from "@/features/auth/session";

beforeEach(() => {
  process.env.PANEL_PASSWORD = "dogru-sifre-123";
  process.env.SESSION_SECRET = "a".repeat(32);
});

describe("oturum token'i", () => {
  it("uretilen token ayni turle dogrulanir", async () => {
    const token = await createSessionToken("staff", { userId: "u1", fullName: "Ayşe Yılmaz", permissions: ["bakim"] });
    assert.deepEqual(await verifySessionToken("staff", token), { userId: "u1", fullName: "Ayşe Yılmaz", permissions: ["bakim"] });
  });

  it("baska tur icin gecersizdir (misafir token'i panele sokmaz)", async () => {
    const token = await createSessionToken("guest", { guestId: "g1" });
    assert.equal(await verifySessionToken("admin", token), null);
    assert.equal(await verifySessionToken("staff", token), null);
  });

  it("icerigi degistirilen token reddedilir", async () => {
    const token = await createSessionToken("guest", { guestId: "g1" });
    const [version, , signature] = token.split(".");
    const forged = btoa(JSON.stringify({ kind: "guest", exp: 9999999999, guestId: "baskasi" })).replace(/=+$/, "");
    assert.equal(await verifySessionToken("guest", `${version}.${forged}.${signature}`), null);
  });

  it("sifre degisince eski oturumlar gecersiz olur", async () => {
    const token = await createSessionToken("admin", {});
    process.env.PANEL_PASSWORD = "yeni-sifre-456";
    assert.equal(await verifySessionToken("admin", token), null);
  });

  it("suresi dolan token reddedilir", async (t) => {
    const token = await createSessionToken("admin", {});
    t.mock.timers.enable({ apis: ["Date"], now: Date.now() + 8 * 24 * 60 * 60 * 1000 });
    assert.equal(await verifySessionToken("admin", token), null);
  });

  it("bos, bozuk ya da eski bicimli degerler reddedilir", async () => {
    for (const value of [undefined, null, "", "abc", "a.b", "dogru-sifre-123"]) {
      assert.equal(await verifySessionToken("admin", value), null);
    }
  });

  it("PANEL_PASSWORD tanimli degilse hicbir sey dogrulanmaz", async () => {
    const token = await createSessionToken("admin", {});
    process.env.PANEL_PASSWORD = "";
    assert.equal(await verifySessionToken("admin", token), null);
    assert.equal(await isAdminPassword(""), false);
    await assert.rejects(() => createSessionToken("admin", {}));
  });
});

describe("sifreler", () => {
  it("admin sifresi yalnizca birebir eslesirse kabul edilir", async () => {
    assert.equal(await isAdminPassword("dogru-sifre-123"), true);
    assert.equal(await isAdminPassword("dogru-sifre-12"), false);
    assert.equal(await isAdminPassword(""), false);
  });

  it("personel sifresi hash'lenir ve dogrulanir", async () => {
    const { salt, hash } = await hashPassword("gizli-parola");
    assert.notEqual(hash, "gizli-parola");
    assert.equal(await verifyPassword("gizli-parola", salt, hash), true);
    assert.equal(await verifyPassword("yanlis-parola", salt, hash), false);
  });

  it("safeEqual farkli uzunlukta false doner", () => {
    assert.equal(safeEqual("abc", "abc"), true);
    assert.equal(safeEqual("abc", "abd"), false);
    assert.equal(safeEqual("abc", "abcd"), false);
  });
});

describe("izinler", () => {
  it("yol -> izin eslesmesi", () => {
    assert.equal(permissionForPath("/panel/muhasebe/kasa"), "muhasebe");
    assert.equal(permissionForPath("/panel/tipler"), "odalar");
    assert.equal(permissionForPath("/panel/odalar/205"), "odalar");
    assert.equal(permissionForPath("/panel"), null);
    assert.equal(permissionForPath("/panel/kullanicilar"), null);
  });

  it("benzer onekli yol baska bolumun iznini almaz", () => {
    assert.equal(permissionForPath("/panel/menuler"), null);
    assert.equal(permissionForPath("/panel/personel-x"), null);
  });

  it("izin -> ilk sayfa", () => {
    assert.equal(pathForPermission("odalar"), "/panel/odalar");
    assert.equal(pathForPermission("bakim"), "/panel/bakim-talepleri");
    assert.equal(pathForPermission("yok"), "/panel/giris");
  });

  it("gecersiz izin anahtarlari ayiklanir", () => {
    assert.deepEqual(parsePermissions("bakim,admin,,muhasebe"), ["bakim", "muhasebe"]);
    assert.deepEqual(parsePermissions(null), []);
  });
});
