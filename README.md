# 🤖 AI SRE Incident Agent 

AI SRE Incident Agent is an intelligent incident investigation platform that integrates with **ServiceNow**, **Grafana**, **Loki**, **Prometheus**, **Kubernetes**, and **ArgoCD** to automatically investigate production incidents and generate AI-powered root cause analysis.

---

# Features

- ServiceNow Incident Integration
- AI Investigation Engine
- Grafana Log Analysis
- Loki Log Collection
- Prometheus Metrics Analysis
- Kubernetes Health Analysis
- Deployment Correlation (ArgoCD)
- AI Root Cause Detection
- Executive Summary
- Recommendations
- Investigation Timeline
- Technical Investigation Dashboard

---

# Architecture

```
                    ServiceNow
                         │
                         ▼
                 Incident Webhook/API
                         │
                         ▼
                FastAPI Backend
                         │
 ┌───────────────┬───────────────┬──────────────┐
 │               │               │              │
 ▼               ▼               ▼              ▼
Grafana        Prometheus      Kubernetes     ArgoCD
 │               │               │              │
 ▼               ▼               ▼              ▼
Logs         Metrics        Cluster Data   Deployments
 └───────────────┬───────────────┬──────────────┘
                 ▼
          AI Investigation Engine
                 ▼
          Root Cause Analysis
                 ▼
          React Dashboard
```

---

# Tech Stack

## Backend

- Python 3.13+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- HTTPX

## Frontend

- React
- TypeScript
- Material UI
- React Router
- Axios

## Infrastructure

- Docker
- PostgreSQL
- ServiceNow
- Grafana
- Loki
- Prometheus
- Kubernetes
- ArgoCD

---

# Project Structure

```
app/
frontend/
docker-compose.yml
requirements.txt
README.md
```

---

# Prerequisites

Install the following before running the project.

## Backend

- Python 3.13+
- PostgreSQL
- Docker Desktop

## Frontend

- Node.js 22+
- npm

---

# Clone Repository

```bash
git clone <repository-url>

cd ai-sre-agent
```

---

# Backend Setup

## Create Virtual Environment

```bash
python3 -m venv venv
```

Activate

### macOS

```bash
source venv/bin/activate
```

### Windows

```bash
venv\Scripts\activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

# Frontend Setup

```bash
cd frontend

npm install
```

---

# PostgreSQL

Start PostgreSQL

```bash
docker compose up -d
```

Verify

```bash
docker ps
```

---

# Environment Variables

Create

```
.env
```

Example

```env
DATABASE_URL=

SERVICENOW_INSTANCE=

SERVICENOW_USERNAME=

SERVICENOW_PASSWORD=

GRAFANA_URL=

GRAFANA_USERNAME=

GRAFANA_PASSWORD=

LOKI_DATASOURCE_UID=

PROMETHEUS_DATASOURCE_UID=

ARGOCD_URL=

ARGOCD_USERNAME=

ARGOCD_PASSWORD=

OPENAI_API_KEY=
```

> Fill all values according to your environment.

---

# Start Backend

```bash
uvicorn app.main:app --reload
```

Backend

```
http://localhost:8000
```

Swagger

```
http://localhost:8000/docs
```

---

# Start Frontend

```bash
cd frontend

npm run dev
```

Frontend

```
http://localhost:5173
```

---

# Verify Integrations

Before using the application, verify:

- ServiceNow API is accessible.
- Grafana is reachable.
- Loki datasource exists.
- Prometheus datasource exists.
- Kubernetes cluster is accessible.
- ArgoCD is reachable.

---

# Running the Agent

1. Open the application.
2. Navigate to **Incidents**.
3. Refresh incidents from ServiceNow.
4. Open an incident.
5. Start AI Investigation.
6. Wait for investigation to complete.
7. View the generated investigation report.

---

# Common Issues

## PostgreSQL connection failed

Check

```bash
docker ps
```

Verify PostgreSQL container is running.

---

## Frontend cannot reach backend

Verify backend

```
http://localhost:8000/docs
```

---

## ServiceNow incidents not loading

Verify

- ServiceNow credentials
- API permissions
- Instance URL

---

## Grafana data unavailable

Verify

- Grafana URL
- Datasource UID
- Authentication

---

## Kubernetes connection failed

Verify

```bash
kubectl get nodes
```

---

## ArgoCD connection failed

Verify

```bash
argocd app list
```

---

# Development Workflow

```bash
git pull

git checkout -b feature/my-feature

# Make changes

git add .

git commit -m "Feature"

git push
```

---

# Future Enhancements

- Similar Incident Detection
- AI Chat
- Historical Investigation Search
- Multi-cluster Support
- PDF Export
- Notification Integrations

---

# License

Internal Project
