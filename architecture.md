# Architecture

```mermaid
flowchart TD

%% Clients
    subgraph Client
        A1["Browser / API Client"]
        A2["CLI / Tests"]
    end

%% Express App
    subgraph B["Express Application"]
        B1["Auth Router"]
        B2["Products Router"]
        B3["Middleware Layer"]
        B4["Error Handling Layer"]
    end

%% Database
    subgraph C["Database Layer"]
        C1["MySQL Database"]
    end

%% Infrastructure
    subgraph D["Infrastructure"]
        D1["Docker Containers"]
        D2["Docker Compose + .env"]
    end

%% Client flows
    A1 -->|HTTP Requests| B
    A2 -->|Supertest / Integration| B

%% App flows
    B1 -->|Validate Credentials| C1
    B2 -->|SQL Queries| C1
    B3 -->|JWT / Logging| B
    B4 -->|Errors: 500 / 404 / 401| A1

%% Infra
    B --- D1
    C1 --- D1
    D1 --- D2

```

# Future Improvements

These are things I can do to improve the product in the case of full blown production environments

## 🔐 Security

* Use argon2 or bcrypt with salt + rounds

* Refresh tokens & rotation

* Role-based access (admin, user)

## 📊 Observability

* Add logging (pino or winston)

* Metrics with Prometheus + Grafana

* Request tracing (OpenTelemetry)

## ⚙️ Architecture

* Migrate DB layer to Prisma ORM (safer queries)

* Introduce service layer (separate business logic from routes)

* Container orchestration with Kubernetes for scaling

## 🚀 Scaling

* API Gateway / Load Balancer

* Caching layer (Redis) for products

* Full CI/CD pipeline with GitHub Actions
