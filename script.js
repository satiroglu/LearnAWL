let awlData = [];
let currentWordIndex = 0;
let quizMode = false;
let filteredWords = [];
let score = { correct: 0, total: 0 };
let incorrectAnswers = [];
let timer;
let isTimerPaused = false;
let timeLeft = 15; // Store time left for resuming
let audioUrl = null;
let originalFilteredWords = []; // Store original sublist words

const wordCard = document.getElementById("wordCard");
const quizCard = document.getElementById("quizCard");
const wordElement = document.getElementById("word");
const pronunciationElement = document.getElementById("pronunciation");
const posElement = document.getElementById("pos");
const definitionsElement = document.getElementById("definitions");
const relatedFormsElement = document.getElementById("relatedForms");
const quizDefinitionsElement = document.getElementById("quizDefinitions");
const answerOptions = document.querySelectorAll(".answer-option");
const feedbackElement = document.getElementById("feedback");
const toggleModeButton = document.getElementById("toggleMode");
const sublistFilter = document.getElementById("sublistFilter");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const reviewButton = document.getElementById("reviewButton");
const hintButton = document.getElementById("hintButton");
const hintText = document.getElementById("hintText");
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const progressBar = document.getElementById("progressBar");
const pauseTimerButton = document.getElementById("pauseTimerButton");
const playAudioButton = document.getElementById("playAudio");
const timeLimit = 15; // seconds

// Load data from data.json
fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    awlData = data;
    filteredWords = [...awlData];
    originalFilteredWords = [...awlData]; // Store original sublist words
    filteredWords = shuffleArray([...filteredWords]); // Shuffle on page load
    displayWord();
  })
  .catch((error) => console.error("Error loading data.json:", error));

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getRandomAnswers(correctWord) {
  const answers = [correctWord];
  const otherWords = awlData.filter((w) => w.word !== correctWord);
  while (answers.length < 4 && otherWords.length > 0) {
    const randomIndex = Math.floor(Math.random() * otherWords.length);
    answers.push(otherWords[randomIndex].word);
    otherWords.splice(randomIndex, 1);
  }
  return answers.sort(() => Math.random() - 0.5);
}

function resetScore() {
  score = { correct: 0, total: 0 };
  incorrectAnswers = [];
  scoreElement.textContent = "0/0";
  progressBar.style.width = "0%";
  reviewButton.classList.add("hidden");
}

function showToast(message, type) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "bottom",
    position: "center",
    backgroundColor: type === "error" ? "#dc2626" : "#16a34a",
    className: "text-sm sm:text-base",
  }).showToast();
}

async function fetchDictionaryData(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );
    if (!response.ok) throw new Error("Word not found");
    const data = await response.json();
    return data[0];
  } catch (error) {
    showToast(`Error: Could not fetch data for "${word}"`, "error");
    return null;
  }
}

async function fetchAudio(word) {
  try {
    const data = await fetchDictionaryData(word);
    if (data && data.phonetics) {
      const phonetic = data.phonetics.find((p) => p.audio);
      audioUrl = phonetic ? phonetic.audio : null;
      playAudioButton.classList.toggle("hidden", !audioUrl);
    } else {
      audioUrl = null;
      playAudioButton.classList.add("hidden");
    }
  } catch (error) {
    audioUrl = null;
    playAudioButton.classList.add("hidden");
    showToast(`No audio available for "${word}"`, "error");
  }
}

function playAudio() {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => showToast("Error playing audio", "error"));
  }
}

async function showSynonymOrRelatedWord(word) {
  const data = await fetchDictionaryData(word);
  if (data) {
    const formattedWord = {
      word: data.word,
      pronunciation: data.phonetic || "",
      pos: data.meanings[0]?.partOfSpeech || "",
      definitions: data.meanings.flatMap((meaning) =>
        meaning.definitions.map((def) => ({
          text: def.definition,
          example: def.example || "",
          synonyms: def.synonyms || [],
        })),
      ),
      sublist: 0, // Non-sublist word
      related_forms: [], // API doesn't provide related forms
    };
    filteredWords = [formattedWord];
    currentWordIndex = 0;
    resetScore();
    await fetchAudio(word);
    displayWord();
  }
}

