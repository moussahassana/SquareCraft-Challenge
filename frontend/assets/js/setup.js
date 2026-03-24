const startBtn = document.getElementById('startBtn');
const player1Input = document.getElementById('player1Input');
const player2Input = document.getElementById('player2Input');
const gridSizeSelect = document.getElementById('gridSizeSelect');
const player1ColorInput = document.getElementById('player1Color');
const player2ColorInput = document.getElementById('player2Color');
const player2Section = document.getElementById('player2Section');
const gameModeRadios = document.getElementsByName('gameMode');

gameModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'pva') {
            player2Section.classList.add('hidden');
        } else {
            player2Section.classList.remove('hidden');
        }
    });
});

player1Input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') player2Input.focus();
});

player2Input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startGame();
});

function startGame() {
    const player1Name = (player1Input.value.trim() || 'Player 1').substring(0, 20);
    let player2Name = (player2Input.value.trim() || 'Player 2').substring(0, 20);
    const selectedMode = document.querySelector('input[name="gameMode"]:checked').value;
    const size = parseInt(gridSizeSelect.value, 10);

    if (selectedMode === 'pva') {
        player2Name = 'SquareCraft AI';
    }

    const config = {
        player1Name,
        player2Name,
        player1Color: player1ColorInput.value,
        player2Color: player2ColorInput.value,
        gameMode: selectedMode,
        size: size
    };

    localStorage.setItem('squarecraft_config', JSON.stringify(config));
    window.location.href = 'game.html';
}

startBtn.addEventListener('click', (e) => {
    e.preventDefault();
    startGame();
});
