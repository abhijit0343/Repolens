"""RepoLens backend application package."""
import sys
from pathlib import Path

_root = str(Path(__file__).resolve().parent.parent.parent)
_backend = str(Path(__file__).resolve().parent.parent)
if _root not in sys.path:
    sys.path.insert(0, _root)
if _backend not in sys.path:
    sys.path.insert(0, _backend)

__version__ = "1.0.0"
