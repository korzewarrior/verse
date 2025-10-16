/* ========================================
   The Tiny Scroll — Main Script
   ======================================== */

// Utility selectors
const qs = sel => document.querySelector(sel);
const qsa = sel => document.querySelectorAll(sel);

// DOM Elements
const scrollContainer = qs('#scrollContainer');
const versesContainer = qs('#verses');
const live = qs('#live');
const loadingMessage = qs('#loadingMessage');
const translationSelect = qs('#translation');
const bookSelect = qs('#book');
const chapterSelect = qs('#chapter');
const themeBtn = qs('#themeBtn');
const themeIcon = qs('#themeIcon');
const fontBtn = qs('#fontBtn');
const infoBtn = qs('#infoBtn');
const infoDialog = qs('#info');
const closeInfoBtn = qs('#closeInfo');
const audioToggle = qs('#audioToggle');
const verseJumpModal = qs('#verseJumpModal');
const verseJumpInput = qs('#verseJumpInput');
const verseJumpSuggestions = qs('#verseJumpSuggestions');
const focusNotification = qs('#focusModeNotification');
const copyNotification = qs('#copyNotification');
const continuePrompt = qs('#continuePrompt');
const continueYes = qs('#continueYes');
const continueNo = qs('#continueNo');
const continueText = qs('#continueText');
const chapterIndicator = qs('#chapterIndicator');
const menuBtn = qs('#menuBtn');
const controlsFooter = qs('.controls');

// State
let state = {
  bible: null,
  currentTranslation: 'KJV',
  verses: [],
  currentVerseIndex: 0,
  currentBookIndex: 0,
  currentChapterIndex: 0,
  audioEnabled: false,
  audioContext: null,
  isScrollingProgrammatically: false,
  focusMode: false,
  fontSize: 100, // percentage
  useSerifFont: false,
  touchStartX: 0,
  touchStartY: 0,
  selectedSuggestionIndex: -1
};

// ==== TWEAK POINT 1: Typography ====
const FONT_SIZE = 'clamp(18px, 4vw, 28px)';
const LINE_HEIGHT = 1.6;

// ==== TWEAK POINT 2: Spring Physics ====
const SPRING_STIFFNESS = 300;
const SPRING_DAMPING = 28;
const SPRING_MASS = 1;

// ==== TWEAK POINT 3: Overscroll ====
const OVERSCROLL_FACTOR = 0.6;


// ==== Theme Management ====
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    themeIcon.src = 'assets/icon-sun.svg';
    themeBtn.setAttribute('aria-pressed', 'true');
  } else {
    document.body.classList.remove('dark');
    themeIcon.src = 'assets/icon-moon.svg';
    themeBtn.setAttribute('aria-pressed', 'false');
  }
  localStorage.setItem('theme', theme);
}

function getCurrentTheme() {
  const urlTheme = getQuery('theme');
  if (urlTheme === 'dark' || urlTheme === 'light') return urlTheme;
  
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) return storedTheme;
  
  return getSystemTheme();
}

