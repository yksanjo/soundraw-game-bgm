#!/usr/bin/env node
import 'dotenv/config';
import { runServer } from './server.js';

runServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
