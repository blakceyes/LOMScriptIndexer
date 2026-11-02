(() => {
  "use strict";

  const SR = window.SR;

  const RICH_BASE = 40;
  const RICH_MIN = 0.72;
  const RICH_MAX = 1.9;
  const RICH_TAG = /\{([^{}]*)\}/g;
  const SAY_CLASS = ["", "narration", "think"];
  const PREVIEW_LINES = 6;
  const PREVIEW_CHARS = 220;
  const PREVIEW_BRANCH_LINES = 3;
  const PREVIEW_TOTAL_LINES = 6;

  SR.define("beats",
    ["beat", "graph", "store", "i18n", "ui", "text", "condexpr", "condtext", "checkpoints", "names"],
    ({ beat, graph, store, i18n, ui, text, condexpr, condtext, checkpoints, names }) => {
      const clampScale = (value) => {
        if (!Number.isFinite(value) || value <= 0) return 1;
        return ui.clamp(value, RICH_MIN, RICH_MAX);
      };

      const appendSegment = (parent, chunk, stack) => {
        if (!chunk) return;
        const scale = stack.length ? stack[stack.length - 1] : 1;
        if (scale === 1) {
          parent.appendChild(document.createTextNode(chunk));
          return;
        }
        const span = document.createElement("span");
        span.style.fontSize = `${scale.toFixed(2)}em`;
        span.textContent = chunk;
        parent.appendChild(span);
      };

      const appendRich = (parent, text) => {
        if (!text) return parent;
        const stack = [];
        let last = 0;
        let match;
        RICH_TAG.lastIndex = 0;
        while ((match = RICH_TAG.exec(text)) !== null) {
          if (match.index > last) appendSegment(parent, text.slice(last, match.index), stack);
          const tag = (match[1] || "").trim();
          const lower = tag.toLowerCase();
          if (lower.indexOf("/size") === 0 || lower === "size") {
            stack.pop();
          } else if (lower.indexOf("size") === 0 && tag.indexOf("=") > 0) {
            const value = parseFloat(tag.slice(tag.indexOf("=") + 1));
            stack.push(Number.isFinite(value) ? clampScale(value / RICH_BASE) : (stack[stack.length - 1] || 1));
          }
          last = RICH_TAG.lastIndex;
        }
        if (last < text.length) appendSegment(parent, text.slice(last), stack);
        return parent;
      };

      const speakerName = (id) => {
        if (!id) return "";
        const name = names.speaker(id);
        const title = names.title(id);
        return title ? i18n.t("nameWithTitle", { name, title }) : name;
      };

      const entryLabel = (node) => {
        if (!node || !node.entry) return "";
        return i18n.t(`entry.${node.entry}`, { defaultValue: "" });
      };

      const entryBadge = (node) => {
        const label = entryLabel(node);
        if (!label) return null;
        const badge = ui.el("span",
          `entry-badge badge${node.entry === "combat" ? " badge-danger" : ""} is-${node.entry}`,
          label);
        badge.title = i18n.t("entrySourceTitle", { name: label });
        return badge;
      };

      const loreBlock = (value) => {
        const box = ui.el("div", "lore");
        const body = ui.el("div", "lore-text");
        String(value || "").split(/\n+/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed) body.appendChild(ui.el("p", "lore-p", trimmed));
        });
        box.appendChild(body);
        return box;
      };

      const upgradeBranchCond = (cond, data, ctx) => {
        if (!data.check || !data.check.key) return;
        const kind = data.check.kind;
        const key = data.check.key;
        checkpoints.ensure(key).then(() => {
          if (!cond.isConnected) return;
          const expr = condexpr.pick(data.check);
          if (expr) {
            cond.classList.add("is-expr");
            cond.replaceChildren(condexpr.render(expr, {
              openLookup: ctx.lookup ? ctx.lookup.open : null,
              method: kind,
            }));
            cond.title = condexpr.label(expr);
            return;
          }
          const missed = condexpr.fallback(data.check);
          if (!missed) return;
          cond.classList.add("is-expr", "is-fallback");
          cond.replaceChildren(ui.el("span", "cx-fallback", i18n.t("lookupCondFallback")));
          const excluded = missed.excluded.map(condexpr.label).filter(Boolean);
          const hint = [cond.title, i18n.t("cxFallbackHint", { n: missed.n })];
          if (excluded.length) hint.push(excluded.join(i18n.t("listJoin")));
          cond.title = hint.join("\n");
        });
      };

      const renderChoice = (row, ctx) => {
        const box = ui.el("div", "choice");
        beat.choice(row).forEach((option, index) => {
          const wrapper = ui.el("div", "option");
          const button = ui.el("button", "option-head row");
          button.type = "button";
          ui.setExpanded(button, false);
          button.appendChild(ui.el("span", "option-idx", String(index + 1)));

          const main = ui.el("span", "option-main");
          const textEl = ui.el("span", "option-text");
          appendRich(textEl, condtext.optionHead(option.text, option.detail));
          main.appendChild(textEl);

          const condText = condtext.optionCond(option.cond);
          const needText = condtext.needText(option.detail);
          if (option.lock || condText || needText) {
            const badges = ui.el("span", "option-badges");
            if (option.lock) {
              badges.appendChild(ui.el("span", "option-cond is-danger", `🔒 ${option.lock}`));
            }
            if (condText) badges.appendChild(ui.el("span", "option-cond", condText));
            if (needText) badges.appendChild(ui.el("span", "badge", needText));
            main.appendChild(badges);
          }
          button.appendChild(main);

          const body = ui.el("div", "option-body");
          body.appendChild(renderBeats(option.beats, ctx));
          button.addEventListener("click", () => {
            const open = wrapper.classList.toggle("is-open");
            ui.setExpanded(button, open);
          });
          wrapper.appendChild(button);
          wrapper.appendChild(body);
          box.appendChild(wrapper);
        });
        return box;
      };

      const branchLabel = (data) => {
        const fromCond = condtext.cond(data.cond);
        return fromCond || data.text || "";
      };

      const renderBranch = (row, ctx) => {
        const data = beat.branch(row);
        const box = ui.el("div", "branch");
        const body = ui.el("div", "branch-body");
        body.appendChild(renderBeats(data.beats, ctx));
        const empty = !body.childNodes.length;
        if (empty) box.classList.add("is-empty");

        const label = branchLabel(data);
        const head = ui.el("div", empty ? "branch-head" : "branch-head row row-sm");
        const cond = ui.el("span", "cond", label);
        if (label) cond.title = label;
        head.appendChild(cond);
        upgradeBranchCond(cond, data, empty ? { lookup: null } : ctx);

        if (empty) {
          const hint = i18n.t("previewEmpty");
          const tag = ui.el("span", "branch-empty", i18n.t("branchEmpty"));
          tag.title = hint;
          tag.setAttribute("aria-label", hint);
          head.appendChild(tag);
          box.appendChild(head);
          return box;
        }

        head.setAttribute("role", "button");
        head.tabIndex = 0;
        ui.setExpanded(head, false);

        const target = data.check ? { kind: "check", key: data.check.key } : null;
        if (target && ctx.lookup) {
          const lookupBtn = ui.el("button", "cond-lookup btn btn-icon");
          lookupBtn.type = "button";
          lookupBtn.title = i18n.t("condLookup");
          lookupBtn.setAttribute("aria-label", i18n.t("condLookup"));
          lookupBtn.appendChild(ui.svg("i-search"));
          lookupBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            ctx.lookup.open(target.kind, target.key, lookupBtn, data.check.kind);
          });
          head.appendChild(lookupBtn);
        }

        const toggle = () => {
          const open = box.classList.toggle("is-open");
          ui.setExpanded(head, open);
          if (ctx.preview) ctx.preview.hide();
        };
        head.addEventListener("click", toggle);
        head.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        });
        if (ctx.preview) {
          ctx.preview.bind(head, box, () => ({ title: label, beats: data.beats }));
        }

        box.appendChild(head);
        box.appendChild(body);
        return box;
      };

      const renderScene = (row, ctx) => {
        const data = beat.scene(row);
        const line = ui.el("div", "scene-switch");
        line.appendChild(ui.el("span", "scene-label", i18n.t("sceneSwitch")));
        if (data.name) line.appendChild(ui.el("span", "scene-name", data.name));
        if (data.key) line.appendChild(ui.el("span", "scene-key", data.key));
        if (data.next && !data.after) {
          line.appendChild(ui.svg("i-arrow-right", "scene-arrow"));
          line.appendChild(ui.el("span", "scene-next", data.next));
        }
        if (data.after) {
          line.appendChild(ui.el("span", "scene-label", i18n.t("battleAfterStory")));
          line.appendChild(renderJump(["j", data.after, ""], ctx));
        }
        return line;
      };

      const battleSay = (line, ctx) => {
        const mode = line.mode === 2 ? "think" : line.mode === 1 ? "narration" : "dialog";
        const wrap = ui.el("div", `say${mode === "dialog" ? "" : ` ${mode}`}`);
        if (mode !== "narration" && line.speaker) {
          const who = ui.el("span", "who is-link", speakerName(line.speaker));
          who.title = i18n.t("lookupSpeaker");
          who.addEventListener("click", (event) => {
            event.stopPropagation();
            if (ctx.lookup) ctx.lookup.open("speaker", line.speaker, who);
          });
          wrap.appendChild(who);
        }
        const what = ui.el("div", "what");
        appendRich(what, line.text);
        wrap.appendChild(what);
        return wrap;
      };

      const battleChip = (line, ctx) => {
        const linkable = !!line.key
          && (line.kind === "flag" || line.kind === "stat" || line.kind === "rel");
        const chip = ui.el(linkable ? "button" : "span", "btn btn-sm meta-action", line.text);
        if (!linkable) return chip;
        chip.type = "button";
        chip.addEventListener("click", (event) => {
          event.stopPropagation();
          if (ctx.lookup) ctx.lookup.open(line.kind, line.key, chip);
        });
        return chip;
      };

      const battleScene = (line) => {
        const row = ui.el("div", "scene-switch");
        row.appendChild(ui.el("span", "scene-label", i18n.t("sceneSwitch")));
        if (line.scene) {
          row.appendChild(ui.svg("i-arrow-right", "scene-arrow"));
          row.appendChild(ui.el("span", "scene-next", line.scene));
        }
        return row;
      };

      const battleAfter = (line, ctx) => {
        const row = ui.el("div", "scene-switch");
        row.appendChild(ui.el("span", "scene-label", i18n.t("battleAfterStory")));
        row.appendChild(renderJump(["j", line.target, ""], ctx));
        return row;
      };

      const battleLines = (lines, ctx, body) => {
        let chips = null;
        const flush = () => {
          if (chips && chips.childNodes.length) body.appendChild(chips);
          chips = null;
        };
        lines.forEach((line) => {
          if (line.kind === "say") {
            flush();
            body.appendChild(battleSay(line, ctx));
            return;
          }
          if (line.kind === "jump") {
            flush();
            body.appendChild(renderJump(["j", line.target, ""], ctx));
            return;
          }
          if (line.kind === "scene") {
            flush();
            body.appendChild(battleScene(line));
            return;
          }
          if (line.kind === "after") {
            flush();
            body.appendChild(battleAfter(line, ctx));
            return;
          }
          if (!chips) chips = ui.el("div", "meta-chips");
          chips.appendChild(battleChip(line, ctx));
        });
        flush();
      };

      const battleLogic = (logic) => (
        logic === "or" ? i18n.t("cxOr") : i18n.t("cxAnd")
      );

      const battleWhen = (when, ctx) => {
        const row = ui.el("div", "meta-chips battle-when");
        when.parts.forEach((part, index) => {
          if (index && when.logic) {
            row.appendChild(ui.el("span", "option-cond battle-logic", battleLogic(when.logic)));
          }
          const linkable = !!part.key
            && (part.kind === "flag" || part.kind === "stat" || part.kind === "rel");
          const chip = ui.el(linkable ? "button" : "span",
            linkable ? "btn btn-sm meta-action" : "chip-stat chip chip-sm",
            part.text);
          if (linkable) {
            chip.type = "button";
            chip.addEventListener("click", (event) => {
              event.stopPropagation();
              if (ctx.lookup) ctx.lookup.open(part.kind, part.key, chip);
            });
          }
          row.appendChild(chip);
        });
        return row;
      };

      const battleEvent = (event, ctx) => {
        const section = ui.el("div", "battle-event");
        section.appendChild(battleWhen(event.when, ctx));
        const lines = ui.el("div", "battle-lines");
        battleLines(event.lines, ctx, lines);
        if (lines.childNodes.length) section.appendChild(lines);
        return section;
      };

      const battleHeadLine = () => ui.el("div", "battle-head-line");

      const renderBattle = (row, ctx) => {
        const data = beat.battle(row);
        const card = ui.el("div", "battle");
        const head = ui.el("div",
          data.events.length ? "branch-head battle-head row row-sm" : "battle-head");
        const main = ui.el("div", "battle-head-main");
        const first = battleHeadLine();
        const kindChip = ui.el("span", "cx-var");
        kindChip.appendChild(ui.el("span", "cx-type",
          i18n.t(data.kind === "combat" ? "battleDuel" : "battleCampaign")));
        if (data.note) kindChip.appendChild(ui.el("span", "cx-name", data.note));
        first.appendChild(kindChip);
        main.appendChild(first);

        if (data.goals.length) {
          const goals = battleHeadLine();
          data.goals.forEach((goal) => {
            const chip = ui.el("span", "cx-var");
            chip.appendChild(ui.el("span", "cx-type", i18n.t("battleGoalType")));
            chip.appendChild(ui.el("span", "cx-name", goal));
            goals.appendChild(chip);
          });
          main.appendChild(goals);
        }

        const third = battleHeadLine();
        if (data.title) {
          const chip = ui.el("span", "cx-var");
          chip.appendChild(ui.el("span", "cx-type", i18n.t("battleOpponentType")));
          chip.appendChild(ui.el("span", "cx-name", data.title));
          if (data.speaker) {
            chip.classList.add("is-link");
            chip.setAttribute("role", "button");
            chip.tabIndex = 0;
            chip.title = i18n.t("lookupSpeaker");
            const open = (event) => {
              event.stopPropagation();
              event.preventDefault();
              if (ctx.lookup) ctx.lookup.open("speaker", data.speaker, chip);
            };
            chip.addEventListener("click", open);
            chip.addEventListener("keydown", (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              open(event);
            });
          }
          third.appendChild(chip);
        }
        data.facts.forEach((fact) => third.appendChild(ui.el("span", "battle-fact", fact)));
        if (third.childNodes.length) main.appendChild(third);
        head.appendChild(main);
        card.appendChild(head);

        if (data.events.length) {
          const body = ui.el("div", "battle-body");
          data.events.forEach((event) => body.appendChild(battleEvent(event, ctx)));
          card.appendChild(body);
          ui.setExpanded(head, false);
          head.setAttribute("role", "button");
          head.tabIndex = 0;
          const toggle = () => {
            const open = card.classList.toggle("is-open");
            ui.setExpanded(head, open);
          };
          head.addEventListener("click", (event) => {
            if (event.target && event.target.closest && event.target.closest("button")) return;
            toggle();
          });
          head.addEventListener("keydown", (event) => {
            if (event.target !== head) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggle();
            }
          });
        }

        if (data.after) {
          const foot = ui.el("div", "scene-switch");
          foot.appendChild(ui.el("span", "scene-label", i18n.t("battleAfterStory")));
          foot.appendChild(renderJump(["j", data.after, ""], ctx));
          card.appendChild(foot);
        }
        if (!data.after && data.next) {
          const foot = ui.el("div", "scene-switch");
          foot.appendChild(ui.el("span", "scene-label", i18n.t("battleAfter")));
          foot.appendChild(ui.svg("i-arrow-right", "scene-arrow"));
          foot.appendChild(ui.el("span", "scene-next", data.next));
          card.appendChild(foot);
        }
        return card;
      };

      const renderJump = (row, ctx) => {
        const data = beat.jump(row);
        if (!data.target) {
          return ui.el("span", "jump dynamic", `▷ ${data.label || i18n.t("jumpDynamic")}`);
        }
        if (!graph.nodeById.has(data.target)) {
          const suffix = i18n.t("wrap", { text: i18n.t("jumpMissing") });
          return ui.el("span", "jump dynamic", `▷ ${data.target}${suffix}`);
        }
        const button = ui.el("button", "jump btn btn-sm");
        button.type = "button";
        button.appendChild(ui.svg("i-arrow-right", "arrow"));
        button.appendChild(document.createTextNode(data.target));
        if (data.label) button.appendChild(ui.el("span", "option-cond", `  ${data.label}`));
        button.addEventListener("click", () => {
          if (ctx.navigate) ctx.navigate(data.target);
        });
        return button;
      };

      const renderBeats = (input, context) => {
        const rows = Array.isArray(input) ? input : [];
        const ctx = context || {};
        const frag = document.createDocumentFragment();
        let metaBuffer = [];
        let branchBuffer = [];
        let branchGroup = null;
        let diceButtons = [];

        const flushMeta = () => {
          if (!metaBuffer.length) return;
          const group = ui.el("div", "meta-group");
          const chips = ui.el("div", "meta-chips");
          metaBuffer.forEach((meta) => {
            const value = condtext.meta(meta.kind, meta.key, meta.value);
            if (!value) return;
            const target = meta.kind === "dice"
              ? (meta.key ? { kind: "check", key: meta.key } : null)
              : condtext.metaTarget(meta.kind, meta.key);
            const chip = ui.el(target ? "button" : "span",
              target ? "btn btn-sm meta-action" : "chip-stat chip chip-sm", value);
            if (target) {
              chip.type = "button";
              chip.setAttribute("aria-haspopup", "dialog");
            }
            if (value.length > 24) chip.title = value;
            if (target && ctx.lookup) {
              const open = (event) => {
                event.stopPropagation();
                ctx.lookup.open(target.kind, target.key, chip, meta.kind);
              };
              chip.addEventListener("click", open);
            }
            if (target && meta.kind === "dice") diceButtons.push(chip);
            else chips.appendChild(chip);
          });
          metaBuffer = [];
          if (!chips.childNodes.length) return;
          group.appendChild(chips);
          frag.appendChild(group);
        };

        const flushDice = () => {
          if (!diceButtons.length) return;
          const group = ui.el("div", "meta-group is-dice");
          const chips = ui.el("div", "meta-chips");
          diceButtons.forEach((chip) => chips.appendChild(chip));
          diceButtons = [];
          group.appendChild(chips);
          frag.appendChild(group);
        };

        const flushBranches = () => {
          if (!branchBuffer.length) return;
          const boxes = branchBuffer;
          branchBuffer = [];
          branchGroup = null;
          flushDice();
          const filled = boxes.filter((box) => !box.classList.contains("is-empty"));
          if (!filled.length) return;
          const group = ui.el("div", "branch-group");
          filled.forEach((box) => group.appendChild(box));
          frag.appendChild(group);
        };

        for (const row of rows) {
          if (!Array.isArray(row) || !row.length) continue;

          if (beat.is(row, "branch")) {
            flushMeta();
            const group = beat.branch(row).group;
            if (branchBuffer.length && group !== branchGroup) flushBranches();
            branchGroup = group;
            branchBuffer.push(renderBranch(row, ctx));
            continue;
          }

          flushBranches();

          if (beat.is(row, "meta")) {
            metaBuffer.push(beat.meta(row));
            continue;
          }
          flushMeta();

          if (beat.is(row, "choice")) {
            const choice = renderChoice(row, ctx);
            if (diceButtons.length) {
              const dice = document.createDocumentFragment();
              diceButtons.forEach((chip) => dice.appendChild(chip));
              diceButtons = [];
              choice.insertBefore(dice, choice.firstChild);
            }
            frag.appendChild(choice);
            continue;
          }
          flushDice();

          if (beat.is(row, "lore")) {
            frag.appendChild(loreBlock(beat.stripRich(beat.lore(row))));
            continue;
          }

          if (beat.is(row, "battle")) {
            frag.appendChild(renderBattle(row, ctx));
            continue;
          }

          if (beat.is(row, "scene")) {
            frag.appendChild(renderScene(row, ctx));
            continue;
          }

          if (beat.is(row, "say")) {
            const data = beat.say(row);
            const wrap = ui.el("div", `say${data.mode !== "dialog" ? ` ${SAY_CLASS[data.mode === "think" ? 2 : 1]}` : ""}`);
            if (data.speaker) {
              const who = ui.el("span", "who", speakerName(data.speaker));
              who.classList.add("is-link");
              who.title = i18n.t("lookupSpeaker");
              who.addEventListener("click", (event) => {
                event.stopPropagation();
                if (ctx.lookup) ctx.lookup.open("speaker", data.speaker, who);
              });
              wrap.appendChild(who);
            }
            const what = ui.el("div", "what");
            appendRich(what, data.text);
            wrap.appendChild(what);
            frag.appendChild(wrap);
          } else if (beat.is(row, "jump")) {
            frag.appendChild(renderJump(row, ctx));
          }
        }
        flushMeta();
        flushBranches();
        flushDice();
        return frag;
      };

      const beatsPreview = (rows, budget) => {
        const limits = budget || { lines: PREVIEW_LINES, chars: PREVIEW_CHARS };
        const out = { lines: [], more: 0 };
        let used = 0;
        let stop = false;

        const push = (kind, value, who) => {
          const clean = beat.stripRich(String(value == null ? "" : value)).replace(/\s+/g, " ").trim();
          if (!clean) return;
          if (stop || out.lines.length >= limits.lines || used + clean.length > limits.chars) {
            out.more++;
            if (out.lines.length >= limits.lines) stop = true;
            return;
          }
          out.lines.push({ kind, text: clean, who: who || "" });
          used += clean.length;
        };

        const walk = (list) => {
          for (const row of list || []) {
            if (!Array.isArray(row)) continue;
            if (beat.is(row, "say")) {
              const data = beat.say(row);
              push(data.mode === "narration" ? "narration" : data.mode === "think" ? "think" : "say",
                data.text, data.mode === "dialog" && data.speaker ? speakerName(data.speaker) : "");
            } else if (beat.is(row, "meta")) {
              const data = beat.meta(row);
              push("meta", condtext.meta(data.kind, data.key, data.value));
            } else if (beat.is(row, "jump")) {
              push("jump", `→ ${beat.jump(row).target || ""}`);
            } else if (beat.is(row, "battle")) {
              const data = beat.battle(row);
              const label = i18n.t(data.kind === "combat" ? "battleDuel" : "battleCampaign");
              const detail = data.note || data.title || "";
              push("jump", `${label} ${detail}`.trim());
            } else if (beat.is(row, "scene")) {
              const data = beat.scene(row);
              push("jump", `↩ ${data.name}${data.next ? ` → ${data.next}` : ""}`);
            } else if (beat.is(row, "choice")) {
              const options = beat.choice(row);
              const first = options[0] && options[0].text
                ? i18n.t("colonPrefix", { text: options[0].text }) : "";
              push("choice", i18n.t("previewChoice", { n: options.length }) + first);
            } else if (beat.is(row, "branch")) {
              walk(beat.branch(row).beats);
            }
          }
        };

        walk(rows);
        return out;
      };

      const previewOfBranches = (list) => {
        let lines = [];
        let hidden = 0;
        (list || []).slice(0, PREVIEW_BRANCH_LINES).forEach((row) => {
          const data = beat.branch(row);
          const label = branchLabel(data).trim();
          if (label) lines.push({ kind: "cond", text: label });
          const sub = beatsPreview(data.beats, { lines: 1, chars: 60 });
          sub.lines.forEach((line) => lines.push(line));
        });
        if ((list || []).length > PREVIEW_BRANCH_LINES) hidden = list.length - PREVIEW_BRANCH_LINES;
        if (lines.length > PREVIEW_TOTAL_LINES) {
          hidden += lines.length - PREVIEW_TOTAL_LINES;
          lines = lines.slice(0, PREVIEW_TOTAL_LINES);
        }
        return { lines, more: hidden };
      };

      const firstLineOf = (node) => {
        if (!node) return "";
        const rows = text.story(store.textLang(), node.id);
        if (!rows) return "";
        const first = beat.firstSay(rows);
        if (!first) return "";
        if (!first.speaker) return first.text;
        return i18n.t("lineSpeaker", { name: speakerName(first.speaker), text: first.text });
      };

      return {
        beatsPreview,
        entryBadge,
        firstLineOf,
        previewOfBranches,
        renderBeats,
        speakerName,
      };
    });
})();
