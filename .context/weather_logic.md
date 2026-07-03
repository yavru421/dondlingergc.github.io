# Weather Logic & Rain Intercept HUD

## Rain Now False-Positive Mitigation
- **Forecast Thresholds**:
  - **Current Hour (`ri === 0`)**: Only flag as active rain if the local KISW observation reports precipitation (`isRainingNow = true`) OR if the API forecast has a solid chance (probability $\ge 25\%$ and amount $> 0$).
  - **Future Hours (`ri > 0`)**: Only flag incoming rain if the forecast probability $\ge 20\%$ or predicted precipitation $> 0.01\text{ in}$.
- **Files**: The `renderRainIntel(wx)` function resides in both `index.html` and `inject_v5.js`. Ensure changes are kept in sync across both files.
