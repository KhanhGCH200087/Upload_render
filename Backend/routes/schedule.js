var express = require('express');
var router = express.Router();

var ScheduleModel = require('../models/ScheduleModel');
var ClassModel = require('../models/ClassModel');

//show all
router.get('/', async(req, res)=> {
    try{
        var scheduleList = await ScheduleModel.find({}).populate('classes');
        if(scheduleList.length === 0){
            const message = "There are no schedule in the list";
            res.render('admin/schedule/index', {message, layout:'layoutAdmin'});
        } else {
            res.render('admin/schedule/index', {scheduleList, layout:'layoutAdmin'});
        }
    } catch(error) {
        console.error("Error", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when showing schedule list";
        res.render('admin/schedule/index', {message, layout:'layoutAdmin'});
    }
});

//delete schedule
router.get('/delete/:id', async(req, res) => {
    var scheduleList = await ScheduleModel.find({}).populate('classes');
    try{
        var id = req.params.id;
        const checkSchedule = await ScheduleModel.findById(id);
        if(checkSchedule){
            await ScheduleModel.findByIdAndDelete(id);
            res.redirect('/schedule');
        } else {
            const message = "Error when deleting schedule";
            res.render('admin/schedule/index', {message, scheduleList, layout:'layoutAdmin'});
        }
    } catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Internal Error when deleting schedule";
        res.render('admin/schedule/index', {message, scheduleList, layout:'layoutAdmin'});
    }
});

//create
router.get('/add', async(req, res) => {
    var scheduleList = await ScheduleModel.find({}).populate('classes');
    try{
        const classList = await ClassModel.find({});
        if(classList.length === 0){
            const message = "Missing class in the list";
            res.render('admin/schedule/index', {message, scheduleList, layout:'layoutAdmin'});
        } else {
            res.render('admin/schedule/add', {classList, layout:'layoutAdmin'});
        }
    } catch(err){
        console.log("Error: ", err);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when add new schedule";
        res.render('admin/schedule/index', {message, scheduleList, layout:'layoutAdmin'});
    }
});

router.post('/add', async(req, res) => {
    var scheduleList = await ScheduleModel.find({}).populate('classes');
    try{
        var schedule = req.body;
        const newSchedule = await ScheduleModel.create(schedule);
        if(newSchedule){
            res.redirect('/schedule');
        } else {
            const message = "Error when creating new schedule";
            res.render('admin/schedule/add', {message, layout:'layoutAdmin'});
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('admin/schedule/add', {InputErrors, layout:'layoutAdmin'});
        }
     }  
});

//edit
router.get('/edit/:id', async (req, res) => {
    var scheduleList = await ScheduleModel.find({}).populate('classes');
    try {
        // Fetch class details by ID
        const scheduleId = req.params.id;
        const schedule = await ScheduleModel.findById(scheduleId).populate('classes');
        if (!schedule) {
            const message = "Not found schedule to edit";
            res.render('admin/schedule/index', {message, scheduleList, layout:'layoutAdmin'});
            return;
        }
        const classList = await ClassModel.find({});
        if(classList.length === 0){
            const message = "Missing class list, can not make schedule";
            res.render('admin/schedule/index', {message, scheduleList, layout:'layoutAdmin'});
            return;
        }
        res.render('admin/schedule/edit', {schedule, classList, layout:'layoutAdmin'});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when editting schedule";
        res.render('admin/schedule/index', {message, scheduleList, layout:'layoutAdmin'});
    }
});

router.post('/edit/:id', async (req, res) => {
    const scheduleList = await ScheduleModel.find({}).populate('classes');
    const classList = await ClassModel.find({});
    const scheduleId = req.params.id;
    const schedule = await ScheduleModel.findById(scheduleId).populate('classes');
    try {
        if (!schedule) {
            const message = "Not found schedule to edit";
            res.render('admin/schedule/index', {message, scheduleList, layout:'layoutAdmin'});
            return;
        }
        // Update class details
        schedule.name = req.body.name;
        
        schedule.classes = req.body.classes;
        if(req.body.date){
            schedule.date = req.body.date;
        }
        const editSchedule = await schedule.save();   
        if(editSchedule){
            res.redirect('/schedule');
        } else {
            const message = "Error when edit schedule";
            res.render('admin/schedule/index', {message, scheduleList, layout:'layoutAdmin'});
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
            console.error(error);
            const message = "Error Please enter and choose again";
            res.render('admin/schedule/edit', {message, schedule, classList, layout:'layoutAdmin'});
        }
     }
});

module.exports = router;