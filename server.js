const http = require('http');
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'UP2.txt');

function loadRecords() {
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    let records = JSON.parse(data);
    records = records.map(record => {
      if (!record.id) {
        record.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      }
      return record;
    });
    saveRecords(records); // 保存更新后的记录
    return records;
  } catch (err) {
    console.error('Error loading records:', err.message);
    return [];
  }
}

function saveRecords(records) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(records, null, 2));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    fs.readFile(path.join(__dirname, 'UP.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (req.method === 'GET' && req.url === '/records') {
    const records = loadRecords();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(records));
  } else if (req.method === 'POST' && req.url === '/records') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const newRecord = JSON.parse(body);
      newRecord.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const records = loadRecords();
      records.push(newRecord);
      saveRecords(records);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
  } else if (req.method === 'DELETE' && req.url.startsWith('/records/')) {
    const id = req.url.split('/')[2];
    const records = loadRecords();
    const recordIndex = records.findIndex(r => r.id === id);
    if (recordIndex !== -1) {
      records.splice(recordIndex, 1);
      saveRecords(records);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(404);
      res.end();
    }
  } else if (req.method === 'PUT' && req.url.startsWith('/records/')) {
    const id = req.url.split('/')[2];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const updatedRecord = JSON.parse(body);
      const records = loadRecords();
      const recordIndex = records.findIndex(r => r.id === id);
      if (recordIndex !== -1) {
        records[recordIndex] = updatedRecord;
        saveRecords(records);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});