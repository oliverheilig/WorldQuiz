function raster2dem(data, zFactor) {

    var values = new Uint16Array(256 * 256),
        dem = new Float32Array(256 * 256 * 2);

    var x, y, dx, dy, i, j;

    for (x = 0; x < 256; x++) {
        for (y = 0; y < 256; y++) {
            i = x + y * 256;
            j = i * 4;
            values[i] = data[j] + data[j + 1] * 2 + data[j + 2] * 3;
        }
    }

    for (x = 1; x < 255; x++) {
        for (y = 1; y < 255; y++) {

            i = y * 256 + x;

            dx = ((values[i - 255] + 2 * values[i + 1]   + values[i + 257]) -
                  (values[i - 257] + 2 * values[i - 1]   + values[i + 255])) / 8;
            dy = ((values[i + 255] + 2 * values[i + 256] + values[i + 257]) -
                  (values[i - 257] + 2 * values[i - 256] + values[i - 255])) / 8;

            j = (y * 256 + x) * 2;

            dem[j] = Math.atan(zFactor * Math.sqrt(dx * dx + dy * dy)); // slope

            dem[j + 1] = dx !== 0 ?
                Math.atan2(dy, -dx) :
                Math.PI / 2 * (dy > 0 ? 1 : -1); // aspect
        }
    }

    return dem;
}


function hillshade(dem, altitude, azimuth, shadows, highlights) {

    var px = new Uint8ClampedArray(256 * 256 * 4),

        a = - azimuth - Math.PI / 2,
        z = Math.PI / 2 - altitude,

        cosZ = Math.cos(z),
        sinZ = Math.sin(z),
        neutral = cosZ,

        x, y, i, sl, asp, hillshade, alpha;


    for (x = 0; x < 256; x++) {
        for (y = 0; y < 256; y++) {

            // pad dem borders
            i = ((y === 0 ? 1 : y === 255 ? 254 : y) * 256 +
                 (x === 0 ? 1 : x === 255 ? 254 : x)) * 2;

            sl  = dem[i]; // slope
            asp = dem[i + 1]; //aspect

            if (!sl) continue;

            hillshade = cosZ * Math.cos(sl) + sinZ * Math.sin(sl) * Math.cos(a - asp);

            if (hillshade < 0) {
                hillshade /= 2;
            }

            alpha = neutral - hillshade;

            i = (y * 256 + x) * 4;

            if (neutral > hillshade) { // shadows
                px[i]     = 20;
                px[i + 1] = 0;
                px[i + 2] = 30;
                px[i + 3] = Math.round(255 * alpha * shadows);

            } else { // highlights
                alpha = Math.min(-alpha * cosZ * highlights / (1 - hillshade), highlights);
                px[i]     = 255;
                px[i + 1] = 255;
                px[i + 2] = 230;
                px[i + 3] = Math.round(255 * alpha);
            }
        }
    }

    return px;
}
