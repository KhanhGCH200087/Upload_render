var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
var bcrypt = require('bcryptjs');
var salt = 8; 

var AccountModel = require('../models/AccountModel');
var BusModel = require('../models/BusModel');
var ClassModel = require('../models/ClassModel');
var DriverModel = require('../models/DriverModel');
var GPSModel = require('../models/GPSModel');
var HistoryModel = require('../models/HistoryModel');
var historyRFIDModel = require('../models/historyRFIDModel');
var JourneyModel = require('../models/JourneyModel');
var RFIDModel = require('../models/RFIDModel');
var RoleModel = require('../models/RoleModel');
var ScheduleModel = require('../models/ScheduleModel');
var StudentModel = require('../models/StudentModel');
var SupervisorModel = require('../models/SupervisorModel');
var TeacherModel = require('../models/TeacherModel');

const {checkAdminSession, checkSupervisorSession} = require('../middlewares/auth');

const { scheduler } = require('timers/promises');
const { error } = require('console');


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
        if(supervisorList.length === 0){
            const message = "There are no supervisor in the list";
            res.render('admin/supervisor/index', {message, layout:'layoutAdmin'});
        }
        res.render('admin/supervisor/index', {supervisorList, layout:'layoutAdmin'});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Internal Error when showing supervisor list";
        res.render('admin/supervisor/index', {message, layout:'layoutAdmin'});
    }
});

//-----------------------------------------------------------------------
//delete specific supervisor
router.get('/delete/:id', checkAdminSession, async(req, res) => {
    var supervisorList = await SupervisorModel.find({}).populate('account');
    try{
        const supervisorId = req.params.id;
        const supervisor = await SupervisorModel.findById(supervisorId);
        if (!supervisor) {
            const message = "Not found supervisor to delete";
            res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
            return;
        }
        const accountId = supervisor.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            const message = "Not found supervisor account to delete";
            res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
            return;
        }
        await SupervisorModel.findByIdAndDelete(supervisorId);
        await AccountModel.findByIdAndDelete(accountId);
        res.redirect('/supervisor');
    } catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
    } 
});

//------------------------------------------------------------------------
router.get('/add', checkAdminSession, async(req, res) => {
    res.render('admin/supervisor/add', { layout:'layoutAdmin'});
});

router.post('/add', checkAdminSession, upload.single('picture'), async (req, res) => {
    var supervisorList = await SupervisorModel.find({}).populate('account');
    try{
        const name = req.body.name;
        const contact = req.body.contact
        const address = req.body.address;
        const picture = req.file 
        const latitude = req.body.latitude;
        const longitude = req.body.longitude;
        const email = req.body.email;
        const password = req.body.password;
        const hashPassword =  bcrypt.hashSync(password, salt);
        const role = '65e7710db8020605732c8eeb';
        // // Geocode the address to get latitude and longitude
        // const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        //     params: {
        //         address: address,
        //         key: '' //Google map API key
        //     }
        // });

        // const { results } = geocodeResponse.data;
        // const location = results[0].geometry.location;
        // const latitude = location.lat;
        // const longtitude = location.lng;

        // Geocode the address using OpenStreetMap Nominatim API
        // const nominatimResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
        //     params: {
        //         q: address,
        //         format: 'json',
        //         limit: 1
        //     }
        // });

        // const { lat, lon } = nominatimResponse.data[0];
        // const latitude = parseFloat(lat);
        // const longtitude = parseFloat(lon);

        // Geocode the address using Mapbox
        // const response = await geocodingClient.forwardGeocode({
        //     query: address,
        //     limit: 1
        // }).send();

        // const { features } = response.body;
        // if (features.length === 0) {
        //     return res.status(404).json({ success: false, error: 'Address not found' });
        // }

        // const { center } = features[0];
        // const latitude = center[1];
        // const longtitude = center[0];
        const account = await AccountModel.create({
            email: email,
            password: hashPassword,
            role: role
        });
        if(req.file){
            const imageData = fs.readFileSync(picture.path);
            const base64Image = imageData.toString('base64');
            const newSupervisor = await SupervisorModel.create(
                {
                    name: name,
                    contact: contact,
                    address: address,
                    picture: base64Image,
                    account: account,
                    latitude: latitude,
                    longitude: longitude
                });
            if(account){
                if(newSupervisor){
                    res.redirect('/supervisor')
                } else {
                    const message = "Error add new supervisor";
                    res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
                }
            } else {
                const message = "Error add new supervisor account";
                res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
            }
        } else if(!req.file){
            const base64Image = process.env.DEFAULT_BASE64_IMAGE;
            const newSupervisor = await SupervisorModel.create(
                {
                    name: name,
                    contact: contact,
                    address: address,
                    picture: base64Image,
                    account: account,
                    latitude: latitude,
                    longitude: longitude
                });
            if(account){
                if(newSupervisor){
                    res.redirect('/supervisor')
                } else {
                    const message = "Error add new supervisor";
                    res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
                }
            } else {
                const message = "Error add new supervisor account";
                res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
            }
        }  
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('admin/supervisor/add', {InputErrors, layout:'layoutAdmin'});
        }
     }  
});

