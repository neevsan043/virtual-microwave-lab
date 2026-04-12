import { Component } from './Component';
import { SignalGenerator } from './components/SignalGenerator';
import { Resistor } from './components/Resistor';
import { Capacitor } from './components/Capacitor';
import { Inductor } from './components/Inductor';
import { TransmissionLine } from './components/TransmissionLine';
import { Amplifier } from './components/Amplifier';
import { Mixer } from './components/Mixer';
import { Oscillator } from './components/Oscillator';
import { PowerMeter } from './components/PowerMeter';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { NetworkAnalyzer } from './components/NetworkAnalyzer';
import { PowerSplitter } from './components/PowerSplitter';
import { DirectionalCoupler } from './components/DirectionalCoupler';
import { BandpassFilter } from './components/BandpassFilter';
import { RectangularWaveguide } from './components/RectangularWaveguide';
import { Circulator } from './components/Circulator';
import { HornAntenna } from './components/HornAntenna';
import { Oscilloscope } from './components/Oscilloscope';
import { Attenuator } from './components/Attenuator';
import { PhaseShifter } from './components/PhaseShifter';
import { NoiseSource } from './components/NoiseSource';
import { HighpassFilter } from './components/HighpassFilter';
import { LowpassFilter } from './components/LowpassFilter';
import { BandstopFilter } from './components/BandstopFilter';
import { PowerCombiner } from './components/PowerCombiner';
import { Isolator } from './components/Isolator';
import { DipoleAntenna } from './components/DipoleAntenna';
import { PatchAntenna } from './components/PatchAntenna';
import { FrequencyCounter } from './components/FrequencyCounter';
import { Microstrip } from './components/Microstrip';
import { DcPowerSupply } from './components/DcPowerSupply';
import { Multimeter } from './components/Multimeter';
import { HighPowerAttenuator } from './components/HighPowerAttenuator';
import { HybridCoupler } from './components/HybridCoupler';
import { WilkinsonDivider } from './components/WilkinsonDivider';
import { CircularWaveguide } from './components/CircularWaveguide';
import { CoaxialLine } from './components/CoaxialLine';
import { Stripline } from './components/Stripline';
import { WaveguideTee } from './components/WaveguideTee';
import { WaveguideBend } from './components/WaveguideBend';
import { WaveguideTwist } from './components/WaveguideTwist';
import { ParabolicAntenna } from './components/ParabolicAntenna';
import { YagiAntenna } from './components/YagiAntenna';
import { SignalAnalyzer } from './components/SignalAnalyzer';
import { FunctionGenerator } from './components/FunctionGenerator';
import { VectorSignalGenerator } from './components/VectorSignalGenerator';
import { GunnDiodeOscillator } from './components/GunnDiodeOscillator';
import { KlystronOscillator } from './components/KlystronOscillator';
import { Magnetron } from './components/Magnetron';
import { Vco } from './components/Vco';
import { SwrMeter } from './components/SwrMeter';
import { FieldStrengthMeter } from './components/FieldStrengthMeter';
import { SlottedLine } from './components/SlottedLine';
import { NoiseFigureAnalyzer } from './components/NoiseFigureAnalyzer';
import { FreeSpaceKit } from './components/FreeSpaceKit';
import { MonopoleAntenna } from './components/MonopoleAntenna';
import { LoopAntenna } from './components/LoopAntenna';
import { HelicalAntenna } from './components/HelicalAntenna';
import { Reflector } from './components/Reflector';
import { AntennaPositioner } from './components/AntennaPositioner';
import { AnechoicChamber } from './components/AnechoicChamber';
import { AntennaMast } from './components/AntennaMast';
import { Turntable } from './components/Turntable';
import { GroundPlane } from './components/GroundPlane';
import { SmaConnector } from './components/SmaConnector';
import { NConnector } from './components/NConnector';
import { BncConnector } from './components/BncConnector';
import { KConnector } from './components/KConnector';
import { MmConnector292 } from './components/MmConnector292';
import { MmConnector185 } from './components/MmConnector185';
import { Balun } from './components/Balun';
import { SemiRigidCable } from './components/SemiRigidCable';
import { FlexibleRfCable } from './components/FlexibleRfCable';
import { RfLoad } from './components/RfLoad';
import { WaveguideTermination } from './components/WaveguideTermination';
import { WaveguideCoaxAdapter } from './components/WaveguideCoaxAdapter';
import { CavityResonator } from './components/CavityResonator';
import { CpwLine } from './components/CpwLine';
import { MicrowaveAbsorber } from './components/MicrowaveAbsorber';
import { RogersSubstrate } from './components/RogersSubstrate';
import { RtDuroidSubstrate } from './components/RtDuroidSubstrate';
import { Fr4Substrate } from './components/Fr4Substrate';
import { PinDiode } from './components/PinDiode';
import { SchottkyDiode } from './components/SchottkyDiode';
import { VaractorDiode } from './components/VaractorDiode';
import { Hemt } from './components/Hemt';
import { FrequencyMultiplier } from './components/FrequencyMultiplier';
import { BiasTee } from './components/BiasTee';
import { ComponentType, Point } from '../types';

