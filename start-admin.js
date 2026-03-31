#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting Decap CMS Admin...\n');

// Start decap-server
console.log('📦 Starting Decap CMS backend server...');
const decapServer = spawn('npx', ['decap-server'], {
  shell: true,
  cwd: process.cwd()
});

decapServer.stdout.on('data', (data) => {
  console.log(`[Decap Server] ${data.toString().trim()}`);
});

decapServer.stderr.on('data', (data) => {
  console.error(`[Decap Server Error] ${data.toString().trim()}`);
});

// Wait for decap-server to be ready
function checkServer(retries = 10) {
  if (retries === 0) {
    console.error('❌ Decap server failed to start after 10 retries');
    process.exit(1);
  }

  setTimeout(() => {
    http.get('http://localhost:8081/api/v1', (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('✅ Decap server is ready!\n');
        console.log('🌐 Admin Panel: http://localhost:3333/admin');
        console.log('   Click "Work with Local Git Repository"\n');
      } else {
        console.log(`⏳ Waiting for Decap server... (${11 - retries}/10)`);
        checkServer(retries - 1);
      }
    }).on('error', () => {
      console.log(`⏳ Waiting for Decap server... (${11 - retries}/10)`);
      checkServer(retries - 1);
    });
  }, 2000);
}

checkServer();

// Handle exit
process.on('SIGINT', () => {
  console.log('\n👋 Stopping Decap server...');
  decapServer.kill();
  process.exit(0);
});
