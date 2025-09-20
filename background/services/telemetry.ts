export interface TelemetryEvent {
  name: string
  details?: Record<string, unknown>
}

export class TelemetryService {
  track(event: TelemetryEvent): void {
    console.info("[telemetry] track", event)
  }
}

export const createTelemetryService = () => new TelemetryService()
