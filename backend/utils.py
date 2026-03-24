import copy
from typing import Dict, List, Tuple, Set

def key(x: int, y: int) -> str:
    return f"{x},{y}"

def get_possible_moves(dots: Dict[str, str], size: int) -> List[Tuple[int, int]]:
    """Returns a list of all empty intersections where a dot can be placed.
    To optimize, we only return moves adjacent to existing dots."""
    if not dots:
        # If the board is empty, only return the center to speed up the first move
        center = size // 2
        return [(center, center)]

    possible_moves = set()
    for dot_key in dots.keys():
        x, y = map(int, dot_key.split(','))
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                nx, ny = x + dx, y + dy
                if 0 <= nx <= size and 0 <= ny <= size:
                    if key(nx, ny) not in dots:
                        possible_moves.add((nx, ny))
    
    # If for some reason no adjacent moves are found, return all empty moves
    if not possible_moves:
        all_moves = []
        for x in range(size + 1):
            for y in range(size + 1):
                if key(x, y) not in dots:
                    all_moves.append((x, y))
        return all_moves
        
    return list(possible_moves)

def check_square(dots: Dict[str, str], x: int, y: int, player: str, size: int) -> int:
    """Checks how many new squares are formed by placing a dot at (x, y)."""
    new_squares = 0
    # Potential squares that include (x, y) as one of their corners
    # (x,y) could be Top-Left, Top-Right, Bottom-Left, or Bottom-Right
    offsets = [
        (0, 0),   # (x,y) is Top-Left
        (-1, 0),  # (x,y) is Top-Right
        (0, -1),  # (x,y) is Bottom-Left
        (-1, -1)  # (x,y) is Bottom-Right
    ]

    for dx, dy in offsets:
        ax, ay = x + dx, y + dy
        bx, by = ax + 1, ay
        cx, cy = ax, ay + 1
        dx2, dy2 = ax + 1, ay + 1

        if (ax >= 0 and ay >= 0 and bx <= size and dy2 <= size):
            # Check if all four corners are owned by the same player
            # Note: We assume the dot at (x, y) is already placed or being considered for 'player'
            if (dots.get(key(ax, ay)) == player and
                dots.get(key(bx, by)) == player and
                dots.get(key(cx, cy)) == player and
                dots.get(key(dx2, dy2)) == player):
                new_squares += 1
    return new_squares

def apply_move(dots: Dict[str, str], move: Tuple[int, int], player: str) -> Dict[str, str]:
    """Returns a new state with the move applied."""
    new_dots = dots.copy()
    new_dots[key(move[0], move[1])] = player
    return new_dots

def get_score(dots: Dict[str, str], player: str, size: int) -> int:
    """Calculates the total score for a player in the current state."""
    score = 0
    # Iterate through all possible 1x1 squares
    for x in range(size):
        for y in range(size):
            if (dots.get(key(x, y)) == player and
                dots.get(key(x + 1, y)) == player and
                dots.get(key(x, y + 1)) == player and
                dots.get(key(x + 1, y + 1)) == player):
                score += 1
    return score

def is_game_over(dots: Dict[str, str], size: int) -> bool:
    """Returns True if the grid is full."""
    return len(dots) >= (size + 1) * (size + 1)
