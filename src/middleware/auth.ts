import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { UserModel } from '../models/User';
import { User } from '../types';

// Passport session serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Twitter OAuth strategy
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY!,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET!,
    callbackURL: process.env.TWITTER_CALLBACK_URL!
  },
  async (accessToken: string, accessTokenSecret: string, profile: any, done: any) => {
    try {
      // Check if user exists
      let user = await UserModel.findByTwitterId(profile.id);

      if (user) {
        // Update tokens
        await UserModel.updateTokens(user.id, accessToken, accessTokenSecret);
        user = await UserModel.findByTwitterId(profile.id);
      } else {
        // Create new user
        user = await UserModel.create({
          twitter_id: profile.id,
          username: profile.username,
          display_name: profile.displayName,
          profile_image_url: profile.photos?.[0]?.value,
          access_token: accessToken,
          access_token_secret: accessTokenSecret,
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Middleware to check if user is authenticated
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

export default passport;
