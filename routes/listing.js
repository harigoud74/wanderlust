const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");

const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});

router
  .route("/")
  // index route
  .get(wrapAsync(listingController.index))
  // show route post req
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing),
  );
// .post(upload.single("listing[image]"), (req, res) => {
//   res.send(req.file);
//   console.log(req.file);
// });

// create
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")

  // show route
  .get(wrapAsync(listingController.showListing))

  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing),
  );

// Edit route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm),
);

// delete
router.delete(
  "/:id/delete",
  isLoggedIn,
  isOwner,
  listingController.destroyListing,
);

module.exports = router;
