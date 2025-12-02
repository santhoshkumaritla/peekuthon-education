import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

// Test health check
const testHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
  }
};

// Test creating a book
const testCreateBook = async () => {
  try {
    const response = await fetch(`${API_URL}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '507f1f77bcf86cd799439011', // Example MongoDB ObjectId
        topic: 'Test Mathematics Book',
        pages: [
          { pageNumber: 1, leftContent: 'Introduction to Algebra', rightContent: 'Basic concepts...' },
          { pageNumber: 2, leftContent: 'Linear Equations', rightContent: 'Solving for x...' }
        ]
      })
    });
    const data = await response.json();
    console.log('✅ Book Created:', data);
    return data.data._id;
  } catch (error) {
    console.error('❌ Create Book Failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🧪 Running Backend API Tests...\n');
  await testHealth();
  console.log('');
  await testCreateBook();
  console.log('\n✨ Tests Complete!');
};

runTests();
