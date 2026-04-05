/**
 * Local Seeding Script
 * Run this from your terminal to feed posts slowly over time.
 * 
 * Usage: 
 * $env:DARKPOST_ADMIN_SECRET="your_secret_key"
 * npx tsx scripts/seed-feed.ts
 */

const FEED = [
  "I actually like the smell of gasoline. Is that weird? ⛽",
  "I still haven't told my parents I dropped out of my master's program 6 months ago.",
  "Sometimes I go to the cinema alone just to cry in the dark. 🎥🍿",
  "I'm 28 and I still check behind the shower curtain for killers every time I enter the bathroom.",
  "I cheated on a high-stakes exam and now I'm a senior engineer. The guilt is real but the salary is better. 💻",
  "I genuinely hope my ex is doing okay, but I also hope they're slightly less okay than I am.",
  "I lied about being 5'11 on Hinge. I'm actually 5'8. The stress of meeting up is killing me. 📏",
  "I haven't talked to my best friend in 3 years because of a stupid argument about a sandwich.",
  "I pretend to be busy on my phone when I see people I know in public. 📱",
  "3 AM hits different when you realize you're the side character in everyone else's story.",
  "I stole a candy bar when I was 7 and I still think about it when I see a cop car.",
  "I miss the version of me that didn't know how the world worked. 🌍",
  "I'm pretty sure my cat is plotting my downfall. He stares way too much.",
  "I use my neighbor's unlocked Wi-Fi even though I have my own, just for the thrill. 📶",
  "I think I’m addicted to being sad. Like, if I'm happy for too long, I feel like something is wrong.",
  "I have a secret folder of screenshots of people being mean to me. I look at it when I need to get angry.",
  "Most of my 'work from home' days are actually 'nap from home' days. 💤",
  "I still don't know how to do taxes. I just click 'yes' and hope for the best.",
  "I pretend I don't know things just to see if people will lie to me.",
  "My biggest fear is that everyone is just tolerating me and no one actually likes me. 🎭",
  "I have 4,321 unread emails and I plan on keeping it that way.",
  "I’m the person who takes the last piece of pizza without asking. 🍕",
  "I spend more time looking for a movie to watch than actually watching movies.",
  "I actually prefer the middle seat on planes. Said no one ever. ✈️",
  "I talked to myself in the mirror for 20 minutes today. I gave a great TED talk.",
  "I’m convinced that everyone else has a manual for life that I never received. 📖",
  "I sometimes buy things just to talk to the cashier. 🛒",
  "I ghosted someone I really liked because I was scared they'd realize I'm boring.",
  "I haven't washed my favorite hoodie in months because it smells like someone I miss.",
  "I love the sound of rain on a tin roof, but I hate the sound of my own thoughts. 🌧️",
  "I'm terrified that one day someone will see through the 'adult' version of me.",
  "I still listen to the music we used to like just to feel something. 🎵",
  "I lied to my boss about my grandmother passing away just to get a Friday off. She passed away 10 years ago.",
  "I think I’m in love with my roommate’s sibling. This is going to end badly. 💔",
  "I save memes to send to people I don't talk to anymore, then remember I can't send them.",
  "I actually enjoy being stuck in traffic. It's the only time I'm truly alone with no expectations.",
  "I’m convinced that 90% of my personality is just a collection of quotes from movies.",
  "I stole a pen from the bank today. I am a criminal mastermind. ✒️",
  "I feel like I'm wasting my 20s waiting for my 'real' life to start.",
  "I have a secret obsession with bad reality TV. It's my only escape from reality. 📺",
  "I pretend to be a tourist in my own city just to see it differently.",
  "I haven't been truly happy since 2016. I don't know what happened. 🕰️",
  "I'm the person who reads the spoilers before watching the movie.",
  "I think my coworkers think I'm cool, but I'm actually just very quiet and awkward.",
  "I still use my ex’s Netflix account. I think they haven’t realized because I use the ‘Kids’ profile.",
  "I dream about leaving everything behind and starting a quiet life in a small town. 🏡",
  "I'm 25 and I still sleep with a nightlight. The dark is too quiet.",
  "I find it hard to trust people who are 'too nice'. What are you hiding? 🤨",
  "I spend a lot of time imagining conversations that will never actually happen.",
  "I think I'm a good person, but my search history says otherwise.",
  "I really want to go viral, but I'm terrified of the attention. 🌐",
  "I think I’m the villain in someone else’s story and I don’t even know it.",
];

const API_URL = 'https://darkpost.vercel.app/api/admin/seed';
const HOURS = 12;

async function seed() {
  console.log(`🚀 Starting seeding process of ${FEED.length} posts over ${HOURS} hours...`);
  
  if (!process.env.DARKPOST_ADMIN_SECRET) {
    console.error('❌ DARKPOST_ADMIN_SECRET is missing! Run: $env:DARKPOST_ADMIN_SECRET="your_key"');
    return;
  }

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
      const actualWait = intervalMs * (0.8 + Math.random() * 0.4);
      console.log(`💤 Next post in ${Math.round(actualWait / 1000 / 60)} minutes...`);
      await new Promise(resolve => setTimeout(resolve, actualWait));
    }
  }
  
  console.log('🏆 Seeding complete!');
}

seed();
