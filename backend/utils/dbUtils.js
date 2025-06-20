const supabase = require('../utils/supabaseClient');

async function queryDisasters(filters = {}) {
  try {
    let query = supabase.from('disasters').select('*');

    // Apply filters
    if (filters.tags) {
      query = query.ilike('tags', `%${filters.tags}%`);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.location) {
      query = query.within('location', filters.location);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error querying disasters:', error);
    throw error;
  }
}

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

async function updateAuditTrail(disasterId, action, details) {
  try {
    const { data: disaster } = await supabase
      .from('disasters')
      .select('audit_trail')
      .eq('id', disasterId)
      .single();

    if (!disaster) {
      throw new Error('Disaster not found');
    }

    const auditTrail = disaster.audit_trail || [];
    auditTrail.push({
      action,
      details,
      timestamp: new Date().toISOString()
    });

    const { error } = await supabase
      .from('disasters')
      .update({ audit_trail: auditTrail })
      .eq('id', disasterId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating audit trail:', error);
    throw error;
  }
}

module.exports = {
  queryDisasters,
  getNearbyResources,
  updateAuditTrail
};