export class ComponentFactory {
  private static idCounter = 0;

  static generateId(type: ComponentType): string {
    this.idCounter++;
    return `${type}_${Date.now()}_${this.idCounter}`;
  }

  static createComponent(type: ComponentType, position?: Point): Component | null {
    const id = this.generateId(type);
    switch (type) {
      case 'signal_generator':        return new SignalGenerator(id, position);
      case 'oscillator':              return new Oscillator(id, position);
      case 'noise_source':            return new NoiseSource(id, position);
      case 'resistor':                return new Resistor(id, position);
      case 'capacitor':               return new Capacitor(id, position);
      case 'inductor':                return new Inductor(id, position);
      case 'transmission_line':       return new TransmissionLine(id, position);
      case 'amplifier':               return new Amplifier(id, position);
      case 'mixer':                   return new Mixer(id, position);
      case 'attenuator':              return new Attenuator(id, position);
      case 'phase_shifter':           return new PhaseShifter(id, position);
      case 'power_splitter':          return new PowerSplitter(id, position);
      case 'power_combiner':          return new PowerCombiner(id, position);
      case 'directional_coupler':     return new DirectionalCoupler(id, position);
      case 'lowpass_filter':          return new LowpassFilter(id, position);
      case 'highpass_filter':         return new HighpassFilter(id, position);
      case 'bandpass_filter':         return new BandpassFilter(id, position);
      case 'bandstop_filter':         return new BandstopFilter(id, position);
      case 'rectangular_waveguide':   return new RectangularWaveguide(id, position);
      case 'microstrip_line':         return new Microstrip(id, position);
      case 'circulator':              return new Circulator(id, position);
      case 'isolator':                return new Isolator(id, position);
      case 'dipole_antenna':          return new DipoleAntenna(id, position);
      case 'patch_antenna':           return new PatchAntenna(id, position);
      case 'horn_antenna':            return new HornAntenna(id, position);
      case 'power_meter':             return new PowerMeter(id, position);
      case 'spectrum_analyzer':       return new SpectrumAnalyzer(id, position);
      case 'network_analyzer':        return new NetworkAnalyzer(id, position);
      case 'oscilloscope':            return new Oscilloscope(id, position);
      case 'frequency_counter':       return new FrequencyCounter(id, position);
      case 'dc_power_supply':         return new DcPowerSupply(id, position);
      case 'multimeter':              return new Multimeter(id, position);
      case 'high_power_attenuator':   return new HighPowerAttenuator(id, position);
      case 'hybrid_coupler':          return new HybridCoupler(id, position);
      case 'wilkinson_divider':       return new WilkinsonDivider(id, position);
      case 'circular_waveguide':      return new CircularWaveguide(id, position);
      case 'coaxial_line':            return new CoaxialLine(id, position);
      case 'stripline':               return new Stripline(id, position);
      case 'waveguide_tee':           return new WaveguideTee(id, position);
      case 'waveguide_bend':          return new WaveguideBend(id, position);
      case 'waveguide_twist':         return new WaveguideTwist(id, position);
      case 'parabolic_antenna':       return new ParabolicAntenna(id, position);
      case 'yagi_antenna':            return new YagiAntenna(id, position);
      case 'signal_analyzer':         return new SignalAnalyzer(id, position);
      case 'function_generator':      return new FunctionGenerator(id, position);
      case 'vector_signal_generator': return new VectorSignalGenerator(id, position);
      case 'gunn_diode_oscillator':   return new GunnDiodeOscillator(id, position);
      case 'klystron_oscillator':     return new KlystronOscillator(id, position);
      case 'magnetron':               return new Magnetron(id, position);
      case 'vco':                     return new Vco(id, position);
      case 'swr_meter':               return new SwrMeter(id, position);
      case 'field_strength_meter':    return new FieldStrengthMeter(id, position);
      case 'slotted_line':            return new SlottedLine(id, position);
      case 'noise_figure_analyzer':   return new NoiseFigureAnalyzer(id, position);
      case 'free_space_kit':          return new FreeSpaceKit(id, position);
      case 'monopole_antenna':        return new MonopoleAntenna(id, position);
      case 'loop_antenna':            return new LoopAntenna(id, position);
      case 'helical_antenna':         return new HelicalAntenna(id, position);
      case 'reflector':               return new Reflector(id, position);
      case 'antenna_positioner':      return new AntennaPositioner(id, position);
      case 'anechoic_chamber':        return new AnechoicChamber(id, position);
      case 'antenna_mast':            return new AntennaMast(id, position);
      case 'turntable':               return new Turntable(id, position);
      case 'ground_plane':            return new GroundPlane(id, position);
      case 'sma_connector':           return new SmaConnector(id, position);
      case 'n_connector':             return new NConnector(id, position);
      case 'bnc_connector':           return new BncConnector(id, position);
      case 'k_connector':             return new KConnector(id, position);
      case 'mm_connector_292':        return new MmConnector292(id, position);
      case 'mm_connector_185':        return new MmConnector185(id, position);
      case 'balun':                   return new Balun(id, position);
      case 'semi_rigid_cable':        return new SemiRigidCable(id, position);
      case 'flexible_rf_cable':       return new FlexibleRfCable(id, position);
      case 'rf_load':                 return new RfLoad(id, position);
      case 'waveguide_termination':   return new WaveguideTermination(id, position);
      case 'waveguide_coax_adapter':  return new WaveguideCoaxAdapter(id, position);
      case 'cavity_resonator':        return new CavityResonator(id, position);
      case 'cpw_line':                return new CpwLine(id, position);
      case 'microwave_absorber':      return new MicrowaveAbsorber(id, position);
      case 'rogers_substrate':        return new RogersSubstrate(id, position);
      case 'rt_duroid_substrate':     return new RtDuroidSubstrate(id, position);
      case 'fr4_substrate':           return new Fr4Substrate(id, position);
      case 'pin_diode':               return new PinDiode(id, position);
      case 'schottky_diode':          return new SchottkyDiode(id, position);
      case 'varactor_diode':          return new VaractorDiode(id, position);
      case 'hemt':                    return new Hemt(id, position);
      case 'frequency_multiplier':    return new FrequencyMultiplier(id, position);
      case 'bias_tee':                return new BiasTee(id, position);
      default:
        console.warn(`Component type ${type} not yet implemented`);
        return null;
    }
  }

