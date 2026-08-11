"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "After_the_Final_Battle_complete_experiment.twee");
const templatePath = path.join(root, "src", "base-v18.html");
const outputPath = path.join(root, "After the Final Battle - Complete World Experiment.html");

function escapeText(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function parseTwee(source) {
  const sections = [];
  const re = /^:: ([^\n\[]+?)(?: \[([^\]]*)\])?\n/gm;
  let match;
  let previous = null;
  while ((match = re.exec(source))) {
    if (previous) {
      previous.body = source.slice(previous.bodyStart, match.index).replace(/\n+$/, "");
      sections.push(previous);
    }
    previous = {
      name: match[1].trim(),
      tags: (match[2] || "").trim(),
      bodyStart: re.lastIndex,
      body: ""
    };
  }
  if (previous) {
    previous.body = source.slice(previous.bodyStart).replace(/\n+$/, "");
    sections.push(previous);
  }
  return sections;
}

const source = fs.readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
let html = fs.readFileSync(templatePath, "utf8");
const sections = parseTwee(source);
const byName = Object.fromEntries(sections.map((section) => [section.name, section]));
const storyTitle = (byName.StoryTitle && byName.StoryTitle.body.trim()) || "After the Final Battle";
const storyData = JSON.parse(byName.StoryData.body);
const css = byName["Story Stylesheet"].body;
const js = byName["Story JavaScript"].body;
const passages = sections.filter((section) => !["StoryTitle", "StoryData", "Story Stylesheet", "Story JavaScript"].includes(section.name));

const oldStoryMatch = html.match(/<tw-storydata[\s\S]*?<\/tw-storydata>/i);
if (!oldStoryMatch) throw new Error("Template tw-storydata was not found.");
const oldStory = oldStoryMatch[0];
const oldPassageRe = /<tw-passagedata\s+pid="(\d+)"\s+name="([^"]*)"\s+tags="([^"]*)"\s+position="([^"]*)"\s+size="([^"]*)">[\s\S]*?<\/tw-passagedata>/gi;
const oldMeta = new Map();
let oldMatch;
let maxPid = 0;
while ((oldMatch = oldPassageRe.exec(oldStory))) {
  const decodedName = oldMatch[2]
    .replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
  const pid = Number(oldMatch[1]);
  oldMeta.set(decodedName, { pid, position: oldMatch[4], size: oldMatch[5] });
  maxPid = Math.max(maxPid, pid);
}

const assigned = passages.map((passage, index) => {
  const prior = oldMeta.get(passage.name);
  const pid = prior ? prior.pid : ++maxPid;
  const position = prior ? prior.position : `${100 + ((index % 8) * 220)},${800 + (Math.floor(index / 8) * 140)}`;
  const size = prior ? prior.size : "100,100";
  return { ...passage, pid, position, size };
});
const start = assigned.find((passage) => passage.name === storyData.start);
if (!start) throw new Error(`Start passage ${storyData.start} was not found.`);

const passageMarkup = assigned.map((passage) =>
  `<tw-passagedata pid="${passage.pid}" name="${escapeAttr(passage.name)}" tags="${escapeAttr(passage.tags)}" position="${escapeAttr(passage.position)}" size="${escapeAttr(passage.size)}">${escapeText(passage.body)}</tw-passagedata>`
).join("\n");

const storyMarkup = `<tw-storydata name="${escapeAttr(storyTitle)}" startnode="${start.pid}" creator="Twine" creator-version="2.10.0" format="${escapeAttr(storyData.format)}" format-version="${escapeAttr(storyData["format-version"])}" ifid="${escapeAttr(storyData.ifid)}" options="" tags="" zoom="${storyData.zoom || 1}" hidden>\n<style role="stylesheet" id="twine-user-stylesheet" type="text/twine-css">\n${css}\n</style>\n<script role="script" id="twine-user-script" type="text/twine-javascript">\n${js}\n</script>\n${passageMarkup}\n</tw-storydata>`;

html = html.replace(oldStoryMatch[0], storyMarkup);
html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeText(storyTitle)}</title>`);
html = html.replace(
  'generateName("After the final battle - Northern Region Build")',
  `generateName(${JSON.stringify(storyTitle)})`
);
fs.writeFileSync(outputPath, html, "utf8");
process.stdout.write(`Built ${path.basename(outputPath)} (${Buffer.byteLength(html)} bytes, ${assigned.length} passages)\n`);
