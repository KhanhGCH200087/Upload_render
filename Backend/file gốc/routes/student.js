var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');

var StudentModel = require('../models/StudentModel');
var ClassModel = require('../models/ClassModel');
var SupervisorModel = require('../models/SupervisorModel');

const {checkAdminSession, checkDriverSession, checkTeacherSession, checkSupervisorSession} = require('../middlewares/auth');
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
        var studentList = await StudentModel.find({}).populate('role').populate('class').populate('supervisor');
        //render view and pass data
        res.render('student/index', {studentList});
    } catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//-----------------------------------------------------------------------
//delete specific student
router.get('/delete/:id', checkAdminSession, async(req, res) => {
    try{
        var id = req.params.id;
        await StudentModel.findByIdAndDelete(id);
        res.redirect('/student');
    } catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//------------------------------------------------------------------------
//create student
//render form for user to input
router.get('/add', checkAdminSession, async (req, res) => {
    try{
        var classList = await ClassModel.find({});
        var supervisorList = await SupervisorModel.find({});
        res.render('student/add', {classList, supervisorList });
    } catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/add', checkAdminSession, upload.single('picture'), async (req, res) => {
    //get value by form : req.body
    try{
        const name = req.body.name;
        const birth = req.body.birth;
        const gender = req.body.gender;
        const picture = req.file //access the uplodaded picture
        const RFID = req.body.RFID;
        const classData = req.body.class;
        const supervisor = req.body.supervisor;
        const role = '65e7710db8020605732c8eec';
      
        //read the picture file
        const pictureData = fs.readFileSync(picture.path);
        //convert picture data to base 64
        const base64Image = pictureData.toString('base64');
        await StudentModel.create(
            {
                name: name,
                birth: birth,
                gender: gender,
                picture: base64Image,
                RFID: RFID, 
                class: classData,
                supervisor: supervisor,
                role: role
            }
        );
        res.redirect('/student');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('student/add', { InputErrors, student });
        }
     }  
});

//---------------------------------------------------------------------------
//edit student
router.get('/edit/:id', checkAdminSession, async (req, res) => {
    try {
        // Fetch student details by ID
        const studentId = req.params.id;
        const student = await StudentModel.findById(studentId).populate('class').populate('supervisor');
        if (!student) {
            throw new Error('Student not found');
        }
        const classList = await ClassModel.find({});
        const supervisorList = await SupervisorModel.find({});
        // Render edit form with student details and dropdown options
        res.render('student/edit', { student, classList, supervisorList });
    } catch (error) {
        // Handle errors (e.g., student not found)
        console.error(error);
        res.status(404).send('Student not found');
    }
});

// Handle form submission for editing a student
router.post('/edit/:id', checkAdminSession, upload.single('picture'), async (req, res) => {
    try {
        // Fetch student by ID
        const studentId = req.params.id;
        const student = await StudentModel.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }
        // Update student details
        student.name = req.body.name;
        student.birth = req.body.birth;
        student.gender = req.body.gender;
        student.RFID = req.body.RFID;
        student.class = req.body.class;
        student.supervisor = req.body.supervisor;

        // If a new picture is uploaded, update it
        if (req.file) {
            const pictureData = fs.readFileSync(req.file.path);
            student.picture = pictureData.toString('base64');
        }
        // Save updated student to the database
        await student.save();
        // Redirect to student list page
        res.redirect('/student');
    } catch (error) {
        // Handle errors (e.g., student not found, validation errors)
        console.error(error);
        res.status(400).send(error.message);
    }
});

//-----------------------------------
module.exports = router;
