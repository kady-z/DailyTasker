const express = require('express');
const bodyParser = require('body-parser');
const path = require('path-posix');
const ejs = require('ejs');
const e = require('express');
const mongoose = require('mongoose');

const date = require(__dirname + '/date.js');

path.resolve(__dirname, 'foo');

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');


const taskSchema = new mongoose.Schema({
    task: String
});

const dailyTask = mongoose.model("dailyTask",taskSchema);

const taskOne = new dailyTask({
    task: "complete book reading"
});

const taskTwo = new dailyTask({
    task: "watch video"
});

const taskThree = new dailyTask({
    task: "watch video again"
});

const taskArray = [taskOne, taskTwo, taskThree];

const newListSchema = new mongoose.Schema({
    listName: String,
    items: [taskSchema]
});

const List = mongoose.model("List", newListSchema);

app.get("/", function (req, res) {
    let day = date.presentDay();

    dailyTask.find( {}, function (err, docs) {
        if(err) {
            console.log("error in searching");
        } else if (docs.length === 0) {
            
            dailyTask.insertMany(taskArray, function (err) {
                if(err) {
                    console.log("Error in inserting!");
                } else {
                    console.log("Successfully inserted!");
                }
            });

            res.redirect('/');

        } else {
            res.render('list', {listTitle: day, addTasks: docs, listType: "today"});
        }

    });

});

app.post('/', function(req, res) {
    
    let tempTask = req.body.task;
    let llistName = req.body.list;

    let tempTaskDB = new dailyTask({
        task: tempTask
    });

    if(llistName === "today") {
        tempTaskDB.save();
        res.redirect('/');
    } else {
        List.findOne({listName: llistName}, function(err, docs) {
            docs.items.push(tempTaskDB);
            docs.save();
            res.redirect('/'+llistName);
        });
    }
});

app.get('/about', function(req, res) {
    res.render('about');
});

app.post('/delete', function(req, res) {
    const listName = req.body.listName;
    const taskName = req.body.checkbox;

    if(listName === "today") {
        dailyTask.deleteOne({task: taskName}, function(err, item) {
            res.redirect('/');
        });
    } else {
        List.findOneAndUpdate({listName: listName}, {$pull: {items: {task: taskName}}}, function (err, docs) {
            if(!err) {
                res.redirect('/'+listName);
            }
        });
    }
});

app.get('/:newList', function (req, res) {
    const newListName = req.params.newList;

    List.findOne({listName: newListName}, function(err, docs) {
        if(err) {
            console.log("Error in finding list!");
        } else {
            if(!docs) {
                const list = new List( {
                    listName: newListName,
                    items: taskArray
                });
                list.save();
                res.redirect('/'+newListName);
            }
            else {
                res.render('list', {listTitle: docs.listName, addTasks: docs.items, listType: docs.listName});
            }
        }
    });
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server is running");
});