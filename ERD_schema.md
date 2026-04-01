# 🗄 ERD — Схема бази даних AutoScan Pro

> Вставити зображення ERD з draw.io / dbdiagram.io

## Таблиці та поля:

### vehicles
| Поле | Тип | Опис |
|------|-----|------|
| id | UUID PK | Унікальний ідентифікатор |
| make | VARCHAR(50) | Марка (Toyota, BMW...) |
| model | VARCHAR(50) | Модель (Camry, X5...) |
| year | SMALLINT | Рік випуску (1996+) |
| vin | VARCHAR(17) | VIN-номер (унікальний) |
| created_at | TIMESTAMPTZ | Дата створення профілю |

### scan_sessions
| Поле | Тип | Опис |
|------|-----|------|
| id | UUID PK | ID сесії сканування |
| vehicle_id | UUID FK → vehicles | Прив'язка до авто |
| scan_type | ENUM | full / dtc / sensors |
| status | ENUM | pending/completed/failed |
| duration_ms | INTEGER | Тривалість сканування |
| started_at | TIMESTAMPTZ | Час початку |
| completed_at | TIMESTAMPTZ | Час завершення |

### detected_dtc_codes
| Поле | Тип | Опис |
|------|-----|------|
| id | UUID PK | |
| session_id | UUID FK → scan_sessions | |
| code | VARCHAR(6) | P0301, C0035... |
| type | ENUM | active / pending |
| description | TEXT | Опис несправності |
| severity | ENUM | critical/warning/info |
| detected_at | TIMESTAMPTZ | |

### sensor_readings
| Поле | Тип | Опис |
|------|-----|------|
| id | UUID PK | |
| session_id | UUID FK → scan_sessions | |
| pid | VARCHAR(4) | 0x0C (RPM), 0x05 (temp)... |
| parameter_name | VARCHAR(50) | RPM, coolant_temp... |
| value | DECIMAL(10,2) | Числове значення |
| unit | VARCHAR(10) | rpm, °C, V, km/h |
| recorded_at | TIMESTAMPTZ | |

### dtc_codes_reference (довідник)
| Поле | Тип | Опис |
|------|-----|------|
| code | VARCHAR(6) PK | P0301 |
| description | TEXT | Опис несправності |
| possible_causes | TEXT | Можливі причини |
| severity | ENUM | critical/warning/info |
| system | ENUM | engine/transmission/... |

## Зв'язки:
vehicles ──< scan_sessions ──< detected_dtc_codes
                          ──< sensor_readings
dtc_codes_reference (lookup, без FK)