// ==== URL Query Helpers ====
function getQuery(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function updateURL() {
  const params = new URLSearchParams();
  params.set('t', state.currentTranslation);
  params.set('v', state.currentVerseIndex);
  
  const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
  params.set('theme', theme);
  
  const newURL = `${window.location.pathname}?${params.toString()}`;
  history.replaceState(null, '', newURL);
}

// ==== Bible Loading ====
function loadPassage() {
  if (!state.bible) {
    versesContainer.innerHTML = '<div class="verse">Loading...</div>';
    return;
  }
  
  // Load ALL books and chapters from the Bible
  state.verses = [];
  
  state.bible.forEach((book, bookIdx) => {
    book.chapters.forEach((chapter, chapterIdx) => {
      // Add chapter heading
      state.verses.push({
        type: 'chapter-heading',
        bookName: book.name,
        bookIndex: bookIdx,
        chapterNumber: chapterIdx + 1,
        chapterIndex: chapterIdx,
        text: `${book.name} ${chapterIdx + 1}`
      });
      
      // Add all verses in this chapter
      chapter.forEach((verseText, verseIdx) => {
        state.verses.push({
          type: 'verse',
          bookName: book.name,
          bookIndex: bookIdx,
          chapterNumber: chapterIdx + 1,
          chapterIndex: chapterIdx,
          verseNumber: verseIdx + 1,
          text: verseText
        });
      });
    });
  });
  
  console.log(`Loaded ${state.verses.length} items from entire Bible (${state.bible.length} books)`);
  renderVerses();
  populateBookSelector();
  
  // Scroll to bookmarked position or start
  const urlVerse = parseInt(getQuery('v')) || 0;
  scrollToVerse(Math.min(urlVerse, state.verses.length - 1));
  
  localStorage.setItem('translation', state.currentTranslation);
}

function populateBookSelector() {
  bookSelect.innerHTML = '';
  
  state.bible.forEach((book, idx) => {
    const option = document.createElement('option');
    option.value = idx;
    option.textContent = book.name;
    bookSelect.appendChild(option);
  });
  
  bookSelect.value = state.currentBookIndex;
  populateChapterSelector();
}

function populateChapterSelector() {
  chapterSelect.innerHTML = '';
  
  const book = state.bible[state.currentBookIndex];
  if (!book) return;
  
  book.chapters.forEach((chapter, idx) => {
    const option = document.createElement('option');
    option.value = idx;
    option.textContent = `Chapter ${idx + 1}`;
    chapterSelect.appendChild(option);
  });
  
  chapterSelect.value = state.currentChapterIndex;
}

function jumpToBookChapter(bookIdx, chapterIdx) {
  // Find the index of the chapter heading for this book/chapter
  const targetIndex = state.verses.findIndex(v => 
    v.type === 'chapter-heading' && 
    v.bookIndex === bookIdx && 
    v.chapterIndex === chapterIdx
  );
  
  if (targetIndex !== -1) {
    state.isScrollingProgrammatically = true;
    scrollToVerse(targetIndex);
    setTimeout(() => {
      state.isScrollingProgrammatically = false;
    }, 500);
  }
}

function renderVerses() {
  versesContainer.innerHTML = state.verses.map((verse, idx) => {
    if (verse.type === 'chapter-heading') {
      return `
        <div class="chapter-heading" data-verse="${idx}">
          ${verse.text}
        </div>
      `;
    } else {
      return `
        <div class="verse" data-verse="${idx}">
          <span class="verse-number">${verse.verseNumber}</span>${verse.text}
        </div>
      `;
    }
  }).join('');
}

function scrollToVerse(index) {
  const allElements = qsa('.verse, .chapter-heading');
  if (allElements[index]) {
    const container = scrollContainer;
    const element = allElements[index];
    const containerHeight = container.clientHeight;
    const elementTop = element.offsetTop;
    const elementHeight = element.clientHeight;
    
    // Scroll so element is centered
    container.scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
    state.currentVerseIndex = index;
    updateURL();
  }
}

// ==== Scroll Handling ====
let scrollTimeout;
let snapTimeout;

function onScroll() {
  // Update current verse in real-time
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    updateCurrentVerse();
  }, 50);
  
  // Magnetic snap after scrolling stops
  clearTimeout(snapTimeout);
  snapTimeout = setTimeout(() => {
    if (!state.isScrollingProgrammatically) {
      snapToNearestVerse();
    }
  }, 150);
}

function updateCurrentVerse() {
  const container = scrollContainer;
  const containerCenter = container.scrollTop + (container.clientHeight / 2);
  
  const allElements = qsa('.verse, .chapter-heading');
  let closestIndex = 0;
  let closestDistance = Infinity;
  
  allElements.forEach((element, idx) => {
    const elementCenter = element.offsetTop + (element.clientHeight / 2);
    const distance = Math.abs(containerCenter - elementCenter);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = idx;
    }
  });
  
  if (state.currentVerseIndex !== closestIndex) {
    state.currentVerseIndex = closestIndex;
    
    // Update book/chapter selectors
    const currentItem = state.verses[closestIndex];
    if (currentItem) {
      if (state.currentBookIndex !== currentItem.bookIndex) {
        state.currentBookIndex = currentItem.bookIndex;
        bookSelect.value = state.currentBookIndex;
        populateChapterSelector();
      }
      if (state.currentChapterIndex !== currentItem.chapterIndex) {
        state.currentChapterIndex = currentItem.chapterIndex;
        chapterSelect.value = state.currentChapterIndex;
      }
    }
    
    updateLive();
    updateURL();
    highlightCenteredVerse();
    updateChapterIndicator();
    saveReadingPosition();
  }
}

