import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LOCAL_RPC = "http://127.0.0.1:8545";
const DEFAULT_RPC = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || LOCAL_RPC;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // First try default RPC, fallback to local node if unreachable
    let res: Response;
    try {
      res = await fetch(DEFAULT_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch {
      res = await fetch(LOCAL_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: 1, error: { code: -32603, message: error.message || "RPC proxy failed" } },
      { status: 500 }
    );
  }
}

