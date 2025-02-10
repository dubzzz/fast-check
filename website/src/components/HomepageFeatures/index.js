import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import CodeBlock from '@theme/CodeBlock';

const FeatureList = [
  {
    title: 'Testing made easy',
    Svg: require('@site/static/img/bug.svg').default,
    description: (
      <>
        Finding bugs has never been so easy! From classical edge cases to very complex combinations of inputs,
        fast-check is able to detect any class of bug.
      </>
    ),
  },
  {
    title: 'Test runner agnostic',
    Svg: require('@site/static/img/checkbox.svg').default,
    description: (
      <>
        fast-check can be used within any test runner without any specific integration needed. It works well with{' '}
        <a href="https://jestjs.io/" target="_blank" rel="noopener">
          Jest
        </a>
        ,{' '}
        <a href="https://mochajs.org/" target="_blank" rel="noopener">
          Mocha
        </a>
        ,{' '}
        <a href="https://vitest.dev/" target="_blank" rel="noopener">
          Vitest
        </a>
        , and others.
      </>
    ),
  },
  {
    title: 'Next level testing',
    Svg: require('@site/static/img/syringe.svg').default,
    description: (
      <>
        Let fuzzing and generative testing help you into uncovering the most challenging bugs: race conditions,
        prototype poisoning, zero-days…
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIllustration}>
        <Svg
          className={styles.featureSvg}
          title={`Illustration for ${title}`}
          role="img"
          width={144}
          height={144}
          loading="lazy"
        />
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
    <div className="container">
      <section className={styles.features}>
        <div className={clsx('container', styles.allFeatureCards)}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        <div className={styles.codeBlock}>
          <CodeBlock language="js">
            {`test('validates substring presence in concatenated string', () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
      expect(isSubstring(\`\${a}\${b}\${c}\`, b)).toBe(true);
    })
  );
});`}
          </CodeBlock>
        </div>
      </section>
    </div>
  );
}
