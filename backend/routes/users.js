const express = require("express")
const User = require("../models/User")
const { auth, requireRole } = require("../middleware/auth")

const router = express.Router()

// Get all users (admin only)
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 50
    const offset = Number.parseInt(req.query.offset) || 0

    const users = await User.findAll(limit, offset)

    res.json({
      success: true,
      data: users.map((user) => user.toJSON()),
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get single user (admin or own profile)
router.get("/:id", auth, async (req, res) => {
  try {
    // Check if user is accessing their own profile or is admin
    if (req.user.userId !== Number.parseInt(req.params.id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this user",
      })
    }

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      data: user.toJSON(),
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update user (admin or own profile)
router.put("/:id", auth, async (req, res) => {
  try {
    // Check if user is updating their own profile or is admin
    if (req.user.userId !== Number.parseInt(req.params.id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user",
      })
    }

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Don't allow non-admin users to change role
    if (req.user.role !== "admin" && req.body.role) {
      delete req.body.role
    }

    const updatedUser = await user.update(req.body)

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser.toJSON(),
    })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Delete user (admin only)
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    await user.delete()

    res.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = router
