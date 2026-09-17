/**
 * RouteOptimizationService.js
 * Giải bài toán định tuyến xe thu gom rác có ràng buộc (VRP - Vehicle Routing Problem)
 * - Ràng buộc sức chứa xe (Capacitated Vehicle Routing - CVRP)
 * - Tối ưu hóa thứ tự ghé thăm bằng thuật toán 2-Opt TSP Heuristic Local Search
 * - So sánh đối chứng Quãng đường chưa tối ưu (Naive) vs Đã tối ưu (2-Opt)
 * - Tính toán lượng nhiên liệu & khí thải CO2 tiết kiệm được
 * - Tích hợp mạng lưới đường bộ thực tế (Road Network Geometry qua RoadRoutingService)
 * - Ràng buộc thời gian ca & ETA cho từng điểm
 * - Loại trừ các hộ gia đình bị tạm ngừng nợ phí (Dev 3 - Trang 10)
 * - Kết thúc lộ trình tại Trạm dỡ rác / Bãi trung chuyển rác (Trang 05)
 * - Tái lập tuyến khi xe hỏng/từ chối việc: Chỉ lập lại cho các điểm chưa thu gom (Trang 03)
 */

import { roadRoutingService } from './RoadRoutingService.js';

export class RouteOptimizationService {
  /**
   * Tính khoảng cách đường chim bay (Haversine) giữa 2 tọa độ (Km)
   */
  static calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính Trái Đất (Km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Ước tính khoảng cách đường bộ trong đô thị (hệ số uốn lượn tortuosity ~1.32x so với đường chim bay)
   */
  static estimateUrbanRoadDistanceKm(lat1, lon1, lat2, lon2) {
    return this.calculateDistanceKm(lat1, lon1, lat2, lon2) * 1.32;
  }

  /**
   * Ước tính thời gian di chuyển (phút) dựa trên khoảng cách và vận tốc trung bình đô thị
   * @param {number} distanceKm
   * @param {number} avgSpeedKmh - Mặc định 25 km/h trong nội thành
   */
  static estimateTravelTimeMinutes(distanceKm, avgSpeedKmh = 25) {
    if (distanceKm <= 0) return 0;
    return Math.round((distanceKm / avgSpeedKmh) * 60);
  }

  /**
   * Lọc danh sách phiếu hợp lệ để lập tuyến:
   * 1. Loại trừ các hộ đang bị TẠM NGỪNG DO NỢ PHÍ (từ Dev 3 - Trang 10)
   * 2. Bắt buộc giữ nghĩa vụ phục vụ với điểm có lịch vệ sinh định kỳ (Trang 06)
   */
  static filterEligibleTickets(tickets, householdStatuses = {}) {
    return tickets.filter((ticket) => {
      // Nếu là điểm có lịch vệ sinh bắt buộc thì không được tự ý bỏ qua (Trang 06)
      if (ticket.type === 'SCHEDULED_COLLECTION') {
        return true;
      }

      // Kiểm tra trạng thái hợp đồng nếu có thông tin hộ
      if (ticket.householdId && householdStatuses[ticket.householdId]) {
        const householdInfo = householdStatuses[ticket.householdId];
        if (householdInfo.serviceActive === false) {
          // Bỏ qua lượt thu gom theo quy tắc Trang 10
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Tính tổng quãng đường của một tour dừng (Start -> Stop 0 -> Stop 1 -> ... -> Stop n -> End)
   */
  static calculateTourDistance(startPoint, stops, endPoint) {
    if (!stops || stops.length === 0) {
      return this.calculateDistanceKm(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng);
    }

    let total = this.calculateDistanceKm(
      startPoint.lat,
      startPoint.lng,
      stops[0].lat,
      stops[0].lng,
    );
    for (let i = 0; i < stops.length - 1; i++) {
      total += this.calculateDistanceKm(
        stops[i].lat,
        stops[i].lng,
        stops[i + 1].lat,
        stops[i + 1].lng,
      );
    }
    total += this.calculateDistanceKm(
      stops[stops.length - 1].lat,
      stops[stops.length - 1].lng,
      endPoint.lat,
      endPoint.lng,
    );
    return total;
  }

  /**
   * Thuật toán 2-Opt Local Search Heuristic cho Bài toán Người du lịch (TSP)
   * Giúp gỡ các cung đường chéo đan xen nhau (untangle crossing paths) để tìm chu trình ngắn nhất
   * @param {Array<Object>} stops - Danh sách điểm dừng ban đầu
   * @param {Object} startPoint - Điểm xuất phát của xe { lat, lng }
   * @param {Object} endPoint - Trạm dỡ rác Depot { lat, lng }
   * @returns {Object} Kết quả sau tối ưu 2-Opt
   */
  static run2OptOptimization(stops, startPoint, endPoint) {
    if (!stops || stops.length <= 1) {
      const dist = this.calculateTourDistance(startPoint, stops || [], endPoint);
      return {
        optimizedStops: stops ? [...stops] : [],
        naiveDistanceKm: Math.round(dist * 100) / 100,
        optimizedDistanceKm: Math.round(dist * 100) / 100,
        distanceSavedKm: 0,
        savingsPercent: 0,
        co2SavedKg: 0,
        iterations: 0,
      };
    }

    const naiveDistance = this.calculateTourDistance(startPoint, stops, endPoint);
    let bestTour = [...stops];
    let bestDistance = naiveDistance;
    let improved = true;
    let iterations = 0;
    const maxIterations = 80;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations += 1;

      for (let i = 0; i < bestTour.length - 1; i++) {
        for (let k = i + 1; k < bestTour.length; k++) {
          // Tạo tour mới bằng cách đảo ngược chuỗi con từ i đến k (2-Opt Swap)
          const newTour = [
            ...bestTour.slice(0, i),
            ...bestTour.slice(i, k + 1).reverse(),
            ...bestTour.slice(k + 1),
          ];

          const newDistance = this.calculateTourDistance(startPoint, newTour, endPoint);

          // Nếu phát hiện quãng đường ngắn hơn (giảm tối thiểu 10 mét)
          if (newDistance < bestDistance - 0.01) {
            bestTour = newTour;
            bestDistance = newDistance;
            improved = true;
            break; // Greedy step
          }
        }
        if (improved) break;
      }
    }

    const distanceSavedKm = Math.max(0, naiveDistance - bestDistance);
    const savingsPercent =
      naiveDistance > 0 ? Math.round((distanceSavedKm / naiveDistance) * 1000) / 10 : 0;
    // Hệ số môi trường: 1 km xe tải rác tiêu thụ ~0.12L diesel và thải ra ~0.26 kg CO2
    const co2SavedKg = Math.round(distanceSavedKm * 0.26 * 100) / 100;
    const fuelSavedLiters = Math.round(distanceSavedKm * 0.12 * 100) / 100;

    return {
      optimizedStops: bestTour,
      naiveDistanceKm: Math.round(naiveDistance * 100) / 100,
      optimizedDistanceKm: Math.round(bestDistance * 100) / 100,
      distanceSavedKm: Math.round(distanceSavedKm * 100) / 100,
      savingsPercent,
      co2SavedKg,
      fuelSavedLiters,
      iterations,
    };
  }

  /**
   * Tối ưu hóa tuyến đường đa phương tiện có ràng buộc sức chứa (CVRP + 2-Opt)
   * Đồng bộ & Bất đồng bộ với làm giàu dữ liệu hình học đường phố thực tế (Road Geometry)
   */
  static optimizeRoutes({
    tickets,
    vehicles,
    householdStatuses = {},
    unloadingStation = {
      name: 'Trạm trung chuyển rác Đa Phước',
      lat: 10.6698,
      lng: 106.6631,
    },
    unloadingStations = null,
    serviceMinutesPerStop = 8,
  }) {
    const eligibleTickets = this.filterEligibleTickets(tickets, householdStatuses);
    const unassignedTickets = [...eligibleTickets];
    const vehicleRoutes = [];

    let totalNaiveDistanceAll = 0;
    let totalOptimizedDistanceAll = 0;

    // 1. Phân bổ cân bằng đa xe (Balanced Multi-Vehicle Workload Allocation)
    // Áp dụng thuật toán Round-Robin Nearest Clustering để chia đều thùng rác cho toàn bộ đội xe,
    // đảm bảo không có xe nào bị quá tải trong khi các xe khác rảnh rỗi.
    const vehicleAssignments = vehicles.map((v) => ({
      vehicle: v,
      remainingCapacity: Math.max(0, (v.maxCapacityKg || 2500) - (v.currentCapacityKg || 0)),
      currentWeight: 0,
      stops: [],
      lastLat: v.lat || 10.7769,
      lastLng: v.lng || 106.7009,
    }));

    let assignedInRound = true;
    while (unassignedTickets.length > 0 && assignedInRound) {
      assignedInRound = false;

      for (const va of vehicleAssignments) {
        if (unassignedTickets.length === 0) break;

        let nearestIdx = -1;
        let minDistance = Infinity;

        for (let i = 0; i < unassignedTickets.length; i++) {
          const candidate = unassignedTickets[i];
          const candidateWeight = candidate.estimatedKg || 25;

          if (va.currentWeight + candidateWeight <= va.remainingCapacity) {
            const dist = this.calculateDistanceKm(
              va.lastLat,
              va.lastLng,
              candidate.lat,
              candidate.lng,
            );
            if (dist < minDistance) {
              minDistance = dist;
              nearestIdx = i;
            }
          }
        }

        if (nearestIdx !== -1) {
          const selected = unassignedTickets.splice(nearestIdx, 1)[0];
          va.stops.push(selected);
          va.currentWeight += selected.estimatedKg || 25;
          va.lastLat = selected.lat;
          va.lastLng = selected.lng;
          assignedInRound = true;
        }
      }
    }

    // 2. Tối ưu thứ tự ghé thăm từng xe bằng 2-Opt Local Search và tính toán ETA
    for (const va of vehicleAssignments) {
      if (va.stops.length === 0) continue;

      const vehicle = va.vehicle;
      const vehicleStart = {
        lat: vehicle.lat || 10.7769,
        lng: vehicle.lng || 106.7009,
      };

      // Chọn trạm dỡ rác gần nhất cho xe này (Nearest Depot)
      let stationForVehicle = unloadingStation;
      if (Array.isArray(unloadingStations) && unloadingStations.length > 0) {
        const referencePoint = va.stops[va.stops.length - 1] || vehicleStart;
        let minStationDist = Infinity;
        for (const st of unloadingStations) {
          const d = this.calculateDistanceKm(
            referencePoint.lat,
            referencePoint.lng,
            st.lat,
            st.lng,
          );
          if (d < minStationDist) {
            minStationDist = d;
            stationForVehicle = st;
          }
        }
      }

      const twoOptResult = this.run2OptOptimization(va.stops, vehicleStart, stationForVehicle);

      totalNaiveDistanceAll += twoOptResult.naiveDistanceKm;
      totalOptimizedDistanceAll += twoOptResult.optimizedDistanceKm;

      // 3. Tính toán ETA và khoảng cách chi tiết từng chặng sau khi đã tối ưu
      let runningLat = vehicleStart.lat;
      let runningLng = vehicleStart.lng;
      let cumulativeMins = 0;

      const formattedStops = twoOptResult.optimizedStops.map((stop, idx) => {
        const legDist = this.calculateDistanceKm(runningLat, runningLng, stop.lat, stop.lng);
        const travelMins = this.estimateTravelTimeMinutes(legDist);
        cumulativeMins += travelMins;

        const etaDate = new Date(Date.now() + cumulativeMins * 60 * 1000);
        cumulativeMins += serviceMinutesPerStop;

        runningLat = stop.lat;
        runningLng = stop.lng;

        return {
          stopIndex: idx + 1,
          ticketId: stop.id,
          binId: stop.binId,
          householdId: stop.householdId,
          address: stop.address,
          lat: stop.lat,
          lng: stop.lng,
          estimatedKg: stop.estimatedKg || 25,
          distanceFromPrevKm: Math.round(legDist * 100) / 100,
          travelTimeMinutes: travelMins,
          eta: etaDate.toISOString(),
          status: 'PENDING',
        };
      });

      // Chặng cuối: Di chuyển về Trạm dỡ rác Depot
      const distToUnloading = this.calculateDistanceKm(
        runningLat,
        runningLng,
        stationForVehicle.lat,
        stationForVehicle.lng,
      );
      const travelToUnloadingMins = this.estimateTravelTimeMinutes(distToUnloading);
      cumulativeMins += travelToUnloadingMins;

      const finishEta = new Date(Date.now() + cumulativeMins * 60 * 1000);

      vehicleRoutes.push({
        vehicleId: vehicle.vehicleId,
        driverId: vehicle.driverId || 'Chưa phân công',
        driverName: vehicle.driverName || vehicle.driverId || 'Tài xế chính',
        startLocation: { lat: vehicleStart.lat, lng: vehicleStart.lng },
        targetDepotId: stationForVehicle.id || null,
        targetDepotName: stationForVehicle.name || null,
        totalStops: formattedStops.length,
        totalWeightKg: va.currentWeight,
        capacityUsagePercent: Math.round((va.currentWeight / (va.remainingCapacity || 1)) * 100),
        naiveDistanceKm: twoOptResult.naiveDistanceKm,
        totalDistanceKm: twoOptResult.optimizedDistanceKm,
        distanceSavedKm: twoOptResult.distanceSavedKm,
        savingsPercent: twoOptResult.savingsPercent,
        co2SavedKg: twoOptResult.co2SavedKg,
        fuelSavedLiters: twoOptResult.fuelSavedLiters,
        estimatedDurationMinutes: cumulativeMins,
        expectedFinishTime: finishEta.toISOString(),
        stops: formattedStops,
        unloadingStation: {
          ...stationForVehicle,
          distanceFromLastStopKm: Math.round(distToUnloading * 100) / 100,
          eta: finishEta.toISOString(),
        },
      });
    }

    const version = `PLAN-2OPT-V${Date.now()}`;
    const totalDistanceSavedAll = Math.max(0, totalNaiveDistanceAll - totalOptimizedDistanceAll);
    const overallSavingsPercent =
      totalNaiveDistanceAll > 0
        ? Math.round((totalDistanceSavedAll / totalNaiveDistanceAll) * 1000) / 10
        : 0;

    return {
      version,
      generatedAt: new Date().toISOString(),
      algorithm: 'CVRP (Capacitated VRP) + 2-Opt TSP Heuristic Local Search',
      totalEligibleTickets: eligibleTickets.length,
      assignedStopsCount: vehicleRoutes.reduce((sum, r) => sum + r.totalStops, 0),
      unassignedTicketsCount: unassignedTickets.length,
      unassignedTickets,
      metrics: {
        totalNaiveDistanceKm: Math.round(totalNaiveDistanceAll * 100) / 100,
        totalOptimizedDistanceKm: Math.round(totalOptimizedDistanceAll * 100) / 100,
        totalDistanceSavedKm: Math.round(totalDistanceSavedAll * 100) / 100,
        overallSavingsPercent,
        totalCo2SavedKg: Math.round(totalDistanceSavedAll * 0.26 * 100) / 100,
        totalFuelSavedLiters: Math.round(totalDistanceSavedAll * 0.12 * 100) / 100,
      },
      vehicleRoutes,
    };
  }

  /**
   * Bổ sung tọa độ đa giác đường thực tế (OSRM Road Coordinates) cho toàn bộ kế hoạch
   * Giúp bản đồ vẽ lộ trình uốn lượn chính xác theo các cung đường
   */
  static async enrichPlanWithRoadGeometry(plan) {
    if (!plan || !plan.vehicleRoutes) return plan;

    const enrichedRoutes = await Promise.all(
      plan.vehicleRoutes.map(async (route) => {
        const waypoints = [];
        if (route.startLocation) {
          waypoints.push([route.startLocation.lng, route.startLocation.lat]);
        }
        if (route.stops.length > 0) {
          route.stops.forEach((s) => waypoints.push([s.lng, s.lat]));
          if (route.unloadingStation) {
            waypoints.push([route.unloadingStation.lng, route.unloadingStation.lat]);
          }
        }

        if (waypoints.length >= 2) {
          const roadData = await roadRoutingService.fetchMultiStopRoute(waypoints);

          // Pre-cache từng chặng riêng biệt để xe di chuyển và bản đồ vẽ luôn chuẩn đường bộ 100%
          for (let i = 0; i < waypoints.length - 1; i++) {
            await roadRoutingService.fetchRoadCoordinates(
              waypoints[i][0],
              waypoints[i][1],
              waypoints[i + 1][0],
              waypoints[i + 1][1],
            );
          }

          return {
            ...route,
            roadGeometry: roadData.coordinates,
            actualRoadDistanceKm: roadData.distanceKm,
            isRoadSnapped: roadData.isRoadSnapped,
          };
        }

        return { ...route, roadGeometry: [], isRoadSnapped: false };
      }),
    );

    return {
      ...plan,
      vehicleRoutes: enrichedRoutes,
    };
  }

  /**
   * Xử lý sự cố giữa chừng (Trang 03 PDF):
   * Khi xe hỏng hoặc tài xế từ chối việc: Chỉ lập lại lộ trình cho phần điểm chưa thực hiện,
   * giữ nguyên kết quả các điểm đã nghiệm thu xong.
   */
  static reoptimizeRemainingRoute(
    originalVehicleRoute,
    completedTicketIds = [],
    replacementVehicle,
  ) {
    const remainingStops = originalVehicleRoute.stops.filter(
      (s) => !completedTicketIds.includes(s.ticketId),
    );

    if (remainingStops.length === 0) {
      return null;
    }

    const remainingTickets = remainingStops.map((s) => ({
      id: s.ticketId,
      binId: s.binId,
      householdId: s.householdId,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      estimatedKg: s.estimatedKg,
    }));

    return this.optimizeRoutes({
      tickets: remainingTickets,
      vehicles: [replacementVehicle],
      unloadingStation: originalVehicleRoute.unloadingStation,
    });
  }
}