//---------------------------------------------------------------------------
//edit supervisor
router.get('/edit/:id', checkAdminSession,   async (req, res) => {
    var supervisorList = await SupervisorModel.find({}).populate('account');
    try {
        const supervisorId = req.params.id;
        const supervisor = await SupervisorModel.findById(supervisorId);
        if (!supervisor) {
            const message = "There are no supervisor data";
            res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
            return;
        }
        const accountId = supervisor.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            const message = "There are no supervisor account data";
            res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
            return;
        }
        res.render('admin/supervisor/edit', {supervisor, account, layout:'layoutAdmin'});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when edit supervisor";
        res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
    }
});

router.post('/edit/:id', checkAdminSession, upload.single('picture'), async (req, res) => {
    var supervisorList = await SupervisorModel.find({}).populate('account');
        const supervisorId = req.params.id;
        const supervisor = await SupervisorModel.findById(supervisorId);
        if (!supervisor) {
            const message = "There are no supervisor data";
            res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
            return;
        }
        const accountId = supervisor.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            const message = "There are no supervisor account data";
            res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
            return;
        }
    try {
        // Update supervisor details
        supervisor.name = req.body.name;
        supervisor.contact = req.body.contact;
        supervisor.address = req.body.address;
        supervisor.latitude = req.body.latitude;
        supervisor.longitude = req.body.longitude;
        const supervisorPicture = supervisor.picture;
        if (req.file) {
            const pictureData = fs.readFileSync(req.file.path);
            supervisor.picture = pictureData.toString('base64');  
        } 

        account.email = req.body.email;
        const normalPassword = req.body.password;
        if(req.body.password){
            const hashPassword = bcrypt.hashSync(normalPassword, salt);
            account.password = hashPassword;
        }
        if(!req.body.name || !req.body.contact || !req.body.address || !req.body.email ){
            const message = "Enter information again";
            res.render('admin/supervisor/edit', {message, layout:'layoutAdmin',
                supervisor: {
                    _id: req.params.id, 
                    name: req.body.name, 
                    contact: req.body.contact,
                    address: req.body.address,
                    latitude: req.body.latitude,
                    longtitude: req.body.longtitude,
                    picture: supervisorPicture
                },
                account: {
                    _id: accountId,
                    email: req.body.email,
                }
            });
            return;
        }
        const editSupervisor = await supervisor.save();
        const editAccount = await account.save();
        if(editSupervisor){
            if(editAccount){
                res.redirect('/supervisor');
            } else {
                const message = "Error when edit supervisor account";
                res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
                return;
            }
        } else {
            const message = "Error when edit supervisor";
            res.render('admin/supervisor/index', {message, supervisorList, layout:'layoutAdmin'});
            return;
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           res.render('admin/supervisor/edit', {InputErrors, account, supervisor, layout:'layoutAdmin'})
        }
     }
});

