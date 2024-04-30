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
        if(roleList){
            res.render('admin/role/index', {roleList, layout:'layoutAdmin'});
        } else {
            const message = "There are no role in the list";
            res.render('admin/role/index', {message, layout:'layoutAdmin'});
        }
    }catch(error){
        console.error("Error:", error);
        res.status(500).json({success: false, error: 'Internal Error'});
        const message = "Error when showing role";
        res.render('admin/role/index', {message, layout:'layoutAdmin'});
    } 
});

//---------------------------------------------------------------------------
//edit 
router.get('/edit/:id', async (req, res) => {
    var roleList = await RoleModel.find({});
    try{
        var id = req.params.id;
        var role = await RoleModel.findById(id);
        if(role){
            res.render('admin/role/edit', {role, layout:'layoutAdmin'});
        } else {
            const message = "There are no role in the list";
            res.render('admin/role/index', {message, roleList, layout:'layoutAdmin'});
        }
    } catch(error){
        console.error("Error:", error);
        const message = "Error when edit role";
        res.render('admin/role/index', {message, roleList, layout:'layoutAdmin'});
    }
});

router.post('/edit/:id', async(req, res) => {
    var roleList = await RoleModel.find({});
    try{
        const id = req.params.id;
        const role = req.body.role;
        const description = req.body.description;
        if(!req.body.role){
            const message = "Enter the role name";
            res.render('admin/role/edit', {message, role:{_id: id, role, description}, layout:'layoutAdmin'})
        }
        const editRole = await RoleModel.findByIdAndUpdate(id, 
            {
                role: role,
                description: description
            }
        );
        if(editRole){
            res.redirect('/role');
        } else {
            const message = "Error when edit role";
            res.render('admin/role/index', {message, roleList, layout:'layoutAdmin'});
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           console.log("Error: ", error);
           const message = "Error when edit role";
            res.render('admin/role/index', {message, roleList, layout:'layoutAdmin'});
        }
     }  
})


module.exports = router;
