import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Scan = {
  id: string;
  file_name: string;
  image_url: string;
  created_at: string;
};

export default function MeusScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setScans(data || []);
    } catch (error) {
      console.error("Erro ao buscar scans:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>
        Meus Scans
      </h2>

      {loading && <p>Carregando...</p>}

      {!loading && scans.length === 0 && (
        <p>Nenhum scan encontrado</p>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {scans.map((scan) => (
          <div
            key={scan.id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              borderRadius: 8,
            }}
          >
            <img
              src={scan.image_url}
              alt="scan"
              style={{ width: 150, marginBottom: 10 }}
            />

            <p><strong>{scan.file_name}</strong></p>

            <p style={{ fontSize: 12 }}>
              {new Date(scan.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
