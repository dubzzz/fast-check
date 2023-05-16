---
title: fast-check ❤️ docusaurus
authors: [dubzzz]
tags: [retrospective]
image: ./social.png
---

The story of fast-check's documentation: from markdown files accessible on the repository to a proper website available at [fast-check.dev](https://fast-check.dev/).

<!--truncate-->

## Story

The idea to bootstrap a dedicated website for the project fast-check is not new. Let's dig into the various steps of our doucmentation: from the early days when fast-check was a niche project until now with a project reaching [close to 1 million monthly downloads according to npmjs](https://www.npmjs.com/package/fast-check).

### Bring adoption

When the project started bringing adoption was key. First users of fast-check were early-adopters of the project. At that time, the project was far from stable: no major version released, a dubious README file, releases broken from time to time… But it already fulfilled most of his targets: making property based testing simple and accessible to everyone.

So in order to bring confidence in the project, we worked onto polishing its external shape. It passed by shaping a proper README file, stopping to break releases and providing a showcase site. While it can seems stupid, the showcase site was able to give some confidence into the project and bring more early adopters to start using it.

At that time, the project was alone in the repository and I had neither tooling ready nor the knowledge to setup workspaces to build it along a website for it. So everything started with two distinct repositories:

- one responsible to hold the project itself,
- another for the showcase website.

Our initial showcase site was restricted to a single static page deployed as a [GitHub page](https://pages.github.com/) and based on [Jekyll's templates](https://jekyllrb.com/docs/). It was nothing more than a showcase listing key characteristics of fast-check and showing one example of test written with it.

### Keep users

After the first early adopters, we needed to preserve users and continue growing our set of users. We wanted to make fast-check known to many JavaScript developers to help them in their everyday job by providing them with tools able to help them into finding bugs.

But to keep users, we needed to have a clear and accessible website with the documentation of our APIs. At that time, all of them were fully documentated via [JSDoc](https://jsdoc.app/) so we looked into tools able to convert these annotations into a website. We experimented several solutions and landed onto [typedoc](https://typedoc.org/).

This new layer of documentation helped us into drastically dropping the number of GitHub issues related to questions asking if there was an API for such or such operation. With that new layer, users were able to autonomously find the relevant APIs.

### Grow adoption again

But as users started to like the framework, they started to spread it in their communities and to ask for new features. Among these new features some started to be already there and more and more feature requests ended to be either already implemented or out-of-scope. But there was no easy way for users to find such information.

What was missing was a real documentation layer. As everything was working for the two previous layers and because we were still in a non-workspaces world, we decided to start with a few set of markdown pages. These markdown pages allowed us to come up with a first real documentation fully outside of the code.

### Limitations

While we kept it many years, the approach had several limitations.

Our showcase website was hard to maintain and we often forgot about it. We got pinged many times by users because of dead links in this showcase.

Our markdown version was great but not as flexible as we wanted. We were not able to keep it on-par with other modern documentations. It lacks of many things including:

- Not easily browseable,
- Not easily searchable,
- No way to apply custom style to it,
- No way to plug analytics.

Finally the users were a bit lost into all these documentations. There was not one but three of them, each available at different URLs.

## New version

While bringing adoptions and preserving users is still key to the project, this new iteration mostly focused on making the documentation easily browseable and above all easy to maintain. The maintainance cost of a documentation is probably one of the less known part of open-source but it's damn important and the easier it is to document things the better for the project.

### Inspirations

Before we jumped onto one solution or another, we started to look at the current state of the art of documentations. I personally was astonish by [svelte's one](https://svelte.dev/tutorial/basics) when I played with it for the first time. The hand's on part was mind blown. At that time, I built a rather dummy adaptation of a hand's on tutorial as a markdown page.

Then came documentations of [react](https://react.dev/learn) and many others. They more or less started to offer in documentation hand's on where the users can play directly without living the browser.

### Docusaurus

After several months wondering when I would finally take the time to migrate to a proper documentation system, I finally started to POC something based on [Docusaurus](https://docusaurus.io/). The tool being there for some years now and used by many huge projects including [Jest](https://jestjs.io/), [Redux](https://redux.js.org/) and others, I wanted to be part of them too.

I really liked the approach proposed by it:

- Every page can be a simple markdown file,
- But you can switch to complex React code whenever you want spicy logics.

I also enjoyed the fact, that many things come out-of-the-box for you:

- Generating sitemaps,
- Generating sidenav, table of contents…,
- Checking for dead links,
- Compiling the site for GitHub pages,
- Handling routing.

While they might sound simple, they all come with a price and having them setup for you make launching a documentation website way simpler. These out-of-the-box features are ceratinly the ones that make the project so incredible when starting a documentation as you don't have to bother about routing, reading from markdown and compiling anything: all choices have been made for you while still giving you many level of freedom.

And among all the crazy capabilities, I'm happy to finally be able to offer live playgrounds directly in my documentation! It makes me able to offer tutorials asking the particiapations of users like [this one on race conditions](/tutorials/detect-race-conditions/).

### Recommendations

Directly start with Docusaurus. Don't bother with homemade solutions!
