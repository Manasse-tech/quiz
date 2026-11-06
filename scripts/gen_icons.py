#!/usr/bin/env python3
"""Génère les icônes PWA de HARKSTUDENT (bouclier électrique + H)."""
import cairosvg

SHIELD_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="{rx}" fill="#0d1117"/>
  <!-- grille subtile -->
  <g stroke="#30363d" stroke-width="1" opacity="0.35">
    <path d="M64 0V512 M128 0V512 M192 0V512 M256 0V512 M320 0V512 M384 0V512 M448 0V512"/>
    <path d="M0 64H512 M0 128H512 M0 192H512 M0 256H512 M0 320H512 M0 384H512 M0 448H512"/>
  </g>
  <!-- halo -->
  <circle cx="256" cy="250" r="170" fill="#2f81f7" opacity="0.10"/>
  <!-- bouclier -->
  <g transform="translate(256 244) scale(9.2) translate(-12 -11)">
    <path d="M12 21.5 C 19.5 17.8 19.5 12.2 19.5 6 L 12 3 L 4.5 6 C 4.5 12.2 4.5 17.8 12 21.5 Z"
          fill="#2f81f7" fill-opacity="0.18" stroke="#2f81f7" stroke-width="1.9"
          stroke-linejoin="round"/>
  </g>
  <!-- lettre H -->
  <text x="256" y="288" font-family="DejaVu Sans, sans-serif" font-weight="bold"
        font-size="118" fill="#ffffff" text-anchor="middle" letter-spacing="2">H</text>
  <!-- accent bas -->
  <rect x="186" y="452" width="140" height="10" rx="5" fill="#2f81f7"/>
</svg>"""


def render(name: str, size: int, rx: int):
    svg = SHIELD_SVG.replace("{rx}", str(rx))
    cairosvg.svg2png(
        bytestring=svg.encode(),
        write_to=f"/home/z/my-project/public/icons/{name}",
        output_width=size,
        output_height=size,
    )
    print(f"✓ {name} ({size}x{size})")


import os

os.makedirs("/home/z/my-project/public/icons", exist_ok=True)

# Icônes "any" (fond arrondi)
render("icon-192.png", 192, 34)
render("icon-512.png", 512, 90)

# Icônes "maskable" (fond plein bord-à-bord, contenu en zone sûre)
MASKABLE = SHIELD_SVG.replace("{rx}", "0").replace(
    'transform="translate(256 244) scale(9.2) translate(-12 -11)"',
    'transform="translate(256 248) scale(7.6) translate(-12 -11)"'
).replace('font-size="118"', 'font-size="98"').replace('y="288"', 'y="286"')
cairosvg.svg2png(
    bytestring=MASKABLE.encode(),
    write_to="/home/z/my-project/public/icons/maskable-192.png",
    output_width=192, output_height=192,
)
cairosvg.svg2png(
    bytestring=MASKABLE.encode(),
    write_to="/home/z/my-project/public/icons/maskable-512.png",
    output_width=512, output_height=512,
)
print("✓ maskable-192.png / maskable-512.png")

# Apple touch icon (180, fond plein)
cairosvg.svg2png(
    bytestring=MASKABLE.encode(),
    write_to="/home/z/my-project/public/icons/apple-touch-icon.png",
    output_width=180, output_height=180,
)
print("✓ apple-touch-icon.png (180x180)")
