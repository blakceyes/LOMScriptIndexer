(() => {
  "use strict";

  const SR = window.SR;

  const DEFAULT_TAGS = ["s", "c", "br", "j", "m", "lore", "sc", "bt"];
  const DEFAULT_MODES = ["dialog", "narration", "think"];
  const RICH_TAG = /\{[^{}]*\}/g;

  const record = (value) => (
    value && typeof value === "object" && !Array.isArray(value) ? value : null
  );

  const list = (value) => (Array.isArray(value) ? value : []);

  const text = (value) => (typeof value === "string" ? value : "");

  const number = (value, fallback) => (
    typeof value === "number" && Number.isFinite(value) ? value : fallback
  );

  SR.define("beat", ["data"], ({ data }) => {
    const tags = (data.vocab.beatTags && data.vocab.beatTags.length)
      ? data.vocab.beatTags : DEFAULT_TAGS;
    const modes = (data.vocab.sayModes && data.vocab.sayModes.length)
      ? data.vocab.sayModes : DEFAULT_MODES;

    const TAGS = {
      say: tags[0],
      choice: tags[1],
      branch: tags[2],
      jump: tags[3],
      meta: tags[4],
      lore: tags[5],
      scene: tags[6],
      battle: tags[7],
    };

    const is = (row, name) => Array.isArray(row) && row.length > 0 && row[0] === TAGS[name];

    const say = (row) => {
      const modeIndex = number(row[3], 0);
      return {
        speaker: text(row[1]),
        text: text(row[2]),
        mode: modes[modeIndex] || modes[0],
        modeIndex,
      };
    };

    const check = (value) => {
      const hit = record(value);
      return hit && text(hit.key) ? hit : null;
    };

    const option = (item) => ({
      text: text(item[0]),
      cond: record(item[1]),
      beats: list(item[2]),
      lock: text(item[3]),
      detail: record(item[4]),
    });

    const choice = (row) => list(row[1]).filter(Array.isArray).map(option);

    const branch = (row) => ({
      check: check(row[1]),
      cond: record(row[2]),
      text: text(row[3]),
      beats: list(row[4]),
      group: number(row[5], 0),
    });

    const jump = (row) => ({
      target: text(row[1]),
      label: text(row[2]),
    });

    const scene = (row) => ({
      name: text(row[1]),
      key: text(row[2]),
      next: text(row[3]),
      after: text(row[4]),
    });

    const meta = (row) => ({
      kind: text(row[1]),
      key: text(row[2]),
      value: number(row[3], null),
    });

    const battleLine = (line) => {
      if (Array.isArray(line)) {
        const kind = text(line[0]);
        if (kind === "j") {
          return { kind: "jump", target: text(line[2]), text: "", speaker: "", mode: 0,
            key: "", scene: "" };
        }
        if (kind === "a") {
          return { kind: "action", target: "", speaker: "", mode: 0, key: "", scene: "",
            text: text(line[1]) };
        }
        const mode = kind === "t" ? 2 : kind === "n" ? 1 : 0;
        return { kind: "say", speaker: text(line[1]), mode, target: "", key: "", scene: "",
          text: text(line[2]) };
      }
      const row = record(line) || {};
      return {
        kind: text(row.kind),
        speaker: text(row.speaker),
        mode: number(row.mode, 0),
        target: text(row.target),
        key: text(row.key),
        scene: text(row.scene),
        text: text(row.text),
      };
    };

    const battlePart = (value) => {
      const item = record(value) || {};
      return { text: text(item.text), kind: text(item.kind), key: text(item.key) };
    };

    const battleWhen = (value) => {
      if (typeof value === "string") {
        return { logic: "", parts: [{ text: value, kind: "", key: "" }] };
      }
      const row = record(value) || {};
      if (Array.isArray(row.parts)) {
        return { logic: text(row.logic), parts: list(row.parts).map(battlePart) };
      }
      const parts = [];
      if (row.text) parts.push({ text: text(row.text), kind: "", key: "" });
      list(row.chips).forEach((chip) => parts.push(battlePart(chip)));
      return { logic: "", parts };
    };

    const battle = (row) => {
      const info = record(row[4]) || {};
      const facts = info.facts !== undefined
        ? list(info.facts).map(text)
        : list(info.chips).map(text);
      return {
        name: text(row[1]),
        key: text(row[2]),
        next: text(row[3]),
        after: text(row[5]),
        kind: text(info.kind),
        title: text(info.title),
        speaker: text(info.speaker),
        note: text(info.note),
        goals: list(info.goals).map(text),
        facts,
        rows: list(info.rows).map((item) => {
          const row = record(item) || {};
          return { label: text(row.label), value: text(row.value) };
        }),
        events: list(info.events).map((event) => {
          const item = record(event) || {};
          return {
            when: battleWhen(item.when),
            lines: list(item.lines).map(battleLine),
          };
        }),
      };
    };

    const lore = (row) => text(row[1]);

    const walk = (rows, visit) => {
      for (const row of list(rows)) {
        if (!Array.isArray(row) || !row.length) continue;
        visit(row);
        if (is(row, "choice")) {
          for (const item of choice(row)) walk(item.beats, visit);
        } else if (is(row, "branch")) {
          walk(branch(row).beats, visit);
        }
      }
    };

    const stripRich = (value) => (value ? String(value).replace(RICH_TAG, "") : "");

    const textOf = (rows) => {
      const parts = [];
      walk(rows, (row) => {
        if (is(row, "say")) parts.push(stripRich(say(row).text));
        else if (is(row, "choice")) {
          for (const item of choice(row)) parts.push(stripRich(item.text));
        } else if (is(row, "lore")) parts.push(stripRich(lore(row)));
        else if (is(row, "battle")) {
          for (const event of battle(row).events) {
            for (const line of event.lines) {
              if (line.kind !== "say" && line.kind !== "status" && line.kind !== "support") continue;
              if (line.text) parts.push(stripRich(line.text));
            }
          }
        }
      });
      return parts.join("\n");
    };

    const firstSay = (rows) => {
      let hit = null;
      walk(rows, (row) => {
        if (hit || !is(row, "say")) return;
        const said = say(row);
        hit = { speaker: said.speaker, text: stripRich(said.text) };
      });
      return hit;
    };

    return {
      TAGS,
      battle,
      branch,
      choice,
      firstSay,
      is,
      jump,
      lore,
      meta,
      say,
      scene,
      stripRich,
      textOf,
      walk,
    };
  });
})();
