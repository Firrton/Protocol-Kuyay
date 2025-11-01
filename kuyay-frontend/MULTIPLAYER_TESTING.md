# 🎮 Guía de Prueba: Modo Multiplayer Real

Esta guía te ayudará a probar el flujo completo de Kuyay con **2-3 wallets reales** jugando juntas.

---

## 🎯 Objetivo

Probar el ciclo completo de un círculo de ahorro con jugadores reales:

1. **Usuario 1** crea el círculo e invita a otros
2. **Usuario 2 y 3** ven el círculo en su dashboard
3. Todos pagan sus cuotas
4. Todos hacen check-in
5. Se ejecuta el sorteo
6. El ganador recibe el pozo

---

## 🔧 Configuración Previa

### Opción A: Múltiples Navegadores

1. **Chrome** - Usuario 1 (tú)
2. **Brave/Firefox** - Usuario 2 (segunda wallet)
3. **Safari** - Usuario 3 (tercera wallet - opcional)

Cada navegador usa una wallet de MetaMask diferente.

### Opción B: Perfiles de Chrome

1. Chrome Perfil 1 - Usuario 1
2. Chrome Perfil 2 - Usuario 2
3. Chrome Perfil 3 - Usuario 3

### Opción C: Dispositivos Diferentes

1. Tu computadora - Usuario 1
2. Tu celular - Usuario 2
3. Amigo/colega - Usuario 3

---

## 📋 Paso a Paso

### **Preparación (Todos los usuarios)**

Cada wallet necesita:

✅ Estar conectada a **Arbitrum Sepolia**
✅ Tener un **Aguayo minteado**
✅ Tener **ETH de testnet** (para gas)
✅ Tener **USDC de testnet** (al menos 500 USDC)

**Faucets:**
- ETH: https://www.alchemy.com/faucets/arbitrum-sepolia
- USDC: https://faucet.circle.com/ (selecciona Arbitrum Sepolia)

---

### **Fase 1: Usuario 1 Crea el Círculo**

1. **Conecta tu wallet** en http://localhost:3000
2. **Mintea tu Aguayo** (si no tienes uno)
   - Ve a Dashboard → Mi Perfil
   - Click en "Mintear Aguayo"
   - Espera confirmación
3. **Crea el círculo**:
   - Click en "✨ Crear Nuevo Ayllu"
   - **Paso 1 - Modo**: Selecciona "Círculo de Ahorro"
   - **Paso 2 - Configuración**:
     - Nombre: "Hackathon Test"
     - Número de miembros: **3** (ajusta según cuántos quieres)
     - Cuota: **150 USDC**
     - Garantía: **300 USDC**
   - **Paso 3 - Invitar Miembros**:
     - Copia las direcciones de Usuario 2 y Usuario 3
     - Pega cada dirección y haz click en "Agregar"
     - Verifica que se agreguen ambas direcciones
   - **Paso 4 - Crear**:
     - Revisa que todo esté correcto
     - Click en "🎉 Crear Ayllu"
     - **Confirma la transacción en MetaMask**
     - Espera la confirmación (puede tomar 30-60 segundos)

4. **Guarda la dirección del círculo**:
   - Una vez creado, copia la dirección del contrato del círculo
   - Compártela con Usuario 2 y Usuario 3 (si quieren verificar)

---

### **Fase 2: Todos Ven el Círculo**

**Usuario 1:**
- El círculo aparece automáticamente en "Mis Ayllus"
- Muestra "👥 3 miembros" y "Round 0/3"

**Usuario 2 y 3:**
- Conectan sus wallets
- Van al Dashboard
- **¡El círculo aparece automáticamente!** (porque fueron invitados)
- Muestra "Pago Pendiente"

---

### **Fase 3: Todos Hacen su Primer Pago**

Cada usuario debe pagar la cuota + garantía en la primera ronda.

**Para cada usuario:**

1. Ve al Dashboard
2. Encuentra el círculo "Hackathon Test"
3. Click en "💰 Pagar Cuota"
4. **Primera transacción**: Aprobar USDC
   - MetaMask pide aprobar el contrato para usar USDC
   - Click "Confirm"
   - Espera confirmación