//--------------phần này cho role supervisor------------------------------------
//-------menu page------------------------ Hiện thông tin của supervisor đó và các student của supervisor đó (Done)
router.get('/menu', checkSupervisorSession, async(req, res) => {
    try{
        const supervisorId = req.session.supervisor_id;
        const supervisorData = await SupervisorModel.findById(supervisorId).populate('account');
        const StudentList = await StudentModel.find({supervisor: supervisorId}).populate('class');
        if(!supervisorData){
            const message = "There are no data";
            res.render('supervisor/menu', {message, layout:'layoutSupervisor'});
            return;
        }
        if(StudentList.length === 0){
            const message = "There are no student on the list";
            res.render('supervisor/menu', {message, supervisorData, layout:'layoutSupervisor'});
            return;
        }
        res.render('supervisor/menu', {StudentList, supervisorData, layout:'layoutSupervisor'});
    } catch(error){
        console.error("Error while fetching Driver:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when showing supervisor data";
        res.render('supervisor/menu', {message, layout:'layoutSupervisor'});
    }
});

//student details page: studentData, classData, scheduleData, check xem hiện tại Student có ở trên Bus ko----(Done)
router.get('/student/:id', checkSupervisorSession, async(req, res) => {
    const supervisorId = req.session.supervisor_id;
    const supervisorData = await SupervisorModel.findById(supervisorId);
    const StudentList = await StudentModel.find({supervisor: supervisorId});
    try{
        const supervisorId = req.session.supervisor_id;
        const studentId = req.params.id;
        const studentData = await StudentModel.findById(studentId); //thông tin của student
        if(studentData){
            const supervisorId2 = studentData.supervisor;
            if(supervisorId == supervisorId2){
                const classId = studentData.class;
                const classData = await ClassModel.findById(classId).populate('teacher'); //thông tin class mà student thuộc về 
                const scheduleData = await ScheduleModel.find({classes: classId}); //thông tin của schedule mà class thuộc về
    
                const studentRFID = studentData.RFID; //check thông tin RFID của Student
                const checkStudentOnBus = await historyRFIDModel.findOne({data: studentRFID}); //kiểm tra xem student có ở trên bus hiện tại ko
    
                if(!checkStudentOnBus){ //trường hợp student ko on bus
                    const studentOnBus = 'No';
                    const gpsData = {device: "Not On Bus", latitude: 21.02397632928401, longitude: 105.79033476689675 };
                    res.render('supervisor/student',{studentData, classData, scheduleData, studentOnBus, gpsData, studentId, layout:'layoutSupervisor'});
                } else { //trường hợp student on bus
                    const studentOnBus = 'Yes';
                    const deviceName = checkStudentOnBus.device;
                    const gpsData = await GPSModel.findOne({device: deviceName}); //tìm thông tin GPS với tên thiết bị tương ứng
                    res.render('supervisor/student',{studentData, classData, scheduleData, studentOnBus, gpsData, studentId, layout:'layoutSupervisor'});
                }
            } else {
                const message = "Invalid ID";
                res.render('supervisor/student', {message, layout:'layoutSupervisor'});
                return;
            }
        } else {
            console.error("Error while fetching student:", error);
            const message = "Not found student";
            res.render('supervisor/student', {message, layout:'layoutSupervisor'})
            return;
        }
    } catch(error){
        console.error("Error while fetching Driver:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when showing student data";
        res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
    }
});

//xem lịch sử đi lại của Student dựa trên Date và Time --------(Done)
router.get('/historyDate/:id', checkSupervisorSession, async(req, res) => {
    const supervisorId = req.session.supervisor_id;
    const supervisorData = await SupervisorModel.findById(supervisorId);
    const StudentList = await StudentModel.find({supervisor: supervisorId});
    try{
        const studentId = req.params.id;
        const studentData = await StudentModel.findById(studentId);
        if(!studentData){
            const message = "Error when showing student data";
            res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
            return;
        }
        const studentRFID = studentData.RFID; 
        const StudentRecordDate = await HistoryModel.find({rfid: studentRFID}); 
        const dateResult = "1";
        if(StudentRecordDate.length === 0){
            const message = "Student do not have history record";
            res.render('supervisor/history', {message, layout:'layoutSupervisor'});
            return;
        }
        res.render('supervisor/history', {StudentRecordDate, dateResult, studentId, layout:'layoutSupervisor'});
    } catch(error){
        console.log("Error: ", error);
        const message = "Error when showing student history data";
        res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
    }
});

router.post('/getHistory', checkSupervisorSession, async (req, res) => {
    const supervisorId = req.session.supervisor_id;
    const supervisorData = await SupervisorModel.findById(supervisorId);
    const StudentList = await StudentModel.find({ supervisor: supervisorId });
    try {
        const studentId = req.body.studentId;
        const studentData = await StudentModel.findById(studentId);
        if (!studentData) {
            const message = "Error when showing student data";
            return res.render('supervisor/menu', { message, supervisorData, StudentList, layout:'layoutSupervisor' });
        }
        const studentRFID = studentData.RFID;
        const dateResult = req.body.date; 

        const StudentRecordDate = await HistoryModel.find({ rfid: studentRFID, date: dateResult });

        if (StudentRecordDate.length === 0) {
            const message = "Student does not have history records for that day";
            return res.render('supervisor/history', { message, studentId , layout:'layoutSupervisor'});
        }

        // Render the history view with the filtered records
        res.render('supervisor/history', { StudentRecordDate, dateResult, studentId , layout:'layoutSupervisor'});
    } catch (error) {
        console.log("Error: ", error);
        const message = "Error when showing student history data";
        res.render('supervisor/menu', { message, supervisorData, StudentList, layout:'layoutSupervisor' });
    }
});


//edit supervisor------------------------------------------------------------------------(Done)
router.get('/editSupervisor/:id', checkSupervisorSession, async (req, res) => {
    const supervisorId = req.session.supervisor_id;
    const supervisorData = await SupervisorModel.findById(supervisorId);
    const StudentList = await StudentModel.find({supervisor: supervisorId});
    try {
        const supervisorId = req.params.id;
        if(supervisorId == req.session.supervisor_id){
            const supervisor = await SupervisorModel.findById(supervisorId);
            if (!supervisor) {
                const message = "Error when editing supervisor data";
                res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
                return;
            }
            const accountId = supervisor.account;
            const account = await AccountModel.findById(accountId);
            if (!account) {
                const message = "Error when editing supervisor account data";
                res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
                return;
            }
            res.render('supervisor/editSupervisor', {supervisor, account, layout:'layoutSupervisor'});
        } else {
            console.error(error);
            const message = "Invalid ID";
            res.render('supervisor/editSupervisor', {message, layout:'layoutSupervisor'});
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, error: 'Internal error'});
        const message = "Error when editing supervisor data";
        res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
    }
});

router.post('/editSupervisor/:id', checkSupervisorSession,  upload.single('picture'), async (req, res) => {
    const supervisorId = req.session.supervisor_id;
    const supervisorData = await SupervisorModel.findById(supervisorId);
    const StudentList = await StudentModel.find({supervisor: supervisorId});
    try {
        const supervisorId = req.params.id;
        if (supervisorId == req.session.supervisor_id){
            const supervisor = await SupervisorModel.findById(supervisorId);
            if (!supervisor) {
                const message = "Error when editing supervisor data";
                res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
                return;
            }
            const accountId = supervisor.account;
            const account = await AccountModel.findById(accountId);
            if (!account) {
                const message = "Error when editing supervisor data";
                res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
                return;
            }

            // Update supervisor details
            supervisor.name = req.body.name;
            supervisor.contact = req.body.contact;
            supervisor.address = req.body.address;
            supervisor.latitude = req.body.latitude; //cần chú ý đoạn này
            supervisor.longtitude = req.body.longtitude;
            const supervisorPicture = supervisor.picture;
            if (req.file) {
                const pictureData = fs.readFileSync(req.file.path);
                supervisor.picture = pictureData.toString('base64');  
            } 

            const normalPassword = req.body.password;
            if(req.body.password){
                const hashPassword = bcrypt.hashSync(normalPassword, salt);
                account.password = hashPassword;
            }
            if(!req.body.name || !req.body.contact || !req.body.address ){
                const message = "Enter information again";
                res.render('supervisor/editSupervisor', {message, 
                    supervisor: {
                        _id: req.params.id, 
                        name: req.body.name, 
                        contact: req.body.contact,
                        address: req.body.address,
                        latitude: req.body.latitude,
                        longtitude: req.body.longtitude,
                        picture: supervisorPicture
                    },
                    account: {
                        _id: accountId,
                    }
                });
                return;
            }

            const editSupervisor = await supervisor.save();
            const editAccount = await account.save();
    
            if(editSupervisor){
                if(editAccount){
                    res.redirect('/supervisor/menu')
                } else {
                    const message = "Error when editing supervisor data";
                    res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
                    return;
                }
            } else {
                const message = "Error when editing supervisor data";
                res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
                return;
            }
        } else {
            const message = "Invalid ID";
            res.render('supervisor/editSupervisor', {message, layout:'layoutSupervisor'});
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('supervisor/editSupervisor', {InputErrors, layout:'layoutSupervisor'});
        }
     }
});

//edit student--------------------------------------------------------------------------------(Done)
router.get('/editStudent/:id', checkSupervisorSession,  async (req, res) => {
    try {
        const studentId = req.params.id;
        const studentData = await StudentModel.findById(studentId);
        if(studentData){
            const supervisorId = studentData.supervisor;
            if (supervisorId == req.session.supervisor_id){
                res.render('supervisor/editStudent', {studentData, layout:'layoutSupervisor'});
            } else {
                const message = "Invalid ID";
                res.render('supervisor/editStudent', {message, layout:'layoutSupervisor'});
                return;
            }
        } else {
            const message = "Not found student";
            res.render('supervisor/editStudent', {message, layout:'layoutSupervisor'});
            return;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, error: 'Internal Error'});
        res.redirect('/supervisor/menu');
    }
});

