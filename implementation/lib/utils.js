/**
 * Fetches the given config 
 * @param {String} name 
 * @returns {Object} Config
 */

window.getJSONFile = async function (path) {
    let request = await fetch(path)
    //Check if request is successful
    if (!request.ok) throw new Error(request.statusText);
    return await request.json();
}

/**
 * Parses the given strings into a path ('path','to/','/something/') => "path/to/something"
 * @param {String} args
 * @returns {String} Path
 */
window.parseToPath = function (...args) {
    let path = '';
    for (let i = 0; i < args.length; i++) {
        //Trim the string and remove any '/' at the beginning or end of the string
        args[i] = args[i].trim();
        if (args[i].startsWith('/')) args[i] = args[i].substring(1);
        if (args[i].endsWith('/')) args[i] = args[i].substring(0, args[i].length - 1);
        //If the string is not empty, add it to the path
        if (args[i] != '') path += '/' + args[i];
    }
    return path;
}

window.clone = function (obj) {
    if (Array.isArray(obj)) return obj.slice();
    return JSON.parse(JSON.stringify(obj));
}

// Get ellipse function
window.getEllipseFunction = function (eccentricity, angle = 0) {
    //All points  are on the x axis with y=0
    const a = 0;
    const b = eccentricity >= 1 ? 1 : eccentricity;
    const c = 1;

    //b of 0 creates x^2 + y^2 = 1
    //b of 0.25 creates 12x^2 + 12.25y^2 - 3x=9
    //b of 0.5 creates 8x^2 + 9y^2 - 4x=4
    //b of 0.75 creates 4x^2 + 6.25y^2 -3x=1

    const multX = (16 * (1 - b)).round(4)
    const multY = ((2 * (1 - b) + 2) ** 2).round(4)
    const addX = (-16 * b ** 2 + 16 * b).round(4)
    const res = ((4 * (1 - b)) ** 2).round(4)
    // return `${multX}x^2 + ${multY}y^2 - ${addX}x = ${res}`

    return function (percentage) {
        //Return x and y based on percentage of completion of the ellipse
        let xPercent = -2 * Math.abs(percentage - 0.5) + 1

        const x = ((xPercent * (2 - b) - (1 - b))).round(4)
        const y = ((((-multX) * x ** 2 + addX * x + res) / multY).round(4) ** 0.5 * (percentage > 0.5 ? -1 : 1)).round(4)

        return {
            //factor in the angle of the ellipse
            x: x * Math.cos(angle).round(2) - y * Math.sin(angle).round(2),
            y: x * Math.sin(angle).round(2) + y * Math.cos(angle).round(2)
        }
    }
}

