const Review = require("../models/Review")
const Product = require("../models/Product")
const { StatusCodes } = require("http-status-codes")
const CustomError = require("../errors")
const { checkPermissions } = require("../utils")

// create review
const createReview = async (req, res) => {
  const { product: productId } = req.body

  const isValidProduct = await Product.findOne({ _id: productId })
  if (!isValidProduct) {
    throw new CustomError.NotFoundError(`No product with id: ${productId}`)
  }

  const alreadySubmitted = await Review.findOne({
    product: productId,
    user: req.user.userId,
  })

  if (alreadySubmitted) {
    throw new CustomError.BadRequestError(
      "Already submitted review for this product"
    )
  }
  req.body.user = req.user.userId
  const review = await Review.create(req.body)
  res.status(StatusCodes.CREATED).json({ review })
}

// get all reviews
const getAllReviews = async (req, res) => {
  //   const reviews = await Review.find({})
  const reviews = await Review.find({})
    .populate({
      path: "product",
      select: "name company price",
    })
    .populate({ path: "user", select: "name" })
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length })
}

// get single review
const getSingleReview = async (req, res) => {
  const { id: reviewId } = req.params

  const review = await Review.findOne({ _id: reviewId })
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`)
  }
  res.status(StatusCodes.OK).json({ review })
}

// update review
const updateReview = async (req, res) => {
  const { rating, title, comment } = req.body
  const { id: reviewId } = req.params
  const review = await Review.findOne({ _id: reviewId })

  if (!review) {
    throw new CustomError.BadRequestError(`No review with the id ${reviewId}`)
  }
  checkPermissions(req.user, review.user)

  review.rating = rating
  review.title = title
  review.comment = comment

  await review.save()
  res.status(StatusCodes.OK).json({ review })
}

// delete review
const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params
  const review = await Review.findOne({ _id: reviewId })

  if (!review) {
    throw new CustomError.BadRequestError(`No review with id ${reviewId}`)
  }
  checkPermissions(req.user, review.user)
  await review.remove()
  res.status(StatusCodes.OK).json({ msg: "Review successfully deleted" })
}

const getSingleProductReviews = async (req, res) => {
  const { id: productId } = req.params
  const reviews = await Review.find({ product: productId })
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length })
}

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
}