  static getComponentInfo(type: ComponentType): {
    name: string; description: string; category: string; icon: string;
  } | null {
    const info: Partial<Record<ComponentType, { name: string; description: string; category: string; icon: string }>> = {
      // Sources
      signal_generator:        { name: 'Signal Generator',           description: 'RF signal source at selectable frequency & power',              category: 'Sources',              icon: '📡' },
      function_generator:      { name: 'Function Generator',          description: 'Sine/square/triangle/pulse generator (DC–30 MHz)',              category: 'Sources',              icon: '🌊' },
      vector_signal_generator: { name: 'Vector Signal Generator',     description: 'IQ-modulated source for QAM/OFDM signals',                     category: 'Sources',              icon: '🎛️' },
      oscillator:              { name: 'Oscillator',                  description: 'Generates periodic signals',                                    category: 'Sources',              icon: '〰️' },
      noise_source:            { name: 'Noise Source',               description: 'White / coloured noise generator',                              category: 'Sources',              icon: '📻' },
      gunn_diode_oscillator:   { name: 'Gunn Diode Oscillator',       description: 'Solid-state X-band microwave oscillator',                      category: 'Sources',              icon: '🔵' },
      klystron_oscillator:     { name: 'Klystron Oscillator',         description: 'Reflex klystron tube microwave oscillator',                     category: 'Sources',              icon: '🔭' },
      magnetron:               { name: 'Magnetron',                   description: 'High-power cavity microwave oscillator',                        category: 'Sources',              icon: '⚡' },
      vco:                     { name: 'VCO',                         description: 'Voltage-Controlled Oscillator — frequency set by DC voltage',  category: 'Sources',              icon: '🎚️' },
      // Passive
      resistor:                { name: 'Resistor',                    description: 'Passive resistive element',                                     category: 'Passive',              icon: '⚡' },
      capacitor:               { name: 'Capacitor',                   description: 'Passive capacitive element',                                    category: 'Passive',              icon: '🔋' },
      inductor:                { name: 'Inductor',                    description: 'Passive inductive element',                                     category: 'Passive',              icon: '🧲' },
      transmission_line:       { name: 'Transmission Line',           description: 'Microwave TL with specified Z0 & length',                      category: 'Passive',              icon: '📏' },
      rf_load:                 { name: 'RF Load (50Ω)',               description: '50Ω matched termination absorbing RF power',                   category: 'Passive',              icon: '🔚' },
      cavity_resonator:        { name: 'Cavity Resonator',            description: 'High-Q microwave cavity resonator',                             category: 'Passive',              icon: '🥚' },
      // Active
      amplifier:               { name: 'Amplifier',                   description: 'Active RF gain block',                                          category: 'Active',               icon: '📈' },
      mixer:                   { name: 'Mixer',                       description: 'Frequency conversion component',                                category: 'Active',               icon: '🔀' },
      attenuator:              { name: 'Attenuator',                  description: 'Fixed or variable RF attenuation',                              category: 'Active',               icon: '📉' },
      phase_shifter:           { name: 'Phase Shifter',               description: 'Adjusts signal phase without changing amplitude',               category: 'Active',               icon: '🔄' },
      high_power_attenuator:   { name: 'High-Power Attenuator',       description: '30 dB / 50 W attenuator for in-line protection',               category: 'Active',               icon: '🛡️' },
      frequency_multiplier:    { name: 'Frequency Multiplier',        description: 'Multiplies input frequency by integer factor (×2, ×3…)',        category: 'Active',               icon: '✖️' },
      // Power Division
      power_splitter:          { name: 'Power Splitter',              description: 'Splits input power to multiple outputs',                        category: 'Power Division',       icon: '🔱' },
      power_combiner:          { name: 'Power Combiner',              description: 'Combines multiple inputs into single output',                   category: 'Power Division',       icon: '⚡' },
      directional_coupler:     { name: 'Directional Coupler',         description: '4-port coupler for sampling signals',                           category: 'Power Division',       icon: '🔀' },
      hybrid_coupler:          { name: 'Hybrid Coupler',              description: '90° or 180° hybrid junction (4-port)',                         category: 'Power Division',       icon: '➕' },
      wilkinson_divider:       { name: 'Wilkinson Divider',           description: 'Equal split with port-to-port isolation',                      category: 'Power Division',       icon: '🔱' },
      // Filters
      lowpass_filter:          { name: 'Lowpass Filter',              description: 'Passes frequencies below cutoff',                              category: 'Filters',              icon: '📊' },
      highpass_filter:         { name: 'Highpass Filter',             description: 'Passes frequencies above cutoff',                              category: 'Filters',              icon: '📈' },
      bandpass_filter:         { name: 'Bandpass Filter',             description: 'Passes a specified frequency band',                            category: 'Filters',              icon: '🎚️' },
      bandstop_filter:         { name: 'Bandstop Filter',             description: 'Rejects a specified frequency band',                           category: 'Filters',              icon: '🚫' },
      // Waveguides
      rectangular_waveguide:   { name: 'Rectangular Waveguide',       description: 'Hollow metallic rectangular guide',                            category: 'Waveguides',           icon: '▭' },
      circular_waveguide:      { name: 'Circular Waveguide',          description: 'Hollow metallic circular guide (TE11 mode)',                   category: 'Waveguides',           icon: '⭕' },
      coaxial_line:            { name: 'Coaxial Line (50Ω)',          description: '50Ω coaxial cable with frequency-dependent loss',              category: 'Waveguides',           icon: '🔌' },
      microstrip_line:         { name: 'Microstrip Line',             description: 'PCB planar transmission line',                                 category: 'Waveguides',           icon: '📏' },
      stripline:               { name: 'Stripline',                   description: 'Embedded PCB transmission line',                               category: 'Waveguides',           icon: '═' },
      cpw_line:                { name: 'CPW Line',                    description: 'Coplanar Waveguide with ground on same surface',               category: 'Waveguides',           icon: '⚌' },
      // Waveguide Components
      waveguide_tee:           { name: 'Waveguide Tee',               description: 'E-plane or H-plane waveguide tee junction',                    category: 'Waveguide Components', icon: '⊤' },
      waveguide_bend:          { name: 'Waveguide Bend',              description: 'E/H-plane waveguide bend section',                             category: 'Waveguide Components', icon: '↪' },
      waveguide_twist:         { name: 'Waveguide Twist',             description: 'Rotates waveguide polarisation by set angle',                 category: 'Waveguide Components', icon: '🔄' },
      waveguide_coax_adapter:  { name: 'WG-to-Coax Adapter',         description: 'Transitions between waveguide and coaxial connector',         category: 'Waveguide Components', icon: '🔗' },
      waveguide_termination:   { name: 'Waveguide Termination',       description: 'Matched load absorbing all incident waveguide power',          category: 'Waveguide Components', icon: '🔚' },
      circulator:              { name: 'Circulator',                  description: 'Non-reciprocal 3-port ferrite device',                         category: 'Waveguide Components', icon: '🔄' },
      isolator:                { name: 'Isolator',                    description: 'One-way signal passage, blocks reflections',                  category: 'Waveguide Components', icon: '➡️' },
      // Antennas
      dipole_antenna:          { name: 'Dipole Antenna',              description: 'Half-wave balanced dipole antenna',                            category: 'Antennas',             icon: '📶' },
      monopole_antenna:        { name: 'Monopole / Whip Antenna',     description: 'Quarter-wave monopole over ground plane',                     category: 'Antennas',             icon: '📡' },
      patch_antenna:           { name: 'Patch Antenna',               description: 'Microstrip patch (PCB) antenna',                              category: 'Antennas',             icon: '▢' },
      horn_antenna:            { name: 'Horn Antenna',                description: 'Pyramidal or conical standard gain horn',                     category: 'Antennas',             icon: '📢' },
      parabolic_antenna:       { name: 'Parabolic Dish Antenna',      description: 'High-gain parabolic reflector antenna',                       category: 'Antennas',             icon: '📡' },
      yagi_antenna:            { name: 'Yagi-Uda Antenna',            description: 'Directional multi-element Yagi array',                       category: 'Antennas',             icon: '📶' },
      loop_antenna:            { name: 'Loop Antenna',                description: 'Loop with figure-8 radiation pattern',                       category: 'Antennas',             icon: '🔁' },
      helical_antenna:         { name: 'Helical Antenna',             description: 'Helical axial-mode or normal-mode antenna',                  category: 'Antennas',             icon: '🌀' },
      reflector:               { name: 'Reflector / Diffractor',      description: 'Metal or dielectric reflector for antenna measurements',     category: 'Antennas',             icon: '🪞' },
      antenna_positioner:      { name: 'Antenna Positioner',          description: 'Motorised azimuth/elevation positioner',                     category: 'Antennas',             icon: '🎯' },
      // Measurement
      power_meter:             { name: 'Power Meter',                 description: 'Measures absolute RF power',                                  category: 'Measurement',          icon: '📊' },
      spectrum_analyzer:       { name: 'Spectrum Analyzer',           description: 'Displays frequency-domain signal spectrum',                   category: 'Measurement',          icon: '📉' },
      network_analyzer:        { name: 'Vector Network Analyzer',     description: 'Measures 2-port S-parameters',                               category: 'Measurement',          icon: '📐' },
      oscilloscope:            { name: 'Oscilloscope',                description: 'High-frequency time-domain waveform display',                category: 'Measurement',          icon: '📺' },
      frequency_counter:       { name: 'Frequency Counter',           description: 'High-precision frequency measurement',                       category: 'Measurement',          icon: '🔢' },
      signal_analyzer:         { name: 'Signal Analyzer',             description: 'Vector signal analysis, IQ and modulation',                 category: 'Measurement',          icon: '📊' },
      swr_meter:               { name: 'SWR Meter',                   description: 'Standing Wave Ratio and reflection measurement',             category: 'Measurement',          icon: '🔭' },
      field_strength_meter:    { name: 'Field Strength Meter',        description: 'Measures RF field strength (EMC/antenna testing)',           category: 'Measurement',          icon: '🧭' },
      slotted_line:            { name: 'Slotted Line',                description: 'Sliding-probe VSWR and impedance measurement line',         category: 'Measurement',          icon: '📐' },
      noise_figure_analyzer:   { name: 'Noise Figure Analyzer',       description: 'Measures amplifier/receiver noise figure',                  category: 'Measurement',          icon: '🔬' },
      free_space_kit:          { name: 'Free-Space Measurement Kit',  description: 'Focused-beam kit for dielectric characterisation',          category: 'Measurement',          icon: '🌠' },
      // Power Supply
      dc_power_supply:         { name: 'DC Power Supply',             description: 'Stable DC source (12 V / 5 A)',                             category: 'Power Supply',         icon: '🔌' },
      multimeter:              { name: 'Multimeter',                  description: 'DC voltage, current and resistance meter',                  category: 'Power Supply',         icon: '🖊️' },
      // Infrastructure
      anechoic_chamber:        { name: 'Anechoic Chamber',            description: 'RF-shielded room with absorber for antenna/EMC testing',   category: 'Infrastructure',       icon: '🏠' },
      antenna_mast:            { name: 'Antenna Mast / Stand',        description: 'Non-metallic mast for mounting antennas at height',        category: 'Infrastructure',       icon: '🗼' },
      turntable:               { name: 'Turntable',                   description: 'RF-transparent DUT rotator for pattern measurements',      category: 'Infrastructure',       icon: '🎡' },
      ground_plane:            { name: 'Ground Plane Board',          description: 'Conductive reference ground for monopole/patch antennas',  category: 'Infrastructure',       icon: '🟫' },
      microwave_absorber:      { name: 'Microwave Absorber',          description: 'Absorber foam/tile for anechoic chambers & test fixtures', category: 'Infrastructure',       icon: '🧱' },
      // Connectors
      sma_connector:           { name: 'SMA Connector',               description: 'DC–18 GHz, 50Ω threaded RF connector',                    category: 'Connectors',           icon: '🔩' },
      n_connector:             { name: 'N-Type Connector',            description: 'DC–18 GHz, 50Ω weather-sealed RF connector',              category: 'Connectors',           icon: '🔩' },
      bnc_connector:           { name: 'BNC Connector',               description: 'DC–4 GHz, 50Ω bayonet RF connector',                     category: 'Connectors',           icon: '🔩' },
      k_connector:             { name: 'K-Type Connector',            description: 'DC–40 GHz, 50Ω precision RF connector',                  category: 'Connectors',           icon: '🔩' },
      mm_connector_292:        { name: '2.92mm Connector',            description: 'DC–40 GHz, 50Ω K-type equivalent connector',             category: 'Connectors',           icon: '🔩' },
      mm_connector_185:        { name: '1.85mm Connector',            description: 'DC–67 GHz, 50Ω V-band connector',                        category: 'Connectors',           icon: '🔩' },
      balun:                   { name: 'Balun',                       description: 'Balanced–unbalanced transformer for dipole/loop feeds',   category: 'Connectors',           icon: '⚖️' },
      // Cables
      semi_rigid_cable:        { name: 'Semi-Rigid Coaxial Cable',    description: '0.141" copper-jacketed cable — low loss to 40 GHz',       category: 'Cables',               icon: '🪢' },
      flexible_rf_cable:       { name: 'Flexible RF Cable',           description: 'Low-loss flexible coaxial cable for bench connections',   category: 'Cables',               icon: '🪢' },
      // Substrates
      rogers_substrate:        { name: 'Rogers RO4003C Substrate',    description: 'εr 3.55, tanδ 0.0027 — standard RF/microwave PCB',        category: 'Substrates',           icon: '🟩' },
      rt_duroid_substrate:     { name: 'RT/duroid 5880 Substrate',    description: 'εr 2.2, tanδ 0.0009 — very low-loss PTFE substrate',     category: 'Substrates',           icon: '🟦' },
      fr4_substrate:           { name: 'FR4 Substrate',               description: 'εr 4.4, tanδ 0.02 — standard PCB (below 6 GHz)',         category: 'Substrates',           icon: '🟨' },
      // Semiconductors
      pin_diode:               { name: 'PIN Diode',                   description: 'RF switch / limiter / variable attenuator diode',        category: 'Semiconductors',       icon: '🔴' },
      schottky_diode:          { name: 'Schottky Diode',              description: 'Fast diode for microwave detection and mixing',          category: 'Semiconductors',       icon: '🔶' },
      varactor_diode:          { name: 'Varactor Diode',              description: 'Voltage-tunable capacitance diode',                     category: 'Semiconductors',       icon: '🔷' },
      hemt:                    { name: 'HEMT / GaAs FET',             description: 'Very low-noise microwave transistor',                   category: 'Semiconductors',       icon: '🔬' },
      bias_tee:                { name: 'Bias Tee',                    description: 'Superimposes DC bias onto RF signal path',              category: 'Semiconductors',       icon: '⚡' },
    };
    return info[type] || null;
  }

