# Full Verification Matrix

**Build:** Complete World Experiment 1  
**Date:** 2026-08-11  
**Automated experiment checks:** **331 passed, 0 failed**

This matrix separates automated structural proof, representative live-browser tests, and content review. “Verified” does not mean every possible order of 69 locations was manually played; it means the relevant invariant is automatically checked and its main interaction was tested in a running build where applicable.

| Area | Status | Evidence |
| --- | --- | --- |
| Source syntax | Verified | All seven authored/build JavaScript files parse; composed Story JavaScript evaluates. |
| Source → HTML synchronization | Verified | Styles, Story JavaScript, all 53 passages, story name, and browser title are compared exactly. |
| Deterministic build | Verified | Two consecutive builds produced identical SHA-256 hashes. |
| Approved v18 preservation | Verified | Root v18 Twee and HTML byte-match the pre-experiment milestone. |
| Approved workspace integrity | Verified | Official workspace verifier passed source/build parity, links, runtime scenarios, vault links, and archive synchronization. |
| Map/world coverage | Verified | Exactly 69 unique codes and coordinates across North 15, Central 18, Holy 3, Desert 9, Demon 14, Outer 5, Inner 4, Final 1. Coordinates remain inside the 51×51 map. The Hunt is `(1,9)`. |
| Regional movement | Verified | All markers use defined regions; representative Stalwart → map → site travel was played live. Region-specific travel encounters and enemy tables are installed. |
| Survival and inventory | Verified | Inherited v18 runtime scenarios pass; food use, search loot, journal inventory, settlement purchases, and resting were exercised live. |
| Saves and migrations | Verified | Save action was exercised live. v18 save shape is preserved; experiment state initializes defensively; old Tulip migration and permanent shrine-stat flags are checked in source. |
| Defeat and checkpoints | Verified | Dungeon checkpoint precedes each experimental fight. Live Academy defeat returned correctly; post-fix victory and return clearing were replayed successfully. |
| Combat model | Verified | Official fast-combat scenarios pass. Live first-fight spotlight tutorial, light/dodge, medium/clash, heavy/parry, cooldown display, reward summary, and scrollable battle log were exercised. |
| Enemy timing progression | Verified | Early Academy enemies use generous timing ranges; regional and battlefield templates progressively tighten independent light/medium/heavy ranges. |
| Academy of Heroes | Verified | Exactly 18 nodes; every edge is valid; every room is reachable from Broken Gate; two fights; four Roll Call fragments; one terminal overlook. Branches and first fight were played live. |
| Other location dungeons | Verified | Every named site has arrival, ordinary-life, evidence, danger, broken-route, overlook, and story-choice content, with complete fields and valid enemies. Representative Stalwart node progression was played live. |
| Living settlements | Verified | Five human settlement checkpoints expose rest and supply services; Stalwart services were exercised live. Demon settlement remains deliberately non-checkpoint. |
| Story stat growth | Verified | Every site has exactly two choices tied to Strength, Defense, Resistance, or Agility; the existing independent EXP curve and stat cap 10 remain active. Stat EXP gain was exercised live. |
| Evidence boundaries | Verified | Every site assigns a personality voice and explicit knowledge boundary. Sizzling alone proves purge authorization; Boiling alone disproves scarcity; Truth requires both evidence and both player responses. |
| Ancient history | Verified | Four equal-heart cities retain distinct identities; all-demon High Council and unequal ancient harmony are stated; first battle remains unnamed in Demon territory near future Central/Desert borders. |
| Unbroken mystery | Verified | Five regional clues remain individually inconclusive; meeting requires Teren trust and three clues. |
| Moonmaidens and pantheon | Verified | Ten unique one-time shrines with region eligibility and persistent rewards; eight wider-pantheon fragments. |
| Magic and Tulip | Verified | Magic/divine separation is explicit. Common Ground requires two Holy primary clues. The single active Tulip exists only there; its discovery, item, and four final uses are authored. |
| Protagonist arc | Verified | Care, Duty, Limitation, Trust, Truth, and Future each have an earn condition and are journal-visible. |
| Moon Sword | Verified | Four stages at 0, 2, 4, and 6 memories; final restoration explicitly comes from the protagonist's human soul while the Moon remains dead. |
| Cat companion | Verified | Cat encounter is available in Stalwart, requires one Food, persists in travel and dungeon text, and waits outside the final scar. Adoption was exercised live. |
| Endings | Verified | Early (`two_ghosts`), partial (`burdened_release`), full brother-passing, four Tulip destinations, and moonless ending are structurally present and gated by memory count/Tulip state. |
| UI and responsive layout | Verified | Desktop 1280×720 and mobile 390×844 were inspected; mobile had no horizontal overflow. Rebuilt release reports runtime verification `pass`. |
| Unfinished player-facing content | Verified | No placeholder/TODO markers in generated Twee; the nonfunctional sound control is absent in the live DOM. |
| Narrative consistency | Verified with declared experiment boundary | Dedicated audit found no unresolved player-facing contradiction; proposed god-death answers remain labeled experimental rather than silently promoted to approved canon. |

## Final artifact hashes

- Twee SHA-256: `73918662ea4d36225f071e0d1a2a2eff1f6831430abaef35d2b0abf0f88fa5a2`
- HTML SHA-256: `835469f494910c4d45d64153621040b21c593a4fe2a014362ee8e7a1d06c7972`

The machine-readable report is regenerated by `npm run verify`; if the build changes, use its current hashes rather than treating this document as authoritative.
