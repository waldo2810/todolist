const dotenv = require("dotenv").config();
//#region Setup
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
//#endregion

//#region DB stuff
//! Connect to db
mongoose.connect(process.env.MONGOURL);
mongoose.set("strictQuery", true);

//! Create Schema
const itemSchema = new mongoose.Schema({ name: String });
const listSchema = new mongoose.Schema({ name: String, items: [itemSchema] });

//! Create Model
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

//! Create default documents
const item1 = new Item({ name: "WebDev" });
const item2 = new Item({ name: "Get a job" });
const item3 = new Item({ name: "Earn Money" });

const defaultItems = [item1, item2, item3];
//#endregion

app.get("/", function (req, res) {
  //! Retrieve items from db
  Item.find((err, itemsFound) => {
    if (err) {
      console.log(err);
    } else {
      if (itemsFound.length === 0) {
        //! Insert into db
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Items inserted to todoitemsDB");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: itemsFound });
      }
    }
  });
});

app.get("/:listName", (req, res) => {
  const listName = _.capitalize(req.params.listName);

  List.findOne({ name: listName }, (err, foundList) => {
    if (!foundList) {
      const list = {
        name: listName,
        items: defaultItems,
      };

      List.create(list);

      res.redirect(`${listName}`);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

app.post("/", function (req, res) {
  const item = { name: req.body.newItem };
  const listName = req.body.list.trim();

  if (listName === "Today") {
    Item.create(item);
    console.log("\nAdded item to Main List");
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      console.log("\nAdded item to " + foundList.name + " List");
      res.redirect(`/${listName}`);
    });
  }
});

app.post("/delete", (req, res) => {
  const id = req.body.trashcan;
  const actualID = id.trim();
  const listName = req.body.listName.trim();

  if (listName === "Today") {
    Item.findByIdAndRemove(actualID, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("\nDeleted ID: " + actualID + " from Main List");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: actualID } } },
      function (err, foundList) {
        if (!err) {
          console.log(
            "\nDeleted ID: " + actualID + " from " + listName + " List"
          );
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(port, function () {
  console.log("\nServer started on port", port);
});
