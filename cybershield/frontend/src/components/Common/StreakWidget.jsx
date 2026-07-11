import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, List, Avatar, Typography, Spin } from 'antd';
import { FireOutlined, TrophyOutlined, CalendarOutlined } from '@ant-design/icons';
import { getLeaderboard, getChallengeStatistics } from '../api/api';

const { Title, Text } = Typography;

const StreakWidget = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get user statistics
      const statsResponse = await getChallengeStatistics(userId);
      setStats(statsResponse);
      setStreak(statsResponse.current_streak);
      setLongestStreak(statsResponse.longest_streak);
      setTotalXP(statsResponse.total_xp);
      
      // Get leaderboard
      const lbResponse = await getLeaderboard(5);
      setLeaderboard(lbResponse);
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={{ textAlign: 'center' }}>
        <Spin tip="Loading streak data..." />
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>
        <FireOutlined style={{ color: '#ff6b6b' }} /> Streak & Statistics
      </Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic
            title="Current Streak"
            value={streak}
            prefix={<FireOutlined style={{ color: '#ff6b6b' }} />}
            valueStyle={{ color: '#ff6b6b' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Longest Streak"
            value={longestStreak}
            prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Total XP"
            value={totalXP}
            prefix={<TrophyOutlined style={{ color: '#ffd93d' }} />}
            valueStyle={{ color: '#ffd93d' }}
          />
        </Col>
      </Row>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Statistic
              title="Completed"
              value={stats.completed_challenges}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Missed"
              value={stats.missed_challenges}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>
      )}

      <Title level={5}>Top Learners</Title>
      <List
        dataSource={leaderboard}
        renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar 
                  style={{ 
                    backgroundColor: index === 0 ? '#ffd93d' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#1890ff'
                  }}
                >
                  {index + 1}
                </Avatar>
              }
              title={item.user_id}
              description={`Streak: ${item.current_streak} days`}
            />
            <Text strong style={{ color: '#ffd93d' }}>{item.total_xp} XP</Text>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default StreakWidget;