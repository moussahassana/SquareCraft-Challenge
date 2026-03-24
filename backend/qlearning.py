import json
import os
import tempfile
import redis
from typing import Dict, List, Tuple, Any
from dotenv import load_dotenv

load_dotenv()

class QLearningAgent:
    def __init__(self, alpha: float = 0.1, gamma: float = 0.9, epsilon: float = 0.1):
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        
        # Redis configuration for free deployment (e.g., Upstash)
        self.redis_url = os.getenv("REDIS_URL")
        self.redis_client = None
        
        if self.redis_url:
            try:
                self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
                print("Using Redis for AI knowledge base")
            except Exception as e:
                print(f"Failed to connect to Redis: {e}. Falling back to local file.")

        if not self.redis_client:
            # Local mode (JSON file)
            temp_dir = tempfile.gettempdir()
            self.filename = os.path.join(temp_dir, "squarecraft_ai_q_table.json")
            print(f"Using local file for AI knowledge base: {self.filename}")
        
        self.q_table = self.load_q_table()

    def load_q_table(self) -> Dict[str, float]:
        if self.redis_client:
            try:
                # Redis stores everything as strings, fetch the entire hash
                return {k: float(v) for k, v in self.redis_client.hgetall("q_table").items()}
            except:
                return {}
        
        if os.path.exists(self.filename):
            try:
                with open(self.filename, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def save_q_table(self):
        # We don't save the entire dictionary to Redis every time
        # We use update_q_value to save only the modified key
        if not self.redis_client:
            with open(self.filename, 'w') as f:
                json.dump(self.q_table, f)

    def get_state_key(self, dots: Dict[str, str], x: int, y: int, player: str, size: int) -> str:
        """Returns a string representation of the local 3x3 area around (x, y)."""
        state = []
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                nx, ny = x + dx, y + dy
                if 0 <= nx <= size and 0 <= ny <= size:
                    occupant = dots.get(f"{nx},{ny}", "empty")
                    if occupant == player:
                        state.append("1")
                    elif occupant == "empty":
                        state.append("0")
                    else:
                        state.append("2") # Opponent
                else:
                    state.append("-1") # Out of bounds
        return ",".join(state)

    def get_q_value(self, state_key: str) -> float:
        return self.q_table.get(state_key, 0.0)

    def update_q_value(self, state_key: str, reward: float, next_state_key: str):
        current_q = self.get_q_value(state_key)
        max_next_q = self.get_q_value(next_state_key) # Simplified, should look ahead properly
        new_q = current_q + self.alpha * (reward + self.gamma * max_next_q - current_q)
        self.q_table[state_key] = new_q
        
        if self.redis_client:
            try:
                self.redis_client.hset("q_table", state_key, str(new_q))
            except:
                pass
        else:
            self.save_q_table()

    def get_best_move_from_rl(self, dots: Dict[str, str], player: str, size: int, possible_moves: List[Tuple[int, int]]) -> Tuple[int, int]:
        """Returns the move with the highest Q-value."""
        best_move = possible_moves[0]
        max_q = float('-inf')

        for move in possible_moves:
            state_key = self.get_state_key(dots, move[0], move[1], player, size)
            q_val = self.get_q_value(state_key)
            if q_val > max_q:
                max_q = q_val
                best_move = move
        
        return best_move
