var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');

var DriverModel = require('../models/DriverModel');
var AccountModel = require('../models/AccountModel');
var JourneyModel = require('../models/JourneyModel');
var BusModel = require('../models/BusModel');
var ScheduleModel = require('../models/ScheduleModel');
var ClassModel = require('../models/ClassModel');
var TeacherModel = require('../models/TeacherModel');
var StudentModel = require('../models/StudentModel');

const {checkAdminSession, checkDriverSession} = require('../middlewares/auth');
const ClassModel = require('../models/ClassModel');
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
//show all driver
router.get('/',checkAdminSession, async(req, res) => {
    try{
        var driverList = await DriverModel.find({}).populate('account');
        //render view and pass data
        res.render('driver/index', {driverList});
    } catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
    
});

//-----------------------------------------------------------------------
//delete specific driver
router.get('/delete/:id',checkAdminSession, async(req, res) => {
    try{
        const driverId = req.params.id;
        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            throw new Error('Driver not found');
        }
        // Fetch account details by ID
        const accountId = driver.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        await DriverModel.findByIdAndDelete(driverId);
        await AccountModel.findByIdAndDelete(accountId);
        res.redirect('/driver');
    } catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    } 
});

//------------------------------------------------------------------------
//create driver
//render form for account to input
router.get('/add', checkAdminSession, async (req, res) => {
    try{
        res.render('driver/add');
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/add', checkAdminSession, upload.single('picture'), async (req, res) => {
    try{
        const name = req.body.name;
        const birth = req.body.birth;
        const gender = req.body.gender;
        const contact = req.body.contact;
        const address = req.body.address;
        const picture = req.file //access the uplodaded picture
        //read the picture file
        const pictureData = fs.readFileSync(picture.path);
        //convert picture data to base 64
        const base64Image = pictureData.toString('base64');
    
        const email = req.body.email;
        const password = req.body.password;
        const role = '65e7710db8020605732c8ee9';
    
        const account = await AccountModel.create({
            email: email,
            password: password,
            role: role
        }
        );
    
        await DriverModel.create(
            {
                name: name,
                birth: birth,
                gender: gender,
                contact: contact,
                address: address,
                picture: base64Image,
                account: account
            }
        );
        res.redirect('/driver');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('driver/add', { InputErrors, driver });
        }
     }  
});

//---------------------------------------------------------------------------
//edit driver
router.get('/edit/:id', checkAdminSession, async (req, res) => {
    try {
        // Fetch driver details by ID
        const driverId = req.params.id;
        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            throw new Error('Driver not found');
        }

        // Fetch account details by ID
        const accountId = driver.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Render edit form with driver details and dropdown options
        res.render('driver/edit', { driver, account});
    } catch (error) {
        // Handle errors (e.g., driver not found)
        console.error(error);
        res.status(404).send('Driver not found');
    }
});

router.post('/edit/:id', checkAdminSession, upload.single('picture'), async (req, res) => {
    try {
        // Fetch driver by ID
        const driverId = req.params.id;
        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            throw new Error('Driver not found');
        }
        // Fetch account details by ID
        const accountId = driver.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        // Update driver details
        driver.name = req.body.name;
        driver.birth = req.body.birth;
        driver.gender = req.body.gender;
        driver.contact = req.body.contact;
        driver.address = req.body.address;
        // If a new picture is uploaded, update it
        if (req.file) {
            const pictureData = fs.readFileSync(req.file.path);
            driver.picture = pictureData.toString('base64');  
        } 
        await driver.save();
        
        account.email = req.body.email;
        account.password = req.body.password;
        await account.save();

        // Redirect to driver list page
        res.redirect('/driver');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('driver/edit', { InputErrors, driver });
        }
     }
});

//--------------------------------------------Role Driver-------------------------
router.get('/menu', checkDriverSession, async(req, res) => {
    try{
        const driverId = req.session.driver_id;
        const driverData = await DriverModel.findById(driverId); //thông tin driver
        const journeyList = await JourneyModel.find({driver: driverId}); //thông tin journey
        
        //đẩy ra api
    } catch(error){
        console.error("Error while fetching Driver:", error);
        res.status(500).send("Internal Server Error");
    }
});

//edit driver
router.get('/editDriver/:id', checkDriverSession, async (req, res) => {
    try {
        // Fetch driver details by ID
        const driverId = req.session.driver_id;
        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            throw new Error('Driver not found');
        }

        // Fetch account details by ID
        const accountId = driver.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Render edit form with driver details and dropdown options
        res.render('driver/editDriver', { driver, account});
    } catch (error) {
        // Handle errors (e.g., driver not found)
        console.error(error);
        res.status(404).send('Driver not found');
    }
});

router.post('/editDriver/:id', checkDriverSession, upload.single('picture'), async (req, res) => {
    try {
        // Fetch driver by ID
        const driverId = req.session.driver_id;
        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            throw new Error('Driver not found');
        }
        // Fetch account details by ID
        const accountId = driver.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        // Update driver details
        driver.name = req.body.name;
        driver.birth = req.body.birth;
        driver.gender = req.body.gender;
        driver.contact = req.body.contact;
        driver.address = req.body.address;
        // If a new picture is uploaded, update it
        if (req.file) {
            const pictureData = fs.readFileSync(req.file.path);
            driver.picture = pictureData.toString('base64');  
        } 
        await driver.save();
        
        account.password = req.body.password;
        await account.save();

        // Redirect to driver list page
        res.redirect('/menu');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('driver/editDriver', { InputErrors, driver });
        }
     }
});

//journey page ----------------------------------------------------------
router.get('/journey/:id', checkDriverSession, async(req, res) => {
    try{
        const journeyId = req.params.id;
        const journeyData = await JourneyModel.findById(journeyId);
        const driverId = journeyData.driver;
        if(driverId == req.session.driver_id){
            if(journeyData) {
                const busId = journeyData.bus;
                const busData = BusModel.findById(busId); //thông tin của bus
                const scheduleId = journeyData.schedule; 
                const scheduleData = await ScheduleModel.findById(scheduleId); //thông tin của schedule
                const classId = scheduleData.classes;
                const classData = await ClassModel.findById(classId); //thông tin của Class
                if(classData){
                    const teacherId = classData.teacher;
                    const teacherData = await TeacherModel.findById(teacherId); //thông tin teacher
                    const studentList = await StudentModel.find({class: classId}); //danh sách student của class đó
                } else {
                    console.error("Error:", error);
                    res.status(500).send("Internal Server Error");
                }
    
                //đẩy ra api
            } else {
                console.error("Error:", error);
                res.status(500).send("Internal Server Error");
            }
        } else {
            console.error("Error:", error);
            res.status(500).send("Internal Server Error");
        }
    } catch(error){
        console.error("Error while fetching Journey:", error);
        res.status(500).send("Internal Server Error");
    }  
});




module.exports = router;
