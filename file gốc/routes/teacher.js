var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');

var AccountModel = require('../models/AccountModel');
var BusModel = require('../models/BusModel');
var ClassModel = require('../models/ClassModel');
var DriverModel = require('../models/DriverModel');
var JourneyModel = require('../models/JourneyModel');
var ScheduleModel = require('../models/ScheduleModel');
var StudentModel = require('../models/StudentModel');
var SupervisorModel = require('../models/SupervisorModel');
var TeacherModel = require('../models/TeacherModel');

const {checkAdminSession, checkTeacherSession} = require('../middlewares/auth');
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
        var teacherList = await TeacherModel.find({}).populate('account');
        //render view and pass data
        res.render('teacher/index', {teacherList});
    } catch(error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//-----------------------------------------------------------------------
//delete specific teacher
router.get('/delete/:id', checkAdminSession, async(req, res) => {
    try{
        const teacherId = req.params.id;
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new Error('Teacher not found');
        }
        // Fetch account details by ID
        const accountId = teacher.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        await TeacherModel.findByIdAndDelete(teacherId);
        await AccountModel.findByIdAndDelete(accountId);
        res.redirect('/teacher');
    } catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    } 
});

//------------------------------------------------------------------------
//create teacher
router.get('/add', checkAdminSession, async (req, res) => {
    try{
        res.render('teacher/add');
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/add', checkAdminSession, upload.single('picture'), async (req, res) => {
    try{
        const name = req.body.name;
        const birth = req.body.birth;
        const gender = req.body.gender;
        const contact = req.body.contact;
        const address = req.body.address;
        const picture = req.file //access the uplodaded picture
        //read the picture file
        const pictureData = fs.readFileSync(picture.path);
        //convert picture data to base 64
        const base64Image = pictureData.toString('base64');
    
        const email = req.body.email;
        const password = req.body.password;
        const role = '65e7710db8020605732c8eea';
    
        const account = await AccountModel.create({
            email: email,
            password: password,
            role: role
        }
        );
    
        await TeacherModel.create(
            {
                name: name,
                birth: birth,
                gender: gender,
                contact: contact,
                address: address,
                picture: base64Image,
                account: account
            }
        );
        res.redirect('/teacher');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('teacher/add', { InputErrors, teacher });
        }
     }  
});

//---------------------------------------------------------------------------
//edit teacher
router.get('/edit/:id', checkAdminSession, async (req, res) => {
    try {
        // Fetch teacher details by ID
        const teacherId = req.params.id;
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new Error('Teacher not found');
        }

        // Fetch account details by ID
        const accountId = teacher.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Render edit form with teacher details and dropdown options
        res.render('teacher/edit', { teacher, account});
    } catch (error) {
        // Handle errors (e.g., teacher not found)
        console.error(error);
        res.status(404).send('Teacher not found');
    }
});

router.post('/edit/:id', checkAdminSession, upload.single('picture'), async (req, res) => {
    try {
        // Fetch teacher by ID
        const teacherId = req.params.id;
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new Error('Teacher not found');
        }
        // Fetch account details by ID
        const accountId = teacher.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        // Update teacher details
        teacher.name = req.body.name;
        teacher.birth = req.body.birth;
        teacher.gender = req.body.gender;
        teacher.contact = req.body.contact;
        teacher.address = req.body.address;
        // If a new picture is uploaded, update it
        if (req.file) {
            const pictureData = fs.readFileSync(req.file.path);
            teacher.picture = pictureData.toString('base64');  
        } 
        await teacher.save();
        
        account.email = req.body.email;
        account.password = req.body.password;
        await account.save();

        // Redirect to teacher list page
        res.redirect('/teacher');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('teacher/edit', { InputErrors, teacher });
        }
     }
});



//-----------------------------phần này cho role teacher------------------------------
//menu page
router.get('/menu', checkTeacherSession, async(req, res) => {
    try{
        const teacherId = req.session.teacher_id;
        const teacherData = await TeacherModel.findById(teacherId); //lấy thông tin teacher
        if(teacherData){
            const classList = await ClassModel.find({teacher: teacherId}); //lấy thông tin class
            //trả về api
        } else {
            console.error(error);
            res.status(404).send('Teacher not found');
        }
    } catch (error) {
        // Handle errors (e.g., teacher not found)
        console.error(error);
        res.status(404).send('Teacher not found');
    }
});

// class page-----------------------------
router.get('/class/:id', checkTeacherSession, async(req, res) => {

    const classId = req.params.id;
    const classData = await ClassModel.findById(classId); //lấy thông tin class
    if(classData){
        const studentList = await StudentModel.find({class: classId}).populate('supervisor'); //lấy thông tin student
        const scheduleList = await ScheduleModel.find({classes: classId}).populate('journey'); // lấy thông tin schedule
        //đẩy API
    } else {
        console.error(error);
        res.status(404).send('class not found');
    }
})

//edit student-----------------------------------------------
router.get('/editTeacher/:id', checkTeacherSession, async (req, res) => {
    try {
        const teacherId = req.params.id;
        if(teacherId == req.session.teacher_id){
            const teacher = await TeacherModel.findById(teacherId);
            if (!teacher) {
                throw new Error('Teacher not found');
            }
            const accountId = teacher.account;
            const account = await AccountModel.findById(accountId);
            if (!account) {
                throw new Error('Account not found');
            }
            res.render('teacher/editTeacher', { teacher, account});
        } else {
            console.error(error);
            res.status(500).send('Internal Error: ', error);
        } 
    } catch (error) {
        // Handle errors (e.g., teacher not found)
        console.error(error);
        res.status(404).send('Teacher not found');
    }
});

router.post('/editTeacher/:id', checkTeacherSession, upload.single('picture'), async (req, res) => {
    try {
        const teacherId = req.params.id;
        if(teacherId == req.session.teacher_id){
            const teacher = await TeacherModel.findById(teacherId);
            if (!teacher) {
                throw new Error('Teacher not found');
            }
            const accountId = teacher.account;
            const account = await AccountModel.findById(accountId);
            if (!account) {
                throw new Error('Account not found');
            }
            teacher.name = req.body.name;
            teacher.birth = req.body.birth;
            teacher.gender = req.body.gender;
            teacher.contact = req.body.contact;
            teacher.address = req.body.address;
            if (req.file) {
                const pictureData = fs.readFileSync(req.file.path);
                teacher.picture = pictureData.toString('base64');  
            } 
            await teacher.save();
            account.password = req.body.password;
            await account.save();
            
            res.redirect('/menu');
        } else {
            console.error(error);
            res.status(500).send('Internal Error: ', error);
        }
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('teacher/edit', { InputErrors, teacher });
        }
     }
});


module.exports = router;
