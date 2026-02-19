// Default audio-to-visual parameter mappings for each background type.
// band: 'bass' | 'mid' | 'treble' | 'amplitude'
// weight: multiplier applied to the normalized 0-1 audio value
// mode: 'additive' (base + audio * weight) | 'multiplicative' (base * (1 + audio * weight))

export const AUDIO_MAPPINGS = {
  liquid: [
    { param: 'waveIntensity',  band: 'bass',      weight: 0.5  },
    { param: 'wave1Speed',     band: 'mid',       weight: 0.3  },
    { param: 'wave2Speed',     band: 'treble',    weight: 0.2  },
  ],
  aurora: [
    { param: 'width',       band: 'mid',      weight: 42  },
  ],
  fluid: [
    { param: 'speed',      band: 'amplitude', weight: 2    },
    { param: 'speed',      band: 'amplitude', weight: 2    },
    { param: 'intensity',  band: 'treble',    weight: 3    },
  ],
  waves: [
    { param: 'waveHeight',    band: 'bass',      weight: 0.08 },
    { param: 'waveFrequency', band: 'amplitude', weight: 4    },
    { param: 'speed',         band: 'treble',    weight: 1.5  },
  ],
  ribbon: [
    { param: 'amplitude', band: 'amplitude', weight: 1.5  },
    { param: 'noise',     band: 'mid',       weight: 1.0  },
    { param: 'taper',     band: 'treble',    weight: 1.0  },
  ],
  dandelion: [
    { param: 'speed',  band: 'treble',    weight: 1.5  },
    { param: 'spread', band: 'amplitude', weight: 0.0005    },
  ],
  particleRing: [
    { param: 'speed',      band: 'treble',    weight: 1.5  },
    { param: 'ringRadius', band: 'amplitude', weight: 0.25 },
    { param: 'ringWidth',  band: 'bass',      weight: 0.1  },
  ],
  shapeTrail: [
    { param: 'speed',   band: 'amplitude', weight: 1.0  },
    { param: 'opacity', band: 'bass',      weight: 0.3  },
  ],
}
