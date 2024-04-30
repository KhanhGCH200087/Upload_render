var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');
var bcrypt = require('bcryptjs');
var salt = 8; 

var DriverModel = require('../models/DriverModel');
var AccountModel = require('../models/AccountModel');
var JourneyModel = require('../models/JourneyModel');
var BusModel = require('../models/BusModel');
var ScheduleModel = require('../models/ScheduleModel');
var ClassModel = require('../models/ClassModel');
var TeacherModel = require('../models/TeacherModel');
var StudentModel = require('../models/StudentModel');

const {checkAdminSession, checkDriverSession} = require('../middlewares/auth');
const { error, Console } = require('console');

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
router.get('/', checkAdminSession, async(req, res) => {
    try{
        var driverList = await DriverModel.find({}).populate('account');
        if(!driverList){
            const message = "There are no driver List";
            res.render('admin/driver/index', {message, layout: 'layoutAdmin'});
        }
        if(driverList.length === 0){
            const message = "There are no driver List";
            res.render('admin/driver/index', {message, layout: 'layoutAdmin'});
        }
        res.render('admin/driver/index', {driverList, layout: 'layoutAdmin'});
    } catch(error){
        console.error("Error:", error);
        const message = "Error when showing driver list";
        res.render('admin/driver/index', {message, layout: 'layoutAdmin'});
    }
});

//-----------------------------------------------------------------------
//delete specific driver
router.get('/delete/:id',checkAdminSession, async(req, res) => {
    var driverList = await DriverModel.find({}).populate('account');
    try{
        const driverId = req.params.id;
        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            const message = "There are no driver to delete";
            res.render('admin/driver/index', {message, driverList, layout: 'layoutAdmin'});
        }
        const accountId = driver.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            const message = "There are no driver account to delete";
            res.render('admin/driver/index', {message, driverList, layout: 'layoutAdmin'});
        }
        await DriverModel.findByIdAndDelete(driverId);
        await AccountModel.findByIdAndDelete(accountId);
        res.redirect('/driver')
    } catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when delete driver";
        res.render('admin/driver/index', {message, driverList, layout: 'layoutAdmin'});
    } 
});

//------------------------------------------------------------------------
router.get('/add', checkAdminSession,async(req,res) => {
    res.render('admin/driver/add', {layout: 'layoutAdmin'});
});
//create driver
router.post('/add',checkAdminSession, upload.single('picture'), async (req, res) => {
    try{
        const name = req.body.name;
        const gender = req.body.gender;
        const contact = req.body.contact;
        const address = req.body.address;
        const picture = req.file;
        const email = req.body.email;
        const password = req.body.password;
        const hashPassword = bcrypt.hashSync(password, salt);
        const role = '65e7710db8020605732c8ee9';
        const account = await AccountModel.create({
            email: email,
            password: hashPassword,
            role: role
        });
        if(req.file){
            const pictureData = fs.readFileSync(picture.path);
            const base64Image = pictureData.toString('base64');
            const newDriver = await DriverModel.create({name: name,gender: gender,contact: contact,address: address,picture: base64Image,account: account });
            if(newDriver){
                res.redirect('/driver');
            } else {
                const message = "Error whe ncreate driver";
                res.render('admin/driver/add', {message, layout: 'layoutAdmin'});
            }
        } else if(!req.file){
            const base64Image = process.env.DEFAULT_BASE64_IMAGE;
            const newDriver = await DriverModel.create(
                {
                    name: name,
                    gender: gender,
                    contact: contact,
                    address: address,
                    picture: base64Image,
                    account: account
                }
            );
            if(newDriver){
                res.redirect('/driver');
            } else {
                const message = "Error when create driver";
                res.render('admin/driver/add', {message, layout: 'layoutAdmin'});
            }
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('admin/driver/add', {InputErrors, layout: 'layoutAdmin'});
        }
     }  
});

//---------------------------------------------------------------------------
//edit driver
router.get('/edit/:id',checkAdminSession,  async (req, res) => {
    var driverList = await DriverModel.find({}).populate('account');
    try {
        const driverId = req.params.id;
        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            const message = "There are no driver";
            res.render('admin/driver/index', {message, driverList, layout: 'layoutAdmin'});
        }
        const accountId = driver.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            const message = "There are no driver account";
            res.render('admin/driver/index', {message, driverList, layout: 'layoutAdmin'});
        }
        res.render('admin/driver/edit', {driver, account, layout: 'layoutAdmin'});
    } catch (error) {
        console.error(error);
        const message = "Error when edit driver";
        res.render('admin/driver/index', {message, driverList, layout: 'layoutAdmin'});
    }
});

