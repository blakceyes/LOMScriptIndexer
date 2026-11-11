import base64
import json
import struct
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

from PIL import Image

from scriptindexer.build.script_render import Renderer
from scriptindexer.game.addressables import catalog_assets
from scriptindexer.game.layout import GameLayout
from scriptindexer.game.portraits import cached_manifest, fingerprint, thumbnail
from scriptindexer.game.lua_bindings import LUA_BINDINGS
from scriptindexer.interpreter import analyze
from scriptindexer.script_model import BranchBeat, ChoiceBeat, PortraitRef, SayBeat


def speaker(character="a", expression="normal"):
    portrait = f', characters.GetPortrait("{character}", "{expression}")' if expression is not None else ""
    return f'setcharacter(characters.Get("{character}"){portrait})\n'


def lines(source):
    return [beat for beat in analyze("test", source, LUA_BINDINGS).beats if isinstance(beat, SayBeat)]


class PortraitInterpreterTests(unittest.TestCase):
    def test_second_argument_and_repeated_expression(self):
        beats = lines(speaker() + 'say("one") say("two")' + speaker() + 'say("three")')
        self.assertEqual([b.portrait for b in beats], [PortraitRef("a", "normal")] * 3)
        self.assertEqual([b.portrait_changed for b in beats], [True, False, False])
        self.assertEqual([b.portrait_revision for b in beats], [1, 1, 1])

    def test_speaker_switch_keeps_independent_state(self):
        beats = lines(speaker() + 'say("one")' + speaker("b") + 'say("two")'
                      + speaker("a", None) + 'say("three")')
        self.assertEqual([b.speaker for b in beats], ["a", "b", "a"])
        self.assertFalse(beats[-1].portrait_changed)
        self.assertEqual(beats[-1].portrait, PortraitRef("a", "normal"))

    def test_stage_show_and_portrait_switch(self):
        source = '''stage.show{character=characters.Get("a"), portrait=characters.GetPortrait("a", "shy")}
setcharacter(characters.Get("a")) say("one")
stage.showPortrait(characters.Get("a"), characters.GetPortrait("a", "shock"))
say("two")'''
        self.assertEqual([b.portrait.expression for b in lines(source)], ["shy", "shock"])

    def test_loading_does_not_change_display_and_movement_preserves_it(self):
        beats = lines(speaker() + '''say("one")
characters.LoadCharacterPortrait("a", "shy")
stage.show{character=characters.Get("a"), toPosition="L1"}
say("two")''')
        self.assertEqual(beats[-1].portrait.expression, "normal")
        self.assertFalse(beats[-1].portrait_changed)

    def test_revert_between_turns_is_retained(self):
        source = speaker() + 'say("one")' + speaker("b") + 'say("two")' + '''
stage.showPortrait(characters.Get("a"), characters.GetPortrait("a", "shy"))
stage.showPortrait(characters.Get("a"), characters.GetPortrait("a", "normal"))
''' + speaker("a", None) + 'say("three")'
        beats = lines(source)
        self.assertEqual(beats[-1].portrait.expression, "normal")
        self.assertTrue(beats[-1].portrait_changed)
        self.assertGreater(beats[-1].portrait_revision, beats[0].portrait_revision)

    def test_branch_isolation_and_ambiguous_merge(self):
        source = speaker() + '''if flag then
stage.showPortrait(characters.Get("a"), characters.GetPortrait("a", "shy")) say("left")
else
say("right")
end
say("after")'''
        beats = analyze("test", source, LUA_BINDINGS).beats
        self.assertEqual(beats[0].beats[0].portrait.expression, "shy")
        self.assertEqual(beats[1].beats[0].portrait.expression, "normal")
        self.assertIsNone(beats[2].portrait)

    def test_implicit_else_is_included_in_merge(self):
        beats = lines(speaker() + '''if flag then
stage.showPortrait(characters.Get("a"), characters.GetPortrait("a", "shy"))
end
say("after")''')
        self.assertIsNone(beats[-1].portrait)

    def test_agreeing_branches_propagate(self):
        source = speaker() + '''if flag then
stage.showPortrait(characters.Get("a"), characters.GetPortrait("a", "shy"))
else
stage.showPortrait(characters.Get("a"), characters.GetPortrait("a", "shy"))
end
say("after")'''
        self.assertEqual(lines(source)[-1].portrait.expression, "shy")

    def test_choice_paths_are_isolated(self):
        source = speaker() + '''local selection = choose({"one", "two"})
if selection == 1 then
stage.showPortrait(characters.Get("a"), characters.GetPortrait("a", "shy")) say("left")
elseif selection == 2 then
say("right")
end
say("after")'''
        beats = analyze("test", source, LUA_BINDINGS).beats
        self.assertIsInstance(beats[0], ChoiceBeat)
        self.assertEqual(beats[0].options[0].beats[0].portrait.expression, "shy")
        self.assertEqual(beats[0].options[1].beats[0].portrait.expression, "normal")
        self.assertIsNone(beats[-1].portrait)

    def test_nested_table_mutation_cannot_pollute_other_branch(self):
        source = '''local p = {portrait=characters.GetPortrait("a", "normal")}
setcharacter(characters.Get("a"), p.portrait)
if flag then
p.portrait = characters.GetPortrait("a", "shy")
setcharacter(characters.Get("a"), p.portrait) say("left")
else
setcharacter(characters.Get("a"), p.portrait) say("right")
end'''
        branches = analyze("test", source, LUA_BINDINGS).beats
        self.assertEqual(branches[1].beats[0].portrait.expression, "normal")

    def test_do_scope_propagates_visual_state(self):
        beats = lines(speaker() + '''do
stage.showPortrait(characters.Get("a"), characters.GetPortrait("a", "shy"))
end
say("after")''')
        self.assertEqual(beats[-1].portrait.expression, "shy")

    def test_unknown_dynamic_expression_does_not_invent_normal(self):
        beat = lines('setcharacter(characters.Get("a"), characters.GetPortrait("a", unknown)) say("line")')[0]
        self.assertEqual(beat.portrait.expression, "")

    def test_narration_has_no_portrait_and_does_not_consume_change(self):
        beats = lines(speaker() + '''setsaydialog(saydialogs.narrative) say("narration")
setsaydialog(saydialogs.character) say("dialog")''')
        self.assertIsNone(beats[0].portrait)
        self.assertIsNone(beats[0].speaker)
        self.assertTrue(beats[1].portrait_changed)

    def test_think_keeps_named_character_and_expression(self):
        beat = lines(speaker() + 'setsaydialog(saydialogs.think) say("thought")')[0]
        self.assertEqual((beat.mode, beat.speaker, beat.portrait.expression), ("think", "a", "normal"))

    def test_init_resets_expression_and_revision_survives_reset(self):
        beats = lines(speaker() + 'say("before") luamanager.Init() say("unknown")'
                      + speaker() + 'say("after")')
        self.assertIsNone(beats[1].portrait)
        self.assertGreater(beats[2].portrait_revision, beats[0].portrait_revision)

    def test_change_scene_resets_expression(self):
        beats = lines(speaker() + 'say("before") luamanager.ChangeScene("Battle", "x", "y") say("after")')
        self.assertIsNone(beats[-1].portrait)

    def test_rendered_row_retains_source_and_change_metadata(self):
        beat = lines(speaker() + 'say("hello")')[0]
        row = Renderer({}).render_rows([beat])[0]
        self.assertEqual(row[:4], ["say", "a", "hello", "dialog"])
        self.assertEqual(row[4], {"character": "a", "expression": "normal", "changed": True, "revision": 1})


