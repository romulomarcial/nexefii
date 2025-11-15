// Mock KPI service for property dashboard
(function(global){
  function hashString(str){
    let h = 0; if(!str) return 0;
    for(let i=0;i<str.length;i++) h = ((h<<5)-h) + str.charCodeAt(i);
    return Math.abs(h);
  }

  async function getPropertyKpis(propertyId){
    // mock async
    await new Promise(r=>setTimeout(r,120));
    const h = hashString(propertyId || 'default');
    const occupancyPercent = 50 + (h % 40); // 50..89
    const roomsTotal = 100 + (h % 50);
    const roomsOccupied = Math.round(roomsTotal * occupancyPercent / 100);
    const roomsAvailable = roomsTotal - roomsOccupied;
    const reservationsNext7Days = 5 + (h % 20);
    const revenueProjection = Math.round((roomsOccupied * 100) + (h % 1000));
    const modulesStatus = {
      pms: !!(h % 2),
      housekeeping: !!((h>>1) % 2),
      engineering: !!((h>>2) % 2),
      bi: !!((h>>3) % 2)
    };
    return {
      occupancyPercent,
      roomsOccupied,
      roomsAvailable,
      reservationsNext7Days,
      revenueProjection,
      modulesStatus,
      roomsTotal
    };
  }

  global.PropertyDashboardService = { getPropertyKpis };
})(window);
