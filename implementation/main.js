//Imports
import "./lib/polyfill.js";
import "./lib/utils.js";
import "./lib/p5.min.js"

const tilesConfig = await getJSONFile("tiles.config.json");
const inferredTilesConfig = inferAllTileConfigs(tilesConfig);
const preloadedImages = {};
const canvasSize = 2000;
const mapSize = 40;
const cellSize = canvasSize / mapSize;
const [width, height] = [canvasSize, canvasSize]

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

function inferAllTileConfigs(tilesConfig) {
    let extrapolated = {};
    for (let tile of tilesConfig) {
        for (let i = 0; i < 4; i++) {
            const connections = tile.connections.rotate(i)
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
        s.noLoop();
    }

    s.draw = function () {
        //Reset
        s.noStroke();
        s.background(255);

        if (!isAllCollapsed())
            collapseCell(getLeastEntropyCell());
        else s.noLoop();


        drawGrid(s);
        drawMousePosition(s)
    }
}

function drawGrid(s) {
    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            let cell = grid[y][x];
            if (cell.collapsed) {
                let tileConfig = Object.values(inferredTilesConfig)[cell.state];
                drawImg(preloadedImages[tileConfig.img], x * cellSize, y * cellSize, cellSize, cellSize, tileConfig.rotate, s);
                continue;
            }
            s.fill(220);
            s.stroke(0);
            s.rect(x * cellSize, y * cellSize, cellSize, cellSize);

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

            //Draw state amount
            s.noStroke(0);
            s.fill(0);
            s.textSize(cellSize / 4);
            s.textAlign("right", "bottom")
            s.text(cell.states.length, (x + 1) * cellSize - 5, (y + 1) * cellSize - 5);

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









function collapseCell(cell) {
    console.log("collapse");
    cell.collapsed = true;
    cell.states = [cell.state = cell.states.random()];
}

function isAllCollapsed() {
    return grid.flat().every(cell => cell.collapsed);
}


function getEntropy(cell) {
    if (cell.collapsed) return Infinity
    return cell.states.length
}




function getLeastEntropyCell() {
    let leastEntropy = grid.flat().reduce((a, b) => getEntropy(a) > getEntropy(b) ? b : a).states.length;
    let leastEntropyCells = grid.flat().filter(cell => getEntropy(cell) == leastEntropy);
    return leastEntropyCells.random() ?? null;
}

new p5(p5Instance);
