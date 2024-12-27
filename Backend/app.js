var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const axios = require('axios');
require('dotenv').config()
const cors = require('cors')

//import "express-session" library
var session = require('express-session');

const hbs = require('hbs');// Define Handlebars helper to format dates

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

//---------------------------------------------------------
//3A. declare router (1 collection => 1 router)

var busRouter = require('./routes/bus');
var classRouter = require('./routes/class');
var driverRouter = require('./routes/driver');
var journeyRouter = require('./routes/journey');
var roleRouter = require('./routes/role');
var scheduleRouter = require('./routes/schedule');
var studentRouter = require('./routes/student')
var supervisorRouter = require('./routes/supervisor');
var teacherRouter = require('./routes/teacher');

var authRouter = require('./routes/auth');

//-----------------------------------------------------------

var app = express();

//----------------------------------------------------------
//set session timeout
const timeout = 10000 * 60 * 60 * 24;                      // 24 hours (in milliseconds), 60 minutes, 60 seconds
                                                           //config session parameters
app.use(session({
  secret: "the_key",                                       // Secret key for signing the session ID cookie
  resave: false,                                           // Forces a session that is "uninitialized" to be saved to the store
  saveUninitialized: true,                                 // Forces the session to be saved back to the session store
  cookie: { maxAge: timeout },
}));

//-----------------------------------------------------------
//1. config mongoose library (connect and work with database)
//1A. import library
var mongoose = require('mongoose');
//1B. set mongodb connection string
//Note1: Database name: BusIoT
var database = "";
//1C. connect to mongodb
mongoose.connect(database)
  .then(() => console.log('connect to db sucess'))
  .catch((err) => console.log('connect to db fail' + err));
  
  const PORT = process.env.PORT || 8000
  app.listen(PORT) 
  console.log("Server is running " + PORT)
//2. config body-parser library (get data from client-side)
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
//------------------------------------------------------------------

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());

app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//-------------------------------------------------------------------
//make session value can be accessible in view (hbs)
//IMPORTANT: place this code before setting router url
app.use((req, res, next) => {
  res.locals.email = req.session.email;
  res.locals.role = req.session.role;
  next();
});

//set user authorization for whole router
//IMPORTANT: place this code before setting router url
const { checkAdminSession } = require('./middlewares/auth');
app.use('/bus', checkAdminSession);
app.use('/class', checkAdminSession);
app.use('/journey', checkAdminSession);
app.use('/role', checkAdminSession);
app.use('/schedule', checkAdminSession);
app.use('/student', checkAdminSession);
//-------------------------------------------------------------------

app.use('/', indexRouter);
app.use('/users', usersRouter);

//------------------------------------------------------------------
//3B. declare web URL of router
app.use('/bus', busRouter);
app.use('/class', classRouter);
app.use('/driver', driverRouter);
app.use('/journey', journeyRouter);
app.use('/role', roleRouter);
app.use('/schedule', scheduleRouter);
app.use('/student', studentRouter);
app.use('/supervisor', supervisorRouter);
app.use('/teacher', teacherRouter);

app.use('/auth', authRouter);

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Import Firebase admin SDK
const admin = require('firebase-admin');
const GPSModel = require('./models/GPSModel');
const RFIDModel = require('./models/RFIDModel');
const historyRFIDModel = require('./models/historyRFIDModel');
const StudentModel = require('./models/StudentModel');
const HistoryModel = require('./models/HistoryModel');
const SupervisorModel = require('./models/SupervisorModel');
const AccountModel = require('./models/AccountModel');
const nodemailer = require('nodemailer');

// Initialize Firebase admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "",
    clientEmail: "",
    privateKey: ""
  }),
  databaseURL: ""
});

// Get a reference to the Firebase database
const db = admin.database();

// Set up listener for Firebase data
const gpsData = db.ref('/GPS');
const rfidData = db.ref('/RFID');

