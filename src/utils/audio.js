class AudioManager {
  constructor() {
    this.ctx = null
    this.enabled = false
    this.masterGain = null
  }

  init() {
    if (this.ctx) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.25
    this.masterGain.connect(this.ctx.destination)
    this.enabled = true
  }

  ensureRunning() {
    if (!this.ctx) this.init()
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  playHover() {
    if (!this.enabled || !this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(80, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.28)
  }

  playClick() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(220, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.5)

    const noise = this.ctx.createBufferSource()
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04))
    }
    noise.buffer = buffer
    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(0.06, this.ctx.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)
    noise.connect(noiseGain)
    noiseGain.connect(this.masterGain)
    noise.start()
  }

  playReturn() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.35)
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.42)
  }

  playNote(frequency, duration = 0.25, type = 'sine') {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime)
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.14, this.ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + duration)
  }

  noteToFrequency(note) {
    const map = {
      C4: 261.63,
      D4: 293.66,
      E4: 329.63,
      F4: 349.23,
      G4: 392.0,
      A4: 440.0,
      B4: 493.88,
      C5: 523.25,
    }
    return map[note] || 440
  }
}

export const audioManager = new AudioManager()
