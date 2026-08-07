# John Dondlinger
### Systems Architect | Cloud-Native C# & Edge Engineer | Creator of Metropolis & ZLA

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1000&color=512BD4&center=true&vCenter=true&width=600&lines=C%23+%2F+.NET+9+Systems+Architect;Cloudflare+Durable+Objects+%26+Edge+Workers;Blazor+WASM+%26+Zero-Liability+Architecture;Metropolis+GPU+Hardware+Compute+%26+DuckDB" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/C%23_.NET_9-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" /></a>
  <a href="https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor"><img src="https://img.shields.io/badge/Blazor_WASM-512BD4?style=for-the-badge&logo=blazor&logoColor=white" /></a>
  <a href="https://workers.cloudflare.com/"><img src="https://img.shields.io/badge/Cloudflare_Workers_%26_DO-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" /></a>
  <a href="https://duckdb.org/"><img src="https://img.shields.io/badge/DuckDB_Telemetry-FFF000?style=for-the-badge&logo=duckdb&logoColor=black" /></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" /></a>
  <a href="https://developer.nvidia.com/cuda-zone"><img src="https://img.shields.io/badge/NVENC_/_CUDA-76B900?style=for-the-badge&logo=nvidia&logoColor=white" /></a>
</p>

---

## ⚡ System Execution Architecture

```mermaid
flowchart LR
    A["📱 Blazor WASM PWA (Client)"] -->|"WebRTC / PeerJS P2P (ZLA)"| B["⚡ Watchtowers (Cloudflare Edge DO)"]
    B -->|"Sidecar MCP Protocol Mesh"| C["🖥️ MetroNode (Primary Host PC)"]
    C -->|"Hardware NVENC H.264/HEVC"| D["🎥 GPU Media Pipeline"]
    C -->|"In-Memory Analytical Queries"| E["🦆 DuckDB Telemetry Lake (mind.duckdb)"]

    style A fill:#512BD4,color:#fff,stroke:#333,stroke-width:2px
    style B fill:#F38020,color:#fff,stroke:#333,stroke-width:2px
    style C fill:#000000,color:#fff,stroke:#333,stroke-width:2px
    style D fill:#76B900,color:#fff,stroke:#333,stroke-width:2px
    style E fill:#FFF000,color:#000,stroke:#333,stroke-width:2px
```

---

## 🏛️ Core Flagship Architectures

<details open>
<summary><b>🏛️ Metropolis Distributed Infrastructure (Click to Collapse)</b></summary>

<br />

*A hybrid local-to-edge agent execution framework and real-time telemetry lake.*
- **Primary Host PC (`MetroNode`)**: Coordinates high-throughput local compute, hardware NVENC video processing (1080p60 H.264/HEVC), and local DuckDB memory stores (`mind.duckdb`).
- **Cloudflare Edge (`Watchtowers`)**: Smart edge routing layer powered by Cloudflare Workers, **Durable Objects (DO)**, and Workers AI for low-latency state synchronization (<35ms) and token-efficient cognitive offloading.
- **Sidecar MCP Mesh**: Dedicated protocol adapters for real-time telemetry, filesystem mutation, and DuckDB analytical queries.

</details>

<details open>
<summary><b>🛡️ Zero-Liability Architecture (ZLA) Specification (Click to Collapse)</b></summary>

<br />

*Client-side execution and peer-to-peer data transport with zero central server storage exposure.*
- **WebRTC & PeerJS Transport**: Direct peer-to-peer data channels for real-time state sync without server-side database footprint.
- **Local-First PWA Stack**: Installable Blazor WebAssembly PWAs backed by IndexedDB storage, WebSockets, and Windows DPAPI client secrets vaults.

</details>

---

## 🚀 Live Production Portfolio & Interactive Demos (`dondlingergc.com`)

