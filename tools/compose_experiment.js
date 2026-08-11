"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const basePath = path.join(root, "src", "base-v18.twee");
const dataPath = path.join(root, "src", "experiment-data.js");
const layerPath = path.join(root, "src", "experiment-layer.js");
const stylePath = path.join(root, "src", "experiment-styles.css");
const passagePath = path.join(root, "src", "experiment-passages.twee");
const outputPath = path.join(root, "After_the_Final_Battle_complete_experiment.twee");

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

let source = read(basePath);
const layer = read(dataPath).trim() + "\n\n" + read(layerPath).trim();
const styles = read(stylePath).trim();
const passages = read(passagePath).trim();

source = source.replace(
  "After the final battle - Northern Region Build v18",
  "After the Final Battle — Complete World Experiment"
);
source = source.replace(
  'setup.__afterFinalBattleBuild = "v18-combat-story-stats";',
  'setup.__afterFinalBattleBuild = "complete-world-experiment-1";'
);

/* The approved v18 base reserves a sound control for a future audio system. The
 * experiment does not ship audio, so its release UI removes that unfinished
 * control while retaining the stored preference field for old-save safety. */
source = source.replace(
  '.settings-slider { align-items: center; }\n#setting-sound { width: min(210px, 100%); accent-color: #eeeeee; }\n#setting-sound-value { min-width: 2ch; color: #d9ca82; text-align: right; }\n.settings-placeholder { color: #aaa; font-size: 0.82em; }\n',
  ''
);
source = source.replace(
  '    var slider = document.querySelector("#setting-sound");\n    var value = document.querySelector("#setting-sound-value");\n    if (slider) slider.value = preferences.sound;\n    if (value) value.textContent = preferences.sound;\n',
  ''
);
source = source.replace(
  /          <div class="settings-row">\n            <label for="setting-sound">Sound <span class="settings-placeholder">\(placeholder\)<\/span><\/label>\n            <div class="settings-control settings-slider">\n              <input id="setting-sound" type="range" min="1" max="10" step="1">\n              <span id="setting-sound-value">10<\/span>\n            <\/div>\n          <\/div>\n/,
  ''
);
source = source.replace(
  '      document.querySelector("#setting-sound").addEventListener("input", function (event) {\n        setup.savePreferences({ sound: Number(event.target.value) });\n      });\n',
  ''
);

const experimentalGarden = `:: Stalwart - Ruined Gardens
The gardens lie behind the old command house.

Commanders walked here when they needed more time before making a decision. The flowers never offered advice, which may have made them the most sensible people in the building.

Now there are only dead stems, snow, and one small life watching from beneath the ruined trellis.

<<if !$taken.stalwartGardenSearched>>
<<link "Search the gardens">>
  <<run setup.searchLoot("stalwartGardenSearched", { winterRoot: 1 }, "The roots have outlived the beds. Something else in the garden watches what you do with the food.", "Stalwart - Ruined Gardens")>>
<</link>>
<</if>>

[[Rich Housing|Stalwart - Rich Housing]]

[[River|Stalwart - River]]

[[Exit|Stalwart - Exit]]`;

source = source.replace(
  /:: Stalwart - Ruined Gardens\n[\s\S]*?\n:: Stalwart - Exit/,
  experimentalGarden + "\n\n:: Stalwart - Exit"
);
source = source.replace(
  'chest: ["northernFieldWrap", "tulip"]',
  'chest: ["northernFieldWrap", "medicinePouch"]'
);

const storyInitMarker = "\n:: StoryInit\n";
const storyInitIndex = source.indexOf(storyInitMarker);
if (storyInitIndex < 0) throw new Error("StoryInit marker not found in base source.");

const closureIndex = source.lastIndexOf("})();", storyInitIndex);
if (closureIndex < 0) throw new Error("Story JavaScript closure not found in base source.");
source = source.slice(0, closureIndex) + "\n\n  /* Complete World Experiment layer. */\n" + layer + "\n\n" + source.slice(closureIndex);

const scriptMarker = "\n:: Story JavaScript [script]\n";
const scriptIndex = source.indexOf(scriptMarker);
if (scriptIndex < 0) throw new Error("Story JavaScript marker not found in base source.");
source = source.slice(0, scriptIndex) + "\n\n/* Complete World Experiment styles. */\n" + styles + "\n" + source.slice(scriptIndex);

source = source.trimEnd() + "\n\n" + passages + "\n";
fs.writeFileSync(outputPath, source, "utf8");
process.stdout.write(`Composed ${path.basename(outputPath)} (${Buffer.byteLength(source)} bytes)\n`);
