importScripts('hillshade.js');

self.dems = {};

onmessage = function (e) {
    if (e.data === 'clear') {
        self.dems = {};
        return;
    }

    if (e.data.raster) {
        var raster = new Uint8ClampedArray(e.data.raster);
        self.dems[e.data.id] = raster2dem(raster, e.data.zFactor);
    }

    var shaded = hillshade(self.dems[e.data.id],
        e.data.altitude, e.data.azimuth, e.data.shadows, e.data.highlights);

    postMessage({
        id: e.data.id,
        shades: shaded.buffer
    }, [shaded.buffer]);
};
