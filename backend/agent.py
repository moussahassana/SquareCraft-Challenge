from typing import Dict, Tuple, List
from minimax import get_best_move as get_minimax_move
from qlearning import QLearningAgent
from utils import check_square, apply_move

class AIAgent:
    def __init__(self):
        self.rl_agent = QLearningAgent()

    def get_best_move(self, dots: Dict[str, str], player: str, size: int) -> Tuple[int, int]:
        """Orchestrates decision by combining Minimax + Q-learning."""
        opponent = self.get_opponent(dots, player)
        
        # 1. Get the best move using Minimax
        # Use depth 2 or 3 as suggested
        best_move = get_minimax_move(dots, player, opponent, size, depth=2)
        
        # 2. Learn from this move (Update Q-learning agent)
        self.learn_from_move(dots, best_move, player, size)
        
        return best_move

    def get_opponent(self, dots: Dict[str, str], player: str) -> str:
        # We'll just infer it from the dots or assume there are only two colors
        players = set(dots.values())
        if player in players:
            players.remove(player)
        if players:
            return list(players)[0]
        # Default opponent based on the expected names from the frontend
        return "player1" if player == "player2" else "player2"

    def learn_from_move(self, dots: Dict[str, str], move: Tuple[int, int], player: str, size: int):
        """Simple learning update based on the chosen move."""
        state_key = self.rl_agent.get_state_key(dots, move[0], move[1], player, size)
        
        # Reward calculation: apply move first to check for squares correctly
        new_dots = apply_move(dots, move, player)
        num_squares = check_square(new_dots, move[0], move[1], player, size)
        reward = -1
        if num_squares > 0:
            reward = 10 * num_squares
            
        # Simplified: next state key is the same state for now
        next_state_key = state_key 
        
        self.rl_agent.update_q_value(state_key, reward, next_state_key)
