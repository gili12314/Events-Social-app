import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails?.[0].value });

        if (!user) {
          const usernameFallback =
            profile.displayName ||
            (profile.emails && profile.emails[0].value.split("@")[0]) ||
            "GoogleUser";
          user = new User({
            username: usernameFallback,
            email: profile.emails?.[0].value,
            profileImage: (profile.photos && profile.photos.length > 0) ? profile.photos[0].value : ""
          });
          await user.save();
        }

        done(null, user);
      } catch (error) {
        done(error, undefined);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as any)._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || undefined);
  } catch (error) {
    done(error, undefined);
  }
});
