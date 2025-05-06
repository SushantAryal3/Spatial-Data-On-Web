const map = L.map("map").setView([58.373523, 26.716045], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

function heatDataConvert(feature) {
  const intensity = feature.properties.samples || feature.properties.area || 1;
  return [
    feature.geometry.coordinates[1],
    feature.geometry.coordinates[0],
    intensity,
  ];
}

async function addHeatmapLayer(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    const heatData = data.features.map(heatDataConvert);

    const heatmapLayer = L.heatLayer(heatData, {
      radius: 15,
      blur: 15,
      maxZoom: 17,
      minOpacity: 0.5,
      gradient: {
        0.4: "blue",
        0.6: "cyan",
        0.7: "lime",
        0.8: "yellow",
        1.0: "red",
      },
    });

    heatmapLayer.addTo(map);

    const markers = L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 3,
          fillColor: "#ff7800",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        });
      },
    });

    const baseLayers = {
      Heatmap: heatmapLayer,
      "Cell Towers": markers,
    };

    L.control.layers(null, baseLayers, { collapsed: false }).addTo(map);
  } catch (error) {
    console.error("Error loading heatmap data:", error);
  }
}

function defaultMapSettings() {
  map.setView([58.373523, 26.716045], 12);
}

document.addEventListener("DOMContentLoaded", function () {
  addHeatmapLayer("geojson/tartu_city_celltowers_edu.geojson");
});
