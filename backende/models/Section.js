import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
  icon: {
    type: String,  
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  subDescriptions: [{
    type: String,
    required: true,
  }],
}, {
  timestamps: true,  
});

const Section = mongoose.model('Section', sectionSchema);

export default Section;
