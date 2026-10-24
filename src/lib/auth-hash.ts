import { scrypt as _scrypt, randomBytes, timingSafeEqual } from "node:crypto";
const scrypt = (pw: string, salt: Buffer, len: number) => new Promise<Buffer>((res, rej) => _scrypt(pw, salt, len, (e, k) => (e ? rej(e) : res(k))));
// senha → "scrypt$<sal>$<hash>" (nunca guardamos a senha em si)
export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("base64")}$${(await scrypt(pw, salt, 64)).toString("base64")}`;
}
export async function verifyPassword(pw: string, stored: string | null | undefined) {
  const [alg, s, h] = (stored ?? "").split("$");
  if (alg !== "scrypt" || !s || !h) return false;
  const want = Buffer.from(h, "base64"), got = await scrypt(pw, Buffer.from(s, "base64"), want.length);
  return want.length === got.length && timingSafeEqual(want, got);
}
