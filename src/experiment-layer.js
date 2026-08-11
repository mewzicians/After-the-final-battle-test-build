  var EXPERIMENT_VERSION = 1;
  var EXPERIMENT_MEMORIES = ["Care", "Duty", "Limitation", "Trust", "Truth", "Future"];
  var EXPERIMENT_TOWNS = ["A", "G", "O", "AH", "BN"];

  function freshExperimentState() {
    return {
      version: EXPERIMENT_VERSION,
      routeBook: false,
      routeChoice: "",
      cat: { met: false, adopted: false, name: "the cat" },
      places: {},
      evidence: [],
      items: [],
      memories: { Care: false, Duty: false, Limitation: false, Trust: false, Truth: false, Future: false },
      regionVisits: {},
      connections: [],
      shrinesSeen: [],
      activeSite: "A",
      activeNode: "arrival",
      activeMode: "site",
      pendingEncounter: null,
      academy: { nodes: {}, evidence: [], active: "gate", resolved: false },
      commonGround: { revealed: false, visited: false },
      tulip: { found: false, carried: false, leftAtCommonGround: false, destination: "" },
      swordStage: 0,
      terenTrust: false,
      unbrokenSeen: false,
      godsKnownDead: { Forge: false, Sun: false, Moon: false },
      ending: "",
      endingText: "",
      completed: false,
      journalTab: "journey",
      lastCatMove: -1
    };
  }

  function ensureExperimentState() {
    ensureState();
    var v = State.variables;
    if (!v.experiment || typeof v.experiment !== "object") v.experiment = freshExperimentState();
    var e = v.experiment;
    if (!e.cat) e.cat = { met: false, adopted: false, name: "the cat" };
    if (!e.places) e.places = {};
    if (!Array.isArray(e.evidence)) e.evidence = [];
    if (!Array.isArray(e.items)) e.items = [];
    if (!e.memories) e.memories = {};
    EXPERIMENT_MEMORIES.forEach(function (memory) {
      if (typeof e.memories[memory] !== "boolean") e.memories[memory] = false;
    });
    if (!e.regionVisits) e.regionVisits = {};
    if (!Array.isArray(e.connections)) e.connections = [];
    if (!Array.isArray(e.shrinesSeen)) e.shrinesSeen = [];
    if (!e.academy) e.academy = { nodes: {}, evidence: [], active: "gate", resolved: false };
    if (!e.academy.nodes) e.academy.nodes = {};
    if (!Array.isArray(e.academy.evidence)) e.academy.evidence = [];
    if (!e.commonGround) e.commonGround = { revealed: false, visited: false };
    if (!e.tulip) e.tulip = { found: false, carried: false, leftAtCommonGround: false, destination: "" };
    if (!e.legacyTulipMigrated && v.inventory && Number(v.inventory.tulip) > 0) {
      v.inventory.winterRoot = (v.inventory.winterRoot || 0) + Number(v.inventory.tulip);
      v.inventory.tulip = 0;
      e.legacyTulipMigrated = true;
      e.items.push({
        code: "LEGACY_TULIP",
        name: "Pressed Garden Memory",
        place: "Save migration",
        description: "An earlier prototype placed the world's single tulip in Stalwart. That superseded flower has become ordinary winter root; the living tulip now exists only at the Common Ground."
      });
    }
    if (!e.godsKnownDead) e.godsKnownDead = { Forge: false, Sun: false, Moon: false };
    experimentShrines.forEach(function (shrine) {
      var permanent = v.storyStatEvents && v.storyStatEvents["shrine_" + shrine.id];
      if (!permanent) return;
      if (e.shrinesSeen.indexOf(shrine.id) === -1) e.shrinesSeen.push(shrine.id);
      if (!e.evidence.some(function (entry) { return entry.code === "SHRINE_" + shrine.id; })) {
        e.evidence.push({
          code: "SHRINE_" + shrine.id,
          region: shrine.regions[0],
          place: "Moonmaiden shrine",
          title: shrine.name,
          text: shrine.text,
          voice: shrine.voice,
          boundary: "A later memorial records a claimed Moonmaiden. It is evidence of memory, not a divine authenticity stamp.",
          countsForRegion: false
        });
      }
      if (!e.items.some(function (item) { return item.code === "SHRINE_" + shrine.id; })) {
        e.items.push({ code: "SHRINE_" + shrine.id, name: shrine.name + " Offering", place: "Moonmaiden shrine", description: shrine.text });
      }
    });
    if (!e.pendingEncounter) e.pendingEncounter = null;
    if (!e.version || e.version < EXPERIMENT_VERSION) e.version = EXPERIMENT_VERSION;
    return e;
  }

  function siteState(code) {
    var e = ensureExperimentState();
    if (!e.places[code]) {
      e.places[code] = {
        visited: false,
        nodes: {},
        evidence: false,
        danger: false,
        broken: false,
        item: false,
        choice: -1,
        complete: false
      };
    }
    return e.places[code];
  }

  function experimentButton(label, handler, disabled) {
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = Boolean(disabled);
    button.addEventListener("click", handler);
    return button;
  }

  function experimentShell(root, site, kicker) {
    root.innerHTML = "";
    var shell = document.createElement("div");
    shell.className = "experiment-shell";
    shell.innerHTML = '<div class="experiment-kicker">' + escapeHtml(kicker || experimentRegionMeta[site.region].name) +
      '</div><h1 class="experiment-title">' + escapeHtml(site.name) + '</h1>';
    root.appendChild(shell);
    return shell;
  }

  function addExperimentItem(site) {
    var e = ensureExperimentState();
    if (e.items.some(function (entry) { return entry.code === site.code; })) return false;
    e.items.push({
      code: site.code,
      name: site.item,
      place: site.name,
      description: site.evidence.text + " It remains an object before it becomes an answer."
    });
    siteState(site.code).item = true;
    notify("Lore item found: " + site.item);
    return true;
  }

  function addExperimentEvidence(site) {
    var e = ensureExperimentState();
    if (e.evidence.some(function (entry) { return entry.code === site.code; })) return false;
    e.evidence.push({
      code: site.code,
      region: site.region,
      place: site.name,
      title: site.evidence.title,
      text: site.evidence.text,
      voice: site.evidence.voice,
      boundary: site.evidence.boundary
    });
    if (site.minorGod && !e.evidence.some(function (entry) { return entry.code === "MINOR_" + site.code; })) {
      e.evidence.push({
        code: "MINOR_" + site.code,
        region: site.region,
        place: site.name,
        title: site.minorGod.title,
        text: site.minorGod.text,
        voice: site.minorGod.voice,
        boundary: site.minorGod.boundary,
        countsForRegion: false
      });
    }
    if (site.unbrokenClue && !e.evidence.some(function (entry) { return entry.code === "UNBROKEN_" + site.code; })) {
      e.evidence.push({
        code: "UNBROKEN_" + site.code,
        region: site.region,
        place: site.name,
        title: site.unbrokenClue.title,
        text: site.unbrokenClue.text,
        voice: site.unbrokenClue.voice,
        boundary: "This regional tradition preserves one pattern. Alone, it can still describe an unusual human.",
        countsForRegion: false
      });
    }
    if (site.historyFragment && !e.evidence.some(function (entry) { return entry.code === "HISTORY_" + site.code; })) {
      e.evidence.push({
        code: "HISTORY_" + site.code,
        region: site.region,
        place: site.name,
        title: site.historyFragment.title,
        text: site.historyFragment.text,
        voice: site.historyFragment.voice,
        boundary: site.historyFragment.boundary,
        countsForRegion: false
      });
    }
    siteState(site.code).evidence = true;
    notify("Evidence recorded: " + site.evidence.title);
    updateExperimentProgress();
    return true;
  }

  function addConnection(key, text) {
    var e = ensureExperimentState();
    if (e.connections.some(function (entry) { return entry.key === key; })) return;
    e.connections.push({ key: key, text: text });
  }

  function earnMemory(name, reason) {
    var e = ensureExperimentState();
    if (e.memories[name]) return false;
    e.memories[name] = true;
    notify(name + " remembered: " + reason);
    updateSwordStage();
    return true;
  }

  function memoryCount() {
    var e = ensureExperimentState();
    return EXPERIMENT_MEMORIES.filter(function (name) { return e.memories[name]; }).length;
  }

  function updateSwordStage() {
    var e = ensureExperimentState();
    var count = memoryCount();
    var stage = count >= 6 ? 3 : (count >= 4 ? 2 : (count >= 2 ? 1 : 0));
    if (stage <= e.swordStage) return;
    e.swordStage = stage;
    var names = ["Old Sword", "Remembering Sword", "Moonless Edge", "Old Sword in Bloom"];
    var damage = [2, 3, 4, 5];
    State.variables.weapon.name = names[stage];
    State.variables.weapon.baseDamage = Math.max(State.variables.weapon.baseDamage || 2, damage[stage]);
    notify(stage === 3
      ? "The sword answers your human soul. No goddess returns; her choice has become yours."
      : "The Old Sword recovers a little power from the life you have chosen to carry.");
  }

  function regionEvidenceCount(region) {
    return ensureExperimentState().evidence.filter(function (entry) { return entry.region === region && entry.countsForRegion !== false; }).length;
  }

  function updateExperimentProgress() {
    var e = ensureExperimentState();
    if (regionEvidenceCount("holy") >= 2) e.commonGround.revealed = true;
    if (e.places.AN && e.places.AN.choice >= 0 && regionEvidenceCount("central") >= 5) {
      earnMemory("Duty", "Foederati's living rule can be carried, criticized, and corrected by people");
    }
    if (e.places.BN && e.places.BN.choice >= 0 && regionEvidenceCount("desert") >= 4) {
      earnMemory("Future", "Veyra claims a life no dead master can certify");
    }
    if (
      e.places.BF && e.places.BF.evidence && e.places.BF.choice >= 0 &&
      e.places.BG && e.places.BG.evidence && e.places.BG.choice >= 0
    ) {
      earnMemory("Truth", "the council authorization and raw provision ledger prove both the purge and the Demon King's lie");
      addConnection("archives", "Sizzling's guilty record and Boiling's provision ledger are copied into both human and Corrector custody.");
    }
    if (e.places.N && e.places.N.evidence) e.godsKnownDead.Forge = true;
    if (e.places.Q && e.places.Q.evidence) e.godsKnownDead.Sun = true;
    if (e.places.BQ && e.places.BQ.evidence) e.godsKnownDead.Moon = true;
  }

  function experimentRegionAt(x, y) {
    var exact = experimentSiteList.find(function (site) { return site.coord[0] === x && site.coord[1] === y; });
    if (exact) return exact.region;
    if (y >= 41 && x >= 25) return "demon";
    if (x <= 9 && (y >= 18 || x <= 3)) return "demon";
    if (y >= 42 && x <= 23) return "final";
    if (y >= 35 && x >= 10 && x <= 24) return "inner";
    if (y >= 27 && y <= 35 && x >= 10 && x <= 22) return "outer";
    if (x >= 38 && y >= 18) return "desert";
    if (x >= 36 && y <= 20) return "holy";
    if (y <= 14) return "north";
    return "central";
  }

  var experimentEnemyTemplates = {
    oathboundRemnant: { name: "an oathbound remnant", symbol: "§", hp: 48, attackDamage: 7, xp: 30, loot: { medicine: 1, gold: 7 }, attackTimings: { light: [2.7, 3.4], medium: [3.7, 4.5], heavy: [5.0, 5.9] } },
    demonifiedPilgrim: { name: "a demonified pilgrim", symbol: "¶", hp: 56, attackDamage: 8, xp: 36, loot: { moonCharms: 1, gold: 8 }, attackTimings: { light: [2.4, 3.1], medium: [3.3, 4.1], heavy: [4.6, 5.4] } },
    glassJackal: { name: "a glass-backed jackal", symbol: "j", hp: 62, attackDamage: 8, xp: 40, loot: { medicine: 1, gold: 9 }, attackTimings: { light: [2.2, 2.9], medium: [3.0, 3.8], heavy: [4.2, 5.0] } },
    continuityDrone: { name: "a continuity enforcer", symbol: "%", hp: 72, attackDamage: 9, xp: 48, loot: { medicine: 1, gold: 11 }, attackTimings: { light: [1.9, 2.5], medium: [2.7, 3.4], heavy: [3.8, 4.6] } },
    battlefieldEcho: { name: "a battlefield echo", symbol: "†", hp: 78, attackDamage: 10, xp: 54, loot: { medicine: 2, gold: 12 }, attackTimings: { light: [1.8, 2.4], medium: [2.6, 3.2], heavy: [3.6, 4.3] } },
    demandScar: { name: "a living Demand", symbol: "!", hp: 88, attackDamage: 11, xp: 64, loot: { medicine: 2, gold: 14 }, attackTimings: { light: [1.6, 2.2], medium: [2.3, 3.0], heavy: [3.3, 4.0] } },
    stolenEmotion: { name: "a knot of stolen emotion", symbol: "?", hp: 104, attackDamage: 12, xp: 80, loot: { gold: 20 }, attackTimings: { light: [1.4, 2.0], medium: [2.1, 2.7], heavy: [3.0, 3.7] } }
  };

  Object.keys(experimentEnemyTemplates).forEach(function (key) {
    var enemy = experimentEnemyTemplates[key];
    enemy.victoryText = "The pattern breaks. What remains no longer knows how to repeat the attack.";
    enemy.descriptions = {
      idle: enemy.name + " blocks the path.",
      low: enemy.name + " measures you.",
      mid: "Its next movement begins to take shape.",
      high: "The attack is about to arrive.",
      attack: enemy.name + " attacks.",
      parried: "The Old Sword rejects the heavy blow.",
      dodged: "You leave the light attack nothing to strike.",
      hit: "The attack finds you."
    };
    setup.enemies[key] = enemy;
  });

  setup.enemies.academyDrillEcho = clone(setup.enemies.academyEcho);
  setup.enemies.academyDrillEcho.name = "a training-yard echo";
  setup.enemies.academyDrillEcho.hp = 20;
  setup.enemies.academyDrillEcho.attackDamage = 3;
  setup.enemies.academyDrillEcho.xp = 16;
  setup.enemies.academyDrillEcho.attackTimings = { light: [3.3, 4.1], medium: [4.5, 5.5], heavy: [6.1, 7.1] };
  setup.enemies.academyBreachEcho = clone(setup.enemies.demonHerald);
  setup.enemies.academyBreachEcho.name = "the Academy breach echo";
  setup.enemies.academyBreachEcho.hp = 34;
  setup.enemies.academyBreachEcho.attackDamage = 5;
  setup.enemies.academyBreachEcho.xp = 28;
  setup.enemies.academyBreachEcho.attackTimings = { light: [2.7, 3.4], medium: [3.7, 4.5], heavy: [5.0, 5.9] };

  setup.places = {};
  experimentSiteList.forEach(function (site) {
    var town = EXPERIMENT_TOWNS.indexOf(site.code) !== -1;
    setup.places[site.code] = {
      code: site.code,
      name: site.name,
      coord: site.coord.slice(),
      passage: "Experiment Place",
      respawnPassage: town ? "Experiment Place" : null,
      modifiers: town ? ["Town"] : (site.kind === "town" ? ["Settlement"] : []),
      exitLine: "The road leaves " + site.name + " behind without making it disappear."
    };
  });
  setup.northernPlaces = setup.places;

  ["central", "holy", "desert", "demon", "outer", "inner", "final"].forEach(function (region) {
    var meta = experimentRegionMeta[region];
    setup.regionEvents[region] = {
      weights: { ambient: 58, combat: 30, trader: 7, settlement: 5 },
      ambient: ["scrap", "wanderer", "winterRoot", "snowmelt"],
      combat: [{ type: "single", enemy: meta.enemy }]
    };
  });

  var originalExperimentEnterMap = setup.enterMap;
  setup.enterMap = function (key) {
    ensureExperimentState();
    var place = setup.places[key] || setup.places.A;
    State.variables.map.region = place.region || experimentSitesByCode[place.code].region;
    return originalExperimentEnterMap(key);
  };

  var originalExperimentMoveMap = setup.moveMap;
  setup.moveMap = function (dx, dy) {
    ensureExperimentState();
    var map = State.variables.map;
    var nx = Math.max(1, Math.min(51, map.x + dx));
    var ny = Math.max(1, Math.min(51, map.y + dy));
    map.region = experimentRegionAt(nx, ny);
    var result = originalExperimentMoveMap(dx, dy);
    map.region = experimentRegionAt(map.x, map.y);
    var e = State.variables.experiment;
    if (e.cat.adopted && map.moves > 0 && map.moves % 7 === 0 && e.lastCatMove !== map.moves && !State.variables.activeMapEvent) {
      e.lastCatMove = map.moves;
      var lines = [
        "The cat steps into your footprint, inspects the road you chose, and follows anyway.",
        "The cat finds shelter from the wind in the exact place your cloak fails to cover.",
        "Something moves beyond the visible road. The cat notices it first and decides it is beneath concern.",
        "You stop to count supplies. The cat counts on being included.",
        "The world is quiet enough to hear four paws and one stubborn pair of boots."
      ];
      setThought(lines[Math.floor(map.moves / 7) % lines.length]);
      setup.renderMap();
    }
    setup.maybeOpenExperimentShrine();
    return result;
  };

  setup.maybeOpenExperimentShrine = function () {
    var e = ensureExperimentState();
    var map = State.variables.map;
    if (
      setup.combat ||
      State.variables.activeMapEvent ||
      document.querySelector(".modal-backdrop") ||
      experimentSiteList.some(function (site) { return site.coord[0] === map.x && site.coord[1] === map.y; }) ||
      map.moves < 4 ||
      Math.random() >= 0.22
    ) return false;
    var region = experimentRegionAt(map.x, map.y);
    var pool = experimentShrines.filter(function (shrine) {
      return shrine.regions.indexOf(region) !== -1 && e.shrinesSeen.indexOf(shrine.id) === -1;
    });
    if (!pool.length) return false;
    setup.openExperimentShrine(pool[Math.floor(Math.random() * pool.length)]);
    return true;
  };

  setup.openExperimentShrine = function (shrine) {
    var e = ensureExperimentState();
    if (!shrine || e.shrinesSeen.indexOf(shrine.id) !== -1) return false;
    State.variables.storyStatEvents["shrine_" + shrine.id] = { kind: "moonmaidenShrine", shrine: shrine.id };
    e.shrinesSeen.push(shrine.id);
    e.evidence.push({
      code: "SHRINE_" + shrine.id,
      region: shrine.regions[0],
      place: "Moonmaiden shrine",
      title: shrine.name,
      text: shrine.text,
      voice: shrine.voice,
      boundary: "A later memorial records a claimed Moonmaiden. It is evidence of memory, not a divine authenticity stamp.",
      countsForRegion: false
    });
    e.items.push({ code: "SHRINE_" + shrine.id, name: shrine.name + " Offering", place: "Moonmaiden shrine", description: shrine.text });
    var backdrop = document.createElement("div");
    backdrop.id = "experiment-shrine-modal";
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true" aria-label="Moonmaiden shrine"><div class="experiment-kicker">Unique regional discovery</div><div class="modal-title">' +
      escapeHtml(shrine.name) + '</div><div class="modal-text">' + escapeHtml(shrine.text) + '</div><div class="experiment-meta">Voice: ' +
      escapeHtml(shrine.voice) + '<br>This shrine will not appear again in this playthrough, even after checkpoint restoration.</div><div class="modal-actions"><button class="modal-button" id="experiment-shrine-offering">Receive the offering</button><button class="modal-button" id="experiment-shrine-leave">Leave it for another traveler</button></div></div>';
    document.body.appendChild(backdrop);
    function closeShrine(takeReward) {
      if (takeReward && shrine.reward) setup.receiveLoot(shrine.reward, { message: false });
      backdrop.remove();
      setThought("The shrine leaves the road and enters the evidence ledger. Memory is not the same as proof, but neither is it nothing.");
      setup.updateInventory();
      setup.renderMap();
    }
    backdrop.querySelector("#experiment-shrine-offering").addEventListener("click", function () { closeShrine(true); });
    backdrop.querySelector("#experiment-shrine-leave").addEventListener("click", function () { closeShrine(false); });
    return true;
  };

  var originalExperimentRenderMap = setup.renderMap;
  setup.renderMap = function () {
    ensureExperimentState();
    originalExperimentRenderMap();
    var wrap = document.querySelector("#map-wrap");
    if (!wrap) return;
    var old = wrap.querySelector(".experiment-map-region");
    if (old) old.remove();
    var region = experimentRegionAt(State.variables.map.x, State.variables.map.y);
    State.variables.map.region = region;
    var badge = document.createElement("div");
    badge.className = "experiment-map-region";
    badge.textContent = experimentRegionMeta[region].name + " — " + experimentRegionMeta[region].question;
    var pre = wrap.querySelector("#world-map");
    if (pre) wrap.insertBefore(badge, pre);
    var actions = document.createElement("div");
    actions.className = "experiment-actions";
    actions.style.justifyContent = "center";
    actions.appendChild(experimentButton("Journey Journal", function () { play("Experiment Journal"); }));
    wrap.appendChild(actions);
  };

  function genericNodeAvailability(state) {
    return {
      arrival: true,
      ordinary: Boolean(state.nodes.arrival),
      evidence: Boolean(state.nodes.ordinary),
      danger: Boolean(state.nodes.ordinary),
      broken: Boolean(state.nodes.evidence || state.nodes.danger),
      overlook: Boolean(state.nodes.evidence && state.nodes.danger && state.nodes.broken)
    };
  }

  function genericNodeText(site, node) {
    var region = experimentRegionMeta[site.region];
    if (node === "arrival") return site.purpose;
    if (node === "ordinary") return site.ordinary;
    if (node === "evidence") return site.evidence.text;
    if (node === "danger") return "What occupies this place now grew from its failure, its abandoned work, or the war's repeated rules. The threat belongs to the location; it is not treasure-room furniture.";
    if (node === "broken") return "Here the route stops behaving like a settlement. " + site.name + " was physically ended by conflict, neglect, or demonification. The break reveals how its ordinary spaces once connected.";
    return "From above, the human route, evidence route, danger route, and broken route become one place. " + region.question;
  }

  function renderJourneyProgress(container) {
    var e = ensureExperimentState();
    var progress = document.createElement("div");
    progress.className = "experiment-progress";
    EXPERIMENT_MEMORIES.forEach(function (memory) {
      var span = document.createElement("span");
      span.className = e.memories[memory] ? "earned" : "";
      span.textContent = memory;
      progress.appendChild(span);
    });
    container.appendChild(progress);
  }

  setup.renderExperimentPlace = function () {
    var e = ensureExperimentState();
    var code = State.variables.currentPlaceKey || e.activeSite || "A";
    var site = experimentSitesByCode[code] || experimentSitesByCode.A;
    e.activeSite = site.code;
    e.regionVisits[site.region] = true;
    var state = siteState(site.code);
    state.visited = true;
    var root = document.querySelector("#experiment-place-root") || passageEl();
    if (!root) return;
    var shell = experimentShell(root, site);
    var deck = document.createElement("p");
    deck.className = "experiment-deck";
    deck.textContent = site.purpose;
    shell.appendChild(deck);
    renderJourneyProgress(shell);

    var card = document.createElement("div");
    card.className = "experiment-card";
    card.innerHTML = '<h3>' + (site.kind === "town" ? "A living place" : "A place with a former purpose") + '</h3><p>' +
      escapeHtml(site.ordinary) + '</p><div class="experiment-meta">' +
      escapeHtml(state.complete ? "Exploration complete. Every route remains revisitable." : "Settlement structure: ordinary life · evidence · danger · broken ground · overlook") + '</div>';
    shell.appendChild(card);

    var actions = document.createElement("div");
    actions.className = "experiment-actions";
    actions.appendChild(experimentButton(state.complete ? "Re-enter " + site.name : "Explore " + site.name, function () {
      e.activeMode = "site";
      e.activeNode = state.nodes.arrival ? (state.complete ? "overlook" : "arrival") : "arrival";
      play("Experiment Site");
    }));
    if (site.code === "A") {
      actions.appendChild(experimentButton(e.academy.resolved ? "Revisit the Northern Academy" : "Enter the Northern Academy", function () {
        e.activeMode = "academy";
        play("Experiment Site");
      }));
    }
    if (site.region === "holy" && e.commonGround.revealed) {
      actions.appendChild(experimentButton("Follow the roots to the Common Ground", function () {
        e.activeMode = "commonGround";
        play("Experiment Site");
      }));
    }
    if (site.code === "AZ") {
      actions.appendChild(experimentButton("Enter the memory-clash", function () { setup.openExperimentEnding(); }));
    }
    actions.appendChild(experimentButton("Journey Journal", function () { play("Experiment Journal"); }));
    actions.appendChild(experimentButton("Return to the world map", function () { setup.enterMap(site.code); }));
    shell.appendChild(actions);
  };

  setup.openExperimentNode = function (node) {
    var e = ensureExperimentState();
    var site = experimentSitesByCode[e.activeSite];
    var state = siteState(site.code);
    var available = genericNodeAvailability(state);
    if (!available[node]) return false;
    e.activeNode = node;
    state.nodes[node] = true;
    if (node === "evidence") addExperimentEvidence(site);
    if (node === "broken") state.broken = true;
    if (node === "danger" && !state.danger) {
      setup.beginDungeonCheckpoint();
      e.pendingEncounter = { mode: "site", code: site.code, node: "danger", expectedPassage: "Experiment Site", won: false };
      setup.startCombat(site.enemy, "Experiment Site", { kind: "dungeon", suppressLoot: false });
      return true;
    }
    if (node === "overlook") addExperimentItem(site);
    setup.renderExperimentSite();
    return true;
  };

  function resolveSiteChoice(site, index) {
    var e = ensureExperimentState();
    var state = siteState(site.code);
    if (state.choice >= 0) return;
    var choice = site.choices[index];
    state.choice = index;
    state.complete = true;
    setup.grantStoryStatExp("experiment_" + site.code, choice.stat, ({ north: 3, central: 5, holy: 6, desert: 7, demon: 8, outer: 8, inner: 9, final: 10 })[site.region], {
      choice: choice.label,
      message: choice.stat + " grew because of what you chose at " + site.name + "."
    });
    if (site.code === "AN" && regionEvidenceCount("central") >= 5) earnMemory("Duty", "Foederati's living rule can be carried, criticized, and corrected by people");
    if (site.code === "BN" && regionEvidenceCount("desert") >= 4) earnMemory("Future", "Veyra claims a life no dead master can certify");
    if (site.code === "AT") {
      e.terenTrust = true;
      earnMemory("Trust", "you keep or honestly renegotiate an exact bargain when betrayal would be easier");
      addConnection("teren", "Teren-Seven's exact route models allow human couriers to cross selected demon roads.");
    }
    if (site.code === "B") addConnection("seed", "Byron's spring seed begins moving between Northern, Central, and Desert growers.");
    if (site.code === "AC") addConnection("canal", "Central canal water now reaches Foederati and supplies parts for Traveler's Hope.");
    if (["K", "L", "O"].every(function (code) { return siteState(code).complete; })) addConnection("bells", "The three northern signals answer one another; Sella's lamp is visible beneath them.");
    if (site.code === "BJ") addConnection("pump", "Traveler's Hope pumps water using knowledge gathered across cultures.");
    if (site.code === "BB") addConnection("correctors", "Correctors adopt a revisable leadership compact instead of another permanent strongest ruler.");
    updateExperimentProgress();
    setup.renderExperimentSite();
  }

  setup.renderExperimentSite = function () {
    var e = ensureExperimentState();
    if (e.activeMode === "academy") return setup.renderExperimentAcademy();
    if (e.activeMode === "commonGround") return setup.renderCommonGround();
    var site = experimentSitesByCode[e.activeSite] || experimentSitesByCode.A;
    var state = siteState(site.code);
    var root = document.querySelector("#experiment-site-root") || passageEl();
    if (!root) return;
    var shell = experimentShell(root, site, experimentRegionMeta[site.region].name + " · authored settlement dungeon");
    var availability = genericNodeAvailability(state);
    var labels = {
      arrival: "Arrival Route",
      ordinary: "Human Route",
      evidence: "Evidence Route",
      danger: "Danger Route",
      broken: "Broken Route",
      overlook: "Loop and Overlook"
    };
    var grid = document.createElement("div");
    grid.className = "experiment-grid";
    Object.keys(labels).forEach(function (node) {
      var card = document.createElement("div");
      var complete = Boolean(state.nodes[node]) || (node === "danger" && state.danger);
      card.className = "experiment-node" + (complete ? " complete" : "") + (e.activeNode === node ? " current" : "") + (!availability[node] ? " locked" : "");
      card.innerHTML = '<h3>' + escapeHtml(labels[node]) + '</h3><p>' + escapeHtml(
        complete || e.activeNode === node ? genericNodeText(site, node) : (availability[node] ? "This route is open." : "Another route must establish how this place worked first.")
      ) + '</p>';
      card.appendChild(experimentButton(complete ? "Revisit" : (node === "danger" ? "Face what remains" : "Explore"), function () {
        setup.openExperimentNode(node);
      }, !availability[node] || (node === "danger" && state.danger && e.pendingEncounter)));
      grid.appendChild(card);
    });
    shell.appendChild(grid);

    if (e.activeNode === "evidence" && state.evidence) {
      var evidence = document.createElement("div");
      evidence.className = "experiment-evidence";
      evidence.innerHTML = '<div class="experiment-kicker">Evidence ledger</div><h3>' + escapeHtml(site.evidence.title) + '</h3><p>' +
        escapeHtml(site.evidence.text) + '</p><div class="experiment-meta">Voice: ' + escapeHtml(site.evidence.voice) + '<br>Knowledge boundary: ' + escapeHtml(site.evidence.boundary) + '</div>';
      shell.appendChild(evidence);
    }

    if (availability.overlook && state.nodes.overlook) {
      var choiceCard = document.createElement("div");
      choiceCard.className = "experiment-card";
      choiceCard.innerHTML = '<h3>' + (state.choice >= 0 ? "Choice carried forward" : "What do you do with what this place taught you?") + '</h3>';
      if (state.choice >= 0) {
        choiceCard.innerHTML += '<p>' + escapeHtml(site.choices[state.choice].result) + '</p><div class="experiment-meta">This permanent story event trained ' + escapeHtml(site.choices[state.choice].stat) + '.</div>';
      } else {
        var choiceActions = document.createElement("div");
        choiceActions.className = "experiment-actions";
        site.choices.forEach(function (choice, index) {
          choiceActions.appendChild(experimentButton(choice.label + " — " + choice.stat, function () { resolveSiteChoice(site, index); }));
        });
        choiceCard.appendChild(choiceActions);
      }
      shell.appendChild(choiceCard);
    }

    var actions = document.createElement("div");
    actions.className = "experiment-actions";
    actions.appendChild(experimentButton("Back to " + site.name, function () { play("Experiment Place"); }));
    actions.appendChild(experimentButton("Journey Journal", function () { play("Experiment Journal"); }));
    shell.appendChild(actions);
  };

  function academyNodeAvailable(node) {
    var academy = ensureExperimentState().academy;
    if (node.id === "gate") return true;
    if (node.requiresEvidence && academy.evidence.length < node.requiresEvidence) return false;
    return experimentAcademyNodes.some(function (candidate) {
      return academy.nodes[candidate.id] && candidate.next.indexOf(node.id) !== -1;
    });
  }

  function addAcademyEvidence(key) {
    var e = ensureExperimentState();
    if (e.academy.evidence.indexOf(key) !== -1) return;
    e.academy.evidence.push(key);
    var def = experimentAcademyEvidence[key];
    e.evidence.push({
      code: "ACADEMY_" + key,
      region: "north",
      place: "Northern Academy of Heroes",
      title: def.title,
      text: def.text,
      voice: def.voice,
      boundary: "A roll-call fragment records assignment and response status, not every person's final fate."
    });
    notify("Roll Call fragment recorded.");
  }

  setup.openAcademyNode = function (id) {
    var e = ensureExperimentState();
    var node = experimentAcademyNodes.find(function (entry) { return entry.id === id; });
    if (!node || !academyNodeAvailable(node)) return false;
    e.academy.active = id;
    e.academy.nodes[id] = true;
    if (node.evidence) addAcademyEvidence(node.evidence);
    if (node.item && !e.items.some(function (item) { return item.name === node.item; })) {
      e.items.push({ code: "ACADEMY_" + id, name: node.item, place: "Northern Academy of Heroes", description: node.text + " The object proves an institution was also a lived-in place." });
      notify("Lore item found: " + node.item);
    }
    if (node.enemy && !e.academy.nodes[id + "_cleared"]) {
      setup.beginDungeonCheckpoint();
      e.pendingEncounter = { mode: "academy", node: id, expectedPassage: "Experiment Site", won: false };
      setup.startCombat(node.enemy, "Experiment Site", { kind: "dungeon" });
      return true;
    }
    setup.renderExperimentAcademy();
    return true;
  };

  function resolveAcademy() {
    var e = ensureExperimentState();
    if (e.academy.resolved) return;
    e.academy.resolved = true;
    setup.grantStoryStatExp("academy_last_drill", "defense", 5, {
      choice: "End Roll Call without inventing a hidden victory",
      message: "Defense grew because you protected truth without surrendering care."
    });
    earnMemory("Limitation", "you cannot make a late arrival successful by discovering a secret rescue");
    addConnection("academy", "Stalwart begins discussing a small school inside the Academy's surviving service court.");
    notify("Thirty-three students. Two staff. Others still unknown. Unknown is not zero.");
    setup.renderExperimentAcademy();
  }

  setup.renderExperimentAcademy = function () {
    var e = ensureExperimentState();
    var root = document.querySelector("#experiment-site-root") || passageEl();
    if (!root) return;
    var site = { name: "Northern Academy of Heroes", region: "north" };
    var shell = experimentShell(root, site, "Northern Region · first complete dungeon framework");
    var deck = document.createElement("p");
    deck.className = "experiment-deck";
    deck.textContent = "Eighteen persistent spaces form a ruined institution: the western route holds the founder and teaching life, the eastern route holds service and evacuation, and the center carries training, breach, danger, and Roll Call. No room exists only to contain a monster.";
    shell.appendChild(deck);
    var summary = document.createElement("div");
    summary.className = "experiment-card";
    summary.innerHTML = '<h3>Roll Call</h3><p>' + e.academy.evidence.length + ' of 4 fragments recovered.</p><div class="experiment-meta">West: institution and founder · East: service and evacuation · Center: training, breach, and last stand</div>';
    shell.appendChild(summary);

    var grid = document.createElement("div");
    grid.className = "experiment-grid";
    experimentAcademyNodes.forEach(function (node) {
      var available = academyNodeAvailable(node);
      var visited = Boolean(e.academy.nodes[node.id]);
      var cleared = !node.enemy || Boolean(e.academy.nodes[node.id + "_cleared"]);
      var card = document.createElement("div");
      card.className = "experiment-node" + (visited && cleared ? " complete" : "") + (e.academy.active === node.id ? " current" : "") + (!available ? " locked" : "");
      card.innerHTML = '<div class="experiment-kicker">' + escapeHtml(node.route + " route") + '</div><h3>' + escapeHtml(node.name) + '</h3><p>' +
        escapeHtml(visited ? node.text : (available ? "This route is open." : "Reach it through a connected Academy space.")) + '</p>';
      var nodeButtonLabel = node.enemy && visited && !cleared ? "Face what remains" : (visited ? "Revisit" : "Enter");
      card.appendChild(experimentButton(nodeButtonLabel, function () { setup.openAcademyNode(node.id); }, !available || (node.enemy && visited && !cleared && e.pendingEncounter)));
      grid.appendChild(card);
    });
    shell.appendChild(grid);

    var active = experimentAcademyNodes.find(function (node) { return node.id === e.academy.active; });
    if (active && e.academy.nodes[active.id]) {
      var scene = document.createElement("div");
      scene.className = "experiment-evidence";
      scene.innerHTML = '<div class="experiment-kicker">' + escapeHtml(active.route + " route") + '</div><h3>' + escapeHtml(active.name) + '</h3><p>' + escapeHtml(active.text) + '</p>';
      if (active.evidence) {
        var evidence = experimentAcademyEvidence[active.evidence];
        scene.innerHTML += '<p><strong>' + escapeHtml(evidence.title) + ':</strong> ' + escapeHtml(evidence.text) + '</p><div class="experiment-meta">Voice: ' + escapeHtml(evidence.voice) + ' · knowledge limited to recorded assignments and responses.</div>';
      }
      shell.appendChild(scene);
    }

    if (e.academy.nodes.overlook) {
      var resolution = document.createElement("div");
      resolution.className = "experiment-card";
      resolution.innerHTML = '<h3>' + (e.academy.resolved ? "Roll Call ended" : "End Roll Call") + '</h3><p>' +
        (e.academy.resolved
          ? "Thirty-three students. Two staff. Others still unknown. Unknown is not zero. The Academy is permitted to be a ruin and a beginning at the same time."
          : "The fragments cannot produce a hidden total rescue. They can preserve action, failure, uncertainty, and the people who chose to try.") + '</p>';
      if (!e.academy.resolved) resolution.appendChild(experimentButton("Speak the final count", resolveAcademy));
      shell.appendChild(resolution);
    }

    var actions = document.createElement("div");
    actions.className = "experiment-actions";
    actions.appendChild(experimentButton("Return to Stalwart", function () { play("Experiment Place"); }));
    actions.appendChild(experimentButton("Journey Journal", function () { play("Experiment Journal"); }));
    shell.appendChild(actions);
  };

  setup.renderCommonGround = function () {
    var e = ensureExperimentState();
    var root = document.querySelector("#experiment-site-root") || passageEl();
    if (!root) return;
    var site = { name: "The Common Ground", region: "holy" };
    var shell = experimentShell(root, site, "Hidden beneath the Holy Forest · original refugee hearth");
    e.commonGround.visited = true;
    var deck = document.createElement("p");
    deck.className = "experiment-deck";
    deck.textContent = "Before the three divine paths divided, refugees ate from ordinary bowls around this hearth. The Moon descended first despite the warning that descent would one day kill the gods. The Sun and Forge followed. Their values found human practice here before they became cultures.";
    shell.appendChild(deck);
    var card = document.createElement("div");
    card.className = "experiment-card";
    card.innerHTML = '<h3>The single tulip</h3><p>' + (e.tulip.found
      ? "The hollow where it grew remains warm. The world noticed what you did, and a little magic has begun to answer again."
      : "One living tulip rises from soil the dying world has spent its last easy strength protecting. It is not a key and offers no instruction. The world turns its attention toward you and asks without words.") + '</p>';
    if (!e.tulip.found) {
      var tulipActions = document.createElement("div");
      tulipActions.className = "experiment-actions";
      tulipActions.appendChild(experimentButton("Lift it with its living soil", function () {
        e.tulip.found = true;
        e.tulip.carried = true;
        earnMemory("Care", "the world asks for help without guaranteeing what help can accomplish");
        addConnection("magic", "Sella's failed lamp holds light for a full breath. Across the world, dormant Asker instruments twitch toward the living tulip.");
        e.items.push({ code: "TULIP", name: "The Single Tulip", place: "The Common Ground", description: "The dying world spent its remaining easy strength protecting one ordinary flower. It loves you enough to ask, not enough to decide for you." });
        setup.renderCommonGround();
      }));
      tulipActions.appendChild(experimentButton("Leave it rooted until you understand more", function () {
        e.tulip.leftAtCommonGround = true;
        notify("The tulip remains. Refusal to take it is not the same as failing to see it.");
        setup.renderCommonGround();
      }));
      card.appendChild(tulipActions);
    }
    shell.appendChild(card);
    var actions = document.createElement("div");
    actions.className = "experiment-actions";
    actions.appendChild(experimentButton("Return to " + experimentSitesByCode[e.activeSite].name, function () { e.activeMode = "site"; play("Experiment Place"); }));
    actions.appendChild(experimentButton("Journey Journal", function () { play("Experiment Journal"); }));
    shell.appendChild(actions);
  };

  function appendOpeningExperimentHooks() {
    var e = ensureExperimentState();
    var passage = passageEl();
    if (!passage || passage.querySelector(".experiment-opening-hook")) return;
    if (State.passage === "Stalwart - Main Square") {
      var hook = document.createElement("div");
      hook.className = "experiment-card experiment-opening-hook";
      hook.innerHTML = '<div class="experiment-kicker">An unfinished route</div><h3>' +
        (e.routeBook ? "Mera Quill's route book" : "The dead courier beside the notice wall") + '</h3><p>' +
        (e.routeBook
          ? "Mera's four circles remain: Lord's Rest, Outpost Three, Foederati, and Journeyman's Rest. You used to scavenge and return because the shelter was the only future you could still measure. Her unfinished network makes returning alone feel like another form of waiting to die."
          : "The courier died inside Stalwart with mud from a road nobody here has walked in years. A route book is tied beneath her coat. Four distant settlements are marked possibly alive.") + '</p>';
      if (!e.routeBook) {
        hook.appendChild(experimentButton("Take Mera Quill's route book", function () {
          e.routeBook = true;
          e.routeChoice = "connect";
          if (!e.items.some(function (item) { return item.code === "MERA"; })) {
            e.items.push({
              code: "MERA",
              name: "Dead Courier's Route Book",
              place: "Stalwart",
              description: "Four distant settlements are circled. Mera wrote: POSSIBLY ALIVE IS NOT THE SAME AS REACHED. The protagonist leaves because a road between living people is a future the shelter cannot offer."
            });
          }
          addConnection("mera", "Mera Quill's unfinished routes make the four surviving human settlements part of one possible world.");
          notify("The world map is now an unfinished promise, not a scavenging loop.");
          appendOpeningExperimentHooksRefresh();
        }));
      }
      passage.appendChild(hook);
    }
    if (State.passage === "Stalwart - Ruined Gardens") {
      var catHook = document.createElement("div");
      catHook.className = "experiment-card experiment-opening-hook experiment-cat";
      e.cat.met = true;
      catHook.innerHTML = '<h3>' + (e.cat.adopted ? "The cat" : "A starving cat") + '</h3><p>' +
        (e.cat.adopted
          ? "The cat waits among the dead vines as if checking that Stalwart remains where it left the city. When you move, it falls in beside you."
          : "A thin cat watches from beneath the ruined trellis. It does not ask the world for food. It asks you by refusing to look away.") + '</p>';
      if (!e.cat.adopted) {
        catHook.appendChild(experimentButton(State.variables.inventory.food > 0 ? "Feed the cat — 1 food" : "You have no food to spare", function () {
          if (State.variables.inventory.food <= 0) return;
          State.variables.inventory.food -= 1;
          e.cat.adopted = true;
          addConnection("cat", "A starving cat chooses the journey after being fed once. It follows through towns, roads, and dungeons, but waits at the final Gate.");
          setup.updateInventory();
          notify("The cat follows you. It has not supplied a name.");
          appendOpeningExperimentHooksRefresh();
        }, State.variables.inventory.food <= 0));
      }
      passage.appendChild(catHook);
    }
  }

  function appendOpeningExperimentHooksRefresh() {
    var old = passageEl() && passageEl().querySelector(".experiment-opening-hook");
    if (old) old.remove();
    appendOpeningExperimentHooks();
  }

  function appendSpecialPlaceCard(shell, site) {
    var e = ensureExperimentState();
    if (site.code === "A" && !e.routeBook) {
      var mera = document.createElement("div");
      mera.className = "experiment-card";
      mera.innerHTML = '<div class="experiment-kicker">The notice wall</div><h3>Mera Quill’s unfinished route</h3><p>Four distant settlements are marked possibly alive. The shelter can keep one person returning; this book suggests living people might begin returning to one another.</p>';
      mera.appendChild(experimentButton("Carry Mera's route book", function () {
        e.routeBook = true;
        e.routeChoice = "connect";
        if (!e.items.some(function (item) { return item.code === "MERA"; })) {
          e.items.push({ code: "MERA", name: "Dead Courier's Route Book", place: "Stalwart", description: "Four surviving settlements are circled. POSSIBLY ALIVE IS NOT THE SAME AS REACHED." });
        }
        addConnection("mera", "Mera Quill's unfinished routes make the four surviving human settlements part of one possible world.");
        setup.renderExperimentPlace();
      }));
      shell.appendChild(mera);
    }
    if (site.code === "A" && !e.cat.adopted) {
      var gardenCat = document.createElement("div");
      gardenCat.className = "experiment-card experiment-cat";
      e.cat.met = true;
      gardenCat.innerHTML = '<h3>The starving cat in the ruined gardens</h3><p>It watches from beneath the trellis. Leaving Stalwart did not make this small decision disappear.</p>';
      gardenCat.appendChild(experimentButton(State.variables.inventory.food > 0 ? "Feed the cat — 1 food" : "You have no food to spare", function () {
        if (State.variables.inventory.food <= 0) return;
        State.variables.inventory.food -= 1;
        e.cat.adopted = true;
        addConnection("cat", "A starving cat chooses the journey after being fed once. It follows through towns, roads, and dungeons, but waits at the final Gate.");
        setup.updateInventory();
        notify("The cat follows you. It has not supplied a name.");
        setup.renderExperimentPlace();
      }, State.variables.inventory.food <= 0));
      shell.appendChild(gardenCat);
    }
    var unbrokenClueCount = e.evidence.filter(function (entry) { return entry.code.indexOf("UNBROKEN_") === 0; }).length;
    if (site.code === "AU" && e.terenTrust && unbrokenClueCount >= 3) {
      var unbroken = document.createElement("div");
      unbroken.className = "experiment-card";
      unbroken.innerHTML = '<div class="experiment-kicker">The legend at the grave-flat</div><h3>The Unbroken</h3><p>' +
        (e.unbrokenSeen
          ? "Together, the regional clues resolve: impossible lifespan, demonic precision, voluntary loss, and a refusal to abandon either species' names. The Unbroken is a demon who followed human choices until choice became his own practice. The Moon never touched him."
          : "A person stands between the human and demon markers. Every region describes some quirk that could belong to an unusual human. Here, taken together, they stop fitting. He confirms nothing until you call restoring names inefficient—and ask why he returned.") + '</p>';
      if (!e.unbrokenSeen) unbroken.appendChild(experimentButton("Ask why he came back", function () {
        e.unbrokenSeen = true;
        notify("The Unbroken: 'Difficulty does not remove the option. Returning is part of the choice.'");
        play("Experiment Place");
      }));
      shell.appendChild(unbroken);
    } else if (site.code === "AU") {
      var graveKeeper = document.createElement("div");
      graveKeeper.className = "experiment-card";
      graveKeeper.innerHTML = '<div class="experiment-kicker">A person among the names</div><h3>The grave keeper</h3><p>He restores human and demon markers with identical knots and exact intervals. Without trust and several regional traditions, this remains one more quirk belonging to one very old stranger.</p><div class="experiment-meta">Unbroken pattern: ' + unbrokenClueCount + '/3 regional clues · Teren trust: ' + (e.terenTrust ? "established" : "not established") + '</div>';
      shell.appendChild(graveKeeper);
    }
    if (site.code === "AY" && e.cat.adopted) {
      var cat = document.createElement("div");
      cat.className = "experiment-card experiment-cat";
      cat.innerHTML = '<h3>The cat waits</h3><p>It plants all four paws before the final road and refuses to enter. The Hero’s note and the animal make the same correction in different languages: love does not require the same ending.</p>';
      shell.appendChild(cat);
    }
    if (site.code === "O" && e.tulip.found) {
      var lamp = document.createElement("div");
      lamp.className = "experiment-card";
      lamp.innerHTML = '<h3>Sella’s lamp</h3><p>The failed lamp holds pale light for a full breath. Sella does not call it a miracle. She records the duration twice, then laughs hard enough to ruin the third measurement.</p>';
      shell.appendChild(lamp);
    }
  }

  var baseRenderExperimentPlace = setup.renderExperimentPlace;
  setup.renderExperimentPlace = function () {
    baseRenderExperimentPlace();
    var e = ensureExperimentState();
    var site = experimentSitesByCode[e.activeSite];
    var shell = document.querySelector("#experiment-place-root .experiment-shell");
    if (shell && site && EXPERIMENT_TOWNS.indexOf(site.code) !== -1) {
      var services = document.createElement("div");
      services.className = "experiment-card";
      services.innerHTML = '<div class="experiment-kicker">Living settlement</div><h3>Rest and prepare</h3><p>The route network matters only if its living places can keep travelers alive.</p>';
      var serviceActions = document.createElement("div");
      serviceActions.className = "experiment-actions";
      serviceActions.appendChild(experimentButton("Rest to full health", function () {
        State.variables.player.hp = State.variables.player.maxHp;
        setup.commitTownProgress();
        notify("health restored");
        setup.renderExperimentPlace();
      }, State.variables.player.hp >= State.variables.player.maxHp));
      serviceActions.appendChild(experimentButton("Buy road food and water — 6 gold", function () {
        if (State.variables.inventory.gold < 6) return;
        State.variables.inventory.gold -= 6;
        State.variables.inventory.food += 3;
        State.variables.inventory.water += 3;
        setup.updateInventory();
        notify("road supplies packed");
        setup.renderExperimentPlace();
      }, State.variables.inventory.gold < 6));
      services.appendChild(serviceActions);
      shell.appendChild(services);
    }
    if (shell && site) appendSpecialPlaceCard(shell, site);
  };

  setup.renderExperimentJournal = function () {
    var e = ensureExperimentState();
    var root = document.querySelector("#experiment-journal-root") || passageEl();
    if (!root) return;
    var site = { name: "Journey Journal", region: "north" };
    var shell = experimentShell(root, site, "Evidence, choices, routes, and things carried");
    var visited = Object.keys(e.places).filter(function (code) { return e.places[code].visited; }).length;
    var completed = Object.keys(e.places).filter(function (code) { return e.places[code].complete; }).length;
    var deck = document.createElement("p");
    deck.className = "experiment-deck";
    deck.textContent = visited + " of " + experimentSiteList.length + " named locations reached · " + completed + " location arcs completed · " + e.evidence.length + " evidence entries · " + e.items.length + " lore items.";
    shell.appendChild(deck);
    renderJourneyProgress(shell);

    var status = document.createElement("div");
    status.className = "experiment-card";
    status.innerHTML = '<h3>The person carrying the sword</h3><p>' +
      (e.routeBook ? "You left Stalwart to finish Mera's routes and learn whether scattered survival could become a connected future." : "The shelter is still the limit of the journey you understand.") +
      (e.cat.adopted ? " A cat chose to make the road your shared problem." : " The ruined gardens still contain one life small enough to overlook.") +
      '</p><div class="experiment-meta">Sword stage ' + e.swordStage + ' of 3 · ' + escapeHtml(State.variables.weapon.name) +
      '<br>Magic: ' + (e.tulip.found ? "the world has begun answering in brief, unreliable flickers" : "failing as the world dies") +
      '<br>Divine power: separate from magic; the gods remain dead.</div>';
    shell.appendChild(status);

    var tabActions = document.createElement("div");
    tabActions.className = "experiment-actions";
    ["journey", "evidence", "items", "connections"].forEach(function (tab) {
      tabActions.appendChild(experimentButton(tab.charAt(0).toUpperCase() + tab.slice(1), function () { e.journalTab = tab; setup.renderExperimentJournal(); }, e.journalTab === tab));
    });
    shell.appendChild(tabActions);

    function appendEmpty(message) {
      var empty = document.createElement("div");
      empty.className = "experiment-card";
      empty.innerHTML = '<p>' + escapeHtml(message) + '</p>';
      shell.appendChild(empty);
    }

    if (e.journalTab === "evidence") {
      if (!e.evidence.length) appendEmpty("No evidence has been recorded.");
      e.evidence.slice().reverse().forEach(function (entry) {
        var card = document.createElement("div");
        card.className = "experiment-evidence";
        card.innerHTML = '<div class="experiment-kicker">' + escapeHtml(entry.place) + '</div><h3>' + escapeHtml(entry.title) + '</h3><p>' + escapeHtml(entry.text) + '</p><div class="experiment-meta">Voice: ' + escapeHtml(entry.voice) + '<br>Knowledge boundary: ' + escapeHtml(entry.boundary) + '</div>';
        shell.appendChild(card);
      });
    } else if (e.journalTab === "items") {
      if (!e.items.length) appendEmpty("No lore items have been carried out yet.");
      e.items.slice().reverse().forEach(function (item) {
        var card = document.createElement("div");
        card.className = "experiment-card";
        card.innerHTML = '<div class="experiment-kicker">' + escapeHtml(item.place) + '</div><h3>' + escapeHtml(item.name) + '</h3><p>' + escapeHtml(item.description) + '</p>';
        shell.appendChild(card);
      });
    } else if (e.journalTab === "connections") {
      if (!e.connections.length) appendEmpty("No routes or ideas have been reconnected yet.");
      e.connections.forEach(function (connection) {
        var card = document.createElement("div");
        card.className = "experiment-card";
        card.innerHTML = '<h3>' + escapeHtml(connection.key.replace(/\b\w/g, function (letter) { return letter.toUpperCase(); })) + '</h3><p>' + escapeHtml(connection.text) + '</p>';
        shell.appendChild(card);
      });
    } else {
      Object.keys(experimentRegionMeta).forEach(function (region) {
        var meta = experimentRegionMeta[region];
        var regionSites = experimentSiteList.filter(function (entry) { return entry.region === region; });
        var regionVisited = regionSites.filter(function (entry) { return siteState(entry.code).visited; }).length;
        var regionComplete = regionSites.filter(function (entry) { return siteState(entry.code).complete; }).length;
        var card = document.createElement("div");
        card.className = "experiment-card";
        card.innerHTML = '<div class="experiment-kicker">' + escapeHtml(meta.words) + '</div><h3>' + escapeHtml(meta.name) + '</h3><p>' + escapeHtml(meta.question) + '</p><div class="experiment-meta">' + regionVisited + '/' + regionSites.length + ' reached · ' + regionComplete + '/' + regionSites.length + ' resolved</div>';
        shell.appendChild(card);
      });
    }
    var actions = document.createElement("div");
    actions.className = "experiment-actions";
    actions.appendChild(experimentButton("Return to the world map", function () { setup.enterMap(e.activeSite || "A"); }));
    actions.appendChild(experimentButton("Return to current place", function () { play("Experiment Place"); }));
    shell.appendChild(actions);
  };

  setup.openExperimentEnding = function () {
    var e = ensureExperimentState();
    e.activeSite = "AZ";
    if (!siteState("AZ").danger) {
      setup.beginDungeonCheckpoint();
      e.pendingEncounter = { mode: "fear", code: "AZ", expectedPassage: "Experiment Ending", won: false };
      setup.startCombat("stolenEmotion", "Experiment Ending", { kind: "dungeon", suppressLoot: true });
      return;
    }
    play("Experiment Ending");
  };

  function finishExperimentEnding(key, title, text) {
    var e = ensureExperimentState();
    e.ending = key;
    e.endingText = text;
    e.completed = true;
    e.endingPhase = "complete";
    State.variables.gameWon = true;
    setup.renderExperimentEnding();
  }

  function resolveTulipDestination(destination) {
    var e = ensureExperimentState();
    e.tulip.destination = destination;
    e.tulip.carried = false;
    if (destination === "fear") {
      finishExperimentEnding("world_relearns", "The World Relearns to Answer",
        "You plant the tulip inside the deepest forced Demand. Its roots do not erase the scar; they give the world a living path through it. Across the continent, Askers feel attention return in brief, uncertain waves. Demands become harder to hold permanently. Magic is not restored at once. The world begins recovering because you helped it choose growth over repetition.");
    } else if (destination === "common") {
      finishExperimentEnding("common_ground", "A Shared Beginning",
        "You return the tulip to the first refugee hearth. Its seeds travel slowly along Mera's reopened routes. No region owns the recovery, and no god descends to command it. Magic returns first in acts that connect places: water lifted, signals carried, roofs held long enough for hands to finish the work.");
    } else if (destination === "stalwart") {
      finishExperimentEnding("small_garden", "The Stalwart Garden",
        "You plant the tulip beside the ruined trellis where the cat once starved. Sella's lamp lights. The Academy's service court becomes a school. Recovery begins in one named place rather than as a continental promise. Years later, travelers carry seed outward and argue about who deserves credit. The world appears to enjoy the argument.");
    } else {
      finishExperimentEnding("carried_future", "The Unfinished Road",
        "You do not let a battlefield, shrine, or city decide the flower's only meaning. You carry it beyond the last marked road. Magic continues to flicker wherever the world can follow. The ending remains deliberately uncertain, but it is no longer static: your brother is at rest, the routes are open, and the person holding the future is still capable of changing his mind.");
    }
  }

  setup.resolveBrotherPassing = function () {
    var e = ensureExperimentState();
    e.endingPhase = "tulip";
    addConnection("brothers", "The Hero passes peacefully after his brother releases the belief that endless battle is the only faithful form of love.");
    setup.renderExperimentEnding();
  };

  setup.renderExperimentEnding = function () {
    var e = ensureExperimentState();
    var root = document.querySelector("#experiment-ending-root") || passageEl();
    if (!root) return;
    var site = { name: e.completed ? "After the Final Battle" : "The Fear", region: "final" };
    var shell = experimentShell(root, site, "The death scar · the brothers · the final choice");
    renderJourneyProgress(shell);

    if (e.completed) {
      var complete = document.createElement("div");
      complete.className = "experiment-card experiment-ending-choice";
      var endingTitles = {
        world_relearns: "The World Relearns to Answer",
        common_ground: "A Shared Beginning",
        small_garden: "The Stalwart Garden",
        carried_future: "The Unfinished Road",
        two_ghosts: "Two Ghosts at the End of the World",
        burdened_release: "A Brother, Still Carried",
        moonless_dawn: "Moonless Dawn"
      };
      complete.innerHTML = '<div class="experiment-kicker">Ending reached</div><h3>' + escapeHtml(endingTitles[e.ending] || "After the Final Battle") + '</h3><p>' + escapeHtml(e.endingText) + '</p>';
      shell.appendChild(complete);
      if (e.cat.adopted) {
        var cat = document.createElement("div");
        cat.className = "experiment-card experiment-cat";
        cat.innerHTML = '<h3>At the Gate</h3><p>The cat is still waiting. It inspects you, the sword, and the absence walking beside you. Then it turns toward the road, confident that you understand the next instruction.</p>';
        shell.appendChild(cat);
      }
      var completeActions = document.createElement("div");
      completeActions.className = "experiment-actions";
      completeActions.appendChild(experimentButton("Review the completed journey", function () { play("Experiment Journal"); }));
      completeActions.appendChild(experimentButton("Continue exploring", function () { setup.enterMap("AY"); }));
      shell.appendChild(completeActions);
      return;
    }

    if (e.endingPhase === "tulip") {
      var passing = document.createElement("div");
      passing.className = "experiment-card";
      passing.innerHTML = '<h3>Your brother understands</h3><p>The Hero stops standing like a monument. He remembers cleaning armor in silence, sending soldiers back at the Gate, and wanting you alive for reasons that had nothing to do with victory. "I thought if I stopped," he says, "every death behind me would become wasted." You answer that an ending does not make the choice to care meaningless. He laughs once—not like the Demon King stealing a feeling, but like your brother recognizing one. Then he passes peacefully. The Moon does not arrive. She is dead. The Old Sword blooms with light because your human soul chooses to carry what her power once recognized.</p>';
      shell.appendChild(passing);
      if (e.tulip.found && e.tulip.carried) {
        var flower = document.createElement("div");
        flower.className = "experiment-card experiment-ending-choice";
        flower.innerHTML = '<h3>What do you ask of the single tulip?</h3><p>The world attends. It will make way if it can, but it will not choose your meaning for you.</p>';
        var flowerActions = document.createElement("div");
        flowerActions.className = "experiment-actions";
        flowerActions.appendChild(experimentButton("Plant it in the Fear's scar", function () { resolveTulipDestination("fear"); }));
        flowerActions.appendChild(experimentButton("Return it to the Common Ground", function () { resolveTulipDestination("common"); }));
        flowerActions.appendChild(experimentButton("Plant it in Stalwart's ruined garden", function () { resolveTulipDestination("stalwart"); }));
        flowerActions.appendChild(experimentButton("Carry it beyond the known map", function () { resolveTulipDestination("road"); }));
        flower.appendChild(flowerActions);
        shell.appendChild(flower);
      } else {
        var noFlower = document.createElement("div");
        noFlower.className = "experiment-card";
        noFlower.innerHTML = '<h3>Moonless dawn</h3><p>Your brother is free, the gods remain dead, and the world still declines. The routes and living settlements matter even without a miraculous recovery.</p>';
        noFlower.appendChild(experimentButton("Accept the world you helped connect", function () {
          finishExperimentEnding("moonless_dawn", "Moonless Dawn", "Your brother passes without the gods returning. Magic continues to fail, but five settlements now exchange food, law, craft, and warning. You did not cure the world. You prevented its dying from becoming an excuse to stop choosing one another.");
        }));
        shell.appendChild(noFlower);
      }
      return;
    }

    var count = memoryCount();
    var clash = document.createElement("div");
    clash.className = "experiment-card";
    clash.innerHTML = '<h3>The memory-clash</h3><p>The Hero appears with the Demon King’s death still happening behind his eyes. He sees the Old Sword and assumes you have come to help repeat the only moment that still feels complete. You now carry ' + count + ' of 6 experiences capable of answering that belief.</p>';
    shell.appendChild(clash);

    if (count < 4) {
      var early = document.createElement("div");
      early.className = "experiment-card experiment-ending-choice";
      early.innerHTML = '<h3>The road was too short</h3><p>You know grief and victory, but not enough lives beyond them. You can still join the fight. Neither brother will know how to stop.</p>';
      early.appendChild(experimentButton("Fight beside him forever", function () {
        finishExperimentEnding("two_ghosts", "Two Ghosts at the End of the World", "You defeat the stolen emotions again. Then again. The world learns to route around two brothers who call repetition loyalty. Long after the sword forgets the Moon, two ghosts remain at the end of the world, keeping a battle alive because neither learned what love could ask after victory.");
      }));
      shell.appendChild(early);
    } else if (count < 6) {
      var partial = document.createElement("div");
      partial.className = "experiment-card experiment-ending-choice";
      partial.innerHTML = '<h3>An incomplete release</h3><p>You can show him that life continued, but missing experiences leave part of his burden unanswered. He can step away; you cannot yet let him go without carrying the role yourself.</p>';
      partial.appendChild(experimentButton("Take up the watch and let him rest", function () {
        finishExperimentEnding("burdened_release", "A Brother, Still Carried", "The Hero passes, grateful and unconvinced. You inherit the watch he could not end. It is gentler in your hands, and the reopened routes sometimes pull you away from the scar, but part of the final battle remains your occupation.");
      }));
      shell.appendChild(partial);
    } else {
      var full = document.createElement("div");
      full.className = "experiment-card experiment-ending-choice";
      full.innerHTML = '<h3>Six answers that are not arguments</h3><p>Care proves worth without guaranteed rescue. Duty survives through correction. Limitation honors failed action without inventing victory. Trust crosses unlike natures. Truth refuses manufactured necessity. Future lets the living finish what the dead cannot certify. None negates your brother’s grief. Together they make another choice imaginable.</p>';
      full.appendChild(experimentButton("Tell your brother he can stop", setup.resolveBrotherPassing));
      shell.appendChild(full);
    }
  };

  function resolvePendingExperimentEncounter() {
    var e = ensureExperimentState();
    var pending = e.pendingEncounter;
    if (!pending || !pending.won) return;
    if (pending.mode === "site" && State.passage === "Experiment Site") {
      var state = siteState(pending.code);
      state.danger = true;
      state.nodes.danger = true;
      e.pendingEncounter = null;
    } else if (pending.mode === "academy" && State.passage === "Experiment Site") {
      e.academy.nodes[pending.node + "_cleared"] = true;
      e.pendingEncounter = null;
    } else if (pending.mode === "fear" && State.passage === "Experiment Ending") {
      siteState("AZ").danger = true;
      siteState("AZ").nodes.danger = true;
      e.pendingEncounter = null;
    }
  }

  setup.verifyBuildOnce = function () {
    var required = [
      "enterMap", "enterPlace", "moveMap", "renderMap", "startCombat", "grantStoryStatExp",
      "saveGame", "continueGame", "newGame", "beginDungeonCheckpoint", "requestDefeat", "resolveDefeat",
      "renderExperimentPlace", "renderExperimentSite", "renderExperimentAcademy", "renderExperimentJournal",
      "renderExperimentEnding", "openExperimentNode", "openAcademyNode", "openExperimentShrine"
    ];
    var missing = required.filter(function (name) { return typeof setup[name] !== "function"; });
    var codes = experimentSiteList.map(function (site) { return site.code; });
    var coords = experimentSiteList.map(function (site) { return site.coord.join(","); });
    var invalidSites = experimentSiteList.filter(function (site) {
      return !site.name || !site.purpose || !site.ordinary || !site.evidence || !site.item ||
        !site.choices || site.choices.length !== 2 || !setup.enemies[site.enemy];
    }).map(function (site) { return site.code; });
    var invalidAcademy = experimentAcademyNodes.filter(function (node) {
      return node.next.some(function (next) { return !experimentAcademyNodes.some(function (candidate) { return candidate.id === next; }); }) ||
        (node.enemy && !setup.enemies[node.enemy]);
    }).map(function (node) { return node.id; });
    var townFailures = EXPERIMENT_TOWNS.filter(function (code) {
      var place = setup.places[code];
      return !place || !place.respawnPassage || place.modifiers.indexOf("Town") === -1;
    });
    var combat = setup.verifyFastCombat();
    return {
      ok: missing.length === 0 && codes.length === 69 && new Set(codes).size === 69 && new Set(coords).size === 69 &&
        invalidSites.length === 0 && experimentAcademyNodes.length === 18 && invalidAcademy.length === 0 &&
        experimentShrines.length === 10 && townFailures.length === 0 && combat.ok,
      build: setup.__afterFinalBattleBuild,
      missingFunctions: missing,
      placeCount: codes.length,
      uniqueCoordinates: new Set(coords).size,
      invalidSites: invalidSites,
      academyNodes: experimentAcademyNodes.length,
      academyEvidence: Object.keys(experimentAcademyEvidence).length,
      invalidAcademy: invalidAcademy,
      shrineCount: experimentShrines.length,
      minorGodFragments: Object.keys(experimentMinorGodFragments).length,
      unbrokenClues: Object.keys(experimentUnbrokenClues).length,
      townFailures: townFailures,
      combat: combat,
      protectedTruth: {
        purgeArchive: "BF",
        provisionLedger: "BG",
        firstBattleCoordinateInvented: false,
        huntCoordinate: experimentSitesByCode.AV.coord.slice()
      }
    };
  };

  setup.verifyBuildThreeTimes = function () {
    return { firstCheck: setup.verifyBuildOnce(), secondCheck: setup.verifyBuildOnce(), thirdCheck: setup.verifyBuildOnce() };
  };

  $(document).on(":storyready", function () {
    var e = ensureExperimentState();
    if (e.pendingEncounter && !setup.combat) e.pendingEncounter = null;
    setup.__afterFinalBattleBuild = "complete-world-experiment-1";
    State.variables.atfbBuild = setup.__afterFinalBattleBuild;
    updateExperimentProgress();
    updateSwordStage();
    document.documentElement.setAttribute("data-atfb-build-verification", setup.verifyBuildOnce().ok ? "pass" : "fail");
  });

  var originalExperimentRequestDefeat = setup.requestDefeat;
  setup.requestDefeat = function (checkpointType) {
    var e = ensureExperimentState();
    e.pendingEncounter = null;
    return originalExperimentRequestDefeat(checkpointType);
  };

  var originalExperimentPlay = play;
  play = function (passage) {
    var e = ensureExperimentState();
    if (e.pendingEncounter && !setup.combat && passage === e.pendingEncounter.expectedPassage) {
      e.pendingEncounter.won = true;
    }
    return originalExperimentPlay(passage);
  };

  var originalExperimentTypewriter = setup.startPassageTypewriter;
  setup.startPassageTypewriter = function () {
    if (["Experiment Place", "Experiment Site", "Experiment Journal", "Experiment Ending"].indexOf(State.passage) !== -1) return false;
    return originalExperimentTypewriter();
  };

  $(document).on(":passagedisplay", function () {
    ensureExperimentState();
    resolvePendingExperimentEncounter();
    setTimeout(function () {
      var passage = passageEl();
      if (passage && !passage.querySelector(".experiment-banner") && ["Welcome", "Shelter", "Cracks", "Sword", "Stale Bread"].indexOf(State.passage) === -1) {
        var banner = document.createElement("div");
        banner.className = "experiment-banner";
        banner.textContent = "Complete World Experiment · proposals remain separate from approved v18 canon";
        passage.insertBefore(banner, passage.firstChild);
      }
      if (State.passage === "Experiment Place") setup.renderExperimentPlace();
      if (State.passage === "Experiment Site") setup.renderExperimentSite();
      if (State.passage === "Experiment Journal") setup.renderExperimentJournal();
      if (State.passage === "Experiment Ending") setup.renderExperimentEnding();
      appendOpeningExperimentHooks();
    }, 0);
  });
