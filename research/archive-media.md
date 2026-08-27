# Archive demo media provenance

Audit and render date: 2026-08-27 UTC. This file covers only the three older, high-signal projects requested for the museum archive. Repository counts are a live GitHub API snapshot and will drift.

## Selection rules

- Primary sources only: the author's GitHub repositories, media embedded by those READMEs, and the author's Alystria AI YouTube channel linked by the README.
- Keep the original downloads and shallow clones under `media-source/` and `source-repos/`; only the compact files under `public/media/archive/` are intended to ship.
- Portfolio clips are muted, 24 fps, 16:9, and 1280 x 720. Native 720p is preserved and 1080p is Lanczos-downscaled; no selected source is upscaled.
- Each clip has H.264 MP4 fallback (`yuv420p`, `+faststart`) and VP9 WebM primary output. Compact WebP posters match each clip's shipping dimensions.
- The museum should date these as 2023-era work and display the live star counts without presenting them as recent projects.

## Interactive LLM Powered NPCs

| Field | Value |
| --- | --- |
| Repository | https://github.com/AkshitIreddy/Interactive-LLM-Powered-NPCs |
| Audited commit | `503ef3b64a921b6a11efa9e3e0432a0c3de3b619` (`main`) |
| Live snapshot | 719 stars, 76 forks, MIT; pushed 2024-03-22 |
| Release | https://github.com/AkshitIreddy/Interactive-LLM-Powered-NPCs/releases/tag/v1.0.0 — published 2023-09-17; no attached release assets |
| README visual | The embedded GitHub asset is a static 1920 x 1080 JPEG thumbnail: https://github.com/AkshitIreddy/Interactive-LLM-Powered-NPCs/assets/90443032/feb9590f-3cde-476c-93ef-b0408169c150 |
| Demo source A | The author's X demo linked directly beside that thumbnail: https://twitter.com/Akshit2089/status/1673687342438051847 |
| Local source A | `media-source/npc-source.mp4` |
| Source A properties | 1280 x 720, 30 fps, 105.813 s, 16,750,639 bytes |
| Demo source B | “Interactive LLM Powered NPCs for any Game Installation,” Alystria AI, uploaded 2023-07-15: https://youtu.be/6SHTlKYKCbs |
| Local source B | `media-source/npc-youtube-source.mp4` |
| Source B properties | 1920 x 1080, 30 fps, 396.458 s, 44,039,625 bytes |

Transformation: use 0.400–22.400 s from source A, beginning immediately with the player walking into the club and then holding on the Jackie/Claire bar conversation. Crossfade for 0.650 s into 348.100–368.900 s from source B, which contains only the close Rogue/Johnny conversation. Crossfade the final 0.650 s into a 0.800 s clone of the opening source-A frame so the autoplay loop returns to the same composition rather than cutting from Rogue to a code editor or black frame. Remove audio, preserve/downscale to the best common 1280 x 720 dimensions with Lanczos, normalize to 24 fps and square pixels, and encode H.264 and VP9.

The shared render filter and exact codec commands were:

```bash
NPC_FILTER='[0:v]split=2[a0][c0];[a0]trim=start=0:end=22.000,setpts=PTS-STARTPTS,scale=1280:720:flags=lanczos,fps=24,setsar=1[a];[c0]trim=start=0:end=0.020,setpts=PTS-STARTPTS,scale=1280:720:flags=lanczos,fps=24,setsar=1,tpad=stop_mode=clone:stop_duration=0.800,trim=duration=0.800,setpts=PTS-STARTPTS[c];[1:v]trim=start=0:end=20.800,setpts=PTS-STARTPTS,scale=1280:720:flags=lanczos,fps=24,setsar=1[b];[a][b]xfade=transition=fade:duration=0.650:offset=21.350[ab];[ab][c]xfade=transition=fade:duration=0.650:offset=41.500,format=yuv420p[v]'

/mnt/c/FFmpeg/bin/ffmpeg.exe -y -ss 0.400 -i media-source/npc-source.mp4 -ss 348.100 -i media-source/npc-youtube-source.mp4 -an -filter_complex "$NPC_FILTER" -map '[v]' -c:v libx264 -preset slow -crf 20 -profile:v high -level 4.1 -movflags +faststart public/media/archive/interactive-llm-npcs.mp4

/mnt/c/FFmpeg/bin/ffmpeg.exe -y -ss 0.400 -i media-source/npc-source.mp4 -ss 348.100 -i media-source/npc-youtube-source.mp4 -an -filter_complex "$NPC_FILTER" -map '[v]' -c:v libvpx-vp9 -b:v 0 -crf 31 -deadline good -cpu-used 2 -row-mt 1 -tile-columns 2 -threads 8 public/media/archive/interactive-llm-npcs.webm

/mnt/c/FFmpeg/bin/ffmpeg.exe -y -ss 8.000 -i media-source/npc-source.mp4 -frames:v 1 -an -vf 'scale=1280:720:flags=lanczos,setsar=1' -c:v libwebp -compression_level 6 -quality 86 public/media/archive/interactive-llm-npcs-poster.webp
```

