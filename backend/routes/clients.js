const express = require('express');
const { getSupabase } = require('../db-supabase');

const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Create client
router.post('/', async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clients')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Create client error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clients')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ message: 'Client updated successfully' });
  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;
