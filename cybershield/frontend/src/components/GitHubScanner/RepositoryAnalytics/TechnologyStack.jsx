import { motion } from "framer-motion";
import {
  FaServer,
  FaGlobe,
  FaDatabase,
  FaCode,
  FaLayerGroup,
  FaNetworkWired,
  FaCloud,
  FaMobileAlt,
  FaCubes,
  FaLock,
  FaShieldAlt,
  FaPlayCircle,
  FaRocket,
  FaMicrochip,
  FaAws,
  FaMicrosoft,
  FaCode as FaCodeIcon,
  FaFlask,
} from "react-icons/fa";
import {
  SiDocker,
  SiGithubactions,
  SiMongodb,
  SiExpress,
  SiNginx,
  SiKubernetes,
  SiJenkins,
  SiGitlab,
  SiGooglecloud,
  SiRedis,
  SiPostgresql,
  SiMysql,
  SiReact,
  SiVuedotjs,
  SiAngular,
  SiNextdotjs,
  SiNodedotjs,
  SiPython,
  SiGo,
  SiRust,
  SiDotnet,
  SiTensorflow,
  SiPytorch,
  SiTerraform,
  SiAnsible,
  SiPrometheus,
  SiGrafana,
  SiElasticsearch,
  SiApachekafka,
  SiRabbitmq,
  SiGraphql,
  SiApachemaven,
  SiGradle,
  SiWebpack,
  SiVite,
  SiEsbuild,
  SiTypescript,
  SiJest,
  SiCypress,
  SiVitest,
} from "react-icons/si";
import "./Analytics.css";

const CATEGORY_ICONS = {
  Backend: FaServer,
  Frontend: FaGlobe,
  Database: FaDatabase,
  DevOps: FaNetworkWired,
  Language: FaCode,
  Framework: FaLayerGroup,
  Cloud: FaCloud,
  Mobile: FaMobileAlt,
  Library: FaCubes,
  Security: FaLock,
  Testing: FaShieldAlt,
  "CI/CD": FaPlayCircle,
  Infrastructure: FaMicrochip,
  Monitoring: FaRocket,
};

const TECH_ICONS = {
  Docker: SiDocker,
  "Docker Compose": SiDocker,
  "GitHub Actions": SiGithubactions,
  MongoDB: SiMongodb,
  Express: SiExpress,
  ExpressJS: SiExpress,
  Nginx: SiNginx,
  Kubernetes: SiKubernetes,
  Jenkins: SiJenkins,
  GitLab: SiGitlab,
  "GitLab CI": SiGitlab,
  AWS: FaAws,
  "Google Cloud": SiGooglecloud,
  Azure: FaMicrosoft,
  Redis: SiRedis,
  PostgreSQL: SiPostgresql,
  MySQL: SiMysql,
  React: SiReact,
  Vue: SiVuedotjs,
  VueJS: SiVuedotjs,
  Angular: SiAngular,
  NextJS: SiNextdotjs,
  "Next.js": SiNextdotjs,
  NodeJS: SiNodedotjs,
  "Node.js": SiNodedotjs,
  Python: SiPython,
  Go: SiGo,
  Golang: SiGo,
  Rust: SiRust,
  Java: FaCodeIcon,
  "C#": SiDotnet,
  ".NET": SiDotnet,
  TensorFlow: SiTensorflow,
  PyTorch: SiPytorch,
  Terraform: SiTerraform,
  Ansible: SiAnsible,
  Prometheus: SiPrometheus,
  Grafana: SiGrafana,
  Elasticsearch: SiElasticsearch,
  Kafka: SiApachekafka,
  RabbitMQ: SiRabbitmq,
  GraphQL: SiGraphql,
  "Apache Kafka": SiApachekafka,
  "Apache Zookeeper": FaServer,
  Maven: SiApachemaven,
  Gradle: SiGradle,
  Webpack: SiWebpack,
  Vite: SiVite,
  esbuild: SiEsbuild,
  TypeScript: SiTypescript,
  Jest: SiJest,
  Cypress: SiCypress,
  Playwright: FaFlask,
  Vitest: SiVitest,
};

