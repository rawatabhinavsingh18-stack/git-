"""FastAPI service for the trained DeepDTA+ PyTorch CNN."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from service.predictor import CNNPredictor, prediction_fields
from service.schemas import (
    BatchPredictionRequest,
    HealthResponse,
    PredictionRequest,
    PredictionResponse,
    categorize_binding_affinity,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("dtaplus.api")
model_instance: CNNPredictor | None = None
model_load_error: str | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_instance, model_load_error
    try:
        model_instance = CNNPredictor()
        model_load_error = None
        logger.info(
            "Loaded DeepDTACNN checkpoint at %s on %s (checkpoint epoch %s)",
            model_instance.checkpoint_path,
            model_instance.device,
            model_instance.checkpoint_epoch or "unknown",
        )
    except Exception as exc:  # keep API alive so /health can explain startup problems
        model_instance = None
        model_load_error = str(exc)
        logger.exception("Could not load the DeepDTA CNN checkpoint")
    yield
    model_instance = None
    logger.info("DeepDTA+ service stopped")


app = FastAPI(
    title="DeepDTA+ Binding Affinity API",
    description="Predict drug-target affinity with the supplied trained PyTorch CNN checkpoint.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def _require_model() -> CNNPredictor:
    if model_instance is None:
        detail = "CNN checkpoint is not loaded."
        if model_load_error:
            detail += f" Details: {model_load_error}"
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)
    return model_instance


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    if model_instance is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=model_load_error or "CNN checkpoint is not loaded.",
        )
    return HealthResponse(
        status="ok",
        model_version="1.0.0",
        dataset="Davis",
        model="DeepDTACNN",
        device=model_instance.device.type,
        checkpoint_epoch=model_instance.checkpoint_epoch,
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict_affinity(request: PredictionRequest) -> PredictionResponse:
    predictor = _require_model()
    try:
        result = prediction_fields(float(predictor.predict([(request.smiles or "", request.protein_sequence)])[0]))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return PredictionResponse(
        **result,
        binding_level=categorize_binding_affinity(float(result["pkd"])),
        compound_name=request.compound_name,
        smiles=request.smiles,
    )


@app.post("/predict_batch", response_model=list[PredictionResponse], tags=["Inference"])
def predict_batch_affinity(request: BatchPredictionRequest) -> list[PredictionResponse]:
    predictor = _require_model()
    pairs = [(item.smiles or "", item.protein_sequence) for item in request.items]
    try:
        scores = predictor.predict(pairs)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    responses = []
    for item, score in zip(request.items, scores, strict=True):
        result = prediction_fields(float(score))
        responses.append(
            PredictionResponse(
                **result,
                binding_level=categorize_binding_affinity(float(result["pkd"])),
                compound_name=item.compound_name,
                smiles=item.smiles,
            )
        )
    return responses
