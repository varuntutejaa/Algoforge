const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log(err);
});

// signup
app.post("/signup", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        res.json({
            success: true,
            message: "Signup successful"
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Server error"
        });

    }

});

// login
app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        // find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // compare passwords
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Invalid password"
            });
        }

        res.json({
            success: true,
            message: "Login successful"
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Server error"
        });

    }

});

app.listen(8000, () => {
    console.log("Server running on 8000");
});