import express from 'express';
import morgan from 'morgan';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(morgan('combined'));
app.use(express.json());
// -122.45,37.91
let driverLocations = { latitude: 75.4910177, longitude: 31.3225181 };
let deliveryAreaPolygon =  [
  [40.7128, -74.0060], // New York City
  [40.7128, -73.9352], // Brooklyn
  [40.7488, -73.9352], // Queens
  [40.7488, -74.0060], // Manhattan
  [40.7128, -74.0060] // Closing point (back to NYC)
];
app.use(cors());

app.post('/updateLocation', (req, res) => {
  const { driverId, latitude, longitude } = req.body;

  if (!driverId || typeof latitude !== 'number' || typeof longitude !== 'number') {
    res.status(400).send('Invalid data format');
    return;
  }

  if (!driverLocations[driverId]) {
    driverLocations[driverId] = {};
  }

  driverLocations[driverId] = { latitude, longitude };

  res.status(200).send('Location updated successfully');
});

app.post('/updateDeliveryArea', express.json(), (req, res) => {
  const { polygon } = req.body;

  if (!validatePolygon(polygon)) {
    res.status(400).send('Invalid polygon data');
    return;
  }

  deliveryAreaPolygon = polygon;
  res.status(200).send('Delivery area polygon updated successfully');
});

app.get('/updates', (req, res) => {
  const driverId = req.params.driverId;
  const driverLocation = driverLocations;

  if (!driverLocation) {
    res.status(404).send('No driver location found');
    return;
  }

  res.json(driverLocation);
});

app.get('/getRoute/:driverId', async (req, res) => {
  const driverId = req.params.driverId;
  const driverLocation = driverLocations[driverId];

  if (!driverLocation) {
    console.error('Driver not found:', driverId);
    res.status(404).send('Driver not found');
    return;
  }

  const { latitude, longitude } = driverLocation;
  const destination = [DESTINATION_LONGITUDE, DESTINATION_LATITUDE]; // Replace with actual values

  const query = `https://api.mapbox.com/directions/v5/mapbox/driving/${longitude},${latitude};${destination[0]},${destination[1]}?geometries=geojson&access_token=sk.eyJ1IjoiYWdyaW0wMzEyIiwiYSI6ImNscW03ZTRneTJ3OXAycXRrYmk2dTFhbWgifQ.VAbUu635azRjQMLeZxzE4g`; 
  try {
    const response = await fetch(query);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    const route = json.routes[0].geometry;

    res.json(route);
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).send('Error fetching route');
  }
});

app.get('/getDeliveryArea', (req, res) => {
  res.json(deliveryAreaPolygon);
});

function validatePolygon(polygon) {
  if (!Array.isArray(polygon) || polygon.length <= 2) {
    return false;
  }
  return polygon.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite));
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
