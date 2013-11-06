(function () {

if (!('crossOrigin' in new Image()) ||
        typeof Uint8ClampedArray === 'undefined' ||
        typeof Worker === 'undefined') {

    document.body.innerHTML = '<div class="icon alert center pad1">This demo doesn\'t work in your browser. ' +
            'Please try viewing it in Chrome, Firefox or Safari.</div>' +
            '<p class="center"><img src="https://i.imgur.com/eq1cm2u.gif" /></p>';
    return;
}

var map = L.map('map');
map.setView([37.35733, -122.2471], 12);

var hills = L.tileLayer.canvas();
var altitude, azimuth, zFactor, shadows, highlights;

hills.redrawQueue = [];

var uniqueId = (function () {
    var lastId = 0;
    return function () {
        return ++lastId;
    };
})();

var workers = [];

function updateTile(e) {
    var ctx = contexts[e.data.id],
        imgData = ctx.createImageData(256, 256);

    var shades = new Uint8ClampedArray(e.data.shades);

    imgData.data.set(shades);
    ctx.putImageData(imgData, 0, 0);
}

for (var i = 0; i < 16; i++) {
    workers[i] = new Worker('worker.js');
    workers[i].onmessage = updateTile;
}

map.on('viewreset', function () {
    hills.redrawQueue = [];
    workers.forEach(function (worker) {
        worker.postMessage('clear');
    });
});


var contexts = {};


hills.drawTile = function(canvas, tilePoint, zoom) {
    var demImg = new Image(),
        ctx = canvas.getContext('2d'),
        demCtx, renderedZFactor,
        id = uniqueId();

    contexts[id] = ctx;

    function redraw() {
        var transferable = [],
            data = {id: id};

        if (renderedZFactor !== zFactor) {
            data.raster = demCtx.getImageData(0, 0, 256, 256).data.buffer;
            data.zFactor = zFactor;
            transferable.push(data.raster);
        }

        data.altitude = altitude;
        data.azimuth = azimuth;
        data.shadows = shadows;
        data.highlights = highlights;

        var workerIndex = (tilePoint.x + tilePoint.y) % workers.length;

        workers[workerIndex].postMessage(data, transferable);

        renderedZFactor = zFactor;
    }

    demImg.onload = function() {
        var c = document.createElement('canvas');
        c.width = c.height = 256;
        demCtx = c.getContext('2d');
        demCtx.drawImage(demImg, 0, 0);

        redraw();
        hills.redrawQueue.push(redraw);
    };

    demImg.crossOrigin = '*';
    demImg.src = L.Util.template(
        'https://a.tiles.mapbox.com/v3/aj.sf-dem/{z}/{x}/{y}.png',
        L.extend({z: zoom}, tilePoint));
}

hills.redrawTiles = function () {
    hills.redrawQueue.forEach(function(redraw) { redraw(); });
};

hills.addTo(map);


function get(id) {
    return document.getElementById(id);
}

function updateValues() {
    altitude = parseInt(get('altitude').value) * Math.PI / 180;
    azimuth = parseInt(get('azimuth').value) * Math.PI / 180;
    zFactor = parseFloat(get('zfactor').value);
    shadows = parseFloat(get('shadows').value);
    highlights = parseFloat(get('highlights').value);
}

updateValues();



(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

var needsRedraw = false;

function redraw() {
    if (needsRedraw) {
        hills.redrawTiles();
    }
    needsRedraw = false;

    window.requestAnimationFrame(redraw);
}

redraw();

[].forEach.call(document.querySelectorAll('#controls input'), function (input) {
    input['oninput' in input ? 'oninput' : 'onchange'] = function (e) {
        updateValues();
        needsRedraw = true;
    };
});

})();
