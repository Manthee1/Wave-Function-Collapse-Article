//Imports
import "./lib/polyfill.js";
import "./lib/utils.js";
import "./lib/p5.min.js"


const options = {
    drawCellStates: false,
    drawWhenFinished: false,
    useSeed: false,
    seed: 45
}

let tilesConfig = await getJSONFile("tiles.config.json");
const inferredTilesConfig = inferAllTileConfigs(tilesConfig);
tilesConfig = Object.values(inferredTilesConfig);
const directions = {
    up: 0,
    right: 1,
    down: 2,
    left: 3
}
const preloadedImages = {};
const canvasSize = 800;
const mapSize = 20;
const cellSize = canvasSize / mapSize;
const [width, height] = [canvasSize, canvasSize]

let lastCollapsedCell = [0, 0];
let collapsedCells = 0;

const defaultCell = {
    collapsed: false,
    state: null,
    states: Array.from({ length: tilesConfig.length }, (_, i) => i),
}

function createCell(x, y) {
    return {
        ...defaultCell,
        x,
        y
    }
}

let random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);


if (options.useSeed) {
    const rand = Math.randomSeed(options.seed, {
        maxDecimals: 0,
    });
    random = (min, max) => rand.range(min, max);
}

function inferAllTileConfigs(tilesConfig) {
    let extrapolated = {};
    for (let tile of tilesConfig) {
        for (let i = 0; i < 4; i++) {
            const connections = tile.connections.rotate(-i)
            const connectionsString = connections.join("_")
            if (!extrapolated[connectionsString])
                extrapolated[connectionsString] = {
                    img: tile.img,
                    connections: connections,
                    rotate: i
                }
        }
    }
    return extrapolated;
}

window.grid = []
for (let y = 0; y < mapSize; y++) { grid[y] = []; for (let x = 0; x < mapSize; x++) grid[y][x] = createCell(x, y) }


const p5Instance = (s) => {
    s.preload = () => {
        for (let tile of tilesConfig) {
            let img = s.loadImage(tile.img);
            //Resize image
            img.resize(cellSize, cellSize);
            preloadedImages[tile.img] = img
        };
    }
    s.setup = function () {
        s.createCanvas(canvasSize, canvasSize);
    }

    s.draw = function () {
        //Reset
        s.noStroke();
        s.background(255);

        if (!isAllCollapsed()) {
            collapseCell(getLeastEntropyCell());
            //Update neighbours
            let lastX = lastCollapsedCell[0];
            let lastY = lastCollapsedCell[1];
            updateCell(lastX, lastY - 1);
            updateCell(lastX + 1, lastY);
            updateCell(lastX, lastY + 1);
            updateCell(lastX - 1, lastY);

        }
        else s.noLoop();

        //If drawWhenFinished is true draw only when isAllCollapsed, otherwise draw every frame
        if (!options.drawWhenFinished || options.drawWhenFinished == isAllCollapsed())
            drawGrid(s);
        else {
            //Draw percent finished
            s.fill(0);
            s.stroke(1);
            s.textSize(16);
            s.textAlign("center", "center")
            s.text(`${Math.floor(collapsedCells / (mapSize * mapSize) * 100)}%`, canvasSize / 2, canvasSize / 2);
            s.noStroke(0);
            s.text(`Generating`, canvasSize / 2, canvasSize / 2 - 32);
        }

        drawMousePosition(s)
    }
}

function drawGrid(s) {
    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            let cell = grid[y][x];
            if (cell.collapsed) {
                let tileConfig = tilesConfig[cell.state];
                drawImg(preloadedImages[tileConfig.img], x * cellSize, y * cellSize, cellSize, cellSize, tileConfig.rotate, s);
                continue;
            }
            s.fill(220);
            s.stroke(0);
            s.rect(x * cellSize, y * cellSize, cellSize, cellSize);
            if (options.drawCellStates) {
                //Draw states in a grid
                let states = cell.states;
                let rows = Math.ceil(Math.sqrt(states.length));
                let cols = Math.ceil(states.length / rows);
                let size = cellSize / Math.max(rows, cols);
                for (let i = 0; i < states.length; i++) {
                    let tileConfig = tilesConfig[states[i]];
                    let row = Math.floor(i / cols);
                    let col = i % cols;
                    let newX = col * cellSize / cols + x * cellSize;
                    let newY = row * cellSize / rows + y * cellSize;
                    drawImg(preloadedImages[tileConfig.img], newX, newY, size, size, tileConfig.rotate, s);
                }
            }
        }
    }

    s.push();
    s.stroke(0);
    s.strokeWeight(2);
    s.noFill();
    s.rect(0, 0, width, height);
    s.pop();
}

