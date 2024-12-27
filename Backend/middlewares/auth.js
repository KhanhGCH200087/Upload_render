


 //check Admin
const checkAdminSession = (req, res, next) => {
   if (req.session.email && req.session.role == '65ff13b74499eae16940821b') {
      next();
   }
   else {
      res.redirect('/auth/login');
   }
}

//check Driver
const checkDriverSession = (req, res, next) => {
   if (req.session.email && req.session.role == '65e7710db8020605732c8ee9') {
      next();
   }
   else {
      res.redirect('/auth/login');
   }
}
 
//check Teacher
const checkTeacherSession = (req, res, next) => {
   if (req.session.email && req.session.role == '65e7710db8020605732c8eea') {
      next();
   }
   else {
      res.redirect('/auth/login');
   }
}
 
//check Supervisor
const checkSupervisorSession = (req, res, next) => {
   if (req.session.email && req.session.role == '65e7710db8020605732c8eeb') {
      next();
   }
   else {
      res.redirect('/auth/login');
   }
}


 module.exports = {
    checkAdminSession,
    checkDriverSession,
    checkTeacherSession,
    checkSupervisorSession,
    
 }
 
 