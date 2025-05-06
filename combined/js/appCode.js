const map = L.map("map", {
  center: [58.373523, 26.716045],
  zoom: 12,
  zoomControl: false,
});

map.createPane("customDistrictsPane");
map.getPane("customDistrictsPane").style.zIndex = 390;

const osmLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "OpenStreetMap contributors",
  }
);

const satelliteLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Esri, Maxar, Earthstar Geographics, and the GIS community",
    maxZoom: 19,
  }
);

const topoLayer = L.tileLayer(
  "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 17,
    attribution:
      "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)",
  }
);

let districtsLayer;
let choroplethLayer;
let heatMapLayer;
let markersLayer;
let geojson;
let legend;

function getDistrictColor(id) {
  switch (id) {
    case 1:
      return "#ff0000";
    case 13:
      return "#009933";
    case 6:
      return "#0000ff";
    case 7:
      return "#ff0066";
    default:
      return "#ffffff";
  }
}

async function loadDistrictsLayer() {
  try {
    const response = await fetch("geojson/tartu_city_districts_edu.geojson");
    const data = await response.json();

    districtsLayer = L.geoJson(data, {
      style: function (feature) {
        return {
          fillColor: getDistrictColor(feature.properties.OBJECTID),
          fillOpacity: 0.5,
          weight: 1,
          opacity: 1,
          color: "grey",
        };
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(
          feature.properties.NIMI || "District " + feature.properties.OBJECTID
        );
      },
      pane: "customDistrictsPane",
    });
  } catch (error) {
    console.error("Error loading districts:", error);
  }
}

function getColor(d) {
  return d > 10
    ? "#800026"
    : d > 8
    ? "#BD0026"
    : d > 6
    ? "#E31A1C"
    : d > 4
    ? "#FC4E2A"
    : d > 2
    ? "#FD8D3C"
    : "#FEB24C";
}

function style(feature) {
  return {
    fillColor: getColor(feature.properties.OBJECTID),
    weight: 1,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7,
  };
}

function highlightFeature(e) {
  const layer = e.target;
  layer.setStyle({
    weight: 3,
    color: "#666",
    fillOpacity: 0.7,
  });
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlight(e) {
  geojson.resetStyle(e.target);
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature,
  });

  layer.bindPopup(
    `<strong>District:</strong> ${feature.properties.NIMI}<br>
         <strong>Value:</strong> ${feature.properties.OBJECTID}`
  );
}

function createManualLegend() {
  legend = L.control({ position: "bottomleft" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    const grades = [0, 2, 4, 6, 8, 10];
    const colors = [
      "#FEB24C",
      "#FD8D3C",
      "#FC4E2A",
      "#E31A1C",
      "#BD0026",
      "#800026",
    ];

    div.innerHTML = "<div><strong>District Values</strong></div>";

    for (let i = 0; i < grades.length; i++) {
      const from = grades[i];
      const to = grades[i + 1];

      div.innerHTML +=
        '<i style="background:' +
        colors[i] +
        '"></i> ' +
        from +
        (to ? "&ndash;" + to : "+") +
        "<br>";
    }

    return div;
  };
}

async function loadChoroplethLayer() {
  try {
    const response = await fetch("geojson/tartu_city_districts_edu.geojson");
    const data = await response.json();

    geojson = L.geoJson(data, {
      style: style,
      onEachFeature: onEachFeature,
      pane: "customDistrictsPane",
    });

    choroplethLayer = geojson;
    createManualLegend();
  } catch (error) {
    console.error("Error loading choropleth:", error);
  }
}

async function loadHeatMapLayer() {
  try {
    const response = await fetch("geojson/tartu_city_celltowers_edu.geojson");
    const data = await response.json();

    const heatData = data.features.map(function (feature) {
      return [
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0],
        feature.properties.area || 1,
      ];
    });

    heatMapLayer = L.heatLayer(heatData, {
      radius: 20,
      blur: 15,
      maxZoom: 17,
    });
  } catch (error) {
    console.error("Error loading heatmap:", error);
  }
}

async function loadMarkersLayer() {
  try {
    const response = await fetch("geojson/tartu_city_celltowers_edu.geojson");
    const data = await response.json();

    const geoJsonLayer = L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 5,
          fillColor: "red",
          fillOpacity: 0.5,
          color: "red",
          weight: 1,
          opacity: 1,
        });
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties) {
          layer.bindPopup(
            "Cell Tower<br>Area: " + (feature.properties.area || "Unknown")
          );
        }
      },
    });

    markersLayer = L.markerClusterGroup();
    markersLayer.addLayer(geoJsonLayer);
  } catch (error) {
    console.error("Error loading markers:", error);
  }
}

async function initializeLayers() {
  await Promise.all([
    loadDistrictsLayer(),
    loadChoroplethLayer(),
    loadHeatMapLayer(),
    loadMarkersLayer(),
  ]);

  const baseLayers = {
    OpenStreetMap: osmLayer,
    Satellite: satelliteLayer,
    Topographic: topoLayer,
  };

  const overlayLayers = {
    "Tartu districts": districtsLayer,
    "Choropleth layer": choroplethLayer,
    Heatmap: heatMapLayer,
    Markers: markersLayer,
  };

  const layerControlOptions = {
    collapsed: false,
    position: "topleft",
  };

  const layerControl = L.control
    .layers(baseLayers, overlayLayers, layerControlOptions)
    .addTo(map);

  map.on("overlayadd", function (e) {
    if (e.name === "Choropleth layer") {
      legend.addTo(map);
    }
  });

  map.on("overlayremove", function (e) {
    if (e.name === "Choropleth layer") {
      map.removeControl(legend);
    }
  });

  L.control.zoom({ position: "topright" }).addTo(map);

  L.control.scale({ position: "bottomright", imperial: false }).addTo(map);

  osmLayer.addTo(map);
  districtsLayer.addTo(map);
}

initializeLayers();
