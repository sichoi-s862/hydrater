import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { UserModel } from '../models/User';

const router = Router();

// Get user profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await UserModel.findById((req.user as any).id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      profileImage: user.profile_image_url,
      interests: user.interests,
      brandDirection: user.brand_direction,
      authorStyle: user.author_style,
      targetAudience: user.target_audience,
      tone: user.tone
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const { interests, brandDirection, authorStyle, targetAudience, tone } = req.body;

    const updatedUser = await UserModel.updateProfile((req.user as any).id, {
      interests,
      brand_direction: brandDirection,
      author_style: authorStyle,
      target_audience: targetAudience,
      tone
    });

    res.json({
      success: true,
      profile: {
        interests: updatedUser.interests,
        brandDirection: updatedUser.brand_direction,
        authorStyle: updatedUser.author_style,
        targetAudience: updatedUser.target_audience,
        tone: updatedUser.tone
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