router.post('/editStudent/:id', checkSupervisorSession, upload.single('picture'), async (req, res) => {
    const supervisorId = req.session.supervisor_id;
    const supervisorData = await SupervisorModel.findById(supervisorId);
    const StudentList = await StudentModel.find({supervisor: supervisorId});
    try {
        const studentId = req.params.id;
        const studentData = await StudentModel.findById(studentId);
        if(studentData){
            const supervisorId = studentData.supervisor;
            if (supervisorId == req.session.supervisor_id){
                studentData.name = req.body.name;
                studentData.gender = req.body.gender;
                studentData.RFID = req.body.RFID;
                const studentPicture = studentData.picture;
                if (req.file) {
                    const pictureData = fs.readFileSync(req.file.path);
                    studentData.picture = pictureData.toString('base64');
                }

                if(!req.body.name|| !req.body.gender || !req.body.RFID){
                    const message = "Enter information again";
                    res.render('supervisor/editStudent', {message , layout:'layoutSupervisor', student:{
                        _id: studentId, 
                        name: req.body.name,
                        gender: req.body.gender,
                        RFID: req.body.RFID,
                        picture: studentPicture
                    }});
                }

                const editStudent = await studentData.save();
                if(editStudent){
                    res.redirect('/supervisor/menu')
                } else {
                    const message = "Fail when edit student";
                    res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
                }
            } else {
                const message = "Invalid ID";
                res.render('supervisor/editStudent', {message, layout:'layoutSupervisor'});
                return;
            }
        } else {
            const message = "Not found Student";
            res.render('supervisor/editStudent', {message, layout:'layoutSupervisor'});
            return;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, error: 'Enternal Error'});
        const message = "Fail when edit student";
        res.render('supervisor/menu', {message, supervisorData, StudentList, layout:'layoutSupervisor'});
    }
});

