//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//BackEnd Database
mongoose.connect(
  "mongodb+srv://bryannwr2000:!Bryannwr2000!@cluster0.1osuqnr.mongodb.net/todolistDB"
);

const itemSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemSchema);

//Default Items
const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});
const defaultItems = [item1, item2, item3];

//Items for work directory
const listSchema = mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = new mongoose.model("List", listSchema);

//Server
app.get("/", function (req, res) {
  getItems();

  async function getItems() {
    const item = await Item.find({});
    if (item.length == 0) {
      Item.insertMany([defaultItems]);
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: item });
    }
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    findList();

    async function findList() {
      const foundList = await List.findOne({ name: listName }).exec();
      if (foundList) {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    }
  }
});

//delete Item
app.post("/delete", (req, res) => {
  const deleteItem = req.body.checkbox;
  const listName = req.body.listName;
  console.log(listName);

  if (listName == "Today") {
    Item.findByIdAndRemove(deleteItem).exec();
    res.redirect("/");
  } else {
    findUpdate().catch((err) => console.log(err));
    async function findUpdate() {
      console.log(deleteItem);
      const update = await List.findOneAndUpdate(
        { name: "Fun" },
        { $pull: { items: { _id: deleteItem } } }
      ).exec();
      res.redirect("/" + listName);
    }
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  findModel(customListName);

  async function findModel(customListName) {
    const foundList = await List.findOne({ name: customListName }).exec();
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
