import "./lib/p5.min.js"


//Globals
let options = {}
let inferredTilesConfig, tilesConfig, tilesOptions;
let p5Instance;
let canvasSize, mapSize, cellSize, width, height, leastEntropyCells, lastCollapsedCell, collapsedCells
let preloadedImages = {};
let directions = {
    up: 0,
    right: 1,
    down: 2,
    left: 3
}

const tilesOptionsDefaults = {
    weights: false
}

let random;
let grid = []
function inferAllTileConfigs(tilesConfig) {
    let extrapolated = {};
    for (let tile of tilesConfig.tiles) {
        for (let i = 0; i < 4; i++) {
            const connections = tile.connections.rotate(-i)
            const connectionsString = connections.join("_")
            if (!extrapolated[connectionsString])
                extrapolated[connectionsString] = {
                    name: tile?.name ?? tile.img.split('.')[0],
                    img: `./tilesets/${options.tileSet}/${tile.img}`,
                    weight: tile.weight,
                    connections: connections,
                    rotate: i
                }
        }
    }
    return extrapolated;
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
            if (options.drawConfig == "states") {
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
    if (isUpdated && !cell.collapsed) {
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

function getRandomCellState(states) {
    // return random state  weighted

    if (!tilesOptions.weights) return states[random(0, states.length)]

    let sum = states.reduce((sum, state) => sum + tilesConfig[state].weight, 0);
    let randVal = random(0, sum);
    let current = 0;
    for (let state of states) {
        const tile = tilesConfig[state]
        current += tile.weight;
        if (randVal < current) {
            return state;
        }
    }

}

function collapseCell(cell) {
    if (!cell) return;
    if (cell.collapsed) return;

    switch (cell.states.length) {
        case 0:
            cell.states = [cell.state = -1];
            break;
        case 1:
            cell.state = cell.states[0];
            break;
        default:
            try {
                // const length = cell.states.length;
                // cell.states = [cell.state = cell.states[random(0, length)]];
                cell.states = [cell.state = getRandomCellState(cell.states)];

            } catch (error) {
                console.log(cell);
                console.error(error);
            }
            break;
    }
    //Remove cell from least entropy cells
    delete leastEntropyCells[cell.y + "_" + cell.x];
    lastCollapsedCell = [cell.x, cell.y];
    cell.collapsed = true;
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
window.times = []
function getLeastEntropyCell() {

    let leastEntropy = Infinity;
    let cells = [grid[random(0, mapSize)][random(0, mapSize)]];
    const leastEntropyCellsValues = Object.values(leastEntropyCells);
    for (let cell of leastEntropyCellsValues) {
        let entropy = getEntropy(cell);
        if (entropy < leastEntropy) {
            leastEntropy = entropy;
            cells = [cell];
        } else if (entropy == leastEntropy) {
            cells.push(cell);
        }
    }
    return cells[random(0, cells.length)];

}


async function run(newOptions) {
    const startTime = performance.now();

    options = newOptions ?? {};
    tilesConfig = await getJSONFile(`./tilesets/${options.tileSet}/config.json`);
    inferredTilesConfig = inferAllTileConfigs(tilesConfig);
    tilesOptions = Object.assign(tilesOptionsDefaults, tilesConfig.options)
    tilesConfig = Object.values(inferredTilesConfig);
    console.log(tilesConfig);
    preloadedImages = {};
    canvasSize = options.canvasSize
    mapSize = options.mapSize;
    cellSize = canvasSize / mapSize;
    [width, height] = [canvasSize, canvasSize]

    leastEntropyCells = {};
    lastCollapsedCell = [0, 0];
    collapsedCells = 0;

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

    random = options.useSeed ? (min = 0, max = 1) => rand.range(min, max) : (min = 0, max = 1) => Math.floor(Math.random() * (max - min) + min);
    grid = []
    for (let y = 0; y < mapSize; y++) { grid[y] = []; for (let x = 0; x < mapSize; x++) grid[y][x] = createCell(x, y) }


    let { instance, promise, resolve } = createP5Instance(options)
    p5Instance = instance;

    //Add pause / play / stop buttons
    //Buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttons-container");
    const pauseButton = document.createElement("button");
    pauseButton.innerText = "⏸";
    pauseButton.onclick = () => {
        if (p5Instance._loop) {
            p5Instance.noLoop();
            pauseButton.innerText = "▶️";
        }
        else {
            p5Instance.loop();
            pauseButton.innerText = "⏸";
        }
    }
    const stopButton = document.createElement("button");
    stopButton.innerText = "⏹";
    stopButton.onclick = () => {
        collapsedCells = mapSize * mapSize;
        p5Instance.noLoop();
        resolve();
    }

    buttonsContainer.appendChild(pauseButton);
    buttonsContainer.appendChild(stopButton);
    document.body.appendChild(buttonsContainer);


    window.p5Instance = p5Instance;
    let redrawEvery = options.updateFrequency ?? 10;
    let runsTillRedraw = redrawEvery;
    p5Instance.noUpdates = options.drawConfig == "finished" ?? false;
    p5Instance.redraw();
    await sleep(100);
    p5Instance.redraw();
    await sleep(100);

    let updateCanvas = options.drawConfig == "finished" ? () => { } : async () => {
        runsTillRedraw--
        if (runsTillRedraw != 0) return;
        await p5Instance.redraw();
        runsTillRedraw = redrawEvery;
        await sleep(0);
    }

    while (!isAllCollapsed()) {
        if (!p5Instance._loop) { await sleep(50); continue }
        collapseCell(getLeastEntropyCell());
        //Update neighbours
        let lastX = lastCollapsedCell[0];
        let lastY = lastCollapsedCell[1];
        // updateChain(lastX, lastY);
        updateNeighbors(lastX, lastY);
        // run updateAll until no more changes
        // updateChain(lastX, lastY)
        if (!options.lazyRuleChecking) while (updateAll());
        //Update canvas
        await updateCanvas();

    }

    p5Instance.noUpdates = false;
    p5Instance.redraw();

    resolve(true);


    await promise;
    const endTime = performance.now();
    console.log(`Time taken: ${endTime - startTime}ms`);
    return new Promise((resolve, reject) => {
        //Remove buttons
        document.querySelector(".buttons-container").innerHTML = "";
        //Add Reset button
        const resetButton = document.createElement("button");
        resetButton.innerText = "Reset";
        resetButton.onclick = async () => {
            p5Instance.remove();
            document.querySelector(".buttons-container").remove();
            await run(options);
            resolve();
        }
        //Add back button
        const backButton = document.createElement("button");
        backButton.innerText = "Discard";
        backButton.onclick = () => {
            document.querySelector(".buttons-container").remove();
            p5Instance.remove();
            resolve();
        }
        document.querySelector(".buttons-container").appendChild(backButton);
        document.querySelector(".buttons-container").appendChild(resetButton);
    });
}

const createP5Instance = function (options) {
    //Remove old instance
    if (p5Instance) p5Instance.remove();
    let instance, resolvePromise;
    let promise = new Promise((resolve, reject) => {
        resolvePromise = resolve;
        const p5InstanceConfig = (s) => {
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
                //Increase fps
                s.frameRate(120);
            }

            s.draw = function () {
                //Reset
                s.noStroke();
                s.background(255);

                if (s.noUpdates) {
                    p5Instance.textAlign(p5Instance.CENTER, p5Instance.CENTER);
                    p5Instance.textSize(32);
                    p5Instance.text("Generating...", width / 2, height / 2);
                    p5Instance.textSize(16);
                    p5Instance.text("Live updates are disabled", width / 2, height / 2 + 32);
                    return;
                }

                //If drawConfig is percentages draw only when isAllCollapsed, otherwise draw every frame
                if (options.drawConfig != "percentages" || (options.drawConfig == "percentages" && isAllCollapsed()))
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
            }
        }
        instance = new p5(p5InstanceConfig);
    });
    return { instance: instance, promise: promise, resolve: resolvePromise };
}

export default run