// Listen for changes in Firebase data
gpsData.on('child_added', (snapshot) => {
  const locationdata = snapshot.val();
  const deviceName = snapshot.key;
  // Check if the device already exists in the MongoDB collection
  GPSModel.findOne({ device: deviceName })
    .then((existingData) => {
      if (existingData) {
        // Update existing document
        return GPSModel.findOneAndUpdate(
          { device: deviceName },
          { $set: { latitude: locationdata.latitude, longitude: locationdata.longitude } },
          { new: true }
        );
      } else {
        // Create new document
        const gpsData = new GPSModel({
          device: deviceName,
          latitude: locationdata.latitude,
          longitude: locationdata.longitude,
        });
        return gpsData.save();
      }
    })
    .then(() => console.log('GPS saved/updated in MongoDB'))
    .catch((err) => console.error('Error saving/updating data in MongoDB:', err));
});

// gpsData.on('child_changed', (snapshot) => {
//   const locationdata = snapshot.val();
//   const deviceName = snapshot.key;
//   const updateData = {  // Create a plain JavaScript object for update
//     latitude: locationdata.latitude,
//     longitude: locationdata.longitude
//   };

//   // Find the corresponding document in MongoDB and update it
//   GPSModel.findOneAndUpdate(
//     { device: deviceName },
//     { $set: updateData }, // Pass the update object here
//     { new: true, upsert: true }
//   )
//   .then(() => console.log('Data updated in MongoDB'))
//   .catch((err) => console.error('Error updating data in MongoDB:', err));
// });

gpsData.on('child_changed', (snapshot) => {
  const locationdata = snapshot.val();
  const deviceName = snapshot.key;
  const updateData = {
    latitude: locationdata.latitude,
    longitude: locationdata.longitude
  };
  // Update GPS data in MongoDB
  GPSModel.findOneAndUpdate(
    { device: deviceName },
    { $set: updateData },
    { new: true, upsert: true }
  )
  .then(() => {
    console.log('GPS data updated in MongoDB');
    // Find corresponding RFID data in historyRFIDModel
    historyRFIDModel.find({ device: deviceName })
    .then((rfidDataArray) => {
      if (rfidDataArray && rfidDataArray.length > 0) {
        // Iterate through each RFID data
        rfidDataArray.forEach((rfidData) => {
          // Create new history entries continuously for each RFID data
          createContinuousHistoryEntries(deviceName, rfidData, locationdata);
        });
      } else {
        console.log('No RFID data found for device:', deviceName);
      }
    })
    .catch((error) => console.error('Error finding RFID data:', error));
  })
  .catch((err) => console.error('Error updating GPS data in MongoDB:', err));
});

// Function to create new history entries continuously
function createContinuousHistoryEntries(deviceName, rfidData, locationdata) {
  const newHistory = new HistoryModel({
    rfid: rfidData.data,
    latitude: locationdata.latitude,
    longitude: locationdata.longitude,
    date: formatDate(new Date()),
    time: formatTime(new Date())
  });
  // Save new history entry
  newHistory.save()
  .then(() => {
    console.log('New history entry created for RFID data:', rfidData.data);
  })
  .catch((error) => console.error('Error creating new history entry for RFID data:', rfidData.data, error));
}
// Function to format date (day, month, year)
function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-based
  const year = date.getFullYear();
  return `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
}
// Function to format time (hours, minutes, seconds)
function formatTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${hours}:${minutes}:${seconds}`;
}

// rfidData.on('child_added', (snapshot) => {
//   const rfidData = snapshot.val();
//   const deviceName = snapshot.key;
//   // Check if the device already exists in the MongoDB collection
//   RFIDModel.findOne({ device: deviceName })
//     .then((existingData) => {
//       if (existingData) {
//         // Update existing document
//         return RFIDModel.findOneAndUpdate(
//           { device: deviceName },
//           { $set: { data: rfidData.rfid_data } },
//           { new: true }
//         );
//       } else {
//         // Create new document
//         const rfidDataNew = new RFIDModel({
//           device: deviceName,
//           data: rfidData.rfid_data
//         });
//         return rfidDataNew.save();
//       }
//     })
//     .then(() => console.log('RFID saved/updated in MongoDB'))
//     .catch((err) => console.error('Error saving/updating RFID data in MongoDB:', err));
//     historyRFIDModel.findOne({ data: rfidData.rfid_data })
//     .then((existingData) => {
//       if (existingData) {
//         // delete existing document
//         return historyRFIDModel.findOneAndDelete(
//           { data: rfidData.rfid_data }
//         );
//       } else {
//         // Create new document
//         const historyRFIDNew = new historyRFIDModel({
//           device: deviceName,
//           data: rfidData.rfid_data
//         });
//         return historyRFIDNew.save();
//       }
//     })
//     .then(() => console.log('RFID saved/deleted in MongoDB'))
//     .catch((err) => console.error('Error saving/deleting RFID data in MongoDB:', err));
// });

