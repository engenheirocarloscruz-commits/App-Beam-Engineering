import React from 'react';
import { MainProfileType, SectionDimensions } from '../utils/sectionCalculator';

interface ProfileCrossSectionSvgProps {
  type: MainProfileType;
  dims: SectionDimensions;
}

export const ProfileCrossSectionSvg: React.FC<ProfileCrossSectionSvgProps> = ({ type, dims }) => {
  const rawD = Math.max(Number(dims.d) || 100, 5);
  const rawBf = Math.max(Number(dims.bf) || 100, 5);
  const rawTw = Math.max(Number(dims.tw) || 5, 0.5);
  const rawTf = Math.max(Number(dims.tf) || 8, 0.5);

  const cx = 135;
  const cy = 105;

  // Max dimensions for the section shape inside the SVG viewport
  const maxBoxW = 125;
  const maxBoxH = 140;

  // Proportional scaling preserving aspect ratio
  const ratio = rawD / rawBf;
  let w_px: number;
  let h_px: number;

  if (ratio >= 1) {
    h_px = maxBoxH;
    w_px = Math.max(38, Math.min(maxBoxW, maxBoxH / ratio));
  } else {
    w_px = maxBoxW;
    h_px = Math.max(38, Math.min(maxBoxH, maxBoxW * ratio));
  }

  // Common SVG definitions (markers for CAD arrows)
  const defs = (
    <defs>
      <marker
        id="cad-arrow"
        markerHeight="4"
        markerWidth="4"
        orient="auto-start-reverse"
        refX="5"
        refY="5"
        viewBox="0 0 10 10"
      >
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#88929b" />
      </marker>
      <marker
        id="cad-arrow-cyan"
        markerHeight="4"
        markerWidth="4"
        orient="auto-start-reverse"
        refX="5"
        refY="5"
        viewBox="0 0 10 10"
      >
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0ea5e9" />
      </marker>
      <marker
        id="cad-arrow-amber"
        markerHeight="4"
        markerWidth="4"
        orient="auto-start-reverse"
        refX="5"
        refY="5"
        viewBox="0 0 10 10"
      >
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#ffb95f" />
      </marker>
    </defs>
  );

  // Common axes lines (X-X and Y-Y)
  const axes = (
    <g className="transition-opacity duration-300">
      <line
        x1="20"
        x2="255"
        y1={cy}
        y2={cy}
        stroke="#3e4850"
        strokeWidth="0.8"
        strokeDasharray="4 2"
      />
      <line
        x1={cx}
        x2={cx}
        y1="12"
        y2="200"
        stroke="#3e4850"
        strokeWidth="0.8"
        strokeDasharray="4 2"
      />
      <text x="247" y={cy - 4} fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">
        X
      </text>
      <text x={cx + 3} y="20" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">
        Y
      </text>
    </g>
  );

  // 1. TUBULAR CIRCULAR
  if (type === 'TUB_CIRC') {
    const minDim = 80;
    const maxDim = 140;
    const dRatio = Math.min(1.0, Math.max(0.3, rawD / 350));
    const diam_px = minDim + (maxDim - minDim) * dRatio;
    const R_px = diam_px / 2;
    const t_px = Math.max(3, Math.min(R_px * 0.42, (rawTw / rawD) * R_px * 2.2 + 2.5));
    const r_inner_px = Math.max(5, R_px - t_px);

    const x_cota_left = cx - R_px;
    const x_cota_right = cx + R_px;
    const y_cota_top = cy - R_px - 14;

    return (
      <svg
        className="w-72 h-56 drop-shadow-sm select-none overflow-visible"
        viewBox="0 0 280 220"
      >
        {defs}
        {axes}

        {/* Outer and Inner Circles with smooth transition */}
        <circle
          cx={cx}
          cy={cy}
          r={R_px}
          fill="#181c24"
          stroke="#0ea5e9"
          strokeWidth="2"
          className="transition-all duration-300 ease-out"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r_inner_px}
          fill="#0a0e16"
          stroke="#0ea5e9"
          strokeWidth="1.5"
          className="transition-all duration-300 ease-out"
        />

        {/* Dimension Diameter D */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_cota_left}
            x2={x_cota_right}
            y1={y_cota_top}
            y2={y_cota_top}
            stroke="#88929b"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow)"
            markerEnd="url(#cad-arrow)"
          />
          <line
            x1={x_cota_left}
            x2={x_cota_left}
            y1={y_cota_top - 3}
            y2={cy}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <line
            x1={x_cota_right}
            x2={x_cota_right}
            y1={y_cota_top - 3}
            y2={cy}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <text
            x={cx}
            y={y_cota_top - 4}
            fill="#89ceff"
            fontFamily="JetBrains Mono"
            fontSize="9"
            fontWeight="600"
            textAnchor="middle"
          >
            Ø = {dims.d} mm
          </text>
        </g>

        {/* Dimension Thickness t */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_cota_right}
            x2={x_cota_right + 22}
            y1={cy}
            y2={cy}
            stroke="#ffb95f"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow-amber)"
          />
          <text
            x={x_cota_right + 26}
            y={cy + 3}
            fill="#ffb95f"
            fontFamily="JetBrains Mono"
            fontSize="8"
            fontWeight="600"
          >
            t: {dims.tw}
          </text>
        </g>
      </svg>
    );
  }

  // 2. TUBULAR RETANGULAR / QUADRADO
  if (type === 'TUB_RET') {
    const x_outer = cx - w_px / 2;
    const y_outer = cy - h_px / 2;

    const t_px = Math.max(
      3.5,
      Math.min(
        Math.min(w_px, h_px) * 0.32,
        (rawTw / Math.min(rawD, rawBf)) * Math.min(w_px, h_px) * 1.5 + 2.5
      )
    );

    const x_inner = x_outer + t_px;
    const y_inner = y_outer + t_px;
    const w_inner = Math.max(4, w_px - 2 * t_px);
    const h_inner = Math.max(4, h_px - 2 * t_px);

    const y_cota_top = y_outer - 14;
    const x_cota_left = x_outer - 16;
    const x_right = x_outer + w_px;
    const y_bottom = y_outer + h_px;

    return (
      <svg
        className="w-72 h-56 drop-shadow-sm select-none overflow-visible"
        viewBox="0 0 280 220"
      >
        {defs}
        {axes}

        {/* Outer and Inner Rectangles with smooth transition */}
        <rect
          x={x_outer}
          y={y_outer}
          width={w_px}
          height={h_px}
          rx="4"
          fill="#181c24"
          stroke="#0ea5e9"
          strokeWidth="2"
          className="transition-all duration-300 ease-out"
        />
        <rect
          x={x_inner}
          y={y_inner}
          width={w_inner}
          height={h_inner}
          rx="3"
          fill="#0a0e16"
          stroke="#0ea5e9"
          strokeWidth="1.5"
          className="transition-all duration-300 ease-out"
        />

        {/* Dimension Width b */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_outer}
            x2={x_right}
            y1={y_cota_top}
            y2={y_cota_top}
            stroke="#88929b"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow)"
            markerEnd="url(#cad-arrow)"
          />
          <line
            x1={x_outer}
            x2={x_outer}
            y1={y_cota_top - 3}
            y2={y_outer + 4}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <line
            x1={x_right}
            x2={x_right}
            y1={y_cota_top - 3}
            y2={y_outer + 4}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <text
            x={cx}
            y={y_cota_top - 4}
            fill="#89ceff"
            fontFamily="JetBrains Mono"
            fontSize="9"
            fontWeight="600"
            textAnchor="middle"
          >
            b = {dims.bf} mm
          </text>
        </g>

        {/* Dimension Height h */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_cota_left}
            x2={x_cota_left}
            y1={y_outer}
            y2={y_bottom}
            stroke="#88929b"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow)"
            markerEnd="url(#cad-arrow)"
          />
          <line
            x1={x_cota_left - 3}
            x2={x_outer + 4}
            y1={y_outer}
            y2={y_outer}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <line
            x1={x_cota_left - 3}
            x2={x_outer + 4}
            y1={y_bottom}
            y2={y_bottom}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <text
            x={x_cota_left - 4}
            y={cy + 3}
            fill="#89ceff"
            fontFamily="JetBrains Mono"
            fontSize="9"
            fontWeight="600"
            textAnchor="end"
          >
            h = {dims.d}
          </text>
        </g>

        {/* Dimension Thickness t */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_right}
            x2={x_right + 22}
            y1={cy}
            y2={cy}
            stroke="#ffb95f"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow-amber)"
          />
          <text
            x={x_right + 26}
            y={cy + 3}
            fill="#ffb95f"
            fontFamily="JetBrains Mono"
            fontSize="8"
            fontWeight="600"
          >
            t: {dims.tw}
          </text>
        </g>
      </svg>
    );
  }

  // 3. CANTONEIRA L
  if (type === 'L') {
    const x_left = cx - w_px / 2;
    const x_right = cx + w_px / 2;
    const y_top = cy - h_px / 2;
    const y_bottom = cy + h_px / 2;

    const t_px = Math.max(
      4.5,
      Math.min(
        Math.min(w_px, h_px) * 0.35,
        (rawTf / Math.min(rawD, rawBf)) * Math.min(w_px, h_px) * 1.6 + 3
      )
    );

    const x_inner = x_left + t_px;
    const y_inner = y_bottom - t_px;

    const lPath = `
      M ${x_left.toFixed(1)} ${y_top.toFixed(1)}
      L ${x_inner.toFixed(1)} ${y_top.toFixed(1)}
      L ${x_inner.toFixed(1)} ${y_inner.toFixed(1)}
      L ${x_right.toFixed(1)} ${y_inner.toFixed(1)}
      L ${x_right.toFixed(1)} ${y_bottom.toFixed(1)}
      L ${x_left.toFixed(1)} ${y_bottom.toFixed(1)}
      Z
    `;

    const y_cota_bottom = y_bottom + 16;
    const x_cota_left = x_left - 16;

    return (
      <svg
        className="w-72 h-56 drop-shadow-sm select-none overflow-visible"
        viewBox="0 0 280 220"
      >
        {defs}
        {axes}

        {/* L Profile Solid Path */}
        <path
          d={lPath}
          fill="#181c24"
          stroke="#0ea5e9"
          strokeWidth="2"
          strokeLinejoin="round"
          className="transition-all duration-300 ease-out"
        />

        {/* Dimension b (horizontal leg) */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_left}
            x2={x_right}
            y1={y_cota_bottom}
            y2={y_cota_bottom}
            stroke="#88929b"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow)"
            markerEnd="url(#cad-arrow)"
          />
          <line
            x1={x_left}
            x2={x_left}
            y1={y_bottom - 2}
            y2={y_cota_bottom + 3}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <line
            x1={x_right}
            x2={x_right}
            y1={y_bottom - 2}
            y2={y_cota_bottom + 3}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <text
            x={cx}
            y={y_cota_bottom + 11}
            fill="#89ceff"
            fontFamily="JetBrains Mono"
            fontSize="9"
            fontWeight="600"
            textAnchor="middle"
          >
            b = {dims.bf} mm
          </text>
        </g>

        {/* Dimension a (vertical leg) */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_cota_left}
            x2={x_cota_left}
            y1={y_top}
            y2={y_bottom}
            stroke="#88929b"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow)"
            markerEnd="url(#cad-arrow)"
          />
          <line
            x1={x_cota_left - 3}
            x2={x_left + 4}
            y1={y_top}
            y2={y_top}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <line
            x1={x_cota_left - 3}
            x2={x_left + 4}
            y1={y_bottom}
            y2={y_bottom}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <text
            x={x_cota_left - 4}
            y={cy + 3}
            fill="#89ceff"
            fontFamily="JetBrains Mono"
            fontSize="9"
            fontWeight="600"
            textAnchor="end"
          >
            a = {dims.d}
          </text>
        </g>

        {/* Dimension t (leg thickness) */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_inner}
            x2={x_inner + 22}
            y1={y_top + 4}
            y2={y_top + 4}
            stroke="#ffb95f"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow-amber)"
          />
          <text
            x={x_inner + 26}
            y={y_top + 7}
            fill="#ffb95f"
            fontFamily="JetBrains Mono"
            fontSize="8"
            fontWeight="600"
          >
            t: {dims.tf}
          </text>
        </g>
      </svg>
    );
  }

  // 4. PERFIL U (CANAL)
  if (type === 'U') {
    const x_left = cx - w_px / 2;
    const x_right = cx + w_px / 2;
    const y_top = cy - h_px / 2;
    const y_bottom = cy + h_px / 2;

    const tf_px = Math.max(
      4.5,
      Math.min(h_px * 0.28, (rawTf / rawD) * h_px * 1.6 + 3.5)
    );
    const tw_px = Math.max(
      3.5,
      Math.min(w_px * 0.35, (rawTw / rawBf) * w_px * 1.6 + 2.5)
    );

    const x_web_inner = x_left + tw_px;
    const y_flange_topInner = y_top + tf_px;
    const y_flange_bottomInner = y_bottom - tf_px;

    const uPath = `
      M ${x_right.toFixed(1)} ${y_top.toFixed(1)}
      L ${x_right.toFixed(1)} ${y_flange_topInner.toFixed(1)}
      L ${x_web_inner.toFixed(1)} ${y_flange_topInner.toFixed(1)}
      L ${x_web_inner.toFixed(1)} ${y_flange_bottomInner.toFixed(1)}
      L ${x_right.toFixed(1)} ${y_flange_bottomInner.toFixed(1)}
      L ${x_right.toFixed(1)} ${y_bottom.toFixed(1)}
      L ${x_left.toFixed(1)} ${y_bottom.toFixed(1)}
      L ${x_left.toFixed(1)} ${y_top.toFixed(1)}
      Z
    `;

    const y_cota_top = y_top - 14;
    const x_cota_left = x_left - 16;
    const x_cota_right = x_right + 12;

    return (
      <svg
        className="w-72 h-56 drop-shadow-sm select-none overflow-visible"
        viewBox="0 0 280 220"
      >
        {defs}
        {axes}

        {/* U Profile Solid Path */}
        <path
          d={uPath}
          fill="#181c24"
          stroke="#0ea5e9"
          strokeWidth="2"
          strokeLinejoin="round"
          className="transition-all duration-300 ease-out"
        />

        {/* Dimension bf */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_left}
            x2={x_right}
            y1={y_cota_top}
            y2={y_cota_top}
            stroke="#88929b"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow)"
            markerEnd="url(#cad-arrow)"
          />
          <line
            x1={x_left}
            x2={x_left}
            y1={y_cota_top - 3}
            y2={y_top + 4}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <line
            x1={x_right}
            x2={x_right}
            y1={y_cota_top - 3}
            y2={y_top + 4}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <text
            x={cx}
            y={y_cota_top - 4}
            fill="#89ceff"
            fontFamily="JetBrains Mono"
            fontSize="9"
            fontWeight="600"
            textAnchor="middle"
          >
            bf = {dims.bf} mm
          </text>
        </g>

        {/* Dimension d */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_cota_left}
            x2={x_cota_left}
            y1={y_top}
            y2={y_bottom}
            stroke="#88929b"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow)"
            markerEnd="url(#cad-arrow)"
          />
          <line
            x1={x_cota_left - 3}
            x2={x_left + 4}
            y1={y_top}
            y2={y_top}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <line
            x1={x_cota_left - 3}
            x2={x_left + 4}
            y1={y_bottom}
            y2={y_bottom}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <text
            x={x_cota_left - 4}
            y={cy + 3}
            fill="#89ceff"
            fontFamily="JetBrains Mono"
            fontSize="9"
            fontWeight="600"
            textAnchor="end"
          >
            d = {dims.d}
          </text>
        </g>

        {/* Dimension tf */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_cota_right}
            x2={x_cota_right}
            y1={y_top}
            y2={y_flange_topInner}
            stroke="#88929b"
            strokeWidth="0.8"
            markerStart="url(#cad-arrow)"
            markerEnd="url(#cad-arrow)"
          />
          <line
            x1={x_right - 2}
            x2={x_cota_right + 5}
            y1={y_top}
            y2={y_top}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <line
            x1={x_right - 2}
            x2={x_cota_right + 5}
            y1={y_flange_topInner}
            y2={y_flange_topInner}
            stroke="#3e4850"
            strokeWidth="0.7"
          />
          <text
            x={x_cota_right + 7}
            y={y_top + tf_px / 2 + 3}
            fill="#ffb95f"
            fontFamily="JetBrains Mono"
            fontSize="8"
            fontWeight="600"
          >
            tf: {dims.tf}
          </text>
        </g>

        {/* Dimension tw */}
        <g className="transition-all duration-300 ease-out">
          <line
            x1={x_web_inner + 18}
            x2={x_web_inner}
            y1={cy - 12}
            y2={cy - 12}
            stroke="#0ea5e9"
            strokeWidth="0.8"
            markerEnd="url(#cad-arrow-cyan)"
          />
          <text
            x={x_web_inner + 22}
            y={cy - 9}
            fill="#89ceff"
            fontFamily="JetBrains Mono"
            fontSize="8"
          >
            tw: {dims.tw}
          </text>
        </g>
      </svg>
    );
  }

  // 5. PERFIL I / W (PADRÃO)
  const x_left = cx - w_px / 2;
  const x_right = cx + w_px / 2;
  const y_top = cy - h_px / 2;
  const y_bottom = cy + h_px / 2;

  const tf_px = Math.max(
    4.5,
    Math.min(h_px * 0.28, (rawTf / rawD) * h_px * 1.6 + 3.5)
  );
  const tw_px = Math.max(
    3.5,
    Math.min(w_px * 0.35, (rawTw / rawBf) * w_px * 1.6 + 2.5)
  );

  const x_web_left = cx - tw_px / 2;
  const x_web_right = cx + tw_px / 2;
  const y_flange_topInner = y_top + tf_px;
  const y_flange_bottomInner = y_bottom - tf_px;

  const iPath = `
    M ${x_left.toFixed(1)} ${y_top.toFixed(1)}
    L ${x_right.toFixed(1)} ${y_top.toFixed(1)}
    L ${x_right.toFixed(1)} ${y_flange_topInner.toFixed(1)}
    L ${x_web_right.toFixed(1)} ${y_flange_topInner.toFixed(1)}
    L ${x_web_right.toFixed(1)} ${y_flange_bottomInner.toFixed(1)}
    L ${x_right.toFixed(1)} ${y_flange_bottomInner.toFixed(1)}
    L ${x_right.toFixed(1)} ${y_bottom.toFixed(1)}
    L ${x_left.toFixed(1)} ${y_bottom.toFixed(1)}
    L ${x_left.toFixed(1)} ${y_flange_bottomInner.toFixed(1)}
    L ${x_web_left.toFixed(1)} ${y_flange_bottomInner.toFixed(1)}
    L ${x_web_left.toFixed(1)} ${y_flange_topInner.toFixed(1)}
    L ${x_left.toFixed(1)} ${y_flange_topInner.toFixed(1)}
    Z
  `;

  const y_cota_top = y_top - 14;
  const x_cota_left = x_left - 16;
  const x_cota_right = x_right + 12;

  return (
    <svg
      className="w-72 h-56 drop-shadow-sm select-none overflow-visible"
      viewBox="0 0 280 220"
    >
      {defs}
      {axes}

      {/* I Profile Solid Path with smooth CSS transition */}
      <path
        d={iPath}
        fill="#181c24"
        stroke="#0ea5e9"
        strokeWidth="2"
        strokeLinejoin="round"
        className="transition-all duration-300 ease-out"
      />

      {/* Dimension bf (flange width) */}
      <g className="transition-all duration-300 ease-out">
        <line
          x1={x_left}
          x2={x_right}
          y1={y_cota_top}
          y2={y_cota_top}
          stroke="#88929b"
          strokeWidth="0.8"
          markerStart="url(#cad-arrow)"
          markerEnd="url(#cad-arrow)"
        />
        <line
          x1={x_left}
          x2={x_left}
          y1={y_cota_top - 3}
          y2={y_top + 4}
          stroke="#3e4850"
          strokeWidth="0.7"
        />
        <line
          x1={x_right}
          x2={x_right}
          y1={y_cota_top - 3}
          y2={y_top + 4}
          stroke="#3e4850"
          strokeWidth="0.7"
        />
        <text
          x={cx}
          y={y_cota_top - 4}
          fill="#89ceff"
          fontFamily="JetBrains Mono"
          fontSize="9"
          fontWeight="600"
          textAnchor="middle"
        >
          bf = {dims.bf} mm
        </text>
      </g>

      {/* Dimension d (total depth/height) */}
      <g className="transition-all duration-300 ease-out">
        <line
          x1={x_cota_left}
          x2={x_cota_left}
          y1={y_top}
          y2={y_bottom}
          stroke="#88929b"
          strokeWidth="0.8"
          markerStart="url(#cad-arrow)"
          markerEnd="url(#cad-arrow)"
        />
        <line
          x1={x_cota_left - 3}
          x2={x_left + 4}
          y1={y_top}
          y2={y_top}
          stroke="#3e4850"
          strokeWidth="0.7"
        />
        <line
          x1={x_cota_left - 3}
          x2={x_left + 4}
          y1={y_bottom}
          y2={y_bottom}
          stroke="#3e4850"
          strokeWidth="0.7"
        />
        <text
          x={x_cota_left - 4}
          y={cy + 3}
          fill="#89ceff"
          fontFamily="JetBrains Mono"
          fontSize="9"
          fontWeight="600"
          textAnchor="end"
        >
          d = {dims.d}
        </text>
      </g>

      {/* Dimension tf (flange thickness) */}
      <g className="transition-all duration-300 ease-out">
        <line
          x1={x_cota_right}
          x2={x_cota_right}
          y1={y_top}
          y2={y_flange_topInner}
          stroke="#88929b"
          strokeWidth="0.8"
          markerStart="url(#cad-arrow)"
          markerEnd="url(#cad-arrow)"
        />
        <line
          x1={x_right - 2}
          x2={x_cota_right + 5}
          y1={y_top}
          y2={y_top}
          stroke="#3e4850"
          strokeWidth="0.7"
        />
        <line
          x1={x_right - 2}
          x2={x_cota_right + 5}
          y1={y_flange_topInner}
          y2={y_flange_topInner}
          stroke="#3e4850"
          strokeWidth="0.7"
        />
        <text
          x={x_cota_right + 7}
          y={y_top + tf_px / 2 + 3}
          fill="#ffb95f"
          fontFamily="JetBrains Mono"
          fontSize="8"
          fontWeight="600"
        >
          tf: {dims.tf}
        </text>
      </g>

      {/* Dimension tw (web thickness) */}
      <g className="transition-all duration-300 ease-out">
        <line
          x1={x_web_left - 22}
          x2={x_web_left}
          y1={cy - 12}
          y2={cy - 12}
          stroke="#0ea5e9"
          strokeWidth="0.8"
          markerEnd="url(#cad-arrow-cyan)"
        />
        <text
          x={x_web_left - 25}
          y={cy - 9}
          fill="#89ceff"
          fontFamily="JetBrains Mono"
          fontSize="8"
          textAnchor="end"
        >
          tw: {dims.tw}
        </text>
      </g>
    </svg>
  );
};
