const axios = require('axios');
const cheerio = require('cheerio');
const supabase = require('../utils/supabaseClient');
require('dotenv').config();

// Mock social media data structure
const MOCK_SOCIAL_DATA = {
  twitter: {
    url: 'https://twitter.com/search?q=disaster%20OR%20emergency%20OR%20crisis&src=typed_query',
    selector: 'article[data-testid="tweet"]',
    fields: {
      text: '.tweet-text',
      user: '.username',
      timestamp: '.time',
      likes: '.like-count'
    }
  },
  bluesky: {
    url: 'https://bsky.app/search?q=disaster%20OR%20emergency%20OR%20crisis',
    selector: '.post',
    fields: {
      text: '.post-content',
      user: '.user-handle',
      timestamp: '.post-time',
      likes: '.reactions'
    }
  }
};

async function scrapeSocialMedia(platform, searchTerm) {
  try {
    const { url, selector, fields } = MOCK_SOCIAL_DATA[platform];
    
    // For now, we'll use mock data since we don't have real API keys
    const mockPosts = [
      {
        platform,
        post_id: `mock_${Date.now()}`,
        content: `Disaster reported in ${searchTerm}. Urgent assistance needed!`,
        media_url: 'https://example.com/disaster.jpg',
        user: 'MockUser123',
        timestamp: new Date().toISOString(),
        likes: Math.floor(Math.random() * 1000)
      },
      {
        platform,
        post_id: `mock_${Date.now() + 1}`,
        content: `Emergency situation in ${searchTerm}. Please share and help spread awareness.`,
        media_url: 'https://example.com/emergency.jpg',
        user: 'MockUser456',
        timestamp: new Date().toISOString(),
        likes: Math.floor(Math.random() * 1000)
      }
    ];

    // Store in Supabase cache
    const { error } = await supabase
      .from('social_media_updates')
      .upsert(mockPosts);

    if (error) throw error;
    
    return mockPosts;
  } catch (error) {
    console.error(`Error scraping ${platform}:`, error);
    throw error;
  }
}

async function verifySocialMediaPost(postId) {
  try {
    const { data: post } = await supabase
      .from('social_media_updates')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (!post) {
      throw new Error('Post not found');
    }

    // Use Gemini to verify the post
    const { verifyDisasterReport } = require('./geminiService');
    const analysis = await verifyDisasterReport(post.content);

    // Update verification status
    const { error } = await supabase
      .from('social_media_updates')
      .update({
        verification_status: analysis.score > 0.7 ? 'verified' : 'suspicious',
        sentiment_score: analysis.score
      })
      .eq('post_id', postId);

    if (error) throw error;
    
    return {
      ...post,
      verification: {
        status: analysis.score > 0.7 ? 'verified' : 'suspicious',
        score: analysis.score,
        flags: analysis.flags
      }
    };
  } catch (error) {
    console.error('Error verifying social media post:', error);
    throw error;
  }
}

async function getDisasterUpdates(disasterId) {
  try {
    const { data: updates } = await supabase
      .from('social_media_updates')
      .select('*')
      .eq('disaster_id', disasterId)
      .order('created_at', { ascending: false });

    return updates;
  } catch (error) {
    console.error('Error getting disaster updates:', error);
    throw error;
  }
}

module.exports = {
  scrapeSocialMedia,
  verifySocialMediaPost,
  getDisasterUpdates
};
