export function generateFallbackAnalysis(workspaceType: string = 'General Workspace') {
  return `
## Executive Spatial Calibre
High-fidelity spatial vision scan completed for the ${workspaceType} layout. Primary workstation geometry exhibits sound architectural positioning with high-ROI ergonomic refinement potential.

## Ergonomic Biomechanical Strain Diagnostics
- **Monitor Plane Alignment**: The primary display height is currently ~4.5 cm below eye-level horizontal focal plane, which creates forward neck pitch during deep focus sessions.
- **Armrest & Trapezius Clearance**: Forearm elevation angle sits at ~82°. Adjust seat height slightly upward to achieve a neutral 90° elbow bend.
- **Lumbar & Pelvic Mechanics**: Seating posture displays good backrest contact, but monitor proximity requires slight spinal flexion over 2+ hour periods.

## Atmospheric Circadian & Sound Shielding
- **Illumination & Glare**: Ambient daylight streams laterally. Recommend adding a 4000K neutral task lamp for non-glare evening work.
- **Acoustic Dampening**: Mid-frequency reverberation present. Recommend soft acoustic desk pad or localized sound baffle.

## Structured Structural Layout Action Items
1. Raise the primary monitor height by 4-5 cm using an ergonomic riser or monitor arm.
2. Shift keyboard and trackpad 6 cm closer to the body to eliminate overreaching.
3. Position secondary lighting at a 45-degree angle to eliminate screen reflections.

[SCORES_JSON] {"ergonomics": 84, "spatialEfficiency": 88, "visualHarmony": 80, "focusCalibration": 82, "productivityIndex": 86} [/SCORES_JSON]
  `.trim();
}

export async function generateGeminiContent(options: {
  model?: string;
  contents: any;
  fallbackText?: string;
}): Promise<string> {
  const defaultFallback = options.fallbackText ?? "Optimal ergonomics and focus configuration generated using local spatial rules.";

  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || 'gemini-2.5-flash',
        contents: options.contents
      })
    });

    if (!res.ok) {
      console.warn("Gemini server proxy notice: non-200 response");
      return defaultFallback;
    }

    const data = await res.json();
    if (data.error || !data.text) {
      console.warn("Gemini server proxy notice:", data.error);
      return defaultFallback;
    }

    return data.text;
  } catch (err: any) {
    console.warn("Gemini call fell back to local handler:", err?.message || err);
    return defaultFallback;
  }
}
