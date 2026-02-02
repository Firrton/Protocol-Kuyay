# 🗄️ Stylus Monte Carlo Archive

> **Este código fue archivado como parte de la migración a Monad**

## Contexto Histórico

Este directorio contiene los contratos **Arbitrum Stylus (Rust/WASM)** que fueron desarrollados para ETH México 2025. Representan un logro técnico significativo:

### Lo que logramos:

- ✅ **Primer Monte Carlo onchain** - 1,000 simulaciones en una transacción
- ✅ **6,220× más eficiente** que Solidity equivalente
- ✅ **Costo: ~$0.08 USD** por simulación completa  
- ✅ **Tiempo: ~2 segundos** para 1000 iteraciones

### Por qué lo archivamos:

**Monad es EVM puro** - No soporta Arbitrum Stylus (WASM/Rust). Para la competencia Moltiverse necesitamos código compatible con EVM.

## Contratos Archivados

| Contrato | Función |
|----------|---------|
| `circle-simulator/` | Motor Monte Carlo - 1000 simulaciones probabilísticas |
| `risk-oracle/` | Análisis estadístico de riesgo grupal |

## Direcciones en Arbitrum Sepolia (Live)

```
CircleSimulator: 0x319570972527b9e3c989902311b9f808fe3553a4
RiskOracle:      0xc9ca3c1ceaf97012daae2f270f65d957113da3be
```

## Cómo restaurar

Si en el futuro Monad soporta WASM o volvemos a Arbitrum:

```bash
# Copiar de vuelta a raíz
cp -r archive/stylus-monte-carlo/* stylus-contracts/
```

---

*Archivado: 2 Feb 2026 - Migración Kuyay → Monad/Moltiverse*
