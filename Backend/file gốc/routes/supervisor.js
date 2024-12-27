var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');

var AccountModel = require('../models/AccountModel');
var BusModel = require('../models/BusModel');
var ClassModel = require('../models/ClassModel');
var DriverModel = require('../models/DriverModel');
var JourneyModel = require('../models/JourneyModel');
var ScheduleModel = require('../models/ScheduleModel');
var StudentModel = require('../models/StudentModel');
var SupervisorModel = require('../models/SupervisorModel');
var TeacherModel = require('../models/TeacherModel');

const {checkAdminSession, checkSupervisorSession} = require('../middlewares/auth');

const { scheduler } = require('timers/promises');

//-------------------------------------------------------------------------
// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/') // Set the destination folder where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now()) // Set the filename to avoid name conflicts
    }
});

const upload = multer({ storage: storage });


//------------------------------------------------------------------------
//show all 
router.get('/', checkAdminSession, async(req, res) => {
    try{
        var supervisorList = await SupervisorModel.find({}).populate('account');
        //render view and pass data
        res.render('supervisor/index', {supervisorList});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//-----------------------------------------------------------------------
//delete specific supervisor
router.get('/delete/:id', checkAdminSession, async(req, res) => {
    try{
        const supervisorId = req.params.id;
        const supervisor = await SupervisorModel.findById(supervisorId);
        if (!supervisor) {
            throw new Error('Supervisor not found');
        }
        // Fetch account details by ID
        const accountId = supervisor.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        await SupervisorModel.findByIdAndDelete(supervisorId);
        await AccountModel.findByIdAndDelete(accountId);
        res.redirect('/supervisor');
    } catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    } 
});

//------------------------------------------------------------------------
//create supervisor
//render form for user to input
router.get('/add', checkAdminSession, async (req, res) => {
    try{
        res.render('supervisor/add');
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
})

router.post('/add', checkAdminSession, upload.single('picture'), async (req, res) => {
    try{
        const name = req.body.name;
        const gender = req.body.gender;
        const birth = req.body.birth;
        const contact = req.body.contact
        const address = req.body.address;
        const picture = req.file //access the uplodaded image
        const latitude = req.body.latitude;
        const longtitude = req.body.longtitude;

        const email = req.body.email;
        const password = req.body.password;
        const role = '65e7710db8020605732c8eeb';
    
        //read the image file
        const imageData = fs.readFileSync(picture.path);
        //convert image data to base 64
        const base64Image = imageData.toString('base64');

        const account = await AccountModel.create({
            email: email,
            password: password,
            role: role
        });

        await SupervisorModel.create(
            {
                name: name,
                gender: gender,
                birth: birth,
                contact: contact,
                address: address,
                picture: base64Image,
                account: account,
                latitude: latitude,
                longtitude: longtitude
            }
        );
        res.redirect('/supervisor');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('supervisor/add', { InputErrors, supervisor });
        }
     }  
    
})

//---------------------------------------------------------------------------
//edit supervisor
//edit supervisor
router.get('/edit/:id', checkAdminSession, async (req, res) => {
    try {
        // Fetch supervisor details by ID
        const supervisorId = req.params.id;
        const supervisor = await SupervisorModel.findById(supervisorId);
        if (!supervisor) {
            throw new Error('Supervisor not found');
        }

        // Fetch account details by ID
        const accountId = supervisor.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Render edit form with supervisor details and dropdown options
        res.render('supervisor/edit', { supervisor, account});
    } catch (error) {
        // Handle errors (e.g., supervisor not found)
        console.error(error);
        res.status(404).send('Supervisor not found');
    }
});

router.post('/edit/:id', checkAdminSession, upload.single('picture'), async (req, res) => {
    try {
        // Fetch supervisor by ID
        const supervisorId = req.params.id;
        const supervisor = await SupervisorModel.findById(supervisorId);
        if (!supervisor) {
            throw new Error('Supervisor not found');
        }
        // Fetch account details by ID
        const accountId = supervisor.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        // Update supervisor details
        supervisor.name = req.body.name;
        supervisor.birth = req.body.birth;
        supervisor.gender = req.body.gender;
        supervisor.contact = req.body.contact;
        supervisor.address = req.body.address;
        supervisor.latitude = req.body.latitude;
        supervisor.longtitude = req.body.longtitude;
        // If a new picture is uploaded, update it
        if (req.file) {
            const pictureData = fs.readFileSync(req.file.path);
            supervisor.picture = pictureData.toString('base64');  
        } 
        await supervisor.save();
        
        account.email = req.body.email;
        account.password = req.body.password;
        await account.save();

        // Redirect to supervisor list page
        res.redirect('/supervisor');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('supervisor/edit', { InputErrors, supervisor });
        }
     }
});

//--------------phần này cho role supervisor------------------------------------
//menu page------------------------
router.get('/menu', checkSupervisorSession, async(req, res) => {
    try{
        const supervisorId = req.session.supervisor_id;
        const supervisorData = await SupervisorModel.findById(supervisorId);
        const StudentList = await StudentModel.find({supervisor: supervisorId});
        //api
    } catch(error){
        console.error("Error while fetching Driver:", error);
        res.status(500).send("Internal Server Error");
    }
});

//student details page: student Detail, class, schedule-----------------------------------------
router.get('/student/:id', checkSupervisorSession, async(req, res) => {
    try{
        const supervisorId = req.session.supervisor_id;
        const studentId = req.params.id;
        const studentData = await StudentModel.findById(studentId); //thông tin của student
        if(studentData){
            const supervisorId2 = studentData.supervisor;
            const classId = studentData.class;
            const classData = await ClassModel.findById(classId); //thông tin class mà student thuộc về 
            if(classData){
                const scheduleData = await ScheduleModel.find({classes: classId}); //thông tin của schedule mà class thuộc về
            }
            if (supervisorId2 == supervisorId){
                res.render('/student', studentData, classData, scheduleData); //api
            } else {
                console.error("Error while fetching student:", error);
                res.status(500).send("Internal Server Error");
            }
        } else {
            console.error("Error while fetching student:", error);
            res.status(500).send("Internal Server Error");
        }
    } catch(error){
        console.error("Error while fetching Driver:", error);
        res.status(500).send("Internal Server Error");
    }
    
});

//edit supervisor------------------------------------------------------------------------
router.get('/editSupervisor/:id', checkSupervisorSession, async (req, res) => {
    try {
        // Fetch supervisor details by ID
        const supervisorId = req.params.id;
        if(supervisorId == req.session.supervisor_id){
            const supervisor = await SupervisorModel.findById(supervisorId);
            if (!supervisor) {
                throw new Error('Supervisor not found');
            }
    
            const accountId = supervisor.account;
            const account = await AccountModel.findById(accountId);
            if (!account) {
                throw new Error('Account not found');
            }

            res.render('supervisor/editSupervisor', { supervisor, account});
        } else {
            console.error(error);
            res.status(404).send('Supervisor not found');
        }
        
    } catch (error) {
        // Handle errors (e.g., supervisor not found)
        console.error(error);
        res.status(404).send('Supervisor not found');
    }
});

router.post('/editSupervisor/:id', checkSupervisorSession, upload.single('picture'), async (req, res) => {
    try {
        const supervisorId = req.params.id;
        if (supervisorId == req.session.supervisor_id){
            const supervisor = await SupervisorModel.findById(supervisorId);
            if (!supervisor) {
                throw new Error('Supervisor not found');
            }
            const accountId = supervisor.account;
            const account = await AccountModel.findById(accountId);
            if (!account) {
                throw new Error('Account not found');
            }

            // Update supervisor details
            supervisor.name = req.body.name;
            supervisor.birth = req.body.birth;
            supervisor.gender = req.body.gender;
            supervisor.contact = req.body.contact;
            supervisor.address = req.body.address;
            supervisor.latitude = req.body.latitude; //cần chú ý đoạn này
            supervisor.longtitude = req.body.longtitude;
    
            if (req.file) {
                const pictureData = fs.readFileSync(req.file.path);
                supervisor.picture = pictureData.toString('base64');  
            } 
            await supervisor.save();
            
            account.password = req.body.password;
            await account.save();
    
            res.redirect('/supervisor');
        } else {
            console.error(error);
            res.status(404).send('Supervisor not found');
        }
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('supervisor/edit', { InputErrors, supervisor });
        }
     }
});

