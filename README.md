# Eject

This package is written to eject dependencies from your project. It will copy all the files and folders to an `ejected` folder and remove it from node_modules. It will automatically update the package.json file an link the dependencies to the ejected folder.


## Usage

```bash
npx eject <dependency>
```

## Dev Usage

1. Clone the repository
2. Run `npm install`
2. Run `npm build`
3. Run `npm link`

Now you can use `npx eject <dependency>` to eject the dependency from any other project.
