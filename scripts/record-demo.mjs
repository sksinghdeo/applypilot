import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sceneDir = join(root, 'media', 'video-scenes');
const output = join(root, 'media', 'ApplyPilot_LinkedIn_Demo_1080x1350.mp4');
const scenes = [
  ['scene-01-intro.png', '4.2'],
  ['scene-02-profile.png', '5.2'],
  ['scene-03-extension.png', '5.8'],
  ['scene-04-analysis.png', '6.4'],
  ['scene-05-review.png', '5.8'],
  ['scene-06-dashboard.png', '5.0'],
  ['scene-07-outro.png', '4.6'],
];

for (const [name] of scenes) {
  const path = join(sceneDir, name);
  if (!existsSync(path)) {
    console.error(`Missing video scene: ${path}`);
    process.exit(1);
  }
}

const version = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
if (version.error || version.status !== 0) {
  console.error('FFmpeg is required to rebuild the demo video. Install FFmpeg, then rerun npm run demo:record.');
  process.exit(1);
}

const args = ['-y'];
for (const [name, duration] of scenes) {
  args.push('-framerate', '15', '-loop', '1', '-t', duration, '-i', join(sceneDir, name));
}
args.push('-f', 'lavfi', '-t', '34', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000');

const zoom = (amount) => `scale=1080:1350,zoompan=z='min(zoom+${amount},1.018)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1350:fps=15,format=yuv420p`;
const filter = [
  `[0:v]${zoom('0.00035')}[v0]`,
  `[1:v]${zoom('0.00030')}[v1]`,
  `[2:v]${zoom('0.00030')}[v2]`,
  `[3:v]${zoom('0.00030')}[v3]`,
  `[4:v]${zoom('0.00030')}[v4]`,
  `[5:v]${zoom('0.00030')}[v5]`,
  `[6:v]${zoom('0.00035')}[v6]`,
  '[v0][v1]xfade=transition=fade:duration=0.5:offset=3.7[x1]',
  '[x1][v2]xfade=transition=fade:duration=0.5:offset=8.4[x2]',
  '[x2][v3]xfade=transition=fade:duration=0.5:offset=13.7[x3]',
  '[x3][v4]xfade=transition=fade:duration=0.5:offset=19.6[x4]',
  '[x4][v5]xfade=transition=fade:duration=0.5:offset=24.9[x5]',
  '[x5][v6]xfade=transition=fade:duration=0.5:offset=29.4[vout]',
].join(';');

args.push(
  '-filter_complex', filter,
  '-map', '[vout]',
  '-map', '7:a',
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '18',
  '-pix_fmt', 'yuv420p',
  '-profile:v', 'high',
  '-level', '4.1',
  '-movflags', '+faststart',
  '-c:a', 'aac',
  '-b:a', '128k',
  '-shortest',
  output,
);

console.log(`Building ${output}`);
const result = spawnSync('ffmpeg', args, { stdio: 'inherit' });
if (result.error || result.status !== 0) {
  console.error('Demo video build failed.');
  process.exit(result.status ?? 1);
}
console.log('Demo video created successfully.');
