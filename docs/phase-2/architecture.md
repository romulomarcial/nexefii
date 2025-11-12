Cloud + Edge Architecture (Nexefii)

Overview

This artifact describes the architecture for Phase 2 of Nexefii focusing on secure, resilient lock management across cloud and edge. The architecture is designed for multi-tenant hospitality deployments with local autonomy and centralized management.

Components

- Guest / Staff Mobile App: OAuth2 authenticated clients used to request access and receive notifications. Connects to Cloud APIs.

- Cloud Platform (Nexefii Cloud): Centralized services including API Gateway, Lock Service (REST + webhooks), Device Manager, Messaging backbone (MQTT/AMQP), multi-tenant datastore, analytics, and monitoring. Responsible for authorization, policy, auditing, and orchestration.

- Edge Gateway (Connector): Deployed per property (VM or appliance). Provides protocol adapters (Zigbee, BLE, TCP), local MQTT broker, secure tunnel to cloud, and local control plane for low-latency operations and offline capability.

- Property Network / Devices: Door locks, access panels, kiosks, and local controllers communicating with the Edge Gateway.

Security & Resilience

- All device-cloud and edge-cloud communications use TLS with mutual auth (mTLS) where supported.
- Edge Gateways have a local queue and can operate offline, honoring cached policies and replaying events when connectivity restores.
- Audit logs are routed to the cloud for centralized analysis, with local buffering at the edge.

Data Flow

1. Mobile app requests access via Cloud API (OAuth2). Cloud validates and returns short-lived tokens.
2. Cloud issues lock commands via Device Manager; messages are routed over secure MQTT to the Edge Gateway for the target property.
3. Edge Gateway translates messages to lock-specific protocol and delivers to the door lock. Lock replies/events are sent back to Cloud for audit.
4. For low-latency operations (eg. staff unlock), Edge Gateway can accept local API requests and enforce policies locally.

Operational Notes

- Monitoring: Prometheus metrics for Edge and Cloud components. Centralized alerting for connectivity drops, repeated auth failures, or high error rates.
- Upgrades: Rolling upgrades for Edge Gateways; images signed and verified.
- Multi-tenant isolation: Data partitioning per property and strong RBAC enforced at API gateway.

References

- See `architecture.svg` for a visual diagram.
