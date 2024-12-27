var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');
var bcrypt = require('bcryptjs');
var salt = 8; 

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
router.get('/',checkAdminSession, async(req, res) => {
    try{
        var teacherList = await TeacherModel.find({}).populate('account');
        if(teacherList.length === 0){
            const message = "There are no teacher on the list";
            res.render('admin/teacher/index', {message, layout:'layoutAdmin'});
        }
        res.render('admin/teacher/index', {teacherList, layout:'layoutAdmin'});
    } catch(error) {
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when showing teacher list";
        res.render('admin/teacher/index', {message, layout:'layoutAdmin'});
    }
});

//-----------------------------------------------------------------------
//delete specific teacher
router.get('/delete/:id', checkAdminSession, async(req, res) => {
    var teacherList = await TeacherModel.find({}).populate('account');
    try{
        const teacherId = req.params.id;
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            const message = "There are no teacher on the list";
            res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
            return;
        }
        // Fetch account details by ID
        const accountId = teacher.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {    
            await TeacherModel.findByIdAndDelete(teacherId);
            await AccountModel.findByIdAndDelete(accountId);
            const message = "There are no teacher account on the list";
            res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
        }
        await TeacherModel.findByIdAndDelete(teacherId);
        await AccountModel.findByIdAndDelete(accountId);
        res.redirect('/teacher');
    } catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when deleting teacher";
        res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
    } 
});

//------------------------------------------------------------------------
router.get('/add',checkAdminSession,  async(req, res) => {
    res.render('admin/teacher/add', {layout:'layoutAdmin'});
})
//create teacher
router.post('/add',checkAdminSession, upload.single('picture'), async (req, res) => {
    var teacherList = await TeacherModel.find({}).populate('account');
    try{
        const name = req.body.name;
        const contact = req.body.contact;
        const address = req.body.address;
        const picture = req.file 
        const email = req.body.email;
        const password = req.body.password;
        const hashPassword = bcrypt.hashSync(password, salt);
        const role = '65e7710db8020605732c8eea';

        const account = await AccountModel.create({
            email: email,
            password: hashPassword,
            role: role
        });
        
        if(req.file){
            const pictureData = fs.readFileSync(picture.path);
            const base64Image = pictureData.toString('base64');
            const newTeacher = await TeacherModel.create(
                {
                    name: name,
                    contact: contact,
                    address: address,
                    picture: base64Image,
                    account: account
                }
            );
            if(account){
                if(newTeacher){
                    res.redirect('/teacher');
                } else {
                    const message = "Error when create teacher";
                    res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
                    return;
                }
            } else {
                const message = "Error when create teacher account";
                res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
                return;
            }
        } else if(!req.file){
            const base64Image = process.env.DEFAULT_BASE64_IMAGE;
            const newTeacher = await TeacherModel.create(
                {
                    name: name,
                    contact: contact,
                    address: address,
                    picture: base64Image,
                    account: account
                }
            );
            if(account){
                if(newTeacher){
                    res.redirect('/teacher');
                } else {
                    const message = "Error when create teacher";
                    res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
                    return;
                }
            } else {
                const message = "Error when create teacher account";
                res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
                return;
            }
        }

    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('admin/teacher/add', {InputErrors, layout:'layoutAdmin'});
        }
     }  
});

//---------------------------------------------------------------------------
//edit teacher
router.get('/edit/:id',checkAdminSession, async (req, res) => {
    var teacherList = await TeacherModel.find({}).populate('account');
    try {
        const teacherId = req.params.id;
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            const message = "There are no teacher on the list";
            res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
            return;
        }
        const accountId = teacher.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            const message = "There are no teacher account on the list";
            res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
            return;
        }
        res.render('admin/teacher/edit', {teacher, account, layout:'layoutAdmin'});
    } catch (error) {
        // Handle errors (e.g., teacher not found)
        console.error(error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when editing teacher";
            res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
            return;
    }
});

