import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/footer";
import EdukasiList from "./list";

export default async function Edukasi() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materi")
    .select("slug,judul,intro")
    .eq("aktif", true)
    .order("urutan");
  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 px-8 py-10 text-center text-white shadow">
          <h1 className="text-3xl font-extrabold">Edukasi Psikologi</h1>
          <p className="mt-2 text-violet-100">
            Kenali berbagai hal yang memengaruhi kesehatan dan kenyamanan Anda saat belajar.
          </p>
        </div>
        <EdukasiList items={data ?? []} />
      </main>
      <Footer />
    </>
  );
}
