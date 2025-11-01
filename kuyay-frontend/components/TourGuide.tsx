"use client";

import { useState } from "react";
import Image from "next/image";

interface TourStep {
  id: number;
  title: string;
  description: string;
  llamaImage: string;
  targetElement?: string;
  position: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    id: 1,
    title: "¡Bienvenido a Kuyay! 🦙",
    description: "Hola, soy tu guía. Te mostraré lo fácil que es comenzar tu viaje hacia la libertad financiera. ¿Listo?",
    llamaImage: "/images/llama1.png",
    position: "bottom",
  },
  {
    id: 2,
    title: "Conecta tu Billetera",
    description: "Primero, necesitas conectar tu billetera con MetaMask. Haz click en 'Conectar Wallet' arriba a la derecha. Es súper simple, solo un click y listo. Asegúrate de estar en Arbitrum Sepolia.",
    llamaImage: "/images/llama1.png",
    targetElement: "connect-wallet-btn",
    position: "bottom",
  },
  {
    id: 3,
    title: "Crea o Únete a un Círculo",
    description: "Ahora puedes crear tu propio círculo con amigos, o unirte a uno existente.",
    llamaImage: "/images/llama2.png",
    targetElement: "circles-section",
    position: "top",
  },
  {
    id: 4,
    title: "Empieza a Ahorrar",
    description: "Cada mes aportas tu parte. Cuando sea tu turno en el sorteo, recibes todo el pozo. ¡Así de simple! 💰",
    llamaImage: "/images/llama3.png",
    targetElement: "savings-info",
    position: "top",
  },
  {
    id: 5,
    title: "¡Listo para Empezar! 🎉",
    description: "Ya sabes todo lo necesario. Ahora es tu momento de brillar. ¡Comienza tu viaje hacia la libertad financiera!",
    llamaImage: "/images/llama3.png",
    position: "bottom",
  },
];

interface TourGuideProps {
  onClose: () => void;
}

export default function TourGuide({ onClose }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tourSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Función para obtener la posición del elemento objetivo
  const getTargetPosition = () => {
    if (!step.targetElement) return null;

    const element = document.getElementById(step.targetElement);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  };

  const targetPos = getTargetPosition();

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleSkip} />

      {/* Spotlight - Resaltar elemento específico */}
      {targetPos && (
        <div
          className="absolute border-4 border-ocre rounded-lg shadow-2xl shadow-ocre/50 pointer-events-none animate-pulse-border"
          style={{
            top: `${targetPos.top - 10}px`,
            left: `${targetPos.left - 10}px`,
            width: `${targetPos.width + 20}px`,
            height: `${targetPos.height + 20}px`,
          }}
        />
      )}

      {/* Card del tour con la llama */}
      <div
        className={`absolute ${
          step.position === "bottom"
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : step.position === "top"
            ? targetPos
              ? `top-[${targetPos.top + targetPos.height + 20}px] left-[${targetPos.left}px]`
              : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        } max-w-md w-full mx-4`}
      >
        <div className="bg-gradient-to-br from-profundo via-tierra/30 to-profundo border-4 border-ocre rounded-2xl p-6 shadow-2xl shadow-ocre/50 animate-fade-in">
          {/* Llama guía */}
          <div className="flex items-start gap-4 mb-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-ceremonial shadow-lg flex-shrink-0">
              <Image
                src={step.llamaImage}
                alt="Guía Llama"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-display font-bold text-gradient mb-2">
                {step.title}
              </h3>
              <p className="text-gris leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gris mb-2">
              <span>Paso {currentStep + 1} de {tourSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / tourSteps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-tierra/30 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-ceremonial via-ocre to-dorado h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Botones de navegación */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 border-2 border-tierra text-gris rounded-lg hover:border-ocre hover:text-ocre transition-colors"
              >
                Anterior
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-ceremonial to-ocre text-white px-6 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
            >
              {currentStep < tourSteps.length - 1 ? "Siguiente" : "¡Empezar!"}
            </button>

            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gris hover:text-white transition-colors"
            >
              Saltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
