#!/usr/bin/env python3
"""Rebuild thesis figures affected by the final 27-system listening subset."""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = ROOT / "public" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

GREEN = "#2f6540"
MID = "#5e9770"
LIGHT = "#e8f1eb"
PALE = "#f5f8f6"
GRID = "#dce8df"
TEXT = "#223029"
ACCENT = "#9abca5"
SYMBOLIC = "#2f6540"
AUDIO = "#7da88a"

systems = json.loads((DATA / "systems.json").read_text(encoding="utf-8"))
evaluations = json.loads((DATA / "evaluation.json").read_text(encoding="utf-8"))
if len(systems) != 27 or len(evaluations) != 27:
    raise RuntimeError("Expected 27 systems and 27 evaluations before figure generation")

system_by_id = {item["id"]: item for item in systems}
rows = []
for evaluation in evaluations:
    system = system_by_id[evaluation["id"]]
    rows.append({**system, **evaluation["scores"]})

DIMS = ["quality", "melody", "harmony", "rhythm", "structure", "control", "naturalness", "overall"]
DIM_LABELS = ["Quality", "Melody", "Harmony", "Rhythm", "Structure", "Control", "Naturalness", "Overall"]


def mean(values):
    usable = [float(value) for value in values if isinstance(value, (int, float))]
    return float(np.mean(usable)) if usable else np.nan


def style_axis(ax, *, grid_axis="y"):
    ax.set_facecolor("white")
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines[["left", "bottom"]].set_color(TEXT)
    ax.tick_params(colors=TEXT, labelsize=11)
    ax.grid(axis=grid_axis, color=GRID, linewidth=1)
    ax.set_axisbelow(True)


def save(fig, filename):
    fig.savefig(OUT / filename, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def box(ax, x, y, w, h, title, body="", *, fill=LIGHT, edge=GREEN, title_size=15, body_size=11):
    patch = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.012,rounding_size=0.018",
        linewidth=2,
        edgecolor=edge,
        facecolor=fill,
    )
    ax.add_patch(patch)
    ax.text(x + w / 2, y + h * 0.63, title, ha="center", va="center", color=GREEN, fontsize=title_size, fontweight="bold")
    if body:
        ax.text(x + w / 2, y + h * 0.30, body, ha="center", va="center", color=TEXT, fontsize=body_size, linespacing=1.25)
    return patch


def arrow(ax, start, end):
    ax.add_patch(FancyArrowPatch(start, end, arrowstyle="-|>", mutation_scale=18, linewidth=2, color=MID))


def build_graphical_abstract():
    fig, ax = plt.subplots(figsize=(16, 9.5))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.text(0.5, 0.95, "AI Music Generation, Arrangement & Orchestration", ha="center", va="center", fontsize=27, color=GREEN, fontweight="bold")
    ax.text(0.5, 0.905, "A PRISMA-guided systematic review of developments, 2020–2025", ha="center", va="center", fontsize=16, color=TEXT)

    cards = [
        (0.035, "Scope", "3 tasks\n6 academic sources\n2020–2025"),
        (0.275, "Screening", "4,521 identified\n1,083 managed\n783 unique\n107 primary studies"),
        (0.515, "Analysis", "4-dimension taxonomy\n8 research trends\n107-study master table\n27-system pilot analysis"),
        (0.755, "Key findings", "Overall: 2.8 → 3.8\n(2020 to 2024 subset)\nControl + long-term structure\ndifferentiate stronger examples"),
    ]
    for x, title, body in cards:
        box(ax, x, 0.50, 0.205, 0.31, title, body, fill=PALE, title_size=17, body_size=13)
    for x in (0.248, 0.488, 0.728):
        arrow(ax, (x, 0.655), (x + 0.02, 0.655))

    ax.text(0.5, 0.445, "Nine featured systems (holistic Overall ≥ 4.0/5; discussion threshold, not a definitive ranking)", ha="center", va="center", fontsize=14, color=GREEN, fontweight="bold")
    featured = ["GETMusic 4.5", "ChatMusician 4.5", "MusicLM 4.0", "MusicGen 4.0", "StemGen 4.0", "AccoMontage 4.0", "Whole-Song 4.0", "Structured Arrangement 4.0", "SymphonyNet 4.0"]
    positions = [(0.05 + i * 0.185, 0.35) for i in range(5)] + [(0.12 + i * 0.215, 0.27) for i in range(4)]
    for index, ((x, y), label) in enumerate(zip(positions, featured)):
        width = 0.16 if index < 5 else 0.18
        box(ax, x, y, width, 0.055, label, "", fill=LIGHT, title_size=10.5)

    ax.add_patch(FancyBboxPatch((0.035, 0.08), 0.93, 0.11, boxstyle="round,pad=0.012,rounding_size=0.018", facecolor=GREEN, edgecolor=GREEN))
    ax.text(0.5, 0.148, "Contributions", ha="center", va="center", fontsize=16, color="white", fontweight="bold")
    ax.text(
        0.5,
        0.108,
        "Updated taxonomy  ·  verified comparison of 107 studies  ·  eight-trend synthesis\n"
        "27-system pilot listening analysis  ·  companion website",
        ha="center",
        va="center",
        fontsize=11.5,
        linespacing=1.35,
        color="white",
    )
    save(fig, "fig_01_graphical_abstract.png")


