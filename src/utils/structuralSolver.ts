import { CalculationResults, LoadItem, SteelGrade, SteelProfile, SupportPositions, SupportType } from '../types';

export function solveBeam(
  spanLength: number,
  supportType: SupportType,
  loads: LoadItem[],
  profile: SteelProfile,
  steelGrade: SteelGrade,
  supportPositions?: SupportPositions
): CalculationResults {
  const L = Math.max(spanLength, 0.5);
  const numPoints = 120;
  const dx = L / (numPoints - 1);
  const xCoords: number[] = Array.from({ length: numPoints }, (_, i) => i * dx);

  // Determine actual support positions along the beam (in meters)
  const rawPosA = supportPositions?.posA ?? 0;
  const rawPosB = supportPositions?.posB ?? L;
  const posA = Math.max(0, Math.min(rawPosA, L - 0.1));
  const posB = Math.max(posA + 0.1, Math.min(rawPosB, L));
  const posC = supportPositions?.posC !== undefined
    ? Math.max(posA + 0.05, Math.min(supportPositions.posC, posB - 0.05))
    : (posA + posB) / 2;

  // 1. Calculate Equivalent Factored Loads & Static Moments
  let totalFactoredLoad = 0;
  let totalMomentAboutSupportA = 0;

  loads.forEach((load) => {
    const factor = load.gammaF || 1.4;
    if (load.type === 'distributed') {
      const q = load.value * factor;
      const xStart = Math.max(0, Math.min(load.positionX, L));
      const len = Math.max(0, Math.min(load.length ?? L, L - xStart));
      const P_eq = q * len;
      const x_centroid = xStart + len / 2;
      totalFactoredLoad += P_eq;
      totalMomentAboutSupportA += P_eq * (x_centroid - posA);
    } else if (load.type === 'point') {
      const P = load.value * factor;
      const x = Math.max(0, Math.min(load.positionX, L));
      totalFactoredLoad += P;
      totalMomentAboutSupportA += P * (x - posA);
    } else if (load.type === 'moment') {
      const M = load.value * factor;
      totalMomentAboutSupportA += M;
    }
  });

  // 2. Calculate Support Reactions
  let reactionA = 0;
  let reactionB = 0;
  let reactionC: number | undefined = undefined;

  if (totalFactoredLoad > 0 || Math.abs(totalMomentAboutSupportA) > 0) {
    if (supportType === 'biapoiada') {
      const spanAB = Math.max(posB - posA, 0.1);
      reactionB = totalMomentAboutSupportA / spanAB;
      reactionA = totalFactoredLoad - reactionB;
    } else if (supportType === 'cantilever') {
      reactionA = totalFactoredLoad;
      reactionB = 0;
    } else if (supportType === 'biengastada') {
      reactionA = totalFactoredLoad * 0.5;
      reactionB = totalFactoredLoad * 0.5;
    } else if (supportType === 'continua') {
      reactionA = totalFactoredLoad * 0.375;
      reactionB = totalFactoredLoad * 1.25;
      reactionC = totalFactoredLoad * 0.375;
    }
  }

  // 3. Compute Shear Force V(x) & Bending Moment M(x) along the beam
  const shearCurve: { x: number; v: number }[] = [];
  const momentCurve: { x: number; m: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const x = xCoords[i];
    let V = 0;
    let M = 0;

    if (totalFactoredLoad > 0 || Math.abs(totalMomentAboutSupportA) > 0) {
      if (supportType === 'biapoiada') {
        // Upward support reactions
        if (x >= posA) {
          V += reactionA;
          M += reactionA * (x - posA);
        }
        if (x >= posB) {
          V += reactionB;
          M += reactionB * (x - posB);
        }

        // Downward loads
        loads.forEach((load) => {
          const factor = load.gammaF || 1.4;
          if (load.type === 'distributed') {
            const q = load.value * factor;
            const xStart = Math.max(0, Math.min(load.positionX, L));
            const len = Math.max(0, Math.min(load.length ?? L, L - xStart));
            const xEnd = xStart + len;

            if (x > xStart) {
              const loadedLength = Math.min(x, xEnd) - xStart;
              const P_partial = q * loadedLength;
              const centroid = xStart + loadedLength / 2;
              V -= P_partial;
              M -= P_partial * (x - centroid);
            }
          } else if (load.type === 'point') {
            const P = load.value * factor;
            const xPos = load.positionX;
            if (x >= xPos) {
              V -= P;
              M -= P * (x - xPos);
            }
          } else if (load.type === 'moment') {
            const M_ext = load.value * factor;
            if (x >= load.positionX) {
              M -= M_ext;
            }
          }
        });
      } else if (supportType === 'cantilever') {
        // Cantilever with clamp at posA
        const clampingMoment = -totalMomentAboutSupportA;
        if (x >= posA) {
          V += reactionA;
          M += clampingMoment + reactionA * (x - posA);
        }

        loads.forEach((load) => {
          const factor = load.gammaF || 1.4;
          if (load.type === 'distributed') {
            const q = load.value * factor;
            const xStart = Math.max(0, Math.min(load.positionX, L));
            const len = Math.max(0, Math.min(load.length ?? L, L - xStart));
            const xEnd = xStart + len;

            if (x > xStart) {
              const loadedLength = Math.min(x, xEnd) - xStart;
              const P_partial = q * loadedLength;
              const centroid = xStart + loadedLength / 2;
              V -= P_partial;
              M -= P_partial * (x - centroid);
            }
          } else if (load.type === 'point') {
            const P = load.value * factor;
            const xPos = load.positionX;
            if (x >= xPos) {
              V -= P;
              M -= P * (x - xPos);
            }
          }
        });
      } else if (supportType === 'biengastada') {
        const M_fix = (totalFactoredLoad * L) / 12;
        V = reactionA - (totalFactoredLoad / L) * x;
        M = -M_fix + reactionA * x - 0.5 * (totalFactoredLoad / L) * x * x;
      } else {
        // Continuous beam
        V = reactionA - (totalFactoredLoad / L) * x;
        M = reactionA * x - 0.5 * (totalFactoredLoad / L) * x * x;
      }
    }

    shearCurve.push({ x: Number(x.toFixed(3)), v: Number(V.toFixed(2)) });
    momentCurve.push({ x: Number(x.toFixed(3)), m: Number(M.toFixed(2)) });
  }

  // 4. Find Extreme Values
  let maxShearPos = 0;
  let maxShearNeg = 0;
  let shearZeroX = (posA + posB) / 2;
  let maxMoment = 0;
  let maxMomentX = (posA + posB) / 2;

  shearCurve.forEach((pt, idx) => {
    if (pt.v > maxShearPos) maxShearPos = pt.v;
    if (pt.v < maxShearNeg) maxShearNeg = pt.v;

    // Zero shear crossing
    if (idx > 0 && shearCurve[idx - 1].v >= 0 && pt.v < 0) {
      shearZeroX = pt.x;
    }
  });

  momentCurve.forEach((pt) => {
    const absM = Math.abs(pt.m);
    if (absM > Math.abs(maxMoment)) {
      maxMoment = pt.m;
      maxMomentX = pt.x;
    }
  });

  // 5. Compute Deflection Curve (Elastic Line Integration)
  // E in GPa -> E * 10^6 kN/m²
  // Ix in cm⁴ -> Ix * 10^-8 m⁴
  // EI in kN·m² = (E * 10^6) * (Ix * 10^-8) = E * Ix * 0.01
  const E_kN_m2 = steelGrade.E * 1e6;
  const Ix_m4 = profile.inertia_Ix * 1e-8;
  const EI = Math.max(E_kN_m2 * Ix_m4, 1.0);

  const deflectionCurve: { x: number; d: number }[] = [];
  let maxDeflection = 0;
  let maxDeflectionX = (posA + posB) / 2;

  if (totalFactoredLoad > 0) {
    // Numerically integrate unfactored moments: M_unf = M / 1.4
    // d²w/dx² = -M_unf / EI
    const I1: number[] = new Array(numPoints).fill(0);
    const I2: number[] = new Array(numPoints).fill(0);

    for (let i = 1; i < numPoints; i++) {
      const m_avg = ((momentCurve[i - 1].m + momentCurve[i].m) / 2) / 1.4;
      I1[i] = I1[i - 1] + m_avg * dx;
    }

    for (let i = 1; i < numPoints; i++) {
      const i1_avg = (I1[i - 1] + I1[i]) / 2;
      I2[i] = I2[i - 1] + i1_avg * dx;
    }

    // Interpolate I2 at posA and posB
    const getI2At = (px: number) => {
      const idx = Math.max(0, Math.min(Math.floor(px / dx), numPoints - 2));
      const rem = (px - idx * dx) / dx;
      return I2[idx] * (1 - rem) + I2[idx + 1] * rem;
    };

    let C1 = 0;
    let C0 = 0;

    if (supportType === 'cantilever') {
      const idxA = Math.max(0, Math.min(Math.floor(posA / dx), numPoints - 2));
      C1 = I1[idxA];
      C0 = getI2At(posA) - C1 * posA;
    } else {
      const distAB = Math.max(posB - posA, 0.1);
      C1 = (getI2At(posB) - getI2At(posA)) / distAB;
      C0 = getI2At(posA) - C1 * posA;
    }

    for (let i = 0; i < numPoints; i++) {
      const x = xCoords[i];
      // w in meters: (C0 + C1 * x - I2[i]) / EI
      const w_m = (C0 + C1 * x - I2[i]) / EI;
      const d_mm = Number((w_m * 1000).toFixed(2));
      deflectionCurve.push({ x: Number(x.toFixed(3)), d: d_mm });

      if (Math.abs(d_mm) > Math.abs(maxDeflection)) {
        maxDeflection = d_mm;
        maxDeflectionX = x;
      }
    }
  } else {
    // Zero deflection when no load is applied
    for (let i = 0; i < numPoints; i++) {
      deflectionCurve.push({ x: Number(xCoords[i].toFixed(3)), d: 0 });
    }
  }

  // 6. Section Capacities according to NBR 8800:2008 & AISC 360-16
  const gamma_a1 = 1.10;
  const allowableStress_fyd = Number((steelGrade.fy / gamma_a1).toFixed(1)); // MPa
  const momentCapacity_Mrd = Number(((profile.plasticModulus_Zx * steelGrade.fy) / (gamma_a1 * 1000)).toFixed(2));
  
  let Aw_mm2 = 1.0;
  if (profile.family === 'TUB_CIRC') {
    // Round tube: effective shear area is A / 2 per NBR 8800 item 5.4.3
    Aw_mm2 = Math.max((profile.area_A * 100) / 2, 1.0);
  } else if (profile.family === 'TUB_RET' || profile.family === 'TUB_QUAD') {
    // Rectangular/square tube: 2 webs carry vertical shear
    Aw_mm2 = Math.max(2 * profile.depth_d * profile.webThickness_tw, 1.0);
  } else {
    // I / W / U / L: vertical web / leg carries shear
    Aw_mm2 = Math.max(profile.depth_d * profile.webThickness_tw, 1.0);
  }

  const Aw_cm2 = Aw_mm2 / 100;
  const shearCapacity_Vrd = Number(((0.60 * Aw_cm2 * steelGrade.fy) / (gamma_a1 * 10)).toFixed(2));
  const Wx_cm3 = Math.max(profile.elasticModulus_Wx, 1.0);

  // 7. Von Mises Equivalent Stress Analysis (σ_VM = √(σ² + 3τ²))
  const vonMisesCurve: { x: number; vm: number; sigma: number; tau: number }[] = [];
  let normalStressMax = 0;
  let normalStressMaxX = (posA + posB) / 2;
  let shearStressMax = 0;
  let shearStressMaxX = posA;
  let vonMisesMax = 0;
  let vonMisesMaxX = (posA + posB) / 2;

  const d = Math.max(profile.depth_d, 10);
  const tf = Math.max(profile.flangeThickness_tf, 1);
  const webFlangeRatio = d > 2 * tf ? (d - 2 * tf) / d : 0.85;

  for (let i = 0; i < numPoints; i++) {
    const x = xCoords[i];
    const absM = Math.abs(momentCurve[i].m);
    const absV = Math.abs(shearCurve[i].v);

    // Normal bending stress at extreme fibers (MPa): M [kNm = 10^6 Nmm] / Wx [cm³ = 10^3 mm³]
    const sigma_flange = Number(((absM * 1000) / Wx_cm3).toFixed(2));

    // Shear stress in the web (MPa): V [kN = 1000 N] / Aw [mm²]
    const tau = Number(((absV * 1000) / Aw_mm2).toFixed(2));

    // Normal stress at web-flange junction
    const sigma_junction = sigma_flange * webFlangeRatio;

    // Von Mises stress at junction: √(σ_wf² + 3·τ²)
    const vm_junction = Math.sqrt(sigma_junction * sigma_junction + 3 * tau * tau);

    // Maximum Von Mises stress across the cross-section at coordinate x:
    // Flange extreme fiber: σ_flange (since τ≈0)
    // Neutral axis: √3 · τ (since σ=0)
    // Web-flange junction: vm_junction (combined interaction)
    const vm_x = Number(Math.max(sigma_flange, Math.sqrt(3) * tau, vm_junction).toFixed(2));

    if (sigma_flange > normalStressMax) {
      normalStressMax = sigma_flange;
      normalStressMaxX = x;
    }
    if (tau > shearStressMax) {
      shearStressMax = tau;
      shearStressMaxX = x;
    }
    if (vm_x > vonMisesMax) {
      vonMisesMax = vm_x;
      vonMisesMaxX = x;
    }

    vonMisesCurve.push({
      x: Number(x.toFixed(3)),
      vm: vm_x,
      sigma: sigma_flange,
      tau,
    });
  }

  const vonMisesRatio = allowableStress_fyd > 0 ? Math.round((vonMisesMax / allowableStress_fyd) * 100) : 0;

  // 8. Verification Ratios (ELS & ELU)
  const allowableDeflection = Number(((posB - posA) * 1000 / 350).toFixed(1)); // L_vão / 350 per NBR 8800
  const deflectionRatio = allowableDeflection > 0 ? Math.round((Math.abs(maxDeflection) / allowableDeflection) * 100) : 0;
  const momentRatio = momentCapacity_Mrd > 0 ? Math.round((Math.abs(maxMoment) / momentCapacity_Mrd) * 100) : 0;
  const shearRatio = shearCapacity_Vrd > 0 ? Math.round((Math.max(Math.abs(maxShearPos), Math.abs(maxShearNeg)) / shearCapacity_Vrd) * 100) : 0;

  const isFailed = momentRatio > 100 || shearRatio > 100 || deflectionRatio > 100 || vonMisesRatio > 100;
  const isAlert = momentRatio > 85 || shearRatio > 85 || deflectionRatio > 85 || vonMisesRatio > 85;
  const hasLoads = loads.length > 0 && loads.some((l) => Number(l.value) > 0);
  const status: 'PASS' | 'ALERT' | 'FAIL' | 'NONE' = !hasLoads ? 'NONE' : isFailed ? 'FAIL' : isAlert ? 'ALERT' : 'PASS';

  return {
    reactionA: Number(reactionA.toFixed(2)),
    reactionB: Number(reactionB.toFixed(2)),
    reactionC: reactionC !== undefined ? Number(reactionC.toFixed(2)) : undefined,
    totalVerticalLoad: Number(totalFactoredLoad.toFixed(2)),
    maxMoment: Number(maxMoment.toFixed(2)),
    maxMomentX: Number(maxMomentX.toFixed(2)),
    maxShearPos: Number(maxShearPos.toFixed(2)),
    maxShearNeg: Number(maxShearNeg.toFixed(2)),
    shearZeroX: Number(shearZeroX.toFixed(2)),
    maxDeflection: Number(maxDeflection.toFixed(2)),
    maxDeflectionX: Number(maxDeflectionX.toFixed(2)),
    allowableDeflection,
    deflectionRatio,
    momentCapacity_Mrd,
    shearCapacity_Vrd,
    momentRatio,
    shearRatio,
    normalStressMax: Number(normalStressMax.toFixed(2)),
    normalStressMaxX: Number(normalStressMaxX.toFixed(2)),
    shearStressMax: Number(shearStressMax.toFixed(2)),
    shearStressMaxX: Number(shearStressMaxX.toFixed(2)),
    vonMisesMax: Number(vonMisesMax.toFixed(2)),
    vonMisesMaxX: Number(vonMisesMaxX.toFixed(2)),
    allowableStress_fyd,
    vonMisesRatio,
    status,
    shearCurve,
    momentCurve,
    deflectionCurve,
    vonMisesCurve,
  };
}
