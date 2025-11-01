"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import TourGuide from "@/components/TourGuide";
import ConnectWallet from "@/components/ConnectWallet";
import WalletInfo from "@/components/WalletInfo";

export default function Home() {
  const { isConnected } = useAccount();
  const [currentAguayo, setCurrentAguayo] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showEkekoInfo, setShowEkekoInfo] = useState(false);
  const [showAguayoInfo, setShowAguayoInfo] = useState(false);

  const aguayos = [
    {
      src: "/images/aguayo_1.png",
      name: "Aguayo de la Comunidad",
      description: "Cada hilo representa un miembro del círculo. Tu aguayo digital es tu identidad única en la blockchain - como una huella dactilar que solo tú posees.",
      identity: "Identidad verificada on-chain"
    },
    {
      src: "/images/aguayo_2.png",
      name: "Aguayo del Compromiso",
      description: "Los colores muestran tu historial de pagos y participación. Cada aporte queda registrado permanentemente, construyendo tu reputación financiera.",
      identity: "Historial inmutable y transparente"
    },
    {
      src: "/images/aguayo_3.png",
      name: "Aguayo de la Confianza",
      description: "Los patrones reflejan tu red de confianza. Mientras más participas, más se teje tu prestigio en la comunidad descentralizada.",
      identity: "Reputación descentralizada"
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAguayo((prev) => (prev + 1) % aguayos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [aguayos.length]);

  const toggleAudio = () => {
    const audio = document.getElementById("charango") as HTMLAudioElement;
    if (audio) {
      if (audioEnabled) {
        audio.pause();
      } else {
        audio.play();
      }
      setAudioEnabled(!audioEnabled);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Tour Guide Overlay */}
      {showTour && <TourGuide onClose={() => setShowTour(false)} />}

      {/* Audio Background */}
      <audio id="charango" loop>
        <source src="/sounds/charango-andean-instrument-313504.mp3" type="audio/mpeg" />
      </audio>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-profundo/80 backdrop-blur-md border-b border-ceremonial/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo_kuyay.png"
              alt="Kuyay Logo"
              width={50}
              height={50}
              className="rounded-lg"
            />
            <h1 className="text-2xl font-display font-bold text-gradient">Kuyay</h1>
          </div>

          <nav className="hidden md:flex gap-8 items-center">
            <a href="#como-funciona" className="text-gris hover:text-ocre transition-colors">
              ¿Cómo funciona?
            </a>
            <a href="#caracteristicas" className="text-gris hover:text-ocre transition-colors">
              Características
            </a>
            <button
              onClick={() => setShowTour(true)}
              className="text-gris hover:text-ocre transition-colors flex items-center gap-1"
              title="Ver guía interactiva"
            >
              🦙 Guía
            </button>
            {isConnected && (
              <Link
                href="/dashboard"
                className="text-gris hover:text-ocre transition-colors font-display font-bold"
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={toggleAudio}
              className="text-gris hover:text-ocre transition-colors"
              aria-label="Toggle music"
            >
              {audioEnabled ? "🔊" : "🔇"}
            </button>
            <div id="connect-wallet-btn">
              <ConnectWallet />
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden aguayo-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-profundo/50 to-profundo"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h2 className="text-5xl md:text-6xl font-display font-bold leading-tight">
                El <span className="text-gradient">Círculo</span> que{" "}
                <span className="text-gradient">Multiplica tu Futuro</span>
              </h2>

              <p className="text-xl text-gris leading-relaxed">
                Pequeños aportes mensuales con tu ayllu.
                <br />
                <strong className="text-ocre">Tradición andina</strong> que construye <strong className="text-pachamama">tu futuro</strong>.
              </p>

              <div className="bg-dorado/10 border border-dorado/30 rounded-xl p-4 mt-4">
                <p className="text-sm text-gris leading-relaxed">
                  💰 <strong className="text-ocre">¿Cómo funciona el pasanku?</strong> Te unes a un círculo de confianza. Cada mes todos aportan poco, pero uno recibe mucho.
                  <strong className="text-dorado"> Cuando te toque, accedes a todo el pozo.</strong> Es tu comunidad respaldándote para crecer más rápido.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowTour(true)}
                  className="bg-gradient-to-r from-ceremonial to-ocre text-white px-8 py-4 rounded-lg font-display font-bold text-lg hover:scale-105 transition-transform"
                >
                  Comenzar Ahora
                </button>
                <button
                  onClick={() => setShowTour(true)}
                  className="border-2 border-ocre text-ocre px-8 py-4 rounded-lg font-display font-bold text-lg hover:bg-ocre hover:text-profundo transition-all"
                >
                  Ver Guía 🦙
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-tierra">
                <div>
                  <div className="text-3xl font-display font-bold text-dorado">$2.4M</div>
                  <div className="text-sm text-gris">TVL</div>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-dorado">842</div>
                  <div className="text-sm text-gris">Usuarios</div>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-dorado">94.2%</div>
                  <div className="text-sm text-gris">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Right Content - Aguayo Carousel */}
            <div className="relative">
              <div
                className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-ocre/30 cursor-pointer group"
                onMouseEnter={() => setShowAguayoInfo(true)}
                onMouseLeave={() => setShowAguayoInfo(false)}
              >
                {aguayos.map((aguayo, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentAguayo ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Image
                      src={aguayo.src}
                      alt={aguayo.name}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                ))}

                {/* Overlay de información al hacer hover */}
                {showAguayoInfo && (
                  <div className="absolute inset-0 bg-profundo/90 backdrop-blur-sm flex flex-col justify-center items-center p-8 transition-all duration-300 animate-fade-in">
                    <div className="text-center space-y-4">
                      <div className="inline-block bg-gradient-to-r from-ceremonial via-ocre to-dorado p-1 rounded-xl">
                        <div className="bg-profundo px-4 py-2 rounded-lg">
                          <h4 className="text-2xl font-display font-bold text-gradient">
                            {aguayos[currentAguayo].name}
                          </h4>
                        </div>
                      </div>

                      <p className="text-gris leading-relaxed text-sm max-w-md">
                        {aguayos[currentAguayo].description}
                      </p>

                      <div className="pt-4 border-t border-ocre/30">
                        <p className="text-ocre font-display font-semibold text-sm flex items-center justify-center gap-2">
                          <span className="text-xl">🔐</span>
                          {aguayos[currentAguayo].identity}
                        </p>
                      </div>

                      <div className="mt-6 bg-dorado/10 border border-dorado/30 rounded-lg p-4">
                        <p className="text-xs text-dorado/90 leading-relaxed">
                          <strong className="text-dorado">Tu Identidad Digital:</strong> Cada interacción queda registrada en la blockchain, construyendo tu reputación sin necesidad de bancos o instituciones centralizadas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {aguayos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAguayo(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentAguayo
                        ? "bg-ocre w-8"
                        : "bg-tierra hover:bg-ocre/50"
                    }`}
                    aria-label={`Go to aguayo ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wallet Info Section */}
      <section className="py-8 px-6 bg-profundo">
        <div className="max-w-4xl mx-auto">
          <WalletInfo />
        </div>
      </section>

      {/* Como Funciona Section - Viaje con Llamas */}
      <section id="como-funciona" data-section="circles-section" className="py-20 px-6 bg-gradient-to-b from-profundo via-tierra/10 to-profundo relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 aguayo-pattern opacity-20"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-8">
            Inicia tu <span className="text-gradient">Viaje</span>
          </h2>
          <p className="text-center text-gris text-lg mb-20 max-w-2xl mx-auto">
            Nuestras llamas te guiarán en este camino hacia la libertad financiera
          </p>

          {/* Camino del viaje */}
          <div className="relative">
            {/* Línea de conexión - path curvo */}
            <div className="hidden md:block absolute top-32 left-0 w-full h-1">
              <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
                <path
                  d="M 0,100 Q 200,50 400,100 T 800,100 Q 1000,150 1200,100"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="10,5"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#C41E3A', stopOpacity: 0.5 }} />
                    <stop offset="50%" style={{ stopColor: '#F4A460', stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: '#FFD700', stopOpacity: 0.5 }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Pasos del viaje */}
            <div className="grid md:grid-cols-3 gap-12 md:gap-8">
              {/* Paso 1 - Comunidad Andina */}
              <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
                {/* Imagen de comunidad */}
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-ceremonial shadow-2xl shadow-ceremonial/50 hover:scale-105 transition-transform duration-300">
                  <Image
                    src="/images/comunidad_andina.jpg"
                    alt="Comunidad Andina"
                    fill
                    className="object-cover"
                  />
                  {/* Overlay sutil */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ceremonial/30 to-transparent"></div>
                </div>

                {/* Número del paso */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ceremonial to-ocre flex items-center justify-center text-2xl font-display font-bold shadow-lg">
                  1
                </div>

                {/* Contenido */}
                <div className="bg-gradient-to-br from-ceremonial/20 to-transparent border-2 border-ceremonial/50 rounded-2xl p-6 hover:border-ceremonial transition-all hover:shadow-xl hover:shadow-ceremonial/20">
                  <h3 className="text-2xl font-display font-bold mb-3 text-ceremonial">
                    Únete a la Comunidad
                  </h3>
                  <p className="text-gris leading-relaxed">
                    Conecta tu billetera y forma parte del ayllu.
                    Es tan simple como un click. Sin papeleos, sin complicaciones.
                  </p>
                </div>
              </div>

              {/* Paso 2 - Símbolo Andino */}
              <div className="flex flex-col items-center text-center space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {/* Símbolo circular andino */}
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-ocre shadow-2xl shadow-ocre/50 hover:scale-105 hover:rotate-12 transition-all duration-500 bg-gradient-to-br from-profundo via-tierra/30 to-profundo">
                  <Image
                    src="/images/andina_original.png"
                    alt="Símbolo Andino - Luna, Sol y Casa"
                    fill
                    className="object-contain p-3"
                  />
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-ocre/20 via-transparent to-dorado/20 animate-pulse-glow"></div>
                </div>

                {/* Número del paso */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ocre to-dorado flex items-center justify-center text-2xl font-display font-bold shadow-lg">
                  2
                </div>

                {/* Contenido */}
                <div id="circles-section" className="bg-gradient-to-br from-ocre/20 to-transparent border-2 border-ocre/50 rounded-2xl p-6 hover:border-ocre transition-all hover:shadow-xl hover:shadow-ocre/20">
                  <h3 className="text-2xl font-display font-bold mb-3 text-ocre">
                    Crea o Únete a un Círculo
                  </h3>
                  <p className="text-gris leading-relaxed">
                    Escoge un grupo de pasanaku con tus amigos o únete a uno nuevo.
                    Todos aportan, todos ganan.
                  </p>
                </div>
              </div>

              {/* Paso 3 - Ahorra y Recibe ⭐ */}
              <div className="flex flex-col items-center text-center space-y-6 animate-fade-in relative" style={{ animationDelay: '0.4s' }}>
                {/* Efectos de brillo alrededor */}
                <div className="absolute -inset-8 bg-gradient-to-r from-dorado/20 via-exito/30 to-dorado/20 rounded-full blur-3xl animate-pulse-glow"></div>

                {/* Ekeko - Dios de la Abundancia con efectos especiales */}
                <div
                  className="relative w-64 h-64 rounded-2xl overflow-visible border-4 border-dorado shadow-2xl shadow-dorado/70 hover:scale-110 transition-all duration-300 animate-pulse-border bg-gradient-to-br from-dorado/20 via-transparent to-exito/20 cursor-pointer group"
                  onClick={() => setShowEkekoInfo(!showEkekoInfo)}
                >
                  <Image
                    src="/images/ekeko_original.png"
                    alt="Ekeko - Dios de la Abundancia"
                    fill
                    className="object-contain p-4"
                  />
                  {/* Overlay brillante */}
                  <div className="absolute inset-0 bg-gradient-to-br from-dorado/20 via-transparent to-exito/20 pointer-events-none"></div>

                  {/* Estrellas brillantes - Abundancia */}
                  <div className="absolute top-4 right-4 text-4xl animate-bounce">✨</div>
                  <div className="absolute bottom-4 left-4 text-4xl animate-bounce" style={{ animationDelay: '0.3s' }}>💰</div>
                  <div className="absolute top-4 left-4 text-3xl animate-bounce" style={{ animationDelay: '0.6s' }}>⭐</div>
                  <div className="absolute bottom-4 right-4 text-3xl animate-bounce" style={{ animationDelay: '0.9s' }}>💫</div>

                  {/* Badge de "Haz click para aprender" */}
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-dorado text-profundo text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                    👆 Haz click
                  </div>
                </div>

                {/* Número del paso con animación especial */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dorado to-exito flex items-center justify-center text-2xl font-display font-bold shadow-2xl shadow-dorado/50 animate-pulse">
                  3
                </div>

                {/* Contenido con borde brillante */}
                <div id="savings-info" className="relative bg-gradient-to-br from-dorado/30 to-exito/20 border-2 border-dorado rounded-2xl p-6 hover:border-exito transition-all hover:shadow-2xl hover:shadow-dorado/30">
                  {/* Brillo en las esquinas */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-dorado rounded-full animate-ping"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-exito rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>

                  <h3 className="text-2xl font-display font-bold mb-3 text-dorado flex items-center justify-center gap-2">
                    Juega y Apalanca 🎲
                  </h3>
                  <p className="text-white leading-relaxed font-medium">
                    Juega pasanaku con tu ayllu. Aportas $100, pero accedes a $1,000 cuando te toca.
                    <strong className="text-dorado"> Entre todos, crecemos más rápido.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Llamado a la acción final */}
            <div className="mt-16 text-center">
              <div className="inline-block bg-gradient-to-r from-ceremonial via-ocre to-dorado p-1 rounded-2xl">
                <div className="bg-profundo px-8 py-6 rounded-2xl">
                  <p className="text-xl font-display font-bold mb-4">
                    ¿Listo para comenzar tu viaje? 🦙
                  </p>
                  <button
                    onClick={() => setShowTour(true)}
                    className="bg-gradient-to-r from-ceremonial to-ocre text-white px-8 py-4 rounded-lg font-display font-bold text-lg hover:scale-105 transition-transform"
                  >
                    Empezar Ahora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="caracteristicas" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16">
            Por qué <span className="text-gradient">Kuyay</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "⚡ Rápido como el Rayo",
                subtitle: "Powered by Stylus",
                description: "Usamos Arbitrum Stylus (Rust/WASM) - tecnología de próxima generación que es 97% más eficiente que Solidity tradicional. Las transacciones cuestan centavos y se ejecutan en milisegundos. Simulaciones Monte Carlo imposibles en otros protocolos.",
                highlight: "97% menos gas que Solidity",
                icon: "⚡"
              },
              {
                title: "🧮 Inteligente como el Yachay",
                subtitle: "Simulación Monte Carlo On-Chain",
                description: "Antes de crear un círculo, nuestro motor de Rust simula miles de escenarios en segundos - directamente en la blockchain. Conoces el riesgo real y la probabilidad de éxito antes de comprometerte. Tecnología imposible en Solidity puro.",
                highlight: "Análisis de riesgo en tiempo real",
                icon: "🧮"
              },
              {
                title: "🎯 Justo como la Chakana",
                subtitle: "Leverage Dinámico",
                description: "Tu nivel de Aguayo determina tu apalancamiento automáticamente (1x-5x). El Risk Oracle evalúa tu grupo en la blockchain usando Stylus, calculando tasas de interés justas basadas en historial real. Todo transparente, todo verificable.",
                highlight: "Tasas personalizadas en tiempo real",
                icon: "🎯"
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-pachamama/20 to-transparent border border-pachamama/30 rounded-xl p-8 hover:border-pachamama hover:shadow-xl hover:shadow-pachamama/20 transition-all"
              >
                <h3 className="text-3xl font-display font-bold mb-2 text-center">{feature.title}</h3>
                <div className="text-ocre font-display text-sm mb-4 text-center">{feature.subtitle}</div>
                <p className="text-gris leading-relaxed mb-4">{feature.description}</p>
                <div className="text-center pt-4 border-t border-pachamama/20">
                  <p className="text-dorado font-display text-sm font-semibold">{feature.highlight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pachamama Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-profundo to-tierra/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-3xl font-display font-bold mb-12 text-gradient">
            Protegido por la Pachamama 🌄
          </h3>

          {/* Arte de la Pachamama */}
          <div className="relative w-full max-w-6xl mx-auto">
            <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden border-4 border-dorado shadow-2xl shadow-dorado/40 hover:shadow-dorado/60 transition-all duration-500 hover:scale-[1.02]">
              <Image
                src="/images/pachamam_ oficial.png"
                alt="Pachamama - Madre Tierra"
                fill
                className="object-cover"
              />
              {/* Overlay sutil para resaltar */}
              <div className="absolute inset-0 bg-gradient-to-t from-profundo/40 via-transparent to-profundo/20"></div>

              {/* Brillo sutil en los bordes */}
              <div className="absolute inset-0 ring-2 ring-inset ring-dorado/30 rounded-3xl"></div>
            </div>

            {/* Texto descriptivo mejorado */}
            <div className="mt-8 space-y-2">
              <p className="text-xl font-display font-bold text-dorado">
                Madre Tierra - Pachamama
              </p>
              <p className="text-gris text-sm max-w-2xl mx-auto">
                Protectora de nuestra comunidad y guardiana de nuestro ayllu.
                En ella confiamos, por ella prosperamos juntos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nueva Sección: Powered by Stylus */}
      <section className="py-20 px-6 bg-gradient-to-b from-tierra/10 to-profundo relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pachamama/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-dorado/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-profundo/80 border-2 border-pachamama/50 rounded-full px-6 py-2 mb-6">
              <span className="text-2xl">⚡</span>
              <span className="text-pachamama font-display font-bold">Powered by Stylus</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              La Tecnología que nos hace <span className="text-gradient">Diferentes</span>
            </h2>
            <p className="text-gris text-lg max-w-3xl mx-auto">
              Usamos Arbitrum Stylus - la evolución de los smart contracts. Rust + WASM en blockchain.
            </p>
          </div>

          {/* Comparación: Solidity vs Stylus */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Solidity Tradicional */}
            <div className="bg-profundo/50 border-2 border-tierra/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-tierra/30 flex items-center justify-center text-2xl">
                  🐌
                </div>
                <div>
                  <h4 className="text-xl font-display font-bold text-white">Solidity Tradicional</h4>
                  <p className="text-sm text-gris">Lo que usan otros protocolos</p>
                </div>
              </div>
              <div className="space-y-3 text-gris text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-ceremonial">❌</span>
                  <span>Simulaciones Monte Carlo: Imposibles (demasiado gas)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-ceremonial">❌</span>
                  <span>Gas por transacción: $5-$20 en promedio</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-ceremonial">❌</span>
                  <span>Cálculos complejos: Lentos y costosos</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-ceremonial">❌</span>
                  <span>Análisis de riesgo: Off-chain o simplificado</span>
                </div>
              </div>
            </div>

            {/* Stylus */}
            <div className="bg-gradient-to-br from-pachamama/20 to-dorado/20 border-2 border-pachamama rounded-2xl p-8 shadow-xl shadow-pachamama/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pachamama to-dorado flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xl font-display font-bold text-pachamama">Kuyay + Stylus</h4>
                  <p className="text-sm text-dorado">Next-gen smart contracts</p>
                </div>
              </div>
              <div className="space-y-3 text-white text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-pachamama">✅</span>
                  <span><strong>Monte Carlo on-chain:</strong> 1000 simulaciones en segundos</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pachamama">✅</span>
                  <span><strong>Gas ultra-bajo:</strong> $0.10-$0.50 (97% más barato)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pachamama">✅</span>
                  <span><strong>Rust/WASM:</strong> Velocidad cercana a código nativo</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pachamama">✅</span>
                  <span><strong>Risk Oracle:</strong> Evaluación completa on-chain</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features técnicos en cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-profundo/80 border border-pachamama/30 rounded-xl p-6 hover:border-pachamama transition-all">
              <div className="text-3xl mb-3">🧮</div>
              <h5 className="text-lg font-display font-bold text-white mb-2">Monte Carlo Engine</h5>
              <p className="text-sm text-gris leading-relaxed">
                Motor de simulación probabilística escrito en Rust. Calcula tasa de éxito, mejor/peor caso,
                y retorno esperado antes de crear un círculo.
              </p>
            </div>

            <div className="bg-profundo/80 border border-dorado/30 rounded-xl p-6 hover:border-dorado transition-all">
              <div className="text-3xl mb-3">🎯</div>
              <h5 className="text-lg font-display font-bold text-white mb-2">Risk Oracle</h5>
              <p className="text-sm text-gris leading-relaxed">
                Evalúa elegibilidad, calcula leverage dinámico (1x-5x) y tasas de interés justas
                basadas en niveles de Aguayo SBT. Todo on-chain.
              </p>
            </div>

            <div className="bg-profundo/80 border border-ceremonial/30 rounded-xl p-6 hover:border-ceremonial transition-all">
              <div className="text-3xl mb-3">⚡</div>
              <h5 className="text-lg font-display font-bold text-white mb-2">Gas Savings</h5>
              <p className="text-sm text-gris leading-relaxed">
                97% menos gas que Solidity equivalente. Lo que costaría $10 en Solidity,
                te cuesta $0.30 con Stylus. Más accesible para todos.
              </p>
            </div>
          </div>

          {/* Badge final */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-gradient-to-r from-pachamama/20 to-dorado/20 border border-pachamama/50 rounded-xl px-8 py-4">
              <p className="text-white font-display font-bold mb-2">
                🚀 Pioneros en DeFi con Stylus
              </p>
              <p className="text-sm text-gris">
                Uno de los primeros protocolos en usar Rust/WASM para análisis financiero on-chain
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección: Construyendo Comunidad */}
      <section className="py-20 px-6 bg-profundo">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-display font-bold mb-4">
              Más que <span className="text-gradient">Finanzas</span>, es <span className="text-gradient">Comunidad</span>
            </h3>
            <p className="text-gris text-lg max-w-3xl mx-auto">
              Kuyay recupera la tradición andina del Pasanaku y la lleva a la era digital.
              No se trata solo de dinero, se trata de fortalecer el ayllu.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Izquierda: Tradición */}
            <div className="bg-gradient-to-br from-ceremonial/10 to-ocre/10 border-2 border-ceremonial/30 rounded-2xl p-8">
              <div className="text-4xl mb-4 text-center">🏔️</div>
              <h4 className="text-2xl font-display font-bold text-ceremonial mb-4 text-center">Tradición Andina</h4>
              <div className="space-y-3 text-gris">
                <p className="leading-relaxed">
                  <strong className="text-ocre">El Pasanaku</strong> existe desde tiempos ancestrales en los Andes.
                  Es la forma en que las comunidades se ayudan mutuamente, sin necesidad de bancos.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-ceremonial">El Ayllu</strong> es la comunidad extendida - tu familia, tus vecinos, tu gente.
                  Cuando uno prospera, todos prosperan.
                </p>
                <p className="leading-relaxed text-sm italic border-l-4 border-dorado pl-4">
                  "Ayni" - Hoy por ti, mañana por mí. La reciprocidad es la base de nuestra cultura.
                </p>
              </div>
            </div>

            {/* Derecha: Innovación */}
            <div className="bg-gradient-to-br from-pachamama/10 to-dorado/10 border-2 border-pachamama/30 rounded-2xl p-8">
              <div className="text-4xl mb-4 text-center">⚡</div>
              <h4 className="text-2xl font-display font-bold text-pachamama mb-4 text-center">Tecnología de Próxima Generación</h4>
              <div className="space-y-3 text-gris">
                <p className="leading-relaxed">
                  <strong className="text-pachamama">Arbitrum Stylus</strong> nos permite usar Rust/WASM en blockchain -
                  97% más eficiente que Solidity. Simulaciones Monte Carlo que antes eran imposibles.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-dorado">Risk Oracle On-Chain</strong> evalúa a tu grupo en tiempo real,
                  calculando leverage y tasas justas basadas en historial verificable. Todo transparente, todo en Rust.
                </p>
                <p className="leading-relaxed text-sm bg-dorado/10 border border-dorado/30 rounded-lg p-3">
                  ⚡ <strong className="text-dorado">Innovación:</strong> Somos de los primeros protocolos DeFi en usar
                  Stylus para análisis de riesgo on-chain. La velocidad y eficiencia de Rust + la seguridad de Ethereum.
                </p>
              </div>
            </div>
          </div>

          {/* Llamado a la acción comunitario */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-gradient-to-r from-ceremonial via-ocre to-dorado p-1 rounded-2xl">
              <div className="bg-profundo px-10 py-8 rounded-2xl">
                <p className="text-2xl font-display font-bold mb-2 text-gradient">
                  ¿Listo para unirte al ayllu digital? 🦙
                </p>
                <p className="text-gris mb-6">
                  Empieza con poco, accede a mucho. Fortalece tu comunidad.
                </p>
                <button
                  onClick={() => setShowTour(true)}
                  className="bg-gradient-to-r from-ceremonial to-ocre text-white px-10 py-4 rounded-lg font-display font-bold text-lg hover:scale-105 transition-transform"
                >
                  Comenzar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección: Mintea tu Aguayo */}
      {isConnected && (
        <section className="py-20 px-6 bg-gradient-to-b from-profundo to-tierra/10 relative overflow-hidden">
          <div className="absolute inset-0 aguayo-pattern opacity-5"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="bg-gradient-to-br from-ceremonial/10 via-ocre/10 to-dorado/10 border-2 border-dorado/50 rounded-2xl p-8 text-center space-y-6">
              <div className="text-6xl animate-bounce">🧵</div>
              <h3 className="text-4xl font-display font-bold">
                ¿Listo para <span className="text-gradient">Tejer tu Historia</span>?
              </h3>
              <p className="text-gris text-lg max-w-2xl mx-auto">
                Tu Aguayo Digital es tu identidad on-chain. Empieza con un Telar Vacío (Nivel 0)
                y construye tu reputación financiera con cada pago que completes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/dashboard"
                  className="bg-gradient-to-r from-ceremonial to-ocre text-white px-8 py-4 rounded-xl font-display font-bold text-lg hover:scale-105 transition-all shadow-xl"
                >
                  ✨ Ir al Dashboard
                </Link>
                <Link
                  href="/dashboard"
                  className="border-2 border-ocre text-ocre px-8 py-4 rounded-xl font-display font-bold text-lg hover:bg-ocre hover:text-profundo transition-all"
                >
                  Ver Mi Aguayo
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-tierra py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Image
              src="/images/logo_kuyay.png"
              alt="Kuyay Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-display font-bold text-gradient">Kuyay Protocol</span>
          </div>
          <p className="text-gris text-sm">
            Tu aguayo digital de confianza. Tradición andina que construye tu futuro.
          </p>
          <p className="text-tierra text-xs mt-4">
            © 2025 Kuyay Protocol.
          </p>
        </div>
      </footer>

      {/* MODAL GLOBAL DEL EKEKO - Cubre TODA la pantalla */}
      {showEkekoInfo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
          {/* Fondo oscuro que cubre TODO */}
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={() => setShowEkekoInfo(false)}
          />

          {/* Modal centrado */}
          <div
            className="relative w-full max-w-6xl max-h-[95vh] overflow-y-auto bg-profundo/95 border-4 border-tierra rounded-2xl p-8 md:p-12 shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Título simple */}
              <div className="text-center space-y-3">
                <div className="text-5xl mb-3">💰</div>
                <h4 className="text-3xl md:text-4xl font-display font-bold text-white">
                  Los Dos Modos de Pasanaku
                </h4>
                <p className="text-lg md:text-xl text-gris font-display">
                  Elige cómo quieres jugar con tu ayllu
                </p>
                <div className="h-1 w-48 mx-auto bg-tierra/50 rounded-full"></div>
              </div>

              {/* Intro simple */}
              <div className="bg-tierra/20 border-2 border-tierra/40 rounded-xl p-6">
                <p className="text-base md:text-lg text-white leading-relaxed text-center">
                  El Pasanaku es un <strong className="text-ocre">ahorro comunitario</strong> donde todos aportan cada mes y uno recibe el pozo completo. Simple y justo.
                </p>
              </div>

              {/* Badge de Stylus */}
              <div className="bg-gradient-to-r from-pachamama/20 to-dorado/20 border-2 border-pachamama/40 rounded-xl p-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="text-3xl">⚡</span>
                  <h5 className="text-xl font-display font-bold text-pachamama">Powered by Stylus</h5>
                </div>
                <p className="text-sm text-white text-center leading-relaxed">
                  Antes de unirte a un círculo, nuestro <strong className="text-dorado">motor de simulación Monte Carlo</strong> (escrito en Rust)
                  calcula la probabilidad de éxito en segundos - directamente en la blockchain.
                  <strong className="text-pachamama"> 97% más barato que Solidity tradicional.</strong>
                </p>
              </div>

              {/* MODO 1: SAVINGS */}
              <div className="bg-tierra/10 border-2 border-tierra/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="text-4xl">💰</div>
                  <div>
                    <h5 className="text-2xl md:text-3xl font-display font-bold text-white">Modo SAVINGS</h5>
                    <p className="text-base text-gris">Para empezar - Sin apalancamiento</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-profundo/50 rounded-lg p-4">
                    <p className="text-base text-white">
                      ✅ <strong>Requisito:</strong> Ninguno (puedes empezar hoy)
                    </p>
                  </div>

                  <div className="bg-profundo/50 rounded-lg p-4">
                    <p className="text-base text-white">
                      📝 <strong>Ejemplo:</strong> 10 personas del ayllu aportan $100 cada mes
                    </p>
                  </div>

                  <div className="bg-profundo/50 rounded-lg p-4">
                    <p className="text-base text-white">
                      💵 <strong>Pozo mensual:</strong> $1,000 (la suma de todos)
                    </p>
                  </div>

                  <div className="bg-profundo/50 rounded-lg p-4">
                    <p className="text-base text-white">
                      🎯 <strong>Cuando te toca ganar:</strong> Recibes $1,000
                    </p>
                  </div>

                  <div className="bg-profundo/50 rounded-lg p-4 border-l-4 border-ocre">
                    <p className="text-base text-white">
                      🎉 <strong className="text-ocre">Al completar el círculo:</strong> Desbloqueas el modo CREDIT con apalancamiento
                    </p>
                  </div>
                </div>
              </div>

              {/* MODO 2: CREDIT */}
              <div className="bg-tierra/10 border-2 border-tierra/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="text-4xl">🚀</div>
                  <div>
                    <h5 className="text-2xl md:text-3xl font-display font-bold text-white">Modo CREDIT</h5>
                    <p className="text-base text-gris">Con experiencia - Apalancamiento hasta 5x</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-profundo/50 rounded-lg p-4 border-l-4 border-ocre">
                    <p className="text-base text-white">
                      🔒 <strong className="text-ocre">Requisito:</strong> Haber completado al menos 1 círculo (demostrar experiencia)
                    </p>
                  </div>

                  <div className="bg-profundo/50 rounded-lg p-4 bg-pachamama/5 border border-pachamama/30">
                    <p className="text-base text-white">
                      🎯 <strong className="text-pachamama">Risk Oracle (Stylus):</strong> Tu leverage se calcula automáticamente según tu nivel de Aguayo.
                      Nuestro contrato de Rust evalúa tu historial on-chain en tiempo real.
                    </p>
                  </div>

                  <div className="bg-profundo/50 rounded-lg p-4">
                    <p className="text-base text-white">
                      🚀 <strong>Qué es el apalancamiento:</strong> El protocolo presta dinero extra según tu nivel de confianza
                    </p>
                  </div>

                  <div className="bg-profundo/50 rounded-lg p-4 bg-ocre/5">
                    <p className="text-base text-white">
                      💰 <strong>Ejemplo:</strong> $1,000 (del ayllu) + <strong className="text-ocre">$1,500</strong> (préstamo 1.5x) = <strong className="text-ocre">$2,500 total</strong>
                    </p>
                  </div>

                  <div className="bg-profundo/50 rounded-lg p-4">
                    <p className="text-base text-white">
                      🎯 <strong>Cuando te toca ganar:</strong> Recibes $2,500 (¡mucho más!)
                    </p>
                  </div>

                  <div className="bg-profundo/50 rounded-lg p-4">
                    <p className="text-base text-white leading-relaxed">
                      📈 <strong>Apalancamiento según nivel:</strong><br/>
                      • Nivel 1: <strong>1.5x</strong> | Nivel 2: <strong>2x</strong> | Nivel 3: <strong>3x</strong> | Nivel 5+: <strong>5x</strong>
                    </p>
                  </div>

                  <div className="bg-profundo/50 rounded-lg p-4 border-l-4 border-ocre">
                    <p className="text-base text-white">
                      💡 <strong className="text-ocre">Repago automático:</strong> El préstamo se paga poco a poco con cada cuota mensual
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer con info de Stylus */}
              <div className="mt-6 pt-4 border-t border-tierra/30 space-y-4">
                <p className="text-base md:text-lg text-center text-gris">
                  💡 <strong>Resumen:</strong> Empieza con SAVINGS, construye tu reputación y desbloquea CREDIT para acceder a mayor capital con el apoyo de la pachamama.
                </p>

                {/* Ventajas tecnológicas */}
                <div className="bg-gradient-to-r from-pachamama/10 to-dorado/10 border border-pachamama/30 rounded-lg p-4">
                  <p className="text-sm text-white text-center leading-relaxed">
                    ⚡ <strong className="text-pachamama">Ventaja Tecnológica:</strong> Gracias a Arbitrum Stylus (Rust/WASM),
                    simulamos miles de escenarios antes de que te unas, calculamos tu leverage justo en tiempo real,
                    y todo cuesta <strong className="text-dorado">97% menos gas</strong> que otros protocolos DeFi.
                  </p>
                </div>
              </div>

              {/* Botón de cerrar */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowEkekoInfo(false)}
                  className="bg-tierra hover:bg-tierra/80 text-white px-10 py-3 rounded-lg font-display font-bold text-lg transition-colors"
                >
                  Entendido ✓
                </button>
              </div>
            </div>

            {/* Botón X */}
            <button
              onClick={() => setShowEkekoInfo(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-tierra/50 hover:bg-tierra text-white transition-colors flex items-center justify-center text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
