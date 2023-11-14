var express = require('express');
var router = express.Router();
const CyclicDB = require('@cyclic.sh/dynamodb')
const db = CyclicDB(process.env.CYCLIC_DB)
let participants = db.collection('participants')

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to validate date of birth format (yyyy/MM/DD)
function isValidDateOfBirth(dob) {
  const dobRegex = /^\d{4}\/\d{2}\/\d{2}$/;
  return dobRegex.test(dob);
}


// MAIN CRUDS for participants 
router.get('/', async function (req, res, next) {
  try {
    let allparticipants = await participants.list();
    res.status(200).json({ status: 200, data: allparticipants });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { email, firstname, lastname, dob, companyname, salary, currency, country, city } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ status: 400, error: 'Invalid email format' });
    }

    // Validate date of birth format
    if (!isValidDateOfBirth(dob)) {
      return res.status(400).json({ status: 400, error: 'Invalid date of birth format. Use yyyy/MM/DD' });
    }

    // Checks if participant with the same email already exists
    const existingParticipant = await participants.item(email).get();
    if (existingParticipant) {
      return res.status(409).json({ status: 409, error: 'Participant with the same email already exists' });
    }

    // Add the new participant
    await participants.set(email, {
      firstname: firstname,
      lastname: lastname,
      dob: dob,
      active: true,
    });

    await participants.item(email).fragment('work').set({
      companyname: companyname,
      salary: salary,
      currency: currency,
    });

    await participants.item(email).fragment('home').set({
      country: country,
      city: city,
    });

    const participantData = await participants.item(email).get();
    const workFragment = await participants.item(email).fragment('work').get();
    const homeFragment = await participants.item(email).fragment('home').get();
    console.log('Participant Data:', participantData, 'Work Data:', workFragment, 'Home Data', homeFragment);
    res.status(201).json({ status: 201, Item: participantData, WorkFragment: workFragment, HomeFragment: homeFragment});
  } catch (error) {
    res.status(400).json({ status: 400, error: error.message });
  }
});

  router.delete('/:email', (req, res) => {
  return 	
  });

  router.put('/:email', (req, res) => {
  return 	
  });

  // GET Participants DETAILS
  router.get('/details', (req, res) => {
  return 	
  });

  router.get('/details/deleted', (req, res) => {
  return 	
  });

  router.get(' /details/:email', (req, res) => {
  return 	
  });

  router.get('/work/:email', (req, res) => {
  return 	
  });

  router.get('/home/:email', (req, res) => {
  return 	
  });
  
  module.exports = router;