function snapToNearestVerse() {
  const container = scrollContainer;
  const containerCenter = container.scrollTop + (container.clientHeight / 2);
  
  const allElements = qsa('.verse, .chapter-heading');
  let closestElement = null;
  let closestDistance = Infinity;
  
  allElements.forEach(element => {
    const elementCenter = element.offsetTop + (element.clientHeight / 2);
    const distance = Math.abs(containerCenter - elementCenter);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestElement = element;
    }
  });
  
  if (closestElement && closestDistance > 5) {
    const targetScroll = closestElement.offsetTop - (container.clientHeight / 2) + (closestElement.clientHeight / 2);
    
    // Smooth snap animation
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }
}

// ==== Audio (Tick Sound) ====
function initAudio() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTick() {
  if (!state.audioEnabled || !state.audioContext) return;
  
  const ctx = state.audioContext;
  const now = ctx.currentTime;
  
  // Create a very short, quiet tick
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.frequency.value = 1200;
  osc.type = 'sine';
  
  gain.gain.setValueAtTime(0.015, now); // Very quiet
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
  
  osc.start(now);
  osc.stop(now + 0.02);
}

// ==== Keyboard Navigation ====
function onKeyDown(e) {
  // Handle verse jump modal separately
  if (verseJumpModal.style.display === 'block') {
    if (e.key === 'Escape') {
      closeVerseJump();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      // Select first suggestion
      const firstMatch = qsa('.suggestion-item')[0];
      if (firstMatch) firstMatch.click();
      e.preventDefault();
    }
    return;
  }
  
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  
  let handled = false;
  
  // New keyboard shortcuts
  if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
    openVerseJump();
    handled = true;
  } else if (e.key === 'f' || e.key === 'F' || e.key === ' ') {
    toggleFocusMode();
    handled = true;
  } else if (e.key === 'Escape' && state.focusMode) {
    toggleFocusMode();
    handled = true;
  } else if (e.key === 'c' || e.key === 'C') {
    copyCurrentVerse();
    handled = true;
  } else if (e.key === '=' || e.key === '+') {
    adjustFontSize(10);
    handled = true;
  } else if (e.key === '-' || e.key === '_') {
    adjustFontSize(-10);
    handled = true;
  }
  
  // Navigation keys
  switch(e.key) {
    case 'ArrowDown':
      scrollToVerse(Math.min(state.currentVerseIndex + 1, state.verses.length - 1));
      handled = true;
      break;
    case 'ArrowUp':
      scrollToVerse(Math.max(state.currentVerseIndex - 1, 0));
      handled = true;
      break;
    case 'PageDown':
      scrollToVerse(Math.min(state.currentVerseIndex + 5, state.verses.length - 1));
      handled = true;
      break;
    case 'PageUp':
      scrollToVerse(Math.max(state.currentVerseIndex - 5, 0));
      handled = true;
      break;
    case 'Home':
      scrollToVerse(0);
      handled = true;
      break;
    case 'End':
      scrollToVerse(state.verses.length - 1);
      handled = true;
      break;
  }
  
  if (handled) {
    e.preventDefault();
    if (!state.focusMode) scrollContainer.focus();
  }
}

// ==== Accessibility ====
function updateLive() {
  if (state.verses.length === 0) return;
  
  const item = state.verses[state.currentVerseIndex];
  if (!item) return;
  
  let announcement;
  if (item.type === 'chapter-heading') {
    announcement = `${item.bookName}, Chapter ${item.chapterNumber}`;
  } else {
    announcement = `${item.bookName} ${item.chapterNumber}:${item.verseNumber} - ${item.text}`;
  }
  
  live.textContent = announcement;
}

// ==== NEW FEATURES ====

// 1. Highlight Centered Verse
function highlightCenteredVerse() {
  // Remove old highlight
  const oldCentered = qs('.verse.centered');
  if (oldCentered) {
    oldCentered.classList.remove('centered');
  }
  
  // Add new highlight to currently centered element if it's a verse
  const allElements = qsa('.verse, .chapter-heading');
  const currentElement = allElements[state.currentVerseIndex];
  if (currentElement && currentElement.classList.contains('verse')) {
    currentElement.classList.add('centered');
  }
}