def build_workflow():
    fig, ax = plt.subplots(figsize=(16, 10.5))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.text(0.04, 0.955, "Systematic review stage — reported with reference to PRISMA 2020", fontsize=17, color=GREEN, fontweight="bold", va="center")
    top = [
        (0.04, "Identification", "six sources, 2020–2025\nn = 4,521"),
        (0.275, "Record\nmanagement", "exported to Zotero\nn = 1,083"),
        (0.51, "Screening", "783 unique → 383 abstracts\n→ 146 retained"),
        (0.745, "Full-text\neligibility", "146 assessed · 33 excluded\nn = 113 initially included"),
    ]
    for x, title, body in top:
        box(ax, x, 0.73, 0.205, 0.15, title, body, title_size=13.5, body_size=10.5)
    for x in (0.248, 0.483, 0.718):
        arrow(ax, (x, 0.805), (x + 0.022, 0.805))

    ax.text(0.04, 0.665, "Post-inclusion verification — not a PRISMA screening stage", fontsize=17, color=GREEN, fontweight="bold", va="center")
    mid = [
        (0.275, "Final primary\ncorpus", "n = 107 studies"),
        (0.51, "Eligibility-consistency\naudit", "112 → 107\nfive reclassified"),
        (0.745, "Duplicate\nconsolidation", "113 → 112\none version consolidated"),
    ]
    for x, title, body in mid:
        box(ax, x, 0.48, 0.205, 0.14, title, body, fill="#dbeadd", title_size=13.5, body_size=10.5)
    arrow(ax, (0.745, 0.55), (0.72, 0.55))
    arrow(ax, (0.51, 0.55), (0.485, 0.55))
    arrow(ax, (0.848, 0.73), (0.848, 0.625))

    ax.text(0.04, 0.41, "Synthesis stage — separate from PRISMA eligibility", fontsize=17, color=GREEN, fontweight="bold", va="center")
    bottom = [
        (0.04, "Data extraction\n& verification", "all 107 studies"),
        (0.275, "Taxonomy\nconstruction", "4 dimensions"),
        (0.51, "Qualitative trend\nsynthesis", "8 research trends"),
        (0.745, "Final listening\nsubset", "S1–S5 · n = 27"),
    ]
    for x, title, body in bottom:
        box(ax, x, 0.20, 0.205, 0.14, title, body, title_size=13.5, body_size=10.5)
    for x in (0.248, 0.483, 0.718):
        arrow(ax, (x, 0.27), (x + 0.022, 0.27))
    arrow(ax, (0.377, 0.48), (0.377, 0.345))
    arrow(ax, (0.848, 0.20), (0.848, 0.155))
    box(ax, 0.28, 0.045, 0.61, 0.085, "Pilot exploratory listening analysis → interpretation", "27 systems · 7 batches · 7 criteria + holistic Overall (1–5) · single evaluator", fill="#dbeadd", title_size=15, body_size=11)
    save(fig, "fig_03_review_workflow.png")


