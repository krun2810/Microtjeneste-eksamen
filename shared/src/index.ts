export interface ParkingSpot {
  id: string;
  location: string;
  isOccupied: boolean;
  type: 'standard' | 'disabled' | 'ev';
  pricePerHour: number;
}

export interface Reservation {
  id: string;
  spotId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'completed' | 'cancelled';
}

export interface SpotOccupiedEvent {
  spotId: string;
  vehicleId?: string;
  timestamp: Date;
}

export interface SpotFreedEvent {
  spotId: string;
  timestamp: Date;
}

export interface ReservationCreatedEvent {
  reservationId: string;
  spotId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
}

export const QUEUES = {
  PARKING_EVENTS: 'parking_events',
  RESERVATION_EVENTS: 'reservation_events',
  BILLING_EVENTS: 'billing_events'
};

export const EXCHANGE = 'parking_system_exchange';
