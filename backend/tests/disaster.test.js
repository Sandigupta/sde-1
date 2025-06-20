const request = require('supertest');
const app = require('../server');
const { supabase } = require('../utils/supabaseClient');
const { geocodeLocation } = require('../services/geocodingService');

// Sample test data
const testDisaster = {
  title: 'Test Disaster',
  location_name: 'New York, NY',
  description: 'Test disaster description',
  tags: ['test', 'emergency'],
  owner_id: 'test_user'
};

// Helper function to clean up test data
async function cleanup() {
  await supabase
    .from('disasters')
    .delete()
    .eq('title', testDisaster.title);
}

// Run cleanup before and after tests
describe('Disaster API Tests', () => {
  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  // Test disaster creation
describe('POST /disasters', () => {
    it('should create a new disaster', async () => {
      const response = await request(app)
        .post('/disasters')
        .send(testDisaster);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(testDisaster.title);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/disasters')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  // Test disaster retrieval
describe('GET /disasters', () => {
    let disasterId;

    beforeAll(async () => {
      const response = await request(app)
        .post('/disasters')
        .send(testDisaster);
      disasterId = response.body.id;
    });

    it('should get all disasters', async () => {
      const response = await request(app).get('/disasters');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });

    it('should get disaster by tag', async () => {
      const response = await request(app)
        .get('/disasters')
        .query({ tag: testDisaster.tags[0] });

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.some(d => d.id === disasterId)).toBe(true);
    });
  });

  // Test disaster update
describe('PUT /disasters/:id', () => {
    let disasterId;

    beforeAll(async () => {
      const response = await request(app)
        .post('/disasters')
        .send(testDisaster);
      disasterId = response.body.id;
    });

    it('should update a disaster', async () => {
      const updatedData = {
        title: 'Updated Test Disaster',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/disasters/${disasterId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updatedData.title);
      expect(response.body.description).toBe(updatedData.description);
    });

    it('should return 404 for non-existent disaster', async () => {
      const response = await request(app)
        .put('/disasters/non-existent-id')
        .send({ title: 'Should not work' });

      expect(response.status).toBe(404);
    });
  });

  // Test disaster deletion
describe('DELETE /disasters/:id', () => {
    let disasterId;

    beforeAll(async () => {
      const response = await request(app)
        .post('/disasters')
        .send(testDisaster);
      disasterId = response.body.id;
    });

    it('should delete a disaster', async () => {
      const response = await request(app)
        .delete(`/disasters/${disasterId}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const verifyResponse = await request(app)
        .get(`/disasters/${disasterId}`);
      expect(verifyResponse.status).toBe(404);
    });
  });

  // Test geocoding
describe('Geocoding', () => {
    it('should geocode a location', async () => {
      const response = await request(app)
        .post('/geocode')
        .send({ location_name: 'London, UK' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('coordinates');
    });

    it('should return error for invalid location', async () => {
      const response = await request(app)
        .post('/geocode')
        .send({ location_name: 'Invalid Location' });

      expect(response.status).toBe(400);
    });
  });
});
