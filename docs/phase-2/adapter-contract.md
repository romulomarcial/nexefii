Adapter Contract - Nexefii Lock Adapter

Overview

This contract describes the interface between the Nexefii Edge Gateway and vendor-specific lock adapters. The adapter translates generic Lock Service commands into vendor-specific protocols.

1. Transport and Security
- Protocol: MQTT (preferred) or local TCP for direct hardware.
- TLS: mTLS between Edge Gateway and Cloud; adapter must support TLS where applicable.

2. Adapter Responsibilities
- Map generic commands (unlock, lock, create_key, revoke_key) into lock-specific frames.
- Provide acknowledgements and error codes.
- Expose local health and firmware status for monitoring.

3. Message Schema (MQTT topics)
- Commands: `nexefii/<propertyId>/locks/<lockId>/command`
  - Payload (JSON): `{ "requestId": "..., "command": "unlock", "params": { ... }, "requestedBy": { "actorId": "..." } }`
- Events: `nexefii/<propertyId>/locks/<lockId>/events`
  - Payload (JSON): `{ "eventId": "...", "type": "unlock_success", "timestamp": "...", "details": {...} }`

4. Error Codes
- 1000: Adapter internal error
- 1100: Lock unreachable
- 1200: Command rejected (policy)
- 1300: Invalid parameters

5. Firmware and OTA
- Adapter must support a safe OTA handshake initiated by the Cloud via Edge Gateway.

6. Time & Scheduling
- Adapter must accept ISO-8601 timestamps and timezone-aware schedules.

7. Testing & Simulation
- Adapter must support a simulation mode for pilot testing which returns deterministic responses.

