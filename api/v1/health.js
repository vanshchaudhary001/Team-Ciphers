module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    version: '1.0.0',
    mode: 'production',
    time: new Date().toISOString()
  });
};
