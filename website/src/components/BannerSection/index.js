import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function BannerSection(props) {
  return (
    <section className={props.color === 'blue' ? styles.blueBanner : styles.whiteBanner}>
      <div className={clsx('container', styles.subsectionContainer)}>{props.children}</div>
    </section>
  );
}
