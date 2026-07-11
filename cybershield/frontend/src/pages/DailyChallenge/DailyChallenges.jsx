import React from 'react';
import { Row, Col, Typography } from 'antd';
import { FireOutlined } from '@ant-design/icons';
import DailyChallengeWidget from '../components/DailyChallengeWidget';
import StreakWidget from '../components/StreakWidget';
import ProgressCalendar from '../components/ProgressCalendar';

const { Title } = Typography;

const DailyChallenges = () => {
  // Get user ID from localStorage or context
  const userId = localStorage.getItem('user_id') || 'anonymous';

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <FireOutlined style={{ color: '#ff6b6b' }} /> Daily Security Challenges
      </Title>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <DailyChallengeWidget userId={userId} />
        </Col>
        <Col xs={24} lg={8}>
          <StreakWidget userId={userId} />
        </Col>
        <Col xs={24}>
          <ProgressCalendar userId={userId} />
        </Col>
      </Row>
    </div>
  );
};

export default DailyChallenges;