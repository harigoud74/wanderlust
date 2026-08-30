const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const {listingSchema} = require("../schema.js");
const Listing = require("../models/listing.js");

const validateListing = (req, res, next) => {
  let {error} = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(500, errMsg);
  } else next();
};

// index route
router.get("/", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("./listings/index.ejs", {allListings});
});
// create
router.get("/new", (req, res) => {
  res.render("./listings/new.ejs");
});
// show route
router.get("/:id", async (req, res) => {
  let {id} = req.params;
  let listing = await Listing.findById(id).populate("reviews");
  res.render("./listings/show.ejs", {listing});
});
// bug

// show route post req
router.post(
  "/",
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  }),
);

// Edit route
router.get(
  "/:id/edit",
  wrapAsync(async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    res.render("./listings/edit.ejs", {listing});
  }),
);

router.put(
  "/:id",
  validateListing,
  wrapAsync(async (req, res) => {
    let {id} = req.params;
    // 1. Extract the image string from the form
    let imageUrl = req.body.listing.image;

    await Listing.findByIdAndUpdate(id, {
      ...req.body.listing,
      image: {url: imageUrl},
    });
    res.redirect(`/listings/${id}`);
  }),
);

// delete
router.delete("/:id/delete", async (req, res) => {
  let {id} = req.params;
  let delListing = await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});

module.exports = router;
