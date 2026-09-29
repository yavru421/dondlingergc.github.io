---
description: Grounded Visual Site Modeling (GVSM), photo-anchored cutaways, dual-deliverable blueprints, and Menards takeoffs.
trigger: always_on
---

# Grounded Visual Site Modeling (GVSM) & Construction Invariants

## 1. Unanchored Text-to-Image Prohibition
- Generating architectural details, structural framing, or mechanical specifications from blind text prompts (without physical site photos) is strictly FORBIDDEN. Unanchored diffusion produces warped lumber, fabricated MEP geometry, and illegible text.

## 2. Mandatory Image-Anchored GVSM Pipeline
- When visualizing proposed construction, soffits, additions, or finishes, the agent MUST pass 1-3 actual high-resolution site photos directly into `generate_image` via `ImagePaths: ["<path_to_site_photo>"]`.
- Prompts must strictly anchor to the visible substrate ("built onto the exact framing cradle shown in the reference image") and specify real trade materials (Pro-Rib steel, 15/16" drop grid, 1/2" solid PVC SKU 1429329, J-trim).
- Include an architectural cutaway to show rough-ins (furnaces, spiral ducts, wiring) and an architectural detail zoom circle for microscopic joint interfaces (gaskets, fasteners).

## 3. Dual-Deliverable Truth Composition
- **Client Visualization & Excitement Layer**: GVSM photorealistic cutaways show the client what the finished job looks like in their actual physical space.
- **Fabrication & Dimensional Truth Layer**: Deterministic inline SVG / HTML vector drawings provide millimeter-accurate RCPs, runner spans, and chop-saw cut schedules for the crew.

## 4. Single-Supplier Procurement Invariant
- Never split a job bill of materials across multiple retail stores (e.g. half Menards, half Home Depot). Always consolidate the entire job takeoff onto a single primary supplier per job to eliminate duplicate travel time, wasted fuel, and multi-stop logistics overhead.

## 5. Path-Driven Project Scope
- This rule applies strictly to Dondlinger General Contracting (DGC) and construction visualization workspaces. Zero domain bleed: never enforce DGC bidding or framing constraints in pure CUDA, machine learning, or software repositories.