5. **Segunda transacción**: Hacer el pago
   - MetaMask pide confirmar el pago de 450 USDC (150 cuota + 300 garantía)
   - Click "Confirm"
   - Espera confirmación

**Verificación:**
- Todos deberían ver quién ha pagado y quién no
- El estado cambia a "✅ Pago Completado" cuando todos pagan

---

### **Fase 4: Check-in (Asistencia)**

Una vez que todos pagaron, deben hacer check-in para el sorteo.

**Para cada usuario:**

1. En el dashboard, en el círculo
2. Click en "✋ Hacer Check-in"
3. Confirma la transacción en MetaMask
4. Espera confirmación

**Verificación:**
- Todos deberían aparecer como "Presente"

---

### **Fase 5: Sorteo**

Cuando TODOS hayan hecho check-in:

**Cualquier usuario puede iniciar el sorteo:**

1. Click en "🎲 Iniciar Sorteo"
2. Confirma la transacción
3. **Espera 30-60 segundos**
   - Chainlink VRF genera el número aleatorio
   - Esto toma un poco más que transacciones normales

**Resultado:**
- ¡Se anuncia el ganador! 🎉
- El pozo (450 USDC) se transfiere al ganador
- Todos pueden ver quién ganó

---

### **Fase 6: Siguiente Ronda (Opcional)**

Si quieren probar una segunda ronda:

1. Todos hacen su pago mensual (ahora solo 150 USDC)
2. Todos hacen check-in
3. Nuevo sorteo
4. Nuevo ganador

---

## 🐛 Troubleshooting

### "No veo el círculo en mi dashboard"

- **Verifica que** tu dirección fue agregada correctamente al crear el círculo
- Refresca la página (Ctrl+Shift+R o Cmd+Shift+R)
- Verifica que estás conectado con la wallet correcta

### "Transaction failed"

- **Verifica balances:**
  - Tienes suficiente ETH para gas?
  - Tienes suficiente USDC para el pago?
- Intenta de nuevo después de 30 segundos

### "Stuck en 'Confirmando...'"

- Ve a Arbiscan Sepolia y verifica el estado de tu transacción
- Puede tomar hasta 60 segundos en momentos de alta congestión

### "El sorteo no se ejecuta"

- **Verifica que TODOS** hayan hecho check-in
- Espera al menos 60 segundos para que Chainlink VRF responda
- Si después de 2 minutos no hay respuesta, puede ser un problema con VRF

---

## 📊 Qué Esperar

### Tiempos Aproximados

- Crear círculo: **30-60 segundos**
- Aprobar USDC: **20-30 segundos**
- Hacer pago: **30-60 segundos**
- Check-in: **20-30 segundos**
- Sorteo: **60-90 segundos** (incluye VRF)

### Costos de Gas

Cada transacción en Arbitrum Sepolia cuesta muy poco gas (testnet gratis).

---

## ✅ Checklist de Prueba Exitosa

- [ ] 3 usuarios con wallets conectadas
- [ ] Todos con Aguayo minteado
- [ ] Todos con ETH y USDC de testnet
- [ ] Círculo creado con todas las direcciones
- [ ] Todos ven el círculo en su dashboard
- [ ] Todos pagan su cuota + garantía
- [ ] Todos hacen check-in
- [ ] Sorteo se ejecuta exitosamente
- [ ] Ganador recibe el pozo

---

## 🎉 ¡Éxito!

Si completaste todos los pasos, ¡felicidades! Has probado el flujo completo de Kuyay Protocol con jugadores reales en blockchain.

**Esto demuestra:**
- ✅ Creación de círculos funcional
- ✅ Sistema de pagos real con USDC
- ✅ Check-in y asistencia
- ✅ Sorteo aleatorio con Chainlink VRF
- ✅ Distribución de fondos

---

## 🚀 Próximos Pasos

- Probar con más rondas
- Experimentar con círculos de crédito (leverage)
- Probar con más miembros (hasta 12)
- Simular un incumplimiento (no pagar) para ver manchas en Aguayo

---

¿Preguntas? Revisa la consola del navegador para logs detallados de cada transacción.
