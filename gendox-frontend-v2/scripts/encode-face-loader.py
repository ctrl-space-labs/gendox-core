"""Encode white-on-transparent PNG frames as a looping GIF without motion trails."""

from pathlib import Path
import sys

from PIL import Image


def encode(frames_dir, destination, fps):
    frames = []
    # GIF has binary transparency: index 0 is transparent, index 1 is white.
    # Render at 2x display size to keep the silhouette crisp on any background.
    palette = [0, 0, 0, 255, 255, 255] + [0] * (256 * 3 - 6)
    for file in sorted(Path(frames_dir).glob('*.png')):
        with Image.open(file) as source:
            alpha = source.convert('RGBA').getchannel('A')
            frame = Image.new('P', source.size, 0)
            frame.putpalette(palette)
            frame.paste(1, mask=alpha.point(lambda value: 255 if value >= 128 else 0))
            frames.append(frame)
    if not frames:
        raise ValueError('No PNG frames found')
    frames[0].save(
        destination,
        save_all=True,
        append_images=frames[1:],
        duration=round(1000 / fps),
        loop=0,
        transparency=0,
        disposal=2,
        optimize=False,
    )


if __name__ == '__main__':
    encode(sys.argv[1], sys.argv[2], int(sys.argv[3]))