// 2. Update Chapter Indicator
function updateChapterIndicator() {
  const item = state.verses[state.currentVerseIndex];
  if (item && chapterIndicator) {
    chapterIndicator.textContent = `📖 ${item.bookName} ${item.chapterNumber}`;
    chapterIndicator.style.opacity = '1';
  }
}

// 3. Focus Mode
function toggleFocusMode() {
  state.focusMode = !state.focusMode;
  document.body.classList.toggle('focus-mode', state.focusMode);
  
  if (state.focusMode) {
    focusNotification.style.display = 'block';
    setTimeout(() => {
      focusNotification.style.opacity = '0';
      setTimeout(() => {
        if (state.focusMode) focusNotification.style.display = 'none';
        focusNotification.style.opacity = '1';
      }, 300);
    }, 2000);
  }
}

// 4. Copy Current Verse
function copyCurrentVerse() {
  const item = state.verses[state.currentVerseIndex];
  if (!item || item.type === 'chapter-heading') return;
  
  const reference = `${item.bookName} ${item.chapterNumber}:${item.verseNumber}`;
  const text = `${reference} - ${item.text}`;
  
  navigator.clipboard.writeText(text).then(() => {
    copyNotification.textContent = `✓ Copied: ${reference}`;
    copyNotification.style.display = 'block';
    setTimeout(() => {
      copyNotification.style.display = 'none';
    }, 2000);
  });
}

// 5. Font Size Control
function adjustFontSize(delta) {
  state.fontSize = Math.max(70, Math.min(150, state.fontSize + delta));
  document.documentElement.style.setProperty('--fontSize', `clamp(${18 * state.fontSize / 100}px, 4vw, ${28 * state.fontSize / 100}px)`);
  localStorage.setItem('fontSize', state.fontSize);
}

// 6. Toggle Serif Font
function toggleSerifFont() {
  state.useSerifFont = !state.useSerifFont;
  document.body.classList.toggle('serif-font', state.useSerifFont);
  localStorage.setItem('useSerifFont', state.useSerifFont);
}

// 7. Quick Verse Jump
function openVerseJump() {
  verseJumpModal.style.display = 'block';
  verseJumpInput.value = '';
  verseJumpInput.focus();
  state.selectedSuggestionIndex = -1;
  updateVerseSuggestions('');
}

function closeVerseJump() {
  verseJumpModal.style.display = 'none';
  verseJumpInput.value = '';
  verseJumpSuggestions.innerHTML = '';
}

function updateVerseSuggestions(query) {
  if (!query.trim()) {
    verseJumpSuggestions.innerHTML = '<div class="suggestion-item">Type to search (e.g., "John 3:16" or "Psalm 23")</div>';
    return;
  }
  
  const lowerQuery = query.toLowerCase();
  const matches = [];
  
  // Search for book names
  state.bible.forEach((book, bookIdx) => {
    if (book.name.toLowerCase().includes(lowerQuery)) {
      matches.push({
        type: 'book',
        bookIdx,
        bookName: book.name,
        display: book.name
      });
    }
  });
  
  // Parse for book + chapter pattern (e.g., "John 3" or "Psalm 23")
  const bookChapterMatch = query.match(/^([a-z\s]+)\s*(\d+)/i);
  if (bookChapterMatch) {
    const bookName = bookChapterMatch[1].trim();
    const chapterNum = parseInt(bookChapterMatch[2]);
    
    state.bible.forEach((book, bookIdx) => {
      if (book.name.toLowerCase().includes(bookName.toLowerCase())) {
        if (book.chapters[chapterNum - 1]) {
          matches.push({
            type: 'chapter',
            bookIdx,
            chapterIdx: chapterNum - 1,
            bookName: book.name,
            chapterNum,
            display: `${book.name} ${chapterNum}`
          });
        }
      }
    });
  }
  
  if (matches.length === 0) {
    verseJumpSuggestions.innerHTML = '<div class="suggestion-item">No matches found</div>';
    return;
  }
  
  verseJumpSuggestions.innerHTML = matches.slice(0, 10).map((match, idx) => `
    <div class="suggestion-item ${idx === state.selectedSuggestionIndex ? 'selected' : ''}" data-index="${idx}">
      <strong>${match.display}</strong>
    </div>
  `).join('');
  
  // Add click handlers
  qsa('.suggestion-item').forEach((item, idx) => {
    item.addEventListener('click', () => selectSuggestion(matches[idx]));
  });
}

