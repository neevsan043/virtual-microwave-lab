import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class RectangularWaveguide extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'rectangular_waveguide', 'Rectangular Waveguide', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      width: 0.0229, // meters (WR-90 standard)
      height: 0.0102, // meters
      length: 0.1, // meters
      cutoffFrequency: 6.557e9, // Hz (TE10 mode)
      impedance: 50, // Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_in`,
        name: 'In',
        type: 'input',
        position: { x: 0, y: 25 },
      },
      {
        id: `${this.id}_out`,
        name: 'Out',
        type: 'output',
        position: { x: 80, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const length = this.parameters.length as number;
    const fc = this.parameters.cutoffFrequency as number;

    const s11: any[] = [];
    const s21: any[] = [];

    frequency.forEach(f => {
      if (f < fc) {
        // Below cutoff - evanescent mode
        s11.push(complex(0.9, 0)); // High reflection
        s21.push(complex(0.01, 0)); // Very low transmission
      } else {
        // Above cutoff - propagating mode
        const beta = 2 * Math.PI * f * Math.sqrt(1 - Math.pow(fc / f, 2)) / 3e8;
        const phase = -beta * length;
        const atten = 0.01 * length; // Small attenuation
        const mag = Math.exp(-atten);
        
        s11.push(complex(0.05, 0));
        s21.push(complex(mag * Math.cos(phase), mag * Math.sin(phase)));
      }
    });

    const s12 = s21;
    const s22 = s11;

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'rectangular_waveguide',
      'horn_antenna',
      'power_meter',
      'spectrum_analyzer',
    ];
  }
}