def build_prisma():
    fig, ax = plt.subplots(figsize=(14, 19))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.text(0.5, 0.975, "PRISMA 2020 Flow Diagram", ha="center", va="center", fontsize=27, color=GREEN, fontweight="bold")
    main_x, main_w, h = 0.19, 0.48, 0.065
    steps = [
        (0.89, "Records identified across six databases", "n = 4,521"),
        (0.78, "Records exported / imported to Zotero", "record management · n = 1,083"),
        (0.67, "Records after duplicate removal", "n = 783"),
        (0.56, "Title screening", "n = 783"),
        (0.45, "Abstract screening", "n = 383"),
        (0.34, "Retained for full-text review", "n = 146"),
        (0.23, "Full-text eligibility assessed", "n = 146"),
        (0.12, "Studies initially included", "n = 113"),
    ]
    for y, title, body in steps:
        box(ax, main_x, y, main_w, h, title, body, title_size=15, body_size=11)
    for (y1, *_), (y2, *__) in zip(steps, steps[1:]):
        arrow(ax, (main_x + main_w / 2, y1), (main_x + main_w / 2, y2 + h))

    side = [
        (0.78, "Not transferred", "n = 3,438\nexport/platform limitations"),
        (0.67, "Duplicates removed", "n = 300"),
        (0.56, "Excluded", "n = 400\noff-topic / out of scope"),
        (0.45, "Excluded", "n = 237\nduplicates and out-of-scope records"),
        (0.23, "Excluded", "n = 33\n20 reviews kept as background; 13 other"),
        (0.12, "Consolidated", "n = 1\nduplicated publication version"),
    ]
    for y, title, body in side:
        box(ax, 0.72, y, 0.245, h, title, body, fill=PALE, edge=ACCENT, title_size=13, body_size=9.5)
        arrow(ax, (main_x + main_w, y + h / 2), (0.715, y + h / 2))

    final_y, final_h = 0.040, 0.055
    ax.add_patch(
        FancyBboxPatch(
            (0.19, final_y),
            0.48,
            final_h,
            boxstyle="round,pad=0.012,rounding_size=0.018",
            linewidth=2,
            edgecolor=GREEN,
            facecolor=GREEN,
        )
    )
    ax.text(0.43, final_y + final_h * 0.63, "Final primary corpus", ha="center", va="center", fontsize=17, color="white", fontweight="bold")
    ax.text(0.43, final_y + final_h * 0.28, "n = 107", ha="center", va="center", fontsize=12, color="white")
    box(ax, 0.72, final_y, 0.245, final_h, "Reclassified", "n = 5 · moved to background", fill=PALE, edge=ACCENT, title_size=13, body_size=9.5)
    arrow(ax, (0.67, final_y + final_h / 2), (0.715, final_y + final_h / 2))

    # Separate synthesis-stage callout below the PRISMA sequence.
    ax.text(0.5, 0.006, "Synthesis stage: all 107 studies remain included · pilot listening subset n = 27", ha="center", va="bottom", fontsize=11.5, color=GREEN, fontstyle="italic")
    save(fig, "fig_04_prisma.png")


def build_paradigm():
    counts = Counter(row["paradigm"] for row in rows)
    preferred = ["Transformer", "Diffusion", "VAE", "Hybrid", "RNN"]
    labels = [label for label in preferred if counts[label]]
    values = [counts[label] for label in labels]
    display = {"Transformer": "Transformer /\nlanguage model", "Hybrid": "Hybrid / other", "RNN": "RNN / LSTM"}
    fig, ax = plt.subplots(figsize=(10.5, 6.2))
    bars = ax.bar([display.get(label, label) for label in labels], values, color=[GREEN, "#42784f", "#60946e", "#96b9a0", "#c2d8c8"][: len(labels)])
    style_axis(ax)
    ax.set_title("Generative modelling family across the 27 evaluated systems", fontsize=19, color=GREEN, pad=16)
    ax.set_ylabel("Number of systems (of 27)", fontsize=13)
    ax.set_ylim(0, max(values) + 2)
    ax.bar_label(bars, fontsize=13, padding=3, color=TEXT)
    ax.tick_params(axis="x", rotation=18)
    save(fig, "fig_10_paradigm_27.png")


