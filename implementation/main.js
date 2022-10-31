//Imports
import "./lib/polyfill.js";
import "./lib/utils.js";
import "./lib/p5.min.js"


const options = {
    tileSet: "circuit",
    size: 30,
    drawCellStates: false,
    drawWhenFinished: false,
    useSeed: false,
    seed: 2
}

let tilesConfig = await getJSONFile(`./tilesets/${options.tileSet}/config.json`);
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
const mapSize = options.size ?? 10;
const cellSize = canvasSize / mapSize;
const [width, height] = [canvasSize, canvasSize]

let leastEntropyCells = {};
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

const rand = Math.randomSeed(options.seed, {
    maxDecimals: 0,
})

window.random = options.useSeed ? (min, max) => rand.range(min, max) : (min, max) => Math.floor(Math.random() * (max - min) + min);

function inferAllTileConfigs(tilesConfig) {
    let extrapolated = {};
    for (let tile of tilesConfig) {
        for (let i = 0; i < 4; i++) {
            const connections = tile.connections.rotate(-i)
            const connectionsString = connections.join("_")
            if (!extrapolated[connectionsString])
                extrapolated[connectionsString] = {
                    name: tile?.name ?? tile.img.split('.')[0],
                    img: `./tilesets/${options.tileSet}/${tile.img}`,
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
        // s.noLoop();
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
            // updateChain(lastX, lastY);
            updateNeighbors(lastX, lastY);
            // run updateAll until no more changes
            // updateChain(lastX, lastY)
            while (updateAll());

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
                if (cell.state == -1) {
                    // draw rect and continue
                    s.fill(0);
                    s.rect(x * cellSize, y * cellSize, cellSize, cellSize);
                    continue;
                }
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
    s.fill(255);
    s.stroke(1);
    s.textSize(16);
    s.textAlign("right", "bottom")
    s.text(`${y}, ${x}`, canvasSize - 15, canvasSize - 15);
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
    if (stateA == -1 || stateB == -1) return true;
    const tileA = tilesConfig[stateA];
    const tileB = tilesConfig[stateB];
    let valA = tileA.connections[direction];
    let valB = tileB.connections[getOppositeDirection(direction)];
    valB = typeof valB == "object" ? valB.value : valB

    if (typeof valA == "object") {
        let allowedTiles = valA.tiles;
        valA = valA.value;
        // if (tileA.name == "connection" && tileB.name == "connection")
        // console.log(valA == valB, allowedTiles.includes(tileB.name));
        return valA === valB && allowedTiles.includes(tileB.name);
    }
    return valA === valB;
}


function getNeighbors(x, y, collapsed = "all") {
    let neighbors = [];
    if (y > 0) neighbors.push(grid[y - 1][x]);
    if (x < mapSize - 1) neighbors.push(grid[y][x + 1]);
    if (y < mapSize - 1) neighbors.push(grid[y + 1][x]);
    if (x > 0) neighbors.push(grid[y][x - 1]);

    return neighbors.filter(n => collapsed == "all" || n.collapsed === collapsed);
}


function updateChain(x, y) {
    if (grid[y][x].collapsed) return;
    // Update get status of x,y neighbors and update x,y.
    // After that check if neighbors changed and run the same function for each changed neighbor

    let neighbors = getNeighbors(x, y, false)
    updateNeighbors(x, y)
    for (let cell of neighbors) {
        if (cell.state != grid[cell.y][cell.x]) updateChain(cell.x, cell.y)
    }

}

window.updateNeighbors = function (x, y) {
    updateCell(x, y - 1);
    updateCell(x + 1, y);
    updateCell(x, y + 1);
    updateCell(x - 1, y);
}

window.updateCell = function (x, y) {
    //Check if cell is collapsed
    if (!isValidCell(x, y)) return;
    if (grid[y][x].collapsed) return;
    const cell = grid[y][x];
    const statesLength = cell.states.length;
    //Get all neighbors
    const neighbors = [
        [x, y - 1, directions.up],
        [x + 1, y, directions.right],
        [x, y + 1, directions.down],
        [x - 1, y, directions.left]
    ]

    //Remove all states that are not possible
    for (let neighbor of neighbors) {
        let [nx, ny, direction] = neighbor;
        if (!isValidCell(nx, ny)) continue;
        let neighborCell = grid[ny][nx];
        cell.states = (neighborCell.collapsed) ?
            cell.states = cell.states.filter(state => isRuleFollowed(state, neighborCell.state, direction))
            :
            cell.states = cell.states.filter(state => neighborCell.states.some(neighborState => isRuleFollowed(state, neighborState, direction)));
    }
    if (cell.states.length == 1) collapseCell(cell);
    const isUpdated = cell.states.length != statesLength;
    if (isUpdated) {
        leastEntropyCells[cell.y + "_" + cell.x] = cell
    }
    return { cell: cell, updated: isUpdated };
}

window.updateAll = function () {
    let updated = false;
    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            let uc = updateCell(x, y) ?? false
            if (uc.updated) updated = true;
        }
    }
    return updated;
}

function isValidCell(x, y) {
    if (x < 0 || x >= mapSize || y < 0 || y >= mapSize) return false;
    // const cell = grid[y][x];
    // if (cell.collapsed && cell.state != null) return false;
    return true
}

window.collapseCell = function (cell) {
    if (!cell) return;
    if (cell.collapsed) return;

    if (cell.states.length == 0) {
        //Set to -1 to indicate that this cell is not possible
        cell.states = [cell.state = -1];
    }

    if (cell.states.length == 1) {
        cell.state = cell.states[0];
        cell.collapsed = true;
        lastCollapsedCell = [cell.x, cell.y];
    }
    try {
        cell.collapsed = true;
        const length = cell.states.length;
        cell.states = [cell.state = cell.states[random(0, length)]];
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
    const gridFlat = grid.flat()
    let leastEntropy = gridFlat.reduce((a, b) => Math.max(2, getEntropy(a)) > Math.max(2, getEntropy(b)) ? b : a).states.length;
    let leastEntropyCells = gridFlat.filter(cell => getEntropy(cell) == leastEntropy);
    return leastEntropyCells[random(0, length)];


    // let cells = Object.values(leastEntropyCells)
    // if (cells.length == 0)
    //     return grid[random(0, mapSize)][random(0, mapSize)];
    // let leastEntropy = cells.reduce((a, b) => getEntropy(a) > getEntropy(b) ? b : a).states.length;
    // cells = cells.filter(cell => getEntropy(cell) == leastEntropy);
    // const length = cells.length;
    // // console.log(length);
    // return cells[random(0, length)];
}

window.p5Instance = new p5(p5Instance);
