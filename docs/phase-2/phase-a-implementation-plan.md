Phase A Implementation Plan (6-8 weeks)

Goal: Implement core Lock Service, Edge Gateway adapter, Door Lock Wizard, and a pilot-ready Edge image.

Weeks 1-2: Foundations
- Project setup and CI: repo layout, Dockerfiles for cloud services and edge image, linting, and basic CI pipelines.
- Implement Lock Service REST API (skeleton) and data model for locks and keys.
- Implement basic authentication (JWT) and RBAC for admin/staff.

Weeks 3-4: Edge + Adapter
- Implement Edge Gateway skeleton (Node service) with MQTT broker configuration.
- Implement vendor adapter shim (simulation mode) that supports lock commands and events.
- Implement the messaging layer in Lock Service to publish commands to Edge via MQTT.

Weeks 5: Door Lock Wizard & UI
- Integrate Door Lock Wizard (frontend) with Lock Service endpoints.
- Implement client-side validation and translations.
- Add developer-mode mock UI for testing without hardware.

Week 6: Pilot packaging & testing
- Build Edge image, sign, and prepare deployment guide.
- End-to-end tests: create key, revoke key, unlock flow, offline edge operation and replay.
- Prepare runbook for pilot deployment and rollback procedures.

Owners & Roles
- Backend Lead: Lock Service, OpenAPI, DB models
- Edge Lead: Edge Gateway, adapter shim, OTA support
- Frontend Lead: Door Lock Wizard, translations, accessibility
- QA: Integration tests, pilot acceptance tests

Success Criteria
- End-to-end key create -> delivery -> unlock (simulated) in CI.
- Edge can operate for at least 30 minutes offline with queued events replay.
- Pilot deployment checklist and signed Edge image ready.

