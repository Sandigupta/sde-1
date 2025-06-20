const axios = require('axios');
const supabase = require('../utils/supabaseClient');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

async function geocodeLocation(locationName) {
  try {
    // First check cache
    const { data: cache } = await supabase
      .from('geocoding_cache')
      .select('coordinates')
      .eq('location_name', locationName)
      .single();

    if (cache) {
      return cache.coordinates;
    }

    // If not in cache, use Nominatim API
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: locationName,
        format: 'json',
        limit: 1
      }
    });

    if (response.data.length === 0) {
      throw new Error('Location not found');
    }

    const { lat, lon } = response.data[0];
    const coordinates = `POINT(${lon} ${lat})`;

    // Cache the result
    await supabase
      .from('geocoding_cache')
      .upsert([
        {
          location_name: locationName,
          coordinates: coordinates
        }
      ]);

    return coordinates;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    throw error;
  }
}

async function reverseGeocode(coordinates) {
  try {
    // First check cache
    const { data: cache } = await supabase
      .from('geocoding_cache')
      .select('location_name')
      .eq('coordinates', coordinates)
      .single();

    if (cache) {
      return cache.location_name;
    }

    // If not in cache, use Nominatim API
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        lat: coordinates.split(' ')[1],
        lon: coordinates.split(' ')[0],
        format: 'json',
        limit: 1
      }
    });

    if (response.data.length === 0) {
      throw new Error('Location not found');
    }

    const locationName = response.data[0].display_name;

    // Cache the result
    await supabase
      .from('geocoding_cache')
      .upsert([
        {
          location_name: locationName,
          coordinates: coordinates
        }
      ]);

    return locationName;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    throw error;
  }
}

module.exports = {
  geocodeLocation,
  reverseGeocode
};
