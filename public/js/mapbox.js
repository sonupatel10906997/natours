//console.log('Hello from the client side');

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic29udXBhdGVsMTA5MDY5OTciLCJhIjoiY2t6ZXIyb3Q4MWo5azJva3UzbHAza3JoZCJ9.np0iSIRQ2MwBJHrn5cM1gA';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sonupatel10906997/ckzertk2q001114o4j75dwl3e',
    scrollZoom: false,
    //   center: [-118.113491, 34.111745],
    //   zoom: 4,
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add popup
    new mapboxgl.Popup({
      offset: 50,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //add marker in map
    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
