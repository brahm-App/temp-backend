const axios = require('axios');

// Function to generate a random heart rate between 60–100 bpm
function generateRandomHeartRate() {
  return Math.floor(Math.random() * (100 - 60 + 1)) + 60;
}

setInterval(() => {
    const vitalsPayload = {
      type: 'vitals',
      vitals: {
        heartRate: generateRandomHeartRate(),
        temperature: 37.2,
        spo2Value: 97.5,
        nibpSys: 120,
        nibpDia: 80
      }
    };
  
    axios.post('http://localhost:5000/vitals', vitalsPayload)
      .then(response => {
        console.log('✅ Data sent:', vitalsPayload);
      })
      .catch(error => {
        console.error('❌ Error sending data:', error.message);
      });
  }, 1000);
  