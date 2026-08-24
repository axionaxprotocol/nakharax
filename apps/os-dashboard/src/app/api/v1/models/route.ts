import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = [
    {
      id: "deepseek-r1-cot",
      object: "model",
      created: 1787540000,
      owned_by: "nakharax-deai",
      permission: [],
      root: "deepseek-r1-cot",
      parent: null,
      description: "DeepSeek-R1 Chain-of-Thought Formal Logic & Mathematical Reasoning Engine",
      pricing: { input: "$0.14/1M", output: "$0.55/1M", token: "$tNAK" },
    },
    {
      id: "qwen3.8-coder",
      object: "model",
      created: 1787540000,
      owned_by: "nakharax-deai",
      permission: [],
      root: "qwen3.8-coder",
      parent: null,
      description: "Qwen3.8 High-Performance Systems & Smart Contract Code Synthesizer",
      pricing: { input: "$0.12/1M", output: "$0.48/1M", token: "$tNAK" },
    },
    {
      id: "sentinel-noesis-vx",
      object: "model",
      created: 1787540000,
      owned_by: "nakharax-deai",
      permission: [],
      root: "sentinel-noesis-vx",
      parent: null,
      description: "NOESIS-VX Protocol Supreme Cognitive Core & Autonomous Governance Brain",
      pricing: { input: "$0.00/1M", output: "$0.00/1M", token: "FREE_TESTNET" },
    },
    {
      id: "propsentinel-quant-risk",
      object: "model",
      created: 1787540000,
      owned_by: "nakharax-xpfirm",
      permission: [],
      root: "propsentinel-quant-risk",
      parent: null,
      description: "XpFirm PropSentinel Monte Carlo (1,000-path) & Markov 4-State Volatility Brain",
      pricing: { input: "$0.05/1M", output: "$0.20/1M", token: "$tNAK" },
    },
  ];

  return NextResponse.json({
    object: "list",
    data: models,
  });
}
