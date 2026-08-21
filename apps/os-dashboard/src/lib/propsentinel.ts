export type Platform = "mt4" | "mt5";

export type AccountStatus = "active" | "warning" | "breached" | "offline";

export interface Terminal {
  terminal_id: string;
  platform: Platform;
  last_heartbeat: string;
  is_active: boolean;
}

export interface RiskProfile {
  daily_drawdown_pct: number | null;
  max_drawdown_pct: number | null;
  daily_drawdown_abs: number | null;
  max_drawdown_abs: number | null;
}

export interface Account {
  id: string;
  account_number: string;
  broker_name: string;
  platform: Platform;
  currency: string;
  label: string | null;
  status: AccountStatus;
  portfolio: {
    equity: number;
    balance: number;
    margin: number | null;
    free_margin: number | null;
    floating_pl: number;
    open_positions: number;
    margin_level_pct: number | null;
  };
  risk_profile: RiskProfile;
  terminals: Terminal[];
  peaks: {
    all_time: number;
    daily: number;
  };
  drawdown: {
    all_time_pct: number;
    daily_pct: number;
  };
}

export interface RiskEvent {
  id: string;
  account_number: string;
  trigger_type: "daily_drawdown" | "max_drawdown" | "custom_rule";
  threshold: number;
  actual_value: number;
  equity_at_event: number;
  peak_at_event: number;
  kill_signal_sent: boolean;
  kill_confirmed: boolean;
  created_at: string;
}

export interface DashboardData {
  accounts: Account[];
  recent_events: RiskEvent[];
  summary: {
    total_accounts: number;
    active_terminals: number;
    breached_today: number;
    warnings: number;
  };
}

const FALLBACK_PROPSENTINEL_DATA: DashboardData = {
  summary: {
    total_accounts: 4,
    active_terminals: 4,
    breached_today: 0,
    warnings: 1,
  },
  accounts: [
    {
      id: "acc-ftmo-100k",
      account_number: "8829104",
      broker_name: "FTMO Global Markets",
      platform: "mt5",
      currency: "USD",
      label: "FTMO Challenge $100K",
      status: "active",
      portfolio: {
        equity: 104520.50,
        balance: 102300.00,
        margin: 2150.00,
        free_margin: 102370.50,
        floating_pl: 2220.50,
        open_positions: 2,
        margin_level_pct: 4861.4,
      },
      risk_profile: {
        daily_drawdown_pct: 5.0,
        max_drawdown_pct: 10.0,
        daily_drawdown_abs: 5000,
        max_drawdown_abs: 10000,
      },
      terminals: [
        {
          terminal_id: "term-vps-london-01",
          platform: "mt5",
          last_heartbeat: new Date().toISOString(),
          is_active: true,
        },
      ],
      peaks: {
        all_time: 105100.00,
        daily: 104800.00,
      },
      drawdown: {
        all_time_pct: 0.55,
        daily_pct: 0.27,
      },
    },
    {
      id: "acc-fundednext-200k",
      account_number: "9940125",
      broker_name: "FundedNext Execution",
      platform: "mt5",
      currency: "USD",
      label: "FundedNext Stellar $200K",
      status: "warning",
      portfolio: {
        equity: 193400.00,
        balance: 198000.00,
        margin: 6400.00,
        free_margin: 187000.00,
        floating_pl: -4600.00,
        open_positions: 4,
        margin_level_pct: 3021.8,
      },
      risk_profile: {
        daily_drawdown_pct: 5.0,
        max_drawdown_pct: 10.0,
        daily_drawdown_abs: 10000,
        max_drawdown_abs: 20000,
      },
      terminals: [
        {
          terminal_id: "term-vps-ny-02",
          platform: "mt5",
          last_heartbeat: new Date().toISOString(),
          is_active: true,
        },
      ],
      peaks: {
        all_time: 200500.00,
        daily: 199200.00,
      },
      drawdown: {
        all_time_pct: 3.54,
        daily_pct: 2.91,
      },
    },
    {
      id: "acc-alphacap-50k",
      account_number: "7718290",
      broker_name: "Alpha Capital Group",
      platform: "mt5",
      currency: "USD",
      label: "Alpha Pro $50K Scalper",
      status: "active",
      portfolio: {
        equity: 52180.00,
        balance: 51900.00,
        margin: 1100.00,
        free_margin: 51080.00,
        floating_pl: 280.00,
        open_positions: 1,
        margin_level_pct: 4743.6,
      },
      risk_profile: {
        daily_drawdown_pct: 4.0,
        max_drawdown_pct: 8.0,
        daily_drawdown_abs: 2000,
        max_drawdown_abs: 4000,
      },
      terminals: [
        {
          terminal_id: "term-vps-sg-01",
          platform: "mt5",
          last_heartbeat: new Date().toISOString(),
          is_active: true,
        },
      ],
      peaks: {
        all_time: 52400.00,
        daily: 52200.00,
      },
      drawdown: {
        all_time_pct: 0.42,
        daily_pct: 0.04,
      },
    },
    {
      id: "acc-topstep-150k",
      account_number: "6639102",
      broker_name: "TopStep Futures Brokerage",
      platform: "mt5",
      currency: "USD",
      label: "TopStep Futures $150K",
      status: "active",
      portfolio: {
        equity: 154800.00,
        balance: 153200.00,
        margin: 4500.00,
        free_margin: 150300.00,
        floating_pl: 1600.00,
        open_positions: 3,
        margin_level_pct: 3440.0,
      },
      risk_profile: {
        daily_drawdown_pct: 3.0,
        max_drawdown_pct: 6.0,
        daily_drawdown_abs: 4500,
        max_drawdown_abs: 9000,
      },
      terminals: [
        {
          terminal_id: "term-vps-frankfurt-01",
          platform: "mt5",
          last_heartbeat: new Date().toISOString(),
          is_active: true,
        },
      ],
      peaks: {
        all_time: 155000.00,
        daily: 154900.00,
      },
      drawdown: {
        all_time_pct: 0.13,
        daily_pct: 0.06,
      },
    },
  ],
  recent_events: [
    {
      id: "evt-dd-warn-1",
      account_number: "9940125",
      trigger_type: "daily_drawdown",
      threshold: 3000,
      actual_value: 4600,
      equity_at_event: 193400.00,
      peak_at_event: 199200.00,
      kill_signal_sent: false,
      kill_confirmed: false,
      created_at: new Date(Date.now() - 420000).toISOString(),
    },
  ],
};

const API_BASE = process.env.NEXT_PUBLIC_PROPSENTINEL_URL ?? "http://localhost:8100";

/**
 * Fetch initial state via SSR. 
 * STRICT RULE: Do NOT use revalidate polling here. 
 * Real-time updates must be handled via WebSocket on the client.
 */
export async function fetchPropsentinelDashboard(): Promise<DashboardData> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/dashboard`, {
      cache: "no-store", // Always fetch fresh on full reload
    });

    if (!res.ok) {
      return FALLBACK_PROPSENTINEL_DATA;
    }

    return (await res.json()) as DashboardData;
  } catch {
    return FALLBACK_PROPSENTINEL_DATA;
  }
}

