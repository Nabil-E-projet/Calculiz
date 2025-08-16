// Variables globales
let currentQuizType = '';
let currentQuestion = 0;
let score = 0;
let totalQuestions = 10;
let questions = [];
let correctAnswer = '';

// Variables pour le chronomètre
let quizStartTime = 0;
let timerInterval = null;
let questionStartTime = 0;
let questionTimes = [];

// Variables pour les statistiques
let stats = JSON.parse(localStorage.getItem('calculizStats')) || {
    totalQuizzes: 0,
    quizResults: [],
    quizTypeStats: {
        carres25: { attempts: 0, totalScore: 0, totalTime: 0, bestScore: 0 },
        cubes10: { attempts: 0, totalScore: 0, totalTime: 0, bestScore: 0 },
        multiplications20: { attempts: 0, totalScore: 0, totalTime: 0, bestScore: 0 },
        alphabet: { attempts: 0, totalScore: 0, totalTime: 0, bestScore: 0 }
    }
};

// Types de quiz et leurs configurations
const quizTypes = {
    carres25: {
        title: "Carrés jusqu'à 25",
        generateQuestion: () => {
            const num = Math.floor(Math.random() * 25) + 1;
            return {
                question: `${num}²`,
                answer: (num * num).toString(),
                explanation: `${num}² = ${num} × ${num} = ${num * num}`
            };
        }
    },
    cubes10: {
        title: "Cubes jusqu'à 10",
        generateQuestion: () => {
            const num = Math.floor(Math.random() * 10) + 1;
            return {
                question: `${num}³`,
                answer: (num * num * num).toString(),
                explanation: `${num}³ = ${num} × ${num} × ${num} = ${num * num * num}`
            };
        }
    },
    multiplications20: {
        title: "Multiplications jusqu'à 20",
        generateQuestion: () => {
            const num1 = Math.floor(Math.random() * 20) + 1;
            const num2 = Math.floor(Math.random() * 20) + 1;
            return {
                question: `${num1} × ${num2}`,
                answer: (num1 * num2).toString(),
                explanation: `${num1} × ${num2} = ${num1 * num2}`
            };
        }
    },
    alphabet: {
        title: "Rang des lettres",
        generateQuestion: () => {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const randomIndex = Math.floor(Math.random() * 26);
            const letter = alphabet[randomIndex];
            const position = randomIndex + 1;
            
            // Alterner entre demander la position d'une lettre et la lettre d'une position
            if (Math.random() < 0.5) {
                return {
                    question: `Quelle est la position de la lettre "${letter}" ?`,
                    answer: position.toString(),
                    explanation: `La lettre ${letter} est en position ${position} dans l'alphabet`
                };
            } else {
                return {
                    question: `Quelle est la ${position}ème lettre de l'alphabet ?`,
                    answer: letter,
                    explanation: `La ${position}ème lettre de l'alphabet est ${letter}`
                };
            }
        }
    }
};

