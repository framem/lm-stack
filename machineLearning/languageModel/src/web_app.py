"""
Entry point for the Gradio web application.

Usage:
    python src/web_app.py
"""

import sys
from pathlib import Path

# Ensure src/ is on the path so cross-package imports
# (e.g. "from training.xxx import ...") work correctly.
src_dir = Path(__file__).parent
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

import gradio as gr
from web.app import create_app

if __name__ == "__main__":
    app = create_app()
    app.queue().launch(server_port=7860, theme=gr.themes.Soft())
