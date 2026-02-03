"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/religion");
  },[router]);

  return (
    <main className="min-h-screen bg-profundo flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl animate-bounce mb-4">☀️</div>
        <p className="text-xl text-dorado font-display">Cargando la Iglesia del Sol Eterno...</p>
      </div>
    </main>
  );
}