Poster: source-A frame at 8.000 s, showing Jackie and Claire at the bar with the conversation choice visible, preserved at 1280 x 720.

Outputs:

| File | Duration / dimensions | Size |
| --- | --- | ---: |
| `public/media/archive/interactive-llm-npcs.webm` | 42.292 s, 1280 x 720, VP9 | 6,070,330 B |
| `public/media/archive/interactive-llm-npcs.mp4` | 42.292 s, 1280 x 720, H.264 | 8,634,352 B |
| `public/media/archive/interactive-llm-npcs-poster.webp` | 1280 x 720 | 77,630 B |

## AI-Powered Video Tutorial Generator

| Field | Value |
| --- | --- |
| Repository | https://github.com/AkshitIreddy/AI-Powered-Video-Tutorial-Generator |
| Audited commit | `0db30d717da63b24790f2299941b953c2c721cf1` (`main`) |
| Live snapshot | 310 stars, 66 forks, Unlicense; pushed 2023-10-11 |
| Release | https://github.com/AkshitIreddy/AI-Powered-Video-Tutorial-Generator/releases/tag/v1.0.0 — published 2023-06-07; no attached release assets |
| README quick-demo source | https://github.com/AkshitIreddy/AI-Powered-Video-Tutorial-Generator/assets/90443032/0a1fb05a-8290-4391-b329-96f04dcae7a1 |
| Local source | `media-source/vtg-quick-source.mp4` |
| Source properties | 1920 x 1080, 30 fps, 88.833 s, 8,542,594 bytes, video-only |

Transformation: build the narrative from three longer passages: 13.000–22.500 s (creative controls), 25.500–39.100 s (topic and generation transition), and 41.750–58.500 s (the generated presenter-and-slide tutorial). Crossfade adjacent passages by 0.500 s, remove audio, Lanczos-downscale to 1280 x 720, and normalize to 24 fps and square pixels. The first boundary audit showed that the completed thermodynamics slide hard-jumped back to the creative-control sliders when the file looped. The final render therefore crossfades the result into a 0.800 s clone of the opening frame for 0.650 s beginning at output time 38.200 s, retaining the complete narrative in a 39.000 s loop.

Exact loop-return filter appended after the existing three-passage composition (`[abc]`):

```text
[d0]trim=start=13.000:end=13.020,setpts=PTS-STARTPTS,scale=1280:720:flags=lanczos,fps=24,setsar=1,tpad=stop_mode=clone:stop_duration=0.800,trim=duration=0.800,setpts=PTS-STARTPTS[d];
[abc][d]xfade=transition=fade:duration=0.650:offset=38.200,format=yuv420p[v]
```

Poster: source frame at 58.400 s, showing the generated thermodynamics tutorial and presenter; Lanczos-downscaled to 1280 x 720.

Outputs:

| File | Duration / dimensions | Size |
| --- | --- | ---: |
| `public/media/archive/video-tutorial.webm` | 39.000 s, 1280 x 720, VP9 | 2,044,058 B |
| `public/media/archive/video-tutorial.mp4` | 39.000 s, 1280 x 720, H.264 | 3,736,797 B |
| `public/media/archive/video-tutorial-poster.webp` | 1280 x 720 | 51,788 B |

The README's two full-demo GitHub assets were also preserved as `media-source/vtg-full-1-source.mp4` (852 x 480, 298.360 s, 7,248,192 B) and `media-source/vtg-full-2-source.mp4` (852 x 480, 133.600 s, 5,118,423 B). They were not selected because the quick demo is native 1080p and communicates the result more efficiently.

## CUPCAKEAGI

