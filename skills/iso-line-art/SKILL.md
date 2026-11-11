---
name: iso-line-art
description: Build animated line-art scenes seen from above at a quasi-isometric (2:1 dimetric, bird's-eye diorama) angle in SVG and TypeScript — town squares and plazas, a cathedral or church square, markets, harbours, a village or campus from above, café terraces with people sitting, crowds milling, pigeons — with the sun turning shadows through the day and lights coming on at night. Use this whenever someone asks for an isometric, aerial, top-down, bird's-eye, axonometric, map-like or diorama view of a place drawn in line art / ink / hand-drawn style, or wants an existing front-on line-art street "seen from above", even if they never say "isometric".
---

# Isometric line-art scenes

Scenes seen from above at a fixed quasi-isometric angle, in the same pen-and-paper style as
the `line-art-animation` library this skill builds on: one thin ink line, paper fills, a few
flat colours, people and things that move with simple physics, a day/night cycle. The
result is a self-contained card component (or video frames) like the front-on examples,
seen as a living diorama.

This skill lives in the `line-art-animation` repository (`skills/iso-line-art/`). It uses
that repository's `lib/` — `ink.ts` (pens, `run()`), `motion.ts` (springs, wind),
`daynight.ts` (palette) — plus `lib/iso.ts`, the camera written for it. The reference
scene is `examples/plaza/`: the steps of a cathedral and the square before them, seen close
(11 px a metre), with the west front filling the upper left. Read it before building anything:
`build.ts` for architecture and furniture, `people.ts` for figures and pigeons, `main.ts`
for time, light, sorting and the comings and goings.

## The one idea that makes it work

The camera is a **parallel** 2:1 projection (`sx = (x − y)·s`, `sy = (x + y)·s/2 − z·s`),
so every plane in the world lands on the screen by a single affine map. Draw a façade, a
pavement, an awning or a sign *flat, in that plane's own metres*, the way a front-on
elevation is drawn, inside a group whose `transform` is `I.wall(...)`, `I.ground()` or
`I.plane(...)`. Windows, arches, lettering and stripes then sit on their wall in correct
perspective with no per-point maths. Pen widths inside such a group are in metres too:
`px / I.s`. Never introduce true perspective: it breaks this, and the style doesn't want it.

`references/projection.md` has the maths, the API and the conventions for which way a
wall's local axes run; read it before writing the first façade.

## Workflow

1. **Frame the camera first.** Decide whether this is a *whole-place* view (the full
   square on a slab, ~6.5 px a metre, people ~11 px) or a *close* view (a corner of it,
   ~11 px a metre, people ~19 px, the landmark cropped by the card's edge), where the tall
   things go, and the scale. Ask which the person means if it isn't obvious: "a square in
   front of a cathedral" can be either, and the close view is where detail lives. Compute the screen extent of the
   tallest point and the front corner of the ground slab and fit them in the card
   (`projection.md`, "Fitting the camera"). Things that run off the top are the most
   common first-draft fault.
2. **Block out the masses** with `box()`, `gable()` and `pyramid()`, paper fills, and look
   at one screenshot. Composition is decided here: tall buildings along the two back edges
   (small x + y), the front left open so nothing important hides behind anything. For a
   whole-place view put the scene on a **slab** with visible stone sides, so it reads as a
   diorama on the page; a close view runs off the card on every side instead.
   To see a building from a different side, **rotate the layout, not the camera**: only
   +x and +y faces are ever visible, so a façade that should face the viewer's lower right
   stands on the x = 0 edge facing +x, one facing lower left stands on y = 0 facing +y.
3. **Dress the walls** in wall planes: floors of windows with shutters and balconies, shop
   fronts with awnings and signs (letters ≥ 0.75 m or they're unreadable), the landmark's
   portals, rose window and towers. See `references/recipes.md`.
4. **Light it.** Register every face with its outward normal and shade it from `sunAt(τ)`
   and `lit()` each frame, so walls turn bright and dim as the sun goes round. Cast shadows
   with `boxShadow()` / `blobShadow()` into **one merged path**, clipped to the slab.
5. **Furnish the square**: paving drawn in the ground plane, fountain, trees in pits,
   lamps, benches, café tables with parasols. Each is a depth-sorted prop with an optional
   `draw()` and `shadow()`. In a close view the ground is where the eye rests, so draw it as
   it's really laid (granite courses with staggered joints, pebble mosaic, a medallion,
   drains, tree grates) rather than a grid. Fine texture is an SVG `<pattern>` in the
   ground plane's metres: it transforms with the plane and costs nothing per frame.
6. **People and life.** Seats that fill and empty with the hour; walkers on routes with
   pauses (looking up, taking a photo) that go round obstacles; staff (a waiter); a flock
   of pigeons that a running child or the bells send up. Get one corner looking right and
   show it before filling the square: a full scene built at once comes back generic.
7. **Night**: windows as panes that light one by one, floodlight the landmark, pools of
   lamp light on the paving (circles in the ground plane become ellipses for free), light
   spilling out of shop fronts.
8. **Verify** as the base skill does (`?debug`, `?tau=`, frame strips), plus: a sweep of
   morning / noon / evening / night to see shadows and shading turn, and zoomed crops of
   people (they're 11 px tall; check they read as sitting or walking).

## Rules that make it work

- **Visible faces are always the top, the +y face (screen left) and the +x face (screen
  right).** Anything facing −x or −y is never drawn. Design buildings so their fronts face
  +x or +y, i.e. into the square from the back edges.
- **Draw back to front by `x + y`.** Buildings are sorted once by the centre of their
  footprint; everything that moves or stands in the square (people, props, pigeons) lives
  in one layer re-sorted each frame. Re-append children only when the order changed. Big
  objects that overlap in the sort order are the classic failure: keep the layout simple
  enough (rows on the back edges, open front) that centre sorting is right.
- **The sun goes round, so light and shadow must too.** `sunAt()` by default rises
  screen-right, is in front of the viewer at noon and sets screen-left: morning and evening
  shadows sweep across a square whose buildings stand along the back edges, and each row of
  façades gets its turn in the light. Shadows of things in the air (birds) are a small dot
  displaced along the cast, not a streak from the ground.
- **A person is ~11 px wide-view, ~19 px close.** Posture and placement carry everything: draw
  figures as upright billboards at their feet's screen point, in profile, facing whichever
  way the heading's screen-x (`dx − dy`) points. A seat's height decides how sitting reads:
  ~0.45 m for chairs and benches, ~0.7 m for a fountain rim, and *knees up* on steps.
  People fade in and out (never pop), and enter at the slab's or the card's edge. Close
  up, give them both arms, shoes, hats and bags, and something in their hands (an ice
  cream, a phone, a book, a camera, a guide's flag): it's what makes a crowd read as people.
- **Shadows go only on drawn ground.** Clip the merged shadow path to the slab or the
  paving, or the back rows' shadows fall into the sky behind the roofs.
- **Life comes from schedules, not from motion everywhere.** Terraces busy at lunch and
  late at night, steps and benches by day, fewer walkers after midnight, bells on the hour.
  Idle motion is small: a sip, a glance, a wave when clicked.
- **Keep the style of the base skill**: one pen, paper fills, flat accent colours used
  sparingly, colour pushed toward the night palette after dark (walls keep a moonlit hint
  of their colour), no outlines thicker than the scene pen, the card never changes the
  page colour.

## Library at a glance (`lib/iso.ts`)

| | |
|---|---|
| `iso({ scale, zScale, origin })` | the camera: `p()`, `pt()`, `poly()`, `plane()`, `wall()`, `ground()`, `depth()` |
| `planeGroup(parent, transform)` | a `<g>` whose children are in a plane's metres |
| `box`, `gable`, `pyramid` | visible faces of boxes, gable roofs, spires; fills left to the caller for shading |
| `ring(I, cx, cy, r, z)` | a circle on a level (basins, tables, ground patterns) |
| `sunAt(τ)`, `lit(sun, normal)` | sun direction, elevation, strength, shadow cast; face brightness |
| `boxShadow`, `blobShadow`, `hull` | ground shadows of boxes and point-like things |

## Files

- `references/projection.md` — the projection, local axes of walls, camera fitting, sorting.
- `references/recipes.md` — how the reference scene draws a cathedral, row houses, shop
  fronts, the square's furniture, people, pigeons and night lighting, with sizes that work.
- `evals/` — test prompts for this skill.
