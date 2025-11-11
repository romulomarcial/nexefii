// PMS Integrations Hooks
// Provides simple stubs to integrate with external systems like iPrimeX

class PMSIntegrations {
  constructor(propertyKey = 'property_default') {
    this.propertyKey = propertyKey;
  }

  // Generic trigger
  trigger(event, payload = {}) {
    console.log(`[Integrations] Event: ${event}`, payload);
    // TODO: Implement real integrations here (HTTP/WebSocket/MQTT)
    return { success: true, event, timestamp: Date.now() };
  }

  // Convenience helpers
  onCheckIn(reservation) {
    // Example: Enable power/HVAC for assigned room
    const room = reservation.roomNumber || 'N/A';
    return this.trigger('check_in', {
      propertyKey: this.propertyKey,
      room,
      guestName: reservation.guestName,
      reservationId: reservation.id,
      confirmationNumber: reservation.confirmationNumber,
      action: 'enable_room_devices'
    });
  }

  onCheckOut(reservation) {
    const room = reservation.roomNumber || 'N/A';
    return this.trigger('check_out', {
      propertyKey: this.propertyKey,
      room,
      guestName: reservation.guestName,
      reservationId: reservation.id,
      confirmationNumber: reservation.confirmationNumber,
      action: 'disable_room_devices'
    });
  }

  onIssueKey(reservation, keyInfo) {
    return this.trigger('issue_key', {
      propertyKey: this.propertyKey,
      room: reservation.roomNumber || null,
      reservationId: reservation.id,
      keyInfo
    });
  }
}

window.PMSIntegrations = PMSIntegrations;
console.log('[PMS] Integrations hooks loaded');