// rfidData.on('child_changed', (snapshot) => {
//   const rfidData = snapshot.val();
//   const deviceName = snapshot.key;
//   const checkData = rfidData.rfid_data;
//   const updateData = {  // Create a plain JavaScript object for update
//     data: rfidData.rfid_data
//   };

//   // Find the corresponding document in MongoDB and update it
//   RFIDModel.findOneAndUpdate(
//     { device: deviceName },
//     { $set: updateData }, // Pass the update object here
//     { new: true, upsert: true }
//   )
//   .then(() => console.log('RFID Data updated in MongoDB'))
//   .catch((err) => console.error('Error updating RFID data in MongoDB:', err));

//   historyRFIDModel.findOne({ data: checkData})
//   .then((existingData) => {
//     if (existingData) {
//       // delete existing document
//       return historyRFIDModel.findOneAndDelete(
//         { data: checkData }
//       );
//     } else {
//       // Create new document
//       const historyRFIDNew = new historyRFIDModel({
//         device: deviceName,
//         data: checkData
//       });
//       return historyRFIDNew.save();
//     }
//   })
//   .then(() => console.log('RFID saved/deleted in MongoDB'))
//   .catch((err) => console.error('Error saving/deleting RFID data in MongoDB:', err));

// });

rfidData.on('child_added', (snapshot) => {
  const rfidData = snapshot.val();
  const deviceName = snapshot.key;

  // Check if the RFID data exists in the Student collection
StudentModel.findOne({ RFID: rfidData.rfid_data })
  .then((student) => {
    if (!student) {
      console.log(`RFID data ${rfidData.rfid_data} does not exist in the Student collection. Skipping.`);
      return; // Skip saving the RFID data
    }

    // If RFID data exists in Student collection, proceed with saving to RFIDModel
    return saveRFIDData(deviceName, rfidData);
  })
  .catch((err) => console.error('Error checking RFID data in Student collection:', err));
});

function saveRFIDData(deviceName, rfidData) {
  // Check if the device already exists in the MongoDB collection
  RFIDModel.findOne({ device: deviceName })
    .then((existingData) => {
      if (existingData) {
        // Update existing document
        return RFIDModel.findOneAndUpdate(
          { device: deviceName },
          { $set: { data: rfidData.rfid_data } },
          { new: true }
        );
      } else {
        // Create new document
        const rfidDataNew = new RFIDModel({
          device: deviceName,
          data: rfidData.rfid_data
        });
        return rfidDataNew.save();
      }
    })
    .then(() => console.log('RFID saved/updated in MongoDB'))
    .catch((err) => console.error('Error saving/updating RFID data in MongoDB:', err));

    historyRFIDModel.findOne({ data: rfidData.rfid_data })
    .then((existingData) => {
      if (existingData) {
        const RFID_data = rfidData.rfid_data;
        sendMailStudentOffBus(RFID_data);
        // delete existing document
        return historyRFIDModel.findOneAndDelete(
          { data: rfidData.rfid_data }
        );
        
      } else {
        // Create new document
        const historyRFIDNew = new historyRFIDModel({
          device: deviceName,
          data: rfidData.rfid_data
        });
        const RFID_data = rfidData.rfid_data;
        historyRFIDNew.save();
        return sendMailStudentOnBus(RFID_data);
      }
    })
    .then(() => console.log('RFID saved/deleted in MongoDB'))
    .catch((err) => console.error('Error saving/deleting RFID data in MongoDB:', err));
}