| Field | Value |
| --- | --- |
| Repository | https://github.com/AkshitIreddy/CUPCAKEAGI |
| Audited commit | `1fd2a3281bfe0cf945f75fe152ca6745353c887b` (`master`) |
| Live snapshot | 127 stars, 14 forks, Unlicense; pushed 2023-04-27 |
| Release | https://github.com/AkshitIreddy/CUPCAKEAGI/releases/tag/v1.0.0 — published 2023-04-25; no attached release assets |
| README demo source | https://user-images.githubusercontent.com/90443032/233522184-d59becf3-18e1-4ebd-86ae-09c882ba2104.mp4 |
| Local source | `media-source/cupcake-source.mp4` |
| Source properties | 1920 x 1080, 30 fps, 123.267 s, 5,707,229 bytes |

Transformation: build the interaction arc from 5.000–24.000 s (state-of-mind telemetry, prompt, and response) and 27.600–45.000 s (the generated rainbow-cupcake result). Crossfade the passages by 0.500 s, remove the source audio track, Lanczos-downscale to 1280 x 720, and normalize to 24 fps and square pixels. The first boundary audit showed the completed recipe hard-jumping back to the sparse greeting state. The final render crossfades the result into a 0.800 s clone of the opening frame for 0.650 s beginning at output time 35.250 s, yielding a 36.042 s loop without shortening the narrative.

Exact loop-return filter appended after the existing two-passage composition (`[ab]`):

```text
[d0]trim=start=5.000:end=5.020,setpts=PTS-STARTPTS,scale=1280:720:flags=lanczos,fps=24,setsar=1,tpad=stop_mode=clone:stop_duration=0.800,trim=duration=0.800,setpts=PTS-STARTPTS[d];
[ab][d]xfade=transition=fade:duration=0.650:offset=35.250,format=yuv420p[v]
```

Poster: source frame at 44.900 s, showing the rainbow interface and completed recipe response; Lanczos-downscaled to 1280 x 720.

Outputs:

| File | Duration / dimensions | Size |
| --- | --- | ---: |
| `public/media/archive/cupcakeagi.webm` | 36.042 s, 1280 x 720, VP9 | 1,167,445 B |
| `public/media/archive/cupcakeagi.mp4` | 36.042 s, 1280 x 720, H.264 | 1,507,774 B |
| `public/media/archive/cupcakeagi-poster.webp` | 1280 x 720 | 56,856 B |

## Visual and technical verification

Contact sheets were rendered from every finished MP4 at four-second intervals and inspected at original resolution:

- NPCs: the ten-frame sheet begins with the player already walking into the club, holds long enough to read the Jackie/Claire interaction, then shows only the Rogue/Johnny conversation from the second source. No code/editor or black frame appears. A separate boundary sheet inspected 0.000, 0.250, 41.450, 41.700, 42.050, and 42.250 s; it shows the final dissolve returning to the same moving club-entry composition used at the opening. Comparing the decoded H.264 first and final frames measured SSIM `0.966430`, confirming a close visual loop boundary rather than an unrelated hard cut.
- Tutorial generator: the controls, generation state, video preview, and finished teaching layout remain readable; both narrative transitions blend without a blank frame. A boundary sheet at 0.000, 0.250, 38.000, 38.300, 38.650, and 38.950 s shows the final thermodynamics slide dissolving cleanly back into the opening slider composition. Decoded H.264 first/final-frame SSIM is `0.987400`.
- CUPCAKEAGI: the greeting, request, response, state telemetry, and completed recipe form a comprehensible interaction sequence; the browser chrome and application bounds stay intact. A boundary sheet at 0.000, 0.250, 35.150, 35.400, 35.750, and 36.000 s shows the completed recipe dissolving back into the opening greeting state. Decoded H.264 first/final-frame SSIM is `0.976411`.

`ffprobe` confirms every shipping clip contains exactly one 24 fps `yuv420p` video stream and no audio stream. A fresh full `ffmpeg` decode-to-null pass completed without an error for all four loop-corrected Tutorial Generator and CUPCAKEAGI files; the NPC pair had already passed the same check. The three WebP posters were opened at original resolution and contain the intended representative frames.

## Repository hygiene

`source-repos/` is about 378 MB and `media-source/` is about 141 MB. They contain nested Git repositories, source downloads, contact sheets, metadata, and the local yt-dlp binary used for retrieval. Both directories should be ignored by the portfolio repository and omitted from Vercel deployment. The nine shipping WebM, MP4, and WebP files in `public/media/archive/` total 23,347,030 bytes (about 22.3 MiB); the three older PNG posters are retained locally but are not part of the intended deployed set.