//edit student--------------------------------------------------------------------------------
router.get('/editStudent/:id', checkSupervisorSession, async (req, res) => {
    try {
        const studentId = req.params.id;
        const studentData = await StudentModel.findById(studentId);
        if(studentData){
            const supervisorId = studentData.supervisor;
            if (supervisorId == req.session.supervisor_id){
                res.render('student/edit', { studentData });
            } else {
                throw new Error('Student not found');
            }
        } else {
            throw new Error('Student not found');
        }
    } catch (error) {
        // Handle errors (e.g., student not found)
        console.error(error);
        res.status(404).send('Student not found');
    }
});

router.post('/editStudent/:id', checkSupervisorSession, upload.single('picture'), async (req, res) => {
    try {
        const studentId = req.params.id;
        const studentData = await StudentModel.findById(studentId);
        if(studentData){
            const supervisorId = studentData.supervisor;
            if (supervisorId == req.session.supervisor_id){
                studentData.name = req.body.name;
                studentData.birth = req.body.birth;
                studentData.gender = req.body.gender;
                studentData.RFID = req.body.RFID;
                if (req.file) {
                    const pictureData = fs.readFileSync(req.file.path);
                    studentData.picture = pictureData.toString('base64');
                }
                await studentData.save();
                res.redirect('/supervisor');
            } else {
                throw new Error('Student not found');
            }
        } else {
            throw new Error('Student not found');
        }
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

// schedule page -----------------------------------------------------------------
router.get('/schedule/:id', checkSupervisorSession, async(req, res) => {
    try{
        const scheduleId = req.params.id;
        const scheduleData = await ScheduleModel.findById(scheduleId); //thông tin schedule
        if (scheduleData){
            const classId = scheduleData.classes;
            const classData = await ClassModel.findById(classId); //thông tin class
            if(classData){
                const teacherId = classData.teacher;
                const teacherData = await TeacherModel.findById(teacherId); //thông tin teacher
            } else {
                console.error(error);
                res.status(400).send(error.message);
            }
            const journeyList = await JourneyModel.find({schedule: scheduleId}); //thông tin journey
            //đẩy api
        } else {
            console.error(error);
            res.status(400).send(error.message);
        }
    }catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

//journey page ----------------------------------------------------------------
router.get('/journey/:id', checkSupervisorSession, async(req, res) => {
    try{
        const journeyId = req.params.id;
        const journeyData = await JourneyModel.findById(journeyId); //thông tin journey (cần chsu ý thông tin longtitude, latitude);
        if(journeyData){
            const busId = journeyData.bus;
            const driverId = journeyData.driver;
            const busData = await BusModel.findById(busId); //thông tin bus
            const driverData = await DriverModel.findById(driverId); //thông tin driver
            //đẩy api ra đây
        }
    }catch(error){
        console.error("Error while fetching journey:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
