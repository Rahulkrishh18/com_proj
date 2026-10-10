# F.R.I.D.A.Y. - Mission Control Dashboard
**Flying Relay Infrastructure for Dynamic Area**

A state-of-the-art emergency disaster response Ground Station & Tactical Mission Control Dashboard for the F.R.I.D.A.Y. LoRa aerial mesh relay network.

---

## 🚀 Quick Start (Running the Dashboard)

Simply open `index.html` in any modern web browser (Google Chrome, Firefox, Edge, Safari):

```bash
open index.html
```

Or run a local static server:

```bash
npx serve .
# or python3 -m http.server 8080
```

---

## 🌟 Key Dashboard Features

1. **Interactive Relay Mesh Topology Visualizer**:
   * Visualizes real-time status of **Base Station A (0xFA)**, **Drone Relay (Airborne Dual Bridge)**, and **Base Station C (0xFF)**.
   * Real-time packet travel particle animations and TX/RX LED indicators.
2. **Geographic Tactical GIS Radar / Map**:
   * Integrated Leaflet map with dark tactical styling, node coordinates, dynamic RF signal coverage radius cones, and transmission path lines.
3. **RF Signal Telemetry & Path Loss Analyzer**:
   * Real-time Canvas 60 FPS charts for **RSSI (dBm)** and **SNR (dB)**.
   * Live Log-Distance Path Loss formula distance estimation ($\approx d = 10^{(\text{txRef} - \text{RSSI})/(10 \cdot n)}$ km).
4. **Seismic Oscilloscope & Hardware Shock Trigger**:
   * Real-time accelerometer waveform graph for GPIO 32 vibration sensor.
   * Interactive Shock Trigger simulation that automatically drops an emergency alert banner and broadcasts an Auto-SOS packet across the mesh.
5. **National CAP (Common Alerting Protocol) Simulation Suite**:
   * 1-Click disaster triggers for **Earthquake (M7.2)**, **Flash Flood**, **Landslide**, and **Super Cyclone**.
6. **Tactical LoRa Messenger & Comms Feed**:
   * Real-time packet activity log with direction tags (North, East, etc.), origin node tags, signal metrics, CSV/JSON log export, and emergency preset triggers.
7. **Tactical Web Audio Synthesizer**:
   * High-tech radio transmit chirps, receive beeps, and emergency sirens synthesized directly in the browser via Web Audio API.

---

## 📡 Hardware Network Architecture

```
 [Base Station A]         [Drone Relay (Dual SX1262)]         [Base Station C]
  (Disaster Zone)                 (Airborne)                 (Rescue Command)
   Sync: 0xFA                      Bridge                      Sync: 0xFF
 ┌──────────────┐         ┌─────────────────────────┐         ┌──────────────┐
 │ ESP32 + LoRa │ ◄─────► │ radioUp       radioDown │ ◄─────► │ ESP32 + LoRa │
 │ + Vibration  │  (0xFA) │ (0xFA)         (0xFF)   │  (0xFF) │              │
 └──────────────┘         └─────────────────────────┘         └──────────────┘
   WiFi: BASE_A              WiFi: DRONE_RELAY                   WiFi: BASE_C
```

### Pin Configurations

| Node | Module | NSS | DIO1 | NRST | BUSY | RF Switch | Sensors |
|---|---|---|---|---|---|---|---|
| **Base Station A** | SX1262 (0xFA) | 5 | 35 | 4 | 34 | 25, 26 | GPIO 32 (Vibration) |
| **Drone Relay** | `radioUp` (0xFA) | 5 | 35 | 4 | 34 | 25, 26 | - |
| **Drone Relay** | `radioDown` (0xFF) | 27 | 21 | 32 | 14 | 33, 13 | - |
| **Base Station C** | SX1262 (0xFF) | 5 | 35 | 4 | 34 | 25, 26 | - |

---

## ⚙️ Connecting to Live Hardware

1. Flash the corresponding sketch from the `firmware/` folder to each ESP32.
2. Connect your laptop/tablet to the WiFi AP (`BASE_A`, `DRONE_RELAY`, or `BASE_C`).
3. Click the ⚙️ **Settings** button in the dashboard top header.
4. Select **"Live ESP32 Hardware Connection"** and verify the IP (Default: `http://192.168.4.1`).
