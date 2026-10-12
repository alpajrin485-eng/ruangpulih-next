// Kebijakan password tunggal (dipakai klien + server).
// Kuat = skor 3-4. Pendaftaran/penetapan baru wajib Kuat.

const TERLARANG = [
  "12345678", "87654321", "password", "qwerty", "admin123", "ruangpulih",
  "123456789", "1234567890", "0987654321", "abcdefg", "qwerty123", "1q2w3e4r",
];

function adaUrutan(s: string): boolean {
  const t = s.toLowerCase();
  for (let i = 0; i + 3 < t.length; i++) {
    const a = t.charCodeAt(i), b = t.charCodeAt(i + 1), c = t.charCodeAt(i + 2), d = t.charCodeAt(i + 3);
    if (b === a + 1 && c === a + 2 && d === a + 3) return true;
    if (b === a - 1 && c === a - 2 && d === a - 3) return true;
  }
  return false;
}

function adaUlang(s: string): boolean {
  return /(.)\1\1/.test(s);
}

export type Level = "lemah" | "sedang" | "kuat";

export function nilaiPassword(pw: string, username = ""): { skor: number; level: Level; alasan: string[] } {
  const alasan: string[] = [];
  let skor = 0;
  const rendah = pw.toLowerCase();

  if (pw.length >= 8) skor += 1;
  else alasan.push("minimal 8 karakter");

  if (pw.length >= 12) skor += 1;

  const jenis = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (jenis >= 3) skor += 1;
  else alasan.push("campur huruf besar, huruf kecil, angka, simbol");

  const kenaKata = TERLARANG.some((k) => rendah.includes(k));
  const kenaUser = username.length >= 3 && rendah.includes(username.toLowerCase());
  if (!kenaKata && !kenaUser && !adaUrutan(pw) && !adaUlang(pw)) {
    skor += 1;
  } else {
    if (kenaKata || kenaUser) alasan.push("jangan pakai kata umum atau username Anda");
    if (adaUrutan(pw)) alasan.push("hindari urutan seperti abcd/9876");
    if (adaUlang(pw)) alasan.push("hindari huruf berulang seperti aaaa/1111");
  }

  const level: Level = skor <= 1 ? "lemah" : skor === 2 ? "sedang" : "kuat";
  return { skor, level, alasan };
}

export function wajibKuat(pw: string, username = ""): string | null {
  if (pw.length < 8) return "Password minimal 8 karakter.";
  const n = nilaiPassword(pw, username);
  if (n.level !== "kuat") return "Password belum kuat: " + n.alasan.join("; ") + ".";
  return null;
}
