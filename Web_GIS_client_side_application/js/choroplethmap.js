const map = L.map("map").setView([58.373523, 26.716045], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

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
  layer.bringToFront();
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

async function addChoroplethLayer(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    geojson = L.choropleth(data, {
      valueProperty: "OBJECTID",
      scale: ["#ffffcc", "#800026"],
      steps: 5,
      mode: "q",
      style: {
        color: "#fff",
        weight: 1,
        fillOpacity: 0.8,
      },
      onEachFeature: onEachFeature,
    }).addTo(map);

    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      const limits = geojson.options.limits;
      const colors = geojson.options.colors;
      let labels = [];

      div.innerHTML = "<div><strong>District Values</strong></div>";

      limits.forEach(function (limit, index) {
        labels.push(
          '<i style="background:' +
            colors[index] +
            '"></i> ' +
            (index ? limits[index - 1] + "–" + limit : "≤" + limit)
        );
      });

      div.innerHTML += labels.join("<br>");
      return div;
    };

    legend.addTo(map);
  } catch (error) {
    console.error("Error loading choropleth data:", error);
  }
}

function defaultMapSettings() {
  map.setView([58.373523, 26.716045], 12);
}

document.addEventListener("DOMContentLoaded", function () {
  addChoroplethLayer("geojson/tartu_city_districts_edu.geojson");
});
