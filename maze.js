const maze = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
];
const player = { row: 1, col: 1 };
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const CELL = 40;
const exit = { row: 6, col: 6 };

function drawMaze() {
    for (let row = 0; row < maze.length; row++) {
        for (let col = 0; col < maze[row].length; col++) {
            ctx.fillStyle = maze[row][col] === 1 ? '#2a3340' : '#e8e8e8';
            ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(player.col * CELL + CELL / 2, player.row * CELL + CELL / 2, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'green';
            ctx.fillRect(exit.col * CELL + 8, exit.row * CELL + 8, CELL - 16, CELL - 16);
        }
    }
}

drawMaze();
function tryMove(deltaRow, deltaCol) {
    const newRow = player.row + deltaRow;
    const newCol = player.col + deltaCol;

    if (maze[newRow][newCol] === 0) {
        player.row = newRow;
        player.col = newCol;
        drawMaze();
        if (player.row === exit.row && player.col === exit.col) {
            alert('Level Complete!');
        }
    }
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowUp') tryMove(-1, 0);
    else if (event.key === 'ArrowDown') tryMove(1, 0);
    else if (event.key === 'ArrowLeft') tryMove(0, -1);
    else if (event.key === 'ArrowRight') tryMove(0, 1);
});