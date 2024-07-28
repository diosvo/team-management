"""
Non-business logic functions of `users` module.

e.g. Response normalization, data enrichment, enum classes, etc.
"""

from enum import Enum, unique


@unique
class Role(str, Enum):
    ADMIN = "administrator"
    CAPTAIN = "captain"
    COACH = "coach"
    PLAYER = "player"
    TREASURER = "treasurer"


@unique
class State(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TEMP_ABSENT = "temporarily_absent"
