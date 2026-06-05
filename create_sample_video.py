from pathlib import Path

import imageio.v2 as imageio
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT / "output"
OUTPUT_FILE = OUTPUT_DIR / "comfortcare-sample.mp4"

WIDTH = 1080
HEIGHT = 1920
FPS = 24

BRAND_BLUE = "#0b5cab"
BRAND_GREEN = "#1aa37a"
BG = "#f4f8fb"
TEXT = "#0f1c2e"
WHITE = "#ffffff"


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates.extend(
            [
                "C:/Windows/Fonts/segoeuib.ttf",
                "C:/Windows/Fonts/arialbd.ttf",
            ]
        )
    else:
        candidates.extend(
            [
                "C:/Windows/Fonts/segoeui.ttf",
                "C:/Windows/Fonts/arial.ttf",
            ]
        )

    for candidate in candidates:
        font_path = Path(candidate)
        if font_path.exists():
            return ImageFont.truetype(str(font_path), size=size)

    return ImageFont.load_default()


TITLE_FONT = load_font(84, bold=True)
SUBTITLE_FONT = load_font(46)
BODY_FONT = load_font(54, bold=True)
SMALL_FONT = load_font(34)


SCENES = [
    {
        "image": None,
        "headline": "ComfortCare",
        "subheadline": "Medical equipment rentals with local support",
        "caption": "Serving Sandy Springs and the Atlanta area",
        "seconds": 3,
    },
    {
        "image": ROOT / "images" / "Picture1.jpg",
        "headline": "Reliable equipment",
        "subheadline": "Beds and recovery essentials delivered fast",
        "caption": "High-quality rentals for home recovery",
        "seconds": 3,
    },
    {
        "image": ROOT / "images" / "Picture2.jpg",
        "headline": "Patient-first setup",
        "subheadline": "Support for discharge teams and caregivers",
        "caption": "Clear communication from order to delivery",
        "seconds": 3,
    },
    {
        "image": ROOT / "images" / "Picture3.jpg",
        "headline": "Practical home solutions",
        "subheadline": "Equipment that helps daily recovery run smoothly",
        "caption": "Flexible rentals for changing needs",
        "seconds": 3,
    },
    {
        "image": ROOT / "images" / "operator-headset.jpg",
        "headline": "Talk with ComfortCare",
        "subheadline": "A trusted local partner for medical rentals",
        "caption": "Visit comcare.store",
        "seconds": 3,
    },
]


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = []

    for word in words:
        trial = " ".join(current + [word])
        bbox = draw.textbbox((0, 0), trial, font=font)
        if bbox[2] - bbox[0] <= max_width or not current:
            current.append(word)
        else:
            lines.append(" ".join(current))
            current = [word]

    if current:
        lines.append(" ".join(current))

    return lines


def draw_text_block(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, x: int, y: int, width: int, fill: str) -> int:
    lines = wrap_text(draw, text, font, width)
    cursor_y = y
    for line in lines:
        draw.text((x, cursor_y), line, font=font, fill=fill)
        bbox = draw.textbbox((x, cursor_y), line, font=font)
        cursor_y += (bbox[3] - bbox[1]) + 12
    return cursor_y


def background_from_image(image_path: Path | None) -> Image.Image:
    canvas = Image.new("RGB", (WIDTH, HEIGHT), BG)
    if not image_path:
        return canvas

    source = Image.open(image_path).convert("RGB")

    blurred = source.resize((WIDTH, HEIGHT)).filter(ImageFilter.GaussianBlur(10))
    darken = Image.new("RGBA", (WIDTH, HEIGHT), (8, 22, 37, 150))
    canvas = Image.alpha_composite(blurred.convert("RGBA"), darken).convert("RGB")

    source.thumbnail((920, 760))
    card = Image.new("RGB", (980, 820), WHITE)
    draw = ImageDraw.Draw(card)
    draw.rounded_rectangle((0, 0, 979, 819), radius=36, fill=WHITE)
    image_x = (980 - source.width) // 2
    image_y = (820 - source.height) // 2
    card.paste(source, (image_x, image_y))

    shadow = Image.new("RGBA", (1020, 860), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((20, 20, 1000, 840), radius=44, fill=(0, 0, 0, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))

    canvas = canvas.convert("RGBA")
    canvas.alpha_composite(shadow, (50, 290))
    canvas.alpha_composite(card.convert("RGBA"), (50, 270))
    return canvas.convert("RGB")


def brand_overlay(frame: Image.Image, headline: str, subheadline: str, caption: str) -> Image.Image:
    frame = frame.convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw.rounded_rectangle((50, 60, 1030, 210), radius=34, fill=(11, 92, 171, 220))
    draw.text((90, 92), "ComfortCare", font=BODY_FONT, fill=WHITE)
    draw.text((90, 154), "Home Medical", font=SMALL_FONT, fill=(220, 240, 255))

    draw.rounded_rectangle((60, 1120, 1020, 1680), radius=44, fill=(255, 255, 255, 232))
    text_x = 110
    current_y = 1180
    current_y = draw_text_block(draw, headline, TITLE_FONT, text_x, current_y, 820, TEXT)
    current_y += 18
    current_y = draw_text_block(draw, subheadline, SUBTITLE_FONT, text_x, current_y, 820, BRAND_BLUE)
    current_y += 30
    draw.line((110, current_y, 930, current_y), fill=BRAND_GREEN, width=6)
    current_y += 34
    draw_text_block(draw, caption, SMALL_FONT, text_x, current_y, 820, TEXT)

    draw.rounded_rectangle((330, 1750, 750, 1848), radius=30, fill=BRAND_GREEN)
    draw.text((392, 1777), "comcare.store", font=BODY_FONT, fill=WHITE)

    return Image.alpha_composite(frame, overlay).convert("RGB")


def build_scene(scene: dict[str, object]) -> Image.Image:
    base = background_from_image(scene["image"])
    return brand_overlay(
        base,
        headline=str(scene["headline"]),
        subheadline=str(scene["subheadline"]),
        caption=str(scene["caption"]),
    )


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    frames = []
    for scene in SCENES:
        frame = build_scene(scene)
        frame_count = int(scene["seconds"]) * FPS
        for _ in range(frame_count):
            frames.append(frame.copy())

    with imageio.get_writer(OUTPUT_FILE, fps=FPS, codec="libx264", quality=8, macro_block_size=None) as writer:
        for frame in frames:
            writer.append_data(imageio.asarray(frame))

    print(f"Created sample video: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()