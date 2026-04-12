import express, { Request, Response } from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { authenticateToken } from '../middleware/auth.js';
import { keyManager, QuotaExhaustedError } from '../services/geminiKeyManager.js';

const router = express.Router();

// ─── Multer (in-memory storage) ──────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (/image\/(jpeg|jpg|png|webp)/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WEBP images are accepted'));
    }
  },
});

// ─── Full component library map (type → name + keywords) ────────────────────
// Mirrors ComponentFactory.getComponentInfo() on the frontend
const COMPONENT_LIBRARY: Record<string, { name: string; keywords: string[] }> = {
  signal_generator:        { name: 'Signal Generator',           keywords: ['signal', 'generator', 'rf', 'source', 'frequency', 'sig gen'] },
  function_generator:      { name: 'Function Generator',         keywords: ['function', 'generator', 'sine', 'square', 'waveform', 'pulse'] },
  vector_signal_generator: { name: 'Vector Signal Generator',   keywords: ['vector', 'signal', 'generator', 'iq', 'modulated', 'vsg'] },
  oscillator:              { name: 'Oscillator',                 keywords: ['oscillator', 'osc', 'periodic', 'sinusoidal'] },
  noise_source:            { name: 'Noise Source',               keywords: ['noise', 'source', 'white', 'colored'] },
  gunn_diode_oscillator:   { name: 'Gunn Diode Oscillator',     keywords: ['gunn', 'diode', 'oscillator', 'x-band', 'microwave'] },
  klystron_oscillator:     { name: 'Klystron Oscillator',       keywords: ['klystron', 'oscillator', 'reflex', 'tube'] },
  magnetron:               { name: 'Magnetron',                  keywords: ['magnetron', 'cavity', 'high-power', 'oscillator'] },
  vco:                     { name: 'VCO',                        keywords: ['vco', 'voltage', 'controlled', 'oscillator', 'tunable'] },
  resistor:                { name: 'Resistor',                   keywords: ['resistor', 'resistance', 'r', 'ohm', 'passive'] },
  capacitor:               { name: 'Capacitor',                  keywords: ['capacitor', 'capacitance', 'c', 'farad', 'passive'] },
  inductor:                { name: 'Inductor',                   keywords: ['inductor', 'inductance', 'l', 'henry', 'coil', 'passive'] },
  transmission_line:       { name: 'Transmission Line',         keywords: ['transmission', 'line', 'tl', 'coax', 'impedance'] },
  rf_load:                 { name: 'RF Load',                    keywords: ['load', 'termination', '50 ohm', 'rf', 'matched'] },
  cavity_resonator:        { name: 'Cavity Resonator',          keywords: ['cavity', 'resonator', 'high-q', 'resonant'] },
  amplifier:               { name: 'Amplifier',                  keywords: ['amplifier', 'amp', 'gain', 'lna', 'pa', 'rf', 'active'] },
  mixer:                   { name: 'Mixer',                      keywords: ['mixer', 'frequency', 'conversion', 'lo', 'if', 'rf'] },
  attenuator:              { name: 'Attenuator',                 keywords: ['attenuator', 'attenuation', 'atten', 'pad', 'loss'] },
  phase_shifter:           { name: 'Phase Shifter',              keywords: ['phase', 'shifter', 'shift', 'delay', 'ps'] },
  high_power_attenuator:   { name: 'High-Power Attenuator',     keywords: ['high', 'power', 'attenuator', '30db', '50w', 'protection'] },
  frequency_multiplier:    { name: 'Frequency Multiplier',      keywords: ['frequency', 'multiplier', 'doubler', 'tripler', 'harmonic'] },
  power_splitter:          { name: 'Power Splitter',             keywords: ['power', 'splitter', 'divider', 'split', 'divide'] },
  power_combiner:          { name: 'Power Combiner',             keywords: ['power', 'combiner', 'combine', 'sum'] },
  directional_coupler:     { name: 'Directional Coupler',       keywords: ['directional', 'coupler', 'coupling', '4-port'] },
  hybrid_coupler:          { name: 'Hybrid Coupler',             keywords: ['hybrid', 'coupler', '90', '180', 'quadrature'] },
  wilkinson_divider:       { name: 'Wilkinson Divider',         keywords: ['wilkinson', 'divider', 'splitter', 'isolated'] },
  lowpass_filter:          { name: 'Lowpass Filter',             keywords: ['lowpass', 'low', 'pass', 'filter', 'lpf', 'cutoff'] },
  highpass_filter:         { name: 'Highpass Filter',            keywords: ['highpass', 'high', 'pass', 'filter', 'hpf', 'cutoff'] },
  bandpass_filter:         { name: 'Bandpass Filter',            keywords: ['bandpass', 'band', 'pass', 'filter', 'bpf', 'bandwidth'] },
  bandstop_filter:         { name: 'Bandstop Filter',            keywords: ['bandstop', 'band', 'stop', 'filter', 'bsf', 'notch', 'reject'] },
  rectangular_waveguide:   { name: 'Rectangular Waveguide',     keywords: ['rectangular', 'waveguide', 'wg', 'wr', 'hollow'] },
  circular_waveguide:      { name: 'Circular Waveguide',        keywords: ['circular', 'waveguide', 'round', 'te11'] },
  coaxial_line:            { name: 'Coaxial Line',               keywords: ['coaxial', 'coax', 'line', 'cable', '50 ohm'] },
  microstrip_line:         { name: 'Microstrip Line',            keywords: ['microstrip', 'pcb', 'planar', 'line', 'substrate'] },
  stripline:               { name: 'Stripline',                  keywords: ['stripline', 'embedded', 'pcb', 'line'] },
  cpw_line:                { name: 'CPW Line',                   keywords: ['cpw', 'coplanar', 'waveguide', 'ground'] },
  waveguide_tee:           { name: 'Waveguide Tee',              keywords: ['waveguide', 'tee', 'junction', 'e-plane', 'h-plane'] },
  waveguide_bend:          { name: 'Waveguide Bend',             keywords: ['waveguide', 'bend', 'elbow', 'corner'] },
  waveguide_twist:         { name: 'Waveguide Twist',            keywords: ['waveguide', 'twist', 'rotate', 'polarization'] },
  waveguide_coax_adapter:  { name: 'Waveguide Coax Adapter',    keywords: ['waveguide', 'coax', 'adapter', 'transition'] },
  waveguide_termination:   { name: 'Waveguide Termination',     keywords: ['waveguide', 'termination', 'load', 'matched', 'absorb'] },
  circulator:              { name: 'Circulator',                 keywords: ['circulator', 'ferrite', 'non-reciprocal', '3-port'] },
  isolator:                { name: 'Isolator',                   keywords: ['isolator', 'one-way', 'unidirectional', 'isolation'] },
  dipole_antenna:          { name: 'Dipole Antenna',             keywords: ['dipole', 'antenna', 'half-wave', 'balanced'] },
  monopole_antenna:        { name: 'Monopole Antenna',           keywords: ['monopole', 'whip', 'antenna', 'quarter-wave'] },
  patch_antenna:           { name: 'Patch Antenna',              keywords: ['patch', 'antenna', 'microstrip', 'pcb', 'printed'] },
  horn_antenna:            { name: 'Horn Antenna',               keywords: ['horn', 'antenna', 'pyramidal', 'conical', 'standard gain'] },
  parabolic_antenna:       { name: 'Parabolic Antenna',         keywords: ['parabolic', 'dish', 'antenna', 'reflector', 'high gain'] },
  yagi_antenna:            { name: 'Yagi Antenna',               keywords: ['yagi', 'uda', 'antenna', 'directional', 'parasitic'] },
  loop_antenna:            { name: 'Loop Antenna',               keywords: ['loop', 'antenna', 'figure-8', 'magnetic'] },
  helical_antenna:         { name: 'Helical Antenna',            keywords: ['helical', 'helix', 'antenna', 'axial', 'spiral'] },
  reflector:               { name: 'Reflector',                  keywords: ['reflector', 'diffractor', 'metal', 'dielectric'] },
  antenna_positioner:      { name: 'Antenna Positioner',        keywords: ['positioner', 'antenna', 'azimuth', 'elevation', 'rotator'] },
  power_meter:             { name: 'Power Meter',                keywords: ['power', 'meter', 'wattmeter', 'rf', 'measurement'] },
  spectrum_analyzer:       { name: 'Spectrum Analyzer',         keywords: ['spectrum', 'analyzer', 'analyser', 'frequency', 'domain', 'sa', 'rsa'] },
  network_analyzer:        { name: 'Network Analyzer',          keywords: ['network', 'analyzer', 'vna', 'vector', 's-parameter', 's11', 's21'] },
  oscilloscope:            { name: 'Oscilloscope',               keywords: ['oscilloscope', 'scope', 'time', 'domain', 'waveform'] },
  frequency_counter:       { name: 'Frequency Counter',         keywords: ['frequency', 'counter', 'measurement', 'precision'] },
  signal_analyzer:         { name: 'Signal Analyzer',           keywords: ['signal', 'analyzer', 'analyser', 'vector', 'iq', 'modulation'] },
  swr_meter:               { name: 'SWR Meter',                  keywords: ['swr', 'vswr', 'standing', 'wave', 'ratio', 'reflection'] },
  field_strength_meter:    { name: 'Field Strength Meter',      keywords: ['field', 'strength', 'meter', 'emc', 'antenna'] },
  slotted_line:            { name: 'Slotted Line',               keywords: ['slotted', 'line', 'probe', 'vswr', 'impedance', 'standing'] },
  noise_figure_analyzer:   { name: 'Noise Figure Analyzer',     keywords: ['noise', 'figure', 'analyzer', 'nf', 'amplifier'] },
  free_space_kit:          { name: 'Free-Space Measurement Kit',keywords: ['free', 'space', 'kit', 'dielectric', 'characterization', 'focused'] },
  dc_power_supply:         { name: 'DC Power Supply',            keywords: ['dc', 'power', 'supply', 'bias', 'voltage', 'psu'] },
  multimeter:              { name: 'Multimeter',                 keywords: ['multimeter', 'dmm', 'volt', 'current', 'resistance', 'meter'] },
  anechoic_chamber:        { name: 'Anechoic Chamber',          keywords: ['anechoic', 'chamber', 'shielded', 'absorber', 'emc'] },
  antenna_mast:            { name: 'Antenna Mast',               keywords: ['mast', 'stand', 'antenna', 'support', 'non-metallic'] },
  turntable:               { name: 'Turntable',                  keywords: ['turntable', 'rotator', 'dut', 'pattern', 'measurement'] },
  ground_plane:            { name: 'Ground Plane',               keywords: ['ground', 'plane', 'board', 'reference', 'conductive'] },
  microwave_absorber:      { name: 'Microwave Absorber',        keywords: ['absorber', 'foam', 'tile', 'anechoic', 'microwave'] },
  sma_connector:           { name: 'SMA Connector',              keywords: ['sma', 'connector', '18ghz', '50 ohm', 'threaded'] },
  n_connector:             { name: 'N-Type Connector',           keywords: ['n-type', 'n type', 'connector', '18ghz', 'weather', 'sealed'] },
  bnc_connector:           { name: 'BNC Connector',              keywords: ['bnc', 'connector', 'bayonet', '4ghz'] },
  k_connector:             { name: 'K-Type Connector',           keywords: ['k-type', 'k type', 'connector', '40ghz', 'precision'] },
  mm_connector_292:        { name: '2.92mm Connector',          keywords: ['2.92', 'mm', 'connector', '40ghz', 'k-band'] },
  mm_connector_185:        { name: '1.85mm Connector',          keywords: ['1.85', 'mm', 'connector', '67ghz', 'v-band'] },
  balun:                   { name: 'Balun',                      keywords: ['balun', 'balanced', 'unbalanced', 'transformer', 'dipole'] },
  semi_rigid_cable:        { name: 'Semi-Rigid Cable',          keywords: ['semi-rigid', 'semi rigid', 'cable', 'coaxial', '0.141'] },
  flexible_rf_cable:       { name: 'Flexible RF Cable',         keywords: ['flexible', 'rf', 'cable', 'coaxial', 'bench'] },
  rogers_substrate:        { name: 'Rogers Substrate',          keywords: ['rogers', 'ro4003', 'substrate', 'pcb', 'rf'] },
  rt_duroid_substrate:     { name: 'RT/duroid Substrate',       keywords: ['duroid', 'rt', '5880', 'substrate', 'ptfe', 'low-loss'] },
  fr4_substrate:           { name: 'FR4 Substrate',              keywords: ['fr4', 'substrate', 'pcb', 'standard'] },
  pin_diode:               { name: 'PIN Diode',                  keywords: ['pin', 'diode', 'switch', 'limiter', 'attenuator'] },
  schottky_diode:          { name: 'Schottky Diode',             keywords: ['schottky', 'diode', 'detector', 'mixer', 'fast'] },
  varactor_diode:          { name: 'Varactor Diode',             keywords: ['varactor', 'diode', 'varicap', 'tunable', 'capacitance'] },
  hemt:                    { name: 'HEMT',                       keywords: ['hemt', 'gaas', 'fet', 'transistor', 'low-noise', 'microwave'] },
  bias_tee:                { name: 'Bias Tee',                   keywords: ['bias', 'tee', 'dc', 'rf', 'superimpose'] },
};

