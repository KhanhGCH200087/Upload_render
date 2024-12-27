var express = require('express');
var router = express.Router();

var JourneyModel = require('../models/JourneyModel');
var BusModel = require('../models/BusModel');
var DriverModel = require('../models/DriverModel');
var ScheduleModel = require('../models/ScheduleModel');

//-------------------------------------------------------------------------

//show all
router.get('/', async(req, res) => {
    //retrieve data from collection
    try{
        var journeyList = await JourneyModel.find({}).populate('bus').populate('driver').populate('schedule');
        //render view and pass data
        res.render('journey/index', {journeyList});
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//-----------------------------------------------------------------------
//delete specific
router.get('/delete/:id', async(req, res) => {
    //req.params: get value by url
    try{
        var id = req.params.id;
        await JourneyModel.findByIdAndDelete(id);
        res.redirect('/journey');
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//------------------------------------------------------------------------
//create 
//render form for user to input
router.get('/add', async (req, res) => {
    try{
        var busList = await BusModel.find({});
        var driverList = await DriverModel.find({});
        var scheduleList = await ScheduleModel.find({});
        res.render('journey/add', {busList, driverList, scheduleList});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/add', async (req, res) => {
    //get value by form : req.body
    try{
        var journeydata = req.body;
        await JourneyModel.create(journeydata);
        res.redirect('/journey');
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

//------------------------------------------------------------------------
//edit
router.get('/edit/:id', async (req, res) => {
    try{
        const id = req.params.id;
        const journey = await JourneyModel.findById(id).populate('bus').populate('driver').populate('schedule');
        if (!journey) {
            throw new Error('Journey not found');
        }
        const busList = await BusModel.find();
        const driverList = await DriverModel.find();
        const scheduleList = await ScheduleModel.find();
        res.render('journey/edit', {journey, busList, driverList, scheduleList});
    }catch(error){
        console.error("Error while editing journey:", error);
        res.status(500).send("Internal Server Error");
    }
    
});

router.post('/edit/:id', async(req, res) => {
    try{
        const id = req.params.id;
        const journey = await JourneyModel.findById(id);
        if (!journey) {
            throw new Error('Journey not found');
        }

        journey.name = req.body.name;
        journey.bus = req.body.bus;
        journey.driver = req.body.driver;
        journey.schedule = req.body.schedule;

        await journey.save();
        res.redirect('/journey');
    }catch(error){
        console.error("Error while editing journey:", error);
        res.status(500).send("Internal Server Error");
    }
});


module.exports = router;
