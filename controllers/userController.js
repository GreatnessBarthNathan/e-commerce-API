const User = require("../models/User")
const { StatusCodes } = require("http-status-codes")
const CustomError = require("../errors")
const createTokenUser = require("../utils/createTokenUser")
const { attachCookiesToResponse, checkPermissions } = require("../utils")

const getAllUsers = async (req, res) => {
  const users = await User.find({ role: "user" }).select("_id name email role")
  res.status(StatusCodes.OK).json({ users })
}

const getSingleUser = async (req, res) => {
  const id = req.params.id
  // another way to select. We're removing the password and returning everything else
  const user = await User.findOne({ _id: id }).select("-password")
  if (!user) {
    throw new CustomError.BadRequestError(`No user with id: ${req.params.id}`)
  }
  checkPermissions(req.user, user._id)
  res.status(StatusCodes.OK).json({ user })
}

const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user })
}

// update user with user.save()
const updateUser = async (req, res) => {
  const { email, name } = req.body
  if (!email || !name) {
    throw new CustomError.BadRequestError("Please provide all values")
  }
  const user = await User.findOne({ _id: req.user.userId })

  user.email = email
  user.name = name
  await user.save()

  const payload = createTokenUser(user)
  attachCookiesToResponse(res, payload)
  res.status(StatusCodes.OK).json({ user: payload })
}

// update user with findOneAndUpdate
// const updateUser = async (req, res) => {
//   const { email, name } = req.body
//   if (!email || !name) {
//     throw new CustomError.BadRequestError("Please provide all values")
//   }
//   const user = await User.findOneAndUpdate(
//     { _id: req.user.userId },
//     { email, name },
//     { new: true, runValidators: true }
//   )
//   const payload = createTokenUser(user)
//   attachCookiesToResponse(res, payload)
//   res.status(StatusCodes.OK).json({ user: payload })
// }

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide correct values")
  }
  const user = await User.findOne({ _id: req.user.userId })

  const isPasswordCorrect = await user.comparePassword(oldPassword)
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials")
  }

  user.password = newPassword
  await user.save()
  res.status(StatusCodes.OK).json({ msg: "Password updated" })
}

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
}
