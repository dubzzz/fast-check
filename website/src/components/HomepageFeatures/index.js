import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Testing made easy',
    Svg: require('@site/static/img/bug.svg').default,
    description: (
      <>
        Finding bugs has never been so easy! From classical edge cases to very complex combinations of inputs,
        fast-check will be able to detect any class of bug.
      </>
    ),
  },
  {
    title: 'Test runner agnostic',
    Svg: require('@site/static/img/checkbox.svg').default,
    description: <>fast-check can be used within any test runner without any specific integration needed.</>,
  },
  {
    title: 'Next level testing',
    Svg: require('@site/static/img/syringe.svg').default,
    description: (
      <>
        Race conditions, prototype poisoning… Embrace the full power of fast-check and let it help you into finding race
        conditions or zero days.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" width={144} height={144} loading="lazy" />
      </div>
      <div className="text--center padding-horiz--md">
        <p className={styles.featureName}>{title}</p>
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
