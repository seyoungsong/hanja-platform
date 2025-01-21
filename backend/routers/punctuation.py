from contextlib import asynccontextmanager
from enum import Enum
from typing import AsyncIterator, Dict, List, Tuple

import tool.punc as spunc
from fastapi import APIRouter, FastAPI, HTTPException
from loguru import logger
from pydantic import BaseModel
from transformers import BertTokenizerFast

# Global variables to store model and tokenizer
MODEL_INFO = None


class PunctuationStyle(str, Enum):
    SIMPLE = "Simple"
    SIMPLE_WITH_SPACE = "Simple (w/ space)"
    COMPREHENSIVE = "Comprehensive"

    @property
    def settings(self) -> Tuple[bool, bool]:
        """Get add_space and reduce settings for the style."""
        settings_map = {
            self.SIMPLE: (False, True),
            self.SIMPLE_WITH_SPACE: (True, True),
            self.COMPREHENSIVE: (True, False),
        }
        return settings_map[self]


class PuncLabelInfo(BaseModel):
    label: str
    punctuation: str


class PuncRequest(BaseModel):
    texts: List[str]
    style: PunctuationStyle = PunctuationStyle.COMPREHENSIVE


class PuncResult(BaseModel):
    original: str
    punctuated: str


class PuncResponse(BaseModel):
    results: List[PuncResult]


class TokenizeRequest(BaseModel):
    text: str
    add_special_tokens: bool = True


class TokenizeResponse(BaseModel):
    text: str
    tokens: List[str]
    token_ids: List[int]


@asynccontextmanager
async def lifespan_punc(app: FastAPI) -> AsyncIterator[None]:
    logger.debug("Loading punctuation model...")
    global MODEL_INFO
    try:
        MODEL_INFO = spunc.load_model(model_path=spunc.MODEL_PATH, device="cpu")
        logger.debug("Punctuation model loaded successfully")
        yield
    finally:
        # Cleanup
        MODEL_INFO = None
        logger.debug("Punctuation model unloaded")


router = APIRouter(prefix="/punc", tags=["Punctuation Restoration"])


@router.post("/predict")
async def restore_punctuation(request: PuncRequest) -> PuncResponse:
    """Restore punctuation in the given texts."""
    if not MODEL_INFO:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not request.texts or not any(text.strip() for text in request.texts):
        return PuncResponse(results=[])

    # Get style settings directly from the enum
    add_space, reduce = request.style.settings

    try:
        # Process texts in batch
        punctuated_texts = spunc.predict_batch(
            texts=request.texts,
            model_info=MODEL_INFO,
            add_space=add_space,
            reduce=reduce,
        )

        # Combine results
        results = [
            PuncResult(original=original, punctuated=punctuated)
            for original, punctuated in zip(request.texts, punctuated_texts)
        ]

        return PuncResponse(results=results)

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


@router.post("/remove-punctuation")
async def remove_punctuation(texts: List[str]) -> List[str]:
    """Remove punctuation from the given texts."""
    return [spunc.remove_punc(text) for text in texts]


@router.get("/styles")
async def get_available_styles() -> List[PunctuationStyle]:
    """Get available punctuation styles."""
    return list(PunctuationStyle)


@router.get("/labels")
async def get_punctuation_labels() -> List[PuncLabelInfo]:
    """Get available punctuation labels that the model can restore."""
    if not MODEL_INFO:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        label2id: Dict[str, int] = MODEL_INFO["label2id"]
        # Convert the label2id dictionary to a list of PuncLabelInfo objects
        # The labels in label2id are the actual punctuation marks
        labels = [
            PuncLabelInfo(label=f"B-{label_id}", punctuation=label)
            for label, label_id in label2id.items()
        ]
        # Add the "O" label which represents no punctuation
        labels.append(PuncLabelInfo(label="O", punctuation=""))
        return labels
    except Exception as e:
        logger.error(f"Error getting punctuation labels: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Error retrieving punctuation labels"
        ) from e
