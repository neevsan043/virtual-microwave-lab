import { ComponentType, ComponentParameters, Port, Point, SParameters, Complex } from '../types';

export abstract class Component {
  id: string;
  type: ComponentType;
  name: string;
  position: Point;
  rotation: number;
  parameters: ComponentParameters;
  ports: Port[];

  constructor(
    id: string,
    type: ComponentType,
    name: string,
    position: Point = { x: 0, y: 0 },
    rotation: number = 0
  ) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.position = position;
    this.rotation = rotation;
    this.parameters = this.getDefaultParameters();
    this.ports = this.initializePorts();
  }

  abstract getDefaultParameters(): ComponentParameters;
  abstract initializePorts(): Port[];
  abstract getSParameters(frequency: number[]): SParameters;
  abstract getCompatiblePortTypes(): string[];

  validateParameter(key: string, value: number | string | boolean): boolean {
    const defaults = this.getDefaultParameters();
    if (!(key in defaults)) return false;
    return typeof value === typeof defaults[key];
  }

  updateParameter(key: string, value: number | string | boolean): boolean {
    if (this.validateParameter(key, value)) {
      this.parameters[key] = value;
      return true;
    }
    return false;
  }

  setPosition(position: Point): void {
    this.position = position;
  }

  setRotation(rotation: number): void {
    this.rotation = rotation % 360;
  }

  getPort(portId: string): Port | undefined {
    return this.ports.find(p => p.id === portId);
  }

  canConnectTo(otherComponent: Component, thisPortId: string, otherPortId: string): boolean {
    const thisPort = this.getPort(thisPortId);
    const otherPort = otherComponent.getPort(otherPortId);

    if (!thisPort || !otherPort) return false;

    // Check if port types are compatible
    const compatibleTypes = this.getCompatiblePortTypes();
    return compatibleTypes.includes(otherComponent.type);
  }

  clone(): Component {
    const cloned = Object.create(Object.getPrototypeOf(this));
    Object.assign(cloned, this);
    cloned.id = `${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return cloned;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      position: this.position,
      rotation: this.rotation,
      parameters: this.parameters,
      ports: this.ports, // Include ports so connections can reference them
    };
  }
}

// Helper function to create complex number
export function complex(real: number, imag: number): Complex {
  return { real, imag };
}

// Helper function for complex number operations
export const ComplexMath = {
  add(a: Complex, b: Complex): Complex {
    return { real: a.real + b.real, imag: a.imag + b.imag };
  },

  subtract(a: Complex, b: Complex): Complex {
    return { real: a.real - b.real, imag: a.imag - b.imag };
  },

  multiply(a: Complex, b: Complex): Complex {
    return {
      real: a.real * b.real - a.imag * b.imag,
      imag: a.real * b.imag + a.imag * b.real,
    };
  },

  divide(a: Complex, b: Complex): Complex {
    const denominator = b.real * b.real + b.imag * b.imag;
    return {
      real: (a.real * b.real + a.imag * b.imag) / denominator,
      imag: (a.imag * b.real - a.real * b.imag) / denominator,
    };
  },

  magnitude(a: Complex): number {
    return Math.sqrt(a.real * a.real + a.imag * a.imag);
  },

  phase(a: Complex): number {
    return Math.atan2(a.imag, a.real);
  },

  conjugate(a: Complex): Complex {
    return { real: a.real, imag: -a.imag };
  },
};
