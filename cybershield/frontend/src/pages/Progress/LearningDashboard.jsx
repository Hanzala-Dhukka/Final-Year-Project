import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Typography, Card, Progress, Badge, Button, List, Avatar, Statistic, Tabs } from 'antd';
import { TrophyOutlined, FireOutlined, CheckCircleOutlined, DownloadOutlined, ArrowRightOutlined } from '@ant-design/icons';
import API from '../api/api';

const { Title, Text, Paragraph } = Typography;

const LearningDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const userId = localStorage.getItem('user_id') || 'anonymous';

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/progress/dashboard/${userId}`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Set default data for demo
      setDashboardData({
        user_id: userId,
        xp: 1850,
        level: 7,
        skill: "Advanced",
        average: 91,
        completed_labs: 22,
        total_labs: 50,
        progress_percentage: 78,
        current_streak: 5,
        longest_streak: 12,
        badges: ["SQL Hunter", "Daily Warrior", "Cyber Explorer", "First Blood"],
        category_mastery: [
          { category: "SQL Injection", mastery_percentage: 92, color: "green" },
          { category: "XSS", mastery_percentage: 65, color: "yellow" },
          { category: "CSRF", mastery_percentage: 35, color: "orange" },
          { category: "SSRF", mastery_percentage: 20, color: "red" }
        ],
        next_learning_path: ["CSRF", "Authentication", "SSRF", "OAuth", "JWT Security"],
        certificate_eligible: true
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async () => {
    setCertificateLoading(true);
    try {
      const response = await API.get(`/progress/certificate/${userId}`);
      if (response.data.data.certificate) {
        // In a real app, this would download the PDF
        console.log('Certificate generated:', response.data.data);
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
    } finally {
      setCertificateLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Title level={2}>Loading Dashboard...</Title>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/dashboard" style={{ color: '#1890ff' }}>
          &larr; Back to Dashboard
        </Link>
        <Title level={2} style={{ marginTop: 16 }}>
          🎓 Learning Dashboard
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* User Profile & XP */}
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Avatar size={64} style={{ backgroundColor: '#1890ff', marginBottom: 16 }}>
                {userId.charAt(0).toUpperCase()}
              </Avatar>
              <Title level={4}>{userId}</Title>
              <Text type="secondary">Level {dashboardData?.level} • {dashboardData?.skill}</Text>
              
              <div style={{ marginTop: 24 }}>
                <Statistic 
                  title="Total XP" 
                  value={dashboardData?.xp} 
                  valueStyle={{ color: '#faad14' }}
                  prefix={<TrophyOutlined />}
                />
              </div>
              
              <div style={{ marginTop: 16 }}>
                <Progress 
                  percent={dashboardData?.progress_percentage} 
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                  {dashboardData?.xp} / {dashboardData?.level * 300} XP
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Progress Overview */}
        <Col xs={24} md={16}>
          <Card title="📊 Progress Overview">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="Completed Labs" 
                  value={dashboardData?.completed_labs}
                  valueStyle={{ color: '#3f8600' }}
                  suffix={`/ ${dashboardData?.total_labs}`}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Average Score" 
                  value={dashboardData?.average}
                  valueStyle={{ color: '#1890ff' }}
                  suffix="%"
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Current Streak" 
                  value={dashboardData?.current_streak}
                  valueStyle={{ color: '#ff6b6b' }}
                  prefix={<FireOutlined />}
                  suffix="days"
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Category Mastery */}
        <Col xs={24} md={12}>
          <Card title="📚 Category Mastery">
            <List
              dataSource={dashboardData?.category_mastery}
              renderItem={item => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>{item.category}</Text>
                      <Text>{item.mastery_percentage}%</Text>
                    </div>
                    <Progress 
                      percent={item.mastery_percentage} 
                      strokeColor={
                        item.color === 'green' ? '#52c41a' :
                        item.color === 'yellow' ? '#faad14' :
                        item.color === 'orange' ? '#fa8c16' : '#ff4d4f'
                      }
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Achievements */}
        <Col xs={24} md={12}>
          <Card title="🏅 Achievements">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {dashboardData?.badges.map((badge, index) => (
                <Badge 
                  key={index}
                  count={badge}
                  style={{ 
                    backgroundColor: '#52c41a',
                    cursor: 'pointer'
                  }}
                >
                  <Avatar 
                    size={64} 
                    style={{ backgroundColor: '#1890ff' }}
                  >
                    🏆
                  </Avatar>
                </Badge>
              ))}
            </div>
            <Button 
              type="link" 
              onClick={() => API.get(`/progress/achievements/${userId}`)}
              style={{ marginTop: 16 }}
            >
              View All Achievements
            </Button>
          </Card>
        </Col>

        {/* Learning Roadmap */}
        <Col xs={24}>
          <Card title="🗺️ Your Learning Path">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              {dashboardData?.next_learning_path.map((topic, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    padding: '8px 16px', 
                    backgroundColor: index === 0 ? '#1890ff' : '#f5f5f5',
                    borderRadius: 16,
                    color: index === 0 ? '#fff' : '#666'
                  }}>
                    {topic}
                  </div>
                  {index < dashboardData.next_learning_path.length - 1 && (
                    <ArrowRightOutlined style={{ margin: '0 8px', color: '#1890ff' }} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Certificate */}
        <Col xs={24}>
          <Card title="📜 Certificate">
            {dashboardData?.certificate_eligible ? (
              <div style={{ textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <Paragraph style={{ marginTop: 16 }}>
                  You are eligible for a certificate!
                </Paragraph>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={downloadCertificate}
                  loading={certificateLoading}
                >
                  Download Certificate
                </Button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Paragraph>
                  Complete 80% of labs with 75% average score to earn your certificate.
                </Paragraph>
                <Progress 
                  percent={dashboardData?.progress_percentage} 
                  status="active"
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LearningDashboard;