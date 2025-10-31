import { Router } from 'express';
import passport from '../middleware/auth';

const router = Router();

// Initiate Twitter OAuth
router.get('/twitter', passport.authenticate('twitter'));

// Twitter OAuth callback
router.get('/twitter/callback',
  passport.authenticate('twitter', {
    successRedirect: '/dashboard',
    failureRedirect: '/login'
  })
);

// Check authentication status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: (req.user as any).id,
        username: (req.user as any).username,
        displayName: (req.user as any).display_name,
        profileImage: (req.user as any).profile_image_url
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

export default router;
