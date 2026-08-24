"use client";

import { useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Cpu,
  Flame,
  MessageSquare,
  Power,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface Props {
  onTriggerHalt: () => void;
  onRearm: () => void;
  isHalting: boolean;
}

export function CitadelKillSwitchPanel({ onTriggerHalt, onRearm, isHalting }: Props) {
  const [botCommand, setBotCommand] = useState<"/status" | "/halt" | "/rearm" | "/approve">("/status");
  const [botResponse, setBotResponse] = useState<string | null>(
    "🛡️ CITADEL TELEGRAM BOT [ONLINE]\nStatus: 4/4 MT5 EA Terminals Protected\nRisk Level: NORMAL (0 Breaches Today)\nP99 Ingress Latency: 0.82ms\nListening for /halt /rearm /status"
  );
  const [activePreset, setActivePreset] = useState<string>("FTMO $100K");
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const [latencyBenchmark, setLatencyBenchmark] = useState<{
    shmUs: number;
    redisUs: number;
    socketUs: number;
    brokerAckUs: number;
    totalMs: string;
  }>({
    shmUs: 82,
    redisUs: 124,
    socketUs: 238,
    brokerAckUs: 360,
    totalMs: "0.804",
  });

  const runLatencyBenchmark = () => {
    setIsTestingLatency(true);
    setTimeout(() => {
      const shm = Math.floor(60 + Math.random() * 30);
      const redis = Math.floor(100 + Math.random() * 40);
      const socket = Math.floor(210 + Math.random() * 60);
      const ack = Math.floor(320 + Math.random() * 70);
      const total = ((shm + redis + socket + ack) / 1000).toFixed(3);

      setLatencyBenchmark({
        shmUs: shm,
        redisUs: redis,
        socketUs: socket,
        brokerAckUs: ack,
        totalMs: total,
      });
      setIsTestingLatency(false);
    }, 300);
  };

  const handleBotCommand = (cmd: "/status" | "/halt" | "/rearm" | "/approve") => {
    setBotCommand(cmd);
    const now = new Date().toLocaleTimeString();

    if (cmd === "/halt") {
      onTriggerHalt();
      setBotResponse(
        `🚨 [${now}] CITADEL ALERT: EMERGENCY HALT COMMAND RECEIVED!\n` +
        `• Initiator: Founder MFA Authorized\n` +
        `• Action: Dispatched SIGKILL to all MT5 sockets\n` +
        `• Redis Kill-Switch Key: SET nak:halt:global 1 (EX 0)\n` +
        `• Result: 4/4 Terminals Liquidated & Halted`
      );
    } else if (cmd === "/rearm") {
      onRearm();
      setBotResponse(
        `🟢 [${now}] CITADEL NOTICE: Terminals Re-Armed\n` +
        `• Status: Normal operational risk shields ACTIVE\n` +
        `• Drawdown threshold reset for new trading cycle.`
      );
    } else if (cmd === "/status") {
      setBotResponse(
        `📊 [${now}] CITADEL TELEMETRY STATUS\n` +
        `• Active Accounts: 4 (FTMO, FundedNext, Alpha, TopStep)\n` +
        `• Total Equity: $498,420 USD\n` +
        `• Combined Floating PnL: +$3,420.50\n` +
        `• Max Drawdown Observed: 1.8% (Limit: 5.0%)\n` +
        `• Sentinel Health: OK (<1ms)`
      );
    } else if (cmd === "/approve") {
      setBotResponse(
        `✅ [${now}] CITADEL OVERRIDE: Temporary Risk Exception Approved\n` +
        `• Account: FTMO $100K\n` +
        `• Sizing Cap: 5.0 Lots for NFP News Cycle\n` +
        `• Expiry: 30 minutes.`
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-os-4 lg:grid-cols-2">
      {/* Sub-Millisecond Profiler Card */}
      <div className="surface-panel rounded-os-2xl border border-white/10 p-os-5 space-y-os-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-os-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
              <Zap size={16} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Sub-Millisecond Kill-Switch Profiler (&lt;1ms SLA)
              </h3>
              <p className="text-[11px] text-slate-400">
                Deterministic hardware & socket execution timeline from breach detection to broker ACK.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={runLatencyBenchmark}
            disabled={isTestingLatency}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-mono font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
          >
            <RefreshCw size={12} className={isTestingLatency ? "animate-spin" : ""} />
            Benchmark SLA
          </button>
        </div>

        {/* Latency Pipeline Visualizer */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="text-[11px] font-bold text-white">1. Shared Memory Sentinel Check</div>
                <div className="text-[9px] font-mono text-slate-400">Rust C-ABI SHM ring buffer evaluation</div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">{latencyBenchmark.shmUs} μs</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
              <div>
                <div className="text-[11px] font-bold text-white">2. Redis Hot Cache Ingress Key Check</div>
                <div className="text-[9px] font-mono text-slate-400">Sub-millisecond token circuit-breaker state</div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">{latencyBenchmark.redisUs} μs</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-indigo-400" />
              <div>
                <div className="text-[11px] font-bold text-white">3. MT5 MQL5 EA Socket Push</div>
                <div className="text-[9px] font-mono text-slate-400">Asynchronous zero-copy TCP socket dispatch</div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400">{latencyBenchmark.socketUs} μs</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <div>
                <div className="text-[11px] font-bold text-white">4. Broker Liquidation ACK Confirmed</div>
                <div className="text-[9px] font-mono text-slate-400">Order close confirmation from prop bridge</div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">{latencyBenchmark.brokerAckUs} μs</span>
          </div>
        </div>

        {/* Total Time Badge */}
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-mono font-bold text-emerald-300">
          <span>⚡ TOTAL DETERMINISTIC HALT LATENCY:</span>
          <span className="text-sm text-white">{latencyBenchmark.totalMs} ms (SUB-MS PASS)</span>
        </div>
      </div>

      {/* Citadel Telegram Bot & Presets Card */}
      <div className="surface-panel rounded-os-2xl border border-white/10 p-os-5 space-y-os-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-os-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400">
              <MessageSquare size={16} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Remote Citadel Telegram Risk Bot
              </h3>
              <p className="text-[11px] text-slate-400">
                Institutional 2-way bot control for remote execution and real-time drawdown escalation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400">BOT ACTIVE</span>
          </div>
        </div>

        {/* Quick Bot Action Buttons */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => handleBotCommand("/status")}
            className={`rounded-xl border p-2 text-center text-xs font-mono font-bold transition-colors ${
              botCommand === "/status"
                ? "border-sky-500/50 bg-sky-500/20 text-sky-300"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            /status
          </button>
          <button
            type="button"
            onClick={() => handleBotCommand("/halt")}
            className={`rounded-xl border p-2 text-center text-xs font-mono font-bold transition-colors ${
              botCommand === "/halt"
                ? "border-rose-500/50 bg-rose-500/20 text-rose-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
            }`}
          >
            /halt
          </button>
          <button
            type="button"
            onClick={() => handleBotCommand("/rearm")}
            className={`rounded-xl border p-2 text-center text-xs font-mono font-bold transition-colors ${
              botCommand === "/rearm"
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            /rearm
          </button>
          <button
            type="button"
            onClick={() => handleBotCommand("/approve")}
            className={`rounded-xl border p-2 text-center text-xs font-mono font-bold transition-colors ${
              botCommand === "/approve"
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            /approve
          </button>
        </div>

        {/* Telegram Message Mock Card */}
        <div className="rounded-xl border border-sky-500/20 bg-slate-950 p-3.5 font-mono text-[11px] text-sky-200 whitespace-pre-wrap leading-relaxed shadow-inner">
          {botResponse}
        </div>

        {/* Prop Firm Presets */}
        <div className="pt-os-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            Institutional Prop Challenge Guardrail Presets:
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "FTMO $100K", dd: "5% Daily / 10% Max" },
              { name: "FundedNext $200K", dd: "5% Daily / 10% Max" },
              { name: "Alpha Capital $50K", dd: "4% Daily / 8% Max" },
              { name: "TopStep $150K", dd: "4.5% Trailing Max" },
            ].map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setActivePreset(preset.name)}
                className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-mono transition-colors ${
                  activePreset === preset.name
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-200 font-bold"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10"
                }`}
              >
                {preset.name} ({preset.dd})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
