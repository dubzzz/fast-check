---
title: fast-check ❤️ docusaurus
authors: [dubzzz]
tags: [retrospective]
image: /img/blog/2023-05-16-fast-check-loves-docusaurus--social.png
---

The story of fast-check's documentation: from markdown files accessible in the repository to a proper website available at [fast-check.dev](https://fast-check.dev/).

<!--truncate-->

## Story

The concept of creating a dedicated website for the fast-check project has been on the radar since day one. In this section, we will dig into the different stages of our documentation journey, starting from the early days when fast-check was a niche project, all the way to its current state where it reaches [nearly 1 million monthly downloads on npmjs](https://www.npmjs.com/package/fast-check).

### Bring adoption

When fast-check started, gaining adoption was key and it passed by attracting early adopters to the project. These initial users were willing to embrace the project despite its unstable nature: lack of major releases, a questionable README file, and occasional broken releases. But they adopt it as fast-check already fulfilled its primary objective: make property-based testing accessible to everyone.

To bring confidence in the project, we focused on refining the appearance of the project. It involved improving the README file, ensuring stable releases, and creating a showcase site. Although seemingly insignificant, the showcase site played a vital role in inspiring confidence and attracting more early adopters in the early days.

At that time, the project was a standalone repository without any workspaces or monorepo architecture. Consequently, we built the showcase in a seperate repository:

- One repository for fast-check project itself,
- Another repository for the showcase website.

Our initial showcase site consisted of a single static page deployed as a [GitHub page](https://pages.github.com/) and relied on [Jekyll's templates](https://jekyllrb.com/docs/). Its purpose was to showcase the key features of fast-check and demonstrate a sample test written using the library.

### Keep users

After attracting early adopters, our focus shifted to retaining them. We also continued to expand our user base and aimed to introduce fast-check to a wider audience of JavaScript developers, enabling them to leverage its powerful bug-finding capabilities in their daily work.

To achieve this, we recognized the having a clear and accessible website that provided comprehensive API documentation was required. At that time, all our APIs were fully documented using [JSDoc](https://jsdoc.app/). Therefore, we looked for tools that could convert these annotations into a user-friendly website. Through experimentation, we eventually settled on [typedoc](https://typedoc.org/).

This new layer of documentation proved key in reducing the number of GitHub issues related to questions about specific APIs. With this enhanced documentation, users were empowered to independently locate the relevant APIs, promoting self-sufficiency and streamlining the support process.

Overall, these efforts enabled us to not only retain existing users but also attract new users who sought reliable and well-documented tools for their production needs.

### Grow adoption again

As users began to embrace the fast-check, they shared it within their communities and expressed their desire for new features. Interestingly, some of these features were already implemented or just felt outside the project's scope. However, there was no convenient way for users to access this information.

What was lacking was a real documentation layer. Given the success of the previous layers and the absence of a proper monorepo structure at that time, we opted to start with a set of dedicated markdown pages. These markdown pages served as the foundation for our initial standalone documentation.

This approach allowed us to address the growing needs of our user base and provided a resource where users could find valuable information about the framework, including the state of existing features and ways to use them. By establishing a dedicated documentation layer, we aimed to enhance user experience, facilitate feature discovery, and foster better communication between the project and its users.

### Limitations

While we preserved the setup for several years, it eventually revealed certain limitations.

Firstly, maintaining our showcase website became challenging. It was rarely kept up-to-date and suffered from dead links being spotted by users from time to time.

While the markdown version of our documentation served its purpose, it lacked the desired flexibility. It fell short in comparison to modern documentation standards, lacking key features such as easy browsing, searchability, customizable styling options, and the ability to integrate analytics.

Moreover, users often felt overwhelmed and confused by the presence of three separate documentation sources, each accessible through different URLs. This fragmentation further complicated their journey in finding the information they needed.

Recognizing these limitations, it became clear that a more cohesive and robust documentation solution was necessary.

## New version

While attracting and retaining users remains crucial, this iteration primarily attempted to enhance the accessibility and easesimplicity to maintain our documentation. Indeed, an often overlooked aspect of open-source projects is the significant maintenance cost associated with documentation. Simplifying the process of documenting aspects of the project is important, as it directly impacts the project's overall success and growth.

### Inspirations

Before diving into specific solutions, we first examined the current state-of-the-art of documentation practices. Personally, I was amazed when I came across the documentation for [Svelte](https://svelte.dev/tutorial/basics) and had the opportunity to interact with it. The interactive and hands-on nature of the tutorial left a lasting impression. Inspired by this experience, I created a basic adaptation of a hands-on tutorial using markdown pages only.

Documentations started incorporating interactive elements, enabling users to experiment and code within the browser itself. This approach revolutionized the learning experience, empowering users to engage with the technology more effectively without needing to go outside of the browser. The new documentation of [react](https://react.dev/learn) is a great example of such switch.

So we needed to make something!

### Docusaurus

After several months wondering when to take the time to transition to a proper documentation system, I finally began a proof of concept based on [Docusaurus](https://docusaurus.io/). The tool has been around for some years and is used by major projects like [Jest](https://jestjs.io/), [Redux](https://redux.js.org/), and others. I wanted to join the movement too.

What first attracted me to Docusaurus was:

- Every page can be a simple markdown file,
- But you can switch to complex React code whenever you want spicy logics.

But behind the scene what makes it so powerful is rather how simple it is to use for documentations or blogs. It provides so many must-have things out-of-the-box:

- Sitemaps generation,
- Sidenav and table of contents generation,
- Dead links detection,
- Compilation of the site for GitHub pages,
- Routing…

Each comes with its set of complexities so having them preconfigured significantly simplifies the process of launching a documentation website. With Docusaurus, there is no need to concern yourself with routing, markdown reading, or any other common choice. They have been thoughtfully made for you, while still providing ample flexibility to tailor the documentation to your specific needs.

And among all the exciting capabilities, I'm happy to be able to offer live playgrounds directly in the documentation. It makes us able to offer tutorials offering users with the ability to directly try the framework without leaving the documentation. You can experiment this new experience on [this tutorial about detection of race conditions](/docs/tutorials/detect-race-conditions/).

### Recommendations

Directly start with Docusaurus. Don't bother with homemade solutions!
