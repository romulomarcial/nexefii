Pilot Deployment Scenario

Target: 1 property (50 rooms) with Edge Gateway and simulated locks.

Objectives
- Validate edge-cloud connectivity, OTA process, lock command latency, and fallback behavior.

Architecture
- Deploy one Edge Gateway VM in property network.
- Edge subscribed to Nexefii cloud MQTT topics for that property.
- Simulated lock adapter running in container on Edge to emulate 50 locks.

Test Plan
1. Connectivity and Auth
 - Verify mTLS and token exchange between Edge and Cloud.
2. Key lifecycle
 - Create keys via Door Lock Wizard; assert messages flow Cloud→MQTT→Edge→Adapter→Event.
3. Offline resilience
 - Disconnect Edge from Cloud for 15 minutes, perform create_key locally, reconnect and assert event replay.
4. Performance
 - Measure command latency average and percentile (p50, p95).

Rollback & Safety
- Edge supports a graceful stop and rollback to previous image.
- Critical commands require idempotency and requestId to avoid duplication.

Pilot Acceptance Criteria
- 99% success for key create and unlock operations in simulation.
- No critical errors in logs for 48 hours of pilot run.

