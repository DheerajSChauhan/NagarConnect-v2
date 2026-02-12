const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// JWT generator
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Register a user
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, ward, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, error: 'User already exists with this email' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      ward,
      phone,
    });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Please enter email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin login
exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (password !== 'capstone')
      return res.status(401).json({ success: false, error: 'Invalid admin credentials' });

    let adminUser = await User.findOne({ role: 'admin', email: 'ak@gmail.com' }).select('+password');
    // console.log(adminUser);
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('capstone', 10);
      adminUser = await User.create({
        name: 'Admin',
        email: 'ak@gmail.com',
        password: hashedPassword,
        ward: 'Admin Ward',
        phone: '0000000000',
        role: 'admin',
      });
    }

    const isMatch = await bcrypt.compare(password, adminUser.password);
    // console.log(isMatch);
    if (!isMatch)
      return res.status(401).json({ success: false, error: 'Invalid admin credentials' });

    const token = generateToken(adminUser._id);
    console.log(token);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    // console.log(error);
    next(error);
  }
};

// Ward Admin login
exports.wardAdminLogin = async (req, res, next) => {
  try {
    const { username, password, wardNumber } = req.body;

    if (!username || !password || !wardNumber)
      return res.status(400).json({
        success: false,
        error: 'Please provide username, password, and ward number',
      });

    const wardAdmin = await User.findOne({
      role: 'wardAdmin',
      email: username,
      ward: wardNumber,
    }).select('+password');

    if (!wardAdmin)
      return res.status(401).json({ success: false, error: 'Ward Admin not found for this ward' });

    const isMatch = await bcrypt.compare(password, wardAdmin.password);
    if (!isMatch)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = generateToken(wardAdmin._id);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: wardAdmin._id,
        name: wardAdmin.name,
        email: wardAdmin.email,
        role: wardAdmin.role,
        ward: wardAdmin.ward,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Google Login
exports.googleLogin = async (req, res, next) => {
  try {
    const { tokenId } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        ward: 'Not specified',
        phone: 'Not specified',
      });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get logged in user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user)
      return res.status(404).json({ success: false, error: 'User not found' });

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
