from contextlib import asynccontextmanager
from typing import AsyncIterator, List

import tool.ner as sner
from fastapi import APIRouter, FastAPI, HTTPException
from loguru import logger
from pydantic import BaseModel
from transformers import BertTokenizerFast

# Global variables to store model and tokenizer
MODEL_INFO = None


# Models for request/response
class NERRequest(BaseModel):
    texts: List[str]


class NERResult(BaseModel):
    original: str
    xml: str
    iob: str


class NERResponse(BaseModel):
    results: List[NERResult]


class NERLabelsResponse(BaseModel):
    labels: List[str]
    total: int


class TokenizeRequest(BaseModel):
    text: str
    add_special_tokens: bool = True


class TokenizeResponse(BaseModel):
    text: str
    tokens: List[str]
    token_ids: List[int]


@asynccontextmanager
async def lifespan_ner(app: FastAPI) -> AsyncIterator[None]:
    logger.debug("Loading NER model...")
    global MODEL_INFO
    try:
        # Download model if not exists
        if 0:
            sner.download_model(model_tag=sner.MODEL_TAG, model_path=sner.MODEL_PATH)
        # Load model
        MODEL_INFO = sner.load_model(model_path=sner.MODEL_PATH, device="cpu")
        logger.debug("NER model loaded successfully")
        yield
    finally:
        # Cleanup
        MODEL_INFO = None
        logger.debug("NER model unloaded")


router = APIRouter(prefix="/ner", tags=["Named Entity Recognition"])


@router.post("/predict")
async def predict_entities(request: NERRequest) -> NERResponse:
    """Analyze text for named entities."""
    if not MODEL_INFO:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not request.texts or not any(text.strip() for text in request.texts):
        return NERResponse(results=[])

    try:
        # Get IOB predictions
        iob_results = sner.predict_batch_iob(texts=request.texts, model_info=MODEL_INFO)

        # Convert to XML
        xml_results = sner.convert_iob_to_xml(iob_results)

        # Combine results
        results = []
        for (original, iob_tags), xml_result in zip(iob_results, xml_results):
            results.append(
                NERResult(original=original, xml=xml_result, iob=",".join(iob_tags))
            )

        # ner_response = {
        #     "labels": ["ajd_location", "ajd_other", "ajd_person", "klc_other", "wyweb_bookname", "wyweb_other"],
        #     "total": 6,
        # }
        return NERResponse(results=results)

    except Exception as e:
        logger.error(f"Error processing text: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing text") from e


@router.post("/tokenize")
async def tokenize_text(request: TokenizeRequest) -> TokenizeResponse:
    """Tokenize the given text using the model's tokenizer."""
    if not MODEL_INFO:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Empty text provided")

    try:
        tokenizer: BertTokenizerFast = MODEL_INFO["tokenizer"]

        # Tokenize the text with configurable add_special_tokens
        encoded = tokenizer.encode_plus(
            request.text,
            add_special_tokens=request.add_special_tokens,
            return_attention_mask=False,
            return_token_type_ids=False,
        )

        # Get the tokens and their IDs
        tokens = tokenizer.convert_ids_to_tokens(encoded["input_ids"])
        token_ids = encoded["input_ids"]

        return TokenizeResponse(text=request.text, tokens=tokens, token_ids=token_ids)
    except Exception as e:
        logger.error(f"Error tokenizing text: {str(e)}")
        raise HTTPException(status_code=500, detail="Error tokenizing text") from e


@router.get("/labels")
async def get_ner_labels() -> NERLabelsResponse:
    """Get all possible NER labels that the model can predict."""
    if not MODEL_INFO:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Get the id2label mapping from the model's config
        id2label: dict = MODEL_INFO["model"].config.id2label
        # Convert to list of unique labels, removing the B- and I- prefixes
        unique_labels = sorted(
            set(label[2:] for label in id2label.values() if label != "O")
        )

        return NERLabelsResponse(labels=unique_labels, total=len(unique_labels))

    except Exception as e:
        logger.error(f"Error getting NER labels: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Error retrieving NER labels"
        ) from e
