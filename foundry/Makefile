-include .env

# Deployment Targets
.PHONY: deploy-testnet deploy-mainnet

# Default RPC URLs (fallback)
RPC_TESTNET ?= https://testnet-rpc.monad.xyz/
# Monad Mainnet Public RPC
RPC_MAINNET ?= https://rpc.monad.xyz/

# Si el usuario define RPC_URL_MAINNET manual en .env o comando, úsalo
ifneq ($(RPC_URL_MAINNET),)
    RPC_MAINNET := $(RPC_URL_MAINNET)
endif

deploy-testnet:
	@echo "Deploying to Monad Testnet..."
	forge script script/DeployMonad.s.sol --rpc-url $(RPC_TESTNET) --broadcast --legacy

deploy-mainnet:
	@echo "----------------------------------------"
	@echo "🚀 Deploying to Monad MAINNET"
	@echo "----------------------------------------"
	@echo "RPC: $(RPC_MAINNET)"
	@if [ -z "$(PRIVATE_KEY)" ]; then echo "❌ Error: PRIVATE_KEY not found in .env"; exit 1; fi
	@echo "Waiting 5 seconds before start..."
	@sleep 5
	forge script script/DeployMainnet.s.sol --rpc-url $(RPC_MAINNET) --broadcast --legacy
