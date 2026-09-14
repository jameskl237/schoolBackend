import { DashboardRepository } from "./dashboard.repository.js";

export class DashboardService {
  constructor(private readonly dashboardRepository = new DashboardRepository()) {}

  async getStats(establishmentId: number) {
    const [stats, usersByRole] = await Promise.all([
      this.dashboardRepository.getStats(establishmentId),
      this.dashboardRepository.getUserCountByRole(establishmentId),
    ]);

    return { ...stats, usersByRole };
  }
}