const TECH_COLORS = {
  Docker: "#2496ed",
  "Docker Compose": "#2496ed",
  "GitHub Actions": "#2088ff",
  MongoDB: "#47a248",
  Express: "#000000",
  ExpressJS: "#000000",
  Nginx: "#009639",
  Kubernetes: "#326ce5",
  Jenkins: "#d24939",
  GitLab: "#fc6d26",
  "GitLab CI": "#fc6d26",
  AWS: "#ff9900",
  "Google Cloud": "#4285f4",
  Azure: "#0078d4",
  Redis: "#dc382d",
  PostgreSQL: "#336791",
  MySQL: "#4479a1",
  React: "#61dafb",
  Vue: "#42b883",
  VueJS: "#42b883",
  Angular: "#dd0031",
  NextJS: "#000000",
  "Next.js": "#000000",
  NodeJS: "#339933",
  "Node.js": "#339933",
  Python: "#3776ab",
  Go: "#00add8",
  Golang: "#00add8",
  Rust: "#dea584",
  Java: "#f89820",
  "C#": "#512bd4",
  ".NET": "#512bd4",
  TensorFlow: "#ff6f00",
  PyTorch: "#ee4c2c",
  Terraform: "#7b42bc",
  Ansible: "#ee0000",
  Prometheus: "#e6522c",
  Grafana: "#f46800",
  Elasticsearch: "#005571",
  Kafka: "#231f20",
  RabbitMQ: "#ff6600",
  GraphQL: "#e10098",
  "Apache Kafka": "#231f20",
  "Apache Zookeeper": "#231f20",
  Maven: "#c71a36",
  Gradle: "#02303a",
  Webpack: "#8dd6f9",
  Vite: "#646cff",
  esbuild: "#f3e5d8",
  TypeScript: "#3178c6",
  Jest: "#c21325",
  Cypress: "#17202c",
  Playwright: "#2ead33",
  Vitest: "#6e9b00",
};

const CATEGORY_ORDER = [
  "Backend",
  "Frontend",
  "Language",
  "Framework",
  "Database",
  "DevOps",
  "CI/CD",
  "Infrastructure",
  "Cloud",
  "Mobile",
  "Library",
  "Security",
  "Testing",
  "Monitoring",
];

function TechnologyStack({ stack }) {
  if (!stack || Object.keys(stack).length === 0) return null;

  const orderedCategories = CATEGORY_ORDER.filter((cat) => stack[cat] && stack[cat].length > 0);
  const remainingCategories = Object.keys(stack).filter((cat) => !CATEGORY_ORDER.includes(cat));
  const categories = [...orderedCategories, ...remainingCategories].filter(
    (cat) => stack[cat] && stack[cat].length > 0
  );

  return (
    <motion.div
      className="dashboardCard technology-stack-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="dashboardCardTitle">Technology Stack</h3>
      <div className="tech-categories">
        {categories.map((category, catIndex) => {
          const items = stack[category] || [];
          const CategoryIcon = CATEGORY_ICONS[category] || FaLayerGroup;
          return (
            <motion.div
              key={category}
              className="tech-category"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + catIndex * 0.08 }}
            >
              <div className="tech-category-header">
                <CategoryIcon className="tech-category-icon" />
                <h4 className="tech-category-title">{category}</h4>
                <span className="tech-category-count">{items.length}</span>
              </div>
              <div className="tech-chips">
                {items.map((item, itemIndex) => {
                  const TechIcon = TECH_ICONS[item];
                  const color = TECH_COLORS[item] || "#6366f1";
                  return (
                    <motion.span
                      key={`${category}-${itemIndex}`}
                      className="tech-chip"
                      style={{ borderColor: `${color}40` }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.2 + catIndex * 0.08 + itemIndex * 0.03 }}
                    >
                      {TechIcon && <TechIcon className="tech-chip-icon" style={{ color }} />}
                      <span>{item}</span>
                    </motion.span>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default TechnologyStack;