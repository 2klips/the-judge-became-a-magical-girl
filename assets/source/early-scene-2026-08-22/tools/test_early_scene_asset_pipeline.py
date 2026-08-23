from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

from build_early_scene_assets import save_indexed
from clean_magenta_artifact import clean_magenta_artifact


def saturated_magenta(rgba: np.ndarray) -> np.ndarray:
    return (
        (rgba[:, :, 0] >= 220)
        & (rgba[:, :, 1] <= 64)
        & (rgba[:, :, 2] >= 160)
        & (rgba[:, :, 3] >= 128)
    )


class EarlySceneAssetPipelineTest(unittest.TestCase):
    def test_cleanup_changes_only_artifact_alpha(self) -> None:
        fixture = Image.new("P", (4, 4), 2)
        palette = [0, 0, 0, 255, 0, 255, 180, 80, 40] + [0, 0, 0] * 253
        fixture.putpalette(palette)
        fixture.putpixel((1, 1), 1)
        fixture.putpixel((2, 1), 1)
        fixture.info["transparency"] = bytes([0, 255, 255])

        before = np.array(fixture.convert("RGBA"))
        cleaned = np.array(clean_magenta_artifact(fixture).convert("RGBA"))
        candidate = saturated_magenta(before)

        self.assertGreater(int(candidate.sum()), 0)
        self.assertTrue(np.array_equal(before[~candidate], cleaned[~candidate]))
        self.assertTrue(np.all(cleaned[candidate, 3] == 0))

    def test_rgba_export_preserves_antialias_alpha_without_magenta_matte(self) -> None:
        rgba = np.zeros((12, 12, 4), dtype=np.uint8)
        rgba[2:10, 2:10, :3] = (92, 126, 180)
        rgba[2:10, 2:10, 3] = 255
        rgba[1, 3:9, :3] = (92, 126, 180)
        rgba[1, 3:9, 3] = 64
        rgba[10, 3:9, :3] = (92, 126, 180)
        rgba[10, 3:9, 3] = 160

        with tempfile.TemporaryDirectory() as temp_dir:
            destination = Path(temp_dir) / "indexed.png"
            save_indexed(Image.fromarray(rgba, mode="RGBA"), destination)
            exported = np.array(Image.open(destination).convert("RGBA"))

        self.assertEqual(int(saturated_magenta(exported).sum()), 0)
        self.assertGreater(len(np.unique(exported[:, :, 3])), 2)


if __name__ == "__main__":
    unittest.main()
