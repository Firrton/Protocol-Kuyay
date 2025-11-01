# 🛠️ GUÍA DE SETUP - ARBITRUM STYLUS

## PASO 1: INSTALAR RUST

```bash
# 1.1 Instalar Rust y Cargo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 1.2 Verificar instalación
rustc --version
cargo --version

# 1.3 Instalar target wasm32
rustup target add wasm32-unknown-unknown
```

## PASO 2: INSTALAR STYLUS CLI

```bash
# 2.1 Instalar cargo-stylus
cargo install --force cargo-stylus

# 2.2 Verificar
cargo stylus --version
```

## PASO 3: CREAR PROYECTO STYLUS

```bash
# 3.1 Crear directorio para Stylus
cd /tu-proyecto
mkdir kuyay-stylus
cd kuyay-stylus

# 3.2 Inicializar proyecto con template
cargo stylus new risk-oracle
cd risk-oracle

# 3.3 Estructura del proyecto
# risk-oracle/
#   ├── Cargo.toml
#   ├── src/
#   │   └── lib.rs
#   └── .cargo/
#       └── config.toml
```

## PASO 4: CONFIGURAR Cargo.toml

```toml
[package]
name = "risk-oracle"
version = "0.1.0"
edition = "2021"

[dependencies]
alloy-primitives = "0.7"
alloy-sol-types = "0.7"
stylus-sdk = "0.5"
hex = "0.4"

[dev-dependencies]
tokio = { version = "1.12", features = ["full"] }
ethers = "2.0"

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "z"

[lib]
crate-type = ["lib", "cdylib"]
```

## PASO 5: CONFIGURAR .cargo/config.toml

```toml
[build]
target = "wasm32-unknown-unknown"

[unstable]
build-std = ["std", "panic_abort"]
build-std-features = ["panic_immediate_abort"]
```

## PASO 6: OBTENER ETH Y CONFIGURAR WALLET

```bash
# 6.1 Exportar tu private key
export PRIVATE_KEY="0xTU_PRIVATE_KEY_AQUI"

# 6.2 Configurar RPC de Arbitrum Sepolia
export RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# 6.3 Verificar balance
cast balance $YOUR_ADDRESS --rpc-url $RPC_URL
```

**Necesitas:**
- 0.01 ETH para deployment en Arbitrum Sepolia
- Faucet: https://faucet.quicknode.com/arbitrum/sepolia

## PASO 7: COMPILAR Y VERIFICAR

```bash
# 7.1 Compilar el contrato
cargo stylus build

# 7.2 Verificar tamaño del WASM
ls -lh target/wasm32-unknown-unknown/release/*.wasm

# 7.3 Check si es válido para deployment
cargo stylus check \
  --endpoint $RPC_URL \
  --wasm-file target/wasm32-unknown-unknown/release/risk_oracle.wasm
```

## PASO 8: DESPLEGAR

```bash
# 8.1 Deploy a Arbitrum Sepolia
cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint $RPC_URL \
  --wasm-file target/wasm32-unknown-unknown/release/risk_oracle.wasm

# 8.2 Guardar la dirección del contrato
# Output: Deployed contract at: 0x...
```

---

## 🧪 TESTING LOCAL

```bash
# Ejecutar tests
cargo test

# Con output detallado
cargo test -- --nocapture
```

---

## 📚 RECURSOS ÚTILES

- Docs oficiales: https://docs.arbitrum.io/stylus/stylus-gentle-introduction
- SDK Rust: https://github.com/OffchainLabs/stylus-sdk-rs
- Ejemplos: https://github.com/OffchainLabs/stylus-workshop-rust
- Discord: https://discord.gg/arbitrum

---

## ⚠️ TROUBLESHOOTING

### Error: "wasm validation failed"
```bash
# Recompilar con optimizaciones
cargo stylus build --release
```

### Error: "insufficient funds"
```bash
# Verificar balance
cast balance $YOUR_ADDRESS --rpc-url $RPC_URL
# Necesitas al menos 0.01 ETH
```

### Error: "program too large"
```bash
# Optimizar build
RUSTFLAGS="-C link-arg=-zstack-size=32768" cargo stylus build --release
```

---

✅ Una vez completado este setup, estás listo para migrar contratos.
