# 📡 API Endpoints — AutoScan Pro

Base URL: [https://dev.autoscan.team/api/v1](https://www.notion.so/AutoScan-Pro-Wiki-3341400fe5b58032923ad0665f669272)
Key: A

---

## 🚗 Vehicles

| Метод | Endpoint | Опис |
|-------|----------|------|
| GET | /vehicles | Список авто користувача |
| POST | /vehicles | Створити профіль авто |
| GET | /vehicles/:id | Деталі авто |
| PATCH | /vehicles/:id | Оновити профіль |
| DELETE | /vehicles/:id | Видалити профіль |

### POST /vehicles — приклад body:
{
  "make": "Toyota",
  "model": "Camry",
  "year": 2018,
  "vin": "1HGBH41JXMN109186"
}

---

## 🔍 Scans (Діагностика)

| Метод | Endpoint | Опис |
|-------|----------|------|
| POST | /scans | Ініціювати сканування |
| GET | /scans/:id | Отримати результати |
| GET | /scans/history/:vehicle_id | Історія сканувань |
| DELETE | /scans/:id | Видалити сесію |

### POST /scans — приклад body:
{
  "vehicle_id": "uuid",
  "scan_type": "full"
}

### GET /scans/:id — приклад response:
{
  "session_id": "uuid",
  "status": "completed",
  "duration_ms": 8420,
  "active_dtc": [
    {
      "code": "P0301",
      "description": "Misfire cylinder 1",
      "severity": "critical"
    }
  ],
  "pending_dtc": []
}

---

## 🌡 Sensors (Real-time)

| Метод | Endpoint | Опис |
|-------|----------|------|
| GET | /sensors/live | Поточні значення PID |
| GET | /sensors/history/:session_id | Дані за сесію |

### WebSocket: wss://dev.autoscan.team/ws/sensors
Events:
  → client: { "action": "subscribe", "pids": ["0x0C","0x05"] }
  ← server: { "pid": "0x0C", "value": 2450, "unit": "rpm" }
  ← server: { "event": "alert", "type": "overheat", 
               "value": 106, "threshold": 105 }

---

## 🔎 DTC Reference

| Метод | Endpoint | Опис |
|-------|----------|------|
| GET | /dtc/:code | Опис DTC-коду |
| DELETE | /dtc/clear/:vehicle_id | Очистити DTC-коди |

### GET /dtc/P0301 — response:
{
  "code": "P0301",
  "description": "Cylinder 1 Misfire Detected",
  "possible_causes": [
    "Faulty spark plug",
    "Bad ignition coil",
    "Low fuel pressure"
  ],
  "severity": "critical",
  "system": "engine"
}

---

## ⚡ Performance SLA
| Endpoint | Max Response Time |
|----------|:-----------------:|
| GET /dtc/:code | < 100 мс |
| POST /scans | < 300 мс |
| GET /sensors/live | < 200 мс |
| WebSocket latency | < 500 мс |
