"""
Visual Infographic & Social Card Generator
Renders high-density, accessible 1200x675 (16:9) visual summary cards in PNG and SVG formats.
Features plain-language titles, fiscal impact badges, affected wards, and clerk receipts.
"""

import io
import textwrap

from PIL import Image, ImageDraw, ImageFont

from .schemas import EnrichedCivicMatter

WIDTH = 1200
HEIGHT = 675

# Brand Palette (Dark Theme)
BG_COLOR: tuple[int, int, int] = (11, 15, 25)         # #0B0F19
CONTAINER_BG: tuple[int, int, int] = (20, 27, 45)     # #141B2D
BORDER_COLOR: tuple[int, int, int] = (45, 55, 72)     # #2D3748
TEXT_PRIMARY: tuple[int, int, int] = (248, 250, 252)  # #F8FAFC
TEXT_MUTED: tuple[int, int, int] = (148, 163, 184)    # #94A3B8
EMERALD: tuple[int, int, int] = (16, 185, 129)        # #10B981
BLUE_ACCENT: tuple[int, int, int] = (56, 189, 248)    # #38BDF8
AMBER: tuple[int, int, int] = (245, 158, 11)          # #F59E0B


def format_fiscal_amount(amount: float, fiscal_type: str) -> str:
    if amount <= 0.0:
        return "Regulatory / $0 Direct Budget"
    return f"${amount:,.2f} ({fiscal_type})"


