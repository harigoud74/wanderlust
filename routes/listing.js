const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");

const listingController = require("../controllers/listings.js");
// index route
router.get("/", wrapAsync(listingController.index));
// create
router.get("/new", isLoggedIn, (req, res) => {
  res.render("./listings/new.ejs");
});
// show route
router.get("/:id", async (req, res) => {
  let {id} = req.params;
  let listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "The listing you requested does not exist");
    return res.redirect("/listings");
  }
  res.render("./listings/show.ejs", {listing});
});
// bug

// show route post req
router.post(
  "/",
  isLoggedIn,
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  }),
);

// Edit route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "The listing you requested does not exist");
      return res.redirect("/listings");
    }
    res.render("./listings/edit.ejs", {listing});
  }),
);

router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  validateListing,
  wrapAsync(async (req, res) => {
    let {id} = req.params;
    // 1. Extract the image string from the form
    let imageUrl = req.body.listing.image;
    await Listing.findByIdAndUpdate(id, {
      ...req.body.listing,
      image: {url: imageUrl},
    });
    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
  }),
);

// delete
router.delete("/:id/delete", isLoggedIn, isOwner, async (req, res) => {
  let {id} = req.params;
  let delListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
});

module.exports = router;
