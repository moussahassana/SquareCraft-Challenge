from typing import Dict, List, Tuple, Optional
from utils import get_possible_moves, apply_move, get_score, is_game_over

def evaluate(dots: Dict[str, str], player: str, opponent: str, size: int) -> int:
    """Evaluation function: (my_score - opponent_score)."""
    return get_score(dots, player, size) - get_score(dots, opponent, size)

def minimax(dots: Dict[str, str], depth: int, alpha: float, beta: float, is_maximizing: bool, 
            player: str, opponent: str, size: int) -> float:
    """Minimax algorithm with Alpha-Beta pruning."""
    if depth == 0 or is_game_over(dots, size):
        return evaluate(dots, player, opponent, size)

    possible_moves = get_possible_moves(dots, size)
    
    if is_maximizing:
        max_eval = float('-inf')
        for move in possible_moves:
            new_dots = apply_move(dots, move, player)
            eval = minimax(new_dots, depth - 1, alpha, beta, False, player, opponent, size)
            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break
        return max_eval
    else:
        min_eval = float('inf')
        for move in possible_moves:
            new_dots = apply_move(dots, move, opponent)
            eval = minimax(new_dots, depth - 1, alpha, beta, True, player, opponent, size)
            min_eval = min(min_eval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break
        return min_eval

def get_best_move(dots: Dict[str, str], player: str, opponent: str, size: int, depth: int = 2) -> Tuple[int, int]:
    """Returns the best move using the minimax algorithm."""
    best_move = None
    max_eval = float('-inf')
    possible_moves = get_possible_moves(dots, size)

    # To improve performance on larger grids, limit the number of moves considered
    # For now, let's keep it simple. If it's too slow, we can prioritize moves.
    
    for move in possible_moves:
        new_dots = apply_move(dots, move, player)
        eval = minimax(new_dots, depth - 1, float('-inf'), float('inf'), False, player, opponent, size)
        if eval > max_eval:
            max_eval = eval
            best_move = move
            
    # Fallback if no moves are found (should not happen unless game over)
    if best_move is None and possible_moves:
        return possible_moves[0]
        
    return best_move
