import {
  Network,
  RadioTower,
  Server,
  ShieldCheck,
  Timer,
} from "lucide-react";

import {
  Card,
  DataRow,
  IconBadge,
  PageShell,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/card";
import {
  DEFAULT_NODES,
  getKadRoutingTable,
  getNodeStatus,
  type KadPeer,
} from "@/lib/rpc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NodesPage() {
  const statuses = await Promise.all(
    DEFAULT_NODES.map(async (endpoint) => {
      const status = await getNodeStatus(endpoint);
      let routingTable: KadPeer[] | null = null;
      if (status.online) {
        const result = await getKadRoutingTable(endpoint.url);
        if (result.ok) {
          routingTable = result.data;
        }
      }
      return { ...status, routingTable };
    }),
  );

  const online = statuses.filter((status) => status.online).length;
  const peers = statuses.reduce((sum, status) => sum + (status.peerCount ?? 0), 0);
  const fastest = statuses
    .filter((status) => status.online && status.latencyMs)
    .reduce<number | null>(
      (best, status) => {
        const latency = status.latencyMs ?? null;
        if (latency == null) return best;
        return best == null ? latency : Math.min(best, latency);
      },
      null,
    );

  return (
    <PageShell
      eyebrow="Node Mesh"
      title="Operate the compute network from real endpoints."
      description="Node health is the credibility layer: if gateways, peers, or DHT routing are weak, compute marketplace promises do not matter."
      meta={
        <>
          <StatusPill tone={online > 0 ? "ai" : "danger"} pulse={online > 0}>
            {online}/{statuses.length} online
          </StatusPill>
          <StatusPill tone="chain">{peers} peers</StatusPill>
        </>
      }
    >
      <div className="grid gap-os-4 md:grid-cols-3">
        <StatCard
          label="Configured nodes"
          value={statuses.length}
          hint="RPC endpoints in SDK config"
          icon={<Server size={18} />}
          tone="chain"
        />
        <StatCard
          label="Reachable"
          value={online}
          hint="Responded to status probe"
          icon={<ShieldCheck size={18} />}
          tone={online > 0 ? "ai" : "danger"}
        />
        <StatCard
          label="Fastest latency"
          value={fastest == null ? "—" : `${fastest}ms`}
          hint="Best online endpoint"
          icon={<Timer size={18} />}
          tone="violet"
        />
      </div>

      <section className="space-y-os-4">
        <SectionHeader
          title="Gateways and peers"
          description="Each card shows RPC health plus DHT visibility when the endpoint supports it."
        />
        <div className="grid grid-cols-1 gap-os-4 xl:grid-cols-2">
          {statuses.map((status) => (
            <Card key={status.endpoint.id} className="space-y-os-5">
              <div className="flex items-start justify-between gap-os-4">
                <div className="flex min-w-0 items-start gap-os-3">
                  <IconBadge
                    Icon={status.online ? RadioTower : Network}
                    tone={status.online ? "ai" : "danger"}
                  />
                  <div className="min-w-0">
                    <h2 className="truncate text-title font-semibold text-[var(--text-strong)]">
                      {status.endpoint.name}
                    </h2>
                    <div className="mt-1 truncate font-mono text-caption text-[var(--text-muted)]">
                      {status.endpoint.url}
                    </div>
                  </div>
                </div>
                <StatusPill tone={status.online ? "ai" : "danger"} pulse={status.online}>
                  {status.online ? "online" : "offline"}
                </StatusPill>
              </div>

              <dl className="grid grid-cols-2 gap-os-3 sm:grid-cols-4">
                <Field label="Block" value={status.blockNumber?.toLocaleString() ?? "—"} />
                <Field label="Peers" value={status.peerCount ?? "—"} />
                <Field label="Chain ID" value={status.chainId ?? "—"} />
                <Field label="Latency" value={status.latencyMs ? `${status.latencyMs}ms` : "—"} />
              </dl>

              {status.error && (
                <div className="rounded-os-lg border border-rose-500/25 bg-rose-500/10 px-os-4 py-os-3 font-mono text-caption text-[var(--accent-danger)]">
                  {status.error}
                </div>
              )}

              {status.online && status.routingTable !== null && (
                <div className="border-t border-[var(--hair)] pt-os-4">
                  <SectionHeader
                    title="Kademlia DHT routing"
                    description={`${status.routingTable.length} peer records returned`}
                  />
                  {status.routingTable.length === 0 ? (
                    <p className="mt-os-3 text-caption text-[var(--text-muted)]">
                      No peers discovered in routing table.
                    </p>
                  ) : (
                    <div className="mt-os-3 max-h-56 space-y-os-2 overflow-y-auto pr-os-1">
                      {status.routingTable.map((peer) => (
                        <div
                          key={peer.peer_id}
                          className="rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] p-os-3"
                        >
                          <div
                            className="truncate font-mono text-caption font-semibold text-[var(--accent-ai)]"
                            title={peer.peer_id}
                          >
                            {peer.peer_id}
                          </div>
                          {peer.addresses.length > 0 && (
                            <ul className="mt-os-2 space-y-1">
                              {peer.addresses.map((address) => (
                                <li
                                  key={address}
                                  className="truncate font-mono text-[10px] text-[var(--text-muted)]"
                                  title={address}
                                >
                                  {address}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {status.online && status.routingTable === null && (
                <DataRow
                  label="DHT routing"
                  value="unsupported"
                  detail="This endpoint did not expose routing-table query support."
                />
              )}
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] p-os-3">
      <dt className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="mt-os-1 font-mono text-body font-semibold text-[var(--text-strong)]">
        {value}
      </dd>
    </div>
  );
}
