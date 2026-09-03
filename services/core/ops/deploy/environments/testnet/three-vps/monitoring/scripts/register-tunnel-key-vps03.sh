#!/usr/bin/env bash
# Register one source-node public key with only its two loopback listen ports.

set -euo pipefail

usage() {
    echo "Usage: sudo bash register-tunnel-key-vps03.sh --node vps01|vps02 --source-address IPV4_OR_CIDR --public-key-file PATH" >&2
}

if [[ ${EUID} -ne 0 ]]; then
    echo "Run as root." >&2
    exit 1
fi

NODE_NAME=""
PUBLIC_KEY_FILE=""
SOURCE_ADDRESS=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --node) NODE_NAME="${2:-}"; shift 2 ;;
        --source-address) SOURCE_ADDRESS="${2:-}"; shift 2 ;;
        --public-key-file) PUBLIC_KEY_FILE="${2:-}"; shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
    esac
done

case "${NODE_NAME}" in
    vps01) NODE_METRICS_PORT=18081; HOST_METRICS_PORT=19101 ;;
    vps02) NODE_METRICS_PORT=18082; HOST_METRICS_PORT=19102 ;;
    *) echo "--node must be vps01 or vps02" >&2; exit 1 ;;
esac
if [[ ! -r "${PUBLIC_KEY_FILE}" ]]; then
    echo "Public key file is not readable: ${PUBLIC_KEY_FILE}" >&2
    exit 1
fi
if [[ ! "${SOURCE_ADDRESS}" =~ ^[0-9A-Fa-f:.\/]+$ ]]; then
    echo "--source-address must be an IPv4, IPv6, or CIDR address without a hostname." >&2
    exit 1
fi
if ! id nakharax-monitor >/dev/null 2>&1; then
    echo "Run install-collector-vps03.sh first." >&2
    exit 1
fi

key_type="$(awk 'NF >= 2 {print $1; exit}' "${PUBLIC_KEY_FILE}")"
key_data="$(awk 'NF >= 2 {print $2; exit}' "${PUBLIC_KEY_FILE}")"
if [[ "${key_type}" != "ssh-ed25519" || -z "${key_data}" ]]; then
    echo "Only a non-empty ssh-ed25519 public key is accepted." >&2
    exit 1
fi

ssh-keygen -lf "${PUBLIC_KEY_FILE}" -E sha256 >/dev/null
home_dir="$(getent passwd nakharax-monitor | cut -d: -f6)"
ssh_dir="${home_dir}/.ssh"
authorized_keys="${ssh_dir}/authorized_keys"
install -d -o nakharax-monitor -g nakharax-monitor -m 0700 "${ssh_dir}"
touch "${authorized_keys}"
chown nakharax-monitor:nakharax-monitor "${authorized_keys}"
chmod 0600 "${authorized_keys}"

temporary_file="$(mktemp)"
trap 'rm -f "${temporary_file}"' EXIT
grep -vF "${key_data}" "${authorized_keys}" >"${temporary_file}" || true
# `restrict` disables all forwarding. Re-enable forwarding only so the two
# `permitlisten` rules can authorize this node's remote (-R) listeners. The
# source-address restriction limits a copied key to the expected VPS egress IP.
printf 'restrict,port-forwarding,command="/usr/bin/false",from="%s",permitlisten="127.0.0.1:%s",permitlisten="127.0.0.1:%s" %s %s nakharax-monitoring-%s\n' \
    "${SOURCE_ADDRESS}" "${NODE_METRICS_PORT}" "${HOST_METRICS_PORT}" "${key_type}" "${key_data}" "${NODE_NAME}" >>"${temporary_file}"
install -o nakharax-monitor -g nakharax-monitor -m 0600 "${temporary_file}" "${authorized_keys}"

echo "Registered ${NODE_NAME}; it may listen only on 127.0.0.1:${NODE_METRICS_PORT} and 127.0.0.1:${HOST_METRICS_PORT}."
