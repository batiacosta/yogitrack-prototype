exports.listClasses = async (req, res) => {
  try {
    const classes = await Class.find({});
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const fs = require('fs');
const path = require('path');
const Class = require('../models/classModel.cjs');
const classJsonPath = path.join(__dirname, '../data/Class.json');

// new classId -> (Cxxxxx)
async function generateClassId() {
  let maxId = 0;
  const dbClasses = await Class.find({});
  dbClasses.forEach(cls => {
    if (cls.classId && /^C\d+$/.test(cls.classId)) {
      const num = parseInt(cls.classId.slice(1));
      if (num > maxId) maxId = num;
    }
  });
  if (fs.existsSync(classJsonPath)) {
    try {
      const jsonData = JSON.parse(fs.readFileSync(classJsonPath, 'utf8'));
      jsonData.forEach(cls => {
        if (cls.classId && /^C\d+$/.test(cls.classId)) {
          const num = parseInt(cls.classId.slice(1));
          if (num > maxId) maxId = num;
        }
      });
    } catch (e) {}
  }
  return 'C' + String(maxId + 1).padStart(5, '0');
}

// Add Class
exports.addClass = async (req, res) => {
  try {
    const { className, instructorId, classType, description, daytime } = req.body;
    if (!className || !instructorId || !classType || !Array.isArray(daytime) || daytime.length === 0) {
      return res.status(400).json({ message: 'All fields are required and at least one day/time.' });
    }
    for (const dt of daytime) {
      const conflict = await Class.findOne({ 'daytime.day': dt.day, 'daytime.time': dt.time });
      if (conflict) {
        const hour = parseInt(dt.time.split(':')[0]);
        const alternatives = [];
        if (hour > 6) alternatives.push(`${hour - 1}:00`);
        if (hour < 20) alternatives.push(`${hour + 1}:00`);
        return res.status(409).json({ message: 'Schedule conflict found.', alternatives });
      }
    }
    // Generate new classId
    const classId = await generateClassId();
    const newClass = new Class({
      classId,
      className,
      instructorId,
      classType,
      description,
      daytime
    });
    await newClass.save();
    let jsonData = [];
    if (fs.existsSync(classJsonPath)) {
      try {
        jsonData = JSON.parse(fs.readFileSync(classJsonPath, 'utf8'));
      } catch (e) {}
    }
    jsonData.push({
      classId,
      className,
      instructorId,
      classType,
      description,
      daytime
    });
    fs.writeFileSync(classJsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`Class scheduled! Class id: ${classId}. Instructor: ${instructorId}`);
    res.status(201).json({ message: 'Class added successfully.', classId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