function drawMousePosition(s) {
    let x = Math.floor(s.mouseX / cellSize);
    let y = Math.floor(s.mouseY / cellSize);
    //Draw mouse position
    s.fill(0, 0, 255);
    s.noFill();
    s.stroke(255);
    s.rect(x * cellSize, y * cellSize, cellSize, cellSize);
    //Text bottom right
    s.fill(0);
    s.noStroke();
    s.textSize(16);
    s.textAlign("right", "bottom")
    s.text(`${x}, ${y}`, canvasSize - 15, canvasSize - 15);
}

function drawImg(img, x, y, width, height, angle, s) {
    s.push();
    s.imageMode(s.CENTER);
    s.translate(x + width / 2, y + width / 2);
    s.rotate(angle * Math.PI / 2);
    s.image(img, 0, 0, width, height);
    s.pop();
}


function getOppositeDirection(direction) {
    return (direction + 2) % 4;
}

function isRuleFollowed(stateA, stateB, direction) {
    const tileA = tilesConfig[stateA];
    const tileB = tilesConfig[stateB];
    return tileA.connections[direction] === tileB.connections[getOppositeDirection(direction)];
}

window.updateCell = function (x, y) {
    //Check if cell is collapsed
    if (!isValidCell(x, y)) return;
    if (grid[y][x].collapsed) return;
    const cell = grid[y][x];
    //Get all neighbours
    const neighbours = [
        [x, y - 1, directions.up],
        [x + 1, y, directions.right],
        [x, y + 1, directions.down],
        [x - 1, y, directions.left]
    ]

    //Remove all states that are not possible
    for (let neighbour of neighbours) {
        let [nx, ny, direction] = neighbour;
        if (!isValidCell(nx, ny)) continue;
        let neighbourCell = grid[ny][nx];
        cell.states = (neighbourCell.collapsed) ?
            cell.states = cell.states.filter(state => isRuleFollowed(state, neighbourCell.state, direction))
            :
            cell.states = cell.states.filter(state => neighbourCell.states.some(neighbourState => isRuleFollowed(state, neighbourState, direction)));
    }
    if (cell.states.length == 1) collapseCell(cell);
    return cell
}

window.updateAll = function () {
    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            updateCell(x, y);
        }
    }
}

function isValidCell(x, y) {
    const isValid = x >= 0 && x < mapSize && y >= 0 && y < mapSize
    return isValid
}

window.collapseCell = function (cell) {
    if (!cell) return;
    if (cell.collapsed) return;
    if (cell.states.length == 1) {
        cell.state = cell.states[0];
        cell.collapsed = true;
        lastCollapsedCell = [cell.x, cell.y];
    }
    try {
        cell.collapsed = true;
        const length = cell.states.length;
        cell.states = [cell.state = cell.states[random(0, length - 1)]];
    } catch (error) {
        console.log(cell);
        console.error(error);
    }
    lastCollapsedCell = [cell.x, cell.y];
    collapsedCells++
}

function isAllCollapsed() {
    return collapsedCells == mapSize * mapSize;
    // return grid.flat().every(cell => cell.collapsed);
}


function getEntropy(cell) {
    if (cell.collapsed) return Infinity
    return cell.states.length
}

window.getLeastEntropyCell = function () {
    let leastEntropy = grid.flat().reduce((a, b) => getEntropy(a) > getEntropy(b) ? b : a).states.length;
    let leastEntropyCells = grid.flat().filter(cell => getEntropy(cell) == leastEntropy);

    const length = leastEntropyCells.length;
    return leastEntropyCells[random(0, length - 1)];
}

window.p5Instance = new p5(p5Instance);
