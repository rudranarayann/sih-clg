let map;
let markers = [];
let locations = [];
let directionsService;
let directionsRenderer;
let vendorData = {};

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.2961, lng: 85.8245 }, // Center to Bhubaneswar
        zoom: 13,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

    // Event listeners for buttons
    document.getElementById('useCurrentLocation').addEventListener('click', useCurrentLocation);
    document.getElementById('addScheduledLocations').addEventListener('click', addScheduledLocations);
    document.getElementById('optimizeRoute').addEventListener('click', optimizeRoute);
}

// Use current device location
function useCurrentLocation() {
    const vendorId = document.getElementById('vendorId').value;
    if (!vendorId) {
        alert('Please enter your Vendor ID.');
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                name: 'Current Location'
            };
            addUserLocation(vendorId, location);
            addLocationToMap(location);
            saveLocationToLocal(vendorId, location); // Save to local storage
        }, () => {
            alert('Geolocation failed. Please allow location access.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Add scheduled locations
function addScheduledLocations() {
    const vendorId = document.getElementById('vendorId').value;
    if (!vendorId) {
        alert('Please enter your Vendor ID.');
        return;
    }

    // Generate random locations for demo
    const randomLocations = generateRandomLocations();
    randomLocations.forEach(location => {
        addUserLocation(vendorId, location);
        addLocationToMap(location);
        saveLocationToLocal(vendorId, location); // Save to local storage
    });
}

// Generate random locations within Bhubaneswar
function generateRandomLocations() {
    const locations = [];
    for (let i = 0; i < 5; i++) { // Generate 5 random locations
        const lat = 20.2961 + (Math.random() - 0.5) * 0.1;
        const lng = 85.8245 + (Math.random() - 0.5) * 0.1;
        locations.push({ lat, lng, name: `Random Location ${i + 1}` });
    }
    return locations;
}

// Store user location data associated with a vendor
function addUserLocation(vendorId, location) {
    if (!vendorData[vendorId]) {
        vendorData[vendorId] = [];
    }
    vendorData[vendorId].push(location);
}

// Add location to the map
function addLocationToMap(location) {
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: location.name,
    });

    markers.push(marker);
    locations.push(location);

    const infowindow = new google.maps.InfoWindow({
        content: location.name
    });

    marker.addListener('click', () => {
        infowindow.open(map, marker);
    });

    map.panTo(location);
}

// Save location to local storage
function saveLocationToLocal(vendorId, location) {
    let storedData = localStorage.getItem('vendorData');
    if (!storedData) {
        storedData = {};
    } else {
        storedData = JSON.parse(storedData);
    }

    if (!storedData[vendorId]) {
        storedData[vendorId] = [];
    }
    storedData[vendorId].push(location);
    localStorage.setItem('vendorData', JSON.stringify(storedData));
}

// Retrieve locations from local storage
function getLocationsFromLocal(vendorId) {
    const storedData = JSON.parse(localStorage.getItem('vendorData')) || {};
    return storedData[vendorId] || [];
}

// Optimize the route using Google Maps Directions API
function optimizeRoute() {
    const vendorId = document.getElementById('vendorId').value;
    if (!vendorId) {
        alert('Please enter your Vendor ID.');
        return;
    }

    // Retrieve locations from local storage
    locations = getLocationsFromLocal(vendorId);

    if (locations.length < 2) {
        alert('Please add at least two locations.');
        return;
    }

    const waypoints = locations.slice(1, -1).map(location => ({
        location: new google.maps.LatLng(location.lat, location.lng),
        stopover: true
    }));

    // Debugging output
    console.log('Directions request:', {
        origin: new google.maps.LatLng(locations[0].lat, locations[0].lng),
        destination: new google.maps.LatLng(locations[locations.length - 1].lat, locations[locations.length - 1].lng),
        waypoints: waypoints
    });

    directionsService.route({
        origin: new google.maps.LatLng(locations[0].lat, locations[0].lng),
        destination: new google.maps.LatLng(locations[locations.length - 1].lat, locations[locations.length - 1].lng),
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
    }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);

            const route = response.routes[0];
            const summaryPanel = document.getElementById('routeInfo');
            summaryPanel.innerHTML = '';

            for (let i = 0; i < route.legs.length; i++) {
                const routeSegment = i + 1;
                summaryPanel.innerHTML += `<b>Route Segment: ${routeSegment}</b><br>`;
                summaryPanel.innerHTML += `${route.legs[i].start_address} to `;
                summaryPanel.innerHTML += `${route.legs[i].end_address}<br>`;
                summaryPanel.innerHTML += `${route.legs[i].distance.text}<br><br>`;
            }
        } else {
            console.error('Directions request failed due to ' + status);
            alert('Directions request failed. Check the console for details.');
        }
    });
}
