const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/constitution', (req, res) => {
  const filePath = path.join(__dirname, '../../data/constitution_of_india.json');
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Constitution file read error:', err);
      return res.status(500).json({ error: 'Constitution data not found' });
    }
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(data);
  });
});

module.exports = router;