// ─── Fuzzy match: detected name → ComponentType key ─────────────────────────
function matchComponent(detected: string): string | null {
  const lc = detected.toLowerCase().trim();

  // 1. Exact name match
  for (const [type, info] of Object.entries(COMPONENT_LIBRARY)) {
    if (info.name.toLowerCase() === lc) return type;
  }

  // 2. Keyword scoring — return best match if score ≥ 2
  const words = lc.split(/\s+/);
  let bestType: string | null = null;
  let bestScore = 1; // minimum threshold

  for (const [type, info] of Object.entries(COMPONENT_LIBRARY)) {
    let score = 0;
    for (const word of words) {
      if (word.length < 3) continue;
      if (info.name.toLowerCase().includes(word)) score += 2;
      if (info.keywords.some(k => k.includes(word) || word.includes(k))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestType;
}

// ─── Helper: call Gemini with automatic key rotation on 429 ──────────────────
async function callGeminiWithRotation(
  params: Omit<Parameters<GoogleGenAI['models']['generateContent']>[0], never>,
): Promise<string> {
  const MAX_ATTEMPTS = keyManager.totalCount() + 1; // try each key at most once
  let lastError: any;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let currentKey: string;
    try {
      currentKey = keyManager.getKey(); // throws QuotaExhaustedError if all exhausted
    } catch (e) {
      throw e; // all keys spent — propagate to route handler
    }

    try {
      const genAI  = new GoogleGenAI({ apiKey: currentKey });
      const result = await genAI.models.generateContent(params);
      return (result.text ?? '').trim();
    } catch (err: any) {
      const is429    = err?.status === 429 || String(err?.message).includes('429');
      const isDaily  = String(err?.message).toLowerCase().includes('daily') ||
                       String(err?.message).toLowerCase().includes('per day');
      if (is429) {
        console.error(`🔴 Key #${keyManager.totalCount() - keyManager.availableCount() + 1} rejected with 429. Exact msg:`, err?.message);
        keyManager.markExhausted(currentKey, isDaily);
        lastError = err;
        continue; // try next key
      }
      console.error(`🔴 Key rejected with non-429 error:`, err?.message);
      throw err; // non-quota error — surface immediately
    }
  }

  throw lastError ?? new Error('All Gemini keys exhausted');
}

// ─── POST /api/ai/analyze-circuit ────────────────────────────────────────────
router.post(
  '/analyze-circuit',
  authenticateToken,
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      // Key manager picks the next available key automatically
      const imageBase64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp';

      const prompt = `You are an expert RF and microwave circuit engineer.
Carefully examine this circuit diagram image.

Extract the circuit layout into a structured graph with spatial positions.
Return ONLY a valid JSON object matching this exact schema:

{
  "components": [
    {
      "id": "c1",
      "name": "Signal Generator",
      "x": 0.1,
      "y": 0.5
    }
  ],
  "connections": [
    { "from": "c1", "to": "c2" }
  ]
}

Rules:
- Assign a unique string ID to each component.
- "x" and "y" should be normalized between 0.0 and 1.0 (where x=0.0 is left, x=1.0 is right; y=0.0 is top, y=1.0 is bottom).
- Name them using standard RF lab names (e.g. "Signal Generator", "Bandpass Filter", "Amplifier", "Power Meter", "Spectrum Analyzer", "Directional Coupler")
- Trace the wires/arrows in the diagram to determine the "connections". "from" is the signal source, "to" is the signal destination.
- Do NOT include labels or port numbers as standalone components.
- Do NOT add any markdown formatting or explanation — return ONLY the JSON object.`;

      // Rotate through keys automatically on 429
      const rawText = await callGeminiWithRotation({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          },
        ],
      });

      console.log('🤖 Gemini raw response:', rawText.slice(0, 200));

      // ── Parse JSON response ───────────────────────────────────────────────
      let parsedData: any = { components: [], connections: [] };
      try {
        const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        parsedData = JSON.parse(cleaned);
      } catch {
        console.error('Failed to parse Gemini JSON output:', rawText);
        res.status(502).json({ error: 'AI returned invalid layout data' });
        return;
      }

      // ── Match to library ──────────────────────────────────────────────────
      const matchedComponents: any[] = [];
      const unmatchedComponents: string[] = [];
      const matchedNames: string[] = [];

      const rawComps = Array.isArray(parsedData.components) ? parsedData.components : [];
      for (const comp of rawComps) {
        if (!comp.name) continue;
        const matched = matchComponent(comp.name);
        if (matched) {
          matchedComponents.push({
            id: comp.id,
            type: matched,
            name: comp.name,
            x: comp.x || 0.5,
            y: comp.y || 0.5
          });
          matchedNames.push(COMPONENT_LIBRARY[matched]?.name || matched);
        } else {
          unmatchedComponents.push(comp.name);
        }
      }

      console.log(`✅ AI spatial analysis complete — detected: ${rawComps.length}, matched: ${matchedComponents.length}, unmatched: ${unmatchedComponents.length}`);

      const connections = Array.isArray(parsedData.connections) ? parsedData.connections : [];

      res.json({
        success: true,
        detectedComponents: rawComps,
        matchedComponents, // array of {id, type, name, x, y}
        matchedNames,
        unmatchedComponents, // array of strings
        connections, // array of {from, to}
      });
    } catch (error: any) {
      console.error('AI analysis error:', error);

      if (error instanceof QuotaExhaustedError) {
        res.status(429).json({
          error: 'AI service is temporarily at capacity.',
          retryAfter: error.retryAfter,
          details: import.meta?.url ? undefined : `All ${keyManager.totalCount()} API key(s) are exhausted. Add more keys to backend/.env to increase capacity.`,
        });
        return;
      }

      const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
      if (is429) {
        res.status(429).json({
          error: 'AI service is temporarily at capacity.',
          retryAfter: 60,
          details: 'Rate limit hit.',
        });
        return;
      }

      res.status(500).json({ error: 'AI analysis failed', details: error.message || 'Unknown error' });
    }
  }
);


