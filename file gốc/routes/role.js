var express = require('express');
var router = express.Router();

//import model before use
var RoleModel = require('../models/RoleModel');

//------------------------------------------------------------------------
//show all 
router.get('/', async(req, res) => {
    //retrieve data from collection
    try{
        var roleList = await RoleModel.find({});
        //render view and pass data
        res.render('role/index', {roleList});
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    } 
});

//-----------------------------------------------------------------------
// //delete specific 
// router.get('/delete/:id', async(req, res) => {
//     //req.params: get value by url
//     var id = req.params.id;
//     await RoleModel.findByIdAndDelete(id);
//     res.redirect('/role');
// });

//------------------------------------------------------------------------
//create 
//render form for user to input
// router.get('/add', (req, res) => {
//     res.render('role/add');
// })

// //receive form data and insert it to database
// router.post('/add', async (req, res) => {
//     //get value by form : req.body
//     var role = req.body;
//     await RoleModel.create(role);
//     res.redirect('/role');
// })


//---------------------------------------------------------------------------
//edit 
router.get('/edit/:id', async (req, res) => {
    try{
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    } catch(error){
        var id = req.params.id;
        var role = await RoleModel.findById(id);
        res.render('role/edit', {role});
    }
})

router.post('/edit/:id', async(req, res) => {
    try{
        var id = req.params.id;
        var data = req.body;
        await RoleModel.findByIdAndUpdate(id, data);
        res.redirect('/role');
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('role/edit', { InputErrors, role });
        }
     }  
})


module.exports = router;
