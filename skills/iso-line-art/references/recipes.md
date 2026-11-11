# Recipes (from `examples/plaza`)

Sizes in metres unless they say px. The reference scene is a close view at scale 16 (a
metre up is 16 px); the first draft was a whole-square view at 6.5 on a slab, and both are
described here.

## Close view of a landmark

- Camera: `iso({ scale: 16, origin: [538, 226] })` on 960 × 600, the landmark's front on
  the x = 0 edge facing +x, its towers cropped by the top of the card. Check the bottom
  edge: things are visible while x + y < (600 − oy) / (s / 2) (≈ 46 m here), and move the
  furniture and the regulars inside it.
- No sky: the rows round the square are 17–19.5 m with 3.6 m roofs, and a taller block
  stands behind the left-hand row to fill the corner above it. Check the top edge at each
  ridge: sy = oy + (x + y)·s/2 − z·s must be < 0 across the card's width.
- Time is set by dragging the tower clock's hour hand (12 h a turn): take the pointer back
  into the wall's metres (on x = 0: y = (ox − sx)/s, z = (oy + y·s/2 − sy)/(s·zs)) and read
  its angle about the dial's centre.
- The near sides of the square are four unseen boxes (17–19 m) with two street gaps; they
  only cast shadows, on the paving and up the cathedral and the shops (`wallShadow`), and
  walkers arrive and leave by the gaps and the alley.
- Textures (`groundPatterns()` in `build.ts`): `p-grime` 6 m tile of specks, gum spots and
  faint stains over all the paving and the treads; `p-stucco` 5 m tile of specks, redone
  patches and two hairline cracks on every rendered wall; `p-ashlar` courses 0.6 m with
  staggered joints and the odd paler or darker block on the cathedral; `p-roof` cover tiles
  0.45 m wide in 0.4 m courses on each roof slope; cakes, bottles, fans and postcards, pots
  and plates in the shop windows.
- West front recessed 1.2 m between the towers so the tower's inner flank shows; dressed
  stone (`p-ashlar`); a portal of six archivolts each lined with small
  figures, three jamb statues a side on pedestals under canopies, studded doors with iron
  strap hinges and a trumeau statue, a tympanum; a gallery of niches with figures; a
  sixteen-light rose; a tower clock that keeps the scene's time; gargoyles; side portals.
- Steps across the front, a landing in the recess, a paler worn hollow in each tread,
  side walls with pedestals and urns, stone posts along the bottom with iron chains swaying
  between them (a dashed catenary), grand three-lantern lamps either side.
- Ground in patterns: granite flags (`p-flags`, courses 0.8 m with staggered joints,
  a tile of 3.2 × 4.2 m), weathered and replaced stones as faint lighter and darker slabs,
  river-pebble mosaic in two tones (`p-peb-dark`, `p-peb-light`: a 0.6 m tile of nine
  herringbone pebbles 0.15 m long) making a framed panel before the steps, four-petalled
  corner fleurons, a sixteen-point star medallion on the portal's axis, a chevron band
  running out across the square. Patterns don't follow the night palette: lay a veil of
  paper colour over them at ~0.6 × inkT.
- Tree pits with radial cast-iron grates, a manhole cover, a drainage channel, bins,
  bicycles, a scooter.

## Whole-square view

### The slab and the square

