const express = require("express");
const app = express();
const port = 3003;
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const session = require('express-session');
const exceljs =require('exceljs');
const Razorpay = require('razorpay');
// MongoDB connection URL and database name
const mongoUrl = 'mongodb+srv://devadathnair4397:Appu2002@cluster0.tibnbqu.mongodb.net/gym';

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Create a new instance of the Razorpay client with your Razorpay API credentials
const razorpay = new Razorpay({
  key_id: 'rzp_test_wSLj8hoqkdDWYq',
  key_secret: 'uWPzvBD4szgrx6PMmTB6cHw8',
});



// Configure body-parser and serve static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');


// Define schema for "admin" collection
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }
});

// Define schema for "trainer" collection
const trainerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  bloodgroup: { type: String, required: true },
  dob: { type: String, required: true },
  age: { type: Number, required: true },
  address: { type: String, required: true } ,
  assignedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'member'
  }]

});
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: String, required: true },
  age: { type: Number, required: true },
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  bloodgroup: { type: String, required: true },
  address: { type: String, required: true }, 
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'trainer' },
  payment: { type: Number },
  message:{type:String},
  enrolled:{type:Date},
  planStatus: { type: String },
  expiry:{type:Date}
});



// Create models for "admin", "trainer" and "member" collections
const Admin = mongoose.model('admin', adminSchema);
const Trainer = mongoose.model('trainer', trainerSchema);
const Member = mongoose.model('member', memberSchema);

// Connect to MongoDB
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB:', error);
  });

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/about.html');
});

app.get('/blog', (req, res) => {
  res.sendFile(__dirname + '/blog.html');
});

app.get('/class', (req, res) => {
  res.sendFile(__dirname + '/class.html');
});

app.get('/feature', (req, res) => {
  res.sendFile(__dirname + '/feature.html');
});

app.get('/contact', (req, res) => {
  res.sendFile(__dirname + '/contact.html');
});

app.get('/single', (req, res) => {
  res.sendFile(__dirname + '/single.html');
});

app.get('/admin/login', (req, res) => {
  res.sendFile(__dirname + '/ADMIN.html');
});

app.get('/trainer/login', (req, res) => {
  res.sendFile(__dirname + '/public/TRAINER.html');
});

