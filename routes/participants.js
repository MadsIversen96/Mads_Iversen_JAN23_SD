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

    // Validates email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ status: 400, error: 'Invalid email format' });
    }

    // Validates date of birth format
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
    res.status(201).json({ status: 201, message: "Participant successfully created", Item: participantData, WorkFragment: workFragment, HomeFragment: homeFragment});
  } catch (error) {
    res.status(400).json({ status: 400, error: error.message });
  }
});

router.delete('/:email', async (req, res) => {
  try {
    const participant = await participants.item(req.params.email).get();

    // Checks if the participant exists
    if (!participant) {
      return res.status(404).json({ status: 404, error: "Participant not found." });
    }

    // Checks if the participant is already inactive/false
    if (participant.props.active === false) {
      return res.status(400).json({ status: 400, error: "Participant is already inactive." });
    }

    // Sets participant to inactive/false
    await participants.set(req.params.email, {
      active: false
    });
    
    console.log(await participants.item(req.params.email).get())
    res.status(201).json({ status: 201, message: "Participant was successfully deleted." });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

  router.put('/:email', async (req, res) => {
    try {
      const { email, firstname, lastname, dob, companyname, salary, currency, country, city } = req.body;
  
      // Validates email format
      if (!isValidEmail(email)) {
        return res.status(400).json({ status: 400, error: 'Invalid email format' });
      }
  
      // Validates date of birth format
      if (!isValidDateOfBirth(dob)) {
        return res.status(400).json({ status: 400, error: 'Invalid date of birth format. Use yyyy/MM/DD' });
      }
  
      // Updates the participant
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
      res.status(201).json({ status: 201, message: 'Participant successfully updated', Item: participantData, WorkFragment: workFragment, HomeFragment: homeFragment});
    } catch (error) {
      res.status(400).json({ status: 400, error: error.message });
    }
  });

  // GET different Participants DETAILS

  //GETs personal details from active participants
  router.get('/details', async (req, res) => {
    try {
      const activeParticipants = await participants.filter({ active: true });
      res.status(200).json({ status: 200, data: activeParticipants });
    } catch (error) {
      res.status(500).json({ status: 500, error: error.message });
    }
  });
  
  router.get('/details/deleted', async (req, res) => {
    try {
      const inactiveParticipants = await participants.filter({ active: false });
      res.status(200).json({ status: 200, data: inactiveParticipants });
    } catch (error) {
      res.status(500).json({ status: 500, error: error.message });
    }
  });

  router.get('/details/:email', async (req, res) => {
    try {
      const activeParticipant = await participants.item(req.params.email).get();
  
      if (!activeParticipant) {
        return res.status(404).json({ status: 404, error: "Participant not found." });
      }
  
      if (activeParticipant.props.active === false) {
        return res.status(400).json({ status: 400, error: "Participant is inactive." });
      }
  
      res.status(200).json({ status: 200, data: activeParticipant });
    } catch (error) {
      res.status(500).json({ status: 500, error: error.message });
    }
  });

  router.get('/work/:email', async(req, res) => {
    try {
      const activeParticipant = await participants.item(req.params.email).get();
      const workInfo = await participants.item(req.params.email).fragment('work').get();
  
      if (!activeParticipant) {
        return res.status(404).json({ status: 404, error: "Participant not found." });
      }
  
      if (activeParticipant.props.active === false) {
        return res.status(400).json({ status: 400, error: "Participant is inactive." });
      }

      if(!workInfo){
        return res.status(404).json({ status: 404, error: "Participant does not have work information." });
      }
  
      res.status(200).json({ status: 200, data: workInfo });
    } catch (error) {
      res.status(500).json({ status: 500, error: error.message });
    }
  });

  router.get('/home/:email', async(req, res) => {
    try {
      const activeParticipant = await participants.item(req.params.email).get();
      const homeInfo = await participants.item(req.params.email).fragment('home').get();
  
      if (!activeParticipant) {
        return res.status(404).json({ status: 404, error: "Participant not found." });
      }
  
      if (activeParticipant.props.active === false) {
        return res.status(400).json({ status: 400, error: "Participant is inactive." });
      }

      if(!homeInfo){
        return res.status(404).json({ status: 404, error: "Participant does not have work information." });
      }
  
      res.status(200).json({ status: 200, data: homeInfo });
    } catch (error) {
      res.status(500).json({ status: 500, error: error.message });
    } 	
  });
  
  module.exports = router;
