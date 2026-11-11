# Projection, planes, fitting, sorting

## The camera

```ts
import { iso } from '../../lib/iso.ts';
const I = iso({ scale: 6.5, zScale: 1, origin: [451, 252] });
I.p(x, y, z)        // → [sx, sy]
```

World units are metres. x runs to screen right-down, y to screen left-down, z up:

```
sx = ox + (x − y)·s
sy = oy + (x + y)·s/2 − z·s·zs
```

This is the 2:1 "pixel-art isometric" (dimetric) projection. One metre along x or y is
`s·√1.25` px on screen, one metre up is `s·zs` px. `zScale` other than 1 exaggerates or
flattens heights; leave it at 1 unless a tall landmark needs to fit.

The point (0, 0, 0) is the **back corner** of the scene: the top of the screen diamond.
Increasing x + y comes toward the viewer.

## Planes: drawing flat and placing with one matrix

Because the projection is linear, a plane through `o` spanned by vectors `U`, `W` maps
local coordinates `(u, w)` to `o + u·U + w·W`, which on screen is one SVG
`matrix(a b c d e f)`. `I.plane(o, U, W)` returns that transform string.

- `I.wall(o, along)` — a vertical wall. Local **u** runs along `along` (a unit vector),
  local **w** is height going **down** (`w = −3` is three metres up), so an elevation
  drawn with the ground at `w = 0` and the top at `w = −height` drops in unchanged.
- `I.ground(z = 0)` — a level surface. Local u = x, w = y.
- `I.plane(o, U, W)` — anything else: an awning (U along the shop front, W out from the
  wall and down), a sloping roof, a sign on a sloping surface.

Inside a plane group everything is in metres: font sizes, stroke widths (`px / I.s`),
radii. Text and stroke widths skew slightly with the face, which reads as "painted on
the wall".

### Which way a wall's u axis should run

Choose `o` and `along` so that u increases **left to right as the viewer sees the wall**;
then lettering reads correctly and elevation drawings aren't mirrored.

| face | outward normal | origin `o` | `along` |
|---|---|---|---|
| +y face (screen left) of a box x0..x1, y0..y1 | (0, 1, 0) | (x0, y1, 0) | (1, 0, 0) |
| +x face (screen right) | (1, 0, 0) | (x1, y1, 0) | (0, −1, 0) |

A helper that also returns world points on the wall (for balcony slabs, awnings) is in
`examples/plaza/build.ts` (`wallOn()`, with `at(u, h, d)` for a point `d` metres out).

## Fitting the camera

Work out three screen extremes before drawing anything:

- the **highest** point (a spire's cross): `sy = oy + (x + y)·s/2 − z·s`
- the **lowest**: the front corner of the slab, including its thickness
- the **left** and **right** ends: the slab's two side corners, and anything tall that
  sticks out sideways (a nave running back at the right)

The vertical span is `(lowest − highest)` in units of `s`; pick `s` so it fits the card
height minus the margins (≈ 12 px top, ≈ 35 px for the hint at the bottom), then set
`oy` from the top margin and `ox` to centre the horizontal span. For the reference square
(slab −12.5…50.5 × −12.5…41.5, towers to 43 m): s = 6.5, origin (451, 252) on 960 × 600.

If a long building running back (a nave) goes off the top, shorten it or lower its roof
before shrinking everything: its far end is the highest point on screen even though it
isn't the tallest thing.

## Sorting

Painter's algorithm by `I.depth(x, y) = x + y` of the object's footprint centre:

- **Static architecture** is sorted once, at build time. With buildings along the two
  back edges and no two tall masses overlapping in footprint, centre sorting is right.
  Things attached to a building (its steps, its west front) get a small key bias so they
  draw just after it.
- **The square's contents** (props, people, pigeons) share one layer and are re-sorted
  every frame by key; only re-append DOM children when the order actually changed.
  Things in the air (birds in flight) get a key above everything.
- Overlapping big objects at similar depth (a tower and a roof that both cover each
  other partly) can't be fixed by sorting: split them (draw the tower in front of the
  façade with a small bias) or move them apart.

## Light and shadow

`sunAt(τ)` returns `dir` (unit horizontal vector toward the sun), `elev`, `strength`
(0 at night, fading in over dawn) and `cast` (ground offset of a shadow per metre of
height). `lit(sun, normal)` gives 0.35 … 1 brightness for a face. In the reference scene
every face is registered with its normal (`surface()` in `build.ts`) and recoloured each
frame: `mix(paper, mix(colour, shadeTone, 1 − lit), k)` by day, a moonlit hint of the
colour at night.

Shadows are polygons on the ground: `boxShadow()` for boxes (convex hull of the
footprint and the top corners pushed along `cast`), `blobShadow()` for people, lamps,
trees. Merge all of them into one path each frame (they share a winding, so overlaps
don't darken twice) at ~0.2 × strength opacity, and clip it to the slab.
