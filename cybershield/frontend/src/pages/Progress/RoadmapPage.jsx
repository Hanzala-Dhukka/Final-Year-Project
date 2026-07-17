import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Card, List, Tag, Button, Spin, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import API from '../api/api';

const { Title, Text, Paragraph } = Typography;

const RoadmapPage = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('user_id') || 'anonymous';

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/roadmap/${userId}`);
      setRoadmap(response.data.data);
    } catch (error) {
      console.error('Error loading roadmap:', error);
      // Set default data for demo
      setRoadmap({
        user_id: userId,
        completed_topics: ["SQL Injection", "XSS"],
        weak_topics: ["CSRF", "SSRF"],
        recommended_path: ["CSRF", "Authentication", "SSRF", "OAuth", "JWT Security"],
        next_topic: "CSRF",
        estimated_completion: "10 weeks"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
        <Title level={3} style={{ marginTop: 16 }}>Loading Your Learning Path...</Title>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/learning-dashboard" style={{ color: '#1890ff' }}>
          &larr; Back to Learning Dashboard
        </Link>
        <Title level={2} style={{ marginTop: 16 }}>
          🗺️ Your Learning Roadmap
        </Title>
      </div>

      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>Completed Topics</Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {roadmap?.completed_topics.map((topic, index) => (
              <Tag 
                key={index} 
                color="green" 
                icon={<CheckCircleOutlined />}
                style={{ fontSize: 14, padding: '4px 12px' }}
              >
                {topic}
              </Tag>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Title level={4}>Weak Areas (Need Improvement)</Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {roadmap?.weak_topics.map((topic, index) => (
              <Tag 
                key={index} 
                color="orange" 
                icon={<ClockCircleOutlined />}
                style={{ fontSize: 14, padding: '4px 12px' }}
              >
                {topic}
              </Tag>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Title level={4}>Recommended Learning Path</Title>
          <Paragraph>
            Estimated completion: <strong>{roadmap?.estimated_completion}</strong>
          </Paragraph>
          
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            {roadmap?.recommended_path.map((topic, index) => (
              <React.Fragment key={index}>
                <div style={{ 
                  padding: '12px 24px', 
                  backgroundColor: index === 0 ? '#1890ff' : '#fafafa',
                  border: index === 0 ? 'none' : '1px solid #d9d9d9',
                  borderRadius: 8,
                  textAlign: 'center',
                  minWidth: 150,
                  color: index === 0 ? '#fff' : '#666'
                }}>
                  <div style={{ fontWeight: 'bold' }}>{topic}</div>
                  {index === 0 && <div style={{ fontSize: 12 }}>Next</div>}
                </div>
                {index < roadmap.recommended_path.length - 1 && (
                  <ArrowRightOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Button type="primary" size="large">
            Start Next Topic: {roadmap?.next_topic}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default RoadmapPage;