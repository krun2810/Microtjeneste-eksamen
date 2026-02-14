const setupSpots = async () => {
  const gatewayUrl = 'http://localhost:8080/api/spots';
  
  const spots = [
    { location: 'A-101', pricePerHour: 15, type: 'standard' },
    { location: 'A-102', pricePerHour: 15, type: 'standard' },
    { location: 'A-103', pricePerHour: 15, type: 'standard' },
    { location: 'B-201', pricePerHour: 25, type: 'ev' }, // Electric Vehicle
    { location: 'B-202', pricePerHour: 25, type: 'ev' },
    { location: 'C-301', pricePerHour: 10, type: 'disabled' }
  ];

  console.log('🌱 Seeding parking spots...');

  for (const spot of spots) {
    try {
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spot),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Created spot: ${data.location} (${data.type})`);
      } else {
        console.error(`❌ Failed to create spot ${spot.location}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error connecting to Gateway: ${error.message}`);
      console.log('   (Make sure "docker compose up" is running and Gateway is ready!)');
      return; 
    }
  }

  console.log('✨ Seeding complete! Refresh the dashboard.');
};

setupSpots();
