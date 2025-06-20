const supabase = require('../utils/supabaseClient');
const { geocodeLocation } = require('../services/geocodingService');
const { emitDisasterUpdate } = require('../socket/socketHandler');
require('dotenv').config();

exports.createDisaster = async (req, res) => {
  try {
    const { title, location_name, description, tags, owner_id } = req.body;
    
    // Geocode the location
    const coordinates = await geocodeLocation(location_name);
    
    const { data, error } = await supabase
      .from('disasters')
      .insert([
        {
          title,
          location_name,
          location: coordinates,
          description,
          tags,
          owner_id,
          audit_trail: JSON.stringify({ created_at: new Date() })
        }
      ])
      .select();

    if (error) throw error;
    
    // Emit real-time update
    emitDisasterUpdate(data[0]);
    
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, status, severity } = req.body;

    const { data, error } = await supabase
      .from('disasters')
      .update({
        title,
        description,
        tags,
        status,
        severity,
        audit_trail: JSON.stringify({ 
          updated_at: new Date(),
          ...(JSON.parse(req.body.audit_trail) || {}) 
        })
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    
    // Emit real-time update
    emitDisasterUpdate(data[0]);
    
    res.json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    
    // Emit real-time update
    emitDisasterUpdate({ id, deleted: true });
    
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.geocodeLocation = async (req, res) => {
  try {
    const { location_name } = req.body;
    
    if (!location_name) {
      return res.status(400).json({ error: 'Location name is required' });
    }

    const coordinates = await geocodeLocation(location_name);
    res.json({ coordinates });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.reverseGeocode = async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates) {
      return res.status(400).json({ error: 'Coordinates are required' });
    }

    const location_name = await reverseGeocode(coordinates);
    res.json({ location_name });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getDisasters = async (req, res) => {
  try {
    const { tag } = req.query;
    let query = supabase.from('disasters').select('*');

    if (tag) {
      query = query.ilike('tags', `%${tag}%`);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags } = req.body;

    const { data, error } = await supabase
      .from('disasters')
      .update({
        title,
        description,
        tags,
        audit_trail: JSON.stringify({ 
          updated_at: new Date(),
          ...(JSON.parse(req.body.audit_trail) || {}) 
        })
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    
    res.json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
