#!/bin/bash
cd "$(dirname "$0")" || exit 1
fail() { echo "The app could not start. Copy the error above for help."; read -r -p "Press Return to close."; exit 1; }
if ! command -v python3 >/dev/null 2>&1; then
  echo "Install Python 3.11 or newer from https://www.python.org/downloads/ then try again."
  fail
fi
if [ ! -x .venv/bin/python ]; then python3 -m venv .venv || fail; fi
.venv/bin/python -m pip install -r requirements.txt || fail
.venv/bin/python app.py --open-browser || fail
