import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Quiz.css';
import KnowledgeGraph from '../KnowledgeGraph/KnowledgeGraph';
import { childSessionHeaders, hasChildSession } from '../../childSession';

const QUIZ_RETRY_MESSAGE = 'I couldn’t make your quiz just now. Please try again in a little bit.';
const SCORE_RETRY_MESSAGE = 'I couldn’t save your answers just now. Please try again.';
const GRAPH_RETRY_MESSAGE = 'Your learning map isn’t loading right now. Ask a grown-up to try again soon.';
const REVIEW_CHECK_MESSAGE = 'I couldn’t check your review list just now. Please try again soon.';

async function readJsonResponse(response, fallbackMessage) {
  const body = await response.text();
  if (!body.trim()) {
    console.error('Quiz API returned an empty response.', { status: response.status });
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    console.error('Quiz API returned invalid JSON.', { status: response.status, error });
    throw new Error(fallbackMessage);
  }
}

function localEndOfToday() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

function localStartOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export default function Quiz({ objectName, language = 'english', review = false, childProfileId = '' }) {
  const [questions, setQuestions] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [questionCount, setQuestionCount] = useState(3);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dueReviews, setDueReviews] = useState(null);
  const [learningGraph, setLearningGraph] = useState(null);
  const [learningGraphLoading, setLearningGraphLoading] = useState(false);
  const [learningGraphError, setLearningGraphError] = useState(false);
  const graphRequestId = useRef(0);

  const loadLearningGraph = useCallback(async (focusName = '', page = 1) => {
    const requestId = ++graphRequestId.current;
    const queryParams = new URLSearchParams();
    if (childProfileId && !hasChildSession()) queryParams.set('child_profile_id', childProfileId);
    if (focusName) {
      queryParams.set('focus', focusName);
      queryParams.set('page', String(page));
    }
    setLearningGraphLoading(true);
    setLearningGraphError(false);
    try {
      const response = await fetch(`/api/discovery?${queryParams.toString()}`, {
        credentials: 'include',
        headers: childSessionHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error('Learning graph request failed.', { status: response.status, message: data.message });
        throw new Error('Learning graph request failed.');
      }
      if (requestId === graphRequestId.current) setLearningGraph(data);
    } catch (error) {
      console.error('Could not load learning graph.', error);
      if (requestId === graphRequestId.current) setLearningGraphError(true);
    } finally {
      if (requestId === graphRequestId.current) setLearningGraphLoading(false);
    }
  }, [childProfileId]);

  useEffect(() => {
    if (!review) return;
    let ignore = false;
    setDueReviews(null);
    const queryParams = new URLSearchParams();
    if (childProfileId && !hasChildSession()) queryParams.set('child_profile_id', childProfileId);
    queryParams.set('due_from', localStartOfToday());
    queryParams.set('due_through', localEndOfToday());
    const query = `?${queryParams.toString()}`;
    fetch(`/api/quiz/due${query}`, { credentials: 'include', headers: childSessionHeaders() })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          console.error('Review schedule request failed.', { status: response.status, message: data.message });
          throw new Error('Review schedule request failed.');
        }
        return data;
      })
      .then((data) => { if (!ignore) setDueReviews(data); })
      .catch((error) => {
        console.error('Could not load review schedule.', error);
        if (!ignore) setDueReviews({ available: false, error: true });
      });
    setLearningGraph(null);
    loadLearningGraph();
    return () => {
      ignore = true;
      graphRequestId.current += 1;
    };
  }, [review, childProfileId, loadLearningGraph]);

  const startQuiz = async () => {
    if (review && !dueReviews?.available) return;
    setIsLoading(true);
    setError('');
    setScore(null);
    setAnswers({});
    try {
      const response = await fetch(review ? '/api/quiz/review' : '/api/quiz', {
        method: 'POST',
        credentials: 'include',
        headers: childSessionHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          ...(review ? {} : { object_name: objectName }),
          question_count: questionCount,
          language,
          ...(!hasChildSession() && childProfileId ? { child_profile_id: childProfileId } : {}),
        }),
      });
      const data = await readJsonResponse(response, QUIZ_RETRY_MESSAGE);
      if (!response.ok) {
        console.error('Quiz request failed.', { status: response.status, message: data.message });
        throw new Error(QUIZ_RETRY_MESSAGE);
      }
      if (!data.available) {
        console.warn('Quiz is unavailable.', { message: data.message });
        throw new Error(QUIZ_RETRY_MESSAGE);
      }
      setQuestions(data.questions || []);
      setQuizId(data.quizId);
    } catch (quizError) {
      console.error('Could not generate quiz.', quizError);
      setError(QUIZ_RETRY_MESSAGE);
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
        credentials: 'include',
        headers: childSessionHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          score: result,
          ...(!hasChildSession() && childProfileId ? { child_profile_id: childProfileId } : {}),
        }),
      });
      const data = await readJsonResponse(response, SCORE_RETRY_MESSAGE);
      if (!response.ok) {
        console.error('Saving quiz result failed.', { status: response.status, message: data.message });
        throw new Error(SCORE_RETRY_MESSAGE);
      }
      setScore(result);
    } catch (scoreError) {
      console.error('Could not save quiz result.', scoreError);
      setError(SCORE_RETRY_MESSAGE);
    }
  };

  return (
    <section className="quiz-card" aria-labelledby="quiz-heading">
      <div className="quiz-heading">
        <span aria-hidden="true">🧠</span>
        <div>
          <h3 id="quiz-heading">{review ? 'Review what you learned' : 'Quick quiz'}</h3>
          <p>{review ? 'Revisit discoveries and see how ideas connect.' : `See what you remember about ${objectName}.`}</p>
        </div>
      </div>

      {review && learningGraphLoading && !learningGraph && (
        <p className="review-due-note">Loading your captured objects…</p>
      )}
      {review && learningGraphError && (
        <p className="review-due-note">{GRAPH_RETRY_MESSAGE}</p>
      )}
      {review && learningGraph && (
        <KnowledgeGraph
          discoveries={learningGraph.discoveries || []}
          edges={learningGraph.edges || []}
          focusedObject={learningGraph.focusedObject}
          totalConnections={learningGraph.totalConnections || 0}
          page={learningGraph.page || 1}
          pageCount={learningGraph.pageCount || 1}
          loading={learningGraphLoading}
          hasError={learningGraphError}
          onFocusChange={loadLearningGraph}
          emptyMessage={learningGraph.message}
        />
      )}

      {review && dueReviews === null && !questions && (
        <p className="review-due-note">Checking your review schedule…</p>
      )}
      {review && dueReviews && !dueReviews.available && !questions && (
        <p className="review-due-note review-next-date">
          {dueReviews.error
            ? REVIEW_CHECK_MESSAGE
            : dueReviews.nextReviewAt
            ? `Your next discovery review is due ${new Date(dueReviews.nextReviewAt).toLocaleDateString()}.`
            : dueReviews.message || 'Explore an item first. It will appear here when it is ready to review.'}
        </p>
      )}

      {review && dueReviews?.overdueSince && !questions && (
        <p className="review-due-note review-next-date">
          A review was missed on {new Date(dueReviews.overdueSince).toLocaleDateString()}. It’s ready to catch up now.
        </p>
      )}

      {review && dueReviews?.available && dueReviews.nextReviewAt && !questions && (
        <p className="review-due-note review-next-date">
          Next scheduled review: {new Date(dueReviews.nextReviewAt).toLocaleDateString()}. You can review early anytime.
        </p>
      )}

      {!questions && (!review || dueReviews?.available) && (
        <div className={`quiz-start${review ? ' quiz-start-review' : ''}`}>
          {review && (
            <p className="review-due-note">
              {dueReviews.dueObjectNames?.length
                ? `Ready to revisit: ${dueReviews.dueObjectNames.join(', ')}`
                : `Review early: ${dueReviews.objectNames.join(', ')}`}
            </p>
          )}
          <label htmlFor={`quiz-count-${review ? 'review' : objectName}`}>Number of questions</label>
          <select
            id={`quiz-count-${review ? 'review' : objectName}`}
            value={questionCount}
            onChange={(event) => setQuestionCount(Number(event.target.value))}
          >
            <option value={3}>3 questions</option>
            <option value={5}>5 questions</option>
            <option value={10}>10 questions</option>
          </select>
          <button type="button" className={`quiz-primary-button${isLoading ? ' is-loading' : ''}`} onClick={startQuiz} disabled={isLoading}>
            {isLoading
              ? 'Making your quiz...'
              : review
                ? dueReviews.dueObjectNames?.length ? 'Review due discoveries' : 'Review discoveries early'
                : 'Start quiz'}
          </button>
        </div>
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
          <div className="quiz-review" aria-label="Answer review">
            <h4>Let&apos;s review</h4>
            {questions.map((question, questionIndex) => {
              const selectedAnswer = answers[questionIndex];
              const isCorrect = selectedAnswer === question.answer;
              return (
                <div className={`quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`} key={question.question}>
                  <strong>{questionIndex + 1}. {question.question}</strong>
                  <span className={`quiz-result-label ${isCorrect ? 'correct-label' : 'incorrect-label'}`}>
                    {isCorrect ? 'Correct!' : "Let's learn this one"}
                  </span>
                  {!isCorrect && (
                    <p>Your answer: {question.options[selectedAnswer]}</p>
                  )}
                  <p><b>Right answer:</b> {question.options[question.answer]}</p>
                  <p><b>Why:</b> {question.explanation}</p>
                </div>
              );
            })}
          </div>
          <button type="button" className="quiz-secondary-button" onClick={startQuiz}>Try another quiz</button>
        </div>
      )}
    </section>
  );
}
