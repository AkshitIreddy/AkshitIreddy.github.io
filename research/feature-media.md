# Feature media production notes

Generated on 2026-08-27 for the Software in Motion portfolio. All derivatives live in
`public/media/features/`; the original files in `public/media/` were left
untouched.

## Decisions

- Preserve every source's full spatial frame. There is no crop, reframing, or
  zoom in any derivative.
- Preserve native resolution rather than inventing detail through upscaling.
- Use VP9 WebM as the compact preferred source and H.264 MP4 as the broad
  compatibility fallback. Both are silent and browser-loopable. The optimized
  source derivatives are 30 fps; the self-captured Gifsmith showcase retains
  Gifsmith's native 16 fps cadence.
- Encode posters as WebP at quality 90 / method 6 from a representative source
  frame. The self-captured Gifsmith poster is the deliberate exception: it is
  taken from Gifsmith's own canonical H.264 review output.
- The 177.600 s Alcove recording and 25.928 s Compendium recording were the two
  sources too long for ambient portfolio loops. Their derivatives are focused
  15.000 s excerpts. The remaining animations preserve one complete source
  cycle.

The 2026-08-27 refinement supersedes the Alcove excerpt for the public feature:
`public/media/features/alcove-full.webp` is a byte-for-byte copy of the complete
177.600 s README animation. It is shown as the looping animated WebP in normal
motion mode and swaps to `alcove-poster.webp` when reduced motion is requested.
The older 15-second WebM/MP4 derivatives remain documented below as provenance
but are no longer referenced by the site.

## Source audit and temporal selection

| Project | Original source | Native dimensions | Frames | Source duration | Source size | Derivative timeline | Poster source time |
|---|---|---:|---:|---:|---:|---|---:|
| Alcove | `public/media/alcove-demo.webp` | 900x562 | 1,500 | 177.600 s | 13,077,578 B | 128.000-143.000 s | 134.000 s |
| Convai Desktop Pet | `public/media/pet.gif` | 960x480 | 187 | 12.470 s | 1,889,696 B | full cycle | 6.800 s |
| Keyscape | `public/media/keyscape.webp` | 1040x651 | 120 | 7.200 s | 1,871,518 B | full cycle | 3.900 s |
| Email Briefing | `public/media/email.gif` | 720x450 | 226 | 16.140 s | 6,910,364 B | full cycle | 10.300 s |
| Gifsmith self-capture | `source-repos/gifsmith/portfolio-showcase/out/gifsmith-workflow.mp4` | 1000x620 | 159 | 9.938 s | 1,104,224 B | full anchor loop | 7.000 s |
| Compendium | `public/media/compendium.webp` | 840x526 | 245 | 25.928 s | 3,717,420 B | 4.000-19.000 s | 14.100 s |
| Transparency | `public/media/transparency.png` | 1440x1020 | 1 | still | 62,252 B | still | n/a |

Animated WebP timing was read from Pillow 12.3/libwebp's cumulative frame
timestamps because this FFmpeg build reports width/height zero for animated
WebP inputs. Selected frames were losslessly expanded to temporary RGB PNGs,
and an FFmpeg concat manifest preserved each source-frame duration. Those
temporary frames were removed after encoding.

## Final output manifest

| File | Codec / format | Dimensions | Duration | Size |
|---|---|---:|---:|---:|
| `alcove.webm` | VP9 | 900x562 | 15.033 s | 354,427 B |
| `alcove.mp4` | H.264 High / yuv420p | 900x562 | 15.033 s | 419,492 B |
| `alcove-poster.webp` | WebP | 900x562 | still | 39,432 B |
| `pet.webm` | VP9 | 960x480 | 12.466 s | 752,467 B |
| `pet.mp4` | H.264 High / yuv420p | 960x480 | 12.467 s | 784,886 B |
| `pet-poster.webp` | WebP | 960x480 | still | 89,796 B |
| `keyscape.webm` | VP9 | 1040x651 | 7.233 s | 146,833 B |
| `keyscape.mp4` | H.264 High / yuv420p | 1040x652 | 7.233 s | 273,788 B |
| `keyscape-poster.webp` | WebP | 1040x651 | still | 44,632 B |
| `email.webm` | VP9 | 720x450 | 16.133 s | 980,378 B |
| `email.mp4` | H.264 High / yuv420p | 720x450 | 16.133 s | 1,737,399 B |
| `email-poster.webp` | WebP | 720x450 | still | 39,368 B |
| `gifsmith.webm` | VP9 | 1000x620 | 9.938 s | 284,232 B |
| `gifsmith.mp4` | H.264 / yuv420p | 1000x620 | 9.938 s | 1,104,224 B |
| `gifsmith-poster.webp` | WebP | 1000x620 | still | 53,820 B |
| `compendium.webm` | VP9 | 840x526 | 15.033 s | 971,872 B |
| `compendium.mp4` | H.264 High / yuv420p | 840x526 | 15.033 s | 1,328,511 B |
| `compendium-poster.webp` | WebP | 840x526 | still | 63,824 B |
| `transparency.webp` | WebP | 1440x1020 | still | 44,032 B |