async function displayWord() {
  const word = filteredWords[currentWordIndex];
  if (!word) {
    wordCard.classList.add("hidden");
    quizCard.classList.add("hidden");
    return;
  }

  const isSublistWord = word.sublist !== 0; // Check if word is from data.json

  if (quizMode) {
    wordCard.classList.add("hidden");
    quizCard.classList.remove("hidden");
    quizDefinitionsElement.innerHTML = isSublistWord
      ? word.definitions
          .map(
            (def) => `
        <div class="mb-3">
          <p class="text-[#112D4E]">${def.text}</p>
          ${
            def.example
              ? `<p class="text-[#3F72AF] italic">E.g.: ${def.example}</p>`
              : ""
          }
          ${
            def.synonyms && def.synonyms.length
              ? `<p class="text-[#3F72AF]"><span class="synonym-label">[Syn:</span> ${def.synonyms
                  .map(
                    (syn) =>
                      `<span class="synonym" onclick="showSynonymOrRelatedWord('${syn}')">${syn}</span>`,
                  )
                  .join(", ")}]</p>`
              : ""
          }
        </div>
      `,
          )
          .join("")
      : `<ol class="list-decimal list-inside">${word.definitions
          .map(
            (def) => `
        <li class="mb-3">
          <span class="text-[#112D4E]">${def.text}</span>
          ${
            def.example
              ? `<p class="text-[#3F72AF] italic">E.g.: ${def.example}</p>`
              : ""
          }
          ${
            def.synonyms && def.synonyms.length
              ? `<p class="text-[#3F72AF]"><span class="synonym-label">[Syn:</span> ${def.synonyms
                  .map(
                    (syn) =>
                      `<span class="synonym" onclick="showSynonymOrRelatedWord('${syn}')">${syn}</span>`,
                  )
                  .join(", ")}]</p>`
              : ""
          }
        </li>
      `,
          )
          .join("")}</ol>`;
    feedbackElement.textContent = "";
    hintText.textContent = "";
    hintText.classList.add("hidden");
    hintButton.disabled = false;
    timeLeft = timeLimit; // Reset timer
    isTimerPaused = false;
    pauseTimerButton.textContent = "Pause Timer";

    const answers = getRandomAnswers(word.word);
    answerOptions.forEach((button, index) => {
      const answerText = button.querySelector(".answer-text");
      answerText.textContent = answers[index] || "";
      button.dataset.answer = answers[index] || "";
      button.classList.remove("bg-green-500", "bg-red-500", "text-white");
      button.classList.add(
        "bg-[#DBE2EF]",
        "text-[#112D4E]",
        "hover:bg-[#3F72AF]",
        "hover:text-white",
      );
      button.disabled = false;
    });
    clearInterval(timer);
    startTimer();
  } else {
    clearInterval(timer);
    wordCard.classList.remove("hidden");
    quizCard.classList.add("hidden");
    wordElement.textContent = word.word;
    pronunciationElement.textContent = word.pronunciation || "";
    posElement.textContent = word.pos || "";
    document.getElementById("sublistTag").textContent = word.sublist
      ? `Sublist ${word.sublist}`
      : "External Word";
    definitionsElement.innerHTML = isSublistWord
      ? word.definitions
          .map(
            (def) => `
        <div class="mb-3">
          <p class="text-[#112D4E]">${def.text}</p>
          ${
            def.example
              ? `<p class="text-[#3F72AF] italic">E.g.: ${def.example}</p>`
              : ""
          }
          ${
            def.synonyms && def.synonyms.length
              ? `<p class="text-[#3F72AF]"><span class="synonym-label">[Syn:</span> ${def.synonyms
                  .map(
                    (syn) =>
                      `<span class="synonym" onclick="showSynonymOrRelatedWord('${syn}')">${syn}</span>`,
                  )
                  .join(", ")}]</p>`
              : ""
          }
        </div>
      `,
          )
          .join("")
      : `<ol class="list-decimal list-inside">${word.definitions
          .map(
            (def) => `
        <li class="mb-3">
          <span class="text-[#112D4E]">${def.text}</span>
          ${
            def.example
              ? `<p class="text-[#3F72AF] italic">E.g.: ${def.example}</p>`
              : ""
          }
          ${
            def.synonyms && def.synonyms.length
              ? `<p class="text-[#3F72AF]"><span class="synonym-label">[Syn:</span> ${def.synonyms
                  .map(
                    (syn) =>
                      `<span class="synonym" onclick="showSynonymOrRelatedWord('${syn}')">${syn}</span>`,
                  )
                  .join(", ")}]</p>`
              : ""
          }
        </li>
      `,
          )
          .join("")}</ol>`;
    relatedFormsElement.innerHTML =
      word.related_forms && word.related_forms.length
        ? `<strong class="related-forms-label">Related Forms:</strong> ${word.related_forms
            .map(
              (form) =>
                `<span class="synonym" onclick="showSynonymOrRelatedWord('${form}')">${form}</span>`,
            )
            .join(", ")}`
        : "";
    await fetchAudio(word.word);
  }
}

