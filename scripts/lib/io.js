// I/O utilities — date handling (Beijing time), file writing, directory creation

import fs from 'fs';
import path from 'path';

/**
 * Get today's date in Beijing time (UTC+8) as YYYY-MM-DD
 */
export function todayDate() {
  const now = new Date();
  // Shift to Beijing time (UTC+8)
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().slice(0, 10);
}

/**
 * Get current ISO timestamp in Beijing time
 */
export function beijingNow() {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString();
}

/**
 * Get date N days ago as YYYY-MM-DD (Beijing time)
 */
export function daysAgoDate(n) {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const past = new Date(beijing.getTime() - n * 24 * 60 * 60 * 1000);
  return past.toISOString().slice(0, 10);
}

/**
 * Ensure a directory exists, creating it recursively if needed
 */
export function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Write JSON file with pretty-printing
 */
export function writeJSON(filepath, data) {
  ensureDir(path.dirname(filepath));
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Read JSON file, return null if not exists
 */
export function readJSON(filepath) {
  if (!fs.existsSync(filepath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * List archive dates available (YYYY-MM-DD filenames)
 */
export function listArchiveDates(archiveDir) {
  if (!fs.existsSync(archiveDir)) return [];
  return fs.readdirSync(archiveDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort()
    .reverse(); // most recent first
}
