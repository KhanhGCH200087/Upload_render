var express = require('express');
var router = express.Router();

var ClassModel = require('../models/ClassModel');
var TeacherModel = require('../models/TeacherModel');

//-------------------------------------------------------------------------

//show all class
router.get('/', async(req, res) => {
    try{
        var classList = await ClassModel.find({}).populate('teacher');
        if(!classList){
            const message = "Error when showing class list";
            res.render('admin/class/index', {message, layout: 'layoutAdmin'});
        }
        if(classList.length === 0){
            const message = "There are no class in the system";
            res.render('admin/class/index', {message, layout: 'layoutAdmin'});
        }
        res.render('admin/class/index', {classList, layout: 'layoutAdmin'});
    }catch(error){
        console.error("Error:", error);
        const message = "Error when showing class list";
        res.render('admin/class/index', {message, layout: 'layoutAdmin'});
    }
});

//-----------------------------------------------------------------------
//delete specific class
router.get('/delete/:id', async(req, res) => {
    var classList = await ClassModel.find({});
    try{
        var id = req.params.id;
        const classData = await ClassModel.findById(id);
        if(classData){
            await ClassModel.deleteOne(classData);
            res.redirect('/class');
        } else {
            const message = "There are no class in the system";
            res.render('admin/class/index', {message, classList, layout: 'layoutAdmin'});
        }
    }catch(error){
        console.error("Error:", error);
        const message = "Error when Deleting class in the list";
        res.render('admin/class/index', {message, classList, layout: 'layoutAdmin'});
    }
});

//------------------------------------------------------------------------
//create class
router.get('/add', async (req, res) => {
    var classList = await ClassModel.find({});
    try{
        var teacherList = await TeacherModel.find({});
        res.render('admin/class/add', {teacherList, layout: 'layoutAdmin'});
    }catch(error){
        console.error("Error while adding class:", error);
        const message = "Error when Add class";
        res.render('admin/class/add', {message, classList, layout: 'layoutAdmin'});
    }
});

router.post('/add', async (req, res) => {
    try{
        var classes = req.body;
        const newClass = await ClassModel.create(classes);
        if(newClass){
            res.redirect('/class')
        } else {
            const message = "Error when add class";
            res.render('admin/class/add', {message, layout: 'layoutAdmin'})
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('admin/class/add', {InputErrors, classes, layout: 'layoutAdmin'})
        }
     }  
});

//-------------------------------------------------------------------------
//edit class
router.get('/edit/:id', async (req, res) => {
    var classList = await ClassModel.find({});
    try {
        const classId = req.params.id;
        const classes = await ClassModel.findById(classId).populate('teacher');
        if (!classes) {
            const message = "There are no class"
            res.render('admin/class/index', {message, classList, layout: 'layoutAdmin'});
        }
        const teacherList = await TeacherModel.find({});
        res.render('admin/class/edit', {classes, teacherList, layout: 'layoutAdmin'});

    } catch (error) {
        // Handle errors (e.g., class not found)
        console.error(error);
        const message = "Error when taking class"
        res.render('admin/class/index', {message, classList, layout: 'layoutAdmin'});
    }
});

router.post('/edit/:id', async (req, res) => {
    var classList = await ClassModel.find({});
    try {
        const classId = req.params.id;
        const classes = await ClassModel.findById(classId);
        if (!classes) {
            const message = "There are no class"
            res.render('admin/class/index', {message, classList, layout: 'layoutAdmin'});
        }
        classes.name = req.body.name;
        classes.teacher = req.body.teacher;

        if (!req.body.name) {
            const message = "Name is required";
            res.render('admin/class/edit', { message, classes: { _id: req.params.id, name:req.body.name, teacher:req.body.teacher }, layout: 'layoutAdmin'});
            return;
        }
        const editClass = await classes.save();
        if(editClass){
            res.redirect('/class');
        } else {
            const message = "Error when edit class"
            res.render('admin/class/edit', {message, layout: 'layoutAdmin'});
        }

    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('admin/class/edit', {InputErrors, layout: 'layoutAdmin'});
        }
     }
});



module.exports = router;
