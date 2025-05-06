let map = L.map("map").setView([58.373523, 26.716045], 12);

const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});
osm.addTo(map);

function getColor(property) {
  switch (property) {
    case 1:
      return "#ff0000";
    case 2:
      return "#009933";
    case 3:
      return "#0000ff";
    case 4:
      return "#ff0066";
    case 5:
      return "#9933ff";
    case 6:
      return "#ff9900";
    case 7:
      return "#00ffff";
    case 8:
      return "#66ff33";
    case 9:
      return "#ff66cc";
    case 10:
      return "#6699ff";
    default:
      return "#ffffff";
  }
}

function polygonStyle(feature) {
  return {
    fillColor: getColor(feature.properties.OBJECTID),
    fillOpacity: 0.5,
    weight: 1,
    opacity: 1,
    color: "grey",
  };
}

function popUPinfo(feature, layer) {
  if (feature.properties && feature.properties.NIMI) {
    layer.bindPopup(feature.properties.NIMI);
  }
}

async function addDistrictsGeoJson(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    const polygons = L.geoJson(data, {
      onEachFeature: popUPinfo,
      style: polygonStyle,
    });
    polygons.addTo(map);
  } catch (error) {
    console.error("Error loading districts GeoJSON:", error);
  }
}

function createCircle(feature, latlng) {
  let options = {
    radius: 5,
    fillColor: "red",
    fillOpacity: 0.8,
    color: "#000",
    weight: 1,
    opacity: 1,
  };
  return L.circleMarker(latlng, options);
}

async function addCelltowersGeoJson(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    const markers = L.geoJson(data, {
      pointToLayer: createCircle,
    });
    const clusters = L.markerClusterGroup();
    clusters.addLayer(markers);
    clusters.addTo(map);
  } catch (error) {
    console.error("Error loading cell towers GeoJSON:", error);
  }
}

function defaultMapSettings() {
  map.setView([58.373523, 26.716045], 12);
}

document.addEventListener("DOMContentLoaded", function () {
  addDistrictsGeoJson("geojson/tartu_city_districts_edu.geojson");
  addCelltowersGeoJson("geojson/tartu_city_celltowers_edu.geojson");
});
