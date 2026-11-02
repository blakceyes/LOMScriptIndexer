from __future__ import annotations

from ..flow.semantics import Effect, Semantics
from ..vocab import EDGE_JUMP, EDGE_TEMP, EDGE_TRAVEL

SEMANTICS = Semantics(
    narration_dialogs=frozenset({"center", "center2", "narrative"}),
    think_dialogs=frozenset({"think"}),
    speaker_sentinels=frozenset({
        "narrative", "narrator", "none", "center", "center2", "think",
    }),
    jumps={
        "SetNextScript": EDGE_JUMP,
        "SetCurrentStoryScript": EDGE_JUMP,
        "SetTempScript": EDGE_TEMP,
        "SetCurrentTravelScript": EDGE_TRAVEL,
    },
    story_jumps=frozenset({"SetNextScript", "SetCurrentStoryScript"}),
    check_methods={
        "Switch": "switch",
        "Dice": "dice",
        "Condition": "condition",
        "Position": "position",
    },
    time_object="luamanager",
    time_method="SetGameTime",
    effects={
        "Player": Effect("stat", value_index=1),
        "Character": Effect("rel", value_index=1),
        "SetPlayer": Effect("setstat", value_index=1),
        "UpdateSetPlayerStat": Effect("setstat", value_index=1),
        "SetCharacter": Effect("setrel", value_index=1),
        "SetFlag": Effect("setflag", value_index=1),
        "AddFlag": Effect("flag", value_index=1),
        "AddStory": Effect("story"),
        "AddBook": Effect("book", value_index=1, value_default=1),
        "RemoveBook": Effect("book", value_index=1, value_default=-1),
        "AddMisc": Effect("misc", value_index=1, value_default=1),
        "RemoveMisc": Effect("misc", value_index=1, value_default=-1),
        "AddSpecial": Effect("special", value_index=1, value_default=1),
        "RemoveSpecial": Effect("special", value_index=1, value_default=-1),
        "AddTalent": Effect("talent", value_index=1, value_default=1),
        "AddAchievementLib": Effect("library"),
        "Mission": Effect("mission", key_index=1, key_fallback=0),
    },
    dice_roll_methods=("ExecuteRoll", "Setup", "SetRandom"),
)
