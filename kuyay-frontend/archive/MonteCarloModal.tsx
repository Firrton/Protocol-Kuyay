"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { MonteCarloPreview } from "./MonteCarloPreview";

interface MonteCarloModalProps {
  isOpen: boolean;
  onClose: () => void;
  numMembers: number;
  cuotaAmount: string;
  memberAddresses: string[];
  onAccept?: () => void;
}

export default function MonteCarloModal({
  isOpen,
  onClose,
  numMembers,
  cuotaAmount,
  memberAddresses,
  onAccept,
}: MonteCarloModalProps) {
  const handleContinue = () => {
    onAccept?.();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-profundo border-2 border-tierra p-6 text-left align-middle shadow-xl transition-all">
                {/* Header con botón de cerrar */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h2"
                    className="text-3xl font-display font-bold text-white flex items-center gap-3"
                  >
                    <span className="text-4xl">🔮</span>
                    Análisis Detallado - Monte Carlo
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gris hover:text-white transition-colors text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-tierra/30"
                  >
                    ✕
                  </button>
                </div>

                {/* Descripción cultural */}
                <div className="bg-gradient-to-r from-pachamama/20 to-dorado/20 border border-pachamama/30 rounded-xl p-4 mb-6">
                  <p className="text-white text-sm leading-relaxed">
                    <span className="text-2xl mr-2">🌾</span>
                    <strong className="text-pachamama">Yachay (Sabiduría):</strong> Así como los antiguos andinos leían las estrellas
                    y las hojas de coca para predecir las cosechas, ahora usamos Monte Carlo para prever
                    el éxito de nuestro Ayllu. Esta simulación corre 100 escenarios posibles usando
                    tecnología Stylus (Rust/WASM) - <span className="text-dorado font-bold">97% más eficiente</span> que Solidity tradicional.
                  </p>
                </div>

                {/* Contenido del modal */}
                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                  <MonteCarloPreview
                    numMembers={numMembers}
                    cuotaAmount={cuotaAmount}
                    memberAddresses={memberAddresses}
                    onContinue={onAccept}
                  />
                </div>

                {/* Footer con botones */}
                <div className="mt-6 pt-4 border-t border-tierra flex gap-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border-2 border-tierra text-gris rounded-xl font-display font-bold hover:bg-tierra/20 hover:text-white transition-all"
                  >
                    Volver
                  </button>
                  {onAccept && (
                    <button
                      onClick={handleContinue}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-pachamama to-dorado text-white rounded-xl font-display font-bold hover:scale-105 transition-all shadow-xl"
                    >
                      Aceptar y Continuar
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