- Slab: `box()` from (−12.5, −12.5, −1.8) to (50.5, 41.5, 0); top in a pale stone, the two
  visible sides darker earth with two strata lines. It frames the scene and gives shadows
  somewhere to stop (clip the shadow layer to the slab's top).
- Paving in the ground plane: a 2 m slab grid at ~0.3 px lines, opacity 0.55; a ring of
  darker setts round the fountain with radial joints; a kerb line where the square meets
  the pavement.

### Row houses on the back edges

- A box per building (12 m frontage, 10–14 m tall, 11 m deep), a gable roof whose ridge
  runs along the row (`'x'` for the back row, `'y'` for the left row) with tile courses
  drawn on the visible slope every 0.9 m.
- Floors of 3.2 m above a 4.2 m ground floor; three bays per floor: a window 1.1 m wide,
  shutters either side, a balcony from the first floor up: the slab drawn in world
  coordinates (it's seen from above), the railing on a wall plane 0.7 m out.
- Shop front: a glazed opening 3 m high across the frontage that lights up after dark, a
  sign board above it with the name in small capitals (≥ 0.75 m letters), and an awning:
  a plane from just under the sign, 1.6 m out and 0.7 m down, striped every ~0.7 m, a
  scalloped valance.
- Wall colours: warm creams, ochres, pale terracotta; shutters green, brown or blue.

### A Gothic cathedral

- Two towers 7 × 7 m, 29 m to the balustrade, belfry openings near the top with bells
  hanging in them, string courses, one lancet per face lower down; an octagonal spire
  approximated by a 12 m pyramid with crockets (short ticks up its edges) and four corner
  pinnacles, a cross on top.
- West front between them: a gabled wall to 27.5 m, a deep pointed portal with four
  archivolts and a dark door, a gallery of niches, a rose window (a ring of twelve lights
  round a hub), pinnacles at the gable's shoulders.
- Nave behind (14 m wide, 26 m long, 19 m walls, 7.5 m roof): tall lancets on the visible
  side, buttresses every 3.2 m with small pinnacles and a flying arch each onto the
  clerestory, a small crossing tower with a slender spire.
- Steps across the whole front: four treads of 0.3 m, each a box set back 1 m — people sit
  on them, walkers climb them (give walkers a height function).
- Floodlighting: the front's outline in the glow layer, filled with a vertical gradient
  warm at the bottom, fading up; opacity follows `P.lamp`.

## The square's furniture (depth-sorted props)

- Fountain: basin r 3.6, rim 0.7 m, water inside, a column with a bowl and eight jets
  drawn as quadratic arcs from the bowl to the water, rings expanding on the surface.
- Trees in square pits: trunk to 2.2 m, a lumpy round crown at 3.3 m (r 1.9) with leaf
  ticks and a few fruit, swaying a little with the wind.
- Lamps: a 4.2 m post and a lantern whose glass lights after dusk, a pool of light as a
  circle in the ground plane, a halo round the lantern.
- Café tables: a round top at 0.75 m, a square parasol: all four panels of a shallow
  pyramid (seen from above, the back two show too), alternating colours, a scalloped hem
  on the two front edges, shifting with the wind; two chairs' worth of seats per table.
- Benches facing the fountain: a wooden slab box on two legs.

## People (`people.ts`)

- Figures are designed ~12 px tall and scaled by `I.s / 6.5`; the close view adds a far
  arm, shoes, sun hats and caps, backpacks and totes, long hair.
- Regulars give a square its character: a guitarist on a stool with an open case filling
  with coins (click to tip him), a balloon seller (click and a balloon gets away and drifts
  off), someone feeding the pigeons from a bench, a tour group listening to a guide with a
  flag, arriving and leaving through the day.

- About 12 px tall at scale 6.5–7: legs as two strokes from the hip, a torso shape in a
  clothing colour (a flared one for skirts), a head circle with a hair cap, one visible
  arm. That is enough.
- Poses: walking (legs scissor with phase advanced by distance / 1.4 m), standing, seated
  (hip at the seat height, thighs forward, shins down — knees above the hip when the seat
  is low), drinking (hand to mouth with a cup), waving (on click), photographing (a small
  camera held out toward the landmark), carrying a tray.
- Seats are slots that fill and empty with the hour (`busy(kind)`), each occupant fading
  in and out. Walkers take routes from the slab's edges: across the square with a pause,
  up the steps and into the cathedral, out of the cathedral and away; insert a detour
  waypoint when a straight line passes too close to the fountain.
- Pigeons: a dozen or so pecking about; flush them (up in a loop over the square and back
  down) when the bells ring, when clicked, or when a running child gets within 2 m.

## Night

- Window panes are `windowPane()` entries with an on-threshold on `P.lamp` and, for some,
  a late switch-off time; their fill goes from day glass to dark glass to warm light.
- Shop fronts throw a gradient trapezoid of light out onto the paving (a ground-plane
  group spanning the shop front, 6 m out).
- Keep the walls a moonlit, desaturated version of their colour instead of letting them
  sink into the paper.
