/* ========================================
   Bible Loader - Handles full Bible JSON files
   ======================================== */

// Bible data cache
let bibleData = {};

// Translation configuration - add more translations here
const TRANSLATIONS = {
  'KJV': { filename: 'kjv.json', name: 'King James Version' },
  'WEB': { filename: 'web.json', name: 'World English Bible' },
  'ASV': { filename: 'asv.json', name: 'American Standard Version' },
  'BBE': { filename: 'bbe.json', name: 'Bible in Basic English' }
};

// Load a full Bible translation
async function loadBibleTranslation(translation) {
  if (bibleData[translation]) {
    return bibleData[translation];
  }
  
  const config = TRANSLATIONS[translation];
  if (!config) {
    console.error(`Unknown translation: ${translation}`);
    return null;
  }
  
  try {
    const response = await fetch(config.filename);
    const data = await response.json();
    bibleData[translation] = data;
    return data;
  } catch (err) {
    console.error(`Failed to load ${translation}:`, err);
    return null;
  }
}

// Get all available translations
function getAvailableTranslations() {
  return Object.keys(TRANSLATIONS);
}

// Book name mapping (full name to abbrev from the JSON files)
const bookNames = {
  // Old Testament
  'Genesis': 'gn', 'Exodus': 'ex', 'Leviticus': 'lv', 'Numbers': 'nm', 'Deuteronomy': 'dt',
  'Joshua': 'js', 'Judges': 'jud', 'Ruth': 'rt', '1 Samuel': '1sm', '2 Samuel': '2sm',
  '1 Kings': '1kgs', '2 Kings': '2kgs', '1 Chronicles': '1ch', '2 Chronicles': '2ch',
  'Ezra': 'ezr', 'Nehemiah': 'ne', 'Esther': 'et', 'Job': 'job', 'Psalms': 'ps',
  'Proverbs': 'prv', 'Ecclesiastes': 'eccl', 'Song of Solomon': 'sng', 'Isaiah': 'is',
  'Jeremiah': 'jer', 'Lamentations': 'lam', 'Ezekiel': 'ez', 'Daniel': 'dn',
  'Hosea': 'hs', 'Joel': 'jl', 'Amos': 'am', 'Obadiah': 'ob', 'Jonah': 'jnh',
  'Micah': 'mi', 'Nahum': 'na', 'Habakkuk': 'hb', 'Zephaniah': 'zep', 'Haggai': 'hg',
  'Zechariah': 'zec', 'Malachi': 'mal',
  // New Testament  
  'Matthew': 'mt', 'Mark': 'mrk', 'Luke': 'lk', 'John': 'jn', 'Acts': 'act',
  'Romans': 'rom', '1 Corinthians': '1cor', '2 Corinthians': '2cor', 'Galatians': 'gal',
  'Ephesians': 'eph', 'Philippians': 'php', 'Colossians': 'col', '1 Thessalonians': '1th',
  '2 Thessalonians': '2th', '1 Timothy': '1ti', '2 Timothy': '2ti', 'Titus': 'ti',
  'Philemon': 'phm', 'Hebrews': 'heb', 'James': 'jas', '1 Peter': '1pe', '2 Peter': '2pe',
  '1 John': '1jn', '2 John': '2jn', '3 John': '3jn', 'Jude': 'jud', 'Revelation': 'rv'
};

// Get book by name or abbreviation
function findBook(bible, bookNameOrAbbrev) {
  if (!bible) return null;
  
  // Try direct name match first
  let book = bible.find(b => b.name === bookNameOrAbbrev);
  if (book) return book;
  
  // Try abbreviation
  const abbrev = bookNames[bookNameOrAbbrev] || bookNameOrAbbrev.toLowerCase();
  book = bible.find(b => b.abbrev === abbrev);
  return book;
}

// Popular passage selections for quick access
const popularPassages = [
  { name: 'Psalm 23', book: 'Psalms', chapter: 22, verses: null }, // chapter 23, but 0-indexed
  { name: 'John 1:1-14', book: 'John', chapter: 0, verses: [0, 13] },
  { name: 'Genesis 1:1-5', book: 'Genesis', chapter: 0, verses: [0, 4] },
  { name: 'Matthew 5:3-10', book: 'Matthew', chapter: 4, verses: [2, 9] },
  { name: '1 Corinthians 13:4-8', book: '1 Corinthians', chapter: 12, verses: [3, 7] },
  { name: 'Romans 8:28-39', book: 'Romans', chapter: 7, verses: [27, 38] },
  { name: 'Philippians 4:4-13', book: 'Philippians', chapter: 3, verses: [3, 12] },
  { name: 'Proverbs 3:5-6', book: 'Proverbs', chapter: 2, verses: [4, 5] },
  { name: 'Isaiah 40:28-31', book: 'Isaiah', chapter: 39, verses: [27, 30] },
  { name: 'Psalm 91', book: 'Psalms', chapter: 90, verses: null },
  { name: 'John 3:16-21', book: 'John', chapter: 2, verses: [15, 20] },
  { name: 'Matthew 6:25-34', book: 'Matthew', chapter: 5, verses: [24, 33] }
];

// Get passage text
function getPassageText(bible, passageInfo) {
  const book = findBook(bible, passageInfo.book);
  if (!book || !book.chapters[passageInfo.chapter]) {
    return '';
  }
  
  const chapter = book.chapters[passageInfo.chapter];
  
  if (passageInfo.verses) {
    // Get specific verse range
    const [start, end] = passageInfo.verses;
    return chapter.slice(start, end + 1).join(' ');
  } else {
    // Get whole chapter
    return chapter.join(' ');
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadBibleTranslation,
    popularPassages,
    getPassageText,
    findBook
  };
}

