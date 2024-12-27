var express = require('express');
var router = express.Router();

var JourneyModel = require('../models/JourneyModel');
var BusModel = require('../models/BusModel');
var DriverModel = require('../models/DriverModel');
var ScheduleModel = require('../models/ScheduleModel');
var GPSModel = require('../models/GPSModel');
var RFIDModel = require('../models/RFIDModel');
var AccountModel = require('../models/AccountModel');
var ClassModel = require('../models/ClassModel');
var StudentModel = require('../models/StudentModel');
//-------------------------------------------------------------------------

//show all
router.get('/', async(req, res) => {
    try{
        var journeyList = await JourneyModel.find({}).populate('bus').populate('driver').populate('schedule').populate('gps').populate('rfid');
        if(journeyList){
            res.render('admin/journey/index', {journeyList, layout: 'layoutAdmin'});
        } else if(journeyList.length === 0){
            const message = "There are no journey in the list";
            res.render('admin/journey/index', {message, layout: 'layoutAdmin'});
        }
        
    }catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, message: 'Internal Error'});
        const message = "Internal Error";
        res.render('admin/journey/index', {message, layout: 'layoutAdmin'});
    }
});

//-----------------------------------------------------------------------
//delete specific
router.get('/delete/:id', async(req, res) => {
    try{
        var journeyList = await JourneyModel.find({}).populate('bus').populate('driver').populate('schedule').populate('gps').populate('rfid');
        var id = req.params.id;
        const journeyData = await JourneyModel.findById(id);
        if(journeyData){
            await JourneyModel.findByIdAndDelete(id);
            res.redirect('/journey');
        } else {
            const message = "Error when delete journey";
            res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
        }

    }catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Internal Error";
        res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
    }
});

//------------------------------------------------------------------------
//create 
//render form for user to input
router.get('/add', async (req, res) => {
    var journeyList = await JourneyModel.find({}).populate('bus').populate('driver').populate('schedule').populate('gps').populate('rfid');
    try{
        var busList = await BusModel.find({});
        var driverList = await DriverModel.find({});
        var scheduleList = await ScheduleModel.find({});
        var gpsList = await GPSModel.find({});
        var rfidList = await RFIDModel.find({});
        if(busList.length === 0 || driverList.length === 0 || scheduleList.length === 0 || gpsList.length === 0 || rfidList === 0){
            const message = "Some Information is missing";
            res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
        }
        res.render('admin/journey/add', {busList, driverList, scheduleList, gpsList, rfidList, layout: 'layoutAdmin'});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when add new journey";
        res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
    }
});

router.post('/add', async (req, res) => {
    var journeyList = await JourneyModel.find({}).populate('bus').populate('driver').populate('schedule').populate('gps').populate('rfid');
    try{
        var busList = await BusModel.find({});
        var driverList = await DriverModel.find({});
        var scheduleList = await ScheduleModel.find({});
        var gpsList = await GPSModel.find({});
        var rfidList = await RFIDModel.find({});
        var journeydata = req.body; 
        var checkGPS = req.body.gps;
        var checkRFID = req.body.rfid;
        const checkGPSResult = await JourneyModel.find({gps: checkGPS});
        const checkRFIDResult = await JourneyModel.find({rfid: checkRFID});
        if(checkGPSResult.length !== 0 || checkRFIDResult.length !== 0){
            const message = "Error when create new journey, GPS or RFID is taken ";
            res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
            return;
        }
        const newJourney = await JourneyModel.create(journeydata);
        if(newJourney){
            res.redirect('/journey');
        } else { 
            const message = "Error when create new journey";
            res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('admin/journey/add', {journeydata, InputErrors, busList, driverList, scheduleList, gpsList, rfidList, layout: 'layoutAdmin'});
        }
     }  
});

//------------------------------------------------------------------------
//edit
router.get('/edit/:id', async (req, res) => {
    var journeyList = await JourneyModel.find({}).populate('bus').populate('driver').populate('schedule').populate('gps').populate('rfid');
    try{
        const id = req.params.id;
        const journey = await JourneyModel.findById(id).populate('bus').populate('driver').populate('schedule').populate('gps').populate('rfid');
        if (!journey) {
            const message = "Not found journey";
            res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
        }
        const busList = await BusModel.find();
        const driverList = await DriverModel.find();
        const scheduleList = await ScheduleModel.find();
        const gpsList = await GPSModel.find({});
        const rfidList = await RFIDModel.find({});
        if(busList.length === 0 || driverList.length === 0 || scheduleList.length === 0 || gpsList.length === 0 || rfidList === 0){
            const message = "Some Information is missing";
            res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
        }
        res.render('admin/journey/edit', {journey, busList, driverList, scheduleList, gpsList, rfidList, layout: 'layoutAdmin'});
    }catch(error){
        console.error("Error while editing journey:", error);
        const message = "Error when edit journey";
        res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
    }
});

router.post('/edit/:id', async(req, res) => {
    var journeyList = await JourneyModel.find({}).populate('bus').populate('driver').populate('schedule').populate('gps').populate('rfid');
    try{
        const id = req.params.id;
        const journey = await JourneyModel.findById(id);
        if (!journey) {
            const message = "Not found journey";
            res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
        }
        journey.name = req.body.name;
        journey.bus = req.body.bus;
        journey.driver = req.body.driver;
        journey.schedule = req.body.schedule;
        journey.gps = req.body.gps;
        journey.rfid = req.body.rfid;
        if(!req.body.name){
            const message = "Name is required";
            res.render('admin/journey/edit', { message, layout: 'layoutAdmin',
                journey: {
                    _id: id,
                    name: req.body.name,
                    bus: req.body.bus,
                    driver: req.body.driver,
                    schedule: req.body.schedule,
                    gps: req.body.gps,
                    rfid: req.body.rfid,
                }
            });
            return;
        }
       
        const editJourney = await journey.save();
        if(editJourney){
            res.redirect('/journey');
        } else {
            const message = "Error when edit journey";
            res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
        }
    }catch(error){
        console.error("Error while editing journey:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Internal Error";
        res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
    }
});

router.get('/location/:id', async (req, res) => {
    var journeyList = await JourneyModel.find({}).populate('bus').populate('driver').populate('schedule').populate('gps').populate('rfid');
    try{
        const id = req.params.id;
        const dataJourney = await JourneyModel.findById(id).populate('bus').populate('driver').populate('schedule').populate('gps').populate('rfid');
        const driverAccount = await AccountModel.findById(dataJourney.driver.account);
        const scheduleData = await ScheduleModel.findById(dataJourney.schedule);
        const classData = await ClassModel.findById(scheduleData.classes).populate('teacher');
        const studentList = await StudentModel.find({class:scheduleData.classes}).populate('supervisor');
        if(!dataJourney){
            const message = "There are no journey";
            res.render('admin/journey/location', {message, layout: 'layoutAdmin'});
            return;
        }
        const gpsID = dataJourney.gps;
        const dataGPS = await GPSModel.findById(gpsID);
        if(!dataGPS){
            const message = "There are no journey location";
            res.render('admin/journey/location', {message, layout: 'layoutAdmin'});
            return;
        }
        res.render('admin/journey/location', {dataGPS, dataJourney, driverAccount, scheduleData, classData, studentList, layout: 'layoutAdmin'});

    } catch(error){
        console.error("Error while editing journey:", error);
        const message = "Error when finding journey location";
        res.render('admin/journey/index', {message, journeyList, layout: 'layoutAdmin'});
    }
});

module.exports = router;
