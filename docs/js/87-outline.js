(() => {
  "use strict";

  const SR = window.SR;

  const MAX_DEPTH = 6;

  const clip = (value, limit) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit)}…` : text;
  };

  SR.define("outline",
    ["store", "graph", "i18n", "text", "beat", "beats", "condtext", "overlay", "ui", "reader"],
    ({ store, graph, i18n, text, beat, beats, condtext, overlay, ui, reader }) => {
      const $ = ui.$;

      let openFlag = false;
      let lastFocus = null;
      let loadToken = 0;

      const hasContent = (rows) => {
        for (const row of rows || []) {
          if (!Array.isArray(row) || !row.length) continue;
          if (beat.is(row, "say")) return true;
          if (beat.is(row, "choice")) {
            if (beat.choice(row).length) return true;
            continue;
          }
          if (beat.is(row, "branch")) {
            if (hasContent(beat.branch(row).beats)) return true;
            continue;
          }
          if (beat.is(row, "jump")) {
            const data = beat.jump(row);
            if (data.target || data.label) return true;
            continue;
          }
          if (beat.is(row, "scene")) return true;
          if (beat.is(row, "lore")) {
            if (beat.stripRich(beat.lore(row)).trim()) return true;
          }
        }
        return false;
      };

      const sayLabel = (data) => {
        if (data.mode === "narration") return i18n.t("outlineNarration");
        if (data.mode === "think") return i18n.t("outlineThink");
        return data.speaker ? beats.speakerName(data.speaker) : i18n.t("outlineDialog");
      };

      const sayWho = (data) => {
        if (data.mode === "narration") return "narration";
        if (data.mode === "think") return "think";
        return `dialog:${data.speaker}`;
      };

      const build = (rows) => {
        const items = [];
        const stats = { say: 0, choice: 0, branch: 0 };

        const walk = (list, prefix, depth) => {
          let run = null;

          const flush = () => {
            if (!run) return;
            run.meta = i18n.t("outlineLines", { n: run.count });
            items.push(run);
            run = null;
          };

          for (let index = 0; index < list.length; index++) {
            const row = list[index];
            if (!Array.isArray(row) || !row.length) continue;
            if (beat.is(row, "meta")) continue;
            const key = beats.pathKey(prefix, index);

            if (beat.is(row, "say")) {
              const data = beat.say(row);
              stats.say++;
              const who = sayWho(data);
              if (run && run.who === who) {
                run.count++;
                continue;
              }
              flush();
              run = {
                key,
                kind: data.mode === "narration" ? "narration" : data.mode === "think" ? "think" : "dialog",
                depth,
                who,
                label: sayLabel(data),
                note: clip(beat.stripRich(data.text), 120),
                meta: "",
                count: 1,
              };
              continue;
            }

            flush();

            if (beat.is(row, "choice")) {
              const options = beat.choice(row);
              if (!options.length) continue;
              stats.choice++;
              items.push({
                key,
                kind: "choice",
                depth,
                label: i18n.t("outlineChoice", { n: options.length }),
                note: clip(beat.stripRich(condtext.optionHead(options[0].text, options[0].detail)), 80),
                meta: "",
              });
              options.forEach((option, optionIndex) => {
                const optionPath = beats.optionKey(key, optionIndex);
                const parts = [];
                if (option.lock) parts.push(`🔒 ${option.lock}`);
                const cond = condtext.optionCond(option.cond);
                if (cond) parts.push(cond);
                const need = condtext.needText(option.detail);
                if (need) parts.push(need);
                items.push({
                  key: optionPath,
                  kind: "option",
                  depth: depth + 1,
                  label: clip(beat.stripRich(condtext.optionHead(option.text, option.detail)), 80),
                  note: clip(parts.join(" · "), 100),
                  meta: `#${optionIndex + 1}`,
                });
                if (option.beats.length) walk(option.beats, optionPath, depth + 2);
              });
              continue;
            }

            if (beat.is(row, "branch")) {
              const data = beat.branch(row);
              if (!hasContent(data.beats)) continue;
              stats.branch++;
              items.push({
                key,
                kind: "branch",
                depth,
                label: i18n.t("outlineBranch"),
                note: clip(beats.branchLabel(data), 120),
                meta: "",
              });
              walk(data.beats, beats.branchKey(key), depth + 1);
              continue;
            }

            if (beat.is(row, "jump")) {
              const data = beat.jump(row);
              if (!data.target && !data.label) continue;
              items.push({
                key,
                kind: "jump",
                depth,
                label: data.target || i18n.t("jumpDynamic"),
                note: clip(data.label, 80),
                meta: i18n.t("outlineJump"),
              });
              continue;
            }

            if (beat.is(row, "scene")) {
              const data = beat.scene(row);
              const note = [data.key, data.next ? `→ ${data.next}` : ""].filter(Boolean).join(" · ");
              items.push({
                key,
                kind: "scene",
                depth,
                label: data.name || i18n.t("sceneSwitch"),
                note,
                meta: i18n.t("outlineScene"),
              });
              continue;
            }

            if (beat.is(row, "lore")) {
              const value = clip(beat.stripRich(beat.lore(row)), 160);
              if (!value) continue;
              items.push({
                key,
                kind: "lore",
                depth,
                label: i18n.t("outlineLore"),
                note: value,
                meta: "",
              });
            }
          }

          flush();
        };

        walk(rows, "", 0);
        return { items, stats };
      };

      const syncButton = () => {
        const button = $("outlineBtn");
        if (button) button.disabled = !store.selected();
      };

      const showState = (key, loading) => {
        const body = $("outlineBody");
        const summary = $("outlineSummary");
        if (summary) {
          summary.hidden = true;
          summary.replaceChildren();
        }
        if (!body) return;
        body.replaceChildren(ui.el("p", `outline-state${loading ? " is-loading" : ""}`, i18n.t(key)));
      };

      const statOf = (key, value) => {
        const span = ui.el("span", "outline-stat");
        span.appendChild(ui.el("b", null, ui.formatNumber(value)));
        span.appendChild(document.createTextNode(` ${i18n.t(key)}`));
        return span;
      };

      const writeSummary = (node, stats) => {
        const box = $("outlineSummary");
        if (!box) return;
        box.replaceChildren();
        box.appendChild(ui.el("span", "outline-stat", i18n.chapterTitle(graph.chapterOf(node))));
        if (typeof node.time === "number") {
          box.appendChild(ui.el("span", "outline-stat", i18n.timeText(node.time)));
        }
        if (stats.say) box.appendChild(statOf("outlineStatSay", stats.say));
        if (stats.choice) box.appendChild(statOf("outlineStatChoice", stats.choice));
        if (stats.branch) box.appendChild(statOf("outlineStatBranch", stats.branch));
        box.hidden = false;
      };

      const rowOf = (item) => {
        const row = ui.el("button", `outline-row is-${item.kind}`);
        row.type = "button";
        row.dataset.key = item.key;
        row.style.setProperty("--ol-depth", String(Math.min(item.depth, MAX_DEPTH)));
        const main = ui.el("span", "ol-main");
        const line = ui.el("span", "ol-line");
        const label = ui.el("span", "ol-label", item.label);
        line.appendChild(label);
        if (item.note) {
          const note = ui.el("span", "ol-note", item.note);
          line.appendChild(note);
          row.title = `${item.label} · ${item.note}`;
        } else {
          row.title = item.label;
        }
        main.appendChild(line);
        row.appendChild(main);
        if (item.meta) row.appendChild(ui.el("span", "ol-meta", item.meta));
        row.addEventListener("click", () => {
          close();
          reader.locateBeat(item.key);
        });
        return row;
      };

      const ensure = (id) => {
        const token = ++loadToken;
        text.ensureStory(store.textLang(), id).then(() => {
          if (!openFlag || token !== loadToken) return;
          const node = store.selected();
          if (!node || node.id !== id) return;
          if (text.story(store.textLang(), node.id) === null) {
            showState("outlineEmpty");
            return;
          }
          render();
        });
      };

      const render = () => {
        const node = store.selected();
        const body = $("outlineBody");
        const sub = $("outlineSub");
        syncButton();
        if (!node || !body) return;
        if (sub) {
          sub.textContent = node.id;
          sub.title = node.id;
        }
        const rows = text.story(store.textLang(), node.id);
        if (rows === null && text.shardState(store.textLang(), node.id) !== "ready") {
          showState("outlineLoading", true);
          ensure(node.id);
          return;
        }
        if (!rows || !rows.length) {
          showState("outlineEmpty");
          return;
        }
        const model = build(rows);
        if (!model.items.length) {
          showState("outlineEmpty");
          return;
        }
        writeSummary(node, model.stats);
        const frag = document.createDocumentFragment();
        model.items.forEach((item) => frag.appendChild(rowOf(item)));
        body.replaceChildren(frag);
        body.scrollTop = 0;
      };

      const hideRaw = () => {
        loadToken++;
        const panel = $("outlinePanel");
        if (panel) {
          panel.hidden = true;
          panel.setAttribute("aria-hidden", "true");
        }
        const button = $("outlineBtn");
        if (button) {
          ui.setOn(button, false);
          ui.setExpanded(button, false);
        }
        openFlag = false;
      };

      const open = (trigger) => {
        const node = store.selected();
        const panel = $("outlinePanel");
        if (!node || !panel || openFlag) return;
        const button = $("outlineBtn");
        lastFocus = trigger || button;
        openFlag = true;
        render();
        overlay.open("outline", { trigger: lastFocus, autofocus: "outlineClose" });
        if (button) ui.setOn(button, true);
      };

      const close = () => {
        overlay.close("outline", { restoreFocus: true });
        if (!lastFocus || !lastFocus.isConnected) return;
        try {
          lastFocus.focus({ preventScroll: true });
        } catch {
          lastFocus = null;
        }
      };

      const toggle = () => {
        if (openFlag) close();
        else open($("outlineBtn"));
      };

      const refresh = () => {
        syncButton();
        if (openFlag) render();
      };

      const init = () => {
        const button = $("outlineBtn");
        if (button) button.addEventListener("click", toggle);
        const closeButton = $("outlineClose");
        if (closeButton) closeButton.addEventListener("click", close);
        overlay.register("outline", {
          id: "outlinePanel",
          triggerId: "outlineBtn",
          group: "modal",
          onHide: hideRaw,
          autofocus: "outlineClose",
        });
        store.subscribe(["selected"], () => {
          syncButton();
          if (openFlag) overlay.close("outline", { restoreFocus: false });
        });
        syncButton();
      };

      return {
        close,
        init,
        open,
        refresh,
        toggle,
      };
    });
})();
