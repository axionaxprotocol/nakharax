import { Card } from "@/components/card";
import { DEFAULT_NODES, getNodeStatus, getKadRoutingTable, KadPeer } from "@/lib/rpc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NodesPage() {
  const statuses = await Promise.all(
    DEFAULT_NODES.map(async (ep) => {
      const status = await getNodeStatus(ep);
      let routingTable: KadPeer[] | null = null;
      if (status.online) {
        const r = await getKadRoutingTable(ep.url);
        if (r.ok) {
          routingTable = r.data;
        }
      }
      return { ...status, routingTable };
    })
  );
  return (
    <div className="space-y-os-8">
      <header className="border-b border-border pb-os-4">
        <h1 className="text-headline font-mono font-semibold tracking-tight text-zinc-100 uppercase">NETWORK_NODES</h1>
        <p className="text-body font-mono text-zinc-500 mt-os-2 max-w-xl uppercase tracking-wider">
          Remote and local Nakhara peers monitored by this OS.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-os-4">
        {statuses.map((s) => (
          <Card key={s.endpoint.id} className="group">
            <div className="flex items-start justify-between mb-os-4">
              <div>
                <div className="font-semibold text-title text-zinc-100">{s.endpoint.name}</div>
                <div className="font-mono text-caption text-zinc-500 mt-0.5">
                  {s.endpoint.url}
                </div>
              </div>
              <span
                className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-os-sm border ${
                  s.online
                    ? "bg-accent-ok/10 text-accent-ok border-accent-ok/20"
                    : "bg-accent-danger/10 text-accent-danger border-accent-danger/20"
                }`}
              >
                {s.online ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-os-3 text-sm">
              <Field label="Block" value={s.blockNumber?.toLocaleString() ?? "—"} />
              <Field label="Peers" value={s.peerCount ?? "—"} />
              <Field label="Chain ID" value={s.chainId ?? "—"} />
              <Field label="Latency" value={s.latencyMs ? `${s.latencyMs}ms` : "—"} />
            </dl>
            {s.error && (
              <div className="mt-os-4 rounded-os-sm bg-accent-danger/10 border border-accent-danger/20 text-accent-danger px-os-3 py-os-2 text-caption font-mono break-words">
                ERR: {s.error}
              </div>
            )}

            {s.online && s.routingTable !== null && (
              <div className="mt-os-6 pt-os-4 border-t border-border">
                <div className="flex items-center justify-between mb-os-2">
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    KADEMLIA_DHT_ROUTING_TABLE
                  </h3>
                  <span className="font-mono text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-os-sm border border-border">
                    {s.routingTable.length} PEERS
                  </span>
                </div>
                {s.routingTable.length === 0 ? (
                  <p className="font-mono text-caption text-zinc-500 uppercase tracking-wide mt-os-2">
                    No peers discovered in routing table.
                  </p>
                ) : (
                  <div className="space-y-os-2 mt-os-2 max-h-48 overflow-y-auto pr-os-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {s.routingTable.map((peer) => (
                      <div
                        key={peer.peer_id}
                        className="bg-bg-elev border border-border rounded-os-sm p-os-2 hover:border-zinc-700 transition-colors"
                      >
                        <div className="font-mono text-caption text-zinc-300 truncate" title={peer.peer_id}>
                          <span className="text-zinc-500 font-semibold mr-1">PEER:</span>
                          <span className="text-accent-ok font-semibold">{peer.peer_id}</span>
                        </div>
                        {peer.addresses.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {peer.addresses.map((addr) => (
                              <li
                                key={addr}
                                className="font-mono text-[10px] text-zinc-500 truncate pl-os-3 relative before:content-['·'] before:absolute before:left-1 before:text-zinc-700"
                                title={addr}
                              >
                                {addr}
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

            {s.online && s.routingTable === null && (
              <div className="mt-os-6 pt-os-4 border-t border-border">
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-os-2">
                  KADEMLIA_DHT_ROUTING_TABLE
                </h3>
                <p className="font-mono text-caption text-zinc-500 uppercase tracking-wide">
                  DHT query not supported on this endpoint.
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-bg-elev border border-border rounded-os-sm p-os-2">
      <dt className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1">{label}</dt>
      <dd className="font-mono text-body font-medium text-zinc-200">{value}</dd>
    </div>
  );
}
