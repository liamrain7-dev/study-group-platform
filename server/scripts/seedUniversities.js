const mongoose = require('mongoose');
const University = require('../models/University');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read universities from JSON file
const universitiesPath = path.join(__dirname, '../data/universities.json');
const universities = JSON.parse(fs.readFileSync(universitiesPath, 'utf8'));

const seedUniversities = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-groups';
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing universities (optional - comment out if you want to keep existing ones)
    // await University.deleteMany({});

    // Insert universities
    for (const uni of universities) {
      const existing = await University.findOne({ 
        $or: [
          { name: uni.name },
          { code: uni.code }
        ]
      });

      if (!existing) {
        await University.create(uni);
        console.log(`Created: ${uni.name}`);
      } else {
        console.log(`Skipped (already exists): ${uni.name}`);
      }
    }

    console.log('\n✅ Universities seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding universities:', error);
    process.exit(1);
  }
};

seedUniversities();

