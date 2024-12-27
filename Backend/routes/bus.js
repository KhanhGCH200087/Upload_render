var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');

var BusModel = require('../models/BusModel');

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

//show all bus 
router.get('/', async(req, res) => {
    try{
        var busList = await BusModel.find({});
        if(!busList){
            const message = "Error when showing bus list";
            res.render('admin/bus/index', {message, layout: 'layoutAdmin'});
        }
        if(busList.length === 0){
            const message = "There are no bus in the system";
            res.render('admin/bus/index', {message, layout: 'layoutAdmin'});
        }
        res.render('admin/bus/index', {busList, layout: 'layoutAdmin'});
    }catch(error){
        console.error("Error:", error);
        const message = "Error when showing bus list";
        res.render('admin/bus/index', {message, layout: 'layoutAdmin'});
    }
});

//-----------------------------------------------------------------------
//delete specific bus 
router.get('/delete/:id', async(req, res) => {
    var busList = await BusModel.find({});
    try{
        var id = req.params.id;
        const bus = await BusModel.findById(id);
        if(bus){
            await BusModel.deleteOne(bus);
            res.redirect('/bus');
        } else {
            const message = "There are no bus in the system";
            res.render('admin/bus/index', {message, busList, layout: 'layoutAdmin'});
        }
    }catch(error){
        console.error("Error:", error);
        const message = "Error when Deleting bus in the list";
        res.render('admin/bus/index', {message, busList, layout: 'layoutAdmin'});
    }
});

//------------------------------------------------------------------------
//create bus
router.get('/add', async(req, res) => {
    res.render('admin/bus/add', {layout: 'layoutAdmin'});
});

router.post('/add', upload.single('picture'), async (req, res) => {
    try{
        const plate = req.body.plate;
        const seats = req.body.seats;
        const picture = req.file;

        if(req.file){
            const imageData = fs.readFileSync(picture.path);
            //convert image data to base 64
            const base64Image = imageData.toString('base64');
            const newBus = await BusModel.create(
                {
                    plate:plate,
                    seats:seats,
                    picture: base64Image
                }
            );
            if(!newBus){
                const message = "Error when create a bus";
                res.render('admin/bus/add', {message, layout: 'layoutAdmin'});
            }
            res.redirect('/bus');
        } else if(!req.file){
            const base64Image = process.env.DEFAULT_BASE64_IMAGE;
            const newBus = await BusModel.create(
                {
                    plate:plate,
                    seats:seats,
                    picture: base64Image
                }
            );
            if(!newBus){
                const message = "Error when create a bus";
                res.render('admin/bus/add', {message, layout: 'layoutAdmin'});
            }
            res.redirect('/bus');
        }
       
    }catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
           res.render('admin/bus/add', {InputErrors}); //????
        }
     }
});

//-----------------------------------------------------------------------------
//edit bus 
router.get('/edit/:id',  async (req, res) => { 
    var busList = await BusModel.find({});
    try{
        var id = req.params.id;
        var bus = await BusModel.findById(id);
        if(bus){
            res.render('admin/bus/edit', {bus, layout: 'layoutAdmin'});
        } else {
            const message = "Error when taking bus to edit"
            res.render('admin/bus/index', {message, busList, layout: 'layoutAdmin'});
        }
    } catch(error){
        console.error("Error:", error);
        const message = "Error when taking bus to edit Error"
        res.render('admin/bus/index', {message, busList, layout: 'layoutAdmin'});
    }
});

router.post('/edit/:id', upload.single('picture'), async(req, res) => {
    try{
        const id = req.params.id;
        const busData = await BusModel.findById(id);
        const plate = req.body.plate;
        const seats = req.body.seats;
        const picture = req.file;
        if (!plate.trim()) {
            const message = "Plate number is required";
            res.render('admin/bus/edit', { message, bus: { _id: id, plate, seats, picture: busData.picture }, layout: 'layoutAdmin'});
            return;
        }
        if (seats < 1 || seats > 50) {
            const message = "Number of seats must be between 1 and 50";
            res.render('admin/bus/edit', { message, bus: { _id: id, plate, seats, picture: busData.picture  } , layout: 'layoutAdmin'});
            return;
        }
        if(req.file){
            const imageData = fs.readFileSync(picture.path);
            //convert image data to base 64
            const base64Image = imageData.toString('base64');
            const editBus = await BusModel.findByIdAndUpdate(id,
            {
                plate: plate,
                seats : seats,
                picture: base64Image
            });
            if(editBus){
                res.redirect('/bus');
            } else {
                const message = "Error when edit bus"
                res.render('admin/bus/edit', {message, layout: 'layoutAdmin'});
            }
        } else if(!req.file){
            const editBus = await BusModel.findByIdAndUpdate(id,
            {
                plate: plate,
                seats : seats,
            });
            if(editBus){
                res.redirect('/bus');
            } else {
                const message = "Error when edit bus"
                res.render('admin/bus/edit', {message, layout: 'layoutAdmin'});
            }
        }
    }catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
            console.error("Error while edit bus:", error);
            res.render('admin/bus/edit/id', {InputErrors, layout: 'layoutAdmin'});
        }
     }
});

module.exports = router;