| Production Service | Live Endpoint | Status Badge & Highlights |
| :--- | :--- | :--- |
| **TAP Client** | [tap.dondlingergc.com](https://tap.dondlingergc.com) | [![Live](https://img.shields.io/badge/Live-MudBlazor_WASM-512BD4.svg?style=flat-square)](https://tap.dondlingergc.com) Enterprise Control Panel |
| **Personalization Engine** | [personalization.dondlingergc.com](https://personalization.dondlingergc.com) | [![Live](https://img.shields.io/badge/Live-Taskbar_Bridge-F38020.svg?style=flat-square)](https://personalization.dondlingergc.com) Metropolis System Bridge |
| **Skydrop File Transfer** | [skydrop.dondlingergc.com](https://skydrop.dondlingergc.com) | [![Live](https://img.shields.io/badge/Live-PeerJS_ZLA-000000.svg?style=flat-square)](https://skydrop.dondlingergc.com) Zero-Storage File Sharing |
| **Timeline ZLA Engine** | [timelinezla.dondlingergc.com](https://timelinezla.dondlingergc.com) | [![Live](https://img.shields.io/badge/Live-WebRTC_Sync-76B900.svg?style=flat-square)](https://timelinezla.dondlingergc.com) Real-time PDF & Canvas Sync |
| **WaZ Weather Engine** | [wazweather.dondlingergc.com](https://wazweather.dondlingergc.com) | [![Live](https://img.shields.io/badge/Live-WASM_Telemetry-FFF000.svg?style=flat-square&labelColor=black)](https://wazweather.dondlingergc.com) Weather Telemetry Engine |
| **Heckler Soundboard** | [heckler.dondlingergc.com](https://heckler.dondlingergc.com) | [![Live](https://img.shields.io/badge/Live-WebAudio_WASM-512BD4.svg?style=flat-square)](https://heckler.dondlingergc.com) High-Velocity Audio Engine |

---

## 📈 System Benchmarks & Telemetry Performance

```
┌───────────────────────────────────────┬────────────────────────┬──────────────────────┐
│ Benchmark Metric                      │ Local / Edge Target    │ Verified Result      │
├───────────────────────────────────────┼────────────────────────┼──────────────────────┤
│ DuckDB Telemetry Event Ingestion     │ Local Host (`MetroNode`)│ >50,000 events/sec   │
├───────────────────────────────────────┼────────────────────────┼──────────────────────┤
│ Cloudflare Durable Object State Sync  │ Edge (`Watchtowers`)   │ <35ms global latency │
├───────────────────────────────────────┼────────────────────────┼──────────────────────┤
│ NVENC Hardware H.264/HEVC Render      │ NVIDIA GPU Acceleration│ 240 FPS @ 1080p      │
├───────────────────────────────────────┼────────────────────────┼──────────────────────┤
│ ZLA Peer-to-Peer Data Transfer (WebRTC│ Client-side WASM PWA   │ Zero Server Storage  │
└───────────────────────────────────────┴────────────────────────┴──────────────────────┘
```

---

## 🔬 Edge-Cellular Execution Visualizer (Mitosis & Meiosis)

<details>
<summary><b>🧬 Edge-Cellular Subagent Mesh Spec (Click to Expand)</b></summary>

<br />

```
                       ┌──────────────────────────────────────────────┐
                       │   [Root Prompt / Architecture Input]         │
                       └──────────────────────┬───────────────────────┘
                                              │
                                   (Tier 1: Edge Mitosis)
            ┌─────────────────────────────────┼─────────────────────────────────┐
            ▼                                 ▼                                 ▼
   [Micro-Cell 1: ZLA Specs]         [Micro-Cell 2: MetroNode]        [Micro-Cell 3: Cloudflare DO]
   (@cf/meta/llama-3.2-3b)           (@cf/meta/llama-3.2-3b)          (@cf/meta/llama-3.2-3b)
            │                                 │                                 │
            └─────────────────────────────────┼─────────────────────────────────┘
                                              │
                                   (Tier 2: Meiosis Synthesis)
                                              ▼
                                 [Cloudflare Edge Router]
                             (@cf/meta/llama-3.3-70b-instruct)
                                              │
                                              ▼
                             [Verified Telemetry & Production]
```

</details>

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

---

## 💼 Contact & Engineering Inquiries

- **Portfolio & Live Demos**: [dondlingergc.com](https://dondlingergc.com)
- **GitHub Profile**: [github.com/yavru421](https://github.com/yavru421)
