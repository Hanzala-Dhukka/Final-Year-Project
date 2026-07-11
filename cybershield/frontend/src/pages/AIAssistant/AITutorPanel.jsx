import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const AITutorPanel = ({ user = "anonymous", skillLevel = "Beginner", topic = "SQL Injection" }) => {
  const [explanation, setExplanation] = useState(null);
  const [hint, setHint] = useState(null);
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [followUpQuestions, setFollowUpQuestions] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [learningHistory, setLearningHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('explain');

  // Form states
  const [payload, setPayload] = useState("' OR 1=1 --");
  const [result, setResult] = useState("correct");
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [hintNumber, setHintNumber] = useState(1);
  const [previousAttempts, setPreviousAttempts] = useState([]);

  useEffect(() => {
    loadFollowUpQuestions();
    loadRecommendations();
    loadLearningHistory();
  }, [topic, skillLevel]);

  const loadFollowUpQuestions = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai-learning/follow-up`, {
        topic,
        skill_level: skillLevel,
        user_id: user
      });
      setFollowUpQuestions(response.data.data);
    } catch (error) {
      console.error("Error loading follow-up questions:", error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ai-learning/recommendations/${user}`);
      setRecommendations(response.data.data);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    }
  };

  const loadLearningHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ai-learning/history/${user}`);
      setLearningHistory(response.data.data);
    } catch (error) {
      console.error("Error loading learning history:", error);
    }
  };

  const generateExplanation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/ai-learning/explain`, {
        topic,
        payload,
        result,
        skill_level: skillLevel,
        user_id: user,
        attempt_number: attemptNumber
      });
      setExplanation(response.data.data);
      setActiveTab('explain');
    } catch (error) {
      console.error("Error generating explanation:", error);
      alert("Failed to generate explanation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateHint = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/ai-learning/hint`, {
        topic,
        payload,
        hint_number: hintNumber,
        skill_level: skillLevel,
        user_id: user,
        previous_attempts: previousAttempts
      });
      setHint(response.data.data);
      setActiveTab('hint');
    } catch (error) {
      console.error("Error generating hint:", error);
      alert("Failed to generate hint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generatePracticeQuestion = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/ai-learning/practice`, {
        topic,
        skill_level: skillLevel,
        user_id: user,
        question_type: "multiple_choice"
      });
      setPracticeQuestion(response.data.data);
      setActiveTab('practice');
    } catch (error) {
      console.error("Error generating practice question:", error);
      alert("Failed to generate practice question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async () => {
    try {
      await axios.post(`${API_BASE_URL}/ai-learning/progress`, {
        user_id: user,
        topic,
        result,
        score: result === "correct" ? 100 : 0,
        time_taken: 0,
        attempts: attemptNumber
      });
      loadLearningHistory();
      loadRecommendations();
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleResultChange = (newResult) => {
    setResult(newResult);
    if (newResult === "correct") {
      updateProgress();
    }
  };

  return (
    <div className="ai-tutor-panel" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🤖 CyberShield AI Tutor</h2>
        <div style={styles.skillBadge}>
          Skill Level: <strong>{skillLevel}</strong>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabNavigation}>
        <button
          style={activeTab === 'explain' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('explain')}
        >
          📚 Explanation
        </button>
        <button
          style={activeTab === 'hint' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('hint')}
        >
          💡 Hint
        </button>
        <button
          style={activeTab === 'practice' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('practice')}
        >
          ✏️ Practice
        </button>
        <button
          style={activeTab === 'progress' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('progress')}
        >
          📊 Progress
        </button>
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        {/* Explanation Tab */}
        {activeTab === 'explain' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Get Personalized Explanation</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Your Payload:</label>
              <input
                type="text"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                style={styles.input}
                placeholder="Enter your payload..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Result:</label>
              <div style={styles.buttonGroup}>
                <button
                  style={result === "correct" ? styles.successButton : styles.button}
                  onClick={() => handleResultChange("correct")}
                >
                  ✅ Correct
                </button>
                <button
                  style={result === "incorrect" ? styles.errorButton : styles.button}
                  onClick={() => handleResultChange("incorrect")}
                >
                  ❌ Incorrect
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Attempt Number: {attemptNumber}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={attemptNumber}
                onChange={(e) => setAttemptNumber(parseInt(e.target.value))}
                style={styles.slider}
              />
            </div>

            <button
              onClick={generateExplanation}
              disabled={loading}
              style={styles.primaryButton}
            >
              {loading ? "Generating..." : "🔍 Explain This Attempt"}
            </button>

            {explanation && (
              <div style={styles.resultCard}>
                <div style={styles.feedbackSection}>
                  <h4 style={styles.feedbackTitle}>💬 Personalized Feedback</h4>
                  <p style={styles.feedbackText}>{explanation.personalized_feedback}</p>
                </div>

                <div style={styles.explanationSection}>
                  <h4 style={styles.explanationTitle}>📖 Explanation</h4>
                  <p style={styles.explanationText}>{explanation.explanation}</p>
                </div>

                {explanation.key_concepts && explanation.key_concepts.length > 0 && (
                  <div style={styles.conceptsSection}>
                    <h4 style={styles.conceptsTitle}>🎯 Key Concepts</h4>
                    <ul style={styles.list}>
                      {explanation.key_concepts.map((concept, index) => (
                        <li key={index} style={styles.listItem}>{concept}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {explanation.common_mistakes && explanation.common_mistakes.length > 0 && (
                  <div style={styles.mistakesSection}>
                    <h4 style={styles.mistakesTitle}>⚠️ Common Mistakes to Avoid</h4>
                    <ul style={styles.list}>
                      {explanation.common_mistakes.map((mistake, index) => (
                        <li key={index} style={styles.listItem}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {explanation.recommendations && explanation.recommendations.length > 0 && (
                  <div style={styles.recommendationsSection}>
                    <h4 style={styles.recommendationsTitle}>📚 Recommended Learning</h4>
                    <ul style={styles.list}>
                      {explanation.recommendations.map((rec, index) => (
                        <li key={index} style={styles.listItem}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {explanation.next_topics && explanation.next_topics.length > 0 && (
                  <div style={styles.nextTopicsSection}>
                    <h4 style={styles.nextTopicsTitle}>🚀 Next Topics to Explore</h4>
                    <div style={styles.topicTags}>
                      {explanation.next_topics.map((topic, index) => (
                        <span key={index} style={styles.topicTag}>{topic}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hint Tab */}
        {activeTab === 'hint' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Get Progressive Hints</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Hint Level: {hintNumber}</label>
              <input
                type="range"
                min="1"
                max="3"
                value={hintNumber}
                onChange={(e) => setHintNumber(parseInt(e.target.value))}
                style={styles.slider}
              />
              <div style={styles.hintLevels}>
                <span>1: Subtle</span>
                <span>2: Moderate</span>
                <span>3: Direct</span>
              </div>
            </div>

            <button
              onClick={generateHint}
              disabled={loading}
              style={styles.primaryButton}
            >
              {loading ? "Generating..." : "💡 Get Hint"}
            </button>

            {hint && (
              <div style={styles.resultCard}>
                <div style={styles.hintHeader}>
                  <h4 style={styles.hintTitle}>Hint Level {hint.hint_level}</h4>
                  <span style={styles.hintBadge}>
                    {hint.hint_level === 1 ? "Subtle" : hint.hint_level === 2 ? "Moderate" : "Direct"}
                  </span>
                </div>
                
                <div style={styles.hintContent}>
                  <p style={styles.hintText}>{hint.hint}</p>
                </div>

                {hint.concept_to_review && (
                  <div style={styles.conceptReview}>
                    <strong>📖 Concept to Review:</strong> {hint.concept_to_review}
                  </div>
                )}

                {hint.example && (
                  <div style={styles.exampleSection}>
                    <strong>💡 Example:</strong>
                    <code style={styles.code}>{hint.example}</code>
                  </div>
                )}

                <div style={styles.encouragement}>
                  {hint.encouragement}
                </div>

                {hint.next_hint_available && (
                  <button
                    onClick={() => setHintNumber(hintNumber + 1)}
                    style={styles.secondaryButton}
                  >
                    Next Hint ➡️
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Practice Tab */}
        {activeTab === 'practice' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Practice Questions</h3>
            
            <button
              onClick={generatePracticeQuestion}
              disabled={loading}
              style={styles.primaryButton}
            >
              {loading ? "Generating..." : "🎯 Generate Practice Question"}
            </button>

            {practiceQuestion && (
              <div style={styles.resultCard}>
                <div style={styles.difficultyBadge}>
                  Difficulty: <strong>{practiceQuestion.difficulty}</strong>
                </div>

                <h4 style={styles.questionTitle}>Question:</h4>
                <p style={styles.questionText}>{practiceQuestion.question}</p>

                {practiceQuestion.options && (
                  <div style={styles.optionsContainer}>
                    {practiceQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        style={styles.optionItem}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.answerSection}>
                  <strong>✅ Correct Answer:</strong> {practiceQuestion.correct_answer}
                </div>

                <div style={styles.explanationSection}>
                  <h4 style={styles.explanationTitle}>Explanation:</h4>
                  <p style={styles.explanationText}>{practiceQuestion.explanation}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Learning Progress</h3>

            {recommendations && (
              <div style={styles.resultCard}>
                <h4 style={styles.progressTitle}>📊 Your Stats</h4>
                <div style={styles.statsGrid}>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Skill Level</div>
                    <div style={styles.statValue}>{recommendations.skill_level}</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Recommended Difficulty</div>
                    <div style={styles.statValue}>{recommendations.recommended_difficulty}</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Hints Provided</div>
                    <div style={styles.statValue}>
                      {recommendations.hints_provided ? "Yes" : "No"}
                    </div>
                  </div>
                </div>

                {recommendations.weakest_areas && recommendations.weakest_areas.length > 0 && (
                  <div style={styles.weakAreasSection}>
                    <h4 style={styles.weakAreasTitle}>🎯 Areas to Improve</h4>
                    <ul style={styles.list}>
                      {recommendations.weakest_areas.map((area, index) => (
                        <li key={index} style={styles.listItem}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {learningHistory && (
              <div style={styles.resultCard}>
                <h4 style={styles.historyTitle}>📈 Learning History</h4>
                <div style={styles.statsGrid}>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Topics Covered</div>
                    <div style={styles.statValue}>{learningHistory.topics?.length || 0}</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Overall Accuracy</div>
                    <div style={styles.statValue}>
                      {Math.round((learningHistory.overall_accuracy || 0) * 100)}%
                    </div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Completed Labs</div>
                    <div style={styles.statValue}>{learningHistory.completed_labs || 0}</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Average Score</div>
                    <div style={styles.statValue}>
                      {Math.round(learningHistory.average_score || 0)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Follow-up Questions */}
      {followUpQuestions && (
        <div style={styles.followUpSection}>
          <h3 style={styles.followUpTitle}>🤔 Would you like to learn more?</h3>
          <div style={styles.followUpQuestions}>
            {followUpQuestions.questions.map((question, index) => (
              <button key={index} style={styles.followUpButton}>
                {question}
              </button>
            ))}
          </div>
          <div style={styles.relatedTopics}>
            <strong>Related Topics:</strong>
            <div style={styles.topicTags}>
              {followUpQuestions.related_topics.map((topic, index) => (
                <span key={index} style={styles.topicTag}>{topic}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f5f5",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "2px solid #007bff"
  },
  title: {
    margin: 0,
    color: "#007bff",
    fontSize: "24px"
  },
  skillBadge: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px"
  },
  tabNavigation: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    borderBottom: "1px solid #ddd"
  },
  tab: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#f0f0f0",
    border: "none",
    borderRadius: "8px 8px 0 0",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#666"
  },
  activeTab: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px 8px 0 0",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold"
  },
  content: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  section: {
    marginBottom: "20px"
  },
  sectionTitle: {
    color: "#333",
    marginBottom: "15px",
    fontSize: "20px"
  },
  formGroup: {
    marginBottom: "15px"
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#555"
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px"
  },
  button: {
    flex: 1,
    padding: "10px",
    border: "2px solid #ddd",
    borderRadius: "5px",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "14px"
  },
  successButton: {
    flex: 1,
    padding: "10px",
    border: "2px solid #28a745",
    borderRadius: "5px",
    backgroundColor: "#28a745",
    color: "white",
    cursor: "pointer",
    fontSize: "14px"
  },
  errorButton: {
    flex: 1,
    padding: "10px",
    border: "2px solid #dc3545",
    borderRadius: "5px",
    backgroundColor: "#dc3545",
    color: "white",
    cursor: "pointer",
    fontSize: "14px"
  },
  slider: {
    width: "100%"
  },
  hintLevels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#666",
    marginTop: "5px"
  },
  primaryButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px"
  },
  secondaryButton: {
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "10px"
  },
  resultCard: {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "8px",
    marginTop: "20px",
    border: "1px solid #dee2e6"
  },
  feedbackSection: {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#d4edda",
    borderRadius: "5px",
    borderLeft: "4px solid #28a745"
  },
  feedbackTitle: {
    marginTop: 0,
    color: "#155724"
  },
  feedbackText: {
    margin: 0,
    color: "#155724",
    lineHeight: "1.6"
  },
  explanationSection: {
    marginBottom: "20px"
  },
  explanationTitle: {
    color: "#333",
    marginBottom: "10px"
  },
  explanationText: {
    lineHeight: "1.6",
    color: "#555"
  },
  conceptsSection: {
    marginBottom: "15px"
  },
  conceptsTitle: {
    color: "#333",
    marginBottom: "10px"
  },
  list: {
    margin: 0,
    paddingLeft: "20px",
    lineHeight: "1.8"
  },
  listItem: {
    marginBottom: "5px",
    color: "#555"
  },
  mistakesSection: {
    marginBottom: "15px",
    padding: "15px",
    backgroundColor: "#fff3cd",
    borderRadius: "5px"
  },
  mistakesTitle: {
    color: "#856404",
    marginBottom: "10px"
  },
  recommendationsSection: {
    marginBottom: "15px"
  },
  recommendationsTitle: {
    color: "#333",
    marginBottom: "10px"
  },
  nextTopicsSection: {
    marginTop: "15px"
  },
  nextTopicsTitle: {
    color: "#333",
    marginBottom: "10px"
  },
  topicTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "10px"
  },
  topicTag: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "6px 12px",
    borderRadius: "15px",
    fontSize: "12px"
  },
  hintHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px"
  },
  hintTitle: {
    margin: 0,
    color: "#333"
  },
  hintBadge: {
    backgroundColor: "#ffc107",
    color: "#333",
    padding: "5px 12px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold"
  },
  hintContent: {
    padding: "15px",
    backgroundColor: "white",
    borderRadius: "5px",
    marginBottom: "15px"
  },
  hintText: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#333",
    margin: 0
  },
  conceptReview: {
    padding: "10px",
    backgroundColor: "#e7f3ff",
    borderRadius: "5px",
    marginBottom: "10px"
  },
  exampleSection: {
    padding: "10px",
    backgroundColor: "#f8f9fa",
    borderRadius: "5px",
    marginBottom: "10px"
  },
  code: {
    display: "block",
    marginTop: "5px",
    padding: "8px",
    backgroundColor: "#333",
    color: "#0f0",
    borderRadius: "3px",
    fontFamily: "monospace"
  },
  encouragement: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#28a745",
    marginTop: "15px"
  },
  questionTitle: {
    color: "#333",
    marginBottom: "10px"
  },
  questionText: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#555",
    marginBottom: "20px"
  },
  optionsContainer: {
    marginBottom: "20px"
  },
  optionItem: {
    padding: "12px",
    marginBottom: "8px",
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px"
  },
  answerSection: {
    padding: "15px",
    backgroundColor: "#d4edda",
    borderRadius: "5px",
    marginBottom: "15px",
    borderLeft: "4px solid #28a745"
  },
  difficultyBadge: {
    display: "inline-block",
    backgroundColor: "#ffc107",
    color: "#333",
    padding: "5px 12px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "15px"
  },
  progressTitle: {
    color: "#333",
    marginBottom: "15px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "20px"
  },
  statItem: {
    padding: "15px",
    backgroundColor: "white",
    borderRadius: "5px",
    textAlign: "center",
    border: "1px solid #dee2e6"
  },
  statLabel: {
    fontSize: "12px",
    color: "#666",
    marginBottom: "5px"
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#007bff"
  },
  weakAreasSection: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#fff3cd",
    borderRadius: "5px"
  },
  weakAreasTitle: {
    color: "#856404",
    marginBottom: "10px"
  },
  historyTitle: {
    color: "#333",
    marginBottom: "15px"
  },
  followUpSection: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    border: "2px solid #007bff"
  },
  followUpTitle: {
    color: "#333",
    marginBottom: "15px"
  },
  followUpQuestions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px"
  },
  followUpButton: {
    padding: "12px",
    backgroundColor: "#e7f3ff",
    color: "#007bff",
    border: "1px solid #007bff",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left"
  },
  relatedTopics: {
    marginTop: "15px"
  }
};

export default AITutorPanel;