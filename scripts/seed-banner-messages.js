// Seed script to populate banner messages collection
// Usage: node scripts/seed-banner-messages.js

const { MongoClient } = require('mongodb');

const bannerMessages = [
  {
    text: "FREE SHIPPING ON ORDERS OVER ₹999",
    icon: "🚚",
    isActive: true,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    text: "SUMMER SALE - UP TO 50% OFF",
    icon: "🔥",
    isActive: true,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    text: "NEW ARRIVALS EVERY WEEK",
    icon: "✨",
    isActive: true,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    text: "EASY RETURNS & EXCHANGES",
    icon: "🔄",
    isActive: true,
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    text: "PREMIUM QUALITY GUARANTEED",
    icon: "⭐",
    isActive: true,
    order: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    text: "24/7 CUSTOMER SUPPORT",
    icon: "💬",
    isActive: true,
    order: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    text: "SECURE PAYMENT GATEWAY",
    icon: "🔒",
    isActive: true,
    order: 7,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    text: "FAST DELIVERY ACROSS INDIA",
    icon: "⚡",
    isActive: true,
    order: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedBannerMessages() {
  // Load environment variables from .env.local
  require('dotenv').config({ path: '.env.local' });
  
  const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/haston-ecommerce';
  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    console.log('Using MongoDB URI:', mongoUrl.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');

    const db = client.db("hex");
    const collection = db.collection('bannerMessages');

    // Clear existing messages
    await collection.deleteMany({});
    console.log('Cleared existing banner messages');

    // Insert new messages
    const result = await collection.insertMany(bannerMessages);
    console.log(`Successfully inserted ${result.insertedCount} banner messages`);

    // Display results
    const insertedMessages = await collection.find({}).sort({ order: 1 }).toArray();
    console.log('\nInserted banner messages:');
    insertedMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.icon}] ${msg.text} - Order: ${msg.order}, Active: ${msg.isActive}`);
    });

  } catch (error) {
    console.error('Error seeding banner messages:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  seedBannerMessages();
}

module.exports = { seedBannerMessages, bannerMessages };
