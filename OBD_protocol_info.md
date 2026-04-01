# 🔌 OBD-II Protocol Notes

## Стандарти підтримки
| Стандарт | Опис | Роки авто |
|----------|------|-----------|
| SAE J1979 | OBD-II (США) | 1996+ |
| ISO 15765 | CAN Bus | 2008+ |
| ISO 14230 | KWP2000 | 2000–2008 |
| ISO 9141-2 | Старіші авто | 1996–2004 |
| SAE J1850 | GM/Ford | 1996–2003 |

## Адаптер: ELM327
- Версія: v1.5 і вище
- Підключення: Bluetooth Low Energy (BLE)
- Запасний варіант: Wi-Fi (UDP порт 35000)
- Бібліотека: react-native-ble-plx

## Ключові OBD-II Modes (Service)
| Mode | Hex | Призначення |
|------|-----|-------------|
| 01 | 0x01 | Поточні дані (PIDs) |
| 03 | 0x03 | Активні DTC-коди |
| 04 | 0x04 | Очистити DTC-коди |
| 07 | 0x07 | Pending DTC-коди |

## Ключові PID-коди
| PID | Hex | Параметр | Одиниця |
|-----|-----|----------|---------|
| 04 | 0x04 | Engine Load | % |
| 05 | 0x05 | Coolant Temp | °C |
| 0C | 0x0C | RPM | об/хв |
| 0D | 0x0D | Vehicle Speed | км/год |
| 42 | 0x42 | Battery Voltage | V |
| 10 | 0x10 | MAF Air Flow | g/s |

## Парсинг HEX → DTC
Відповідь ELM327: "43 01 33 00 00 00 00"
  43 = Mode 03 response
  01 = кількість кодів
  33 = P0133

Алгоритм декодування першого байту:
  00-3F → P (Powertrain)
  40-7F → C (Chassis)
  80-BF → B (Body)
  C0-FF → U (Network)

## Mock OBD-II сервер
Порт: localhost:35000
Команди емуляції:
  AT Z  → ELM327 v1.5
  03    → 43 01 P0301 (тест-несправність)
  010C  → 41 0C 1A F8 (RPM = 1726)
  0105  → 41 05 7B (temp = 83°C)
