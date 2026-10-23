import React, { useState } from 'react';
import './Quiz.css';

export default function Quiz({ objectName }) {
  const [questions, setQuestions] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const startQuiz = async () => {
    setIsLoading(true);
    setError('');
    setScore(null);
    setAnswers({});
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_name: objectName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not make a quiz.');
      if (!data.available) throw new Error(data.message || 'A quiz is not available yet.');
      setQuestions(data.questions || []);
      setQuizId(data.quizId);
    } catch (quizError) {
      setError(quizError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitQuiz = async (event) => {
    event.preventDefault();
    if (!questions || Object.keys(answers).length !== questions.length) {
      setError('Choose an answer for each question first.');
      return;
    }
    const result = questions.reduce(
      (total, question, index) => total + (answers[index] === question.answer ? 1 : 0),
      0
    );
    try {
      const response = await fetch(`/api/quiz/${quizId}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: result }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save your quiz result.');
      setScore(result);
    } catch (scoreError) {
      setError(scoreError.message);
    }
  };

  return (
    <section className="quiz-card" aria-labelledby="quiz-heading">
      <div className="quiz-heading">
        <span aria-hidden="true">🧠</span>
        <div>
          <h3 id="quiz-heading">Quick quiz</h3>
          <p>See what you remember about {objectName}.</p>
        </div>
      </div>

      {!questions && (
        <button type="button" className="quiz-primary-button" onClick={startQuiz} disabled={isLoading}>
          {isLoading ? 'Making your quiz...' : 'Start quiz'}
        </button>
      )}

      {error && <p className="quiz-error" role="alert">{error}</p>}

      {questions && score === null && (
        <form onSubmit={submitQuiz}>
          {questions.map((question, questionIndex) => (
            <fieldset className="quiz-question" key={question.question}>
              <legend>{questionIndex + 1}. {question.question}</legend>
              {question.options.map((option, optionIndex) => (
                <label key={option}>
                  <input
                    type="radio"
                    name={`question-${questionIndex}`}
                    checked={answers[questionIndex] === optionIndex}
                    onChange={() => setAnswers({ ...answers, [questionIndex]: optionIndex })}
                  />
                  {option}
                </label>
              ))}
            </fieldset>
          ))}
          <button type="submit" className="quiz-primary-button">Check answers</button>
        </form>
      )}

      {score !== null && (
        <div className="quiz-result">
          <strong>You got {score} out of {questions.length}!</strong>
          <p>{score === questions.length ? 'Amazing remembering!' : 'Nice try. Keep exploring and learning!'}</p>
          <button type="button" className="quiz-secondary-button" onClick={startQuiz}>Try another quiz</button>
        </div>
      )}
    </section>
  );
}
