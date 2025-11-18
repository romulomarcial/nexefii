// Read `propertyId` from the query string and set it as active property (best-effort)
(function(){
  try {
    const params = new URLSearchParams(location.search);
    const pid = params.get('propertyKey') || params.get('propertyId') || params.get('propId') || params.get('property');
    if (!pid) return;
    // Persist for SessionContext consumers
    try { localStorage.setItem('nexefii_active_property', pid); } catch(e){}
    if (window.SessionContext && typeof window.SessionContext.setActiveProperty === 'function') {
      try { window.SessionContext.setActiveProperty(pid); } catch(e){}
    }
    window.NEXEFII = window.NEXEFII || {};
    window.NEXEFII.activePropertyFromQuery = pid;
    console.log('[Init] Active property set from query:', pid);
  } catch(e) { /* silent */ }
})();
