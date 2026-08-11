"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const workspace = path.resolve(root, "..");
const failures = [];
const checks = [];

function check(condition, label, detail) {
  checks.push({ label, passed: Boolean(condition), detail: detail || "" });
  if (!condition) failures.push(label + (detail ? `: ${detail}` : ""));
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function parseTwee(source) {
  const sections = [];
  const re = /^:: ([^\n\[]+?)(?: \[([^\]]*)\])?\n/gm;
  let match;
  let previous = null;
  while ((match = re.exec(source))) {
    if (previous) {
      previous.body = source.slice(previous.start, match.index).replace(/\n+$/, "");
      sections.push(previous);
    }
    previous = { name: match[1].trim(), tags: (match[2] || "").trim(), start: re.lastIndex, body: "" };
  }
  if (previous) {
    previous.body = source.slice(previous.start).replace(/\n+$/, "");
    sections.push(previous);
  }
  return sections;
}

function decodeHtml(value) {
  return value.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
}

const sourcePath = path.join(root, "After_the_Final_Battle_complete_experiment.twee");
const htmlPath = path.join(root, "After the Final Battle - Complete World Experiment.html");
const dataPath = path.join(root, "src", "experiment-data.js");
const layerPath = path.join(root, "src", "experiment-layer.js");
const source = read(sourcePath);
const html = read(htmlPath);
const sections = parseTwee(source);
const byName = Object.fromEntries(sections.map((section) => [section.name, section]));
const passages = sections.filter((section) => !["StoryTitle", "StoryData", "Story Stylesheet", "Story JavaScript"].includes(section.name));

check(byName.StoryTitle.body.trim() === "After the Final Battle — Complete World Experiment", "experimental story title");
check(new Set(sections.map((section) => section.name)).size === sections.length, "passage names unique");
check(passages.length === 53, "passage count", `found ${passages.length}, expected 53`);
check(["Experiment Place", "Experiment Site", "Experiment Journal", "Experiment Ending"].every((name) => byName[name]), "experiment passages present");
check(html.includes('name="After the Final Battle — Complete World Experiment"'), "compiled HTML story title");
check(html.includes("<title>After the Final Battle — Complete World Experiment</title>"), "browser document title");
check(!html.includes('generateName("After the final battle - Northern Region Build")'), "embedded SugarCube story identity updated");
check(html.includes('name="Experiment Ending"'), "compiled HTML includes new passages");
check(!source.includes("A tulip grows beside a cracked stone basin."), "legacy Stalwart tulip removed");
check(!source.includes('chest: ["northernFieldWrap", "tulip"]'), "legacy Serenity tulip reward removed");
check(!source.includes("settings-placeholder"), "unfinished settings placeholder removed");
check(!source.includes("setting-sound"), "unfinished sound control removed");

try {
  Function(byName["Story JavaScript"].body);
  check(true, "composed Story JavaScript syntax");
} catch (error) {
  check(false, "composed Story JavaScript syntax", error.message);
}

try {
  Function(read(layerPath));
  check(true, "experiment layer syntax");
} catch (error) {
  check(false, "experiment layer syntax", error.message);
}

let data;
try {
  data = Function(read(dataPath) + "\nreturn { sites: experimentSiteList, byCode: experimentSitesByCode, regions: experimentRegionMeta, academy: experimentAcademyNodes, academyEvidence: experimentAcademyEvidence, shrines: experimentShrines, minorGods: experimentMinorGodFragments, unbrokenClues: experimentUnbrokenClues }; ")();
  check(true, "experiment data evaluates");
} catch (error) {
  check(false, "experiment data evaluates", error.message);
}

if (data) {
  const expectedCounts = { north: 15, central: 18, holy: 3, desert: 9, demon: 14, outer: 5, inner: 4, final: 1 };
  check(data.sites.length === 69, "all named map markers authored", `found ${data.sites.length}, expected 69`);
  check(new Set(data.sites.map((site) => site.code)).size === 69, "location codes unique");
  check(new Set(data.sites.map((site) => site.coord.join(","))).size === 69, "location coordinates unique");
  check(data.sites.every((site) => expectedCounts[site.region]), "all locations use a defined region");
  check(data.sites.every((site) => site.coord.length === 2 && site.coord.every((value) => Number.isInteger(value) && value >= 1 && value <= 51)), "all location coordinates fit the 51 by 51 map");
  Object.entries(expectedCounts).forEach(([region, expected]) => {
    const actual = data.sites.filter((site) => site.region === region).length;
    check(actual === expected, `${region} location count`, `found ${actual}, expected ${expected}`);
  });
  check(data.byCode.AV.coord[0] === 1 && data.byCode.AV.coord[1] === 9, "The Hunt canonical coordinate (1,9)");
  check(data.byCode.BF.evidence.text.includes("authorized elimination of witnesses"), "purge proof restricted to Sizzling evidence");
  check(data.byCode.BG.evidence.text.includes("Supplies were sufficient"), "scarcity lie proven by Boiling ledger");
  const otherPurgeClaims = data.sites.filter((site) => site.code !== "BF" && /authorized elimination of witnesses|proves the witness purge/i.test(site.evidence.text));
  check(otherPurgeClaims.length === 0, "no duplicate conclusive purge proof", otherPurgeClaims.map((site) => site.code).join(","));
  const allowedStats = new Set(["strength", "defense", "resistance", "agility"]);
  const allowedVoices = ["Protective Anchor", "Practical Caretaker", "Enduring Realist", "Guarded Watcher", "Exacting Keeper", "Curious Seeker", "Devotional Interpreter", "Proud Traditionalist", "Restless Builder", "Patient Mediator", "Fierce Idealist", "Opportunistic Broker"];
  data.sites.forEach((site) => {
    check(Boolean(site.name && site.purpose && site.ordinary && site.item), `complete authored fields ${site.code}`);
    check(site.choices.length === 2 && site.choices.every((choice) => allowedStats.has(choice.stat) && choice.label && choice.result), `story-stat choices ${site.code}`);
    check(allowedVoices.some((voice) => site.evidence.voice.startsWith(voice)), `assigned personality voice ${site.code}`, site.evidence.voice);
    check(Boolean(site.evidence.boundary), `knowledge boundary ${site.code}`);
  });
  check(data.academy.length === 18, "Academy has 18 authored nodes", `found ${data.academy.length}`);
  const academyIds = new Set(data.academy.map((node) => node.id));
  check(data.academy.every((node) => node.next.every((next) => academyIds.has(next))), "Academy graph references valid nodes");
  const academyById = Object.fromEntries(data.academy.map((node) => [node.id, node]));
  const academyReachable = new Set();
  const academyFrontier = ["gate"];
  while (academyFrontier.length) {
    const id = academyFrontier.pop();
    if (academyReachable.has(id) || !academyById[id]) continue;
    academyReachable.add(id);
    academyFrontier.push(...academyById[id].next);
  }
  check(academyReachable.size === data.academy.length, "all Academy nodes reachable from the Broken Gate", `reached ${academyReachable.size}`);
  check(data.academy.filter((node) => node.enemy).length === 2, "Academy contains two combat encounters");
  check(Boolean(academyById.overlook && academyById.overlook.final && academyById.overlook.next.length === 0), "Academy graph has one final overlook");
  check(Object.keys(data.academyEvidence).length === 4, "Academy Roll Call has four fragments");
  check(data.shrines.length === 10 && new Set(data.shrines.map((shrine) => shrine.id)).size === 10, "ten unique Moonmaiden shrines");
  check(data.shrines.every((shrine) => shrine.regions.length && shrine.text && shrine.voice && shrine.reward), "Moonmaiden shrine content complete");
  check(Object.keys(data.minorGods).length === 8, "wider pantheon fragments represented");
  check(Object.keys(data.unbrokenClues).length === 5, "Unbroken regional clue pattern represented");
  check(data.byCode.BH.evidence.text.includes("Demon King killed him") && data.byCode.AN.evidence.text.includes("killed her") && data.byCode.BQ.evidence.text.includes("killed what remained of her"), "three experimental god-death methods discoverable");
  check(data.byCode.BF.purpose.includes("High Council was entirely demonic"), "ancient political inequality stated");
  check(data.byCode.AR.historyFragment.text.includes("future Central and Desert borders"), "first recorded battle geography preserved");
}

const expectedMemories = ["Care", "Duty", "Limitation", "Trust", "Truth", "Future"];
check(expectedMemories.every((memory) => layerPath && new RegExp(`earnMemory\\(\"${memory}\"`).test(read(layerPath))), "all six thematic memories have earn conditions");
check(["two_ghosts", "burdened_release", "world_relearns", "common_ground", "small_garden", "carried_future", "moonless_dawn"].every((ending) => read(layerPath).includes(`\"${ending}\"`)), "early, partial, and full ending outcomes authored");
check(read(layerPath).includes('count >= 6 ? 3 : (count >= 4 ? 2 : (count >= 2 ? 1 : 0))'), "Moon Sword scales through four memory stages");
check(read(layerPath).includes('regionEvidenceCount("holy") >= 2'), "Common Ground discovery has a two-clue gate");

const htmlStyle = html.match(/<style role="stylesheet" id="twine-user-stylesheet" type="text\/twine-css">\n([\s\S]*?)\n<\/style>/);
const htmlScript = html.match(/<script role="script" id="twine-user-script" type="text\/twine-javascript">\n([\s\S]*?)\n<\/script>/);
check(Boolean(htmlStyle && htmlStyle[1] === byName["Story Stylesheet"].body), "source/build stylesheet synchronization");
check(Boolean(htmlScript && htmlScript[1] === byName["Story JavaScript"].body), "source/build JavaScript synchronization");

const htmlPassages = new Map();
const passageRe = /<tw-passagedata\s+pid="\d+"\s+name="([^"]*)"\s+tags="[^"]*"\s+position="[^"]*"\s+size="[^"]*">([\s\S]*?)<\/tw-passagedata>/g;
let passageMatch;
while ((passageMatch = passageRe.exec(html))) htmlPassages.set(decodeHtml(passageMatch[1]), decodeHtml(passageMatch[2]));
const mismatchedPassages = passages.filter((passage) => htmlPassages.get(passage.name) !== passage.body).map((passage) => passage.name);
check(mismatchedPassages.length === 0 && htmlPassages.size === passages.length, "source/build passage synchronization", mismatchedPassages.join(","));

const snapshot = path.join(workspace, "MILESTONES", "2026-08-11_033840_pre-full-experiment");
const protectedFiles = [
  [path.join(workspace, "After_the_Final_Battle_v18.twee"), path.join(snapshot, "After_the_Final_Battle_v18.twee")],
  [path.join(workspace, "After the final battle - Northern Region Build v18.html"), path.join(snapshot, "After the final battle - Northern Region Build v18.html")]
];
protectedFiles.forEach(([active, saved]) => check(fs.existsSync(saved) && hash(active) === hash(saved), `approved artifact unchanged: ${path.basename(active)}`));

const authoredFiles = [dataPath, layerPath, path.join(root, "src", "experiment-styles.css"), path.join(root, "src", "experiment-passages.twee")];
const encodingProblems = authoredFiles.filter((file) => /�|â€|Â/.test(read(file))).map((file) => path.basename(file));
check(encodingProblems.length === 0, "experiment files have no mojibake", encodingProblems.join(","));

const summary = {
  passed: checks.filter((entry) => entry.passed).length,
  failed: failures.length,
  total: checks.length,
  sourceSha256: hash(sourcePath),
  htmlSha256: hash(htmlPath),
  failures
};
fs.writeFileSync(path.join(root, "verification-results.json"), JSON.stringify({ summary, checks }, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
if (failures.length) process.exitCode = 1;