// ------------------------schedule page: scheduleData, classData, teacherData, journeyList-------(Done)
router.get('/schedule/:id', checkSupervisorSession,  async(req, res) => {
    try{
        const scheduleId = req.params.id;
        const scheduleData = await ScheduleModel.findById(scheduleId); //thông tin schedule, hiện ra tên schedule và thời gian
        if (scheduleData){
            const classId = scheduleData.classes;
            const classData = await ClassModel.findById(classId).populate('teacher'); //thông tin class, hiện ra tên class và teacher
            if(!classData){
                const message = "Not found class Data";
                res.render('supervisor/schedule', {message, layout:'layoutSupervisor'});
                return;
            } 
            const teacherId = classData.teacher;
            const teacherData = await TeacherModel.findById(teacherId).populate('account'); //thông tin teacher
            const journeyList = await JourneyModel.find({schedule: scheduleId}).populate('bus').populate('driver'); //thông tin journey
            if(!teacherData || !journeyList){
                const message = "Some data is missing";
                res.render('supervisor/schedule', {message, layout:'layoutSupervisor'});
                return;
            }
            res.render('supervisor/schedule',{scheduleData, classData, teacherData, journeyList, layout:'layoutSupervisor'});
        } else {
            const message = "Not found schedule Data";
            res.render('supervisor/schedule', {message, layout:'layoutSupervisor'});
            return;
        }
    } catch (error) {
        console.error(error);
        res.redirect('/supervisor/menu');
    }
});

//----------------------------journey page ----------------------------------------------------(No need to do this part)
router.get('/journey/:id', checkSupervisorSession,  async(req, res) => {
    try{
        const journeyId = req.params.id;
        const journeyData = await JourneyModel.findById(journeyId); //thông tin journey
        if(journeyData){
            const busId = journeyData.bus;
            const driverId = journeyData.driver;
            const busData = await BusModel.findById(busId); //thông tin bus
            const driverData = await DriverModel.findById(driverId); //thông tin driver
            if(!busData || !driverData){
                const message = "Bus or Driver data is missing";
                res.render('supervisor/journey', {message, journeyData});
            }
            res.render('supervisor/journey', {journeyData, busData, driverData});
        } else {
            const message = "journey data is missing";
            res.render('supervisor/journey', {message});
        }
    }catch(error){
        console.error("Error while fetching journey:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        res.redirect('/supervisor/menu');
    }
});

module.exports = router;