// Perlin noise
// Source: https://github.com/andrewrk/node-perlin-noise
// Author: Andrew R King (andrewrk)
window.generatePerlinNoise = function (width, height, options) {
    options = options || {};
    var octaveCount = options.octaveCount || 4;
    var amplitude = options.amplitude || 0.5;
    var persistence = options.persistence || 0.1;
    var seed = options.seed || Math.random();
    var whiteNoise = generateWhiteNoise(width, height, seed);

    var smoothNoiseList = new Array(octaveCount);
    var i;
    for (i = 0; i < octaveCount; ++i) smoothNoiseList[i] = generateSmoothNoise(i);

    var perlinNoise = new Array(width * height);
    var totalAmplitude = 0;
    // blend noise together
    for (i = octaveCount - 1; i >= 0; --i) {
        amplitude *= persistence;
        totalAmplitude += amplitude;

        for (var j = 0; j < perlinNoise.length; ++j) {
            perlinNoise[j] = perlinNoise[j] || 0;
            perlinNoise[j] += smoothNoiseList[i][j] * amplitude;
        }
    }
    // normalization
    for (i = 0; i < perlinNoise.length; ++i) perlinNoise[i] /= totalAmplitude;


    //Convert 1d array to 2d array

    var ret = []
    for (var i = 0; i < height; i++) ret.push(perlinNoise.slice(width * i, width * (i + 1)))
    return ret;

    function generateSmoothNoise(octave) {
        var noise = new Array(width * height);
        var samplePeriod = Math.pow(2, octave);
        var sampleFrequency = 1 / samplePeriod;
        var noiseIndex = 0;
        for (var y = 0; y < height; ++y) {
            var sampleY0 = Math.floor(y / samplePeriod) * samplePeriod;
            var sampleY1 = (sampleY0 + samplePeriod) % height;
            var vertBlend = (y - sampleY0) * sampleFrequency;
            for (var x = 0; x < width; ++x) {
                var sampleX0 = Math.floor(x / samplePeriod) * samplePeriod;
                var sampleX1 = (sampleX0 + samplePeriod) % width;
                var horizBlend = (x - sampleX0) * sampleFrequency;

                // blend top two corners
                var top = interpolate(whiteNoise[sampleY0 * width + sampleX0], whiteNoise[sampleY1 * width + sampleX0], vertBlend);
                // blend bottom two corners
                var bottom = interpolate(whiteNoise[sampleY0 * width + sampleX1], whiteNoise[sampleY1 * width + sampleX1], vertBlend);
                // final blend
                noise[noiseIndex] = interpolate(top, bottom, horizBlend);
                noiseIndex += 1;
            }
        }
        return noise;
    }
    function generateWhiteNoise(width, height, seed = Math.random()) {
        var noise = new Array(width * height);
        let rand = Math.randomSeed(seed);
        for (var i = 0; i < noise.length; ++i)
            noise[i] = rand();

        return noise;
    }
    function interpolate(x0, x1, alpha) {
        return x0 * (1 - alpha) + alpha * x1;
    }
}

window.rgbToHex = function (r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
window.hexToRgb = function (hex) {
    hex = hex.replace('#', '');
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return { r, g, b };
}

window.getRandomColor = function (format, makeString = true) {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    if (format == "hex") return rgbToHex(r, g, b);

    if (makeString) return `rgb(${r},${g},${b})`;
    return { r, g, b }
}

window.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.getFormula = function (type, Ax, Ay, Bx, By) {
    let a;
    //Check if every point is a number
    if (typeof Ax !== "number" || typeof Ay !== "number" || typeof Bx !== "number" || typeof By !== "number") throw new Error("Invalid point")
    switch (type) {
        case "root":
            if (Ax > Bx) [Ax, Bx, Ay, By] = [Bx, Ax, By, Ay]
            a = -((Ay - By) / (Bx - Ax) ** 0.5)
            return x => a * (x - Ax) ** 0.5 + Ay
        default:
        case "linear":
            a = (By - Ay) / (Bx - Ax)
            const b = Ay - a * Ax
            return x => a * x + b
        case "exponential":
            a = -((Ay - By) / (Bx - Ax) ** 2)
            return x => a * (x - Ax) ** 2 + Ay

    }
}

window.b2a = function (a) {
    var c, d, e, f, g, h, i, j, o, b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", k = 0, l = 0, m = "", n = [];
    if (!a) return a;
    do c = a.charCodeAt(k++), d = a.charCodeAt(k++), e = a.charCodeAt(k++), j = c << 16 | d << 8 | e,
        f = 63 & j >> 18, g = 63 & j >> 12, h = 63 & j >> 6, i = 63 & j, n[l++] = b.charAt(f) + b.charAt(g) + b.charAt(h) + b.charAt(i); while (k < a.length);
    return m = n.join(""), o = a.length % 3, (o ? m.slice(0, o - 3) : m) + "===".slice(o || 3);
}

window.a2b = function (a) {
    var b, c, d, e = {}, f = 0, g = 0, h = "", i = String.fromCharCode, j = a.length;
    for (b = 0; 64 > b; b++) e["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(b)] = b;
    for (c = 0; j > c; c++) for (b = e[a.charAt(c)], f = (f << 6) + b, g += 6; g >= 8;) ((d = 255 & f >>> (g -= 8)) || j - 2 > c) && (h += i(d));
    return h;
}