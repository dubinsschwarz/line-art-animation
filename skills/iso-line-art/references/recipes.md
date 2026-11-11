# Recipes (from `examples/plaza`)

Sizes in metres unless they say px. At scale 6.5 a metre up is 6.5 px.

## The slab and the square

- Slab: `box()` from (−12.5, −12.5, −1.8) to (50.5, 41.5, 0); top in a pale stone, the two
  visible sides darker earth with two strata lines. It frames the scene and gives shadows
  somewhere to stop (clip the shadow layer to the slab's top).
- Paving in the ground plane: a 2 m slab grid at ~0.3 px lines, opacity 0.55; a ring of
  darker setts round the fountain with radial joints; a kerb line where the square meets
  the pavement.

## Row houses on the back edges

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

## A Gothic cathedral

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
- Café tables: a round top at 0.75 m, a square parasol (two coloured faces and one pale)
  at 2.15–2.75 m that shifts with the wind; two chairs' worth of seats per table.
- Benches facing the fountain: a wooden slab box on two legs.

## People (`people.ts`)

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
