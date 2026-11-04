# Sources and migration

Selection requested 2026-11-04. Original repositories remain unchanged.

- `flam-ing/flaming-games` local revision `c9f97373f327b33734a6b85c58847222b7858f88`: Stadium says/sushi/harden/stampede, Gate Defense, Chess, and Road (now `crossroad`, added 2026-11-05); original MIT license preserved at root and in the new crossing game's licenses folder.
- `flam-ing/flamingo-ramen` revision `672bbdccb6ade9953d06ce1bcd2b74a723987577`.
- `flam-ing/flamingo-rangers` revision `b04576e9c7d8da193a4fc2e0c431ac4b6a9eeb30`.
- `flam-ing/flamingo-football-rescue` revision `b3b85741eadbab4dde3ded6035374e9db25c6763`.

Source documentation and font license files are retained with each game. Original character images retained in source assets for provenance are not used to draw the new protagonists. Source docs/previews describe the original games, not this edition.

Changes: curated portal; new human sprite sheet and action-specific pose mapping; human instanced geometry for the crowd runner; sculpted traditional chess pieces; illustrated ramen kitchen; new Stadium environments and menus; player selection text/colors; in-game return navigation; isolated high-score settings for Stadium; workspace-aware font test path and corrected build font URLs.

The 12-pose character sheet and ramen kitchen were generated for this remake on 2026-11-04. Character appearance was based on the user's existing `navy-blender-vtuber/reference/front.png`. The original Navy 3D mesh is not bundled here. Portal preview images are local screenshots of the playable games.

Ruby and Geumgang received separate 12-pose character sheets on 2026-11-05; see `sources/rangers/docs/character-redesign.md`. The home now uses live, muted gameplay demos with screenshot fallbacks. Phone-controller game planning was moved out of this repository into the separate Render project folder `../phone-controller-games`.
