const path = require('path');
const fs = require('fs');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const datasetsPath = path.join(process.cwd(), 'client', 'datasets.json');
    if (fs.existsSync(datasetsPath)) {
      const data = JSON.parse(fs.readFileSync(datasetsPath, 'utf8'));
      return res.status(200).json({
        success: true,
        count: (data.contacts || []).length,
        contacts: data.contacts || []
      });
    }
    return res.status(200).json({ success: true, count: 0, contacts: [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
