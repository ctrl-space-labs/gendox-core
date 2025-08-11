import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Create custom AI Agents',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
          Gendox allows you to create personalized AI Agents tailored to your data.
          Set up agents that are trained on your own knowledge, ready to assist you.
      </>
    ),
  },
  {
    title: 'Easily import private data',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
          Upload and manage your private data effortlessly.
          Gendox ensures your data is securely stored and ready for AI training.
      </>
    ),
  },
  {
    title: 'Add AI Agents to any website',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
          Easily integrate Gendox AI Agents into your platform using the Gendox Web Widget or the WP plugin.
          Enhance your website's functionality with intelligent, custom AI solutions, ready to assist your users.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
