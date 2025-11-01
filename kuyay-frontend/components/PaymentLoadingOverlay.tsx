"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface PaymentLoadingOverlayProps {
  isOpen: boolean;
  step: "idle" | "approving" | "paying" | "success";
  onClose?: () => void;
}

export default function PaymentLoadingOverlay({
  isOpen,
  step,
  onClose,
}: PaymentLoadingOverlayProps) {
  const [dots, setDots] = useState("");

  // Animación de puntos suspensivos
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const getMessage = () => {
    switch (step) {
      case "approving":
        return {
          title: "Aprobando USDC",
          subtitle: "Confirma la transacción en tu wallet",
          icon: "🔓",
        };
      case "paying":
        return {
          title: "Procesando Pago",
          subtitle: "Tu Aguayo será actualizado al completarse",
          icon: "💰",
        };
      case "success":
        return {
          title: "¡Pago Exitoso!",
          subtitle: "Tu Aguayo ha sido actualizado (+1 hilo tejido)",
          icon: "✅",
        };
      default:
        return {
          title: "Preparando",
          subtitle: "Un momento por favor",
          icon: "⏳",
        };
    }
  };

  const message = getMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fondo oscuro con blur */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Contenido */}
      <div className="relative z-10 max-w-md w-full mx-4 animate-scale-in">
        <div className="bg-gradient-to-br from-profundo via-tierra/30 to-profundo border-4 border-ocre rounded-3xl p-8 shadow-2xl shadow-ocre/50">
          {/* Logo de Kuyay con animación */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Anillos pulsantes alrededor del logo */}
              <div className="absolute inset-0 -m-4">
                <div className="absolute inset-0 rounded-full bg-ocre/20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full bg-ceremonial/20 animate-pulse" style={{ animationDelay: "0.5s" }}></div>
              </div>

              {/* Logo */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-dorado shadow-2xl shadow-dorado/50 animate-bounce-slow">
                <Image
                  src="/images/logo_kuyay.png"
                  alt="Kuyay Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Icono de estado */}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-ceremonial to-ocre rounded-full flex items-center justify-center text-2xl border-4 border-profundo shadow-lg animate-pulse">
                {message.icon}
              </div>
            </div>
          </div>

          {/* Texto */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-display font-bold text-gradient">
              {message.title}{dots}
            </h3>
            <p className="text-gris">
              {message.subtitle}
            </p>

            {/* Barra de progreso */}
            <div className="pt-4">
              <div className="h-2 bg-tierra/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-ceremonial via-ocre to-dorado rounded-full animate-loading-bar"></div>
              </div>
            </div>

            {/* Indicador de pasos */}
            <div className="pt-4 space-y-2">
              <div className={`flex items-center gap-3 text-sm ${
                step === "approving" ? "text-ocre" : (step === "paying" || step === "success") ? "text-pachamama" : "text-gris"
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  step === "approving" ? "bg-ocre animate-pulse" : (step === "paying" || step === "success") ? "bg-pachamama" : "bg-gris"
                }`}></div>
                <span className="font-display">
                  {step === "approving" ? "Aprobando USDC..." : "✓ USDC Aprobado"}
                </span>
              </div>
              <div className={`flex items-center gap-3 text-sm ${
                step === "paying" ? "text-ocre animate-pulse" : step === "success" ? "text-pachamama" : "text-gris"
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  step === "paying" ? "bg-ocre animate-pulse" : step === "success" ? "bg-pachamama" : "bg-gris"
                }`}></div>
                <span className="font-display">
                  {step === "paying" ? "Realizando pago..." : step === "success" ? "✓ Pago completado" : "Realizar pago"}
                </span>
              </div>
            </div>

            {/* Mensaje de ayuda */}
            <div className="pt-4">
              <div className="text-xs text-gris/70 bg-profundo/50 rounded-lg p-3 border border-tierra/50">
                💡 No cierres esta ventana ni tu wallet hasta que se complete la transacción
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