app.get('/member/login', (req, res) => {
  res.sendFile(__dirname + '/public/USER.html');
});
app.get('/calculator', (req, res) => {
    res.sendFile(__dirname + '/public/calculatebmi.html');
  });
  app.get('/member/change-password', (req, res) => {
    res.sendFile(__dirname + '/public/forgotmember.html');
  });
  app.get('/admin/change-password', (req, res) => {
    res.sendFile(__dirname + '/public/forgotadmin.html');
  });
  app.get('/trainer/change-password', (req, res) => {
    res.sendFile(__dirname + '/public/forgottrainer.html');
  });

  app.use('/img',express.static(__dirname + '/img'));
  app.use('/css',express.static(__dirname + '/css'));
  app.use('/images',express.static(__dirname + '/img'));


  const { v4: uuidv4 } = require('uuid');

  app.post('/trainer/signup', async (req, res) => {
    const trainerData = req.body;
    trainerData.id = uuidv4();
    const newTrainer = new Trainer(trainerData);
    
    try {
      const existingTrainer = await Trainer.findOne({ name: trainerData.name });
      const existingMember = await Member.findOne({ name: trainerData.name });
  
      if (existingTrainer || existingMember) {
        return res.status(400).json({ error: 'Trainer name already taken' });
      }
      
      await newTrainer.save();
      res.send('Trainer signup successful');
    } catch (error) {
      console.log('Error creating trainer:', error);
      res.status(500).send('Error creating trainer');
    }
  });
  
  

  app.post('/member/signup', async (req, res) => {
    const memberData = req.body;
    memberData.id = uuidv4(); // Generate a unique ID for the member
    const newMember = new Member(memberData);
  
    try {
      const existingMember = await Member.findOne({ name: memberData.name });
  
      if (existingMember) {
        return res.status(400).json({ error: 'Member name already taken' });
      }
  
      await newMember.save();
      res.send('Member signup successful');
    } catch (error) {
      console.log('Error creating member:', error);
      res.status(500).send('Error creating member');
    }
  });
  
  
  
  app.post('/admin', async (req, res) => {
    const { name, password } = req.body;
  
    try {
      const admin = await Admin.findOne({ name: name, password: password });
  
      if (!admin) {
        res.status(401).json({ error: 'Invalid credentials' });
      } else {
        const trainers = await Trainer.find();
        const members = await Member.find();
  
        // Render the admin-dashboard view using EJS template and pass the trainers and members data
        res.render('admin-dashboard', { trainers: trainers, members: members });
      }
    } catch (error) {
      console.error('Invalid request', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  app.post('/member', async (req, res) => {
    const { name, password } = req.body;
  
    try {
      const member = await Member.findOne({ name: name, password: password });
  
      if (!member) {
        res.status(401).json({ error: 'Invalid credentials' });
      } else {
        const trainers = await Trainer.find();
        const members = await Member.find();
  
        // Render the admin-dashboard view using EJS template and pass the trainers and members data
        res.render('member-details', { trainers: trainers, members: members });
      }
    } catch (error) {
      console.error('Invalid request', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/trainer', async (req, res) => {
    const { name, password } = req.body;
  
    try {
      const trainer = await Trainer.findOne({ name: name, password: password });
  
      if (!trainer) {
        res.status(401).json({ error: 'Invalid credentials' });
      } else {
        const trainers = await Trainer.find();
        const members = await Member.find();
  
        // Get the signedInTrainerId from the authenticated trainer
        const signedInTrainerId = trainer.id;
  
        // Render the trainer-dashboard view using EJS template and pass the trainers, members, and signedInTrainerId data
        res.render('trainer-dashboard', { trainers: trainers, members: members, signedInTrainerId });
      }
    } catch (error) {
      console.error('Invalid request', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
app.post('/member/change-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const member = await Member.findOne({ email: email });

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
    }
    else {
      member.password = newPassword;
      await member.save();

      res.send('<script>alert("Password changed successfully");</script>');
    }
  } catch (error) {
    console.error('Invalid request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/deletemember/:id', (req, res)=>{
  Member.deleteOne({_id:req.params.id})
  .then(async(x)=>{
    const trainers = await Trainer.find();
    const members = await Member.find();

    // Render the admin-dashboard view using EJS template and pass the trainers and members data
    res.render('admin-dashboard', { trainers: trainers, members: members });
  })
  .catch((y)=>{
      console.log(y)
  })
})

app.post('/deletetrainer/:id', async(req, res)=>{
  Trainer.deleteOne({_id:req.params.id})
  .then(async(x)=>{
    const trainers = await Trainer.find();
    const members = await Member.find();

    // Render the admin-dashboard view using EJS template and pass the trainers and members data
    res.render('admin-dashboard', { trainers: trainers, members: members });
  })
  .catch((y)=>{
      console.log(y)
  })
})

app.post('/trainer/change-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const trainer = await Trainer.findOne({ email: email });

    if (!trainer) {
      res.status(404).json({ error: 'Trainer not found' });
    }
    else if (trainer.password !== password) {
      res.status(401).json({ error: 'password already taken' });
     } else {
      trainer.password = newPassword;
      await trainer.save();

      res.send('<script>alert("Password changed successfully");</script>');
      res.json({ message: 'Password changed successfully' });
    }
  } catch (error) {
    console.error('Invalid request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/admin/change-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const admin = await Admin.findOne({ email: email });

    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
    } else {
      admin.password = newPassword;
      await admin.save();

      res.send('<script>alert("Password changed successfully");</script>');
    }
  } catch (error) {
    console.error('Invalid request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/member/update', async (req, res) => {
  const { id, height, weight } = req.body;

  try {
    // Find the member by their _id
    const member = await Member.findById(id);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });

    }

    // Update the member's height and weight
    member.height = height;
    member.weight = weight;
    await member.save();

    // Return a success message
    res.send('<script>alert("Member details updated successfully");</script>');
   
  } catch (error) {
    console.error('Invalid request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/logout', (req, res) => {
  // Clear the user's session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    // Redirect the user to the login page or any other desired page
    res.redirect('/');
  });
});


app.post('/admin/assign-trainer', async (req, res) => {
  const { memberId, trainerId } = req.body;

  try {
    const member = await Member.findById(memberId);
    const trainer = await Trainer.findById(trainerId);

    if (!member || !trainer) {
      return res.status(404).json({ error: 'Member or trainer not found' });
    }

    member.trainer = trainerId;
    await member.save();
    
    trainer.assignedMembers.push(member.id);
    await trainer.save();

    res.send({ message: 'Trainer assigned successfully', trainerName: trainer.name });
  } catch (error) {
    console.error('Error assigning trainer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/exportmembers', async (req, res) => {
  try {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('gym');

    worksheet.columns = [
      { header: "S.no", key: "s_no" },
      { header: "Name", key: "name" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phone" },
      { header: "Plan Status", key: "planStatus" },
      { header: "Enrolled", key: "enrolled" },
      { header: "Expiry", key: "expiry" },
      { header: "Height", key: "height" },
      { header: "Weight", key: "weight" },
      { header: "Bloodgroup", key: "bloodgroup" },
      { header: "Age", key: "age" },
      { header: "Date of Birth", key: "dob" },
    ];

    let counter = 1;
    const data = await Member.find();

    data.forEach((user) => {
      user.s_no = counter;
      worksheet.addRow(user);
      counter++;
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment;filename=members.xlsx');

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//export trainer data
app.get('/exporttrainers', async (req, res) => {
  try {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('gym');

    worksheet.columns = [
      { header: "S.no", key: "s_no" },
      { header: "Name", key: "name" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phone" },
      { header: "Bloodgroup", key: "bloodgroup" },
      { header: "Age", key: "age" },
      { header: "Date of Birth", key: "dob" },
    ];

    let counter = 1;
    const data = await Trainer.find();

    data.forEach((user) => {
      user.s_no = counter;
      worksheet.addRow(user);
      counter++;
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment;filename=trainers.xlsx');

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


app.post('/api/payments', (req, res) => {
  const { memberId, selectedPlan } = req.body;
  // This could involve making a request to the Razorpay API or accessing a database
 
  // Generate a unique order ID using UUID
  const orderId = uuidv4();

  // Set the payment amount based on the selected plan
  let amount;
  if (selectedPlan === 'platinum') {
    amount = 599900; // Amount in paisa (e.g., 599900 paisa = Rs 5999)
  } else {
    amount = 59900; // Amount in paisa (e.g., 59900 paisa = Rs 599)
  }

  const orderDetails = {
    key: 'rzp_test_wSLj8hoqkdDWYq',
    amount: amount,
    currency: 'INR',
    order_id: orderId, 
  };

  res.json(orderDetails);
});


app.post('/extendexpiry', async (req, res) => {
  try {
    const {memberId,  option } = req.body;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).send('Member not found');
    }

    const currentExpiry = new Date(member.expiry);

    if (option === 'monthly') {
      currentExpiry.setMonth(currentExpiry.getMonth() + 1);
    } else if (option === 'yearly') {
      currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
    } else {
      return res.status(400).send('Invalid option');
    }

    member.expiry = currentExpiry;
    await member.save();

    res.send('expiry extended successfully'); // Redirect to the dashboard or any other desired location
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
