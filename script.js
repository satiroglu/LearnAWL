let awlData = [];
let currentWordIndex = 0;
let quizMode = false;
let filteredWords = [];
let score = { correct: 0, total: 0 };
let incorrectAnswers = [];
let timer;

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
const timeLimit = 15; // seconds

// Load data from data.json
fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    awlData = data;
    filteredWords = [...awlData];
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

function startTimer() {
  let timeLeft = timeLimit;
  timerElement.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      score.total++;
      feedbackElement.textContent = `Time's up! Correct word: "${filteredWords[currentWordIndex].word}".`;
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
    }
  }, 1000);
}

function displayWord() {
  const word = filteredWords[currentWordIndex];
  if (!word) {
    wordCard.classList.add("hidden");
    quizCard.classList.add("hidden");
    return;
  }

  if (quizMode) {
    wordCard.classList.add("hidden");
    quizCard.classList.remove("hidden");
    quizDefinitionsElement.innerHTML = word.definitions
      .map(
        (def) => `
      <div class="mb-3">
        <p class="text-gray-700">${def.text}</p>
        <p class="text-gray-500 italic">E.g.: ${def.example}</p>
        ${
          def.synonyms
            ? `<p class="text-gray-500">[Syn: ${def.synonyms
                .map(
                  (syn) =>
                    `<span class="synonym" onclick="showSynonym('${syn}')">${syn}</span>`,
                )
                .join(", ")}]</p>`
            : ""
        }
      </div>
    `,
      )
      .join("");
    feedbackElement.textContent = "";
    hintText.textContent = "";
    hintText.classList.add("hidden");
    hintButton.disabled = false;

    const answers = getRandomAnswers(word.word);
    answerOptions.forEach((button, index) => {
      const answerText = button.querySelector(".answer-text");
      answerText.textContent = answers[index] || "";
      button.dataset.answer = answers[index] || "";
      button.classList.remove("bg-green-500", "bg-red-500", "text-white");
      button.classList.add(
        "bg-gray-100",
        "text-gray-800",
        "hover:bg-indigo-100",
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
    pronunciationElement.textContent = word.pronunciation;
    posElement.textContent = word.pos;
    definitionsElement.innerHTML = word.definitions
      .map(
        (def) => `
      <div class="mb-3">
        <p class="text-gray-700">${def.text}</p>
        <p class="text-gray-500 italic">E.g.: ${def.example}</p>
        ${
          def.synonyms
            ? `<p class="text-gray-500">[Syn: ${def.synonyms
                .map(
                  (syn) =>
                    `<span class="synonym" onclick="showSynonym('${syn}')">${syn}</span>`,
                )
                .join(", ")}]</p>`
            : ""
        }
      </div>
    `,
      )
      .join("");
    relatedFormsElement.innerHTML = word.related_forms.length
      ? `<strong>Related Forms:</strong> ${word.related_forms.join(", ")}`
      : "";
  }
}

function showSynonym(synonym) {
  const synWord = awlData.find(
    (w) => w.word.toLowerCase() === synonym.toLowerCase(),
  );
  if (synWord) {
    filteredWords = [synWord];
    currentWordIndex = 0;
    resetScore();
    displayWord();
  }
}

function filterWords() {
  const filterValue = sublistFilter.value;
  filteredWords =
    filterValue === "all"
      ? [...awlData]
      : awlData.filter((w) => w.sublist == parseInt(filterValue));
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
  if (quizMode) filteredWords = shuffleArray([...filteredWords]);
  resetScore();
  currentWordIndex = 0;
  displayWord();
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
  } else {
    feedbackElement.textContent = `Wrong. Correct word: "${filteredWords[currentWordIndex].word}".`;
    feedbackElement.className = "mt-4 text-red-600";
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
      "hover:bg-indigo-100",
    );
    if (btn.dataset.answer.toLowerCase() === correctAnswer) {
      btn.classList.add("bg-green-500", "text-white");
    } else if (btn === button) {
      btn.classList.add("bg-red-500", "text-white");
    } else {
      btn.classList.add("bg-gray-100", "text-gray-800");
    }
    btn.disabled = true;
  });

  if (score.total === filteredWords.length) {
    reviewButton.classList.remove("hidden");
  }
}

hintButton.addEventListener("click", () => {
  const word = filteredWords[currentWordIndex];
  hintText.textContent = `Hint: Pronunciation: ${word.pronunciation}`;
  hintText.classList.remove("hidden");
  score.correct -= 0.5;
  scoreElement.textContent = `${score.correct}/${score.total}`;
  hintButton.disabled = true;
});

reviewButton.addEventListener("click", () => {
  quizCard.innerHTML = `
    <h2 class="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Review Incorrect Answers</h2>
    <div id="reviewContent" class="text-sm sm:text-base">
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
    <button id="restartQuiz" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm sm:text-base">Restart Quiz</button>
  `;
  document.getElementById("restartQuiz").addEventListener("click", () => {
    incorrectAnswers = [];
    currentWordIndex = 0;
    filteredWords = shuffleArray([...filteredWords]);
    resetScore();
    displayWord();
  });
});

prevButton.addEventListener("click", () => {
  currentWordIndex =
    (currentWordIndex - 1 + filteredWords.length) % filteredWords.length;
  displayWord();
});

nextButton.addEventListener("click", () => {
  currentWordIndex = (currentWordIndex + 1) % filteredWords.length;
  displayWord();
});

sublistFilter.addEventListener("change", filterWords);
toggleModeButton.addEventListener("click", toggleMode);
answerOptions.forEach((button) => {
  button.addEventListener("click", checkAnswer);
});
