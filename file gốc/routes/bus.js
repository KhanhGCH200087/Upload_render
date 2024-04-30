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
    //retrieve data from collection
    try{
        var busList = await BusModel.find({});
        //render view and pass data
        res.render('bus/index', {busList});
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//-----------------------------------------------------------------------
//delete specific bus
router.get('/delete/:id', async(req, res) => {
    //req.params: get value by url
    try{
        var id = req.params.id;
        await BusModel.findByIdAndDelete(id);
        res.redirect('/bus');
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//------------------------------------------------------------------------
//create bus
//render form for user to input
router.get('/add', async (req, res) => {
    try{
        res.render('bus/add');
    }catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/add', upload.single('picture'), async (req, res) => {
    //get value by form : req.body
    try{
        const plate = req.body.plate;
        const seats = req.body.seats;
        const picture = req.file //access the uplodaded image
      
        //read the image file
        const imageData = fs.readFileSync(picture.path);
        //convert image data to base 64
        const base64Image = imageData.toString('base64');
        await BusModel.create(
            {
                plate:plate,
                seats:seats,
                picture: base64Image
            }
        );
        res.redirect('/bus');
    }catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('bus/add', { InputErrors, bus });
        }
     }
});

//-----------------------------------------------------------------------------
//edit bus
router.get('/edit/:id', async (req, res) => {
    try{
        var id = req.params.id;
        var bus = await BusModel.findById(id);
        res.render('bus/edit', {bus});
    } catch(error){
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
})

router.post('/edit/:id', async(req, res) => {
    try{
        var id = req.params.id;
        var data = req.body;
        await BusModel.findByIdAndUpdate(id, data);
        res.redirect('/bus');
    }catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           res.render('bus/edit', { InputErrors, bus });
        }
     }
});




module.exports = router;

