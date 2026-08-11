# After the Final Battle

> A discovery-first narrative RPG set in the quiet ruins left after the world was saved.

[![Play in browser](https://img.shields.io/badge/PLAY_IN_BROWSER-d8c38d?style=for-the-badge&labelColor=292a25)](https://mewzicians.github.io/After-the-final-battle-test-build/)

You leave the shelter with an old sword, limited supplies, and no reliable account of what happened outside. Places are explored one room at a time. Names, histories, and connections appear only after you actually encounter them.

## Play

### Play online

**[Launch the current build](https://mewzicians.github.io/After-the-final-battle-test-build/)**

The playable site is published directly from the repository through GitHub Pages. GitHub's normal repository preview cannot execute an attached HTML game, which is why the old README link did not work as a browser version.

### Play offline

Download [`After the Final Battle v19.html`](https://github.com/mewzicians/After-the-final-battle-test-build/raw/main/After%20the%20Final%20Battle%20v19.html), then open the downloaded file in a modern browser. The game is self-contained and does not need installation.

Progress and settings are stored by that browser. The hosted version and a downloaded copy may therefore have separate saves.

## What to expect

- Room-by-room exploration across a ruined high-fantasy world.
- A journal that records only places, notes, and objects you have discovered.
- Story choices that shape Strength, Agility, Defense, and Resistance.
- Survival travel, settlements, dungeons, inventory, equipment, and persistent saves.
- Real-time combat built around Dodge, Clash, and Parry timing.
- A first-fight combat tutorial and a scrollable live battle history.
- Optional discoveries and companions that can remain with you throughout the journey.
- A viewport-aware interface designed to keep current information and actions visible without whole-page scrolling.

## Combat

| Incoming attack | Response | Timed result |
| --- | --- | --- |
| Light | Dodge | Avoid the attack |
| Medium | Attack | Clash, cancel damage, and gain +1 damage for the fight |
| Heavy | Parry | Deflect the attack |

Attack can also be used normally outside a Clash window. Each action's cooldown scales independently with its associated story-trained stat.

## Reading controls

The bottom-right speed control cycles through **1×**, **2×**, and **4×**. **Instant** reveals current and later text immediately while highlighted. The journal sits beside Save in the main bottom bar.

## Current build

This repository contains the discovery-first **v19** build. It removes the earlier experimental framing and avoids presenting hidden conclusions, writer notes, undiscovered names, or ending requirements to the player.

The opening is now one continuous game flow: the Shelter leads into a ten-room Stalwart, its discoveries live inside the places where they are found, the Academy is reached through the road behind the old wall, and the route book opens the journey beyond the city. Older passage names remain only as invisible redirects so existing saves can recover without exposing the retired presentation.

The maintained verifier currently passes **114/114 checks**, including source/build synchronization, both connected opening graphs, redirect-only save aliases, world data, discovery boundaries, journal behavior, text controls, responsive viewport rules, and preservation of the earlier approved build.

## Repository contents

| File | Purpose |
| --- | --- |
| [`index.html`](index.html) | GitHub Pages entry point |
| [`After the Final Battle v19.html`](After%20the%20Final%20Battle%20v19.html) | Downloadable offline build |
| [`After_the_Final_Battle_v19.twee`](After_the_Final_Battle_v19.twee) | Authoritative Twine/Twee source |
| [`verification-v19.json`](verification-v19.json) | Latest machine-readable verification report |

The two HTML files are identical derived builds. Game changes should be made in the Twee source and rebuilt, never edited independently in HTML.

## Feedback

When reporting a problem, please include the room or screen, what you selected, what you expected, and whether you were playing the hosted or downloaded version. Avoid putting story discoveries in an issue title when possible.

## Ownership

No license is granted for reuse or redistribution of the project's code, writing, world, or assets beyond viewing and playing this public repository.
