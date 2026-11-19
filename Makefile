.PHONY: setup data test smoke train eval serve demo all lint

PYTHON ?= python

setup:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -e ".[dev]"

data:
	bash scripts/fetch_data.sh

lint:
	ruff check src tests service

test:
	pytest -v

smoke:
	$(PYTHON) -m dtaplus.train --model cnn --smoke

train:
	$(PYTHON) -m dtaplus.train --model cnn --epochs 100

eval:
	$(PYTHON) -m dtaplus.evaluate --all

serve:
	uvicorn service.app:app --host 0.0.0.0 --port 8000 --reload

demo:
	streamlit run demo/streamlit_app.py

all: lint test smoke eval
	@echo "All stages completed successfully!"