  static getComponentsByCategory(): Record<string, ComponentType[]> {
    return {
      Sources:                  ['signal_generator', 'function_generator', 'vector_signal_generator', 'oscillator', 'noise_source', 'gunn_diode_oscillator', 'klystron_oscillator', 'magnetron', 'vco'],
      Passive:                  ['resistor', 'capacitor', 'inductor', 'transmission_line', 'rf_load', 'cavity_resonator'],
      Active:                   ['amplifier', 'mixer', 'attenuator', 'phase_shifter', 'high_power_attenuator', 'frequency_multiplier'],
      'Power Division':         ['power_splitter', 'power_combiner', 'directional_coupler', 'hybrid_coupler', 'wilkinson_divider', 'circulator', 'isolator'],
      Filters:                  ['lowpass_filter', 'highpass_filter', 'bandpass_filter', 'bandstop_filter'],
      Waveguides:               ['rectangular_waveguide', 'circular_waveguide', 'coaxial_line', 'microstrip_line', 'stripline', 'cpw_line'],
      'Waveguide Components':   ['waveguide_tee', 'waveguide_bend', 'waveguide_twist', 'waveguide_coax_adapter', 'waveguide_termination'],
      Antennas:                 ['dipole_antenna', 'monopole_antenna', 'patch_antenna', 'horn_antenna', 'parabolic_antenna', 'yagi_antenna', 'loop_antenna', 'helical_antenna', 'reflector', 'antenna_positioner'],
      Measurement:              ['power_meter', 'spectrum_analyzer', 'network_analyzer', 'oscilloscope', 'frequency_counter', 'signal_analyzer', 'swr_meter', 'field_strength_meter', 'slotted_line', 'noise_figure_analyzer', 'free_space_kit'],
      'Power Supply':           ['dc_power_supply', 'multimeter'],
      Infrastructure:           ['anechoic_chamber', 'antenna_mast', 'turntable', 'ground_plane', 'microwave_absorber'],
      Connectors:               ['sma_connector', 'n_connector', 'bnc_connector', 'k_connector', 'mm_connector_292', 'mm_connector_185', 'balun'],
      Cables:                   ['semi_rigid_cable', 'flexible_rf_cable'],
      Substrates:               ['rogers_substrate', 'rt_duroid_substrate', 'fr4_substrate'],
      Semiconductors:           ['pin_diode', 'schottky_diode', 'varactor_diode', 'hemt', 'bias_tee'],
    };
  }

