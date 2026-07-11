import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Tag, Statistic, Row, Col, Modal, message, Spin } from 'antd';
import { FireOutlined, ClockCircleOutlined, TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import { getTodaysChallenge, submitChallenge } from '../api/api';

const { Title, Text, Paragraph } = Typography;

const DailyChallengeWidget = ({ userId }) => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetchChallenge();
    const timer = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, [userId]);

  const fetchChallenge = async () => {
    setLoading(true);
    try {
      const response = await getTodaysChallenge(userId);
      if (response.success) {
        setChallenge(response.challenge);
        setTimeRemaining(response.time_remaining);
        setStreak(response.current_streak);
        setLongestStreak(response.longest_streak);
        setTotalXP(response.total_xp);
        setCompleted(response.user_completed);
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
      message.error('Failed to load today\'s challenge');
    } finally {
      setLoading(false);
    }
  };

  const updateTimeRemaining = () => {
    if (challenge && challenge.expires_at) {
      const expiresAt = new Date(challenge.expires_at);
      const now = new Date();
      const diff = expiresAt - now;
      
      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      message.warning('Please enter your answer');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await submitChallenge({
        challenge_id: challenge.challenge_id,
        user_id: userId,
        payload: userAnswer,
        time_taken: 0
      });
      
      setResult(response);
      if (response.is_correct) {
        setCompleted(true);
        setStreak(response.streak);
        setTotalXP(totalXP + response.xp_earned);
        message.success(`🎉 Correct! You earned ${response.xp_earned} XP!`);
      } else {
        message.error('Incorrect answer. Try again!');
      }
      setShowExplanation(true);
    } catch (error) {
      console.error('Error submitting challenge:', error);
      message.error('Failed to submit challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Easy': 'green',
      'Medium': 'orange',
      'Hard': 'red'
    };
    return colors[difficulty] || 'blue';
  };

  if (loading) {
    return (
      <Card style={{ textAlign: 'center' }}>
        <Spin tip="Loading today's challenge..." />
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card>
        <Title level={4}>No Challenge Available</Title>
        <Text>Check back later for today's security challenge!</Text>
      </Card>
    );
  }

  return (
    <>
      <Card 
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none'
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <div>
                <FireOutlined style={{ fontSize: 24, color: '#ff6b6b' }} />
                <Title level={3} style={{ color: 'white', display: 'inline', marginLeft: 8 }}>
                  Today's Security Challenge
                </Title>
              </div>
              <Tag color="blue" style={{ fontSize: 16 }}>
                {challenge.category}
              </Tag>
            </Space>
          </Col>
          
          <Col span={24}>
            <Tag color={getDifficultyColor(challenge.difficulty)} style={{ fontSize: 14 }}>
              {challenge.difficulty}
            </Tag>
            <Title level={4} style={{ color: 'white', marginTop: 8 }}>
              {challenge.title}
            </Title>
          </Col>
          
          <Col span={24}>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)' }}>
              {challenge.description}
            </Paragraph>
          </Col>
          
          <Col span={24}>
            <Text strong style={{ color: 'white' }}>Question:</Text>
            <Paragraph style={{ color: 'rgba(255,255,255,0.95)', marginTop: 4 }}>
              {challenge.question}
            </Paragraph>
          </Col>
          
          {!completed && (
            <Col span={24}>
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ color: 'white' }}>Your Answer:</Text>
                <textarea
                  rows={4}
                  style={{ 
                    width: '100%', 
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 14
                  }}
                  placeholder="Enter your payload or solution..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={completed}
                />
              </div>
            </Col>
          )}
          
          <Col span={24}>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Reward</span>}
                  value={challenge.xp_reward}
                  valueStyle={{ color: '#ffd93d' }}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Expires In</span>}
                  value={timeRemaining}
                  valueStyle={{ color: '#ff6b6b' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Current Streak</span>}
                  value={streak}
                  valueStyle={{ color: '#69f0ae' }}
                  prefix={<FireOutlined />}
                />
              </Col>
            </Row>
          </Col>
          
          <Col span={24}>
            {!completed ? (
              <Button
                type="primary"
                size="large"
                block
                onClick={handleSubmit}
                loading={submitting}
                style={{ 
                  marginTop: 16,
                  height: 48,
                  fontSize: 16,
                  background: '#ffd93d',
                  borderColor: '#ffd93d',
                  color: '#333'
                }}
              >
                Submit Challenge
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                block
                onClick={() => setShowExplanation(true)}
                style={{ 
                  marginTop: 16,
                  height: 48,
                  fontSize: 16,
                  background: '#52c41a',
                  borderColor: '#52c41a'
                }}
              >
                View Explanation
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      <Modal
        title="Challenge Result"
        visible={showExplanation}
        onCancel={() => setShowExplanation(false)}
        footer={null}
        width={700}
      >
        {result && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Tag color={result.is_correct ? 'green' : 'red'} style={{ fontSize: 16 }}>
                {result.is_correct ? '✓ Correct' : '✗ Incorrect'}
              </Tag>
              {result.is_correct && (
                <Text strong style={{ marginLeft: 8, fontSize: 16 }}>
                  +{result.xp_earned} XP
                </Text>
              )}
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Feedback:</Text>
              <Paragraph>{result.feedback}</Paragraph>
            </div>
            
            <div>
              <Text strong>Explanation:</Text>
              <Paragraph style={{ whiteSpace: 'pre-line' }}>
                {result.explanation}
              </Paragraph>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

export default DailyChallengeWidget;