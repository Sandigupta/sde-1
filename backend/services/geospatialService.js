const supabase = require('../utils/supabaseClient');

async function getNearbyResources(disasterId, radius = 10000) {
  try {
    const { data: disaster } = await supabase
      .from('disasters')
      .select('location')
      .eq('id', disasterId)
      .single();

    if (!disaster) {
      throw new Error('Disaster not found');
    }

    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .within('location', disaster.location, radius)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error getting nearby resources:', error);
    throw error;
  }
}

async function getClosestResource(disasterId, resourceType) {
  try {
    const { data: disaster } = await supabase
      .from('disasters')
      .select('location')
      .eq('id', disasterId)
      .single();

    if (!disaster) {
      throw new Error('Disaster not found');
    }

    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('type', resourceType)
      .within('location', disaster.location, 10000) // 10km radius
      .order('ST_Distance(location, $1)', { 
        ascending: true,
        foreignTable: 'disasters',
        foreignColumn: 'location'
      })
      .limit(1);

    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error getting closest resource:', error);
    throw error;
  }
}

async function calculateDistance(resourceId, disasterId) {
  try {
    const { data: [resource, disaster] } = await supabase
      .from('resources')
      .select('location')
      .eq('id', resourceId)
      .union(
        supabase
          .from('disasters')
          .select('location')
          .eq('id', disasterId)
      );

    if (!resource || !disaster) {
      throw new Error('Resource or disaster not found');
    }

    const { data, error } = await supabase
      .from('resources')
      .select(`ST_Distance(location, '${disaster.location}') as distance`)
      .eq('id', resourceId);

    if (error) throw error;
    
    // Convert meters to kilometers
    return data[0].distance / 1000;
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw error;
  }
}

async function findResourceClusters(disasterId, radius = 5000) {
  try {
    const { data: disaster } = await supabase
      .from('disasters')
      .select('location')
      .eq('id', disasterId)
      .single();

    if (!disaster) {
      throw new Error('Disaster not found');
    }

    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .within('location', disaster.location, radius)
      .order('type')
      .group('type')
      .aggregate('count(*)');

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error finding resource clusters:', error);
    throw error;
  }
}

module.exports = {
  getNearbyResources,
  getClosestResource,
  calculateDistance,
  findResourceClusters
};
