import passport from "passport";
import passportLocal from "passport-local";
import User from "../models/user.js";
import bcrypt from "bcrypt";
const LocalStrategy = passportLocal.Strategy;

const passportConfig = {
  usernameField: "email",
  passwordField: "password",
};

const passportVerify = async (email, password, done) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return done(null, false, {
        message: "failure",
        error: "가입된 이메일이 없습니다",
      });
    }

    const result = await bcrypt.compare(password, user.password);
    if (result) {
      return done(null, user);
    } else {
      return (
        done(null, false),
        {
          message: "failure",
          error: "비밀번호가 올바르지 않습니다",
        }
      );
    }
  } catch (err) {
    console.log(err);
    return document(err);
  }
};

export default () => {
  passport.use("local", new LocalStrategy(passportConfig, passportVerify));
};
