const express = require("express");
const app = express();
const port = 8080;
const ejs = require("ejs");
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");
const {listingSchema, reviewSchema} = require("./schema.js");
const Review = require("./models/review.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("DATABASE IS CONNECTED !");
}

app.get("/", (req, res) => {
  res.send("Successful testing");
});

const validateListing = (req, res, next) => {
  let {error} = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(500, errMsg);
  } else next();
};
const validateReview = (req, res, next) => {
  let {error} = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(500, errMsg);
  } else next();
};

// index route
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("./listings/index.ejs", {allListings});
});
// create
app.get("/listings/new", (req, res) => {
  res.render("./listings/new.ejs");
});
// show route
app.get("/listings/:id", async (req, res) => {
  let {id} = req.params;
  let listing = await Listing.findById(id).populate("reviews");
  res.render("./listings/show.ejs", {listing});
});
// bug

// show route post req
app.post(
  "/listings",
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  }),
);

// Edit route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    res.render("./listings/edit.ejs", {listing});
  }),
);

app.put(
  "/listings/:id",
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
app.delete("/listings/:id/delete", async (req, res) => {
  let {id} = req.params;
  let delListing = await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});

// reviews post
app.post(
  "/listings/:id/reviews",
  validateReview,
  wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
  }),
);

// delete route

app.delete(
  "/listings/:id/reviews/:reviewId",
  wrapAsync(async (req, res) => {
    let {id, reviewId} = req.params;

    await Listing.findByIdAndUpdate(id, {
      $pull: {reviews: reviewId},
    });

    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
  }),
);

app.use((err, req, res, next) => {
  let {status = 500, message = "invalid info"} = err;
  res.render("error.ejs", {err});
});

app.listen(port, () => {
  console.log("Server is started at port:", port);
});