router.post('/edit/:id',checkAdminSession, upload.single('picture'), async (req, res) => {
    var teacherList = await TeacherModel.find({}).populate('account');
    try {
        // Fetch teacher by ID
        const teacherId = req.params.id;
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            const message = "There are no teacher on the list";
            res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
            return;
        }
        // Fetch account details by ID
        const accountId = teacher.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            const message = "There are no teacher account on the list";
            res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
            return;
        }
        // Update teacher details
        teacher.name = req.body.name;
        teacher.contact = req.body.contact;
        teacher.address = req.body.address;
        const teacherPicture = teacher.picture;
        if (req.file) {
            const pictureData = fs.readFileSync(req.file.path);
            teacher.picture = pictureData.toString('base64');  
        } 
        account.email = req.body.email;
        const normalPassword = req.body.password;
        if(req.body.password){
            const hashPassword = bcrypt.hashSync(normalPassword, salt);
            account.password = hashPassword;
        }

        if(!req.body.name || !req.body.contact || !req.body.address || !req.body.email ){
            const message = "Enter information again";
            res.render('admin/teacher/edit', {message, layout:'layoutAdmin',
                teacher: {
                    _id: req.params.id, 
                    name: req.body.name, 
                    contact: req.body.contact,
                    address: req.body.address,
                    picture: teacherPicture
                },
                account: {
                    _id: accountId,
                    email: req.body.email,
                }
            });
            return;
        }

        const editTeacher = await teacher.save();
        const editAccount = await account.save();

        if(editTeacher){
            if(editAccount){
                res.redirect('/teacher');
            } else {
                const message = "Error when editing teacher account";
                res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
                return;
            }
        } else {
            const message = "Error when editing teacher";
            res.render('admin/teacher/index', {message, teacherList, layout:'layoutAdmin'});
            return;
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('admin/teacher/edit', {InputErrors, teacher, account, layout:'layoutAdmin'});
        }
     }  
});

//-----------------------------phần này cho role teacher------------------------------
//menu page
router.get('/menu', checkTeacherSession,  async(req, res) => {
    try{
        const teacherId = req.session.teacher_id;
        const teacherData = await TeacherModel.findById(teacherId).populate('account'); //lấy thông tin teacher
        if(teacherData){
            const classList = await ClassModel.find({teacher: teacherId}); //lấy thông tin class
            if(classList.length === 0){
                const message = "There are no data for class in the list";
                res.render('teacher/menu', {message, teacherData,layout:'layoutTeacher'});
            }
            res.render('teacher/menu', {classList, teacherData,layout:'layoutTeacher'});
        } else {
            const message = "There are no data for teacher in the list";
            res.render('teacher/menu', {message,layout:'layoutTeacher'});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, error: 'Internal error'});
        const message = "Error when showing teacher";
        res.render('teacher/menu', {message,layout:'layoutTeacher'});
    }
});

