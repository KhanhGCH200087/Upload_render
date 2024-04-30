var express = require('express')
var router = express.Router()
var AccountModel = require('../models/AccountModel');
var DriverModel = require('../models/DriverModel');
var SupervisorModel = require('../models/SupervisorModel');
var TeacherModel = require('../models/TeacherModel');

//import "bcryptjs" library
var bcrypt = require('bcryptjs');
var salt = 8;                     //random value

router.get('/login', async(req, res) => {
   res.render('index');
})

router.post('/login', async (req, res) => {
   try {
      var accountLogin = req.body;
      var account = await AccountModel.findOne({ email: accountLogin.email }) //email: tên cột, accountLogin.email: người dùng nhập vào //dùng hàm findOne để đối chiếu dữ liệu đc nhập vào và db có khớp ko

      if (account) {
         var hash = bcrypt.compareSync(accountLogin.password, account.password)
         if (hash) {
            //----------------------------Session-----------------------------------------------------
            var accountId = account._id;
            //Driver
            const driverData = await DriverModel.findOne({account: accountId});
            if(driverData){
               req.session.driver_id = driverData._id;
            }
            //Supervisor
            const supervisorData = await SupervisorModel.findOne({account: accountId});
            if(supervisorData){
               req.session.supervisor_id = supervisorData._id;
            }
            //Teacher
            const teacherData = await TeacherModel.findOne({account: accountId});
            if(teacherData){
               req.session.teacher_id = teacherData._id;
            }
            //------------------------------------------------------------------------------------------------
            //initialize session after login success
            req.session.account_id = account._id;
            req.session.email = account.email;
            req.session.role = account.role; //take role from db, put it so session so it can be checked in middleware
            if (account.role == '65ff13b74499eae16940821b') { //role: admin
               res.redirect('/journey');
            }
            else if(account.role == '65e7710db8020605732c8ee9') { //role: Driver
               res.redirect('/driver/menu');
            }
            else if(account.role == '65e7710db8020605732c8eea'){ //role: Teacher
                res.redirect('/teacher/menu');
            }
            else if(account.role == '65e7710db8020605732c8eeb'){ //role: Supervisor
                res.redirect('/supervisor/menu');
            }
          
         } else {
            res.redirect('/auth/login');
         }
      } else {
         res.redirect('/auth/login');
      }
   } catch (err) {
      console.log("Error: ", err);
   }
});

router.get('/logout', (req, res) => {
   req.session.destroy();
   res.redirect("/auth/login");
})

module.exports = router