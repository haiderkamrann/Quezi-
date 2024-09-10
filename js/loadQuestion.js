let correctAnswer = '';

async function loadQuestion() {
    try {
        const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
        const data = await response.json();
        const questionData = data.results[0];

        document.getElementById('question-text').textContent = questionData.question;

        correctAnswer = questionData.correct_answer;

        const options = [...questionData.incorrect_answers, correctAnswer];
        options.sort(() => Math.random() - 0.5); 

        document.getElementById('option1').textContent = options[0];
        document.getElementById('option2').textContent = options[1];
        document.getElementById('option3').textContent = options[2];
        document.getElementById('option4').textContent = options[3];

        document.querySelectorAll('.option').forEach(button => {
            button.style.backgroundColor = ''; // Reset background color
            button.onclick = () => checkAnswer(button);
        });
    } catch (error) {
        console.error('Error fetching question:', error);
    }
}

function checkAnswer(selectedButton) {
    const selectedAnswer = selectedButton.textContent;

    if (selectedAnswer === correctAnswer) {
        selectedButton.style.backgroundColor = 'green';
        // alert('Correct answer!');
        setTimeout(loadNextQuestion, 2000); // Wait 2 seconds before loading the next question
    } else {
        selectedButton.style.backgroundColor = 'red';
        // alert(`Wrong answer. The correct answer is: ${correctAnswer}`);

        document.querySelectorAll('.option').forEach(button => {
            if (button.textContent === correctAnswer) {
                button.style.backgroundColor = 'green';
            }
        });

        setTimeout(loadNextQuestion, 1000); 
    }
}

function loadNextQuestion() {
    loadQuestion();  
}

window.onload = loadQuestion;