class CivicCardGenerator:
    """
    Generates deterministic, accessible visual cards for civic dockets.
    """

    def __init__(self):
        # Fallback to default bitmap font if TTF isn't present
        try:
            self.font_title = ImageFont.load_default()
            self.font_body = ImageFont.load_default()
            self.font_small = ImageFont.load_default()
        except Exception:
            self.font_title = None
            self.font_body = None
            self.font_small = None

    def generate_card_png(
        self, docket: EnrichedCivicMatter, jurisdiction_name: str
    ) -> bytes:
        """
        Renders a 1200x675 PNG image with typography, badges, and receipt verification citation.
        """
        img = Image.new("RGB", (WIDTH, HEIGHT), color=BG_COLOR)
        draw = ImageDraw.Draw(img)

        # Outer Card Container with rounded corners
        draw.rounded_rectangle(
            [40, 40, WIDTH - 40, HEIGHT - 40],
            radius=20,
            fill=CONTAINER_BG,
            outline=BORDER_COLOR,
            width=2,
        )

        # Header Bar
        header_text = f"CIVICDIGEST  •  {jurisdiction_name.upper()} MUNICIPAL DOCKET"
        draw.text((80, 75), header_text, fill=TEXT_MUTED, font=self.font_small)

        # Top Badges: Receipt & Priority
        receipt_badge = "✓ VERIFIED CLERK RECEIPT"
        draw.rounded_rectangle([WIDTH - 360, 65, WIDTH - 80, 100], radius=8, fill=(14, 45, 75))
        draw.text((WIDTH - 340, 75), receipt_badge, fill=BLUE_ACCENT, font=self.font_small)

        # File Number & Priority Sub-header
        priority_str = f"PRIORITY: {docket.impact_priority.value}"
        draw.text((80, 115), f"File #{docket.file_number}  |  {priority_str}", fill=AMBER, font=self.font_small)

        # Divider Line
        draw.line([(80, 140), (WIDTH - 80, 140)], fill=BORDER_COLOR, width=1)

        # Plain Title (Word-wrapped)
        wrapped_title = textwrap.wrap(docket.plain_title, width=50)[:2]
        y_cursor = 165
        for line in wrapped_title:
            draw.text((80, y_cursor), line, fill=TEXT_PRIMARY, font=self.font_title)
            y_cursor += 36

        # Core Policy "What It Does"
        y_cursor += 15
        draw.text((80, y_cursor), "POLICY SUMMARY:", fill=TEXT_MUTED, font=self.font_small)
        y_cursor += 25
        wrapped_what = textwrap.wrap(docket.the_what, width=75)[:2]
        for line in wrapped_what:
            draw.text((80, y_cursor), f"► {line}", fill=TEXT_PRIMARY, font=self.font_body)
            y_cursor += 28

        # Who & Wards Impact
        y_cursor += 15
        wards_str = ", ".join(docket.affected_wards)
        draw.text((80, y_cursor), f"AFFECTED WARDS / COMMUNITY:  {wards_str}", fill=TEXT_MUTED, font=self.font_small)
        y_cursor += 25
        draw.text((80, y_cursor), f"► {docket.the_who}", fill=TEXT_PRIMARY, font=self.font_body)

        # Fiscal Impact Box
        y_cursor += 40
        fiscal_text = format_fiscal_amount(docket.fiscal_impact_amount, docket.fiscal_impact_type)
        draw.rounded_rectangle([80, y_cursor, WIDTH - 80, y_cursor + 50], radius=8, fill=(6, 44, 30))
        draw.text((105, y_cursor + 15), f"BUDGET IMPACT:  {fiscal_text}", fill=EMERALD, font=self.font_body)

        # Footer Receipt Citation Link
        footer_y = HEIGHT - 85
        draw.line([(80, footer_y - 15), (WIDTH - 80, footer_y - 15)], fill=BORDER_COLOR, width=1)
        draw.text(
            (80, footer_y),
            f"Official Legistar URL: {docket.official_source_url[:65]}...",
            fill=TEXT_MUTED,
            font=self.font_small,
        )
        draw.text(
            (WIDTH - 380, footer_y),
            f"Matter #{docket.clerk_matter_id}  •  Page {docket.receipt_page_number}",
            fill=TEXT_MUTED,
            font=self.font_small,
        )

        buffer = io.BytesIO()
        img.save(buffer, format="PNG", optimize=True)
        return buffer.getvalue()

    def generate_card_svg(
        self, docket: EnrichedCivicMatter, jurisdiction_name: str
    ) -> str:
        """
        Renders an SVG string representation of the 1200x675 card.
        """
        fiscal_text = format_fiscal_amount(docket.fiscal_impact_amount, docket.fiscal_impact_type)
        wards_str = ", ".join(docket.affected_wards)
        title_lines = textwrap.wrap(docket.plain_title, width=45)[:2]
        title_svg = "\n".join(
            [f'<text x="80" y="{190 + (i * 42)}" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" fill="#F8FAFC">{line}</text>'
             for i, line in enumerate(title_lines)]
        )

        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">
  <rect width="{WIDTH}" height="{HEIGHT}" fill="#0B0F19"/>
  <rect x="40" y="40" width="{WIDTH - 80}" height="{HEIGHT - 80}" rx="20" fill="#141B2D" stroke="#2D3748" stroke-width="2"/>

  <text x="80" y="85" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#94A3B8">CIVICDIGEST • {jurisdiction_name.upper()} MUNICIPAL DOCKET</text>

  <rect x="{WIDTH - 360}" y="65" width="280" height="35" rx="8" fill="#0E2D4B"/>
  <text x="{WIDTH - 340}" y="88" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#38BDF8">✓ VERIFIED CLERK RECEIPT</text>

  <text x="80" y="125" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#F59E0B">File #{docket.file_number} | PRIORITY: {docket.impact_priority.value}</text>
  <line x1="80" y1="145" x2="{WIDTH - 80}" y2="145" stroke="#2D3748" stroke-width="1"/>

  {title_svg}

  <text x="80" y="295" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#94A3B8">POLICY SUMMARY</text>
  <text x="80" y="325" font-family="system-ui, sans-serif" font-size="18" fill="#F8FAFC">► {docket.the_what[:95]}</text>

  <text x="80" y="380" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#94A3B8">AFFECTED WARDS: {wards_str}</text>
  <text x="80" y="410" font-family="system-ui, sans-serif" font-size="18" fill="#F8FAFC">► {docket.the_who[:95]}</text>

  <rect x="80" y="450" width="{WIDTH - 160}" height="55" rx="8" fill="#062C1E"/>
  <text x="105" y="485" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#10B981">BUDGET IMPACT: {fiscal_text}</text>

  <line x1="80" y1="575" x2="{WIDTH - 80}" y2="575" stroke="#2D3748" stroke-width="1"/>
  <text x="80" y="605" font-family="system-ui, sans-serif" font-size="13" fill="#94A3B8">Official URL: {docket.official_source_url[:65]}...</text>
  <text x="{WIDTH - 360}" y="605" font-family="system-ui, sans-serif" font-size="13" fill="#94A3B8">Matter #{docket.clerk_matter_id} • Page {docket.receipt_page_number}</text>
</svg>"""
        return svg