class PortraitAssetTests(unittest.TestCase):
    def test_catalog_resolves_unicode_and_alias_through_dependencies(self):
        def encoded(data):
            return base64.b64encode(data).decode("ascii")
        keys = bytearray(struct.pack("<i", 3))
        offsets = []
        for key in ["Assets/角色/shy.png", "short_alias", "portrait.bundle"]:
            offsets.append(len(keys))
            raw = key.encode("utf-16-le")
            keys.extend(bytes([1]) + struct.pack("<i", len(raw)) + raw)
        buckets = bytearray(struct.pack("<i", 3))
        for offset, entry in zip(offsets, [0, 0, 1]):
            buckets.extend(struct.pack("<iii", offset, 1, entry))
        entries = struct.pack("<i", 2) + struct.pack("<7i", 0, 1, 2, 0, -1, 0, 0) + struct.pack("<7i", 1, 0, -1, 0, -1, 2, 0)
        payload = {"m_InternalIds": ["Assets/角色/shy.png", "runtime\\portrait.bundle"],
                   "m_ProviderIds": ["BundleProvider", "BundledAssetProvider"],
                   "m_KeyDataString": encoded(keys), "m_BucketDataString": encoded(buckets),
                   "m_EntryDataString": encoded(entries)}
        with tempfile.TemporaryDirectory() as folder:
            catalog = Path(folder) / "catalog.json"
            catalog.write_text(json.dumps(payload), encoding="utf-8")
            assets = catalog_assets(catalog)
        self.assertEqual(assets["short_alias"].address, "assets/角色/shy.png")
        self.assertEqual(assets["short_alias"].bundles, ("portrait.bundle",))

    def test_thumbnail_is_small_webp_with_transparency(self):
        image = Image.new("RGBA", (500, 1000), (0, 0, 0, 0))
        image.paste((255, 0, 0, 255), (100, 20, 400, 990))
        payload = thumbnail(image)
        with Image.open(BytesIO(payload)) as result:
            self.assertEqual(result.format, "WEBP")
            self.assertLessEqual(result.width, 192)
            self.assertLessEqual(result.height, 224)

    def test_cache_requires_images_and_tracks_bundle_changes(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            data = base / "Mortal_Data"
            bundle = data / "StreamingAssets/aa/StandaloneWindows64/test.bundle"
            bundle.parent.mkdir(parents=True)
            bundle.write_bytes(b"original")
            data.joinpath("resources.assets").write_bytes(b"resources")
            layout = GameLayout(data, (data / "resources.assets",))
            output = base / "out"
            output.mkdir()
            output.joinpath("a.webp").write_bytes(b"webp")
            output.joinpath("manifest.json").write_text(json.dumps({"fingerprint": fingerprint(layout), "files": ["a.webp"]}))
            self.assertIsNotNone(cached_manifest(layout, output))
            bundle.write_bytes(b"changed bundle")
            self.assertIsNone(cached_manifest(layout, output))


if __name__ == "__main__":
    unittest.main()
