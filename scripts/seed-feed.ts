/**
 * Local Seeding Script
 * Run this from your terminal to feed posts slowly over time.
 * 
 * Usage: 
 * export ADMIN_SECRET="your_secret_key"
 * npx tsx scripts/seed-feed.ts
 */

const FEED = [
  "Wait, why am I still awake? 🌙",
  "Just saw someone doing something weird at the park.",
  "I have a secret: I actually like Pineapples on Pizza. 🍍🍕",
  // ... more will be added from the user's list
];

const API_URL = 'https://darkpost.vercel.app/api/admin/seed'; // Update this to your live URL
const HOURS = 12;

async function seed() {
  console.log(`🚀 Starting seeding process of ${FEED.length} posts over ${HOURS} hours...`);
  
  const intervalMs = (HOURS * 60 * 60 * 1000) / FEED.length;
  
  for (let i = 0; i < FEED.length; i++) {
    const post = FEED[i];
    console.log(`[${i+1}/${FEED.length}] Posting: "${post.substring(0, 30)}..."`);
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.DARKPOST_ADMIN_SECRET || '',
        },
        body: JSON.stringify({ items: [post] }),
      });
      
      if (!res.ok) {
        console.error(`❌ Failed to post: ${await res.text()}`);
      } else {
        console.log(`✅ Success!`);
      }
    } catch (err) {
      console.error(`❌ Network error:`, err);
    }

    if (i < FEED.length - 1) {
      // Randomize the wait a bit to make it look natural
      const actualWait = intervalMs * (0.8 + Math.random() * 0.4);
      console.log(`💤 Waiting ${Math.round(actualWait / 1000 / 60)} minutes for next post...`);
      await new Promise(resolve => setTimeout(resolve, actualWait));
    }
  }
  
  console.log('🏆 Seeding complete!');
}

seed();
