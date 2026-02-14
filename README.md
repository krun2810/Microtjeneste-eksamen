# Smart Parking System Exam Project

This project is a microservices-based Smart Parking System developed for the PG3402 exam.

## Architecture

The system consists of the following microservices:

1.  **Parking Spot Service**: Manages parking spots and their availability.
2.  **Reservation Service**: Handles user reservations.
3.  **Billing Service**: Calculates parking fees.
4.  **Sensor Service**: Simulates IoT sensors detecting vehicle presence.
5.  **Notification Service**: Sends notifications (simulated) based on events.
6.  **API Gateway**: Single entry point for the system.

### Tech Stack
-   **Language**: Node.js with TypeScript
-   **Database**: MongoDB (One database per service context)
-   **Message Broker**: RabbitMQ
-   **Infrastructure**: Docker & Docker Compose

## Prerequisites

-   Docker & Docker Compose installed
-   Node.js (for local development)

## How to Run

1.  Clone the repository (or extract the zip).
2.  Run the following command in the root directory:

    ```bash
    docker compose up --build
    ```

3.  The system will start. Wait for the `rabbitmq` and `mongodb` services to be healthy.
4.  **(Optional) Seed Data**: Run the following command to add dummy parking spots:
    ```bash
    node seed_data.js
    ```
5.  Open the **Frontend Dashboard** in your browser at: `http://localhost:3000`

## API Endpoints

All endpoints are accessible via the Gateway at `http://localhost:8080`.
The Frontend at `http://localhost:3000` uses these endpoints automatically.

-   **Get all spots**: `GET /api/spots`
-   **Get a spot**: `GET /api/spots/:id`
-   **Create a spot**: `POST /api/spots` (Body: `{ "location": "A1", "pricePerHour": 10 }`)
-   **Create Reservation**: `POST /api/reservations` (Body: `{ "spotId": "...", "userId": "user1", "startTime": "...", "endTime": "..." }`)
-   **Get Reservations**: `GET /api/reservations`
-   **Get Bills**: `GET /api/bills`
-   **Simulate Sensor Occupied**: `POST /api/sensor/occupied` (Body: `{ "spotId": "..." }`)
-   **Simulate Sensor Freed**: `POST /api/sensor/freed` (Body: `{ "spotId": "..." }`)

## Architecture Diagram

[Client] -> [API Gateway]
              |
              +-> [Parking Spot Service] <---> [MongoDB]
              |       ^
              |       | (Sync: Check Availability)
              |       v
              +-> [Reservation Service] <---> [MongoDB]
              |       |
              |       | (Async: ReservationCreatedEvent)
              |       v
              +-> [RabbitMQ]
                      |
                      +-> [Billing Service] <---> [MongoDB]
                      |
                      +-> [Notification Service]
                      |
                      +-> [Sensor Service] (Publishes Sensor Events)

## User Stories

1.  **As a driver**, I can view all available parking spots to choose where to park.
2.  **As a driver**, I can reserve a specific spot for a time range so that I am guaranteed a space.
3.  **As a system**, when a reservation is created, I verify the spot is available (Sync communication).
4.  **As a system**, when a reservation is confirmed, a billing record is prepared (Async communication).
5.  **As a sensor**, I can detect when a car occupies a spot and update the system (Async event).
6.  **As a user**, I receive a notification when my reservation is confirmed.

## Team Reflection

(Individual reflections are in separate documents as per exam requirement).