rfidData.on('child_changed', (snapshot) => {
  const rfidData = snapshot.val();
  const deviceName = snapshot.key;
  const checkData = rfidData.rfid_data;

  // Check if the RFID data exists in the Student collection
  StudentModel.findOne({ RFID: checkData })
    .then((student) => {
      if (!student) {
        console.log(`RFID data ${checkData} does not exist in the Student collection. Skipping.`);
        return; // Skip updating the RFID data
      }

      // If RFID data exists in Student collection, proceed with updating RFID data
      return updateRFIDData(deviceName, rfidData);
    })
    .catch((err) => console.error('Error checking RFID data in Student collection:', err));
});

function updateRFIDData(deviceName, rfidData) {
  const updateData = {
    data: rfidData.rfid_data
  };
  const checkData = rfidData.rfid_data;
  // Update the corresponding document in MongoDB
  RFIDModel.findOneAndUpdate(
    { device: deviceName },
    { $set: updateData }, // Pass the update object here
    { new: true, upsert: true }
  )
  .then(() => console.log('RFID Data updated in MongoDB'))
  .catch((err) => console.error('Error updating RFID data in MongoDB:', err));

  historyRFIDModel.findOne({ data: checkData})
  .then((existingData) => {
    if (existingData) {
      const RFID_data = rfidData.rfid_data;
      sendMailStudentOffBus(RFID_data);
      // delete existing document
      return historyRFIDModel.findOneAndDelete(
        { data: checkData }
      );
      
    } else {
      // Create new document
      const historyRFIDNew = new historyRFIDModel({
        device: deviceName,
        data: checkData
      });
      historyRFIDNew.save();
      const RFID_data = rfidData.rfid_data;
      return sendMailStudentOnBus(RFID_data);
    }
  })
  .then(() => console.log('RFID saved/deleted in MongoDB'))
  .catch((err) => console.error('Error saving/deleting RFID data in MongoDB:', err));
}

async function sendMailStudentOnBus(RFID_data) {
  try {
    const studentData = await StudentModel.findOne({ RFID: RFID_data });
    if (!studentData) {
      console.log('Student data not found for RFID:', RFID_data);
      return;
    }

    const supervisorData = await SupervisorModel.findById(studentData.supervisor);
    if (!supervisorData) {
      console.log('Supervisor data not found for student:', studentData.name);
      return;
    }

    const supervisorAccount = await AccountModel.findById(supervisorData.account);
    if (!supervisorAccount) {
      console.log('Account data not found for supervisor:', supervisorData.name);
      return;
    }

    const supervisorEmail = supervisorAccount.email;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_GMAIL,
        pass: process.env.PASSWORD_GMAIL
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_GMAIL,
      to: supervisorEmail,
      subject: 'Student: ' + studentData.name + ' is on the bus',
      text: `Your student is on the bus`
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to supervisor:', supervisorEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function sendMailStudentOffBus(RFID_data) {
  try {
    const studentData = await StudentModel.findOne({ RFID: RFID_data });
    if (!studentData) {
      console.log('Student data not found for RFID:', RFID_data);
      return;
    }

    const supervisorData = await SupervisorModel.findById(studentData.supervisor);
    if (!supervisorData) {
      console.log('Supervisor data not found for student:', studentData.name);
      return;
    }

    const supervisorAccount = await AccountModel.findById(supervisorData.account);
    if (!supervisorAccount) {
      console.log('Account data not found for supervisor:', supervisorData.name);
      return;
    }

    const supervisorEmail = supervisorAccount.email;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_GMAIL,
        pass: process.env.PASSWORD_GMAIL
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_GMAIL,
      to: supervisorEmail,
      subject: 'Student: ' + studentData.name + ' is off the bus',
      text: `Your student is off the bus`
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to supervisor:', supervisorEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//----------------------------------------
//support edit function
hbs.registerHelper('formatDate', function(date) {
  return date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
});

//--------------------
hbs.registerHelper('ifCond1', function(v1, v2, options) {
  if (v1 === v2) {
      return options.fn(this);
  }
  return options.inverse(this);
});
//-------------------------------------------
function ifCond(v1, operator, v2, options) {
  switch (operator) {
      case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
  }
}
//Register the helper with Handlebars
hbs.registerHelper('ifCond', ifCond);
//-----------------------------------
// hbs.registerHelper('eq', function(arg1, arg2, options) {
//   return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
// });
//-----------------------------------
module.exports = app;
