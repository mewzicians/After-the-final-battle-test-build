# QA Cleanup Report

**Build:** Complete World Experiment 1  
**Date:** 2026-08-11  
**Scope:** `EXPERIMENTAL_BUILD` plus read-only protection checks against the approved v18 source/build

## Result

The experiment has one active source chain, one generated Twee artifact, and one generated playable HTML artifact. No obsolete or byte-identical duplicate files remain in the experiment package. The approved project source, playable build, vault, and archive were not modified.

## Source-of-truth chain

1. `src/base-v18.twee` — immutable copy of the approved implementation input.
2. `src/experiment-data.js`, `src/experiment-layer.js`, `src/experiment-styles.css`, and `src/experiment-passages.twee` — experiment-authored additions.
3. `tools/compose_experiment.js` — produces `After_the_Final_Battle_complete_experiment.twee`.
4. `tools/build_html.js` — produces `After the Final Battle - Complete World Experiment.html` from the composed source and immutable v18 HTML template.

The HTML is derived; it should never be edited independently.

## Cleanup performed

- Removed the nonfunctional **Sound (placeholder)** settings row from the generated experiment UI. The old stored preference is retained invisibly so existing saves are not damaged.
- Removed both superseded Tulip placements from active experiment content. A save containing the early Stalwart prototype Tulip migrates it into an ordinary winter root and records why.
- Replaced the embedded v18 SugarCube title identity as part of HTML generation, so the document, runtime story, and repository now consistently identify the Complete World Experiment.
- Kept `setup.northernPlaces` as an intentional compatibility alias, repointed to the complete 69-location collection after composition.
- Kept both base-v18 inputs intentionally: they are reproducible build inputs, not competing active artifacts.
- Confirmed that authored source and generated Twee contain no TODO, FIXME, HACK, placeholder, “coming soon,” or Lorem Ipsum markers. Occurrences of “placeholder” inside build tooling and this report refer only to the verified removal rule.
- Confirmed there are no byte-identical duplicate files in the package.
- Confirmed all seven JavaScript files parse successfully.
- Confirmed two consecutive builds produce byte-identical source and HTML.

## Preservation proof

A recoverable pre-experiment snapshot exists at:

`MILESTONES/2026-08-11_033840_pre-full-experiment`

The verifier compares the approved root `After_the_Final_Battle_v18.twee` and its root HTML against that snapshot on every run. Both hashes still match. No vault content was changed, so `OBSIDIAN_VAULT.zip` did not require rebuilding.

## Final automated result

`331 passed, 0 failed`

See `verification-results.json` for the complete per-check record.
