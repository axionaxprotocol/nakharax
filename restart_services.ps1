# Kill old processes on port 3030 and 8545
$ports = @(3030, 8545)
foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($conn in $conns) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    } catch {}
}

Start-Sleep -Seconds 1

# Start Mock-RPC Server in Background
Start-Process -FilePath "node" -ArgumentList "services/core/ops/deploy/mock-rpc/server.js" -WorkingDirectory "D:\nakhara-io" -WindowStyle Hidden

Start-Sleep -Seconds 2

# Start Next.js OS Dashboard
Start-Process -FilePath "pnpm" -ArgumentList "--filter", "nakharax-os-dashboard", "start" -WorkingDirectory "D:\nakhara-io" -WindowStyle Hidden

Start-Sleep -Seconds 3

Write-Host "Services restarted successfully."
