import { describe, it, expect } from 'vitest';
import { assertDeliveryCompliant, type FfprobeJson } from '../src/delivery.js';

const good: FfprobeJson = {
  streams: [
    { codec_type: 'video', codec_name: 'h264', pix_fmt: 'yuv420p' },
    { codec_type: 'audio', codec_name: 'aac' },
  ],
  format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2' },
};

describe('assertDeliveryCompliant', () => {
  it('passes for h264/yuv420p/aac mp4', () => {
    expect(() => assertDeliveryCompliant(good)).not.toThrow();
  });
  it('rejects non-yuv420p pixel format', () => {
    const bad = { ...good, streams: [{ codec_type: 'video', codec_name: 'h264', pix_fmt: 'yuvj444p' }, good.streams[1]] };
    expect(() => assertDeliveryCompliant(bad)).toThrow(/pix_fmt|yuv420p/i);
  });
  it('rejects missing audio stream', () => {
    const bad = { ...good, streams: [good.streams[0]] };
    expect(() => assertDeliveryCompliant(bad)).toThrow(/audio/i);
  });
});