  static getAllComponentTypes(): ComponentType[] {
    return [
      'signal_generator', 'function_generator', 'vector_signal_generator', 'oscillator', 'noise_source',
      'gunn_diode_oscillator', 'klystron_oscillator', 'magnetron', 'vco',
      'resistor', 'capacitor', 'inductor', 'transmission_line', 'rf_load', 'cavity_resonator',
      'amplifier', 'mixer', 'attenuator', 'phase_shifter', 'high_power_attenuator', 'frequency_multiplier',
      'power_splitter', 'power_combiner', 'directional_coupler', 'hybrid_coupler', 'wilkinson_divider',
      'circulator', 'isolator',
      'lowpass_filter', 'highpass_filter', 'bandpass_filter', 'bandstop_filter',
      'rectangular_waveguide', 'circular_waveguide', 'coaxial_line', 'microstrip_line', 'stripline', 'cpw_line',
      'waveguide_tee', 'waveguide_bend', 'waveguide_twist', 'waveguide_coax_adapter', 'waveguide_termination',
      'dipole_antenna', 'monopole_antenna', 'patch_antenna', 'horn_antenna', 'parabolic_antenna',
      'yagi_antenna', 'loop_antenna', 'helical_antenna', 'reflector', 'antenna_positioner',
      'power_meter', 'spectrum_analyzer', 'network_analyzer', 'oscilloscope', 'frequency_counter',
      'signal_analyzer', 'swr_meter', 'field_strength_meter', 'slotted_line', 'noise_figure_analyzer', 'free_space_kit',
      'dc_power_supply', 'multimeter',
      'anechoic_chamber', 'antenna_mast', 'turntable', 'ground_plane', 'microwave_absorber',
      'sma_connector', 'n_connector', 'bnc_connector', 'k_connector', 'mm_connector_292', 'mm_connector_185', 'balun',
      'semi_rigid_cable', 'flexible_rf_cable',
      'rogers_substrate', 'rt_duroid_substrate', 'fr4_substrate',
      'pin_diode', 'schottky_diode', 'varactor_diode', 'hemt', 'bias_tee',
    ];
  }

  static fromJSON(data: any): Component | null {
    try {
      const component = this.createComponent(data.type, data.position);
      if (!component) return null;
      (component as any).id = data.id;
      if (data.parameters) {
        Object.keys(data.parameters).forEach(key => {
          component.updateParameter(key, data.parameters[key]);
        });
      }
      if (data.ports && Array.isArray(data.ports) && data.ports.length > 0) {
        (component as any).ports = data.ports;
      }
      return component;
    } catch (error) {
      console.error('Failed to reconstruct component from JSON:', error);
      return null;
    }
  }
}
