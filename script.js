let awlData = [];
let currentWordIndex = 0;
let quizMode = false;
let filteredWords = [];

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

// Load data from data.json
fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    awlData = data;
    filteredWords = [...awlData];
    displayWord();
  })
  .catch((error) => console.error("Error loading data.json:", error));

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
  } else {
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
    displayWord();
  }
}

function filterWords() {
  const filterValue = sublistFilter.value;
  filteredWords =
    filterValue === "all"
      ? [...awlData]
      : awlData.filter((w) => w.sublist == parseInt(filterValue));
  currentWordIndex = 0;
  displayWord();
}

function toggleMode() {
  quizMode = !quizMode;
  toggleModeButton.textContent = quizMode
    ? "Switch to Study Mode"
    : "Switch to Quiz Mode";
  displayWord();
}

function checkAnswer(event) {
  const button = event.target.closest(".answer-option");
  if (!button || button.disabled) return; // Prevent multiple clicks
  const userAnswer = button.dataset.answer.toLowerCase();
  const correctAnswer = filteredWords[currentWordIndex].word.toLowerCase();
  feedbackElement.textContent =
    userAnswer === correctAnswer
      ? "Correct!"
      : `Wrong. Correct word: "${filteredWords[currentWordIndex].word}".`;
  feedbackElement.className = `mt-4 ${
    userAnswer === correctAnswer ? "text-green-600" : "text-red-600"
  }`;

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
}

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