def build_year_trend():
    grouped = defaultdict(list)
    for row in rows:
        grouped[row["year"]].append(row["overall"])
    years = sorted(grouped)
    values = [mean(grouped[year]) for year in years]
    fig, ax = plt.subplots(figsize=(10.5, 5.8))
    ax.plot(years, values, color=GREEN, marker="o", markersize=9, linewidth=3, markerfacecolor=MID, markeredgecolor=GREEN)
    style_axis(ax)
    ax.set_title("Mean holistic Overall score by year (27-system subset)", fontsize=19, color=GREEN, pad=16)
    ax.set_xlabel("Year", fontsize=13)
    ax.set_ylabel("Mean Overall score (1–5)", fontsize=13)
    ax.set_ylim(2.4, 4.15)
    ax.set_xticks(years)
    for year, value in zip(years, values):
        ax.annotate(f"{value:.2f}\n(n={len(grouped[year])})", (year, value), xytext=(0, 14), textcoords="offset points", ha="center", fontsize=11, color=TEXT)
    save(fig, "fig_11_year_trend_27.png")


def build_domain():
    domains = ["Symbolic", "Audio"]
    averages = {domain: [mean([row[dim] for row in rows if row["domain"] == domain]) for dim in DIMS] for domain in domains}
    x = np.arange(len(DIMS))
    width = 0.36
    fig, ax = plt.subplots(figsize=(11.2, 5.8))
    ax.bar(x - width / 2, averages["Symbolic"], width, label="Symbolic", color=SYMBOLIC)
    ax.bar(x + width / 2, averages["Audio"], width, label="Audio", color=AUDIO)
    style_axis(ax)
    ax.set_title("Symbolic versus audio systems by rating item", fontsize=19, color=GREEN, pad=16)
    ax.set_ylabel("Average rating (1–5)", fontsize=13)
    ax.set_xticks(x, DIM_LABELS, rotation=25, ha="right")
    ax.set_ylim(2.5, 4.6)
    ax.legend(frameon=False, ncol=2, loc="upper right")
    save(fig, "fig_12_domain.png")


def build_heatmap():
    batches = sorted(set(row["batchIndex"] for row in rows))
    matrix = np.array([[mean([row[dim] for row in rows if row["batchIndex"] == batch]) for dim in DIMS] for batch in batches])
    labels = [f"B{batch}" for batch in batches]
    fig, ax = plt.subplots(figsize=(11.2, 6.2))
    image = ax.imshow(matrix, cmap="YlGn", vmin=1, vmax=5, aspect="auto")
    ax.set_title("Batch-average ratings: seven criteria and holistic Overall", fontsize=19, color=GREEN, pad=18)
    ax.set_xticks(np.arange(len(DIMS)), DIM_LABELS, rotation=30, ha="right")
    ax.set_yticks(np.arange(len(labels)), labels)
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            value = matrix[i, j]
            ax.text(j, i, f"{value:.2f}", ha="center", va="center", color="white" if value >= 3.65 else TEXT, fontsize=9.5, fontweight="bold")
    cbar = fig.colorbar(image, ax=ax, fraction=0.03, pad=0.02)
    cbar.set_label("Average rating (1–5)")
    ax.spines[:].set_visible(False)
    save(fig, "fig_13_heatmap.png")


def build_overall():
    ordered = sorted(rows, key=lambda row: (row["overall"], row["name"]))
    labels = [row["name"] for row in ordered]
    values = [row["overall"] for row in ordered]
    colors = [SYMBOLIC if row["domain"] == "Symbolic" else AUDIO for row in ordered]
    fig, ax = plt.subplots(figsize=(10.5, 13.2))
    bars = ax.barh(labels, values, color=colors)
    style_axis(ax, grid_axis="x")
    ax.set_title("Systems ordered by holistic Overall score (27-system subset)", fontsize=19, color=GREEN, pad=16)
    ax.set_xlabel("Holistic Overall score (1–5)", fontsize=13)
    ax.set_xlim(0, 5.15)
    ax.axvline(4.0, color="#b86b45", linestyle="--", linewidth=2, label="Featured-set threshold (4.0)")
    ax.bar_label(bars, fmt="%.1f", padding=4, fontsize=9.5, color=TEXT)
    ax.legend(frameon=False, loc="lower right")
    save(fig, "fig_14_overall_order.png")


def main():
    build_graphical_abstract()
    build_workflow()
    build_prisma()
    build_paradigm()
    build_year_trend()
    build_domain()
    build_heatmap()
    build_overall()
    print("rebuilt figures for 27-system subset")


if __name__ == "__main__":
    main()