router.post('/edit/:id', checkAdminSession, upload.single('picture'), async (req, res) => {
    var driverList = await DriverModel.find({}).populate('account');
    try {
        const driverId = req.params.id;
        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            const message = "There are no driver";
            res.render('admin/driver/index', {message, driverList, layout: 'layoutAdmin'});
        }
        const accountId = driver.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            const message = "There are no driver account";
            res.render('admin/driver/index', {message, driverList, layout: 'layoutAdmin'});
        }
        // Update driver details
        driver.name = req.body.name;
        driver.gender = req.body.gender;
        driver.contact = req.body.contact;
        driver.address = req.body.address;
        // If a new picture is uploaded, update it
        if (req.file) {
            const pictureData = fs.readFileSync(req.file.path);
            driver.picture = pictureData.toString('base64');  
        }
        account.email = req.body.email;
        const normalPassword = req.body.password;
        if(req.body.password){
            const hashPassword = bcrypt.hashSync(normalPassword, salt);
            account.password = hashPassword;
        }

        const editAccount = await account.save();
        const editDriver = await driver.save();
        if(editDriver){
            if(editAccount){
                res.redirect('/driver');
            } else {
                const message = "Error when edit driver account";
                res.render('admin/driver/edit', {message, layout: 'layoutAdmin'});
            }
        } else {
                const message = "Error when edit driver";
                res.render('admin/driver/edit', {message, layout: 'layoutAdmin'});
        }

    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('admin/driver/edit', {InputErrors, layout: 'layoutAdmin'});
        }
     }
});

//menu for admin. Vì ko có route cho admin nên ném tạm vào đây
router.get('/menuAdmin',  checkAdminSession, async(req, res) => {
    try{
        res.render('admin/menuAdmin', {layout: 'layoutAdmin'});
    } catch(error){
        console.error("Error:", error);
    }
});

//--------------------------------------------Role Driver-------------------------
router.get('/menu', checkDriverSession,  async(req, res) => {
    try{
        const driverId = req.session.driver_id;
        const driverData = await DriverModel.findById(driverId).populate('account'); //thông tin driver
        if(driverData){
            const journeyList = await JourneyModel.find({driver: driverId}).populate('bus').populate('schedule'); //thông tin journey
            res.render('driver/menu', {driverData, journeyList, layout:'layoutDriver'});
        }
    } catch(error){
        console.error("Error while fetching Driver:", error);

    }
});

//edit driver
router.get('/editDriver', checkDriverSession,  async (req, res) => {
        const driverId = req.session.driver_id;
        const driverData = await DriverModel.findById(driverId); //thông tin driver
        const journeyList = await JourneyModel.find({driver: driverId}); //thông tin journey
    try {
        const driverId = req.session.driver_id;
        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            const message = "There are no data for driver";
            res.render('driver/menu', {message, driverData, journeyList, layout:'layoutDriver'});
        }
        const accountId = driver.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            const message = "There are no data for driver account";
            res.render('driver/menu', {message, driverData, journeyList, layout:'layoutDriver'});
        }
        res.render('driver/editDriver', {driver, account, layout:'layoutDriver'});
    } catch (error) {
        console.error(error);
        const message = "Error when edit driver";
        res.render('driver/menu', {message, driverData, journeyList, layout:'layoutDriver'});
    }
});

// router.put('/editDriver/:id', checkDriverSession, upload.single('picture'), async (req, res) => {
//     try {
//         // Fetch driver by ID
//         const driverId = req.session.driver_id;
//         const driver = await DriverModel.findById(driverId);
//         if (!driver) {
//             res.status(400).json({success: false, error: 'Not found Driver'});
//             return;
//         }
//         // Fetch account details by ID
//         const accountId = driver.account;
//         const account = await AccountModel.findById(accountId);
//         if (!account) {
//             res.status(400).json({success: false, error: 'Not found Driver account'});
//             return;
//         }
//         // Update driver details
//         driver.name = req.body.name;
//         driver.birth = req.body.birth;
//         driver.gender = req.body.gender;
//         driver.contact = req.body.contact;
//         driver.address = req.body.address;
//         // If a new picture is uploaded, update it
//         if (req.file) {
//             const pictureData = fs.readFileSync(req.file.path);
//             driver.picture = pictureData.toString('base64');  
//         } 
//         const editDriver = await driver.save();
        