// class page--------teacher xem đc thông tin class đã chọn
router.get('/class/:id', checkTeacherSession, async(req, res) => {
    const teacherId = req.session.teacher_id;
    const teacherData = await TeacherModel.findById(teacherId);
    const classList = await ClassModel.find({teacher: teacherId});
    try{
        const teacherID = req.session.teacher_id;
        const classId = req.params.id;
        const classData = await ClassModel.findById(classId); //lấy thông tin class
        if(classData){
            const teacherID2 = classData.teacher;
            if(teacherID2 == teacherID){
                const studentList = await StudentModel.find({class: classId}).populate('supervisor'); //lấy thông tin student
                const scheduleList = await ScheduleModel.find({classes: classId}); // lấy thông tin schedule
                if(studentList.length === 0 || scheduleList === 0){
                    const message = "Some data of student or schedule is missing";
                    res.render('teacher/class', {message,layout:'layoutTeacher'});
                    return;
                }
                res.render('teacher/class', {classData, studentList, scheduleList,layout:'layoutTeacher'});
            } else {
                const message = "Invalid access";
                res.render('teacher/class', {message,layout:'layoutTeacher'});
                return;
            }
        } else {
            const message = "There are no data for this class";
            res.render('teacher/class', {message,layout:'layoutTeacher'});
            return;
        }
    } catch(error) {
        console.log("Error: ", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when access class data";
        res.render('teacher/menu', {message, teacherData, classList,layout:'layoutTeacher'});
        return;
    }
});

//edit teacher data-----------------------------------------------
router.get('/editTeacher/:id', checkTeacherSession, async (req, res) => {
    const teacherId = req.session.teacher_id;
    const teacherData = await TeacherModel.findById(teacherId);
    const classList = await ClassModel.find({teacher: teacherId});
    try {
        const teacherId = req.params.id;
        if(teacherId == req.session.teacher_id){
            const teacher = await TeacherModel.findById(teacherId);
            if (!teacher) {
                const message = "There are no data for teacher";
                res.render('teacher/menu', {message, teacherData, classList,layout:'layoutTeacher'});
                return;
            }
            const accountId = teacher.account;
            const account = await AccountModel.findById(accountId);
            if (!account) {
                const message = "There are no data for teacher account";
                res.render('teacher/menu', {message, teacherData, classList,layout:'layoutTeacher'});
                return;
            }
            res.render('teacher/editTeacher', {teacher, account,layout:'layoutTeacher'});
        } else {
            const message = "Invalid Teacher";
            res.render('teacher/editTeacher', {message,layout:'layoutTeacher'});
        } 
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error editing teacher";
        res.render('teacher/menu', {message, teacherData, classList,layout:'layoutTeacher'});
    }
});

router.put('/editTeacher/:id', checkTeacherSession, upload.single('picture'), async (req, res) => {
    const teacherId = req.session.teacher_id;
    const teacherData = await TeacherModel.findById(teacherId);
    const classList = await ClassModel.find({teacher: teacherId});
    try {
        const teacherId = req.params.id;
        if(teacherId == req.session.teacher_id){
            const teacher = await TeacherModel.findById(teacherId);
            if (!teacher) {
                const message = "There are no data for teacher";
                res.render('teacher/menu', {message, teacherData, classList,layout:'layoutTeacher'});
                return;
            }
            const accountId = teacher.account;
            const account = await AccountModel.findById(accountId);
            if (!account) {
                const message = "There are no data for teacher account";
                res.render('teacher/menu', {message, teacherData, classList,layout:'layoutTeacher'});
                return;
            }
            
            teacher.name = req.body.name;
            teacher.contact = req.body.contact;
            teacher.address = req.body.address;
            const teacherPicture = teacher.picture;
            if (req.file) {
                const pictureData = fs.readFileSync(req.file.path);
                teacher.picture = pictureData.toString('base64');  
            } 
            const normalPassword = req.body.password;
            if(req.body.password){
                const hashPassword = bcrypt.hashSync(normalPassword, salt);
                account.password = hashPassword;
            }
            
            if(!req.body.name  || !req.body.contact || !req.body.address ){
                const message = "Enter information again";
                res.render('admin/teacher/edit', {message, layout:'layoutTeacher',
                    teacher: {
                        _id: req.params.id, 
                        name: req.body.name, 
                        contact: req.body.contact,
                        address: req.body.address,
                        picture: teacherPicture
                    },
                    account: {
                        _id: accountId
                    }
                });
                return;
            }

            const editTeacher = await teacher.save();
            const editAccount = await account.save();
            if(editTeacher){
                if(editAccount){
                    res.redirect('/teacher/menu');
                } else {
                    const message = "Edit teacher account fail";
                    res.render('teacher/menu', {message, teacherData, classList,layout:'layoutTeacher'});
                    return;
                }
            } else {
                const message = "Edit teacher fail";
                res.render('teacher/menu', {message, teacherData, classList,layout:'layoutTeacher'});
                return;
            }
        } else {
            const message = "Invalid Teacher";
            res.render('teacher/editTeacher', {message,layout:'layoutTeacher'});
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           res.render('teacher/editTeacher', {InputErrors,layout:'layoutTeacher'})
        }
     }  
});


module.exports = router;