The duration is one frame longer than the selected source timeline in some
files because the concat demuxer needs the final frame repeated to apply its
duration and those results are normalized to 30 fps. Gifsmith's replacement is
an original 159-frame, 16 fps anchor loop and does not use that conversion.

## Gifsmith replacement provenance

The original `public/media/gifsmith.webp` was a real Gifsmith-generated Aurora
example, but its email-briefing subject made Gifsmith and Email Briefing look
like the same project. It has therefore not been used in the final feature
derivatives.

The replacement is an honest input-to-output explanation of the framework:

- Source repository: `https://github.com/AkshitIreddy/gifsmith`, cloned at
  commit `588ec8e455ab5f3647e9c6612200dfedad68fe8c` (package version 0.3.4).
- Capture page: `source-repos/gifsmith/portfolio-showcase/app.html`. Its left
  side shows the real declarative API (`timeline`, `loopAnchor`, `click`,
  `waitFor`, `scroll`, and `render`); its center shows the real four-part
  direction model; its right side embeds the repository's real generated
  `examples/pulse/demo.webp` output at full frame.
- Capture script: `source-repos/gifsmith/portfolio-showcase/demo.mjs`. It
  imports and executes the cloned repository's own built `render`, `timeline`,
  `web`, and `cursor` modules. The showcase is therefore captured by Gifsmith
  itself, rather than being a fictional product UI.
- Capture mode: deterministic, 1000x620, 16 fps, anchor loop with a minimum
  eight-second cycle. The real result selected frames 7-166, produced 159
  frames / 9.938 seconds, and reported seam MSE 0.02778.
- The repository-generated review MP4 is the final compatibility MP4; its
  WebM and poster are straightforward derivatives of that review copy.

The exact self-capture command, run from `source-repos/gifsmith`, was:

```bat
cmd.exe /d /c "set \"FFMPEG_PATH=C:\FFmpeg\bin\ffmpeg.exe\" && set \"PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe\" && node portfolio-showcase\demo.mjs"
```

## Exact FFmpeg commands

The Windows build used was `C:\FFmpeg\bin\ffmpeg.exe`. From the website root,
`FF=/mnt/c/FFmpeg/bin/ffmpeg.exe` was set in the WSL shell.

Animated WebP sources were decoded to temporary lossless PNG sequences with
Pillow. Each sequence directory contained a `concat.txt` of this form:

```text
file 'frame_00000.png'
duration 0.071000
file 'frame_00001.png'
duration 0.072000
...
file 'frame_LAST.png'
duration FINAL_SECONDS
file 'frame_LAST.png'
```

The exact VP9 commands were:

```bash
$FF -hide_banner -loglevel warning -f concat -safe 0 -i public/media/features/.frames-gIMnQm/alcove2/concat.txt -vf "fps=30,format=yuv420p" -an -c:v libvpx-vp9 -b:v 0 -crf 28 -row-mt 1 -tile-columns 1 -deadline good -cpu-used 2 -y public/media/features/alcove.webm
$FF -hide_banner -loglevel warning -ignore_loop 1 -i public/media/pet.gif -vf "fps=30,format=yuv420p" -an -c:v libvpx-vp9 -b:v 0 -crf 28 -row-mt 1 -tile-columns 1 -deadline good -cpu-used 2 -y public/media/features/pet.webm
$FF -hide_banner -loglevel warning -f concat -safe 0 -i public/media/features/.frames-gIMnQm/keyscape/concat.txt -vf "fps=30,format=yuv420p" -an -c:v libvpx-vp9 -b:v 0 -crf 28 -row-mt 1 -tile-columns 1 -deadline good -cpu-used 2 -y public/media/features/keyscape.webm
$FF -hide_banner -loglevel warning -ignore_loop 1 -i public/media/email.gif -vf "fps=30,format=yuv420p" -an -c:v libvpx-vp9 -b:v 0 -crf 28 -row-mt 1 -tile-columns 1 -deadline good -cpu-used 2 -y public/media/features/email.webm
$FF -hide_banner -loglevel warning -i source-repos/gifsmith/portfolio-showcase/out/gifsmith-workflow.mp4 -an -vf "format=yuv420p" -c:v libvpx-vp9 -b:v 0 -crf 28 -row-mt 1 -tile-columns 1 -deadline good -cpu-used 2 -y public/media/features/gifsmith.webm
$FF -hide_banner -loglevel warning -f concat -safe 0 -i public/media/features/.frames-gIMnQm/compendium/concat.txt -vf "fps=30,format=yuv420p" -an -c:v libvpx-vp9 -b:v 0 -crf 28 -row-mt 1 -tile-columns 1 -deadline good -cpu-used 2 -y public/media/features/compendium.webm
```

