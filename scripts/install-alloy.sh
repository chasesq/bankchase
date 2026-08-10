#!/usr/bin/env bash
set -euo pipefail

: "${GRAFANA_CLOUD_API_TOKEN:?Set GRAFANA_CLOUD_API_TOKEN before installing Alloy}"
: "${GCLOUD_HOSTED_METRICS_ID:?Set GCLOUD_HOSTED_METRICS_ID before installing Alloy}"
: "${GRAFANA_CLOUD_PROMETHEUS_URL:?Set GRAFANA_CLOUD_PROMETHEUS_URL before installing Alloy}"

SERVICE_NAME="bankchase-alloy"
CONFIG_DIR="/etc/alloy"
CONFIG_PATH="${CONFIG_DIR}/config.alloy"
ENV_PATH="${CONFIG_DIR}/bankchase.env"
TARGET="${BANKCHASE_METRICS_TARGET:-127.0.0.1:3000}"
SERVICE_LABEL="${GRAFANA_SERVICE_NAME:-bankchase}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer as root on the host that runs BankChase."
  exit 1
fi

install -d -m 0750 "${CONFIG_DIR}"
install -m 0640 monitoring/config.alloy "${CONFIG_PATH}"
printf '%s\n' \
  "GRAFANA_CLOUD_API_TOKEN=${GRAFANA_CLOUD_API_TOKEN}" \
  "GCLOUD_HOSTED_METRICS_ID=${GCLOUD_HOSTED_METRICS_ID}" \
  "GRAFANA_CLOUD_PROMETHEUS_URL=${GRAFANA_CLOUD_PROMETHEUS_URL}" \
  "BANKCHASE_METRICS_TARGET=${TARGET}" \
  "GRAFANA_SERVICE_NAME=${SERVICE_LABEL}" > "${ENV_PATH}"
chmod 0600 "${ENV_PATH}"

if ! command -v alloy >/dev/null 2>&1; then
  echo "Alloy is not installed. Install Grafana Alloy using Grafana's official package repository, then rerun this script."
  exit 1
fi

cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Grafana Alloy for BankChase
After=network-online.target
Wants=network-online.target

[Service]
User=root
EnvironmentFile=${ENV_PATH}
ExecStart=$(command -v alloy) run ${CONFIG_PATH}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}.service"
systemctl --no-pager --full status "${SERVICE_NAME}.service"
