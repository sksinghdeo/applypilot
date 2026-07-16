# LinkedIn demo video

The finished muted-first video is included at:

```text
media/ApplyPilot_LinkedIn_Demo_1080x1350.mp4
```

- Format: 1080 × 1350, 4:5
- Runtime: 34 seconds
- Frame rate: 15 fps
- Codec: H.264 with a silent AAC track
- Thumbnail: `media/ApplyPilot_LinkedIn_Thumbnail.png`

## Storyboard

**0:00–0:04 — Product hook**  
“I built ApplyPilot — a privacy-first job application copilot.”

**0:04–0:09 — Candidate source of truth**  
Reusable profile, portfolio/website field, work authorization, and role preferences.

**0:09–0:14 — Browser companion**  
Extract title, company, location, work mode, and compensation from the active job page.

**0:14–0:20 — Opportunity analysis**  
Show fit score, recommendation, blockers, and resume routing.

**0:20–0:25 — Human review**  
Routine facts may be prepared; sensitive answers remain pending approval.

**0:25–0:30 — Decision trail**  
Show local application tracking and approval checkpoints.

**0:30–0:34 — Close**  
“AI handles the repetition. You keep control.”

## Rebuild the video

The seven precomposed scene images are in `media/video-scenes/`. With FFmpeg installed:

```bash
npm run demo:record
```