The exact H.264 commands were:

```bash
$FF -hide_banner -loglevel warning -f concat -safe 0 -i public/media/features/.frames-gIMnQm/alcove2/concat.txt -vf "fps=30,format=yuv420p" -an -c:v libx264 -preset slow -crf 18 -tune animation -profile:v high -movflags +faststart -y public/media/features/alcove.mp4
$FF -hide_banner -loglevel warning -ignore_loop 1 -i public/media/pet.gif -vf "fps=30,format=yuv420p" -an -c:v libx264 -preset slow -crf 18 -tune animation -profile:v high -movflags +faststart -y public/media/features/pet.mp4
$FF -hide_banner -loglevel warning -f concat -safe 0 -i public/media/features/.frames-gIMnQm/keyscape/concat.txt -vf "fps=30,pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0:color=#10141d,format=yuv420p" -an -c:v libx264 -preset slow -crf 18 -tune animation -profile:v high -movflags +faststart -y public/media/features/keyscape.mp4
$FF -hide_banner -loglevel warning -ignore_loop 1 -i public/media/email.gif -vf "fps=30,format=yuv420p" -an -c:v libx264 -preset slow -crf 18 -tune animation -profile:v high -movflags +faststart -y public/media/features/email.mp4
$FF -hide_banner -loglevel warning -i source-repos/gifsmith/portfolio-showcase/out/gifsmith-workflow.mp4 -map 0:v:0 -c copy -movflags +faststart -y public/media/features/gifsmith.mp4
$FF -hide_banner -loglevel warning -f concat -safe 0 -i public/media/features/.frames-gIMnQm/compendium/concat.txt -vf "fps=30,format=yuv420p" -an -c:v libx264 -preset slow -crf 18 -tune animation -profile:v high -movflags +faststart -y public/media/features/compendium.mp4
```

Poster and still encoding used Pillow 12.3 exactly as follows after seeking the
source frame listed in the table:

```python
frame.convert("RGB").save(output_path, "WEBP", quality=90, method=6)
```

The Gifsmith replacement poster was instead taken directly from its review MP4:

```bash
$FF -hide_banner -loglevel warning -ss 7.0 -i source-repos/gifsmith/portfolio-showcase/out/gifsmith-workflow.mp4 -frames:v 1 -c:v libwebp -quality 90 -compression_level 6 -y public/media/features/gifsmith-poster.webp
```

## Visual verification

I inspected source contact sheets with 12 evenly distributed frames per full
animation, then inspected the final H.264 output at the start, midpoint, and
end of every video plus a second contact sheet containing all seven final
posters/stills.

I also loaded and started all 12 video files in Chromium through the local
website server. Every WebM and MP4 reached `readyState = 4` with the expected
intrinsic dimensions and duration; all seven WebP posters/stills decoded at
their expected dimensions. A full FFmpeg decode pass over every final video
completed without an error.

Observed results:

- All application chrome, sidebars, taskbars, notebook edges, and window
  shadows remain inside the frame; no output is clipped or stretched.
- Alcove's refined excerpt stays on a full open-book view from 128.0 to 143.0
  seconds and moves through the kittens/Huffman page, idea-tree page, welcome
  page, and local-video page. The source text remains readable at native scale.
- The Pet recording retains the complete desktop and all four moving pets.
- Keyscape retains the whole 1040x651 UI in WebM/poster. Its MP4 adds only one
  dark row at the bottom because 4:2:0 H.264 requires even dimensions; it does
  not crop or scale the source.
- Email Briefing retains the full 720x450 frame. It is the lowest-resolution
  source, so using it substantially above its native display size will soften
  small text; upscaling was rejected because it cannot restore source detail.
- Compendium's excerpt covers query, retrieval, synthesized answer, and source
  document inspection while retaining the full Windows frame.
- Gifsmith was checked across eight temporal frames from 0.2 to 9.2 seconds.
  The real code remains readable, every pipeline stage activates in order, the
  bundled Pulse example stays fully contained, the three output formats appear,
  and the final reset returns to the same neutral frame for the loop.
- Transparency's optimized still is visually indistinguishable at normal
  portfolio scale and is 29% smaller than its already compact PNG source.

As a codec-consistency check, full-sequence H.264-versus-VP9 luma SSIM was
0.9956 Alcove, 0.9837 Pet, 0.9716 Email, 0.9921 Gifsmith, and 0.9849
Compendium. Keyscape was excluded from direct SSIM because the compatibility
MP4 has the required one-pixel pad.

## Content and resolution limitations

- Email Briefing is only 720 px wide; Compendium is 840 px; Alcove and the
  source Alcove recording are below 960 px. Preserve native-size or contained
  presentation in the website. Do not `cover`-crop or enlarge these to a
  full-bleed viewport.
- All outputs are intentionally silent: none of the provided sources contained
  audio.
