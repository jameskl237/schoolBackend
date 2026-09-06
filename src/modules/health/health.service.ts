export class HealthService {
  check() {
    return {
      success: true,
      message: "API is running",
    };
  }
}