function selectSuggestion(match) {
  if (match.type === 'chapter') {
    jumpToBookChapter(match.bookIdx, match.chapterIdx);
  } else if (match.type === 'book') {
    jumpToBookChapter(match.bookIdx, 0);
  }
  closeVerseJump();
}

// 8. Reading Position Memory
function saveReadingPosition() {
  const item = state.verses[state.currentVerseIndex];
  if (item) {
    localStorage.setItem('lastReadingPosition', JSON.stringify({
      translation: state.currentTranslation,
      bookName: item.bookName,
      chapter: item.chapterNumber,
      verse: item.verseNumber,
      index: state.currentVerseIndex,
      timestamp: Date.now()
    }));
  }
}

function checkContinueReading() {
  const saved = localStorage.getItem('lastReadingPosition');
  if (!saved) return;
  
  try {
    const position = JSON.parse(saved);
    // Only show if less than 7 days old
    if (Date.now() - position.timestamp < 7 * 24 * 60 * 60 * 1000) {
      continueText.textContent = `${position.bookName} ${position.chapter}:${position.verse}`;
      continuePrompt.style.display = 'block';
      
      continueYes.onclick = () => {
        scrollToVerse(position.index);
        continuePrompt.style.display = 'none';
      };
      
      continueNo.onclick = () => {
        localStorage.removeItem('lastReadingPosition');
        continuePrompt.style.display = 'none';
      };
    }
  } catch (e) {
    console.error('Failed to parse saved position', e);
  }
}

// 9. Touch Gestures for Mobile
function initTouchGestures() {
  scrollContainer.addEventListener('touchstart', (e) => {
    state.touchStartX = e.touches[0].clientX;
    state.touchStartY = e.touches[0].clientY;
  }, { passive: true });
  
  scrollContainer.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - state.touchStartX;
    const deltaY = touchEndY - state.touchStartY;
    
    // If horizontal swipe is dominant (and significant)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
      if (deltaX > 0) {
        // Swipe right - previous chapter
        if (state.currentChapterIndex > 0) {
          state.currentChapterIndex--;
        } else if (state.currentBookIndex > 0) {
          state.currentBookIndex--;
          const book = state.bible[state.currentBookIndex];
          state.currentChapterIndex = book.chapters.length - 1;
        }
      } else {
        // Swipe left - next chapter
        const book = state.bible[state.currentBookIndex];
        if (state.currentChapterIndex < book.chapters.length - 1) {
          state.currentChapterIndex++;
        } else if (state.currentBookIndex < state.bible.length - 1) {
          state.currentBookIndex++;
          state.currentChapterIndex = 0;
        }
      }
      
      bookSelect.value = state.currentBookIndex;
      populateChapterSelector();
      jumpToBookChapter(state.currentBookIndex, state.currentChapterIndex);
    }
  }, { passive: true });
}

