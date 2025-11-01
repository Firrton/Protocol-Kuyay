"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import Link from "next/link";
import { useHasAguayo, useAguayoMetadata } from "@/hooks/useAguayo";
import { useDefaulters, type Defaulter } from "@/hooks/useDefaulters";
import { useDemo } from "@/lib/demo";
import MintAguayoCard from "@/components/MintAguayoCard";
import MintAguayoButton from "@/components/MintAguayoButton";
import CreateAylluModal from "@/components/CreateAylluModal";
import CircleCard from "@/components/CircleCard";
import DemoController from "@/components/demo/DemoController";
import SoloModePanel from "@/components/demo/SoloModePanel";
import DemoStepBanner from "@/components/demo/DemoStepBanner";
import MonteCarloDemo from "@/components/MonteCarloDemo";

// Importar hooks reales
import { useUserCirclesWithDetails } from "@/hooks/useCircles";
import { CONTRACTS_DEPLOYED } from "@/lib/contracts/addresses";
// import { useVaultStats } from "@/hooks/useVault";

type Tab = "ayllus" | "perfil" | "qipi" | "tupuy";

interface Circle {
  name: string;
  address: string;
  mode: "CREDIT" | "SAVINGS";
  status: "ACTIVE" | "DEPOSIT" | "COMPLETED";
  currentRound: number;
  totalRounds: number;
  memberCount: number;
  cuotaAmount: number;
  guaranteeAmount: number;
  currentPot: number;
  nextPaymentDue: Date;
  hasUserPaid: boolean;
  leverage?: string;
  protocolLoan?: number;
  members?: {
    address: string;
    hasPaid: boolean;
    aguayoLevel: number;
  }[];
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("ayllus");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCircle, setExpandedCircle] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Evitar error de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Demo context para controlar navegación basada en pasos
  const { state: demoState } = useDemo();

  // Verificar si el usuario tiene Aguayo
  const { hasAguayo, isLoading: isLoadingAguayo, isContractDeployed } = useHasAguayo();
  const { metadata: realAguayoMetadata } = useAguayoMetadata();

  // Obtener círculos del usuario desde blockchain (con detalles completos)
  const { circles: realCircles, isLoading: isLoadingCircles, refetch: refetchCircles } = useUserCirclesWithDetails();

  // Obtener deudores desde blockchain (Q'ipi)
  const {
    defaulters: realDefaulters,
    isLoading: isLoadingDefaulters,
    isContractDeployed: isDefaultersContractDeployed
  } = useDefaulters();

  // Mock data - usar cuando los contratos no estén desplegados
  const mockAguayo = {
    level: 3,
    totalThreads: 42,
    completedCircles: 3,
    stains: 0,
    isStained: false,
    lastActivityTimestamp: BigInt(1730451600000), // Fecha fija: Nov 1, 2024
  };

  // Determinar si usar datos mock (cuando contratos no desplegados Y no tiene aguayo real)
  const useMockData = !isContractDeployed;

  const mockCircles: Circle[] = [
    {
      name: "Arbitrum",
      address: "0x123abc",
      mode: "SAVINGS",
      status: "ACTIVE",
      currentRound: 3,
      totalRounds: 8,
      memberCount: 8,
      cuotaAmount: 150,
      guaranteeAmount: 300,
      currentPot: 1200,
      nextPaymentDue: new Date("2025-11-06"), // Fecha fija para evitar hidratación
      hasUserPaid: true,
      members: [
        { address: "0x742d...8f3e", hasPaid: true, aguayoLevel: 3 },
        { address: "0x8f3e...1a9c", hasPaid: true, aguayoLevel: 2 },
        { address: "0x1a9c...5d2b", hasPaid: true, aguayoLevel: 1 },
        { address: "0x5d2b...9e4f", hasPaid: false, aguayoLevel: 2 },
        { address: "0x9e4f...3c8a", hasPaid: false, aguayoLevel: 1 },
        { address: "0x3c8a...7b1d", hasPaid: true, aguayoLevel: 2 },
        { address: "0x7b1d...2f6e", hasPaid: true, aguayoLevel: 4 },
        { address: "0x2f6e...4a3b", hasPaid: true, aguayoLevel: 1 },
      ],
    },
    {
      name: "Pachamama",
      address: "0x456def",
      mode: "CREDIT",
      status: "ACTIVE",
      currentRound: 1,
      totalRounds: 5,
      memberCount: 5,
      cuotaAmount: 500,
      guaranteeAmount: 1000,
      currentPot: 3750,
      nextPaymentDue: new Date("2025-11-11"), // Fecha fija para evitar hidratación
      hasUserPaid: false,
      leverage: "2.5x",
      protocolLoan: 2500,
      members: [
        { address: "0x742d...8f3e", hasPaid: false, aguayoLevel: 3 },
        { address: "0x8f3e...1a9c", hasPaid: true, aguayoLevel: 4 },
        { address: "0x1a9c...5d2b", hasPaid: true, aguayoLevel: 3 },
        { address: "0x5d2b...9e4f", hasPaid: false, aguayoLevel: 2 },
        { address: "0x9e4f...3c8a", hasPaid: true, aguayoLevel: 5 },
      ],
    },
  ];

  // Mock data de Q'ipi (deudores) - solo para cuando no hay contratos desplegados
  const mockDefaulters: Defaulter[] = [
    {
      address: "0x9a2f...4d8c",
      tokenId: 1,
      aguayoLevel: 1,
      stains: 2,
      totalDefaults: 2,
      lastDefaultDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      amountOwed: 450,
      status: "UNPAID",
      circleName: "Wiphala",
    },
    {
      address: "0x3c7e...9b1a",
      tokenId: 2,
      aguayoLevel: 2,
      stains: 1,
      totalDefaults: 1,
      lastDefaultDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      amountOwed: 0,
      status: "LIQUIDATED",
      circleName: "Inti",
    },
    {
      address: "0x5f8d...2e4b",
      tokenId: 3,
      aguayoLevel: 0,
      stains: 3,
      totalDefaults: 3,
      lastDefaultDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      amountOwed: 1200,
      status: "UNPAID",
      circleName: "Ayni",
    },
  ];

  // Usar datos reales si el contrato está desplegado, sino usar mock
  const defaulters = isDefaultersContractDeployed ? realDefaulters : mockDefaulters;

  // Usar círculos reales si el contrato está desplegado, sino usar mock
  const circles = CONTRACTS_DEPLOYED.circleFactory ? realCircles : mockCircles;

  // Función para obtener imágenes según nivel
  const getAguayoImages = (level: number) => {
    if (level === 0) return { aguayo: null, persona: null };
    if (level === 1) return { aguayo: "/images/aguayo_1.png", persona: "/images/persona_1.png" };
    if (level >= 2 && level <= 3) return { aguayo: "/images/aguayo_2.png", persona: "/images/persona_2.png" };
    return { aguayo: "/images/aguayo_3.png", persona: "/images/persona_final.png" };
  };

  const getLevelTitle = (level: number) => {
    if (level === 0) return "Telar Vacío";
    if (level === 1) return "Tejedor Principiante";
    if (level >= 2 && level <= 3) return "Tejedor Intermedio";
    return "Maestro Tejedor";
  };

  // Usar metadata real si está disponible, sino usar mock (movido arriba)
  const aguayoData = realAguayoMetadata || mockAguayo;
  const images = getAguayoImages(aguayoData.level);

  // En modo mock, permitir acceso sin wallet. En blockchain mode, requerir wallet.
  if (!isConnected && isContractDeployed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-profundo">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="text-6xl">🦙</div>
          <h1 className="text-3xl font-display font-bold text-gradient">
            Conecta tu Billetera
          </h1>
          <p className="text-gris">
            Para acceder a tu dashboard en blockchain mode, conecta tu billetera digital.
          </p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-ceremonial to-ocre text-white px-8 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
          >
            Volver al Inicio
          </Link>
        </div>
      </main>
    );
  }

  // Si no hay wallet en modo mock, usar address simulada
  const displayAddress = address || '0x742d35Cc6634C0532925a3b844Bc9e7595f8f3e';

  // Mostrar loading inicial para evitar error de hidratación
  if (!mounted) {
    return null; // Retornar null para evitar hydration mismatch
  }

  // Si está cargando Aguayo, mostrar loading
  if (isLoadingAguayo) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-profundo">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ocre border-t-transparent mx-auto"></div>
          <p className="text-gris">Cargando tu Aguayo...</p>
        </div>
      </main>
    );
  }

  // Si no tiene Aguayo Y los contratos están desplegados, mostrar página de mintear
  if (!hasAguayo && isContractDeployed) {
    return (
      <main className="min-h-screen bg-profundo pb-20">
        {/* Header simplificado */}
        <header className="bg-gradient-to-b from-profundo via-tierra/10 to-profundo border-b border-tierra py-6 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🦙</div>
              <h1 className="text-2xl font-display font-bold text-white">Kuyay Protocol</h1>
            </div>
            <Link
              href="/"
              className="text-gris hover:text-white transition-colors"
            >
              ← Volver al Inicio
            </Link>
          </div>
        </header>

        {/* Contenido */}
        <div className="max-w-4xl mx-auto px-6 mt-12">
          <MintAguayoCard />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-profundo pb-20">
      {/* Banner de Modo Mock */}
      {useMockData && (
        <div className="bg-gradient-to-r from-ocre/20 via-dorado/20 to-ceremonial/20 border-b-2 border-ocre/50 py-3 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap text-center">
            <span className="text-2xl">🚧</span>
            <p className="text-ocre font-display font-bold">
              Modo de Prueba: Smart contracts no desplegados - Mostrando datos mock
            </p>
            <span className="text-xs text-gris bg-profundo/50 px-3 py-1 rounded-full">
              Todo estará listo para cuando despliegues los contratos
            </span>
          </div>
        </div>
      )}

      {/* Header con Persona y Stats */}
      <header className="bg-gradient-to-b from-profundo via-tierra/10 to-profundo border-b border-tierra py-6 px-6 aguayo-pattern">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Avatar del Usuario con Persona */}
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => setActiveTab("perfil")}>
                {aguayoData.level === 0 ? (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-tierra/50 to-profundo border-4 border-tierra flex items-center justify-center">
                    <span className="text-4xl">🧵</span>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-dorado shadow-xl group-hover:scale-110 transition-transform">
                    <Image
                      src={images.persona!}
                      alt={`Persona Nivel ${aguayoData.level}`}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                      priority
                    />
                  </div>
                )}
                {/* Badge de Nivel */}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-dorado to-ocre text-profundo w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg border-3 border-profundo shadow-lg">
                  {aguayoData.level}
                </div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
                  {getLevelTitle(aguayoData.level)}
                </h1>
                <p className="text-gris text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-ceremonial/20 text-ceremonial px-2 py-1 rounded-full border border-ceremonial/50">
                    {circles.length} Ayllus activos
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Rápidas */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-gradient-to-br from-dorado/20 to-transparent border border-dorado/50 rounded-xl px-4 py-2 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-xl font-display font-bold text-dorado">
                  {aguayoData.totalThreads} 🧵
                </div>
                <div className="text-xs text-gris">Hilos Tejidos</div>
              </div>
              <div className="bg-gradient-to-br from-pachamama/20 to-transparent border border-pachamama/50 rounded-xl px-4 py-2 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-xl font-display font-bold text-pachamama">
                  {aguayoData.completedCircles} ✓
                </div>
                <div className="text-xs text-gris">Círculos Completos</div>
              </div>
              <div className="bg-gradient-to-br from-ceremonial/20 to-transparent border border-ceremonial/50 rounded-xl px-4 py-2 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-xl font-display font-bold text-ceremonial">
                  {aguayoData.stains === 0 ? "✨" : aguayoData.stains}
                </div>
                <div className="text-xs text-gris">
                  {aguayoData.stains === 0 ? "Sin Manchas" : "Manchas"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Step Banner - Guía visual del paso actual */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <DemoStepBanner onNavigateToProfile={() => setActiveTab("perfil")} />
      </div>

      {/* Navegación de Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-2 border-b border-tierra overflow-x-auto">
          <button
            onClick={() => setActiveTab("ayllus")}
            className={`px-4 py-3 font-display font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "ayllus"
                ? "text-ocre border-b-2 border-ocre"
                : "text-gris hover:text-ocre"
            }`}
          >
            🏔️ Mis Ayllus ({circles.length})
          </button>
          <button
            onClick={() => setActiveTab("perfil")}
            className={`px-4 py-3 font-display font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "perfil"
                ? "text-ocre border-b-2 border-ocre"
                : "text-gris hover:text-ocre"
            }`}
          >
            👤 Mi Perfil
          </button>
          <button
            onClick={() => setActiveTab("qipi")}
            className={`px-4 py-3 font-display font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "qipi"
                ? "text-ocre border-b-2 border-ocre"
                : "text-gris hover:text-ocre"
            }`}
          >
            ⚠️ Q&apos;ipi ({defaulters.length})
          </button>
          <button
            onClick={() => setActiveTab("tupuy")}
            className={`px-4 py-3 font-display font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "tupuy"
                ? "text-ocre border-b-2 border-ocre"
                : "text-gris hover:text-ocre"
            }`}
          >
            🌾 Tupuy (Pool)
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* TAB: MIS AYLLUS */}
        {activeTab === "ayllus" && (
          <div className="space-y-6">
            {/* Solo Mode Panel - Muestra los miembros simulados */}
            <SoloModePanel />

            {/* Demo de Monte Carlo */}
            <MonteCarloDemo />

            {/* Botón Crear Nuevo Ayllu con Monte Carlo */}
            <Link href="/create-circle">
              <div className="bg-gradient-to-r from-ceremonial/10 via-ocre/10 to-dorado/10 border-2 border-dashed border-ocre/50 rounded-2xl p-6 hover:border-ocre hover:bg-ocre/5 transition-all cursor-pointer group">
                <div className="text-center space-y-3">
                  <div className="text-5xl group-hover:scale-110 transition-transform">🔮</div>
                  <h2 className="text-2xl font-display font-bold text-gradient">
                    Crear Nuevo Ayllu
                  </h2>
                  <p className="text-gris">
                    Con análisis de riesgo y simulación Monte Carlo
                  </p>
                  <div className="inline-flex items-center gap-2 bg-pachamama/10 border border-pachamama/30 rounded-full px-3 py-1 text-xs text-pachamama font-bold">
                    <span>⚡</span>
                    Powered by Stylus
                  </div>
                </div>
              </div>
            </Link>

            {/* Lista de Círculos */}
            {circles.map((circle) => (
              <CircleCard
                key={circle.address}
                circle={circle}
                isExpanded={expandedCircle === circle.address}
                onToggleExpand={() => setExpandedCircle(expandedCircle === circle.address ? null : circle.address)}
                onPaymentSuccess={() => {
                  console.log("Pago/Garantía exitoso, actualizando dashboard...");
                  setTimeout(() => {
                    refetchCircles();
                  }, 3000);
                }}
              />
            ))}

            {/* Empty State */}
            {circles.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏔️</div>
                <h3 className="text-2xl font-display font-bold text-gris mb-2">
                  Aún no tienes Ayllus
                </h3>
                <p className="text-gris mb-6">
                  Crea tu primer círculo con análisis de riesgo inteligente
                </p>
                <Link
                  href="/create-circle"
                  className="inline-block bg-gradient-to-r from-ceremonial to-ocre text-white px-8 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
                >
                  🔮 Crear Mi Primer Ayllu
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB: MI PERFIL */}
        {activeTab === "perfil" && (
          <div className="space-y-6">
            {/* Si no tiene Aguayo o está en modo mock, mostrar opción de minteo */}
            {(!hasAguayo || useMockData) && (
              <div
                className={`bg-gradient-to-br from-ceremonial/10 via-ocre/10 to-dorado/10 border-2 rounded-2xl p-6 transition-all ${
                  demoState.currentStep === 'minting-aguayo'
                    ? 'border-purple-500 shadow-2xl shadow-purple-500/50 animate-pulse ring-4 ring-purple-400/30'
                    : 'border-dorado/50'
                }`}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-6xl">🧵</div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-gradient mb-1">
                        {demoState.currentStep === 'minting-aguayo'
                          ? "👉 ¡Mintea tu Aguayo AQUÍ!"
                          : useMockData ? "¡Mintea tu Aguayo cuando esté listo!" : "¡Mintea tu Aguayo!"}
                      </h3>
                      <p className="text-gris">
                        {useMockData
                          ? "Los smart contracts están en desarrollo. Podrás mintear tu Aguayo aquí cuando estén desplegados."
                          : "Tu identidad financiera on-chain. Soul-Bound Token único e inmutable."}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <MintAguayoButton />
                  </div>
                </div>
              </div>
            )}

            {/* Card Principal del Aguayo */}
            <div className="bg-gradient-to-br from-profundo via-tierra/10 to-profundo border-2 border-dorado/50 rounded-2xl p-8 overflow-hidden relative">
              <div className="absolute inset-0 aguayo-pattern opacity-10"></div>
              <div className="relative z-10 grid md:grid-cols-2 gap-8">
                {/* Visual del Aguayo */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  {aguayoData.level === 0 ? (
                    <div className="w-full max-w-sm aspect-square bg-gradient-to-br from-tierra/30 to-profundo rounded-2xl border-4 border-dashed border-tierra flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="text-6xl">🧵</div>
                        <div className="text-xl font-display font-bold text-gris">
                          Telar Vacío
                        </div>
                        <div className="text-sm text-gris px-6">
                          {useMockData ? "Minteando tu Aguayo cuando los contratos estén desplegados" : "Mintea tu Aguayo arriba para comenzar"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-4 border-dorado shadow-2xl hover:scale-105 transition-transform">
                        <Image
                          src={images.aguayo!}
                          alt={`Aguayo Nivel ${aguayoData.level}`}
                          width={500}
                          height={500}
                          className="object-cover w-full h-full"
                          priority
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-display font-bold text-gradient mb-1">
                          {getLevelTitle(aguayoData.level)}
                        </div>
                        <div className="text-gris">Nivel {aguayoData.level}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Stats del Aguayo */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">
                      Tu Aguayo Digital
                    </h2>
                    <p className="text-gris">
                      Representación inmutable de tu historia financiera en la blockchain
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-profundo/70 rounded-xl p-4 border-2 border-ceremonial/30 hover:border-ceremonial transition-colors">
                      <div className="text-sm text-gris mb-2">Nivel</div>
                      <div className="text-4xl font-display font-bold text-ceremonial mb-1">
                        {aguayoData.level}
                      </div>
                      <div className="text-xs text-gris">
                        {aguayoData.completedCircles} círculos
                      </div>
                    </div>

                    <div className="bg-profundo/70 rounded-xl p-4 border-2 border-dorado/30 hover:border-dorado transition-colors">
                      <div className="text-sm text-gris mb-2">Hilos</div>
                      <div className="text-4xl font-display font-bold text-dorado mb-1">
                        {aguayoData.totalThreads}
                      </div>
                      <div className="text-xs text-gris">
                        Pagos exitosos
                      </div>
                    </div>

                    <div className="bg-profundo/70 rounded-xl p-4 border-2 border-pachamama/30 hover:border-pachamama transition-colors">
                      <div className="text-sm text-gris mb-2">Completados</div>
                      <div className="text-4xl font-display font-bold text-pachamama mb-1">
                        {aguayoData.completedCircles}
                      </div>
                      <div className="text-xs text-gris">
                        Con borde ceremonial
                      </div>
                    </div>

                    <div className={`bg-profundo/70 rounded-xl p-4 border-2 transition-colors ${
                      aguayoData.isStained
                        ? "border-ceremonial/50 hover:border-ceremonial"
                        : "border-pachamama/30 hover:border-pachamama"
                    }`}>
                      <div className="text-sm text-gris mb-2">Estado</div>
                      <div className={`text-4xl font-display font-bold mb-1 ${
                        aguayoData.isStained ? "text-ceremonial" : "text-pachamama"
                      }`}>
                        {aguayoData.isStained ? aguayoData.stains : "✨"}
                      </div>
                      <div className="text-xs text-gris">
                        {aguayoData.isStained ? "Manchas" : "Sin manchas"}
                      </div>
                    </div>
                  </div>

                  {/* Elegibilidad */}
                  <div className={`rounded-xl p-4 border-2 ${
                    aguayoData.level >= 1 && !aguayoData.isStained
                      ? "bg-pachamama/10 border-pachamama/50"
                      : "bg-tierra/10 border-tierra"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">
                        {aguayoData.level >= 1 && !aguayoData.isStained ? "🎯" : "🔒"}
                      </span>
                      <div>
                        <div className="font-display font-bold text-white text-lg mb-1">
                          {aguayoData.level >= 1 && !aguayoData.isStained
                            ? "✓ Elegible para Círculos de Crédito"
                            : "Solo Círculos de Ahorro"}
                        </div>
                        <div className="text-sm text-gris">
                          {aguayoData.level >= 1 && !aguayoData.isStained
                            ? "Puedes acceder a apalancamiento de hasta 5x"
                            : "Completa círculos de ahorro para desbloquear crédito"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sistema de Niveles */}
            <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-tierra rounded-2xl p-6">
              <h3 className="text-2xl font-display font-bold text-white mb-4 flex items-center gap-2">
                🏆 Sistema de Niveles
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { level: 0, title: "Telar Vacío", circles: 0, color: "tierra" },
                  { level: 1, title: "Principiante", circles: 1, color: "ocre" },
                  { level: 3, title: "Intermedio", circles: 3, color: "dorado" },
                  { level: 5, title: "Maestro", circles: 5, color: "ceremonial" },
                ].map((tier) => (
                  <div
                    key={tier.level}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      aguayoData.level >= tier.level
                        ? `bg-${tier.color}/20 border-${tier.color} shadow-lg`
                        : "bg-profundo/30 border-tierra opacity-50"
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-display font-bold">
                        Nivel {tier.level}
                      </div>
                      <div className="text-sm font-display font-bold text-white">
                        {tier.title}
                      </div>
                      <div className="text-xs text-gris">
                        {tier.circles} círculos
                      </div>
                      {aguayoData.level >= tier.level && (
                        <div className="text-2xl">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logros */}
            <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-tierra rounded-2xl p-6">
              <h3 className="text-2xl font-display font-bold text-white mb-4 flex items-center gap-2">
                🎖️ Logros Desbloqueados
              </h3>
              <div className="space-y-3">
                {[
                  { icon: "🌱", title: "Primer Paso", desc: "Mintea tu Aguayo", unlocked: true },
                  { icon: "🧵", title: "Primer Hilo", desc: "Completa tu primer pago", unlocked: aguayoData.totalThreads >= 1 },
                  { icon: "🎯", title: "Tejedor Comprometido", desc: "Completa tu primer círculo", unlocked: aguayoData.completedCircles >= 1 },
                  { icon: "💎", title: "Sin Manchas", desc: "Completa 3 círculos sin faltas", unlocked: aguayoData.completedCircles >= 3 && !aguayoData.isStained },
                  { icon: "⭐", title: "Maestro Tejedor", desc: "Alcanza nivel 5", unlocked: aguayoData.level >= 5 },
                  { icon: "🏔️", title: "Leyenda del Ayllu", desc: "Completa 10 círculos", unlocked: aguayoData.completedCircles >= 10 },
                ].map((achievement, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      achievement.unlocked
                        ? "bg-dorado/10 border-dorado/50 hover:bg-dorado/20"
                        : "bg-profundo/30 border-tierra opacity-50"
                    }`}
                  >
                    <div className={`text-4xl ${achievement.unlocked ? "grayscale-0" : "grayscale opacity-30"}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-display font-bold text-white">
                        {achievement.title}
                      </div>
                      <div className="text-sm text-gris">
                        {achievement.desc}
                      </div>
                    </div>
                    {achievement.unlocked && (
                      <div className="text-pachamama font-bold text-2xl">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Q'IPI (DEUDORES) */}
        {activeTab === "qipi" && (
          <div className="space-y-6">
            {/* Header explicativo */}
            <div className="bg-gradient-to-br from-ceremonial/10 to-profundo border-2 border-ceremonial/50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-5xl">⚠️</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    Q&apos;ipi - Registro de Riesgo Social
                  </h2>
                  <p className="text-gris mb-3">
                    Lista pública de miembros que han incumplido sus compromisos con sus Ayllus.
                    La cofianza es la base de nuestra comunidad.
                  </p>
                  <div className="text-sm text-ceremonial font-bold">
                    ⚡ Los Aguayos manchados no pueden participar en círculos de crédito
                  </div>
                </div>
              </div>
            </div>

            {/* Stats del Q'ipi */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-profundo/50 rounded-xl p-4 border-2 border-ceremonial/30 text-center">
                <div className="text-sm text-gris mb-2">Total Deudores</div>
                <div className="text-3xl font-display font-bold text-ceremonial">
                  {isLoadingDefaulters ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-ceremonial border-t-transparent mx-auto"></div>
                  ) : (
                    defaulters.length
                  )}
                </div>
              </div>
              <div className="bg-profundo/50 rounded-xl p-4 border-2 border-tierra text-center">
                <div className="text-sm text-gris mb-2">Deuda Total</div>
                <div className="text-3xl font-display font-bold text-white">
                  {isLoadingDefaulters ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto"></div>
                  ) : (
                    `$${defaulters.reduce((sum, d) => sum + d.amountOwed, 0).toLocaleString()}`
                  )}
                </div>
              </div>
              <div className="bg-profundo/50 rounded-xl p-4 border-2 border-ocre/30 text-center">
                <div className="text-sm text-gris mb-2">Defaults Totales</div>
                <div className="text-3xl font-display font-bold text-ocre">
                  {isLoadingDefaulters ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-ocre border-t-transparent mx-auto"></div>
                  ) : (
                    defaulters.reduce((sum, d) => sum + d.totalDefaults, 0)
                  )}
                </div>
              </div>
            </div>

            {/* Lista de Deudores */}
            <div className="space-y-4">
              <h3 className="text-xl font-display font-bold text-white">
                Lista de Deudores Activos
              </h3>
              {isLoadingDefaulters ? (
                <div className="text-center py-12 bg-profundo/30 rounded-xl border-2 border-dashed border-tierra">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-ocre border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gris">Cargando deudores desde blockchain...</p>
                </div>
              ) : (
                <>
                  {defaulters.map((defaulter, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-ceremonial/30 rounded-xl p-6 hover:border-ceremonial/60 transition-all"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Info del Deudor */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-ceremonial/20 border-2 border-ceremonial flex items-center justify-center text-2xl">
                          ❌
                        </div>
                        <div>
                          <div className="font-mono text-white font-bold">
                            {defaulter.address}
                          </div>
                          <div className="text-sm text-gris">
                            Aguayo Nivel {defaulter.aguayoLevel} • {defaulter.stains} mancha{defaulter.stains > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-profundo/50 rounded-lg p-3 border border-tierra">
                          <div className="text-xs text-gris mb-1">Defaults Totales</div>
                          <div className="text-xl font-display font-bold text-ceremonial">
                            {defaulter.totalDefaults}
                          </div>
                        </div>
                        <div className="bg-profundo/50 rounded-lg p-3 border border-tierra">
                          <div className="text-xs text-gris mb-1">Último Default</div>
                          <div className="text-sm font-bold text-white">
                            {defaulter.lastDefaultDate.toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                      </div>

                      <div className="bg-profundo/50 rounded-lg p-3 border border-ocre/30">
                        <div className="text-xs text-gris mb-1">Círculo Afectado</div>
                        <div className="text-lg font-display font-bold text-white">
                          {defaulter.circleName}
                        </div>
                      </div>
                    </div>

                    {/* Info de Deuda */}
                    <div className="space-y-4">
                      <div className="bg-ceremonial/10 border border-ceremonial/50 rounded-lg p-4">
                        <div className="text-sm text-gris mb-2">Monto Adeudado</div>
                        <div className="text-3xl font-display font-bold text-ceremonial">
                          ${defaulter.amountOwed.toLocaleString()}
                        </div>
                      </div>

                      <div className={`rounded-lg p-4 border-2 ${
                        defaulter.status === "UNPAID"
                          ? "bg-ceremonial/20 border-ceremonial"
                          : defaulter.status === "LIQUIDATED"
                          ? "bg-tierra/20 border-tierra"
                          : "bg-ocre/20 border-ocre"
                      }`}>
                        <div className="text-sm text-gris mb-1">Estado</div>
                        <div className="text-lg font-display font-bold text-white">
                          {defaulter.status === "UNPAID" && "🚨 Sin Pagar"}
                          {defaulter.status === "LIQUIDATED" && "⚖️ Liquidado"}
                          {defaulter.status === "PARTIALLY_PAID" && "⏳ Pago Parcial"}
                        </div>
                      </div>

                      <div className="text-xs text-gris italic">
                        ⚠️ Esta información es pública y permanente en la blockchain
                      </div>
                    </div>
                  </div>
                </div>
              ))}

                  {defaulters.length === 0 && (
                    <div className="text-center py-12 bg-profundo/30 rounded-xl border-2 border-dashed border-tierra">
                      <div className="text-6xl mb-4">✨</div>
                      <h3 className="text-xl font-display font-bold text-pachamama mb-2">
                        ¡No hay deudores registrados!
                      </h3>
                      <p className="text-gris">
                        La comunidad está cumpliendo con todos sus compromisos
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB: TUPUY (POOL) */}
        {activeTab === "tupuy" && (
          <div className="space-y-6">

            {/* Vault LP Section */}
            <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-dorado/50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🌾</div>
                <h2 className="text-3xl font-display font-bold text-gradient mb-2">
                  Tupuy - La Semilla Comunitaria
                </h2>
                <p className="text-gris max-w-2xl mx-auto">
                  Tu cosecha crece mientras ayudas a tu comunidad. Tus fondos generan frutos, seguros con Aave.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-pachamama/20 text-pachamama border border-pachamama/50">
                    🛡️ Protegido por Aave
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-dorado/20 text-dorado border border-dorado/50">
                    ✨ Doble Rendimiento
                  </span>
                </div>
              </div>

              {/* Stats del Vault */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-profundo/50 rounded-xl p-6 border-2 border-dorado/30 text-center hover:scale-105 transition-transform">
                  <div className="text-sm text-gris mb-2">🌱 Semillas Plantadas</div>
                  <div className="text-3xl font-display font-bold text-dorado">
                    $124,500
                  </div>
                  <div className="text-xs text-gris mt-1">Total en la comunidad</div>
                </div>
                <div className="bg-profundo/50 rounded-xl p-6 border-2 border-pachamama/30 text-center hover:scale-105 transition-transform">
                  <div className="text-sm text-gris mb-2">🌾 Cosecha Anual</div>
                  <div className="text-3xl font-display font-bold text-gradient">
                    12.5%
                  </div>
                  <div className="text-xs text-gris mt-1">Rendimiento combinado</div>
                </div>
                <div className="bg-profundo/50 rounded-xl p-6 border-2 border-ceremonial/30 text-center hover:scale-105 transition-transform">
                  <div className="text-sm text-gris mb-2">💰 Tu Cosecha</div>
                  <div className="text-3xl font-display font-bold text-white">
                    $0
                  </div>
                  <div className="text-xs text-gris mt-1">Tus frutos creciendo</div>
                </div>
              </div>

              {/* Acciones */}
              <div className="grid md:grid-cols-2 gap-4">
                <button className="bg-gradient-to-r from-ceremonial to-ocre text-white py-4 rounded-lg font-display font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  🌱 Plantar Semilla
                  <div className="text-xs font-normal mt-1 opacity-75">Próximamente disponible</div>
                </button>
                <button className="border-2 border-ocre text-ocre py-4 rounded-lg font-display font-bold text-lg hover:bg-ocre hover:text-profundo transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  🌾 Cosechar
                  <div className="text-xs font-normal mt-1 opacity-75">Próximamente disponible</div>
                </button>
              </div>
            </div>

            {/* El Cuento del Tupuy - Storytelling Andino */}
            <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-tierra rounded-2xl p-6">
              <h3 className="text-xl font-display font-bold text-white mb-4 text-center">
                📖 La Historia del Tupuy
              </h3>
              <div className="space-y-4 text-gris">
                <p className="flex items-start gap-3">
                  <span className="text-3xl">🌱</span>
                  <span className="flex-1">
                    <span className="text-pachamama font-bold">Como las semillas en la Pachamama,</span> tus fondos se plantan en tierras fértiles y seguras (guardados en Aave, una plataforma probada y protegida).
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-3xl">☀️</span>
                  <span className="flex-1">
                    <span className="text-dorado font-bold">Mientras crece tu cosecha,</span> la comunidad de Kuyay usa parte de estas semillas para ayudar a círculos que necesitan crédito.
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-3xl">🌾</span>
                  <span className="flex-1">
                    <span className="text-ocre font-bold">Los frutos son dobles:</span> tu planta crece por sí sola gracias a la tierra fértil, y además, recibes frutos extra de ayudar a tu comunidad (12.5% anual total).
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-3xl">🤝</span>
                  <span className="flex-1">
                    <span className="text-ceremonial font-bold">Ayni en acción:</span> Das para que otros crezcan, y juntos todos prosperan. Los que piden prestado pagan intereses que van directo a ti.
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-3xl">🛡️</span>
                  <span className="flex-1">
                    <span className="text-pachamama font-bold">Tu cosecha está protegida:</span> Aave cuida tus semillas, y los préstamos llevan garantías. Si alguien no puede pagar, hay un fondo de emergencia que protege a la comunidad.
                  </span>
                </p>
              </div>
            </div>

            {/* Seguridad Simple */}
            <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-pachamama/50 rounded-2xl p-6">
              <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                🛡️ ¿Por qué es seguro?
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-profundo/50 rounded-lg p-4 border border-tierra">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🏦</span>
                    <span className="text-white font-bold">Protegido por Aave</span>
                  </div>
                  <p className="text-sm text-gris">
                    Tus fondos están en Aave, el banco más grande de DeFi ($10B+ guardados). Es como tener el dinero en el banco más seguro del mundo.
                  </p>
                </div>
                <div className="bg-profundo/50 rounded-lg p-4 border border-tierra">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🔐</span>
                    <span className="text-white font-bold">Préstamos con Garantía</span>
                  </div>
                  <p className="text-sm text-gris">
                    Cuando alguien pide prestado, debe dejar el doble como garantía. Como dejar tu casa para pedir un crédito - nadie pierde.
                  </p>
                </div>
                <div className="bg-profundo/50 rounded-lg p-4 border border-tierra">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚖️</span>
                    <span className="text-white font-bold">Fondo de Emergencia</span>
                  </div>
                  <p className="text-sm text-gris">
                    Parte de las ganancias va a un fondo de seguro comunitario. Si pasa algo raro, la comunidad está respaldada.
                  </p>
                </div>
                <div className="bg-profundo/50 rounded-lg p-4 border border-tierra">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">👁️</span>
                    <span className="text-white font-bold">Todo es Transparente</span>
                  </div>
                  <p className="text-sm text-gris">
                    Puedes ver cada préstamo, cada pago, cada garantía. Todo está en la blockchain, nadie puede hacer trampa.
                  </p>
                </div>
              </div>
            </div>

            {/* Referencia simple a Aave */}
            <div className="bg-gradient-to-r from-dorado/10 to-pachamama/10 border-2 border-dorado/30 rounded-2xl p-6 text-center">
              <p className="text-gris mb-3">
                <span className="text-white font-bold">¿Quieres saber más sobre Aave?</span>
              </p>
              <a
                href="https://aave.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-profundo rounded-lg border border-dorado hover:border-white transition-colors text-sm"
              >
                <span>🌐</span>
                <span className="text-white">Visitar Aave.com</span>
              </a>
              <p className="text-xs text-gris mt-3">
                Aave es el protocolo de préstamos más grande y seguro de DeFi
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Ayllu */}
      <CreateAylluModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCircleCreated={() => {
          // Refrescar la lista de círculos después de crear uno nuevo
          console.log("🔄 Refrescando lista de círculos...");
          refetchCircles();
        }}
      />

      {/* Demo Controller - Botón Flotante */}
      <DemoController />
    </main>
  );
}
