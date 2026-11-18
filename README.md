# Solano Heat: Golden Hour

![gta6-01 bounty](https://make.fun/badge/gta6-01.svg)
![rank](https://make.fun/badge/gta6-01/wilywonka1/port-solano-heat-2/rank.svg)
![reward](https://make.fun/badge/gta6-01/wilywonka1/port-solano-heat-2/reward.svg)

Built for the make.fun bounty [gta6-01](https://make.fun/bounty/gta6-01).

## The game

Solano Heat: Golden Hour is an original open-world crime game set in Port
Solano, a sun-drenched coastal city caught in permanent golden hour. You are
Juno Vale, a courier with a borrowed sports car, a talent for bad decisions,
and a whole evening of other people's errands ahead of her.

Port Solano is a full city to roam on foot or by car: a downtown grid of
towers and shopfronts (Café Delgado, Tito's Garage, Palmera Pharmacy, Marina
Motors, Solano Surf Co.), suburbs, a beach lined with umbrellas and towels, a
working marina with docks and boats, traffic that drives the road grid,
pedestrians, streetlights, billboards, and ten golden conches hidden around
the map for collectors.

The story runs through five missions. Rosa Delgado at Café Delgado hands you
an envelope for Tito Marlin; Tito sends you on a timed hot delivery to the
marina and slips you a pistol; Captain Sorin at the marina needs a debt
collected, then five cash bags recovered across the city while the heat
closes in; and the finale is the Harbour Run, a checkpoint race through the
streets starting at the marina. Between story beats you can pick up taxi
fares — passengers hail you, a green beacon marks the pickup, and fares pay
cash plus tips for fast, clean driving.

Crime has consequences. Steal a parked car, clip traffic, drive the
sidewalks or worse and your wanted stars climb from one to five: police
cruisers give chase, officers pursue on foot, and getting caught means a
busted screen and a fine, while losing the heat means lying low until the
stars fade. Your cash, conches, mission progress, taxi earnings and best
Harbour Run time are kept in a local save, and a live minimap plus an
objective banner keep the gold beacon, race checkpoints, taxi fares, police
and conches on screen at all times.

Everything is drawn and synthesised in code: the city, vehicles and people
are built from Three.js geometry with canvas-painted facades and signs, and
the engine notes, impacts, coins and sirens are WebAudio synthesis. There
are no downloaded art or audio assets.

## Screenshots

- `screenshots/01-cover.jpg` — Juno on foot at the spawn intersection, Café Delgado ahead.
- `screenshots/02-chase.jpg` — a three-star chase, cruisers on her tail.
- `screenshots/03-mission.jpg` — Tito Marlin's briefing at Tito's Garage.
- `screenshots/04-beach.jpg` — the yellow sports car at speed on the beachfront road.

## Controls

- WASD — move on foot / drive
- Mouse — look (click the game to lock the pointer)
- Shift — sprint on foot
- E — enter or exit a car, interact, continue after a mission
- Space — handbrake while driving
- Click or F — punch on foot; click shoots once you have the pistol
- R — reload the pistol
- Esc or P — pause

Follow the gold beacon for the current mission objective.

## How to play

You need Node.js. From the root of this repository:

```
node serve.ts
```

Then open http://localhost:8080 in a browser, choose Start, and follow
Rosa's briefing. If you have played before, Continue resumes your save.

## Entry layout

- `main.ts` — the make.fun entry point; running it writes the entry dossier.
- `serve.ts` — a small static server for the `game/` folder.
- `game/` — the game itself: `index.html`, source modules in `game/src/`,
  and the vendored Three.js build in `game/vendor/`.
- `screenshots/` — the four entry screenshots listed above.
