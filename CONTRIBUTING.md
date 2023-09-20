# Contributing to Headless FE

Before you start writing code, please familiarize yourself with this CONTRIBUTING.md document to ensure the codebase maintains its quality and consistency.

## Code style guidelines

### Import statements

- Group your import statements as follows: external modules, aliases (`@`), and relative paths.
- Sort imports alphabetically within each group.

### Type definitions

- Use descriptive names for your types and interfaces.
- Group and sort the type imports separately from component imports.

### Components

#### Component structure

In this codebase, we follow a strict structure for organizing files related to React components to make the project more maintainable and understandable. Here's how you should structure files for individual components:

#### Directory structure

For each component, create a dedicated directory with the name of the component. Inside this directory, maintain separate files for:

- The component logic (a `.tsx` file)
- The styles associated with the component (a `.module.css` file)
- Type definitions (a `.ts` file if necessary)

#### Guidelines

- **Component file**:

  - Name the main file `index.tsx` for cleaner import syntax.
  - Document the props the component accepts using TypeScript and JSDoc comments to provide clear guidance on how the component should be used.

- **Styles file**:

  - Use CSS Modules to scope styles to the component.
  - These files should always be called `styles.module.css`.
  - Organize your styles logically (e.g., grouped by functionality or chronologically as they appear in the markup).

- **Types file**:
  - If a component has complex types or interfaces, extract them into a separate file named `types.ts`.
  - Document each type/interface clearly, explaining what it represents and where/how it should be used.

### Dynamic imports

- When utilizing dynamic imports, handle the loading state gracefully by displaying a skeleton component.
- Match the skeleton height reasonably close to the expected height of the loaded component to provide a smoother user experience and reduce layout shift.

### JSDoc comments

- Use JSDoc comments to explain the purpose and usage of constants, functions, or components.
- Clearly document any important decisions or considerations to maintain clarity for other developers.

### Function components

- Leverage destructuring to access properties of the props object.

### Mapping components

- When mapping over arrays to render components, use meaningful names for variables.
- Ensure that components receive the necessary props, potentially passed dynamically based on the component's requirements.

### Error handling

- Where appropriate, include error handling to manage potential issues gracefully and maintain a good user experience.

### Accessibility

- Keep accessibility in mind, ensuring components are navigable and usable with a keyboard alone, providing alt text for images, and ensuring that colours meet WCAG 2.1 AA contrast requirements at minimum. Though not part of a current standard, in the future this is likely to be updated to the [APCA colour contrast standard](https://ruitina.com/apca-accessible-colour-contrast/). Where possible, contrast should be meeting this standard already (while not negating WCAG 2.1 AA contrast ratios for the sake of search performance).

## Code formatting and linting

To maintain a consistent coding style and avoid common mistakes, we use ESLint. Here is how you can ensure your code meets the project’s standards:

### ESLint

We use ESLint to analyze the code for potential errors and to enforce a consistent style.

- **Installation**: Ensure you have ESLint installed in your development environment. Refer to the [ESLint documentation](https://eslint.org/docs/user-guide/getting-started) for installation guidelines.

## Pull requests

- Ensure your code follows the established style guide.
- Include meaningful commit messages and PR descriptions to help reviewers understand your changes.
- Before submitting, test your changes locally to ensure they work correctly.

## Issues

- When opening new issues, include a detailed description to help others understand the problem.
- Label issues appropriately, using existing labels where possible.

## Setting up your development environment

- To set up your development environment, follow the steps in the [README.md](README.md) file.
