const User = require("../models/User")
const { StatusCodes } = require("http-status-codes")
const CustomError = require("../errors")
const { attachCookiesToResponse, createTokenUser } = require("../utils")

// register user
const register = async (req, res) => {
  const { name, email, password } = req.body
  const userAlreadyExists = await User.findOne({ email })
  if (userAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists")
  }
  const firstTimeUser = (await User.countDocuments({})) === 0
  const role = firstTimeUser ? "admin" : "user"
  const user = await User.create({ name, email, password, role })

  const payload = createTokenUser(user)
  attachCookiesToResponse(res, payload)
  res.status(StatusCodes.CREATED).json({ user: payload })
}

// login user
const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password")
  }

  const user = await User.findOne({ email })
  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials")
  }

  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials")
  }

  const payload = createTokenUser(user)
  attachCookiesToResponse(res, payload)
  res.status(StatusCodes.CREATED).json({ user: payload })
}

// logout user
const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  })
  res.status(StatusCodes.OK).json({ msg: "user logged out!" })
}

module.exports = { register, login, logout }