function startTimer() {
  timerElement.textContent = timeLeft;
  timer = setInterval(() => {
    if (!isTimerPaused) {
      timeLeft--;
      timerElement.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        score.total++;
        const correctWord = filteredWords[currentWordIndex].word;
        feedbackElement.textContent = `Time's up! Correct word: "${correctWord}".`;
        feedbackElement.className = "mt-4 text-red-600";
        incorrectAnswers.push({
          word: filteredWords[currentWordIndex],
          userAnswer: "None (Time's up)",
        });
        answerOptions.forEach((btn) => (btn.disabled = true));
        scoreElement.textContent = `${score.correct}/${score.total}`;
        const progress = (score.total / filteredWords.length) * 100;
        progressBar.style.width = `${progress}%`;
        if (score.total === filteredWords.length) {
          reviewButton.classList.remove("hidden");
        }
        showToast(
          `Time's up! Correct word: "${correctWord}". Moving to next word...`,
          "error",
        );
        setTimeout(() => {
          currentWordIndex = (currentWordIndex + 1) % filteredWords.length;
          filteredWords = [...originalFilteredWords]; // Restore sublist words
          filteredWords = shuffleArray([...filteredWords]);
          currentWordIndex = 0;
          displayWord();
        }, 3000);
      }
    }
  }, 1000);
}

function checkAnswer(event) {
  const button = event.target.closest(".answer-option");
  if (!button || button.disabled) return;
  clearInterval(timer);
  const userAnswer = button.dataset.answer.toLowerCase();
  const correctAnswer = filteredWords[currentWordIndex].word.toLowerCase();
  score.total++;
  if (userAnswer === correctAnswer) {
    score.correct++;
    feedbackElement.textContent = "Correct!";
    feedbackElement.className = "mt-4 text-green-600";
    showToast("Correct!", "success");
  } else {
    feedbackElement.textContent = `Wrong. Correct word: "${filteredWords[currentWordIndex].word}".`;
    feedbackElement.className = "mt-4 text-red-600";
    showToast(
      `Wrong. Correct word: "${filteredWords[currentWordIndex].word}".`,
      "error",
    );
    incorrectAnswers.push({
      word: filteredWords[currentWordIndex],
      userAnswer: button.dataset.answer,
    });
  }
  scoreElement.textContent = `${score.correct}/${score.total}`;
  const progress = (score.total / filteredWords.length) * 100;
  progressBar.style.width = `${progress}%`;

  answerOptions.forEach((btn) => {
    btn.classList.remove(
      "bg-green-500",
      "bg-red-500",
      "text-white",
      "hover:bg-[#3F72AF]",
      "hover:text-white",
    );
    if (btn.dataset.answer.toLowerCase() === correctAnswer) {
      btn.classList.add("bg-green-500", "text-white");
    } else if (btn === button) {
      btn.classList.add("bg-red-500", "text-white");
    } else {
      btn.classList.add("bg-[#DBE2EF]", "text-[#112D4E]");
    }
    btn.disabled = true;
  });

  if (score.total === filteredWords.length) {
    reviewButton.classList.remove("hidden");
  }
}

