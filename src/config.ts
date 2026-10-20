/**
 * wagmi configuration
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arcTestnet } from 'viem/chains'
import { injected } from 'wagmi/connectors'
import { registerChain } from './tracing'
import { defineChain } from 'viem'

// Arc Mainnet (chain ID 5042) — USDC is the native gas token
export const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } },
})

// Use Arc Mainnet in production, Arc Testnet in development
export const activeArcChain = import.meta.env.VITE_USE_MAINNET === 'true' ? arcMainnet : arcTestnet

// Pre-register chain RPC URLs so trace events show correct chain names immediately
registerChain(activeArcChain.id, activeArcChain.rpcUrls.default.http[0])

export const config = createConfig({
  chains: [activeArcChain, mainnet], // mainnet needed for ENS resolution
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(),
    [arcMainnet.id]: http(),
    [mainnet.id]: http(), // ENS resolution uses mainnet
  },
})
