/**
 * RepoLens — Spring Physics Simulation
 * Critically damped mass-spring-damper engine.
 */

export const SPRING_PRESETS = {
  default: { tension: 170, friction: 26, mass: 1 },
  gentle: { tension: 120, friction: 14, mass: 1 },
  wobbly: { tension: 180, friction: 12, mass: 1 },
  stiff: { tension: 210, friction: 20, mass: 1 },
  snappy: { tension: 240, friction: 24, mass: 1 },
  criticallyDamped: (tension = 180, mass = 1) => ({
    tension,
    friction: 2 * Math.sqrt(tension * mass),
    mass
  })
};

export class Spring {
  constructor(config = {}) {
    const preset = typeof config.preset === 'string' && SPRING_PRESETS[config.preset]
      ? (typeof SPRING_PRESETS[config.preset] === 'function' ? SPRING_PRESETS[config.preset]() : SPRING_PRESETS[config.preset])
      : SPRING_PRESETS.default;

    this.tension = config.tension ?? preset.tension;
    this.friction = config.friction ?? preset.friction;
    this.mass = config.mass ?? preset.mass;
    this.precision = config.precision ?? 0.001;

    this.value = config.initial ?? 0;
    this.target = config.target ?? this.value;
    this.velocity = config.velocity ?? 0;
    this.isSettled = Math.abs(this.target - this.value) < this.precision;
  }

  setTarget(target) {
    if (this.target !== target) {
      this.target = target;
      this.isSettled = false;
    }
  }

  snap(value) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.isSettled = true;
  }

  step(dt) {
    if (this.isSettled) {
      return { value: this.value, velocity: 0, done: true };
    }

    // Substep simulation for high accuracy and stability
    const subSteps = Math.min(Math.max(Math.ceil(dt / 0.008), 1), 8);
    const subDt = dt / subSteps;

    for (let i = 0; i < subSteps; i++) {
      const displacement = this.value - this.target;
      const springForce = -this.tension * displacement;
      const dampingForce = -this.friction * this.velocity;
      const acceleration = (springForce + dampingForce) / this.mass;

      this.velocity += acceleration * subDt;
      this.value += this.velocity * subDt;
    }

    const dist = Math.abs(this.target - this.value);
    const speed = Math.abs(this.velocity);

    if (dist < this.precision && speed < this.precision) {
      this.value = this.target;
      this.velocity = 0;
      this.isSettled = true;
      return { value: this.value, velocity: 0, done: true };
    }

    return { value: this.value, velocity: this.velocity, done: false };
  }
}

export function createSpring(config = {}) {
  return new Spring(config);
}

export default createSpring;
