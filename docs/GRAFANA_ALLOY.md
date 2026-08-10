# Grafana Alloy monitoring

The app exposes Prometheus metrics at `GET /api/metrics`. The Alloy configuration in `monitoring/config.alloy` scrapes that endpoint and forwards metrics to Grafana Cloud using the API token and hosted metrics ID.

## Required host variables

Set these on the host running the BankChase server:

- `GRAFANA_CLOUD_API_TOKEN`: Grafana token with `set:alloy-data-write`.
- `GCLOUD_HOSTED_METRICS_ID`: Grafana Cloud hosted metrics instance ID.
- `GRAFANA_CLOUD_PROMETHEUS_URL`: Grafana Cloud Prometheus remote-write endpoint, including `/api/prom/push`.

Optional variables:

- `BANKCHASE_METRICS_TARGET`: metrics target, default `127.0.0.1:3000`.
- `GRAFANA_SERVICE_NAME`: service label, default `bankchase`.
- `COREDNS_METRICS_TARGET`: CoreDNS Prometheus target, default `127.0.0.1:9153`.
- `COREDNS_CLUSTER`: CoreDNS cluster label, default `cloud`.

CoreDNS must be version 1.7.0 or newer with both the Prometheus and cache plugins enabled. The Alloy config keeps the standard CoreDNS integration metrics and forwards them through the same Grafana Cloud remote-write endpoint as BankChase.

## Install

From the project directory on the host, after installing Grafana Alloy from Grafana's official package repository:

```bash
sudo -E ./scripts/install-alloy.sh
```

The script creates a systemd service named `bankchase-alloy`, stores credentials in `/etc/alloy/bankchase.env` with mode `0600`, and enables the service at boot. Never commit tokens or place them in `NEXT_PUBLIC_*` variables.

The Vercel preview/deployment sandbox cannot install host-level systemd services. For Vercel deployments, run Alloy on a separate host or use Grafana Cloud's supported application telemetry path; the endpoint remains safe when Alloy is absent.
