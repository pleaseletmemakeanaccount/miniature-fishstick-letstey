export class WorldAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private volume = .25;

  start() {
    if (this.context) { void this.context.resume().catch(() => undefined); return; }
    try {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume * .15;
      this.master.connect(this.context.destination);
      const buffer = this.context.createBuffer(1, this.context.sampleRate * 3, this.context.sampleRate);
      const channel = buffer.getChannelData(0);
      let previous = 0;
      for (let i = 0; i < channel.length; i++) { previous = (previous + (Math.random() * 2 - 1) * .025) / 1.025; channel[i] = previous * 4; }
      const wind = this.context.createBufferSource();
      wind.buffer = buffer; wind.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 550;
      wind.connect(filter); filter.connect(this.master); wind.start(); this.sources.push(wind);
      for (const frequency of [55, 82.55]) {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = .18;
        oscillator.connect(gain); gain.connect(this.master); oscillator.start(); this.sources.push(oscillator);
      }
      void this.context.resume().catch(() => undefined);
    } catch { /* Silent play remains available when the browser blocks audio. */ }
  }

  setVolume(volume: number) {
    this.volume = volume / 100;
    if (this.context && this.master) this.master.gain.setTargetAtTime(this.volume * .15, this.context.currentTime, .3);
  }

  tick(type: 'mine' | 'place' | 'hurt' | 'travel' = 'mine') {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = type === 'travel' ? 'sine' : 'triangle';
    const frequency = type === 'hurt' ? 75 : type === 'travel' ? 420 : type === 'place' ? 180 : 240;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency / 4), now + .14);
    gain.gain.setValueAtTime(.75, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .2);
    oscillator.connect(gain); gain.connect(this.master);
    oscillator.start(now); oscillator.stop(now + .21);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  dispose() {
    this.sources.forEach(source => { try { source.stop(); source.disconnect(); } catch { /* Already stopped. */ } });
    if (this.context) void this.context.close().catch(() => undefined);
    this.context = null;
  }
}