//         account.password = req.body.password;
//         const editAccount = await account.save();

//         if(editDriver){
//             if(editAccount){
//                 res.status(200).json({success: true, message: 'Edit Driver data including account successfully'});
//             } else {
//                 return res.status(500).json({success: false, error: 'Error when edit Driver account'});
//             }
//         } else {
//             return res.status(500).json({success: false, error: 'Error when edit Driver'});
//         }

//     } catch (error) {
//         if (error.name === 'ValidationError') {
//            let InputErrors = {};
//            for (let field in error.errors) {
//               InputErrors[field] = error.errors[field].message;
//            }
//            console.log("Error: ", error);
//            res.status(500).json({success: false, error: 'Internal Error', InputErrors});
//         }
//      }
// });
router.post('/editDriver', checkDriverSession,  upload.single('picture'), async (req, res) => {
    const driverId = req.session.driver_id;
    const driverData = await DriverModel.findById(driverId); //thông tin driver
    const journeyList = await JourneyModel.find({driver: driverId}); //thông tin journey
    try {
        const driverId = req.session.driver_id;
        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            const message = "There are no driver";
            res.render('driver/menu', {message, driverData, journeyList, layout:'layoutDriver'});
        }
        const accountId = driver.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            const message = "There are no driver account";
            res.render('driver/menu', {message, driverData, journeyList, layout:'layoutDriver'});
        }
        // Update driver details
        driver.name = req.body.name;
        driver.gender = req.body.gender;
        driver.contact = req.body.contact;
        driver.address = req.body.address;
        const driverPicture = driver.picture;
        // If a new picture is uploaded, update it
        if (req.file) {
            const pictureData = fs.readFileSync(req.file.path);
            driver.picture = pictureData.toString('base64');  
        }
        const normalPassword = req.body.password;
        if(req.body.password){
            const hashPassword = bcrypt.hashSync(normalPassword, salt);
            account.password = hashPassword;
        }
        if(!req.body.name || !req.body.gender || !req.body.contact || !req.body.address ){
            const message = "Enter information again";
            res.render('driver/editDriver', {message, layout:'layoutDriver',
                driver: {
                    _id: req.params.id, 
                    name: req.body.name, 
                    gender: req.body.gender,
                    contact: req.body.contact,
                    address: req.body.address,
                    picture: driverPicture
                },
                account: {
                    _id: accountId,
                }
            });
            return;
        }
        const editAccount = await account.save();
        const editDriver = await driver.save();
        if(editDriver){
            if(editAccount){
                res.render('driver/menu', {driverData, journeyList, layout:'layoutDriver'});
            } else {
                const message = "Error when edit driver account";
                res.render('driver/editDriver', {message, layout:'layoutDriver'});
            }
        } else {
                const message = "Error when edit driver";
                res.render('driver/editDriver', {message, layout:'layoutDriver'});
        }

    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('driver/editDriver', {InputErrors, layout:'layoutDriver'});
        }
     }
});
//journey page --------driver xem journey page để chuẩn bị cho vc lái xe
router.get('/journey/:id', checkDriverSession,  async(req, res) => {
    const driverId = req.session.driver_id;
    const driverData = await DriverModel.findById(driverId); //thông tin driver
    const journeyList = await JourneyModel.find({driver: driverId}); //thông tin journey
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
                    const studentList = await StudentModel.find({class: classId}).populate('supervisor'); //danh sách student của class đó
                    
                    res.render('driver/journey', {journeyData, busData, scheduleData, classData, teacherData, studentList, layout:'layoutDriver'});
                } else if (!busData || !scheduleData || !classData || !teacherData || studentList.length === 0) {
                    console.error("Error:", error);
                    const message = "Some data of this journey is missing";
                    res.render('driver/menu', {message, driverData, journeyList, layout:'layoutDriver'});
                }
            } else {
                console.error("Error:", error);
                const message = "There are no journey data";
                res.render('driver/menu', {message, driverData, journeyList, layout:'layoutDriver'});
            }
        } else {
            console.error("Error:", error);
            const message = "This journey is not for you";
            res.render('driver/menu', {message, driverData, journeyList, layout:'layoutDriver'});
        }
    } catch(error){
        console.error("Error while fetching Journey:", error);
        const message = "Internal Error";
        res.render('driver/menu', {message, driverData, journeyList, layout:'layoutDriver'});
    }  
});


module.exports = router;
