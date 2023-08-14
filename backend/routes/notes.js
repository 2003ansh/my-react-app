const express = require('express')
const router = express.Router();
var fetchuser = require('../middleware/fetchuser');
const { body, validationResult } = require('express-validator');
const Notes = require('../models/Notes');

//Route 1: fetch  a note using: get "http://localhost:5000/api/notes/fetchallnotes". login required
router.get('/fetchallnotes', fetchuser, async (req, res) => {
    try {
        const notes = await Notes.find({ user: req.user.id });
        res.json(notes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error occured");
    }

});


//Route 2: add a new note using: post "/api/notes/addnote". login required
router.post('/addnote', fetchuser, [
    body('title', 'Enter a valid title').isLength({ min: 3 }),
    body('description', 'description must be atlest 5characters').isLength({ min: 5 }),
],
    async (req, res) => {
        try {
            const { title, description, tag } = req.body;
            //if there are errors, return bad request and the errors caused due to format.
            const errors = await validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const notes = new Notes({ user: req.user.id, title, description, tag });
            const savedNote = await notes.save(); //-->here we are saving the note in database.notes.save() is a promise of saving the data in database.
            res.json(savedNote);
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Internal server error occured");
        }



    })
//Route 3: update an existing note using: put "/api/notes/updatenote". login required

router.put('/updatenote/:id', fetchuser, async (req, res) => {
    try {
        const { title, description, tag } = req.body;
    //create a newNote object
    const newNote = {};
    if (title) { newNote.title = title };
    if (description) { newNote.description = description };
    if (tag) { newNote.tag = tag };

//find the note to be updated and update it
    const note = await Notes.findById(req.params.id); //-->here we are finding the  id of note to be updated.
    //.findById(req.params.id): This is a Mongoose query method that attempts to find a document in the collection by its _id field. req.params.id is used to retrieve the value of the id parameter from the request URL. This is commonly used in an Express.js route to retrieve a specific resource based on its ID.
    if (!note) { return res.status(404).send("Not found") };

    //Allow updation only if user owns this note
    if (note.user.toString() !== req.user.id) { //-->here we are checking if the user is the owner of the note or not.by comparing the id of the user and the user id stored in the note.
        return res.status(401).send("Not allowed");
    }
    const updatedNote = await Notes.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true }); //-->$set is used to set the newNote object to the note to be updated.
    
    res.json(updatedNote);

    }
     catch (error) {
        console.error(error.message);
            res.status(500).send("Internal server error occured");
    }

})

//Route 4: delete an existing note using: delete "/api/notes/deletenote". login required

router.delete('/deletenote/:id', fetchuser, async (req, res) => {
    try {
        const { title, description, tag } = req.body;
//find the note to be deleted and delete it
    let note = await Notes.findById(req.params.id); //->here we are finding the  id of note to be deleted.
    if (!note) { return res.status(404).send("Not found") };

    //Allow deletion only if user owns this note
    if (note.user.toString() !== req.user.id) { //->here we are checking if the user is the owner of the note or not.by comparing the id of the user and the user id stored in the note.
        return res.status(401).send("Not allowed");
    }
    const deletedNote = await Notes.findByIdAndDelete(req.params.id);  //-->.findById(req.params.id): This is a Mongoose query method that attempts to find a document in the collection by its _id field. req.params.id is used to retrieve the value of the id parameter from the request URL. This is commonly used in an Express.js route to retrieve a specific resource based on its ID.
    res.json({ "Success": "Note has been deleted", deletedNote: deletedNote });
    } catch (error) {
        console.error(error.message);
            res.status(500).send("Internal server error occured");
    }
})


module.exports = router;