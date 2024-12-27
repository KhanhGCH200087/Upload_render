var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');

var StudentModel = require('../models/StudentModel');
var ClassModel = require('../models/ClassModel');
var SupervisorModel = require('../models/SupervisorModel');

const {checkAdminSession} = require('../middlewares/auth');
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
router.get('/',  async(req, res) => {
    try{
        var studentList = await StudentModel.find({}).populate('class').populate('supervisor');
        if(studentList.length === 0){
            const message = "There are no Student on the list";
            res.render('admin/student/index', {message, layout:'layoutAdmin'});
        }
        res.render('admin/student/index', {studentList, layout:'layoutAdmin'});
    } catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when showing student list";
        res.render('admin/student/index', {message, layout:'layoutAdmin'});
    }
});

//--------------------------------------------------------------------------
//get supervisor
router.get('/supervisorData/:id', async(req, res) => {
    var studentList = await StudentModel.find({}).populate('class').populate('supervisor');
    try{
        const id = req.params.id;
        const supervisorData = await SupervisorModel.findById(id).populate('account');
        if(!supervisorData){
            const message = "Not found supervisor Data";
            res.render('admin/student/supervisorData', {message, layout:'layoutAdmin'});
        }
        res.render('admin/student/supervisorData', {supervisorData, layout:'layoutAdmin'});
    }catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when showing supervisor data";
        res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
    }
    
});

//-----------------------------------------------------------------------
//delete specific student
router.get('/delete/:id',  async(req, res) => {
    var studentList = await StudentModel.find({}).populate('role').populate('class').populate('supervisor');
    try{
        var id = req.params.id;
        const checkStudent = await StudentModel.findById(id)
        if(!checkStudent){
            const message = "Error when deleting student";
            res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
        }
        await StudentModel.findByIdAndDelete(id);
        res.redirect('/student');
    } catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when deleting student";
        res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
    }
});

//------------------------------------------------------------------------
//create student
//render form for user to input
router.get('/add',  async (req, res) => {
    var studentList = await StudentModel.find({}).populate('role').populate('class').populate('supervisor');
    try{
        var classList = await ClassModel.find({});
        var supervisorList = await SupervisorModel.find({});
        if(classList.length === 0 || supervisorList.length === 0){
            const message = "Missing list of class or supervisor";
            res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
        }
        res.render('admin/student/add', {classList, supervisorList, layout:'layoutAdmin'});
    } catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when creating new student";
        res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
    }
});

router.post('/add',  upload.single('picture'), async (req, res) => {
    var studentList = await StudentModel.find({}).populate('role').populate('class').populate('supervisor');
    var classList = await ClassModel.find({});
    var supervisorList = await SupervisorModel.find({});
    try{
        const name = req.body.name;
        const gender = req.body.gender;
        const picture = req.file 
        const RFID = req.body.RFID;
        const classData = req.body.class;
        const supervisor = req.body.supervisor;
        const role = '65e7710db8020605732c8eec';
        if(req.file){
            const pictureData = fs.readFileSync(picture.path);
            const base64Image = pictureData.toString('base64');
            const newStudent = await StudentModel.create(
                {
                    name: name,
                    gender: gender,
                    picture: base64Image,
                    RFID: RFID, 
                    class: classData,
                    supervisor: supervisor,
                    role: role
                });
            if(newStudent){
                res.redirect('/student')
            } else {
                const message = "Error when creating new student";
                res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
            }
        } else if(!req.file){
            const base64Image = process.env.DEFAULT_BASE64_IMAGE;
            const newStudent = await StudentModel.create(
                {
                    name: name,
                    gender: gender,
                    picture: base64Image,
                    RFID: RFID, 
                    class: classData,
                    supervisor: supervisor,
                    role: role
                });
            if(newStudent){
                res.redirect('/student')
            } else {
                const message = "Error when creating new student";
                res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
            }
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           res.render('admin/student/add', {InputErrors, classList, supervisorList, layout:'layoutAdmin'});
        }
     }  
});

//---------------------------------------------------------------------------
//edit student
router.get('/edit/:id',  async (req, res) => {
    var studentList = await StudentModel.find({}).populate('role').populate('class').populate('supervisor');
    try {
        const studentId = req.params.id;
        const student = await StudentModel.findById(studentId).populate('class').populate('supervisor');
        if (!student) {
            const message = "Not found student";
            res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
        }
        const classList = await ClassModel.find({});
        const supervisorList = await SupervisorModel.find({});
        if(classList.length === 0, supervisorList.length === 0){
            const message = "Data of class or supervisor is missing";
            res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
        }
        res.render('admin/student/edit', {student, classList, supervisorList, layout:'layoutAdmin'});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Internal Error'});
        const message = "Error when editing student";
        res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
    }
});

router.post('/edit/:id', upload.single('picture'), async (req, res) => {
    var studentList = await StudentModel.find({}).populate('role').populate('class').populate('supervisor');
    try {
        const studentId = req.params.id;
        const student = await StudentModel.findById(studentId);
        if (!student) {
            const message = "Not found student";
            res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
        }
        // Update student details
        student.name = req.body.name;
        student.gender = req.body.gender;
        student.RFID = req.body.RFID;
        student.class = req.body.class;
        student.supervisor = req.body.supervisor;

        if (req.file) {
            const pictureData = fs.readFileSync(req.file.path);
            student.picture = pictureData.toString('base64');
        }
        if(!req.body.name|| !req.body.gender || !req.body.RFID || !req.body.class || !req.body.supervisor){
            const message = "Enter information again";
            res.render('admin/student/edit', {message, layout:'layoutAdmin', student:{
                _id: studentId, 
                name: req.body.name,
                gender: req.body.gender,
                RFID: req.body.RFID,
                class: req.body.class,
                supervisor: req.body.supervisor,
                picture: student.picture
            }});
        }

        const editStudent = await student.save();
        if(editStudent){
            res.redirect('/student');
        } else {
            const message = "Error when editting student";
            res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Internal Error when editting student";
        res.render('admin/student/index', {message, studentList, layout:'layoutAdmin'});
    }
});

//-----------------------------------
module.exports = router;