// ==== Event Binding ====
function bindControls() {
  // Scroll events
  scrollContainer.addEventListener('scroll', onScroll);
  
  // Click on verses to center them
  scrollContainer.addEventListener('click', (e) => {
    const verseElement = e.target.closest('.verse, .chapter-heading');
    if (verseElement) {
      const verseIndex = parseInt(verseElement.dataset.verse);
      if (!isNaN(verseIndex)) {
        scrollToVerse(verseIndex);
      }
    }
  });
  
  // Keyboard
  document.addEventListener('keydown', onKeyDown);
  
  // Controls
  translationSelect.addEventListener('change', async () => {
    state.currentTranslation = translationSelect.value;
    
    // Show loading message
    if (loadingMessage) {
      loadingMessage.style.display = 'block';
      loadingMessage.textContent = `Loading ${state.currentTranslation}...`;
    }
    scrollContainer.style.display = 'none';
    
    state.bible = await loadBibleTranslation(state.currentTranslation);
    if (state.bible) {
      loadPassage();
      
      // Hide loading, show content
      if (loadingMessage) loadingMessage.style.display = 'none';
      scrollContainer.style.display = 'block';
    }
  });
  
  bookSelect.addEventListener('change', () => {
    state.currentBookIndex = parseInt(bookSelect.value);
    state.currentChapterIndex = 0; // Reset to chapter 1
    populateChapterSelector();
    jumpToBookChapter(state.currentBookIndex, state.currentChapterIndex);
  });
  
  chapterSelect.addEventListener('change', () => {
    state.currentChapterIndex = parseInt(chapterSelect.value);
    jumpToBookChapter(state.currentBookIndex, state.currentChapterIndex);
  });
  
  themeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
    updateURL();
  });
  
  fontBtn.addEventListener('click', toggleSerifFont);
  
  // Menu toggle for mobile
  menuBtn.addEventListener('click', () => {
    controlsFooter.classList.toggle('open');
    menuBtn.classList.toggle('active');
  });
  
  // Close controls when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !controlsFooter.contains(e.target) && 
        !menuBtn.contains(e.target) &&
        controlsFooter.classList.contains('open')) {
      controlsFooter.classList.remove('open');
      menuBtn.classList.remove('active');
    }
  });
  
  // Verse jump input
  verseJumpInput.addEventListener('input', (e) => {
    updateVerseSuggestions(e.target.value);
  });
  
  // Click outside to close verse jump
  verseJumpModal.addEventListener('click', (e) => {
    if (e.target === verseJumpModal) {
      closeVerseJump();
    }
  });
  
  // Initialize touch gestures
  initTouchGestures();
  
  // Info dialog
  infoBtn.addEventListener('click', () => {
    infoDialog.showModal();
  });
  
  closeInfoBtn.addEventListener('click', () => {
    infoDialog.close();
  });
  
  infoDialog.addEventListener('click', (e) => {
    if (e.target === infoDialog) {
      infoDialog.close();
    }
  });
  
  // Audio toggle
  audioToggle.addEventListener('change', () => {
    state.audioEnabled = audioToggle.checked;
    if (state.audioEnabled) {
      initAudio();
    }
    localStorage.setItem('audioEnabled', state.audioEnabled);
  });
  
  // System theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!localStorage.getItem('theme')) {
      applyTheme(getSystemTheme());
    }
  });
}

// ==== Initialization ====
async function boot() {
  // Apply theme
  const theme = getCurrentTheme();
  applyTheme(theme);
  
  // Load audio preference
  const audioEnabled = localStorage.getItem('audioEnabled') === 'true';
  state.audioEnabled = audioEnabled;
  audioToggle.checked = audioEnabled;
  if (audioEnabled) {
    initAudio();
  }
  
  // Load font size preference
  const savedFontSize = parseInt(localStorage.getItem('fontSize'));
  if (savedFontSize) {
    state.fontSize = savedFontSize;
    adjustFontSize(0); // Apply without changing
  }
  
  // Load serif font preference
  const savedSerifFont = localStorage.getItem('useSerifFont') === 'true';
  if (savedSerifFont) {
    state.useSerifFont = true;
    document.body.classList.add('serif-font');
  }
  
  // Setup translation
  const urlTranslation = getQuery('t');
  const storedTranslation = localStorage.getItem('translation');
  const validTranslations = ['KJV', 'BBE'];
  
  state.currentTranslation = validTranslations.includes(urlTranslation) ? urlTranslation :
                             validTranslations.includes(storedTranslation) ? storedTranslation :
                             'KJV';
  
  translationSelect.value = state.currentTranslation;
  
  // Load the selected translation
  console.log('Loading Bible translation:', state.currentTranslation);
  
  state.bible = await loadBibleTranslation(state.currentTranslation);
  console.log('Bible loaded:', state.bible ? `Success (${state.bible.length} books)` : 'Failed');
  
  if (!state.bible) {
    alert('Failed to load Bible. Please check console for errors.');
    return;
  }
  
  // Load and display the entire Bible
  loadPassage();
  
  // Bind all controls
  bindControls();
  
  // Hide loading, show scroll container
  if (loadingMessage) loadingMessage.style.display = 'none';
  scrollContainer.style.display = 'block';
  
  // Check for continue reading after a brief delay
  setTimeout(() => {
    checkContinueReading();
  }, 500);
  
  console.log('Ready! You can now scroll through the entire Bible.');
  console.log('Keyboard shortcuts: / = search, F/Space = focus mode, C = copy, +/- = font size');
}

// Start the app
boot();