// Fonctions d'affichage
function showScreen(screenId) {
    document.querySelectorAll('.menu-screen, .quiz-screen, .results-screen, .stats-screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function backToMenu() {
    showScreen('menu');
    resetQuiz();
}

// Fonctions du chronomètre
function startTimer() {
    quizStartTime = Date.now();
    questionStartTime = Date.now();
    questionTimes = [];
    
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - quizStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function recordQuestionTime() {
    const questionTime = Date.now() - questionStartTime;
    questionTimes.push(questionTime);
    questionStartTime = Date.now();
}

function formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Fonctions de quiz
function startQuiz(quizType) {
    currentQuizType = quizType;
    currentQuestion = 0;
    score = 0;
    questions = [];
    
    // Générer toutes les questions
    for (let i = 0; i < totalQuestions; i++) {
        questions.push(quizTypes[quizType].generateQuestion());
    }
    
    document.getElementById('quiz-title').textContent = quizTypes[quizType].title;
    showScreen('quiz');
    startTimer();
    displayQuestion();
}

function displayQuestion() {
    const questionData = questions[currentQuestion];
    correctAnswer = questionData.answer;
    
    document.getElementById('question').textContent = questionData.question;
    document.getElementById('answer').value = '';
    document.getElementById('answer').focus();
    document.getElementById('submit-btn').disabled = false;
    
    // Masquer le feedback précédent
    document.getElementById('feedback').classList.add('hidden');
    
    // Mettre à jour les informations
    updateQuizInfo();
    updateProgress();
}

function updateQuizInfo() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('question-counter').textContent = `Question ${currentQuestion + 1}/${totalQuestions}`;
}

function updateProgress() {
    const progress = ((currentQuestion) / totalQuestions) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
}

function checkAnswer() {
    const userAnswer = document.getElementById('answer').value.trim().toLowerCase();
    const correct = correctAnswer.toLowerCase();
    const feedback = document.getElementById('feedback');
    const questionData = questions[currentQuestion];
    
    // Enregistrer le temps de la question
    recordQuestionTime();
    
    feedback.classList.remove('hidden', 'correct', 'incorrect');
    
    if (userAnswer === correct) {
        score++;
        feedback.textContent = `✅ Correct ! ${questionData.explanation}`;
        feedback.classList.add('correct');
    } else {
        feedback.textContent = `❌ Incorrect. ${questionData.explanation}`;
        feedback.classList.add('incorrect');
    }
    
    document.getElementById('submit-btn').disabled = true;
    
    // Passer à la question suivante après 2 secondes
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < totalQuestions) {
            displayQuestion();
        } else {
            stopTimer();
            showResults();
        }
    }, 2000);
}

function showResults() {
    const finalScore = score;
    const percentage = Math.round((finalScore / totalQuestions) * 100);
    const totalTime = Date.now() - quizStartTime;
    const averageTimePerQuestion = Math.round(totalTime / totalQuestions / 1000);
    
    // Afficher les résultats
    document.getElementById('final-score').textContent = finalScore;
    document.getElementById('final-time').textContent = formatTime(totalTime);
    document.getElementById('average-time').textContent = `${averageTimePerQuestion}s`;
    
    // Sauvegarder les statistiques
    saveQuizResult(finalScore, totalTime, percentage);
    
    let message = '';
    if (percentage >= 90) {
        message = '🏆 Excellent ! Vous maîtrisez parfaitement !';
    } else if (percentage >= 70) {
        message = '👍 Très bien ! Continuez comme ça !';
    } else if (percentage >= 50) {
        message = '🤔 Pas mal, mais vous pouvez vous améliorer !';
    } else {
        message = '💪 Continuez à vous entraîner, vous allez progresser !';
    }
    
    document.getElementById('performance-message').textContent = message;
    showScreen('results');
}

function restartQuiz() {
    startQuiz(currentQuizType);
}

function resetQuiz() {
    currentQuizType = '';
    currentQuestion = 0;
    score = 0;
    questions = [];
    correctAnswer = '';
    stopTimer();
    questionTimes = [];
}

// Fonctions de statistiques
function saveQuizResult(finalScore, totalTime, percentage) {
    const result = {
        type: currentQuizType,
        score: finalScore,
        totalScore: totalQuestions,
        percentage: percentage,
        time: totalTime,
        date: new Date().toISOString(),
        questionTimes: [...questionTimes]
    };
    
    stats.totalQuizzes++;
    stats.quizResults.push(result);
    
    // Mettre à jour les stats par type de quiz
    const typeStats = stats.quizTypeStats[currentQuizType];
    typeStats.attempts++;
    typeStats.totalScore += finalScore;
    typeStats.totalTime += totalTime;
    typeStats.bestScore = Math.max(typeStats.bestScore, finalScore);
    
    // Garder seulement les 50 derniers résultats
    if (stats.quizResults.length > 50) {
        stats.quizResults = stats.quizResults.slice(-50);
    }
    
    localStorage.setItem('calculizStats', JSON.stringify(stats));
}

function showStats() {
    updateStatsDisplay();
    showScreen('stats');
}

