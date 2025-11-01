# Configuración de Chainlink VRF para Kuyay

## ¿Por qué necesitamos Chainlink VRF?

En los Pasanakus, el sorteo debe ser **100% aleatorio y verificable** para que nadie pueda hacer trampa. Chainlink VRF (Verifiable Random Function) nos da números aleatorios que:

1. Son demostrablemente aleatorios (con prueba criptográfica)
2. No pueden ser manipulados por el owner del contrato
3. Son verificables on-chain por cualquiera

## Pasos para configurar VRF en Arbitrum Sepolia

### 1. Obtener LINK tokens en Arbitrum Sepolia

**Opción A: Faucet oficial**
- Ve a: https://faucets.chain.link/arbitrum-sepolia
- Conecta tu wallet
- Solicita 10 LINK (es suficiente para empezar)

**Opción B: Bridge desde Sepolia**
- Si ya tienes LINK en Ethereum Sepolia, puedes hacer bridge a Arbitrum Sepolia
- Usa: https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia

### 2. Crear una Subscription en Chainlink VRF

1. **Ve al VRF Subscription Manager:**
   ```
   https://vrf.chain.link/arbitrum-sepolia
   ```

2. **Conecta tu wallet** (la que usarás para deploy)

3. **Click en "Create Subscription"**
   - Te pedirá firmar una transacción (cuesta ~0.001 ETH en gas)
   - Guarda el **Subscription ID** que te dan (lo necesitas para el deploy)

4. **Fondear la subscription con LINK**
   - Click en "Add funds"
   - Añade al menos **5 LINK** para empezar
   - Cada sorteo de Circle cuesta ~0.1-0.2 LINK

### 3. Configurar las variables de entorno

Edita tu `.env`:

```bash
# Copia esto desde el Subscription Manager
VRF_SUBSCRIPTION_ID=123  # Tu ID real aquí

# Estas son fijas para Arbitrum Sepolia
VRF_COORDINATOR_ADDRESS=0x50d47e4142598E17717B3E7eAe675191BDbf99ec
VRF_KEY_HASH=0x027f94ff1465b3525f9fc03e9ff7d6d2c0953482246dd6ae07570c45d6631414
```

### 4. Desplegar los contratos

```bash
forge script script/Deploy.s.sol \
  --rpc-url arbitrum_sepolia \
  --broadcast \
  --verify
```

El script te mostrará las direcciones de los contratos desplegados.

### 5. Agregar el CircleFactory como Consumer

**IMPORTANTE:** Después del deploy, debes hacer esto:

1. Ve de nuevo a: https://vrf.chain.link/arbitrum-sepolia
2. Click en tu subscription
3. Click en "Add consumer"
4. Pega la dirección del **CircleFactory** (no Circle.sol individual)
5. Confirma la transacción

Sin este paso, los Circles NO podrán pedir números aleatorios.

### 6. Verificar que funciona

```bash
# Desde tu terminal, simula un sorteo
cast send <CIRCLE_ADDRESS> "startRoundDraw()" \
  --rpc-url arbitrum_sepolia \
  --private-key $PRIVATE_KEY
```

Si ves el evento `RoundDrawStarted`, ¡funcionó!

---

## Alternativa: Mock VRF para testing local

Si quieres testear en Anvil (localhost) sin gastar LINK, creamos un mock:

```solidity
// test/mocks/MockVRFCoordinator.sol
contract MockVRFCoordinator {
    uint256 private requestIdCounter = 1;

    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external returns (uint256) {
        uint256 requestId = requestIdCounter++;

        // Simula el callback después de 1 bloque
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encode(block.timestamp, requestId)));

        // Llama al callback del Circle
        VRFConsumerBaseV2(msg.sender).rawFulfillRandomWords(requestId, randomWords);

        return requestId;
    }
}
```

---

## Costos aproximados

| Acción                | Costo LINK | Costo ETH (gas) |
|-----------------------|------------|-----------------|
| Crear subscription    | 0          | ~0.001          |
| Añadir consumer       | 0          | ~0.0005         |
| Sorteo por Circle     | ~0.15      | ~0.002          |
| 10 Circles activos    | ~1.5       | ~0.02           |

**Recomendación:** Empieza con 5 LINK, eso te da ~30 sorteos para el demo del hackathon.

---

## Troubleshooting

**Error: "subscription not found"**
- Verifica que el VRF_SUBSCRIPTION_ID en .env sea correcto

**Error: "consumer not authorized"**
- Olvidaste añadir el CircleFactory como consumer (paso 5)

**Sorteo no se ejecuta:**
- Verifica que la subscription tenga fondos LINK suficientes
- Checa que el callback gas limit sea >= 200,000 (ya configurado en Circle.sol)

**¿Cuánto LINK necesito para el hackathon?**
- Para demo: 2-3 LINK
- Para hackathon completo (20-30 demos): 5-10 LINK