// ─── POST /api/ai/analyze-simulation ─────────────────────────────────────────

// Accepts a JSON snapshot of simulation results and returns AI expert analysis.
router.post(
  '/analyze-simulation',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { summary } = req.body as { summary: string };

      if (!summary || typeof summary !== 'string') {
        res.status(400).json({ error: 'Missing simulation summary in request body' });
        return;
      }

      const genAI = new GoogleGenAI({ apiKey: keyManager.getKey() });

      const prompt = `You are an expert RF/microwave engineer and university laboratory instructor reviewing simulation results from a Virtual Microwave Lab.

## Simulation Data
${summary}

## Your Task
Analyze these results against standard RF engineering expectations for a typical university microwave lab experiment.
Identify any results that are physically incorrect, surprising, or differ from what real lab hardware would show.

Respond ONLY with a valid JSON object (no markdown code fences, no extra text) matching this schema:
{
  "summary": "<2-3 sentence plain-English summary of what the circuit is doing>",
  "circuitBehavior": "<detailed explanation of the S-parameter behavior observed>",
  "anomalies": [
    {
      "id": "<unique_id>",
      "parameter": "<e.g., S21, VSWR, Return Loss, Group Delay>",
      "severity": "<critical|warning|info>",
      "measured": "<the value seen in simulation>",
      "expected": "<what real hardware would typically show>",
      "explanation": "<why this is anomalous — clear RF physics explanation>",
      "recommendation": "<what to check or adjust in the circuit or parameters>",
      "suggestedAdjustment": {
        "componentType": "<e.g., Bandpass Filter, Amplifier, or null>",
        "parameterName": "<e.g., Cutoff Frequency, Gain, or null>",
        "direction": "<Increase|Decrease|null>"
      }
    }
  ],
  "recommendations": ["<actionable recommendation 1>", "..."],
  "labCorrelation": "<how these results compare to typical lab measurements on real hardware>",
  "passFail": [
    { "label": "<metric name>", "pass": true, "detail": "<brief reason>" }
  ]
}

Focus on:
1. Input/output match quality (S11, S22 vs typical hardware spec)
2. Insertion gain/loss (S21) — is it physically plausible for the given components?
3. Reciprocity (|S12| vs |S21|) — should they match for passive components?
4. Return loss / VSWR — are thresholds met for the application?
5. Group delay — is it reasonable for the signal path length?
6. Any passive/active component behavior that looks wrong

Be specific, educational, and calibrated to a university microwave engineering lab context.`;

      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const rawText = (result.text ?? '').trim();
      console.log('🤖 Simulation AI analysis response length:', rawText.length);

      // Strip markdown fences if model adds them
      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

      let analysis: object;
      try {
        analysis = JSON.parse(cleaned);
      } catch {
        console.error('Failed to parse simulation AI JSON:', cleaned.slice(0, 300));
        res.status(502).json({ error: 'AI returned non-JSON response', raw: cleaned.slice(0, 500) });
        return;
      }

      res.json({ success: true, analysis });
    } catch (error: any) {
      console.error('Simulation AI analysis error:', error);

      if (error?.status === 429) {
        res.status(429).json({
          error: 'Gemini API free-tier quota exceeded. Please wait a moment and try again.',
          details: 'Rate limit hit on the free tier. Consider waiting 60 seconds before retrying.',
        });
        return;
      }

      res.status(500).json({
        error: 'AI simulation analysis failed',
        details: error.message || 'Unknown error',
      });
    }
  }
);

export default router;

