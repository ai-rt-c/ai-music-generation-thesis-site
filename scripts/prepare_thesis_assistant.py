"""Prepare private build-time retrieval data from the public thesis PDF."""

from build_thesis_corpus import main as build_corpus
from restore_public_thesis import main as restore_pdf


def main() -> None:
    restore_pdf()
    build_corpus()


if __name__ == "__main__":
    main()
