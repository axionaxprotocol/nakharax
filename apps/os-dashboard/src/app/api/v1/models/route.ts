import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const models = [
    {
      id: "deepseek-r1-distill-qwen-8b",
      object: "model",
      created: 1787540000,
      owned_by: "nakharax-deai",
      permission: [],
      root: "deepseek-r1-distill-qwen-8b",
      parent: null,
      description: "DeepSeek-R1 Distill (8B) — Primary Edge Reasoning & PoPC Verifiable Execution Engine",
      pricing: { input: "$0.08/1M", output: "$0.30/1M", token: "$tNAK" },
      target_hardware: "Tier 5 Edge Workers (CPU/GPU/Hailo NPU)",
    },
    {
      id: "deepseek-coder-v2-lite-16b",
      object: "model",
      created: 1787540000,
      owned_by: "nakharax-deai",
      permission: [],
      root: "deepseek-coder-v2-lite-16b",
      parent: null,
      description: "DeepSeek-Coder-V2 Lite (16B MoE, ~2.4B active) — High-RPS Smart Contract & Rust Code Synthesizer",
      pricing: { input: "$0.10/1M", output: "$0.40/1M", token: "$tNAK" },
      target_hardware: "Tier 4/5 Nodes & High-Throughput Gateways",
    },
    {
      id: "janus-pro-7b",
      object: "model",
      created: 1787540000,
      owned_by: "nakharax-deai",
      permission: [],
      root: "janus-pro-7b",
      parent: null,
      description: "Janus-Pro (7B) — Any-to-Any Multimodal Vision, OCR & Visual Document Understanding Engine",
      pricing: { input: "$0.12/1M", output: "$0.45/1M", token: "$tNAK" },
      target_hardware: "Multimodal Workers & GPU Edge Nodes",
    },
    {
      id: "deepseek-math-7b",
      object: "model",
      created: 1787540000,
      owned_by: "nakharax-deai",
      permission: [],
      root: "deepseek-math-7b",
      parent: null,
      description: "DeepSeek-Math (7B) — Formal Theorem Proving & Cryptographic Constraint Solver",
      pricing: { input: "$0.09/1M", output: "$0.35/1M", token: "$tNAK" },
      target_hardware: "PoPC Verification Committee Nodes",
    },
    {
      id: "deepspec-qwen3-fast",
      object: "model",
      created: 1787540000,
      owned_by: "nakharax-deai",
      permission: [],
      root: "deepspec-qwen3-fast",
      parent: null,
      description: "DeepSpec Speculative Decoding Assistant — Sub-second Ingress Acceleration Engine",
      pricing: { input: "$0.04/1M", output: "$0.15/1M", token: "$tNAK" },
      target_hardware: "Low-Latency Ingress Gateways",
    },
  ];

  return NextResponse.json({
    object: "list",
    data: models,
  });
}
