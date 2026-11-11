import test from "node:test";
import assert from "node:assert/strict";
import { portraitVisibility, selectPortraitFile } from "../src/lib/portraitState.ts";
import type { ReaderBlock } from "../src/types/beats.ts";

const say = (
  speaker = "a",
  expression = "normal",
  revision = 1,
  changed = false,
  mode = "dialog",
): ReaderBlock => ({
  kind: "say",
  speaker,
  text: "line",
  mode,
  portrait: { character: speaker, expression, revision, changed },
});

test("deduplicates each character independently across speaker switches", () => {
  assert.deepEqual(
    portraitVisibility([
      say(),
      say(),
      say("b"),
      say(),
      say("a", "shy", 2),
      say("a", "shy", 2),
      say("a", "normal", 3),
    ]),
    [true, false, true, false, true, false, true],
  );
});

test("a revert between turns still displays the restored expression", () => {
  assert.deepEqual(portraitVisibility([say(), say("b"), say("a", "normal", 3, true)]), [
    true,
    true,
    true,
  ]);
});

test("revision survives a change and revert in filtered inner monologue", () => {
  const rows = [
    say(),
    say("a", "shy", 2, true, "think"),
    say("a", "normal", 3, true, "think"),
    say("a", "normal", 3),
  ];
  assert.deepEqual(
    portraitVisibility(rows.filter((row) => row.kind !== "say" || row.mode !== "think")),
    [true, true],
  );
});

test("a filtered first line cannot consume the first visible portrait", () => {
  assert.deepEqual(portraitVisibility([say("a", "normal", 1)]), [true]);
});

test("narration and legacy data never display portraits", () => {
  assert.deepEqual(
    portraitVisibility([
      say("a", "normal", 1, false, "narration"),
      { kind: "say", speaker: "a", text: "legacy", mode: "dialog" },
      say(),
    ]),
    [false, false, true],
  );
});

test("scene, branch and choice boundaries restart the context", () => {
  const scene: ReaderBlock = {
    kind: "scene",
    scene: { scene: "scene", sceneKey: "", nextScene: "", afterScript: "" },
  };
  const branches: ReaderBlock = { kind: "branches", branches: [] };
  const choice: ReaderBlock = { kind: "choice", options: [], diceChips: [] };
  assert.deepEqual(portraitVisibility([say(), scene, say(), branches, say(), choice, say()]), [
    true,
    false,
    true,
    false,
    true,
    false,
    true,
  ]);
});

test("independent branch fragments each display their first portrait", () => {
  assert.deepEqual(portraitVisibility([say(), say()]), [true, false]);
  assert.deepEqual(portraitVisibility([say(), say()]), [true, false]);
});

test("unknown expressions use a new fallback and preserve character identity", () => {
  assert.deepEqual(portraitVisibility([say(), say("a", "", 2), say("a", "", 2)]), [
    true,
    true,
    false,
  ]);
});

test("inner monologue shares state with dialogue for the same character", () => {
  assert.deepEqual(
    portraitVisibility([
      say(),
      say("a", "normal", 1, false, "think"),
      say("a", "shy", 2, true, "think"),
    ]),
    [true, false, true],
  );
});

const normalFile = "a".repeat(24) + ".webp";
const shyFile = "b".repeat(24) + ".webp";
const images = { a: { normal: normalFile, shy: shyFile } };

test("selects the exact expression, with an explicit default for absent NPC expressions", () => {
  assert.deepEqual(selectPortraitFile(images, "a", "shy"), { file: shyFile, fallback: false });
  assert.deepEqual(selectPortraitFile(images, "a", "shock"), { file: normalFile, fallback: true });
});

test("a failed image falls back once and never enters a retry loop", () => {
  assert.deepEqual(selectPortraitFile(images, "a", "shy", [shyFile]), {
    file: normalFile,
    fallback: true,
  });
  assert.equal(selectPortraitFile(images, "a", "shy", [shyFile, normalFile]), null);
});

test("unknown states and absent characters do not invent a default expression", () => {
  assert.equal(selectPortraitFile(images, "a", ""), null);
  assert.equal(selectPortraitFile(images, "missing", "shy"), null);
});

test("invalid image paths are not used", () => {
  assert.equal(selectPortraitFile({ a: { normal: "../wrong.webp" } }, "a", "normal"), null);
});
