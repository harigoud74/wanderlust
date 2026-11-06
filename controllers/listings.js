const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({accessToken: mapToken});

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("./listings/index.ejs", {allListings});
};

module.exports.renderNewForm = (req, res) => {
  res.render("./listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
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
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  let url = req.file.url;
  let filename = req.file.public_id;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = {url, filename};
  newListing.geometry = response.body.features[0].geometry;
  let savedListing = await newListing.save();
  console.log(savedListing);
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let {id} = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "The listing you requested does not exist");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");
  res.render("./listings/edit.ejs", {listing, originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
  let {id} = req.params;
  let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
  if (typeof req.file !== "undefined") {
    let url = req.file.url;
    let filename = req.file.public_id;
    listing.image = {url, filename};
    await listing.save();
  }
  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};
// module.exports.updateListing = async (req, res) => {
//   let {id} = req.params;
//    let url = req.file.url;
//    let filename = req.file.public_id;
//   // 1. Extract the image string from the form
//   let imageUrl = req.body.listing.image;
//   await Listing.findByIdAndUpdate(id, {
//     ...req.body.listing,
//     image: {url: imageUrl},
//   });
//   req.flash("success", "Listing Updated");
//   res.redirect(`/listings/${id}`);
// };

module.exports.destroyListing = async (req, res) => {
  let {id} = req.params;
  let delListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
