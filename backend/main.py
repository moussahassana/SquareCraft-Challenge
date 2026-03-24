from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Tuple
import os
from agent import AIAgent

app = FastAPI(title="SquareCraft AI Backend")

# Enable CORS for frontend interaction
# Allow both local and production origins
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MoveRequest(BaseModel):
    dots: Dict[str, str]
    current_player: str
    size: int

class MoveResponse(BaseModel):
    x: int
    y: int

# Initialize global AI agent
agent = AIAgent()

@app.post("/move", response_model=MoveResponse)
async def get_move(request: MoveRequest):
    """Calculates the best move for the current player."""
    x, y = agent.get_best_move(request.dots, request.current_player, request.size)
    return MoveResponse(x=x, y=y)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
