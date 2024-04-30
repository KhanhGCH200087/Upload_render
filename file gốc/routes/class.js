var express = require('express');
var router = express.Router();

var ClassModel = require('../models/ClassModel');
var TeacherModel = require('../models/TeacherModel');

//-------------------------------------------------------------------------

//show all class
router.get('/', async(req, res) => {
    try{
        var classList = await ClassModel.find({}).populate('teacher');
        res.render('class/index', {classList});
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//-----------------------------------------------------------------------
//delete specific class
router.get('/delete/:id', async(req, res) => {
    //req.params: get value by url
    try{
        var id = req.params.id;
        await ClassModel.findByIdAndDelete(id);
        res.redirect('/class');
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }  
});

//------------------------------------------------------------------------
//create class
router.get('/add', async (req, res) => {
    try{
        var teacherList = await TeacherModel.find({});
        res.render('class/add', {teacherList});
    }catch(error){
        console.error("Error while adding MM list:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/add', async (req, res) => {
    try{
        //get value by form : req.body
        var classes = req.body;
        await ClassModel.create(classes);
        res.redirect('/class');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('class/add', { InputErrors, classes });
        }
     }  
});

//-------------------------------------------------------------------------
//edit class
router.get('/edit/:id', async (req, res) => {
    try {
        // Fetch class details by ID
        const classId = req.params.id;
        const classes = await ClassModel.findById(classId).populate('teacher');
        if (!classes) {
            throw new Error('class not found');
        }
        const teacherList = await TeacherModel.find({});
        // Render edit form with class details and dropdown options
        res.render('class/edit', { classes, teacherList});
    } catch (error) {
        // Handle errors (e.g., class not found)
        console.error(error);
        res.status(404).send('class not found');
    }
});

// Handle form submission for editing a class
router.post('/edit/:id', async (req, res) => {
    try {
        // Fetch class by ID
        const classId = req.params.id;
        const classes = await ClassModel.findById(classId);
        if (!classes) {
            throw new Error('class not found');
        }
        // Update class details
        classes.name = req.body.name;
        classes.teacher = req.body.teacher;

        await classes.save();
        
        // Redirect to class list page
        res.redirect('/class');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('class/edit', { InputErrors, classes });
        }
     }
});



module.exports = router;