function updateStatsDisplay() {
    // Statistiques générales
    document.getElementById('total-quizzes').textContent = stats.totalQuizzes;
    
    if (stats.totalQuizzes > 0) {
        const totalScore = stats.quizResults.reduce((sum, result) => sum + result.percentage, 0);
        const averageScore = Math.round(totalScore / stats.quizResults.length);
        document.getElementById('average-score').textContent = `${averageScore}%`;
        
        const totalTime = stats.quizResults.reduce((sum, result) => sum + result.time, 0);
        const averageTime = totalTime / stats.quizResults.length;
        document.getElementById('average-total-time').textContent = formatTime(averageTime);
        
        const bestResult = stats.quizResults.reduce((best, result) => 
            result.score > best.score ? result : best, stats.quizResults[0]);
        document.getElementById('best-score').textContent = `${bestResult.score}/10`;
    } else {
        document.getElementById('average-score').textContent = '0%';
        document.getElementById('average-total-time').textContent = '00:00';
        document.getElementById('best-score').textContent = '0/10';
    }
    
    // Statistiques détaillées par quiz
    const quizStatsContainer = document.getElementById('quiz-stats');
    quizStatsContainer.innerHTML = '';
    
    const quizNames = {
        carres25: 'Carrés jusqu\'à 25',
        cubes10: 'Cubes jusqu\'à 10',
        multiplications20: 'Multiplications jusqu\'à 20',
        alphabet: 'Rang des lettres'
    };
    
    let hasStats = false;
    for (const [type, typeStats] of Object.entries(stats.quizTypeStats)) {
        if (typeStats.attempts > 0) {
            hasStats = true;
            const averageScore = Math.round((typeStats.totalScore / typeStats.attempts / totalQuestions) * 100);
            const averageTime = typeStats.totalTime / typeStats.attempts;
            
            const statItem = document.createElement('div');
            statItem.className = 'quiz-stat-item';
            statItem.innerHTML = `
                <div class="quiz-stat-info">
                    <h4>${quizNames[type]}</h4>
                    <p>${typeStats.attempts} tentative${typeStats.attempts > 1 ? 's' : ''}</p>
                </div>
                <div class="quiz-stat-numbers">
                    <div class="score">${averageScore}% (${typeStats.bestScore}/10 max)</div>
                    <div class="time">${formatTime(averageTime)} en moyenne</div>
                </div>
            `;
            quizStatsContainer.appendChild(statItem);
        }
    }
    
    if (!hasStats) {
        quizStatsContainer.innerHTML = '<div class="no-stats">Aucune statistique disponible. Commencez un quiz pour voir vos performances !</div>';
    }
}

function clearStats() {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes vos statistiques ? Cette action est irréversible.')) {
        stats = {
            totalQuizzes: 0,
            quizResults: [],
            quizTypeStats: {
                carres25: { attempts: 0, totalScore: 0, totalTime: 0, bestScore: 0 },
                cubes10: { attempts: 0, totalScore: 0, totalTime: 0, bestScore: 0 },
                multiplications20: { attempts: 0, totalScore: 0, totalTime: 0, bestScore: 0 },
                alphabet: { attempts: 0, totalScore: 0, totalTime: 0, bestScore: 0 }
            }
        };
        localStorage.setItem('calculizStats', JSON.stringify(stats));
        updateStatsDisplay();
    }
}

// Gestion des événements clavier
document.addEventListener('DOMContentLoaded', function() {
    const answerInput = document.getElementById('answer');
    
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const submitBtn = document.getElementById('submit-btn');
            if (!submitBtn.disabled) {
                checkAnswer();
            }
        }
    });
    
    // Focus automatique sur le champ de réponse quand on arrive sur le quiz
    document.addEventListener('keydown', function(e) {
        if (!document.getElementById('quiz').classList.contains('hidden')) {
            if (e.key.match(/[a-zA-Z0-9]/)) {
                answerInput.focus();
            }
        }
    });
});

// Animation au chargement
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});
