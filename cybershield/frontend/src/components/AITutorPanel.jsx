import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AITutorPanel = ({
  topic,
  payload,
  result,
  skillLevel,
  user_id = "anonymous",
  lab_id = null,
  attemptNumber = 1,
  onComplete
}) => {
  const [explanation, setExplanation] = useState(null);
  const [hint, setHint] = useState(null);
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hintNumber, setHintNumber] = useState(1);
  const [previousHints, setPreviousHints] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [activeTab, setActiveTab] = useState('explanation'); // 'explanation', 'hint', 'practice', 'progress'

  // Generate explanation when component mounts or parameters change
  useEffect(() => {
    if (topic && payload && result) {
      generateExplanation();
    }
  }, [topic, payload, result, skillLevel]);

  const generateExplanation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/ai-learning/explain`, {
        topic,
        payload,
        result,
        skill_level: skillLevel,
        user_id,
        lab_id,
        attempt_number: attemptNumber,
        previous_hints: previousHints
      });

      if (response.data.success) {
        setExplanation(response.data.data);
        
        // Auto-save progress
        await saveProgress(response.data.data);
      }
    } catch (error) {
      console.error('Error generating explanation:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (data) => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/ai-learning/progress`, {
        user_id,
        topic,
        result,
        score: (data.confidence_score || 0.5) * 100,
        attempts: attemptNumber,
        lab_id
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const requestHint = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/ai-learning/hint`, {
        topic,
        payload,
        hint_number: hintNumber,
        skill_level: skillLevel,
        user_id,
        lab_id,
        previous_hints: previousHints
      });

      if (response.data.success) {
        const hintData = response.data.data;
        setHint(hintData);
        setPreviousHints([...previousHints, hintData.hint]);
        setShowHint(true);
        
        if (hintData.next_hint_available) {
          setHintNumber(hintNumber + 1);
        }
      }
    } catch (error) {
      console.error('Error generating hint:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePracticeQuestion = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/ai-learning/practice`, {
        topic,
        skill_level: skillLevel,
        user_id,
        question_type: 'multiple_choice'
      });

      if (response.data.success) {
        setPracticeQuestion(response.data.data);
        setActiveTab('practice');
      }
    } catch (error) {
      console.error('Error generating practice question:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/ai-learning/progress/${user_id}`);
      if (response.data.success) {
        setExplanation(prev => ({
          ...prev,
          progress: response.data.data
        }));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'progress') {
      loadUserProgress();
    }
  }, [activeTab]);

  const renderExplanation = () => {
    if (!explanation) return null;

    return (
      <div className="explanation-container">
        <div className="explanation-header">
          <h3>🤖 CyberShield AI Tutor</h3>
          <span className={`result-badge ${result}`}>
            {result === 'correct' ? '✅ Correct' : '❌ Incorrect'}
          </span>
        </div>

        <div className="explanation-content">
          <div className="feedback-section">
            <h4>Feedback</h4>
            <p>{explanation.personalized_feedback}</p>
          </div>

          <div className="explanation-text">
            <h4>Explanation</h4>
            <div className="explanation-body">
              {explanation.explanation}
            </div>
          </div>

          {explanation.key_concept && (
            <div className="concept-section">
              <h4>💡 Key Concept</h4>
              <p>{explanation.key_concept}</p>
            </div>
          )}

          {explanation.why_it_worked && (
            <div className="why-section">
              <h4>🔍 Why It Worked</h4>
              <p>{explanation.why_it_worked}</p>
            </div>
          )}

          {explanation.prevention && (
            <div className="prevention-section">
              <h4>🛡️ Prevention</h4>
              <p>{explanation.prevention}</p>
            </div>
          )}

          {explanation.real_world_example && (
            <div className="example-section">
              <h4>🌍 Real-World Example</h4>
              <p>{explanation.real_world_example}</p>
            </div>
          )}
        </div>

        {explanation.recommendations && explanation.recommendations.length > 0 && (
          <div className="recommendations-section">
            <h4>📚 Recommendations</h4>
            <ul>
              {explanation.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {explanation.next_topics && explanation.next_topics.length > 0 && (
          <div className="next-topics-section">
            <h4>🎯 Next Topics</h4>
            <div className="topics-grid">
              {explanation.next_topics.map((topic, index) => (
                <span key={index} className="topic-tag">{topic}</span>
              ))}
            </div>
          </div>
        )}

        {explanation.follow_up_questions && explanation.follow_up_questions.length > 0 && (
          <div className="follow-up-section">
            <h4>🤔 Would you like to learn more?</h4>
            <div className="follow-up-questions">
              {explanation.follow_up_questions.map((question, index) => (
                <button key={index} className="follow-up-btn">
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="action-buttons">
          {result === 'incorrect' && (
            <button 
              onClick={() => setShowHint(!showHint)}
              className="hint-toggle-btn"
            >
              {showHint ? 'Hide Hint' : '💡 Get Hint'}
            </button>
          )}
          <button onClick={generatePracticeQuestion} className="practice-btn">
            📝 Practice Question
          </button>
        </div>
      </div>
    );
  };

  const renderHint = () => {
    if (!hint && !showHint) {
      return (
        <div className="hint-container">
          <p>Need help? Request a hint to get guidance.</p>
          <button 
            onClick={requestHint} 
            disabled={loading || hintNumber > 3}
            className="hint-btn"
          >
            {loading ? 'Generating Hint...' : `💡 Get Hint ${hintNumber}/3`}
          </button>
        </div>
      );
    }

    if (!hint && showHint) {
      return (
        <div className="hint-container">
          <p>Click the button below to get a hint.</p>
          <button 
            onClick={requestHint} 
            disabled={loading || hintNumber > 3}
            className="hint-btn"
          >
            {loading ? 'Generating Hint...' : `💡 Get Hint ${hintNumber}/3`}
          </button>
        </div>
      );
    }

    return (
      <div className="hint-container">
        <div className="hint-content">
          <h4>💡 Hint from CyberShield AI Tutor</h4>
          <p>{hint.hint}</p>
          {hint.what_to_consider && (
            <div className="what-to-consider">
              <strong>What to consider:</strong> {hint.what_to_consider}
            </div>
          )}
        </div>
        {hint.next_hint_available && (
          <button 
            onClick={requestHint} 
            disabled={loading}
            className="hint-btn"
          >
            {loading ? 'Generating Next Hint...' : '💡 Next Hint'}
          </button>
        )}
      </div>
    );
  };

  const renderPracticeQuestion = () => {
    if (!practiceQuestion) {
      return (
        <div className="practice-container">
          <p>Test your knowledge with a practice question!</p>
          <button onClick={generatePracticeQuestion} className="practice-btn">
            📝 Generate Practice Question
          </button>
        </div>
      );
    }

    return (
      <div className="practice-container">
        <h4>📝 Practice Question</h4>
        <div className="difficulty-badge">{practiceQuestion.difficulty}</div>
        <p className="question-text">{practiceQuestion.question}</p>

        {practiceQuestion.options && (
          <div className="options-grid">
            {practiceQuestion.options.map((option, index) => (
              <div key={index} className="option-item">
                {option}
              </div>
            ))}
          </div>
        )}

        <div className="answer-section">
          <h5>Correct Answer:</h5>
          <p className="correct-answer">{practiceQuestion.correct_answer}</p>
        </div>

        <div className="explanation-section">
          <h5>Explanation:</h5>
          <p>{practiceQuestion.explanation}</p>
        </div>

        <button 
          onClick={generatePracticeQuestion}
          className="new-question-btn"
        >
          🔄 New Question
        </button>
      </div>
    );
  };

  const renderProgress = () => {
    if (!explanation?.progress) {
      return (
        <div className="progress-container">
          <p>Loading progress...</p>
        </div>
      );
    }

    const progress = explanation.progress;

    return (
      <div className="progress-container">
        <h4>📊 Your Learning Progress</h4>
        
        <div className="progress-stats">
          <div className="stat-card">
            <div className="stat-label">Skill Level</div>
            <div className="stat-value">{progress.skill_level}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Completed Topics</div>
            <div className="stat-value">{progress.completed_topics}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Average Score</div>
            <div className="stat-value">{progress.average_score}%</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Total Attempts</div>
            <div className="stat-value">{progress.total_attempts}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Accuracy</div>
            <div className="stat-value">{Math.round(progress.accuracy * 100)}%</div>
          </div>
        </div>

        {progress.weakest_area && (
          <div className="weak-area">
            <h5>📉 Area to Improve</h5>
            <p>{progress.weakest_area}</p>
          </div>
        )}

        {progress.strongest_area && (
          <div className="strong-area">
            <h5>🌟 Strongest Area</h5>
            <p>{progress.strongest_area}</p>
          </div>
        )}

        {progress.learning_path && (
          <div className="learning-path">
            <h5>🎯 Your Learning Path</h5>
            <div className="path-items">
              {progress.learning_path.map((item, index) => (
                <div key={index} className="path-item">
                  <span className="path-number">{index + 1}</span>
                  <span className="path-name">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ai-tutor-panel">
      <div className="tutor-header">
        <h2>🤖 AI Security Tutor</h2>
        <div className="tabs">
          <button 
            className={activeTab === 'explanation' ? 'active' : ''}
            onClick={() => setActiveTab('explanation')}
          >
            Explanation
          </button>
          <button 
            className={activeTab === 'hint' ? 'active' : ''}
            onClick={() => setActiveTab('hint')}
          >
            Hint
          </button>
          <button 
            className={activeTab === 'practice' ? 'active' : ''}
            onClick={() => setActiveTab('practice')}
          >
            Practice
          </button>
          <button 
            className={activeTab === 'progress' ? 'active' : ''}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
        </div>
      </div>

      <div className="tutor-content">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>AI is thinking...</p>
          </div>
        )}

        {activeTab === 'explanation' && renderExplanation()}
        {activeTab === 'hint' && renderHint()}
        {activeTab === 'practice' && renderPracticeQuestion()}
        {activeTab === 'progress' && renderProgress()}
      </div>

      <style jsx>{`
        .ai-tutor-panel {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 24px;
          color: white;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          max-width: 800px;
          margin: 20px auto;
        }

        .tutor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tutor-header h2 {
          margin: 0;
          font-size: 24px;
        }

        .tabs {
          display: flex;
          gap: 8px;
        }

        .tabs button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
        }

        .tabs button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .tabs button.active {
          background: white;
          color: #667eea;
          font-weight: bold;
        }

        .tutor-content {
          background: white;
          border-radius: 8px;
          padding: 20px;
          color: #333;
          min-height: 300px;
          position: relative;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-radius: 8px;
          z-index: 10;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .explanation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .result-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
        }

        .result-badge.correct {
          background: #10b981;
          color: white;
        }

        .result-badge.incorrect {
          background: #ef4444;
          color: white;
        }

        .explanation-content {
          margin-bottom: 20px;
        }

        .explanation-content h4 {
          color: #667eea;
          margin-top: 16px;
          margin-bottom: 8px;
        }

        .explanation-body {
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .recommendations-section ul {
          list-style: none;
          padding: 0;
        }

        .recommendations-section li {
          padding: 8px;
          margin: 4px 0;
          background: #f3f4f6;
          border-left: 3px solid #667eea;
          border-radius: 4px;
        }

        .topics-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .topic-tag {
          background: #667eea;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
        }

        .follow-up-questions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .follow-up-btn {
          background: #f3f4f6;
          border: 1px solid #667eea;
          color: #667eea;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s;
        }

        .follow-up-btn:hover {
          background: #667eea;
          color: white;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .hint-toggle-btn,
        .practice-btn,
        .hint-btn,
        .new-question-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
        }

        .hint-toggle-btn:hover,
        .practice-btn:hover,
        .hint-btn:hover,
        .new-question-btn:hover {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .hint-btn:disabled,
        .practice-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }

        .hint-content {
          background: #fef3c7;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }

        .what-to-consider {
          margin-top: 12px;
          padding: 8px;
          background: white;
          border-radius: 4px;
        }

        .practice-container,
        .hint-container,
        .progress-container {
          text-align: center;
          padding: 20px;
        }

        .difficulty-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .question-text {
          font-size: 18px;
          font-weight: 600;
          margin: 16px 0;
        }

        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 20px 0;
        }

        .option-item {
          padding: 12px;
          background: #f3f4f6;
          border-radius: 6px;
          text-align: left;
        }

        .answer-section,
        .explanation-section {
          text-align: left;
          margin: 16px 0;
          padding: 12px;
          background: #f0fdf4;
          border-radius: 6px;
        }

        .correct-answer {
          font-weight: bold;
          color: #10b981;
        }

        .progress-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin: 20px 0;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
        }

        .weak-area,
        .strong-area {
          padding: 12px;
          border-radius: 6px;
          margin: 12px 0;
        }

        .weak-area {
          background: #fee;
          border-left: 4px solid #ef4444;
        }

        .strong-area {
          background: #efe;
          border-left: 4px solid #10b981;
        }

        .path-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .path-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: #f3f4f6;
          border-radius: 6px;
        }

        .path-number {
          background: #667eea;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .path-name {
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export default AITutorPanel;