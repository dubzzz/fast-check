# Migration 1.x to 2.x

Migration from version `1.x` to `2.x` of fast-check should be pretty straightforward as no major breaking changes have been released.
Nonetheless as some of the changes may break existing code, a major bump has been required.

The following documentation describes what has to be updated and how in case you encounter some troubles during this migration.

Most of the time the migration will just require to run one of the following commands:

```bash
# For yarn users
yarn add fast-check@^2.0.0 --dev
# For npm users
npm install fast-check@2.0.0 --save-dev
```

## Replace `with_deleted_keys` in `fc.record` by `withDeletedKeys`

The kebab-case attribute `with_deleted_keys` has been removed. You should now use its camel-case version `withDeletedKeys`.

```diff
   fc.record(
     {
       first_name: fc.string(),
       last_name: fc.string(),
       age: fc.nat(),
     }, {
---    with_deleted_keys: true
+++    withDeletedKeys: true
     })
```

Associated Pull Requests: [#749](https://github.com/dubzzz/fast-check/pull/749)

## Update explicit typing for `fc.constantFrom`

In the previous major, `fc.constantFrom` was not typing tuples properly and refused to compile some calls.

As an example, the following was not compiling:

```ts
fc.constantFrom(false, null, undefined, 0);
```

It required the user to explicitely specify the type:

```ts
/// In version 1.x.x
fc.constantFrom<boolean | null | number>(false, null, 0);

/// In version 2.x.x
fc.constantFrom(false, null, 0);
// or with an explicit typing
fc.constantFrom<(boolean | null | number)[]>(false, null, 0);
```

If you explicitely typed some calls, `fc.constantFrom<T>` should be updated into `fc.constantFrom` - _without any generic_ - or `fc.constantFrom<T[]>`.

Associated Pull Requests: [#747](https://github.com/dubzzz/fast-check/pull/747)

## Replace type interface `ObjectConstraints.Settings` by `ObjectConstraints`

The typing for the constraints that can be applied to configure `fc.object` and `fc.anything` has been moved: `ObjectConstraints.Settings` is now `ObjectConstraints`.

All the static methods that were previously defined onto `ObjectConstraints` are now fully internal.

Associated Pull Requests: [#755](https://github.com/dubzzz/fast-check/pull/755)

## No more browser build

In the previous major, fast-check was building a specific bundle for browsers. This bundle was easily _fetch-able_ from CDNs like unpkg.

Example of bundled version of fast-check: https://unpkg.com/browse/fast-check@1.22.1/lib/bundle.js

In version 2.x.x, we removed the build for browser bundles. Some CDNs will not be able to serve fast-check properly due to this change.

### With a CDN

If the browsers you are targeting are compatible with esm-modules, you can import fast-check from pika as follow:

```html
<script type="module">
  import fc from 'https://cdn.skypack.dev/fast-check';
  // code...
</script>
```

### Locally build the bundled version

Alternatively, you can easily build the `lib/bundle.js` file that was provided by fast-check by running the following command-line - _here we assume that you declared fast-check as a dependency of your project in the `package.json`_.

```bash
npx -p browserify browserify node_modules/fast-check/lib/fast-check.js --s fastcheck > node_modules/fast-check/lib/bundle.js
```

You can also produce a minified version of the bundle by running:

```bash
npx -p browserify -p terser -c "browserify node_modules/fast-check/lib/fast-check.js --s fastcheck | terser -c -m > node_modules/fast-check/lib/bundle.js"
```

For support of older browsers, you may have a look to [babelify](https://github.com/babel/babelify).

Associated Pull Requests: [#756](https://github.com/dubzzz/fast-check/pull/756)

## No more support for ES versions <2017

Support for versions of ES standard below 2017 has been removed.

If you are still using - _and not transpiling towards your target_ - a version of Node or of the browser that does not support ES2017, you can either keep using fast-check 1.x.x or have a look into [babel](https://github.com/babel/babel) and related projects such as [babelify](https://github.com/babel/babelify).

Associated Pull Requests: [#748](https://github.com/dubzzz/fast-check/pull/748)

## No more support for TypeScript versions <3.2

Support for versions of TypeScript below 3.2 has been removed.

If you are still using a version of TypeScript <3.2, you should keep using the version 1.x.x of fast-check.

Associated Pull Requests: [#750](https://github.com/dubzzz/fast-check/pull/750)
