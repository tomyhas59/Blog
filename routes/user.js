const express = require("express");
const router = express.Router();
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const UserService = require("../service/user");

router.post("/signup", isNotLoggedIn, UserService.signUp);
router.post("/login", isNotLoggedIn, UserService.logIn);
router.get("/", UserService.main);
router.post("/logout", UserService.logOut);

module.exports = router;
