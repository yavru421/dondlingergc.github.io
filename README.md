# John Dondlinger
### Systems Architect | Cloud-Native C# & Edge Engineer | Creator of Metropolis & ZLA

> **"Systems craftsman building high-performance C# / Blazor WASM applications, distributed Cloudflare edge workers, and zero-liability architectures."**

[![Dotnet](https://img.shields.io/badge/C%23_.NET_9-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Blazor](https://img.shields.io/badge/Blazor_WASM-512BD4?style=for-the-badge&logo=blazor&logoColor=white)](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor)
[![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers_&_DO-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![DuckDB](https://img.shields.io/badge/DuckDB_Telemetry-FFF000?style=for-the-badge&logo=duckdb&logoColor=black)](https://duckdb.org/)
[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![FFmpeg/CUDA](https://img.shields.io/badge/NVENC_/_CUDA-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://developer.nvidia.com/cuda-zone)

---

## ⚡ Core Flagship Architectures

### 🏛️ Metropolis Distributed Infrastructure
*A hybrid local-to-edge agent execution framework and real-time telemetry lake.*
- **Primary Host PC (`MetroNode`)**: Coordinates high-throughput local compute, hardware NVENC video processing, and local DuckDB memory stores (`mind.duckdb`).
- **Cloudflare Edge (`Watchtowers`)**: Smart edge routing layer powered by Cloudflare Workers, **Durable Objects (DO)**, and Workers AI for low-latency state synchronization and token-efficient cognitive offloading.
- **Sidecar MCP Mesh**: Dedicated protocol adapters for real-time telemetry, filesystem mutation, and DuckDB analytical queries.

### 🛡️ Zero-Liability Architecture (ZLA)
*Client-side execution and peer-to-peer data transport with zero central server storage exposure.*
- **WebRTC & PeerJS Transport**: Direct peer-to-peer data channels for real-time state sync without server-side database footprint.
- **Local-First PWA Stack**: Installable Blazor WebAssembly PWAs backed by IndexedDB storage, WebSockets, and Windows DPAPI client secrets vaults.

---

## 🌐 Live Production Ecosystem (`dondlingergc.com`)

| Production Service | Live Endpoint | Architectural Highlights |
| :--- | :--- | :--- |
| **TAP Client** | [tap.dondlingergc.com](https://tap.dondlingergc.com) | MudBlazor / Blazor WASM Enterprise Control Panel & Telemetry Dashboard |
| **Personalization Engine** | [personalization.dondlingergc.com](https://personalization.dondlingergc.com) | Metropolis Taskbar & Desktop System Bridge |
| **Skydrop File Transfer** | [skydrop.dondlingergc.com](https://skydrop.dondlingergc.com) | PeerJS, QR Code Scanner, ZLA Zero-Storage File Sharing |
| **Timeline ZLA Engine** | [timelinezla.dondlingergc.com](https://timelinezla.dondlingergc.com) | WebRTC Peer Sync, Real-time PDF Export & Visual Canvas |
| **WaZ Weather Engine** | [wazweather.dondlingergc.com](https://wazweather.dondlingergc.com) | Blazor WASM Telemetry & Severe Weather Data Dispatch |
| **Heckler Soundboard** | [heckler.dondlingergc.com](https://heckler.dondlingergc.com) | High-Velocity Blazor WASM Web Audio Engine |

---

## 📐 Algebraic Pipeline Theory (APT)

$$\mathcal{Y} = \mathcal{A}_n(\mathcal{A}_{n-1}(\dots \mathcal{A}_1(\mathcal{X})\dots))$$

**Algebraic Pipeline Theory (APT)** formalizes workflows as deterministic, composable sequence pipelines. Every system—from hardware-accelerated NVENC video processing to multi-node LLM sidecar orchestration—is engineered as pure, measurable transform functions.

---

## 🛠️ Technology Belt

```
┌─────────────────┬─────────────────────────────────────────────────────────────────┐
│ Core Stack      │ C# (.NET 8/9), Rust, TypeScript, Python, SQL (DuckDB/SQLite)    │
├─────────────────┼─────────────────────────────────────────────────────────────────┤
│ Edge Computing  │ Cloudflare Workers, Durable Objects (DO), D1, KV, Vectorize, R2 │
├─────────────────┼─────────────────────────────────────────────────────────────────┤
│ Frontend & PWA  │ Blazor WebAssembly (WASM), MudBlazor, ASP.NET Core, HTML5/CSS3  │
├─────────────────┼─────────────────────────────────────────────────────────────────┤
│ AI & Telemetry  │ Agentic MCP Sidecars, DuckDB Analytics, PyTorch CUDA, OpenCV    │
├─────────────────┼─────────────────────────────────────────────────────────────────┤
│ Acceleration    │ FFmpeg, NVENC, NPP, OpenCL, Parametric OpenSCAD                 │
└─────────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Core Principles & Mindset

> *"Measure twice, formalize once."*

- **Mechanical Realism**: Hardware capabilities, OS boundaries, and memory limitations dictate architecture—no theoretical software loops.
- **Zero Fluff Delivery**: Production-ready code, explicit schema contracts, and verifiable telemetry.
