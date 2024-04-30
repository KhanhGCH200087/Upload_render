var express = require('express');
var router = express.Router();

var ScheduleModel = require('../models/ScheduleModel');
var ClassModel = require('../models/ClassModel');

//show all
router.get('/', async(req, res)=> {
    try{
        var scheduleList = await ScheduleModel.find({}).populate('class');
        res.render('schedule/index', {scheduleList});
    } catch(error) {
        console.error("Error", error);
        res.status(500).send("Internal Server Error");
    }
});

//delete schedule
router.get('/delete/:id', async(req, res) => {
    try{
        var id = req.params.id;
        await ScheduleModel.findByIdAndDelete(id);
        res.redirect('/schedule');
    } catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//create
router.get('/add', async(req, res) => {
    try{
        const classList = await ClassModel.find({});
        //api
    } catch(err){
        console.log("Error: ", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/add', async(req, res) => {
    try{
        var schedule = req.body;
        await ScheduleModel.create(schedule);
        res.redirect('/schedule');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('schedule/add', { InputErrors, schedule });
        }
     }  
});

//edit
router.get('/edit/:id', async (req, res) => {
    try {
        // Fetch class details by ID
        const scheduleId = req.params.id;
        const schedule = await ScheduleModel.findById(scheduleId).populate('class');
        if (!schedule) {
            throw new Error('Schedule not found');
        }
        const classList = await ClassModel.find({});

        res.render('schedule/edit', { schedule, classList});
    } catch (error) {
        console.error(error);
        res.status(404).send('Schedulenot found');
    }
});

router.post('/edit/:id', async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const schedule = await ScheduleModel.findById(scheduleId).populate('class');
        if (!schedule) {
            throw new Error('Schedule not found');
        }
        // Update class details
        schedule.name = req.body.name;
        schedule.date = req.body.date;
        schedule.classes = req.body.classes;

        await schedule.save();
        
        // Redirect to class list page
        res.redirect('/schedule');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('schedule/edit', { InputErrors, schedule });
        }
     }
});

module.exports = router;