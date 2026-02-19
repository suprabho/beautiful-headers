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
    { param: 'blurAmount',  band: 'bass',      weight: 10   },
    { param: 'minHeight',   band: 'bass',      weight: 200  },
    { param: 'maxHeight',   band: 'mid',       weight: 300  },
  ],
  fluid: [
    { param: 'speed',      band: 'mid',       weight: 2    },
    { param: 'intensity',  band: 'bass',      weight: 3    },
  ],
  waves: [
    { param: 'waveHeight',    band: 'bass',      weight: 0.08 },
    { param: 'waveFrequency', band: 'mid',       weight: 2    },
    { param: 'speed',         band: 'amplitude', weight: 1.5  },
  ],
  ribbon: [
    { param: 'amplitude', band: 'bass',      weight: 1.5  },
    { param: 'noise',     band: 'mid',       weight: 1.0  },
    { param: 'speed',     band: 'treble',    weight: 1.0  },
  ],
  dandelion: [
    { param: 'speed',  band: 'amplitude', weight: 1.0  },
    { param: 'spread', band: 'bass',      weight: 0.3  },
  ],
  particleRing: [
    { param: 'speed',      band: 'amplitude', weight: 1.5  },
    { param: 'ringRadius', band: 'bass',      weight: 0.15 },
    { param: 'ringWidth',  band: 'mid',       weight: 0.1  },
  ],
  shapeTrail: [
    { param: 'speed',   band: 'amplitude', weight: 1.0  },
    { param: 'opacity', band: 'bass',      weight: 0.3  },
  ],
}
