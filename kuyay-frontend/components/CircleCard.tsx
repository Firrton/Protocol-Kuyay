"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import PaymentButton from "./PaymentButton";
import DepositGuaranteeButton from "./DepositGuaranteeButton";
import DrawCeremonyPanel from "./DrawCeremonyPanel";
import { useHasUserPaid,useHasDepositedGuarantee,useMembersGuaranteeStatus } from "@/hooks/useCircles";

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
  members?: Array<{
    address: string;
    hasPaid: boolean;
    aguayoLevel: number;
  }>;
}

interface CircleCardProps {
  circle: Circle;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPaymentSuccess: () => void;
}

export default function CircleCard({
  circle,
  isExpanded,
  onToggleExpand,
  onPaymentSuccess,
}: CircleCardProps) {
  const { address: userAddress } = useAccount();

  // Verificar si ya depositó la garantía
  const { hasDeposited,refetch: refetchGuarantee } = useHasDepositedGuarantee(circle.address);

  // Obtener el estado real de pago del usuario desde el contrato
  const { hasPaid: hasUserPaidReal,refetch: refetchPaymentStatus } = useHasUserPaid(
    circle.address,
    circle.currentRound
  );

  // Obtener estado de depósitos de todos los miembros
  const memberAddresses = circle.members?.map((m) => m.address) || [];
  const { membersStatus,depositedCount,totalMembers,refetch: refetchMembersStatus } = useMembersGuaranteeStatus(
    circle.address,
    memberAddresses
  );

  // Debug: mostrar estado del círculo
  console.log("🔍 CircleCard Debug:",{
    name: circle.name,
    address: circle.address,
    status: circle.status,
    currentRound: circle.currentRound,
    memberCount: circle.memberCount,
    hasDeposited,
    hasUserPaidReal,
    depositedCount,
    totalMembers,
  });

  // Usar el estado real del contrato, no el del prop
  const hasUserPaid = circle.status === "ACTIVE" ? hasUserPaidReal : false;

  return (
    <div className="bg-gradient-to-br from-tierra/10 to-profundo border-2 border-tierra rounded-2xl p-6 hover:border-ocre transition-all">
      {/* Contenido del card */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-display font-bold text-white">{circle.name}</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-display font-bold ${circle.mode === "CREDIT"
                  ? "bg-ceremonial/20 text-ceremonial border border-ceremonial/40"
                  : "bg-pachamama/20 text-pachamama border border-pachamama/40"
                  }`}
              >
                {circle.mode}
              </span>
            </div>
            <p className="text-sm text-gris mt-1">
              {circle.memberCount} members • Round {circle.currentRound}/{circle.totalRounds}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-profundo/50 rounded-lg p-3">
            <p className="text-xs text-gris mb-1">Cuota Mensual</p>
            <p className="text-lg font-display font-bold text-ocre">${circle.cuotaAmount}</p>
          </div>
          <div className="bg-profundo/50 rounded-lg p-3">
            <p className="text-xs text-gris mb-1">Pozo Actual</p>
            <p className="text-lg font-display font-bold text-dorado">${circle.currentPot}</p>
          </div>
          <div className="bg-profundo/50 rounded-lg p-3">
            <p className="text-xs text-gris mb-1">Guarantee</p>
            <p className="text-lg font-display font-bold text-white">${circle.guaranteeAmount}</p>
          </div>
        </div>

        {/* Faith indicator - replaces Monte Carlo */}
        <div className="bg-gradient-to-r from-dorado/10 to-ocre/10 rounded-lg p-3 border border-dorado/30">
          <div className="flex items-center justify-between">
            <span className="text-gris">🙏 Sistema de Fe</span>
            <span className="text-sm font-display font-bold text-dorado">
              Mayor Fe = Mayor probabilidad de ganar
            </span>
          </div>
        </div>

        {/* Badge de Estado del Círculo */}
        <div className="flex justify-center">
          <span
            className={`px-4 py-2 rounded-full text-sm font-display font-bold ${circle.status === "DEPOSIT"
              ? "bg-dorado/20 text-dorado border-2 border-dorado/40"
              : circle.status === "ACTIVE"
                ? "bg-pachamama/20 text-pachamama border-2 border-pachamama/40"
                : "bg-tierra/20 text-gris border-2 border-tierra/40"
              }`}
          >
            {circle.status === "DEPOSIT" && "💎 Guarantee Phase - Awaiting Deposits"}
            {circle.status === "ACTIVE" && "⚡ Active Circle - Round " + circle.currentRound}
            {circle.status === "COMPLETED" && "✅ Completado"}
          </span>
        </div>

        {/* Advertencia si está en DEPOSIT con contador de depósitos */}
        {circle.status === "DEPOSIT" && (
          <div className="mt-4 bg-dorado/10 border-2 border-dorado/50 rounded-xl p-4">
            <div className="text-center space-y-3">
              <div className="text-2xl">⏳</div>
              <h4 className="text-dorado font-display font-bold">Esperando a todos los miembros</h4>

              {/* Contador de depósitos */}
              <div className="flex items-center justify-center gap-4 py-3">
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-pachamama">
                    {depositedCount}
                  </div>
                  <div className="text-xs text-gris">Depositaron</div>
                </div>
                <div className="text-2xl text-gris">/</div>
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-white">
                    {totalMembers}
                  </div>
                  <div className="text-xs text-gris">Total</div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-profundo rounded-full h-3 border border-tierra">
                <div
                  className="bg-gradient-to-r from-dorado to-pachamama h-full rounded-full transition-all duration-500"
                  style={{ width: `${(depositedCount / totalMembers) * 100}%` }}
                />
              </div>

              <p className="text-sm text-gris">
                Este círculo comenzará cuando <span className="text-white font-bold">todos los {totalMembers} miembros</span> depositen su garantía de <span className="text-white font-bold">${circle.guaranteeAmount}</span>.
              </p>
              <p className="text-xs text-dorado/80 mt-2">
                Una vez que todos depositen, el círculo se activará automáticamente y podrán comenzar los pagos mensuales.
              </p>
            </div>
          </div>
        )}

        {/* Mostrar DepositGuaranteeButton si está en DEPOSIT */}
        {circle.status === "DEPOSIT" && (
          <>
            {hasDeposited ? (
              // Ya depositó - mostrar mensaje de éxito
              <div className="rounded-xl p-4 border-2 bg-pachamama/10 border-pachamama/30">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">✅</span>
                  <div className="text-center">
                    <div className="font-display font-bold text-pachamama">
                      Guarantee Deposited!
                    </div>
                    <div className="text-sm text-gris">
                      Waiting for other members to deposit their guarantees
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // No ha depositado - mostrar botón
              <DepositGuaranteeButton
                circleAddress={circle.address}
                circleName={circle.name}
                amount={circle.guaranteeAmount}
                onDepositSuccess={() => {
                  refetchGuarantee();
                  refetchMembersStatus();
                  onPaymentSuccess();
                }}
              />
            )}
          </>
        )}

        {/* Mostrar PaymentButton solo si está en ACTIVE */}
        {circle.status === "ACTIVE" && (
          <>
            <div
              className={`rounded-xl p-4 border-2 ${hasUserPaid
                ? "bg-pachamama/10 border-pachamama/30"
                : "bg-ceremonial/10 border-ceremonial/50"
                }`}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{hasUserPaid ? "✅" : "⏰"}</span>
                  <div>
                    <div
                      className={`font-display font-bold ${hasUserPaid ? "text-pachamama" : "text-ceremonial"
                        }`}
                    >
                      {hasUserPaid ? "Pago Completado" : "Pago Pendiente"}
                    </div>
                    <div className="text-sm text-gris" suppressHydrationWarning>
                      {hasUserPaid
                        ? "Esperando al resto del grupo"
                        : `Vence: ${circle.nextPaymentDue.toLocaleDateString("es-ES",{
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}`}
                    </div>
                  </div>
                </div>
                {!hasUserPaid && (
                  <PaymentButton
                    circleAddress={circle.address}
                    circleName={circle.name}
                    amount={circle.cuotaAmount}
                    onPaymentSuccess={() => {
                      refetchPaymentStatus();
                      onPaymentSuccess();
                    }}
                  />
                )}
              </div>
            </div>

            {/* Panel de Sorteo - Mostrar siempre en círculos activos */}
            <DrawCeremonyPanel
              circleAddress={circle.address as `0x${string}`}
              circleName={circle.name}
              currentRound={circle.currentRound}
              memberCount={circle.memberCount}
              currentPot={circle.currentPot}
              members={memberAddresses}
            />
          </>
        )}

        {/* Mensaje si está completado */}
        {circle.status === "COMPLETED" && (
          <div className="text-center py-6 bg-pachamama/10 border-2 border-pachamama/30 rounded-xl">
            <span className="text-4xl mb-2 block">🎉</span>
            <p className="text-white font-display font-bold">
              This circle has finished successfully
            </p>
          </div>
        )}

        {/* Botón Ver Detalles */}
        <button
          onClick={onToggleExpand}
          className="w-full text-ocre font-display font-bold hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          {isExpanded ? "Cerrar Detalles ▲" : "Ver Detalles ▼"}
        </button>
      </div>

      {/* Vista Expandida */}
      {isExpanded && (
        <div className="border-t border-tierra mt-6 pt-6 space-y-6 bg-profundo/30 rounded-xl p-6">
          {/* Información Detallada */}
          <div>
            <h4 className="text-lg font-display font-bold text-white mb-4">
              Circle Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gris">Address:</span>
                <p className="text-white font-mono text-xs mt-1">
                  {circle.address.slice(0,6)}...{circle.address.slice(-4)}
                </p>
              </div>
              <div>
                <span className="text-gris">Leverage:</span>
                <p className="text-white mt-1">{circle.leverage || "1x"}</p>
              </div>
            </div>
          </div>

          {/* Miembros con estado real de depósitos */}
          {membersStatus && membersStatus.length > 0 && (
            <div>
              <h4 className="text-lg font-display font-bold text-white mb-4 flex items-center justify-between">
                <span>👥 Miembros ({membersStatus.length})</span>
                {circle.status === "DEPOSIT" && (
                  <span className="text-sm font-normal text-gris">
                    {depositedCount}/{totalMembers} depositaron
                  </span>
                )}
              </h4>
              <div className="space-y-2">
                {membersStatus.map((member,idx) => {
                  const isCurrentUser = member.address.toLowerCase() === userAddress?.toLowerCase();
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-lg p-3 border ${member.hasDeposited
                        ? "bg-pachamama/10 border-pachamama/30"
                        : "bg-tierra/10 border-tierra"
                        } ${isCurrentUser ? "ring-2 ring-ocre" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {member.hasDeposited ? "✅" : "⏳"}
                        </span>
                        <div>
                          <div className="text-sm font-mono text-white">
                            {member.address.slice(0,6)}...{member.address.slice(-4)}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-ocre/20 text-ocre px-2 py-0.5 rounded-full">
                                Tú
                              </span>
                            )}
                          </div>
                          {circle.status === "DEPOSIT" && (
                            <div className="text-xs text-gris">
                              {member.hasDeposited
                                ? `Depositó $${member.guaranteeAmount}`
                                : "Esperando depósito"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold ${member.hasDeposited
                          ? "bg-pachamama/20 text-pachamama"
                          : "bg-gris/20 text-gris"
                          }`}
                      >
                        {member.hasDeposited ? "Depositado" : "Pendiente"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-3">
            <a
              href={`https://sepolia.arbiscan.io/address/${circle.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border-2 border-ocre text-ocre px-6 py-3 rounded-lg font-display font-bold hover:bg-ocre hover:text-profundo transition-all text-center"
            >
              Ver Contrato en Arbiscan 📄
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(circle.address);
                alert(`✅ Dirección copiada: ${circle.address}`);
              }}
              className="flex-1 border-2 border-tierra text-gris px-6 py-3 rounded-lg font-display font-bold hover:bg-tierra hover:text-profundo transition-all"
            >
              Copy Address 📋
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
