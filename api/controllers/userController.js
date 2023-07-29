import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const saltRounds = 10;
const secretKey = process.env.JWT_SECRET

const generateToken = (userData) => {
  return jwt.sign({ id: userData.id }, secretKey, { expiresIn: '1d' });
};

export const registerUser = async (req, res) => {
  try {
    const existingUser = await User.findOne({ where: { name: req.body.name } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const newUser = await User.create({
      name: req.body.name,
      password: hashedPassword,
      address: req.body.address,
    });

    if (req.file) {
      await newUser.update({ image: req.file.path });
    }

    const token = generateToken(newUser);

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ where: { name: req.body.name } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const viewProfile = async (req, res) => {
  try {
    const user = req.user;
    const { password, ...userData } = user.toJSON();
    res.status(200).json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = req.user;

    await user.update({
      name: req.body.name || user.name,
      password: req.body.password
        ? await bcrypt.hash(req.body.password, saltRounds)
        : user.password,
      address: req.body.address || user.address,
    });

    if (req.file) {
      await user.update({ image: req.file.path });
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const user = req.user;

    await user.destroy();

    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