hintButton.addEventListener("click", () => {
  const word = filteredWords[currentWordIndex];
  hintText.textContent = `Pronunciation: ${word.pronunciation}`;
  hintText.classList.remove("hidden");
  // Only deduct points if no answer has been selected yet (buttons are not disabled)
  if (!answerOptions[0].disabled) {
    score.correct -= 0.5;
    scoreElement.textContent = `${score.correct}/${score.total}`;
  }
  hintButton.disabled = true;
});

pauseTimerButton.addEventListener("click", () => {
  isTimerPaused = !isTimerPaused;
  pauseTimerButton.textContent = isTimerPaused ? "Resume Timer" : "Pause Timer";
  if (!isTimerPaused) {
    startTimer(); // Resume timer
  } else {
    clearInterval(timer); // Pause timer
  }
});

playAudioButton.addEventListener("click", playAudio);

reviewButton.addEventListener("click", () => {
  quizCard.innerHTML = `
    <h2 class="text-lg sm:text-xl font-semibold mb-4 text-[#112D4E]">Review Incorrect Answers</h2>
    <div id="reviewContent" class="text-sm sm:text-base text-[#112D4E]">
      ${
        incorrectAnswers.length === 0
          ? "<p>No incorrect answers!</p>"
          : incorrectAnswers
              .map(
                (item) => `
            <div class="mb-4">
              <p><strong>Word:</strong> ${item.word.word}</p>
              <p><strong>Your Answer:</strong> ${item.userAnswer}</p>
              <p><strong>Definition:</strong> ${item.word.definitions[0].text}</p>
            </div>
          `,
              )
              .join("")
      }
    </div>
    <button id="restartQuiz" class="bg-[#3F72AF] text-white px-4 py-2 rounded-lg hover:bg-[#112D4E] text-sm sm:text-base">Restart Quiz</button>
  `;
  document.getElementById("restartQuiz").addEventListener("click", () => {
    incorrectAnswers = [];
    currentWordIndex = 0;
    filteredWords = shuffleArray([...originalFilteredWords]); // Restore sublist words
    resetScore();
    displayWord();
  });
});

prevButton.addEventListener("click", () => {
  filteredWords = [...originalFilteredWords]; // Restore sublist words
  currentWordIndex =
    (currentWordIndex - 1 + filteredWords.length) % filteredWords.length;
  displayWord();
});

nextButton.addEventListener("click", () => {
  filteredWords = [...originalFilteredWords]; // Restore sublist words
  currentWordIndex = (currentWordIndex + 1) % filteredWords.length;
  displayWord();
});

sublistFilter.addEventListener("change", () => {
  filteredWords = [...originalFilteredWords]; // Restore sublist words before filtering
  filterWords();
});

toggleModeButton.addEventListener("click", () => {
  filteredWords = [...originalFilteredWords]; // Restore sublist words
  toggleMode();
});

answerOptions.forEach((button) => {
  button.addEventListener("click", checkAnswer);
});

function filterWords() {
  const filterValue = sublistFilter.value;
  filteredWords =
    filterValue === "all"
      ? [...awlData]
      : awlData.filter((w) => w.sublist == parseInt(filterValue));
  originalFilteredWords = [...filteredWords]; // Update original sublist words
  filteredWords = shuffleArray([...filteredWords]); // Always shuffle words
  currentWordIndex = 0;
  resetScore();
  displayWord();
}

function toggleMode() {
  quizMode = !quizMode;
  toggleModeButton.textContent = quizMode
    ? "Switch to Study Mode"
    : "Switch to Quiz Mode";
  filteredWords = shuffleArray([...filteredWords]);
  resetScore();
  currentWordIndex = 0;
  displayWord();
}
