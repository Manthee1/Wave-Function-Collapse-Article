// Copyright Martin Dinja 2021 - MIT License

/**
 * Sorts the string | alphabetically 
 * @returns {String} Sorted string
 */
String.prototype.sort = function () {
    return this.split('').sort().join('');
}
/**
 * Converts a string to a number\
 * @returns {Number} Converted number
 */
String.prototype.num = function () {
    return Number(this)
}
/**
 * Converts a string to a date object
 * @returns {Date} Converted date
 */
String.prototype.toDate = function () {
    return new Date(this);
}
/**
 * Check if the given string is an valid url
 * @returns {Boolean} True if string is a valid url
 */
String.prototype.isUrl = function () {
    return this.match(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/g) != null;
}
/**
 * Fix the provided url 
 * @returns {String} Fixed url
 */
String.prototype.fixUrl = function () {
    //if the url does not start with http then add https://
    return this.replace(/^(?!http)/, 'https://');
}
/**
 * Capitalizes first letter of a string
 * @returns {String}
 */
String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
/**
 * Rounds up a number
 * @param {Number} decimals 
 * @returns {Number} Rounded number
 */
Number.prototype.ceil = function (decimals = 0) {
    return Math.ceil(this * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
/**
 * Rounds down a number
 * @param {Number} decimals 
 * @returns {Number} Rounded number
 */
Number.prototype.floor = function (decimals = 0) {
    return Math.floor(this * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
/**
 * Rounds a number to a certain number of decimals
 * @param {Number} decimals 
 * @returns {Number} Rounded number
 */
Number.prototype.round = function (decimals = 0) {
    return Math.round(this * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
/**
 * Clamps a number between a min and max
 * @param {Number} min 
 * @param {Number} max
 * @returns {Number} Clamped number
 */
Number.prototype.clamp = function (min, max) {
    if (Number.isNaN(this)) return min;
    return Math.min(Math.max(this, min), max);
}
/**
 * Caps a number at a max value
 * @param {Number} cap
 * @returns {Number} Caped number
 */
Number.prototype.cap = function (cap) {
    return Math.min(this, cap);
}

Number.prototype.wrap = function (min, max) {
    if (this < min)
        return max - (min - this) % (max - min);
    if (this > max)
        return min + (this - min) % (max - min);
    return this;
}
/**
 * Converts a number to a date object
 * @returns {Date} Converted date
 */
Number.prototype.toDate = function () {
    return new Date(this);
}

/**
 * Calculates the factorial of a number
 * @param {Number} n Input
 * @returns {Number} n!
 */
Math.factorial = function (n) {
    return n < 2 ? 1 : n * Math.factorial(n - 1);
}


/**
 * Returns a random seeded number function
 * @param {*} seed 
 * @returns 
 */
Math.randomSeed = function (seed = 0, options) {
    options = Object.assign({
        maxDecimals: Infinity,
    }, options);
    let rand = function () {
        var t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        let val = ((t ^ t >>> 14) >>> 0) / 4294967296
        return options.maxDecimals == Infinity ? val : val.floor(options.maxDecimals);
    }
    rand.seed = seed;
    rand.range = (min, max) => {
        let val = rand.call() * (max - min) + min
        return options.maxDecimals == Infinity ? val : val.floor(options.maxDecimals);
    };
    return rand;
}
/**
 * Returns a random number
 * @param {*} seed 
 * @returns 
 */
Math.rand = function (min, max, average) {
    if (average) {
        let r = Math.random() * 2 * average
        // return r;
        if (r < average) return (r / average) * (average - min) + min
        else return (r - average) / average * (max - average) + average
    }
    return Math.floor(Math.random() * (max - min) + min);
}
/**
 * Generates a random unique id 
 * @param {Number} length Length of the id
 * @returns {String}
 */
Math.uniqueId = function (length = 8) {
    let ret = ""
    while (ret.length < length) ret += ((Date.now() * Math.random()).floor(0).toString(36) + Math.random().toString(36).substring(2))
    return ret.substring(0, length);
}
/**
 * Convert Degrees to Radians
 * @param {Number} deg
 * @returns {Number}
 */
Math.toRadians = function (deg) {
    return deg * Math.PI / 180;
}


const m = 0x5F375A86,
    buffer = new ArrayBuffer(4),
    view = new DataView(buffer)
/**
 * Fast inverse square root
 * @param {Number} n
 * @returns {Number}
 */
Math.fainvsqrt = function (n) {
    var f, n2 = n * 0.5, th = 1.5
    view.setFloat32(0, n)
    view.setUint32(0, m - (view.getUint32(0) >> 1))
    f = view.getFloat32(0)
    f *= (th - (n2 * f * f))
    f *= (th - (n2 * f * f))
    return f
}
/**
 * inverse square root
 * @param {Number} n
 * @returns {Number}
 */
Math.invsqrt = function (n) {
    return 1 / n ** 0.5;
}

/**
 * Adds up all the number values of an array
 * @returns {Number} Sum of all the values in the object
 */
Array.prototype.sum = function () {
    return this.reduce((a, b) => a + (Number(b) == NaN ? 0 : b), 0)
}
/**
 * Returns the average of an array of numbers
 * @returns {Number} Average of the array
 */
Array.prototype.average = function () {
    return this.sum() / this.length;
}
/**
 * Returns the the biggest number in the array
 * @returns {Number} Biggest number in the array
 */
Array.prototype.max = function () {
    return this.reduce((a, b) => Math.max(a, b));
}
/**
 * Returns the the smallest number in the array
 * @returns {Number} Smallest number in the array
 */
Array.prototype.min = function () {
    return this.reduce((a, b) => Math.min(a, b));
}
/**
 * Returns the last element of an array
 * @returns {*} Last element of the array
 */
Array.prototype.last = function () {
    return this[this.length - 1];
}
/**
 * Returns a random element from the array
 * @returns {*} Random element from the array
 */
Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
}
/**
 * Rotates the array by a given amount
 * @param {Number} amount Amount to rotate the array by
 * @returns {*} Rotated array
 */
Array.prototype.rotate = function (amount = 1) {
    return this.slice(amount).concat(this.slice(0, amount));
}
/**
 * 
 * @param {Object} target
 * @param {Object} source 
 * @returns {Object} deep merge of target and source
 */
Object.deepMerge = function (target, source) {
    var output = Object.assign({}, target);
    for (var key in source)
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object') output[key] = Object.deepMerge(output[key], source[key]);
            else output[key] = source[key];
        }

    return output;
}

/**
 * Checks if an object has all the given properties
 * @param {Object} obj
 * @param {Array.<string>} properties
 */
Object.hasOwnProperties = function (obj, ...properties) {
    for (var i = 0; i < properties.length; i++) if (Object.hasOwn(obj, properties[i])) return false;
    if (properties.length == 0) return false;
    return true;
}

/**
 * Brings out the children of a parent (Recursivly) and stores all of them in the same array
 * @param {Array} objList
 * @param {String} childrenArrayKey
 * @returns {Array}
 */
Object.getParentsAndChildrenRecursive = function (objList, childrenArrayKey = 'children') {
    let ret = [];
    let hasChildren = false;
    //Loop through all objects
    for (let i = 0; i < objList.length; i++) {
        //If the object has children
        if (Object.hasOwn(objList[i], childrenArrayKey)) {
            hasChildren = true;
            //Loop through all the children
            for (let j = 0; j < objList[i][childrenArrayKey].length; j++) {
                //Add the child to the return array
                ret.push(objList[i][childrenArrayKey][j]);
            }
            //Remove tje children from the obj
            delete objList[i][childrenArrayKey]
        }
        //Add the object to the return array without its children
        ret.push(objList[i]);
    }
    if (hasChildren) return Object.getParentsAndChildrenRecursive(ret, childrenArrayKey);
    return ret;
}



//Date format function
Date.prototype.format = function (format = '', lang = 'en') {
    var date = this;
    var ret = format;
    ret = ret.replace('YYYY', date.getFullYear());
    ret = ret.replace('MM', date.getMonth() + 1);
    ret = ret.replace('DD', date.getDate());
    ret = ret.replace('hh', date.getHours());
    ret = ret.replace('mm', date.getMinutes());
    ret = ret.replace('ss', date.getSeconds());

    // 'month' should be converted to language name of month
    // 'day' should be converted to name of day

    ret = ret.replace('month', date.toLocaleString(lang, { month: 'long' }));
    ret = ret.replace('day', date.toLocaleString(lang, { weekday: 'long' }));

    return ret;
}



Object.isEmpty = function (obj = {}) {
    return typeof obj != 'object' || Object.keys(obj).length === 0;
}


// Draw a grid limited to the map size
CanvasRenderingContext2D.prototype.drawGrid = function (startX, startY, scale, gridSize, color = "white", lineWidth = 1) {
    this.strokeStyle = color
    this.lineWidth = lineWidth
    this.lineCap = "round"
    const oldStartX = startX
    const oldStartY = startY
    startY = startY < 0 ? startY % gridSize : startY;
    startX = startX < 0 ? startX % gridSize : startX;
    // for (let i = 0; i < map.mapSize + 1; i += gridSize) {
    //     this.moveTo(startX + i, startY)
    //     this.lineTo(startX + i, startY + map.mapSize * scale)
    //     this.moveTo(startX, startY + i)
    //     this.lineTo(startX + map.mapSize * scale, startY + i)
    // }
    const maxX = (startX + map.mapSize * scale).cap(oldStartX + map.mapSize * scale).cap(this.canvas.width)
    const maxY = (startY + map.mapSize * scale).cap(oldStartY + map.mapSize * scale).cap(this.canvas.height)

    this.beginPath()
    for (let i = startX; i < maxX + 1; i += gridSize) {
        this.moveTo(i, startY)
        this.lineTo(i, maxY)
    }
    for (let i = startY; i < maxY + 1; i += gridSize) {
        this.moveTo(startX, i)
        this.lineTo(maxX, i)
    }

    this.stroke()

}
CanvasRenderingContext2D.prototype.drawStarShine = function (x, y, size, color, passes, alpha = map.config.allowAlpha, exponential = true) {
    const allowAlpha = map.config.allowAlpha && alpha
    allowAlpha && (size *= 1.2)

    for (let i = 1; i <= passes; i++) {
        this.beginPath()
        const factor = i / passes
        const alpha = exponential ? (i ** 3 / passes ** 3).floor(2) : factor

        this.fillStyle = allowAlpha ? `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})` : `rgb(${(color.r * factor).floor()}, ${(color.g * factor).floor()}, ${(color.b * factor).floor()})`
        this.arc(x, y, size * (1 - i / (passes + 1)), 0, 2 * Math.PI)
        this.fill()
        // size *= factor
    }
}
CanvasRenderingContext2D.prototype.drawPlanet = function (x, y, size, planetInfo) {

    planetInfo.color = planetInfo.color || { r: 255, g: 255, b: 255 }
    this.beginPath()
    this.fillStyle = `rgb(${planetInfo.color.r}, ${planetInfo.color.g}, ${planetInfo.color.b})`
    this.arc(x, y, size, 0, 2 * Math.PI)
    this.fill()
    this.beginPath()
    this.fillStyle = `rgb(${planetInfo.color.r}, ${planetInfo.color.g}, ${planetInfo.color.b})`
    this.arc(x, y, size * 0.8, 0, 2 * Math.PI)
    this.fill()
    this.beginPath()
    this.fillStyle = `rgb(${planetInfo.color.r}, ${planetInfo.color.g}, ${planetInfo.color.b})`
    this.arc(x, y, size * 0.6, 0, 2 * Math.PI)
    this.fill()
    this.beginPath()
    this.fillStyle = `rgb(${planetInfo.color.r}, ${planetInfo.color.g}, ${planetInfo.color.b})`
    this.arc(x, y, size * 0.4, 0, 2 * Math.PI)
    this.fill()
    this.beginPath()
    this.fillStyle = `rgb(${planetInfo.color.r}, ${planetInfo.color.g}, ${planetInfo.color.b})`
    this.arc(x, y, size * 0.2, 0, 2 * Math.PI)
    this.fill()


}

CanvasRenderingContext2D.prototype.clear = function () {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height)
}

HTMLElement.prototype.resetClass = function (...classes) {
    for (let i = 0; i < classes.length; i++)
        this.classList.remove(classes[i])

    setTimeout(() => {
        for (let i = 0; i < classes.length; i++)
            this.classList.add(classes[i])
    }, 0)
}

//Custom double click listener

const customEvents = {
    doubleclick: function (element, callback) {
        let clickCount = 0;
        const movementThreshold = 5;
        let mouseX = 0;
        let mouseY = 0;
        element.addEventListener('click', function (e) {
            const clearCountTimeout = setTimeout(() => {
                clickCount = 0;
            }, 500);
            clickCount++;

            if (clickCount == 1) {
                mouseX = e.clientX;
                mouseY = e.clientY;
            }

            if (clickCount >= 2) {
                const mouseMoved = Math.abs(mouseX - e.clientX) > movementThreshold || Math.abs(mouseY - e.clientY) > movementThreshold;
                if (!mouseMoved) {
                    clickCount = 0;
                    callback(e);
                }

            }
        });
    }
}

EventTarget.prototype.addOriginalEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (event, callback, useCapture = false) {

    if (customEvents[event]) {
        customEvents[event](this, callback);
        return;
    }


    this.addOriginalEventListener(event, callback, useCapture);
}
